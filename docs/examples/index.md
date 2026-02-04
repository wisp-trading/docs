---
sidebar_position: 4
---

# Strategy Examples

Learn from complete, production-ready strategy implementations organized by complexity.

## Basic Strategies

Perfect for getting started with wisp. These strategies use 1-2 indicators and simple logic.

- **[RSI Strategy](/examples/basic/rsi)** - Classic momentum with oversold/overbought levels
- **[Moving Average Crossover](/examples/basic/ma-crossover)** - Golden/death cross trend following
- **[Bollinger Bands Mean Reversion](/examples/basic/bollinger-bands)** - Fade extremes, target the middle

## Intermediate Strategies

Add sophistication with multiple indicators, filters, and risk management.

- **[Multi-Indicator Confirmation](/examples/intermediate/multi-indicator)** - Require 3/4 signals to agree
- **[MACD with Trend Filter](/examples/intermediate/macd-momentum)** - Only trade with prevailing trend
- **[ATR Risk Management](/examples/intermediate/atr-risk)** - Dynamic stops and position sizing

## Advanced Strategies

Complex strategies for experienced traders: portfolios, arbitrage, and multi-asset.

- **[Portfolio Strategy](/examples/advanced/portfolio)** - Trade multiple assets with individual analysis
- **[Cross-Exchange Arbitrage](/examples/advanced/arbitrage)** - Exploit price differences across exchanges

## Using These Examples

### Run a Strategy

1. Copy the complete code to your project
2. Save as `strategy.go`
3. Run backtest:

```bash
wisp backtest
```

### Customize

Each example is a starting point. Common modifications:

- Adjust indicator parameters (RSI 14 → 20)
- Change position sizes
- Add stop losses
- Combine multiple strategies
- Add your own filters

### Learn by Reading

Each example includes:
- **Strategy Overview** - Type, indicators, risk level
- **Complete Code** - Copy-paste ready
- **How It Works** - Step-by-step explanation
- **Key Concepts** - Important principles
- **Improvements** - Ideas for enhancement

## Next Steps

- **[Writing Strategies](../getting-started/writing-strategies)** - Deep dive into strategy development
- **[API Reference](../api/indicators/rsi)** - Full indicator documentation
- **[Configuration](../getting-started/configuration)** - Set up for production
