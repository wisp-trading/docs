---
sidebar_position: 1
description: "Multi-indicator confirmation strategy. Require 3 of 4 indicators to agree before trading. Consensus approach reduces false signals."
keywords: ["multi-indicator", "confirmation", "consensus", "momentum", "Wisp"]
---

# Multi-Indicator Confirmation

Require multiple indicators to agree before trading. Reduces false signals through consensus voting.

## Strategy Overview

- **Type**: Technical / Momentum
- **Indicators**: RSI, Stochastic, Bollinger Bands, MACD
- **Risk Level**: Low
- **Assets**: Single asset (BTC)
- **Pattern**: Start/run with ticker

## Complete Code

```go
package main

import (
	"context"
	"time"
	"github.com/wisp-trading/sdk/pkg/types/connector"
	"github.com/wisp-trading/sdk/pkg/types/wisp"
	"github.com/wisp-trading/sdk/pkg/types/strategy"
	"github.com/shopspring/decimal"
)

type MultiConfirmation struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewMultiConfirmation(w wisp.Wisp) *MultiConfirmation {
	return &MultiConfirmation{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *MultiConfirmation) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *MultiConfirmation) run(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	btc := s.w.Asset("BTC")
	usdt := s.w.Asset("USDT")
	pair := s.w.Pair(btc, usdt)

	// Watch the pair on our exchange
	s.w.Spot().WatchPair(connector.Binance, pair)

	for {
		select {
		case <-s.stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Analyze market and emit signals
			rsi := s.w.Indicators().RSI(pair, 14)
			stoch := s.w.Indicators().Stochastic(pair, 14, 3)
			bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)
			macd := s.w.Indicators().MACD(pair, 12, 26, 9)
			price := s.w.Spot().Price(pair)

			// Count bullish signals
			bullishSignals := 0
			var reasons []string

			if rsi.LessThan(decimal.NewFromInt(30)) {
				bullishSignals++
				reasons = append(reasons, "RSI oversold")
			}
			if stoch.K.LessThan(decimal.NewFromInt(20)) {
				bullishSignals++
				reasons = append(reasons, "Stoch oversold")
			}
			if price.LessThan(bb.Lower) {
				bullishSignals++
				reasons = append(reasons, "Price < BB.Lower")
			}
			if macd.MACD.GreaterThan(macd.Signal) {
				bullishSignals++
				reasons = append(reasons, "MACD > Signal")
			}

			// Require at least 3 of 4 indicators to agree
			if bullishSignals >= 3 {
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"%d/4 indicators confirm buy: %v (RSI=%.2f, Stoch.K=%.2f, Price=%.2f < BB.Lower=%.2f, MACD=%.2f > Signal=%.2f)",
					bullishSignals, reasons, rsi, stoch.K, price, bb.Lower, macd.MACD, macd.Signal)
			}

			// Count bearish signals for exits
			bearishSignals := 0

			if rsi.GreaterThan(decimal.NewFromInt(70)) {
				bearishSignals++
			}
			if stoch.K.GreaterThan(decimal.NewFromInt(80)) {
				bearishSignals++
			}
			if price.GreaterThan(bb.Upper) {
				bearishSignals++
			}
			if macd.MACD.LessThan(macd.Signal) {
				bearishSignals++
			}

			// Sell signal with 3/4 confirmation
			if bearishSignals >= 3 {
				signal := s.w.Spot().Signal(s.name).
					SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"%d/4 indicators confirm sell (RSI=%.2f, Stoch.K=%.2f, Price=%.2f > BB.Upper=%.2f, MACD=%.2f < Signal=%.2f)",
					bearishSignals, rsi, stoch.K, price, bb.Upper, macd.MACD, macd.Signal)
			}
		}
	}
}

func (s *MultiConfirmation) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *MultiConfirmation) GetName() strategy.StrategyName { return s.name }
func (s *MultiConfirmation) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *MultiConfirmation) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *MultiConfirmation) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Collect Signals**: Get RSI, Stochastic, Bollinger Bands, and MACD
4. **Count Bullish**:
   - RSI < 30 (oversold)
   - Stochastic K < 20 (oversold)
   - Price < BB.Lower (touching lower band)
   - MACD > Signal (positive momentum)
5. **Require 3/4 Agreement**: Need at least 3 indicators to confirm
6. **Larger Position**: 0.2 BTC (high confidence due to multiple confirmations)
7. **Emit Signals**: Push to executor when threshold reached

## Key Concepts

- **Consensus Approach**: Multiple independent indicators voting
- **Reduces False Signals**: One indicator can be wrong, but 3/4 unlikely
- **Flexible Threshold**: Easy to adjust from 2/4 (loose) to 4/4 (strict)
- **Asymmetric Risk**: Larger position size when more confident
- **Both Directions**: Track both buy (bullish) and sell (bearish) confirmations

### Indicator Combinations

Different combinations can catch different patterns:

| Combo | Meaning |
|-------|---------|
| RSI + Stoch | Momentum is exhausted |
| Price + BB | Price touched extreme |
| MACD + others | Momentum turning + other confirmations |
| All 4 | Maximum conviction (rare) |

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Low trade frequency (3/4 is a high bar)
- High win rate (multiple confirmations reduce whipsaws)
- Catches only the strongest setups
- May miss quick opportunities
- Works best in trending markets

## Improvements

Consider adding:
- **Weighted voting**: Some indicators worth more (e.g., MACD = 2x)
- **Sell timing**: More strict sell criteria (4/4) or looser (2/4)
- **Persistence**: Signals must persist for 2+ ticks before trading
- **Dynamic threshold**: Adjust from 2/4 to 4/4 based on market regime
- **Divergence detection**: Exit when indicators start disagreeing

## Related Strategies

- [MACD Momentum](macd-momentum) - Single indicator with trend filter
- [ATR Risk Management](atr-risk) - Add dynamic sizing to this strategy
- [RSI Strategy](../basic/rsi) - Single indicator baseline
