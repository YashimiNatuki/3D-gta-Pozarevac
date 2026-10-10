# Citywide Mission Expansion Implementation Plan

> **For agentic workers:** Native implementation in the existing GTA Požarevac TypeScript checkout.

**Goal:** Expand mission coverage beyond Vašarište so every major Požarevac district has a visible, playable route and checkpoint contract.

**Architecture:** Keep the existing `DynamicMission` and `reconcileMissionCatalog()` contracts. Add a dedicated citywide catalog constant in `dynamicMissionEngine.ts`, spread it into the initial definitions, and let existing App checkpoint handling, HUD rendering, rewards and save reconciliation do the runtime work.

**Tech Stack:** React, TypeScript, Three.js, existing DynamicMissionEngine, invariant tests.

## Global constraints

- Do not modify AiChatBrat from the GTA checkout.
- Preserve existing mission IDs, saved progress and reward semantics.
- Every new mission must use existing mission types and coordinate conventions.
- No new dependency or external API key.

## Review focus

- Save files created before the catalog expansion still reconcile and receive new missions.
- Each district mission has at least one checkpoint and finite coordinates.
- A mission can be activated under the existing time-of-day rules.
- HUD can render all new mission titles and checkpoint labels without overflow.
- Existing mission IDs and reward values remain unchanged.

## Tasks

- [x] Add a citywide catalog covering Đura, Tabačka, Buvljak, Gradski Park, Čačalica, Tulba and Hipodrom.
- [x] Include the catalog in `INITIAL_DYNAMIC_MISSIONS` without replacing existing missions.
- [x] Add invariant assertions for district coverage, unique IDs and valid checkpoints.
- [x] Run lint, invariants, build and diff hygiene.
- [ ] Commit and push only to `feat/pozarevac-landmarks-3d`.
