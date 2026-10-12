# Gameplay invariant tests

Tests should protect deterministic behavior and cross-system invariants, not merely test whether a component renders.

Current/future areas to cover on the final selected branch:
- mission gate/time/checkpoints/reward idempotency;
- old-save migration and progress preservation;
- turf ownership and mission catalogue reconciliation;
- market item identity, quantities and allowed interaction zones;
- NPC perception/relationship transition boundaries;
- audio ducking cleanup and phone mission focus;
- static/dynamic collision and player input cleanup;
- intro/video range/URL validation;
- asset loading fallback and city-data origin/scale contract.

Use the commands in the root README for the checked-out branch. A manual test checklist must remain labelled manual; do not claim automated coverage for an item without a test.
