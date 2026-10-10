# City Mission Progression Expansion Implementation Plan

> **For agentic workers:** Native implementation in the existing GTA Požarevac TypeScript checkout.

**Goal:** Continue city and mission logic beyond Vašarište with explicit central and neighborhood routes that use the existing checkpoint, reward and save-reconciliation contracts.

**Architecture:** Extend the existing city district mission catalog with contracts for Trg Radomira Vujovića, Đurđeve rupe and the central Korzo/park connection. Keep mission IDs stable, preserve old saves through catalog reconciliation, and validate coverage with invariant tests.

**Tech Stack:** React, TypeScript, existing DynamicMissionEngine and Three.js mission beacon pipeline.

## Global constraints

- Do not change AiChatBrat files from the GTA checkout.
- Keep the original intro media untouched.
- Use existing coordinate and `DynamicMission` contracts; no new runtime dependency.
- Do not claim real-world geodetic accuracy for gameplay coordinates.

## Review focus

- New missions are available without requiring the player to visit Vašarište first.
- Every route has at least two valid checkpoints and a reward.
- Existing save reconciliation adds new contracts without duplicating IDs.
- Existing HUD/beacon logic can activate and complete the new mission types.

## Tasks

- [x] Add central/neighbor district contracts outside Vašarište.
- [x] Add coverage and uniqueness invariants.
- [x] Run lint, invariants, build and diff hygiene.
- [x] Commit/push only to the GTA feature branch.
