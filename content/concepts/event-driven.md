---
sidebar_position: 1
description: "Understand Wisp's event-driven architecture: strategy-owned run loops, asynchronous signal emission, and clean lifecycle management."
keywords: ["event-driven architecture", "strategy run loop", "async signals", "wisp sdk"]
---

# Event-Driven Architecture

Wisp uses an **event-driven model** where each strategy owns its execution loop and emits signals asynchronously.

Instead of waiting for a framework callback, your strategy decides *when* to evaluate markets and *when* to act.

## Core Flow

1. `Start(ctx)` launches your strategy runner in a goroutine.
2. `run(ctx)` controls timing with tickers/channels.
3. Strategy reads market data and indicators.
4. Strategy emits signals with `Emit()`.
5. `Stop(ctx)` shuts everything down cleanly.

This keeps strategy logic explicit, testable, and easy to reason about.

## Why This Model Works

- **Deterministic timing**: You choose intervals and trigger conditions.
- **Non-blocking execution**: Signal emission does not block strategy analysis.
- **Clear ownership**: Lifecycle is managed in your strategy, not hidden callbacks.
- **Scales cleanly**: Multiple strategies and assets can run in parallel.

## Minimal Pattern

```go
func (s *MyStrategy) Start(ctx context.Context) error {
    go s.run(ctx)
    return nil
}

func (s *MyStrategy) run(ctx context.Context) {
    ticker := time.NewTicker(time.Minute)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            // analyze -> decide -> emit
            signal := s.w.Spot().Signal(s.name).
                BuyMarket(s.pair, connector.Binance, decimal.NewFromFloat(0.1)).
                Build()
            s.w.Emit(signal)
        }
    }
}
```

## Lifecycle Guidelines

- Keep `Start(ctx)` non-blocking.
- Respect `ctx.Done()` in every select loop.
- Always release resources (`ticker.Stop()`, channel closures where needed).
- Use status/log outputs to make decisions observable.

## Related Docs

- [Writing Strategies](/getting-started/writing-strategies)
- [Quick Reference](/getting-started/quick-reference)
- [Installation](/getting-started/installation#understanding-the-architecture)

