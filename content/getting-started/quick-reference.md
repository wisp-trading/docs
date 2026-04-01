---
sidebar_position: 2
description: "Wisp SDK quick reference. Essential APIs for Start/run/Emit pattern, indicators, market data, signals, and logging."
keywords: ["quick reference", "API", "indicators", "market data", "signals", "Wisp SDK"]
---

# Quick Reference

API cheat sheet for writing wisp strategies with the event-driven Start/run/Emit pattern.

## The Wisp Context

Every strategy has access to the full Wisp SDK:

```go
type MyStrategy struct {
    w wisp.Wisp  // Your gateway to everything
}

// In Start() method:
func (s *MyStrategy) Start(ctx context.Context) error {
    go s.run(ctx)
    return nil
}

// In run() method, access services via s.w:
// - s.w.Asset("BTC")              // Get asset
// - s.w.Pair(btc, usdt)           // Create pair
// - s.w.Indicators()              // Technical analysis
// - s.w.Spot()                    // Spot trading & data
// - s.w.Perp()                    // Perpetuals trading
// - s.w.Predict()                 // Prediction markets
// - s.w.Activity()                // Positions, balances
// - s.w.Log()                     // Structured logging
// - s.w.Emit(signal)              // Send signal to executor
```

### Lifecycle Methods

Every strategy must implement:

```go
func (s *MyStrategy) Start(ctx context.Context) error      // Launch run() goroutine
func (s *MyStrategy) Stop(ctx context.Context) error       // Clean shutdown
func (s *MyStrategy) GetName() strategy.StrategyName       // Name identifier
func (s *MyStrategy) Signals() <-chan strategy.Signal      // Signal stream
```

## Assets

Get references to assets you want to trade:

```go
btc := s.k.Asset("BTC")
eth := s.k.Asset("ETH")
sol := s.k.Asset("SOL")
```

Assets are just references. wisp knows which exchange to use based on your config.

## Indicators

All indicators follow the same pattern: pass the asset and parameters.

```go
// RSI - Relative Strength Index
rsi := s.k.Indicators().RSI(btc, 14)

// SMA - Simple Moving Average  
sma := s.k.Indicators().SMA(btc, 20)

// EMA - Exponential Moving Average
ema := s.k.Indicators().EMA(btc, 50)

// MACD - Moving Average Convergence Divergence
macd := s.k.Indicators().MACD(btc, 12, 26, 9)
s.k.Log().Debug("MACD", btc.Symbol(), "MACD: %s, Signal: %s, Histogram: %s", 
    macd.MACD, macd.Signal, macd.Histogram)

// Bollinger Bands
bb := s.k.Indicators().BollingerBands(btc, 20, 2.0)
s.k.Log().Debug("BB", btc.Symbol(), "Upper: %s, Middle: %s, Lower: %s",
    bb.Upper, bb.Middle, bb.Lower)

// Stochastic Oscillator
stoch := s.k.Indicators().Stochastic(btc, 14, 3)
s.k.Log().Debug("Stochastic", btc.Symbol(), "K: %s, D: %s", stoch.K, stoch.D)

// ATR - Average True Range
atr := s.k.Indicators().ATR(btc, 14)
```

wisp automatically:
1. Fetches the required price data
2. Calculates the indicator
3. Returns the latest value

### Indicator Options

Specify exchange or interval when needed:

```go
import "github.com/wisp-trading/sdk/pkg/wisp/indicators"
import "github.com/wisp-trading/sdk/pkg/types/connector"

// Use specific exchange
rsi := s.k.Indicators().RSI(btc, 14, indicators.IndicatorOptions{
    Exchange: connector.Binance,
})

// Use different timeframe
sma := s.k.Indicators().SMA(btc, 200, indicators.IndicatorOptions{
    Interval: "4h",
})

// Both
ema := s.k.Indicators().EMA(btc, 50, indicators.IndicatorOptions{
    Exchange: connector.Bybit,
    Interval: "1h",
})
```

## Market Data

Access real-time market data:

```go
// Current price
price := s.k.Market().Price(btc)

// Price from specific exchange
price := s.k.Market().Price(btc, market.MarketOptions{
    Exchange: connector.Binance,
})

// Prices from all exchanges
prices := s.k.Market().Prices(btc)
for exchange, price := range prices {
    s.k.Log().Info("%s: %s", exchange, price)
}

// Order book
book := s.k.Market().OrderBook(btc)
topBid := book.Bids[0]  // Best bid
topAsk := book.Asks[0]  // Best ask

// Funding rate (perpetuals)
funding := s.k.Market().FundingRate(btc)

// Historical klines
klines := s.k.Market().Klines(btc, "1h", 100)  // Last 100 1h candles
```

## Domain APIs: Spot, Perp, Predict

Access trading markets through domain-specific APIs:

### Spot Markets (Buying & Selling)

```go
// Watch a pair for price updates
btc := s.w.Asset("BTC")
usdt := s.w.Asset("USDT")
pair := s.w.Pair(btc, usdt)
s.w.Spot().WatchPair(connector.Binance, pair)

// Get current price
price := s.w.Spot().Price(pair)
price := s.w.Spot().Price(pair, connector.Binance)  // Specific exchange

// Create and emit buy signal
signal := s.w.Spot().Signal(s.name).
    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
    Build()
s.w.Emit(signal)

// Sell signal
signal := s.w.Spot().Signal(s.name).
    SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
    Build()
s.w.Emit(signal)

// Limit orders
signal := s.w.Spot().Signal(s.name).
    BuyLimit(pair, connector.Binance, decimal.NewFromFloat(0.1), decimal.NewFromInt(45000)).
    Build()
s.w.Emit(signal)
```

### Perpetual Futures Markets (Leveraged Trading)

```go
// Watch futures pair
pair := s.w.Pair(btc, usdt)
s.w.Perp().WatchPair(connector.Bybit, pair)

// Get price
price := s.w.Perp().Price(pair)

// Leveraged long with 5x
signal := s.w.Perp().Signal(s.name).
    BuyMarket(pair, connector.Bybit,
        decimal.NewFromFloat(0.1),  // quantity
        decimal.NewFromInt(5)).      // 5x leverage
    Build()
s.w.Emit(signal)

// Leveraged short with 3x
signal := s.w.Perp().Signal(s.name).
    SellMarket(pair, connector.Bybit,
        decimal.NewFromFloat(0.1),  // quantity
        decimal.NewFromInt(3)).      // 3x leverage
    Build()
s.w.Emit(signal)

// Get funding rate (positive = longs pay shorts)
fundingRate := s.w.Perp().FundingRate(pair)
```

### Prediction Markets

```go
// Watch a prediction market
s.w.Predict().WatchMarket(connector.Polymarket,
    "BTC above $50k by Jan 2026")

// Buy shares in an outcome
signal := s.w.Predict().Signal(s.name).
    Buy(market, outcome,
        connector.Polymarket,
        shares,        // How many shares
        maxPrice,      // Max price per share
        expiry).       // Expiration time
    Build()
s.w.Emit(signal)
```

## Emitting Signals

The event-driven pattern: analyze in your run loop, emit signals asynchronously:

```go
// In your run() loop:
func (s *MyStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            // Analyze market
            rsi := s.w.Indicators().RSI(pair, 14)

            // When signal condition met, emit asynchronously
            if rsi.LessThan(decimal.NewFromInt(30)) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)  // Push to executor
                s.w.Log().Opportunity(string(s.name), "BTC", "RSI oversold")
            }
        case <-ctx.Done():
            return
        }
    }
}
```

## Working with Decimals

wisp uses `decimal.Decimal` for all financial calculations:

```go
import "github.com/shopspring/decimal"

// Create decimals
price := decimal.NewFromFloat(50000.50)
quantity := decimal.NewFromInt(2)
pct := decimal.NewFromString("0.025")  // 2.5%

// Math operations
total := price.Mul(quantity)
fee := total.Mul(pct)
net := total.Sub(fee)

// Comparisons
if price.GreaterThan(decimal.NewFromInt(50000)) {
    // Price above 50k
}

if rsi.LessThan(decimal.NewFromInt(30)) {
    // RSI oversold
}

// String conversion
s.k.Log().Info("Price: %s", price.String())              // "50000.5"
s.k.Log().Info("Price fixed: %s", price.StringFixed(2)) // "50000.50"
```

:::danger Never use float64 for money
Always use `decimal.Decimal` to avoid floating-point precision errors.
:::

## Logging

Use structured logging to track your strategy:

```go
// Info level
s.k.Log().Info("Strategy initialized")

// Debug level
s.k.Log().Debug("Strategy", btc.Symbol(), "RSI: %s", rsi)

// Market conditions
s.k.Log().MarketCondition("Price: %s, RSI: %s", price, rsi)

// Opportunities
s.k.Log().Opportunity("Strategy", btc.Symbol(), 
    "Buy signal - RSI oversold at %s", rsi)

// Failures
s.k.Log().Failed("Strategy", btc.Symbol(), 
    "Failed to calculate RSI: %v", err)
```

## Error Handling

Always handle errors properly:

```go
func (s *Strategy) GetSignals() ([]*strategy.Signal, error) {
    btc := s.k.Asset("BTC")
    
    // Check if indicators have valid data
    rsi := s.k.Indicators().RSI(btc, 14)
    if rsi.IsZero() {
        // No data yet, skip this cycle
        return nil, nil
    }
    
    // Your logic here...
    
    return signals, nil
}
```

## Complete Example

A simple RSI strategy with the Start/run/Emit pattern:

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

// Start launches the run goroutine (non-blocking)
func (s *RSIStrategy) Start(ctx context.Context) error {
    go s.run(ctx)
    return nil
}

// run owns the execution loop
func (s *RSIStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    // Watch the pair
    s.w.Spot().WatchPair(connector.Binance, pair)

    for {
        select {
        case <-s.stopChan:
            return
        case <-ctx.Done():
            return
        case <-ticker.C:
            // Analyze market
            rsi := s.w.Indicators().RSI(pair, 14)
            price := s.w.Spot().Price(pair)

            // Buy when oversold
            if rsi.LessThan(decimal.NewFromInt(30)) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "RSI oversold at %.2f, Price=%.2f", rsi, price)
            }

            // Sell when overbought
            if rsi.GreaterThan(decimal.NewFromInt(70)) {
                signal := s.w.Spot().Signal(s.name).
                    SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "RSI overbought at %.2f, Price=%.2f", rsi, price)
            }
        }
    }
}

// Stop cleanly shuts down the strategy
func (s *RSIStrategy) Stop(ctx context.Context) error {
    close(s.stopChan)
    return nil
}

// Required interface methods
func (s *RSIStrategy) GetName() strategy.StrategyName {
    return s.name
}

func (s *RSIStrategy) Signals() <-chan strategy.Signal {
    return s.signalChan
}

func (s *RSIStrategy) LatestStatus() strategy.StrategyStatus {
    return strategy.StrategyStatus{}
}

func (s *RSIStrategy) StatusLog() []strategy.StrategyStatus {
    return []strategy.StrategyStatus{}
}
```

## Best Practices

**Start/run/Emit pattern:**
- Non-blocking `Start()` that launches a goroutine
- `run()` owns the execution loop with tickers/channels
- `Emit()` pushes signals asynchronously (don't return from methods)
- `Stop()` cleanly shuts down the goroutine

**Key methods:**
- Use `s.w.Spot()` for spot trading
- Use `s.w.Perp()` for perpetuals
- Use `s.w.Indicators()` for technical analysis
- Use `s.w.Emit(signal)` to send signals (not return)
- Use `s.w.Log()` for structured logging

## Next Steps

- **[Writing Strategies](writing-strategies)** - Deep dive into strategy patterns
- **[Examples](../examples)** - Common strategy implementations
- **[Indicators Reference](../api/indicators/rsi)** - Full indicator documentation
