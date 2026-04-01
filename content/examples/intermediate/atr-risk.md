---
sidebar_position: 3
description: "ATR-based risk management strategy. Dynamic stops and position sizing based on volatility. Volatility filter prevents trading during high-volatility periods."
keywords: ["ATR", "risk management", "position sizing", "volatility filter", "Wisp"]
---

# ATR-Based Risk Management

Dynamic stops and position sizing based on volatility. Use ATR to adapt your risk management to market conditions.

## Strategy Overview

- **Type**: Technical with Risk Management
- **Indicators**: RSI (14), ATR (14)
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

type ATRRiskManaged struct {
	w          wisp.Wisp
	name       strategy.StrategyName
	signalChan chan strategy.Signal
	stopChan   chan struct{}
}

func NewATRRiskManaged(w wisp.Wisp) *ATRRiskManaged {
	return &ATRRiskManaged{
		w:          w,
		name:       strategy.Momentum,
		signalChan: make(chan strategy.Signal, 10),
		stopChan:   make(chan struct{}),
	}
}

// Start launches the strategy's execution goroutine
func (s *ATRRiskManaged) Start(ctx context.Context) error {
	go s.run(ctx)
	return nil
}

// run manages the internal execution loop
func (s *ATRRiskManaged) run(ctx context.Context) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	btc := s.w.Asset("BTC")
	usdt := s.w.Asset("USDT")
	pair := s.w.Pair(btc, usdt)

	// Watch the pair on our exchange
	s.w.Spot().WatchPair(connector.Binance, pair)

	// Account balance - get from Activity() in production
	accountBalance := decimal.NewFromInt(10000)

	for {
		select {
		case <-s.stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Analyze market and emit signals
			rsi := s.w.Indicators().RSI(pair, 14)
			price := s.w.Spot().Price(pair)
			atr := s.w.Indicators().ATR(pair, 14)

			// Check volatility filter
			atrPercent := atr.Div(price).Mul(decimal.NewFromInt(100))
			if atrPercent.GreaterThan(decimal.NewFromInt(5)) {
				s.w.Log().MarketCondition("Volatility too high: %.2f%% - skipping", atrPercent)
				continue
			}

			// Entry signal: RSI oversold
			if rsi.LessThan(decimal.NewFromInt(30)) {
				// Dynamic stops based on ATR
				stopLoss := price.Sub(atr.Mul(decimal.NewFromInt(2)))
				takeProfit := price.Add(atr.Mul(decimal.NewFromInt(3)))

				// Position size based on risk: always risk 2% of account
				riskAmount := accountBalance.Mul(decimal.NewFromFloat(0.02))
				stopDistance := atr.Mul(decimal.NewFromInt(2))
				quantity := riskAmount.Div(stopDistance)

				signal := s.w.Spot().Signal(s.name).
					BuyMarket(pair, connector.Binance, quantity).
					Build()
				s.w.Emit(signal)
				s.w.Log().Opportunity(string(s.name), "BTC",
					"ATR-managed entry - Price=%.2f, RSI=%.2f, ATR=%.2f%%, Stop=%.2f, Target=%.2f, Size=%.4f",
					price, rsi, atrPercent, stopLoss, takeProfit, quantity)
			}
		}
	}
}

func (s *ATRRiskManaged) Stop(ctx context.Context) error {
	close(s.stopChan)
	return nil
}

func (s *ATRRiskManaged) GetName() strategy.StrategyName { return s.name }
func (s *ATRRiskManaged) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *ATRRiskManaged) LatestStatus() strategy.StrategyStatus { return strategy.StrategyStatus{} }
func (s *ATRRiskManaged) StatusLog() []strategy.StrategyStatus { return []strategy.StrategyStatus{} }
```

## How It Works

1. **Start()**: Launches the run goroutine
2. **run()**: Watches BTC/USDT on Binance, ticks every hour
3. **Volatility Filter**: Calculate ATR as % of price
   - If ATR% > 5%: Skip trading (too volatile)
   - If ATR% ≤ 5%: Continue to entry logic
4. **Entry Signal**: When RSI < 30 (oversold)
5. **Dynamic Stops**:
   - Stop Loss: 2× ATR below entry
   - Take Profit: 3× ATR above entry
6. **Position Sizing**: Risk exactly 2% of account
   - Size = (2% of account) / (2× ATR)
   - Lower volatility = larger positions
   - Higher volatility = smaller positions
7. **Emit**: Push signal asynchronously

## Key Concepts

- **ATR (Average True Range)**: Measures volatility in price units
- **Volatility Filter**: Skip trading during extreme volatility (>5%)
- **Dynamic Stops**: Stops adapt to current market conditions
- **Position Sizing**: Inversely proportional to volatility
  - Low volatility (low ATR) → larger position, tighter stops
  - High volatility (high ATR) → smaller position, wider stops
- **Fixed Risk**: Always risk exactly 2% per trade (adjusts position size)
- **Risk:Reward Ratio**: 1:1.5 (stop at 2× ATR, target at 3× ATR)

## Backtesting

Run with:

```bash
wisp backtest
```

Expected characteristics:
- Consistent 2% risk per trade
- Better capital preservation
- Avoids trading in extreme volatility
- Position sizes vary with market conditions
- Larger profits in calm markets, smaller in volatile markets

## Improvements

Consider adding:
- **Trailing stops**: Move stop up as profit grows (lock in gains)
- **Partial exits**: Scale out at 1× ATR (take quick wins), continue with trailing stop at 2× ATR
- **Entry timing**: Enter when ATR is low, exit when ATR is high
- **Multiple assets**: Track different assets with different position sizes
- **Dynamic risk target**: Adjust 2% based on recent performance (reduce after drawdown)

## Related Strategies

- [RSI Strategy](../basic/rsi) - Same entry logic, fixed position sizes
- [Multi-Indicator Confirmation](multi-indicator) - Add more entry signals
- [Portfolio Strategy](../advanced/portfolio) - Apply to multiple assets
