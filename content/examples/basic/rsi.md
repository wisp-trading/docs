---
sidebar_position: 1
description: "Simple RSI momentum strategy. Buy on oversold (RSI<30), sell on overbought (RSI>70). Event-driven with Start/run pattern."
keywords: ["RSI strategy", "momentum trading", "oversold overbought", "Wisp example"]
---

# Simple RSI Strategy

Classic momentum strategy using RSI oversold/overbought levels with Wisp's event-driven architecture.

## Strategy Overview

- **Type**: Momentum
- **Indicators**: RSI (14 periods)
- **Risk Level**: Medium
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

type RSIStrategy struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewRSI(w wisp.Wisp) *RSIStrategy {
	return &RSIStrategy{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *RSIStrategy) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *RSIStrategy) run(ctx context.Context) {
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

			// Buy oversold
			if rsi.LessThan(decimal.NewFromInt(30)) {
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC", "RSI oversold: %.2f", rsi)
			}

			// Sell overbought
			if rsi.GreaterThan(decimal.NewFromInt(70)) {
				signal := s.w.Spot().Signal(s.name).
					SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC", "RSI overbought: %.2f", rsi)
			}
		}
	}
}

func (s *RSIStrategy) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *RSIStrategy) GetName() strategy.StrategyName { return s.name }
func (s *RSIStrategy) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *RSIStrategy) LatestStatus() strategy.StrategyStatus { /* implementation */ return strategy.StrategyStatus{} }
func (s *RSIStrategy) StatusLog() []strategy.StrategyStatus { /* implementation */ return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Check RSI**: Get the 14-period RSI for the pair
4. **Oversold signal**: When RSI < 30, emit buy signal
5. **Overbought signal**: When RSI > 70, emit sell signal
6. **Emit**: Signals are pushed asynchronously via `wisp.Emit()`

## Key Concepts

- **RSI < 30**: Asset is oversold, potential reversal up
- **RSI > 70**: Asset is overbought, potential reversal down
- **Event-driven**: Strategy owns its execution loop via `run()`
- **Fixed quantity**: Always trades 0.1 BTC
- **Async emission**: Signals are emitted immediately, not returned

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Moderate trade frequency
- Works best in ranging markets
- May whipsaw in strong trends

## Improvements

Consider adding:
- Trend filter (only buy in uptrend)
- Stop loss protection
- Multiple timeframe confirmation
- Dynamic position sizing

## Related Strategies

- [Multi-Indicator Confirmation](../intermediate/multi-indicator) - Adds more signals
- [ATR Risk Management](../intermediate/atr-risk) - Adds dynamic stops
