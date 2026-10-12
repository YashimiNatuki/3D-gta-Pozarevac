# HQ Game: NPC Relationship & Memory Engine

## Purpose

This deterministic service gives each NPC a persistent-feeling social state instead of relying on improvised dialogue alone. It is renderer-agnostic and does not spawn entities, call AI providers, or persist data directly.

## State model

Each NPC tracks four bounded scores from 0 to 100: **trust**, **respect**, **fear**, and **loyalty**. Player actions such as favors, shared risk, protection, apologies, insults, threats, lies, bribes, betrayal, and neglect modify those scores. Stable event IDs make callbacks idempotent, so a retried mission-completion event cannot award relationship gains twice. Recent memories are capped by a configurable limit.

## Gameplay outputs

`getInteractionOutcome()` returns a constrained disposition/action pair. It can gate mission offers, adjust trade-price multipliers, refuse hostile interactions, and escalate high-wanted encounters with duty-bound officers. The UI or dialogue layer can map the returned `dialogueKey` to localized text; the key itself is not executable gameplay code.

## Time and persistence

`applyDecay(npcId, elapsedGameHours)` supports game-time simulation: fear fades, trust/respect drift slowly toward neutral, and loyalty gradually follows trust. The service remains in-memory by design. Integrate snapshots through the existing game-progress save layer rather than introducing a second persistence system.

## Validation

```bash
npm run test:npc-relations
npm run lint
npm run build
```

The invariant test covers clamping, idempotent event processing, bounded memory, disposition transitions, mission gating, relationship decay, missing NPC handling, and officer escalation.
