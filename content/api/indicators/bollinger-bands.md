---
sidebar_position: 5
description: "Bollinger Bands indicator API. Measure volatility and identify overbought/oversold. Returns Upper, Middle, Lower bands."
keywords: ["Bollinger Bands", "volatility", "bands", "mean reversion", "indicator API"]
---

# Bollinger Bands

## Usage

```go
// In your run() loop
btc := s.w.Asset("BTC")
usdt := s.w.Asset("USDT")
pair := s.w.Pair(btc, usdt)

// Basic usage (20, 2.0 is standard)
bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)

s.w.Log().MarketCondition("BB Upper: %.2f, Middle: %.2f, Lower: %.2f",
    bb.Upper, bb.Middle, bb.Lower)

// With options - specific timeframe
bb := s.w.Indicators().BollingerBands(pair, 20, 2.0, indicators.IndicatorOptions{
    Interval: "1h",
})
```

## In a Strategy

```go
// In your run() loop
func (s *Strategy) run(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Hour)
    defer ticker.Stop()

    btc := s.w.Asset("BTC")
    usdt := s.w.Asset("USDT")
    pair := s.w.Pair(btc, usdt)

    for {
        select {
        case <-ticker.C:
            price := s.w.Spot().Price(pair)
            bb := s.w.Indicators().BollingerBands(pair, 20, 2.0)

            // Buy when price touches lower band
            if price.LessThan(bb.Lower) {
                signal := s.w.Spot().Signal(s.name).
                    BuyMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Price below lower BB: %.2f < %.2f", price, bb.Lower)
            }

            // Sell when price touches upper band
            if price.GreaterThan(bb.Upper) {
                signal := s.w.Spot().Signal(s.name).
                    SellMarket(pair, connector.Binance, decimal.NewFromFloat(0.1)).
                    Build()
                s.w.Emit(signal)
                s.w.Log().Opportunity(string(s.name), "BTC",
                    "Price above upper BB: %.2f > %.2f", price, bb.Upper)
            }
        }
    }
}
```

## Parameters

```go
BollingerBands(asset, period, stdDev, ...options) *BollingerBandsResult
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `asset` | `types.Asset` | Asset to calculate for |
| `period` | `int` | SMA period (typically 20) |
| `stdDev` | `float64` | Std dev multiplier (typically 2.0) |
| `options` | `...IndicatorOptions` | Optional exchange/interval |

## Return Value

```go
type BollingerBandsResult struct {
    Upper  decimal.Decimal  // Upper band (SMA + stdDev)
    Middle decimal.Decimal  // Middle band (SMA)
    Lower  decimal.Decimal  // Lower band (SMA - stdDev)
}
```

## Common Patterns

### Mean Reversion

```go
price := s.k.Market().Price(btc)
bb := s.k.Indicators().BollingerBands(btc, 20, 2.0)

// Buy at lower band
if price.LessThan(bb.Lower) {
    return s.Signal().Buy(btc).Build()
}

// Sell at upper band
if price.GreaterThan(bb.Upper) {
    return s.Signal().Sell(btc).Build()
}
```

### Breakout Detection

```go
bb := s.k.Indicators().BollingerBands(btc, 20, 2.0)

// Band width (volatility measure)
bandWidth := bb.Upper.Sub(bb.Lower).Div(bb.Middle).Mul(decimal.NewFromInt(100))

// Squeeze: bands narrowing (low volatility)
if bandWidth.LessThan(decimal.NewFromInt(10)) {
    // Potential breakout coming
}
```

## What It Measures

Bollinger Bands measure volatility and identify overbought/oversold conditions:

### Formulas

```
Middle Band = SMA(period)
Upper Band = Middle + (stdDev × Standard Deviation)
Lower Band = Middle - (stdDev × Standard Deviation)
```

### Interpretation

- **Price near upper band**: Overbought
- **Price near lower band**: Oversold
- **Bands narrow**: Low volatility, potential breakout
- **Bands wide**: High volatility

## See Also

- [ATR](atr) - Another volatility indicator
- [RSI](rsi) - Overbought/oversold momentum
- [Moving Averages](moving-averages) - BB uses SMA

## References

- **Go Package**: [pkg.go.dev](https://pkg.go.dev/github.com/wisp-trading/sdk/pkg/analytics/indicators#BollingerBands)
- **Source Code**: [bollinger.go](https://github.com/wisp-trading/sdk/blob/main/pkg/analytics/indicators/bollinger.go)
- **Theory**: [Investopedia - Bollinger Bands](https://www.investopedia.com/terms/b/bollingerbands.asp)
