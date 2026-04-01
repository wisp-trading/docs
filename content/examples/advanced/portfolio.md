---
sidebar_position: 1
description: "Multi-asset portfolio strategy. Trade BTC, ETH, SOL independently. Buy when oversold and in uptrend. Event-driven with different position sizes."
keywords: ["portfolio strategy", "multi-asset", "diversification", "allocation", "Wisp"]
---

# Multi-Asset Portfolio Strategy

Trade multiple assets with individual analysis and allocation. Diversify across crypto assets with tailored position sizes.

## Strategy Overview

- **Type**: Portfolio / Momentum
- **Indicators**: RSI (14), SMA(200)
- **Risk Level**: Medium
- **Assets**: Multiple (BTC, ETH, SOL)
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

type Portfolio struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewPortfolio(w wisp.Wisp) *Portfolio {
	return &Portfolio{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *Portfolio) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *Portfolio) run(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	usdt := s.w.Asset("USDT")

	// Define assets and position sizes
	assetConfig := []struct {
		symbol   string
		baseSize decimal.Decimal
	}{
		{"BTC", decimal.NewFromFloat(0.1)},
		{"ETH", decimal.NewFromFloat(1.0)},
		{"SOL", decimal.NewFromFloat(10.0)},
	}

	// Watch all pairs
	pairs := make(map[string]*strategy.Pair)
	for _, config := range assetConfig {
		asset := s.w.Asset(config.symbol)
		pair := s.w.Pair(asset, usdt)
		pairs[config.symbol] = pair
		s.w.Spot().WatchPair(connector.Binance, pair)
	}

	for {
		select {
		case <-s.stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Analyze each asset independently
			for _, config := range assetConfig {
				pair := pairs[config.symbol]

				// Get indicators
				rsi := s.w.Indicators().RSI(pair, 14)
				sma200 := s.w.Indicators().SMA(pair, 200)
				price := s.w.Spot().Price(pair)

				// Entry criteria: oversold AND in uptrend
				if rsi.LessThan(decimal.NewFromInt(30)) && price.GreaterThan(sma200) {
					signal := s.w.Spot().Signal(s.name).
						BuyMarket(pair, connector.Binance, config.baseSize).
						Build()
					s.w.Emit(signal)
					s.w.Log().Opportunity(string(s.name), config.symbol,
						"Oversold in uptrend: Price=%.2f > SMA200=%.2f, RSI=%.2f, Size=%.4f %s",
						price, sma200, rsi, config.baseSize, config.symbol)
				}

				// Exit criteria: overbought
				if rsi.GreaterThan(decimal.NewFromInt(70)) {
					signal := s.w.Spot().Signal(s.name).
						SellMarket(pair, connector.Binance, config.baseSize).
						Build()
					s.w.Emit(signal)
					s.w.Log().Opportunity(string(s.name), config.symbol,
						"Overbought, exiting: RSI=%.2f, Price=%.2f",
						rsi, price)
				}
			}
		}
	}
}

func (s *Portfolio) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *Portfolio) GetName() strategy.StrategyName { return s.name }
func (s *Portfolio) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *Portfolio) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *Portfolio) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT, ETH/USDT, SOL/USDT on Binance, ticks every hour
3. **For each asset**:
   - Get RSI (14) and SMA(200)
   - Get current price
4. **Entry Logic**: Buy when:
   - RSI < 30 (oversold)
   - **AND** Price > SMA(200) (in uptrend)
5. **Exit Logic**: Sell when:
   - RSI > 70 (overbought)
6. **Different Sizes**: Each asset has tailored position size
   - BTC: 0.1 (smaller due to price)
   - ETH: 1.0 (medium)
   - SOL: 10.0 (larger due to lower price)
7. **Emit**: Push signals asynchronously for each opportunity

## Key Concepts

- **Parallel Analysis**: Wisp manages data for all assets simultaneously
- **Independent Signals**: Each asset is analyzed separately
- **Different Allocations**: Position sizes reflect asset characteristics
  - High-price assets (BTC) = smaller quantity
  - Medium-price assets (ETH) = medium quantity
  - Low-price assets (SOL) = larger quantity
- **Same Entry Logic**: All assets use identical RSI/SMA criteria
- **Diversification**: Spreads capital across multiple assets, reducing single-asset risk

## Portfolio Allocation

Adjust position sizes based on volatility and conviction:

```go
// Conservative (lower volatility)
assetConfig := []struct{
    symbol string
    baseSize decimal.Decimal
}{
    {"BTC", decimal.NewFromFloat(0.05)},   // 50%
    {"ETH", decimal.NewFromFloat(0.5)},    // 30%
    {"SOL", decimal.NewFromFloat(5.0)},    // 20%
}

// Aggressive (higher risk tolerance)
assetConfig := []struct{
    symbol string
    baseSize decimal.Decimal
}{
    {"BTC", decimal.NewFromFloat(0.2)},    // 40%
    {"ETH", decimal.NewFromFloat(2.0)},    // 40%
    {"SOL", decimal.NewFromFloat(20.0)},   // 20%
}
```

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- More trading opportunities (3x the signals of single-asset)
- Better diversification (no concentration risk)
- Reduced portfolio volatility
- More capital required overall
- May require managing positions across multiple assets

## Portfolio Management

### Rebalancing

Add logic to maintain target allocations:

```go
// Track current position sizes
positions := s.w.Activity().Positions(connector.Binance)

// Rebalance quarterly if drift > 10%
for _, config := range assetConfig {
    currentSize := positions[config.symbol]
    targetSize := config.baseSize
    drift := currentSize.Div(targetSize).Sub(decimal.NewFromInt(1)).Abs()

    if drift.GreaterThan(decimal.NewFromFloat(0.1)) {
        // Rebalance back to target
    }
}
```

### Risk Management

Limit total exposure:

```go
// Max 0.5 BTC equivalent exposure across all assets
maxExposure := decimal.NewFromFloat(0.5)

totalBtcExposure := (btcPosition * 1.0) +
                    (ethPosition / btcPrice * ethPrice) +
                    (solPosition / btcPrice * solPrice)

if totalBtcExposure.GreaterThan(maxExposure) {
    // Reduce positions or skip new trades
}
```

## Improvements

Consider adding:
- **Dynamic allocation**: Adjust sizes based on volatility (low vol = larger)
- **Correlation filtering**: Avoid trading highly correlated assets together
- **Sector weighting**: Allocate more to undervalued sectors
- **Risk parity**: Normalize risk per asset (not just quantity)
- **Rebalancing**: Maintain target allocations over time
- **Individual stops**: ATR-based stops per asset
- **Momentum strength**: Only enter when momentum is strong

## Related Strategies

- [ATR Risk Management](../intermediate/atr-risk) - Add ATR-based stops per asset
- [Multi-Indicator Confirmation](../intermediate/multi-indicator) - Add more entry confirmations
- [Arbitrage](arbitrage) - Cross-asset relative value plays
