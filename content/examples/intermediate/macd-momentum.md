---
sidebar_position: 2
description: "MACD momentum with trend filter strategy. Buy MACD crossovers only when price is above 200 SMA. Event-driven Start/run pattern with hourly ticks."
keywords: ["MACD strategy", "trend filter", "momentum", "crossover", "Wisp"]
---

# MACD Momentum with Trend Filter

Trade MACD crossovers only with the prevailing trend. Combines momentum indicators with trend confirmation for reduced whipsaws.

## Strategy Overview

- **Type**: Momentum
- **Indicators**: MACD (12, 26, 9), SMA(200)
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

type MACDMomentum struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewMACDMomentum(w wisp.Wisp) *MACDMomentum {
	return &MACDMomentum{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *MACDMomentum) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *MACDMomentum) run(ctx context.Context) {
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
			macd := s.w.Indicators().MACD(pair, 12, 26, 9)
			sma200 := s.w.Indicators().SMA(pair, 200)
			price := s.w.Spot().Price(pair)

			// Only trade with the trend
			inUptrend := price.GreaterThan(sma200)
			inDowntrend := price.LessThan(sma200)

			// Bullish crossover in uptrend
			if macd.MACD.GreaterThan(macd.Signal) &&
				macd.Histogram.GreaterThan(decimal.Zero) &&
				inUptrend {
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.15)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"MACD bullish crossover in uptrend: Price=%.2f > SMA200=%.2f, MACD=%.2f > Signal=%.2f",
					price, sma200, macd.MACD, macd.Signal)
			}

			// Bearish crossover in downtrend
			if macd.MACD.LessThan(macd.Signal) &&
				macd.Histogram.LessThan(decimal.Zero) &&
				inDowntrend {
				signal := s.w.Spot().Signal(s.name).
					SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.15)).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"MACD bearish crossover in downtrend: Price=%.2f < SMA200=%.2f, MACD=%.2f < Signal=%.2f",
					price, sma200, macd.MACD, macd.Signal)
			}
		}
	}
}

func (s *MACDMomentum) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *MACDMomentum) GetName() strategy.StrategyName { return s.name }
func (s *MACDMomentum) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *MACDMomentum) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *MACDMomentum) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Determine Trend**: Use 200 SMA to identify trend direction (price above = uptrend, below = downtrend)
4. **Check MACD**: Look for bullish (MACD > Signal) or bearish (MACD < Signal) crossovers
5. **Filter**: Only trade crossovers aligned with trend direction
6. **Emit**: Push signals asynchronously to avoid whipsaws in choppy markets

## Key Concepts

- **MACD Crossover**: When MACD line crosses the signal line, momentum is changing
- **Histogram**: Shows the magnitude and direction of crossover (positive/negative)
- **Trend Filter**: Using 200 SMA prevents counter-trend trades, increasing win rate
- **With-Trend Only**: Buy signals only in uptrend, sell signals only in downtrend
- **Event-driven**: Strategy owns its loop and emits signals asynchronously
- **Reduced Whipsaw**: Trend filter reduces false crossover signals

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Moderate trade frequency (roughly 1-2 trades per week)
- Better win rate than raw MACD (no counter-trend whipsaws)
- Avoids chop in ranging markets
- May miss early trend entries (lags at turning points)
- Works best in strong trending markets

## Improvements

Consider adding:
- **Histogram strength**: Only trade when histogram is significantly positive/negative
- **Volume confirmation**: Require volume on crossover bar
- **Multiple timeframes**: Confirm on daily before trading on hourly
- **Stop loss**: Place below recent swing low (use ATR for dynamic stops)
- **Partial exits**: Scale out when histogram weakens

## Related Strategies

- [Multi-Indicator Confirmation](multi-indicator) - Adds more signal agreements
- [MA Crossover](../basic/ma-crossover) - Pure moving average crossover
- [ATR Risk Management](atr-risk) - Add dynamic position sizing to this strategy
