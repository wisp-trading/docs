---
sidebar_position: 4
description: "Complete, production-ready Wisp strategy examples organized by complexity. From basic RSI to advanced arbitrage. All examples use event-driven Start/run/Emit pattern."
keywords: ["strategy examples", "Wisp SDK", "trading strategies", "Start/run pattern", "event-driven"]
---

# Strategy Examples

Learn from complete, production-ready strategy implementations organized by complexity. All examples use wisp's event-driven architecture with `Start()`, `run()`, and `Emit()` patterns.

## Architecture Pattern

Every example follows this proven pattern:

```
Start(ctx) → launches run() goroutine → ticker ticks → analyze market → Emit(signal)
```

Each strategy:
- Launches non-blocking via `Start()`
- Owns its execution loop in `run()`
- Emits signals asynchronously via `wisp.Emit()`
- Shuts down cleanly via `Stop()`

## Basic Strategies

Perfect for getting started with wisp. These strategies use 1-2 indicators and simple logic.

- **[RSI Strategy](basic/rsi)** - Classic momentum with oversold/overbought levels. Ticks hourly, emits buy/sell signals.
- **[Moving Average Crossover](basic/ma-crossover)** - Golden/death cross trend following. Simple, reliable trend detection.
- **[Bollinger Bands Mean Reversion](basic/bollinger-bands)** - Fade extremes, target the middle. Reverting to the mean.

## Intermediate Strategies

Add sophistication with multiple indicators, filters, and risk management.

- **[Multi-Indicator Confirmation](intermediate/multi-indicator)** - Require 3/4 signals to agree before trading
- **[MACD with Trend Filter](intermediate/macd-momentum)** - Only trade with prevailing trend using MACD crossovers
- **[ATR Risk Management](intermediate/atr-risk)** - Dynamic stops and position sizing based on volatility

## Advanced Strategies

Complex strategies for experienced traders: portfolios, arbitrage, and multi-asset.

- **[Portfolio Strategy](advanced/portfolio)** - Trade multiple assets with individual analysis and allocation
- **[Cross-Exchange Arbitrage](advanced/arbitrage)** - Exploit price differences across exchanges

## Using These Examples

### Copy and Customize

1. Copy the complete code from any example
2. Save as `strategy.go` in your project
3. Adjust parameters to your preferences
4. Run backtest:

```bash
wisp backtest
```

### Common Modifications

- Adjust indicator parameters (RSI 14 → 20)
- Change ticker interval (1 hour → 4 hours)
- Modify position sizes
- Add stop losses with ATR
- Combine multiple strategies
- Add volatility filters

### What Each Example Includes

- **Strategy Overview** - Type, indicators, risk level, asset count
- **Complete Code** - Copy-paste ready, fully functional
- **How It Works** - Step-by-step execution flow
- **Key Concepts** - Important principles and rationale
- **Backtesting** - Expected characteristics and trade frequency
- **Improvements** - Ideas for enhancement and customization

## Learning Progression

Start with basic strategies, then advance:

1. **[Basic RSI](basic/rsi)** - Simplest: one indicator, one asset
2. **[Basic MA Crossover](basic/ma-crossover)** - Trend following, price confirmation
3. **[Basic Bollinger Bands](basic/bollinger-bands)** - Multiple confirmations
4. **[Intermediate MACD](intermediate/macd-momentum)** - Add trend filters
5. **[Intermediate ATR Risk](intermediate/atr-risk)** - Add dynamic sizing
6. **[Intermediate Multi-Indicator](intermediate/multi-indicator)** - Consensus approach
7. **[Advanced Portfolio](advanced/portfolio)** - Multiple assets
8. **[Advanced Arbitrage](advanced/arbitrage)** - Cross-exchange operations

## Next Steps

- **[Writing Strategies](../getting-started/writing-strategies)** - Deep dive into strategy patterns and best practices
- **[Quick Reference](../getting-started/quick-reference)** - API cheat sheet
- **[API Reference](../api/indicators/rsi)** - Full indicator documentation
- **[Configuration](../getting-started/configuration)** - Set up for production
