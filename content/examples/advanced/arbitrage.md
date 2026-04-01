---
sidebar_position: 2
description: "Cross-exchange arbitrage strategy. Find price differences across exchanges and execute simultaneous buy/sell. Market-neutral strategy with low risk."
keywords: ["arbitrage", "cross-exchange", "spread trading", "market-neutral", "Wisp"]
---

# Cross-Exchange Arbitrage

Find and exploit price differences across exchanges. Buy on low-price exchange, sell on high-price exchange simultaneously for risk-free profit.

## Strategy Overview

- **Type**: Arbitrage (market-neutral)
- **Indicators**: None (pure price-based)
- **Risk Level**: Low
- **Assets**: Single asset, multiple exchanges
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

type Arbitrage struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewArbitrage(w wisp.Wisp) *Arbitrage {
	return &Arbitrage{
		w:          w,
		name:       strategy.Arbitrage,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *Arbitrage) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *Arbitrage) run(ctx context.Context) {
	// Check for arbitrage every 1 minute (opportunities are fleeting)
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	btc := s.w.Asset("BTC")
	usdt := s.w.Asset("USDT")
	pair := s.w.Pair(btc, usdt)

	// Watch on multiple exchanges
	s.w.Spot().WatchPair(connector.Binance, pair)
	s.w.Spot().WatchPair(connector.Bybit, pair)
	s.w.Spot().WatchPair(connector.Coinbase, pair)

	for {
		select {
		case <-s.stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Get prices from all exchanges
			binancePrice := s.w.Spot().Price(pair, connector.Binance)
			bybitPrice := s.w.Spot().Price(pair, connector.Bybit)
			coinbasePrice := s.w.Spot().Price(pair, connector.Coinbase)

			// Find min and max
			prices := map[connector.ExchangeName]decimal.Decimal{
				connector.Binance:  binancePrice,
				connector.Bybit:    bybitPrice,
				connector.Coinbase: coinbasePrice,
			}

			var minPrice, maxPrice decimal.Decimal
			var minExchange, maxExchange connector.ExchangeName

			for exchange, price := range prices {
				if minPrice.IsZero() || price.LessThan(minPrice) {
					minPrice = price
					minExchange = exchange
				}
				if maxPrice.IsZero() || price.GreaterThan(maxPrice) {
					maxPrice = price
					maxExchange = exchange
				}
			}

			// Calculate spread percentage
			spread := maxPrice.Sub(minPrice).Div(minPrice).Mul(decimal.NewFromInt(100))

			// Minimum spread to cover fees + slippage (adjust based on your fee structure)
			// Typically: 0.1% buy fee + 0.1% sell fee + 0.2% slippage = 0.4% minimum
			minSpread := decimal.NewFromFloat(0.5)

			if spread.GreaterThan(minSpread) {
				// Profitable arbitrage opportunity found
				qty := decimal.NewFromFloat(0.1)

				// Simultaneous buy on low exchange, sell on high exchange
				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, minExchange, qty).
					SellMarket(pair, maxExchange, qty).
					Build()
				s.w.Emit(signal)

				profit := maxPrice.Sub(minPrice).Mul(qty)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"Arbitrage opportunity: Buy %s @ %.2f, Sell %s @ %.2f, Spread=%.3f%%, Profit=%.2f USDT",
					minExchange, minPrice, maxExchange, maxPrice, spread, profit)
			}
		}
	}
}

func (s *Arbitrage) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *Arbitrage) GetName() strategy.StrategyName { return s.name }
func (s *Arbitrage) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *Arbitrage) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *Arbitrage) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on multiple exchanges, ticks every minute
3. **Fetch Prices**: Get current price from Binance, Bybit, Coinbase
4. **Find Extremes**: Identify lowest and highest prices
5. **Calculate Spread**: Compute percentage difference
6. **Check Profitability**: Is spread > 0.5% (covers fees + slippage)?
7. **Execute**: If yes, simultaneously buy low exchange and sell high exchange
8. **Emit**: Push the dual-leg trade to executor

## Key Concepts

- **Price Inefficiency**: Different exchanges sometimes have price mismatches
- **Market-Neutral**: No directional risk - profit from spread regardless of direction
- **Simultaneous Legs**: Buy and sell must execute as one unit
- **Low Risk**: Profit is nearly guaranteed if both legs fill
- **Fast Execution**: Opportunities are fleeting, must check frequently
- **Fee-Aware**: Minimum spread must cover trading fees + slippage

## Fee Analysis

Must cover transaction costs on both legs:

```
Typical Fee Breakdown:
- Buy fee (0.1%)        + 0.10%
- Sell fee (0.1%)       + 0.10%
- Slippage (0.2%)       + 0.20%
---
Minimum spread needed     0.40%

Safe minimum threshold    0.50% (includes margin for error)
```

Adjust `minSpread` based on your exchanges' actual fee structures.

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Variable frequency (depends on exchange spreads)
- Small profit per trade (0.1-0.5% typical)
- Very high win rate (limited by execution)
- Fast round-trips (minutes or less)
- Highly sensitive to fees and slippage

## Execution Risks

1. **Price Movement**: Prices can change between signal and execution
2. **Partial Fill**: One exchange fills, other doesn't (leaves you exposed)
3. **Liquidity**: Insufficient order book depth causes slippage
4. **Network Delays**: Transfer between exchanges is slow (days if needed)
5. **Timing**: By the time signal executes, spread may have closed

## Capital Requirements

Two strategies:

**Strategy A: Pre-funded on all exchanges**
- Keep capital on Binance, Bybit, Coinbase
- Faster execution (instant)
- Capital inefficiency (tied up on multiple exchanges)

**Strategy B: Transfer based arbitrage**
- Keep capital on primary exchange
- Transfer to exploit larger spreads
- Slower execution (transfer takes hours)
- Only for very large spreads (1%+)

## Improvements

Consider adding:
- **Liquidity checking**: Verify order book depth before executing
- **Fee optimization**: Different fees per exchange, calculate exact profit
- **Order book spread**: Instead of last price, use mid-price (bid/ask)
- **Multiple pairs**: Check BTC, ETH, SOL simultaneously
- **Advanced routing**: Three-way arbitrage (Binance → Bybit → Coinbase)

## Related Strategies

- [Portfolio Strategy](portfolio) - Multi-asset version
- [MACD Momentum](../intermediate/macd-momentum) - Directional alternative
