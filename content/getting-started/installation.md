---
sidebar_position: 1
description: "Install Wisp SDK for event-driven algorithmic trading. Set up Go environment, clone repository, build CLI, and initialize your first strategy."
keywords: ["wisp installation", "setup", "Go dependencies", "trading bot", "algorithm"]
---

# Installation

Get up and running with wisp's event-driven trading framework in minutes.

## Prerequisites

You'll need Go installed to build and use wisp:

- **Go 1.24+** - [Install Go](https://go.dev/doc/install)

Check your Go version:

```bash
go version
```

Wisp uses an **event-driven architecture** where strategies own their execution loops and push signals asynchronously. This enables high-performance, responsive trading systems.

## Install wisp CLI

Download the wisp repository from GitHub:

```bash
git clone https://github.com/wisp-trading/wisp
cd wisp
```

Build and install wisp:

```bash
make install
```

Verify the installation:

```bash
wisp --version
```


## Create a New Strategy

Initialize a new wisp project:

```bash
wisp init my-strategy
cd my-strategy
```

This creates:
- `strategy.go` - Your strategy implementation
- `go.mod` - Go dependencies
- `config.yaml` - wisp configuration
- `README.md` - Project documentation

## Project Structure

```
my-strategy/
├── strategy.go      # Your strategy code
├── go.mod           # Go module
├── config.yaml      # wisp config
└── README.md        # Documentation
```

## Understanding the Architecture

Wisp uses an **event-driven execution model**:

1. **Strategies are self-directed**: Each strategy owns its execution goroutine via `Start(ctx context.Context)`
2. **Asynchronous signals**: Strategies call `wisp.Emit(signal)` to push trade signals
3. **Domain separation**: Market data is organized by market type (`Spot()`, `Perp()`, `Predict()`)
4. **Observable lifecycle**: `Stop(ctx)` cleanly shuts down, with status observability

See [Writing Strategies](writing-strategies) for full pattern examples.

## Backtest Your Strategy

Test your strategy with historical data:

```bash
wisp backtest
```

This runs your strategy against past market data and shows performance metrics:
- Total return
- Win rate
- Maximum drawdown
- Sharpe ratio
- Number of trades

### Backtest Options

```bash
# Backtest specific date range
wisp backtest --start 2024-01-01 --end 2024-12-31

# Use specific exchange
wisp backtest --exchange binance

# Specify starting capital
wisp backtest --capital 10000

# Detailed output
wisp backtest --verbose
```

## Deploy to Live Trading

Once you're satisfied with backtest results, deploy your strategy:

```bash
wisp live
```

This starts your strategy in live trading mode. wisp will:
1. Connect to your configured exchange(s)
2. Start monitoring markets in real-time
3. Execute trades based on your strategy signals
4. Log all activity

### Live Trading Options

```bash
# Dry run (paper trading - no real orders)
wisp live --dry-run

# Specific exchange
wisp live --exchange binance

# Enable verbose logging
wisp live --verbose

# Custom config file
wisp live --config production.yaml
```

## Configuration

Before running live, configure your exchange API keys in `config.yaml`:

```yaml
exchanges:
  binance:
    api_key: "your-api-key"
    api_secret: "your-api-secret"
    testnet: false
  
  bybit:
    api_key: "your-api-key"
    api_secret: "your-api-secret"
    testnet: false

strategy:
  name: "my-strategy"
  interval: "1h"
  assets:
    - "BTC"
    - "ETH"
```

:::warning
Never commit sensitive config files to version control. Keep config files with API keys out of your repository.
:::

## Quick Commands Reference

```bash
# Create new strategy
wisp init <name>

# Backtest strategy
wisp backtest

# Run live (paper trading)
wisp live --dry-run

# Run live (real trading)
wisp live

# View logs
wisp logs

# Check status
wisp status

# Stop running strategy
wisp stop
```

## Next Steps

- **[Quick Reference](quick-reference)** - Learn the wisp API basics
- **[Writing Strategies](writing-strategies)** - Deep dive into strategy development
- **[Configuration](configuration)** - Detailed config options
