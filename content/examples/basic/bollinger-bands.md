---
sidebar_position: 3
description: "Bollinger Bands mean reversion strategy. Buy oversold at lower band, sell overbought at upper band. Wisp event-driven pattern."
keywords: ["Bollinger Bands", "mean reversion", "trading strategy", "Wisp example"]
---

# Bollinger Bands Mean Reversion

Buy at lower band, sell at upper band - fade extremes with RSI confirmation.

## Strategy Overview

- **Type**: Mean Reversion
- **Indicators**: Bollinger Bands (20, 2.0), RSI (14)
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

type BollingerMeanReversion struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewBollingerMR(w wisp.Wisp) *BollingerMeanReversion {
	return &BollingerMeanReversion{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *BollingerMeanReversion) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *BollingerMeanReversion) run(ctx context.Context) {
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
			bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)
			price := s.w.Spot().Price(pair)
			rsi := s.w.Indicators().RSI(pair, 14)

			// Buy at lower band with RSI confirmation
			if price.LessThan(bb.Lower) && rsi.LessThan(decimal.NewFromInt(35)) {
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"Mean reversion from lower band: Price=%.2f, BB.Lower=%.2f, Target=%.2f",
					price, bb.Lower, bb.Middle)
			}

			// Sell at upper band with RSI confirmation
			if price.GreaterThan(bb.Upper) && rsi.GreaterThan(decimal.NewFromInt(65)) {
				signal := s.w.Spot().Signal(s.name).
					SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"Mean reversion from upper band: Price=%.2f, BB.Upper=%.2f, Target=%.2f",
					price, bb.Upper, bb.Middle)
			}
		}
	}
}

func (s *BollingerMeanReversion) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *BollingerMeanReversion) GetName() strategy.StrategyName { return s.name }
func (s *BollingerMeanReversion) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *BollingerMeanReversion) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *BollingerMeanReversion) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Lower Band**: When price < BB.Lower and RSI < 35, emit buy signal
4. **Upper Band**: When price > BB.Upper and RSI > 65, emit sell signal
5. **Mean Reversion**: Assumes price reverts to middle band after extremes

## Key Concepts

- **Bollinger Bands**: Measure volatility and identify extremes
- **Mean Reversion**: Assumes price returns to average
- **RSI Confirmation**: Filters false signals on band touches
- **Target Middle**: Take profit at the middle band
- **Event-driven**: Signals pushed asynchronously via `wisp.Emit()`

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Moderate trade frequency
- Works best in ranging markets
- Struggles in strong trends
- Quick wins, defined exits

## Improvements

Consider adding:
- Trend filter (avoid counter-trend trades)
- Band squeeze detection (potential breakouts)
- Dynamic take profit (not always middle)
- Stop loss at opposite band

## Related Strategies

- [RSI](rsi) - Similar momentum confirmation
- [MA Crossover](ma-crossover) - Opposite (trend following)
