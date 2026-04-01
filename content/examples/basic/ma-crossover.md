---
sidebar_position: 2
description: "Moving average crossover trend following strategy. Golden cross (buy) and death cross (sell) with price confirmation. Wisp event-driven pattern."
keywords: ["moving average", "golden cross", "death cross", "trend following", "Wisp"]
---

# Moving Average Crossover

Golden cross / death cross trend following strategy with price confirmation.

## Strategy Overview

- **Type**: Trend Following
- **Indicators**: SMA(50), SMA(200)
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

type MACrossover struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewMACrossover(w wisp.Wisp) *MACrossover {
	return &MACrossover{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *MACrossover) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *MACrossover) run(ctx context.Context) {
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
			sma50 := s.w.Indicators().SMA(pair, 50)
			sma200 := s.w.Indicators().SMA(pair, 200)
			price := s.w.Spot().Price(pair)

			// Golden cross: 50 crosses above 200
			if sma50.GreaterThan(sma200) && price.GreaterThan(sma50) {
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"Golden cross: SMA50=%.2f > SMA200=%.2f, Price=%.2f", sma50, sma200, price)
			}

			// Death cross: 50 crosses below 200
			if sma50.LessThan(sma200) {
				signal := s.w.Spot().Signal(s.name).
					SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"Death cross: SMA50=%.2f < SMA200=%.2f", sma50, sma200)
			}
		}
	}
}

func (s *MACrossover) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *MACrossover) GetName() strategy.StrategyName { return s.name }
func (s *MACrossover) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *MACrossover) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *MACrossover) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Golden Cross**: When SMA(50) > SMA(200) and price > SMA(50), emit buy signal
4. **Death Cross**: When SMA(50) < SMA(200), emit sell signal
5. **Price confirmation**: Golden cross only triggers if price also above SMA(50)

## Key Concepts

- **Golden Cross**: Bullish signal, fast MA crosses above slow MA
- **Death Cross**: Bearish signal, fast MA crosses below slow MA
- **Price filter**: Ensures momentum in direction of signal
- **Larger position**: Uses 0.2 BTC (more confident with trend confirmation)
- **Event-driven**: Signals pushed asynchronously via `wisp.Emit()`

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Low trade frequency (few signals per year)
- Catches major trends
- Lags at trend changes (by design)
- Best in trending markets

## Improvements

Consider adding:
- Volume confirmation
- Volatility filter (avoid low-volume periods)
- Partial exits (scale out of winners)
- Additional timeframe for confirmation

## Related Strategies

- [Bollinger Mean Reversion](bollinger-bands) - Opposite approach
- [MACD Momentum](../intermediate/macd-momentum) - Uses EMAs instead
