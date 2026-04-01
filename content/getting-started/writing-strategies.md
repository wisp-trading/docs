---
sidebar_position: 3
description: "Master Wisp strategy development with event-driven architecture. Learn Start(ctx), run loops, Emit patterns, and domain APIs for spot, perpetuals, and prediction markets."
keywords: ["wisp strategy", "event-driven trading", "Start ctx", "Emit signal", "execution loop", "trading signals"]
---

# Writing Strategies

Learn how to build sophisticated trading strategies with wisp's event-driven architecture.

## Strategy Architecture Overview

Wisp strategies are **self-directed, event-driven entities** that own their execution loop and push signals asynchronously. Unlike polling models, strategies manage their own lifecycle and control when market data is analyzed.

**Key architectural principles:**
- Strategies implement `strategy.Strategy` interface
- `Start(ctx)` launches a non-blocking goroutine that owns the execution loop
- Strategy calls `wisp.Emit(signal)` to push signals asynchronously
- `Stop(ctx)` cleanly shuts down the strategy
- A `run()` method manages the internal execution clock

## Strategy Interface

Every strategy must implement:

```go
type Strategy interface {
    // Identity
    GetName() StrategyName

    // Lifecycle
    Start(ctx context.Context) error      // Launch the run loop
    Stop(ctx context.Context) error       // Shut down cleanly

    // Observability
    Signals() <-chan Signal                // Read-only signal channel
    LatestStatus() StrategyStatus          // Current status snapshot
    StatusLog() []StrategyStatus           // Last 100 status snapshots
}
```

## Pattern 1: Simple Start/Run Pattern

The foundation of every wisp strategy: `Start()` launches a goroutine, and `run()` manages the execution loop:

```go
package main

import (
    "context"
    "time"
    "github.com/wisp-trading/sdk/pkg/types/strategy"
    "github.com/wisp-trading/sdk/pkg/types/wisp"
)

type SimpleRSIStrategy struct {
    w          wisp.Wisp
    name       strategy.StrategyName
    signalChan chan strategy.Signal
    stopChan   chan struct{}
}

func NewSimpleRSI(w wisp.Wisp) *SimpleRSIStrategy {
    return &SimpleRSIStrategy{
        w:          w,
        name:       strategy.Momentum,
        signalChan: make(chan strategy.Signal, 10),
        stopChan:   make(chan struct{}),
    }
}

// Start launches the strategy's execution goroutine
func (s *SimpleRSIStrategy) Start(ctx context.Context) error {
    go s.run(ctx)
    return nil
}

// run manages the internal execution loop
func (s *SimpleRSIStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            // Analyze market and emit signals
            btc := s.w.Asset("BTC")
            pair := s.w.Pair(btc, s.w.Asset("USDT"))

            // Get RSI from indicators
            rsi := s.w.Indicators().RSI(pair, 14)

            if rsi.LessThan(decimal.NewFromInt(30)) {
                // Build and emit signal asynchronously
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity("RSI", "BTC", "Oversold: %s", rsi.String())
            }
        }
    }
}

func (s *SimpleRSIStrategy) Stop(ctx context.Context) error {
    close(s.stopChan)
    return nil
}

func (s *SimpleRSIStrategy) GetName() strategy.StrategyName { return s.name }
func (s *SimpleRSIStrategy) Signals() <-chan strategy.Signal { return s.signalChan }
func (s *SimpleRSIStrategy) LatestStatus() strategy.StrategyStatus { /* implementation */ }
func (s *SimpleRSIStrategy) StatusLog() []strategy.StrategyStatus { /* implementation */ }
```

## Pattern 2: Multiple Assets

Monitor and trade multiple assets, emitting signals for each opportunity:

```go
type MultiAssetStrategy struct {
    w          wisp.Wisp
    name       strategy.StrategyName
    signalChan chan strategy.Signal
    stopChan   chan struct{}
    assets     []string  // "BTC", "ETH", "SOL"
}

func (s *MultiAssetStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            usdt := s.w.Asset("USDT")

            // Check each asset independently
            for _, symbol := range s.assets {
                asset := s.w.Asset(symbol)
                pair := s.w.Pair(asset, usdt)

                rsi := s.w.Indicators().RSI(pair, 14)

                if rsi.LessThan(decimal.NewFromInt(30)) {
                    // Emit separate signal for each opportunity
                    signal := s.w.Spot().Signal(s.name).
                        BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                        Build()
                    s.w.Emit(signal)
                    s.w.Log().Opportunity(string(s.name), symbol, "Oversold: %s", rsi.String())
                }
            }
        }
    }
}
```

Wisp manages market data for all assets in parallel through the `Spot()`, `Perp()`, and `Predict()` domains.

## Pattern 3: Multiple Timeframes

Use different timeframes for trend and signal confirmation:

```go
func (s *TrendFollowStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            // Long-term trend on 4-hour
            sma200_4h := s.w.Indicators().SMA(pair, 200)  // Default to strategy interval

            // Short-term signal on 1-hour (would require watchlist on different timeframe)
            rsi_1h := s.w.Indicators().RSI(pair, 14)

            // Get current price from spot
            price := s.w.Spot().Price(pair)

            // Only buy if in uptrend AND oversold
            if price.GreaterThan(sma200_4h) && rsi_1h.LessThan(decimal.NewFromInt(30)) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Oversold in uptrend: Price=%.2f, SMA200=%.2f, RSI=%.2f",
                    price, sma200_4h, rsi_1h)
            }
        }
    }
}
```

Use `wisp.Spot().Price(pair)` to get current market prices and `Indicators()` for technical analysis.

## Pattern 4: Combining Indicators

Use multiple indicators for confirmation before emitting signals:

```go
func (s *ConfirmationStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            // Get multiple indicators
            rsi := s.w.Indicators().RSI(pair, 14)
            stoch := s.w.Indicators().Stochastic(pair, 14, 3)
            bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)
            price := s.w.Spot().Price(pair)

            // Require all three to confirm oversold
            oversold := rsi.LessThan(decimal.NewFromInt(30)) &&
                        stoch.K.LessThan(decimal.NewFromInt(20)) &&
                        price.LessThan(bb.Lower)

            if oversold {
                // Larger position size with triple confirmation
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.15)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Triple confirmation: RSI=%.2f, Stoch.K=%.2f, Price=%.2f < BB.Lower=%.2f",
                    rsi, stoch.K, price, bb.Lower)
            }
        }
    }
}
```

Multiple confirmations reduce false signals. Emit with higher confidence once all indicators align.

## Pattern 5: Risk Management with ATR

Use ATR for dynamic stop loss and position sizing:

```go
func (s *RiskManagedStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            rsi := s.w.Indicators().RSI(pair, 14)
            price := s.w.Spot().Price(pair)
            atr := s.w.Indicators().ATR(pair, 14)

            if rsi.LessThan(decimal.NewFromInt(30)) {
                // Calculate stops based on ATR
                stopLoss := price.Sub(atr.Mul(decimal.NewFromInt(2)))
                takeProfit := price.Add(atr.Mul(decimal.NewFromInt(3)))

                // Risk/reward ratio: 1:1.5
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Entry=%.2f, Stop=%.2f, Target=%.2f, R:R=1:1.5",
                    price, stopLoss, takeProfit)

                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
            }
        }
    }
}
```

## Pattern 6: Dynamic Position Sizing

Size positions based on account balance and volatility:

```go
func (s *DynamicSizeStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            atr := s.w.Indicators().ATR(pair, 14)
            price := s.w.Spot().Price(pair)

            // Risk 2% of account per trade
            accountBalance := s.w.Activity().Balance(usdt, connector.Binance)
            riskAmount := accountBalance.Mul(decimal.NewFromFloat(0.02))

            // Stop loss at 2× ATR
            stopDistance := atr.Mul(decimal.NewFromInt(2))

            // Position size = risk / stop distance
            quantity := riskAmount.Div(stopDistance)

            // Emit signal with dynamic size
            signal := s.w.Spot().Signal(s.name).
                BuyMarket(pair, connector.Binance, quantity).
                Build()
            s.w.Emit(signal)
        }
    }
}
```

## Pattern 7: Volatility Filter

Skip trading during extreme volatility:

```go
func (s *VolatilityFilterStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            atr := s.w.Indicators().ATR(pair, 14)
            price := s.w.Spot().Price(pair)

            // ATR as percentage of price
            atrPercent := atr.Div(price).Mul(decimal.NewFromInt(100))

            // Skip if volatility too high (>5%)
            if atrPercent.GreaterThan(decimal.NewFromInt(5)) {
                s.w.Log().MarketCondition("Volatility too high: %.2f%%", atrPercent)
                continue
            }

            // Normal trading logic proceeds here
            rsi := s.w.Indicators().RSI(pair, 14)
            if rsi.LessThan(decimal.NewFromInt(30)) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
            }
        }
    }
}
```

## Pattern 8: Spot vs Perpetuals

Trade both spot and perp markets with the same strategy logic:

```go
func (s *SpotPerpStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            rsi := s.w.Indicators().RSI(pair, 14)

            if rsi.LessThan(decimal.NewFromInt(30)) {
                // Spot market: Long with actual asset ownership
                spotSignal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(spotSignal)

                // Perp market: Leveraged long on same signal
                perpSignal := s.w.Perp().Signal(s.name).
                    BuyMarket(pair, connector.Bybit,
                        decimal.NewFromFloat(0.5),  // 5x capital: 0.1 asset * 5x leverage
                        decimal.NewFromInt(5)).      // 5x leverage
                    Build()
                s.w.Emit(perpSignal)

                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Oversold: RSI=%.2f - bought spot and perp", rsi)
            }
        }
    }
}
```

## Pattern 9: Multi-Exchange Strategy

Monitor prices across exchanges and execute on best prices:

```go
func (s *MultiExchangeStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    // Watch on multiple exchanges
    s.w.Spot().WatchPair(connector.Binance, pair)
    s.w.Spot().WatchPair(connector.Bybit, pair)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            rsi := s.w.Indicators().RSI(pair, 14)

            if rsi.LessThan(decimal.NewFromInt(30)) {
                // Get best price across exchanges
                binancePrice := s.w.Spot().Price(pair, connector.Binance)
                bybitPrice := s.w.Spot().Price(pair, connector.Bybit)

                var bestExchange connector.ExchangeName
                var bestPrice decimal.Decimal

                if binancePrice.LessThan(bybitPrice) {
                    bestExchange = connector.Binance
                    bestPrice = binancePrice
                } else {
                    bestExchange = connector.Bybit
                    bestPrice = bybitPrice
                }

                // Execute on best exchange
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, bestExchange, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)

                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Buying on %s at best price: %.2f", bestExchange, bestPrice)
            }
        }
    }
}
```

## Pattern 10: Trend Following with Golden/Death Cross

Trade moving average crossovers with confirmation:

```go
func (s *TrendFollowStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            sma50 := s.w.Indicators().SMA(pair, 50)
            sma200 := s.w.Indicators().SMA(pair, 200)
            price := s.w.Spot().Price(pair)

            // Golden cross: 50 SMA crosses above 200 SMA
            if sma50.GreaterThan(sma200) && price.GreaterThan(sma50) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Golden cross: SMA50=%.2f > SMA200=%.2f, Price=%.2f", sma50, sma200, price)
            }

            // Death cross: 50 SMA crosses below 200 SMA
            if sma50.LessThan(sma200) {
                signal := s.w.Spot().Signal(s.name).
                    SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.2)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC", "Death cross: Selling")
            }
        }
    }
}
```

## Pattern 11: Mean Reversion with Bollinger Bands

Trade bounces from Bollinger Band extremes:

```go
func (s *MeanReversionStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)
            price := s.w.Spot().Price(pair)
            rsi := s.w.Indicators().RSI(pair, 14)

            // Buy when price touches lower band AND RSI confirms
            if price.LessThan(bb.Lower) && rsi.LessThan(decimal.NewFromInt(30)) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Mean reversion: Price=%.2f < BB.Lower=%.2f, target=%.2f", price, bb.Lower, bb.Middle)
            }

            // Sell when price touches upper band
            if price.GreaterThan(bb.Upper) && rsi.GreaterThan(decimal.NewFromInt(70)) {
                signal := s.w.Spot().Signal(s.name).
                    SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Overbought: Price=%.2f > BB.Upper=%.2f", price, bb.Upper)
            }
        }
    }
}
```

## Pattern 12: Volatility Breakout

Trade breakouts from Bollinger Band squeeze:

```go
func (s *BreakoutStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)
            price := s.w.Spot().Price(pair)

            // Band width: measure of volatility
            bandWidth := bb.Upper.Sub(bb.Lower).Div(bb.Middle).Mul(decimal.NewFromInt(100))

            // Squeeze: bands narrow (low volatility = breakout coming)
            if bandWidth.LessThan(decimal.NewFromInt(10)) {
                s.w.Log().MarketCondition("Bollinger squeeze detected: Width=%.2f%%", bandWidth)

                // Buy on upward breakout
                if price.GreaterThan(bb.Upper) {
                    signal := s.w.Spot().Signal(s.name).
                        BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.15)).
                        Build()
                    s.w.Emit(signal)
                    s.w.Log().Opportunity(string(s.name), "BTC",
                        "Breakout from squeeze: Price=%.2f > BB.Upper=%.2f", price, bb.Upper)
                }

                // Sell on downward breakout
                if price.LessThan(bb.Lower) {
                    signal := s.w.Spot().Signal(s.name).
                        SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.15)).
                        Build()
                    s.w.Emit(signal)
                    s.w.Log().Opportunity(string(s.name), "BTC",
                        "Breakdown from squeeze: Price=%.2f < BB.Lower=%.2f", price, bb.Lower)
                }
            }
        }
    }
}
```

## Pattern 13: Stateful Strategy with Position Tracking

Track entries and exits with trailing stops:

```go
type TrailingStopStrategy struct {
    w            wisp.Wisp
    name         strategy.StrategyName
    signalChan   chan strategy.Signal
    stopChan     chan struct{}

    // State
    inPosition   bool
    entryPrice   decimal.Decimal
    trailingStop decimal.Decimal
    quantity     decimal.Decimal
}

func (s *TrailingStopStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            price := s.w.Spot().Price(pair)
            atr := s.w.Indicators().ATR(pair, 14)

            // Entry logic
            if !s.inPosition {
                rsi := s.w.Indicators().RSI(pair, 14)
                if rsi.LessThan(decimal.NewFromInt(30)) {
                    s.inPosition = true
                    s.entryPrice = price
                    s.quantity = decimal.NewFromFloat(0.1)
                    s.trailingStop = price.Sub(atr.Mul(decimal.NewFromInt(2)))

                    signal := s.w.Spot().Signal(s.name).
                        BuyMarket(pair, connector.Binance, s.quantity).
                        Build()
                    s.w.Emit(signal)
                    s.w.Log().Opportunity(string(s.name), "BTC",
                        "Entry at %.2f, trailing stop=%.2f", price, s.trailingStop)
                }
            }

            // Exit logic with trailing stop
            if s.inPosition {
                // Update trailing stop as price rises
                newStop := price.Sub(atr.Mul(decimal.NewFromInt(2)))
                if newStop.GreaterThan(s.trailingStop) {
                    s.trailingStop = newStop
                    s.w.Log().MarketCondition("Trailing stop updated to %.2f", newStop)
                }

                // Exit if stop hit
                if price.LessThan(s.trailingStop) {
                    s.inPosition = false

                    signal := s.w.Spot().Signal(s.name).
                        SellMarket(pair, connector.Binance, s.quantity).
                        Build()
                    s.w.Emit(signal)
                    s.w.Log().Opportunity(string(s.name), "BTC",
                        "Exit at %.2f via trailing stop, PNL=%.2f%%",
                        price, price.Sub(s.entryPrice).Div(s.entryPrice).Mul(decimal.NewFromInt(100)))
                }
            }
        }
    }
}
```

## Domain APIs: Spot, Perp, and Predict

The new architecture separates concerns by market type:

### Spot Markets

Access spot trading, wallets, and orderbooks:

```go
// Create a pair
pair := s.w.Pair(btc, usdt)

// Watch market data
s.w.Spot().WatchPair(connector.Binance, pair)

// Get price
price := s.w.Spot().Price(pair)
price := s.w.Spot().Price(pair, connector.Bybit)  // Specific exchange

// Create and emit signals
signal := s.w.Spot().Signal(s.name).
    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
    Build()
s.w.Emit(signal)

// Access positions and balances
positions := s.w.Activity().Positions(connector.Binance)
balance := s.w.Activity().Balance(usdt, connector.Binance)
```

### Perpetual Futures Markets

Access futures, funding rates, and leveraged positions:

```go
// Watch futures pair
s.w.Perp().WatchPair(connector.Bybit, pair)

// Create leveraged long with 5x
signal := s.w.Perp().Signal(s.name).
    BuyMarket(pair, connector.Bybit, qty, decimal.NewFromInt(5)).
    Build()
s.w.Emit(signal)

// Create leveraged short with 3x
signal := s.w.Perp().Signal(s.name).
    SellMarket(pair, connector.Bybit, qty, decimal.NewFromInt(3)).
    Build()
s.w.Emit(signal)

// Access funding rates
fundingRate := s.w.Perp().FundingRate(pair)
```

### Prediction Markets

Access prediction markets and outcome betting:

```go
// Watch market
s.w.Predict().WatchMarket(connector.Polymarket, "BTC above $50k by Jan 2026")

// Buy shares in outcome
signal := s.w.Predict().Signal(s.name).
    Buy(market, outcome, connector.Polymarket, shares, maxPrice, expiry).
    Build()
s.w.Emit(signal)
```

## Accessing Wisp Services

The full suite of services available through `wisp`:

```go
// Market data and analysis
indicators := s.w.Indicators()      // RSI, SMA, BB, ATR, etc.
analytics := s.w.Analytics()        // Trend detection, correlation

// Logging and diagnostics
logger := s.w.Log()                 // Log opportunities, conditions

// Portfolio and positions
activity := s.w.Activity()          // Positions, balances, trades, PNL

// Signal creation and routing
spot := s.w.Spot()                  // Spot trading
perp := s.w.Perp()                  // Futures trading
predict := s.w.Predict()            // Prediction markets

// Assets and pairs
btc := s.w.Asset("BTC")             // Create asset
pair := s.w.Pair(btc, usdt)         // Create pair

// Direct signal emission
s.w.Emit(signal)                    // Route to executor
```

## Best Practices

### ✅ Do

- **Implement Start/Stop correctly** - Non-blocking Start, clean Stop
- **Use channels for signals** - Push signals via `wisp.Emit()`, not return values
- **Use proper decimals** - Always use `decimal.Decimal` for money
- **Manage your run loop** - Control your clock with tickers/channels
- **Log decisions** - Use `s.w.Log()` to track behavior
- **Handle context cancellation** - Respect `ctx.Done()` in your loop
- **Combine indicators** - Use multiple confirmations
- **Test thoroughly** - Backtest before live trading
- **Use stop losses** - Protect capital with risk management

### ❌ Don't

- **Don't use floats** - Never use `float64` for financial calculations
- **Don't block in Start()** - Launch goroutine, return immediately
- **Don't ignore context** - Check `<-ctx.Done()` in your loop
- **Don't poll excessively** - Use tickers for predictable intervals
- **Don't overfit** - Optimize for real market conditions, not backtest
- **Don't ignore risk** - Always manage position sizes
- **Don't skip Stop()** - Implement clean shutdown
- **Don't leak goroutines** - Ensure your run loop exits on Stop

## Related Documentation

- **[Installation](installation)** - Set up your environment
- **[Configuration](configuration)** - Configure exchanges and parameters
- **[Quick Reference](quick-reference)** - API quick reference
- **[Examples](../examples)** - Complete strategy implementations
- **[Indicators Reference](../api/indicators/rsi)** - Full indicator documentation
- **[Event-Driven Architecture](../concepts/event-driven)** - Deep dive on architecture
