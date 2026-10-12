# NPC perception and response — implementation design

**Target:** Unity/C# authoritative game runtime unless the Unity audit changes the engine decision.  
**Status:** implementation plan; the supplied Godot snippet is reviewed but not copied into the current TypeScript project.

## 1. Review of the supplied Godot starter code

The snippet is a useful teaching sketch, but it is not production-ready. Specific gaps:
1. It queries the player group every physics frame; resolve/cache the target and refresh when it is invalid.
2. The FOV compares the full 3D angle, so target elevation affects the horizontal viewing cone. Flatten the direction vectors or use a horizontal dot-product test.
3. The ray query does not exclude the NPC's own collider. Self-hit can make visibility always false; exclude the NPC RID and account for player collider children.
4. It moves directly toward the player and can push into walls; use a NavigationAgent/NavMesh path and collision-aware movement.
5. CHASE drops to IDLE instantly when line of sight is lost, producing state flicker. Use last-known position, suspicion and a configurable search/grace timer.
6. It writes velocity only while chasing and has no consistent gravity/grounded update; motion must be updated consistently for every state.
7. It has no facing rotation, patrol, acceleration, speed cap, investigation state, attack/interact range or cleanup of previous velocity.
8. A single ray from root to player root can hit the floor or miss a child collider; cast from a reasonable eye position to a chosen target point, with an explicit layer mask.
9. The absolute angle comparison is correct only with a deliberate half-angle convention; configure/document whether the inspector value is a half-angle or a full FOV.
10. It has no tests for boundaries, obstacle visibility, invalid/despawned player, or transitions.

The claim that 90% of stuck NPCs are NavMesh baking issues is not evidence-based and should not become a debugging rule. Diagnose geometry, navigation, collider layers, state transitions and velocity separately.

## 2. Perception pipeline

1. **Candidate acquisition:** cache the player target; update only when missing or invalid.
2. **Distance check:** squared distance first to avoid unnecessary angle/raycast work.
3. **Horizontal FOV:** flatten to ground plane and compare dot product with `cos(halfFov)`.
4. **Occlusion:** raycast from eye/vision origin to chest/head point; exclude self and use explicit obstacle/player layers.
5. **Awareness memory:** update a suspicion/awareness value with bounded increments/decrements. Seeing a weapon/running/known hostile may alter the rate only if the game design requires it.
6. **State selection:** explicit transitions among PATROL, IDLE, INVESTIGATE, SEARCH, CHASE, RETURN and optionally COMBAT. Keep transition reasons debuggable.
7. **Navigation:** set a destination through NavMesh/NavigationAgent; stop at arrival and test path validity.
8. **Presentation:** rotate toward locomotion/target, blend animation, select a voiced bark, update HUD indicators only for meaningful events.

## 3. Suggested state machine

```text
PATROL ↔ IDLE
   │ perceive
   ▼
INVESTIGATE ── no evidence/time elapsed ──► RETURN/PATROL
   │ visual confirmation
   ▼
CHASE ── loses sight ──► SEARCH(lastKnownPosition)
  ▲                           │ timeout
  └──── reacquires target ────┘
                              ▼
                           RETURN/PATROL
```

Use a state enum or state objects, not independent booleans that can conflict. State transitions should have entry/exit handlers so audio, animation, navigation and alert/UI side effects are applied once.

## 4. Tuning defaults for a prototype

The following are starting values to test, not sourced truths:
- Awareness update: 5–10 Hz, separate from every-render-frame UI work.
- Patrol/ambient perception: 8–12 m; police/rival NPCs configurable by role.
- Horizontal half-FOV: 45–60 degrees for a broad prototype cone; narrower/wider per role.
- Lost-vision search: 3–8 seconds, with a last-known position.
- Repeated line-of-sight raycast: only after distance and FOV pass; use a per-NPC timer/central scheduler.
- Bark cooldown: per NPC and category plus a global ambient budget.
- Navigation destination update: on meaningful target movement or a bounded timer, not every frame unless the agent API requires it.

Tune on the actual world scale and playable camera. Do not mix Three.js game units, Unity meters, and geographic meters without a documented scale conversion.

## 5. Performance

For many NPCs:
- spatial grid/hash to acquire candidates locally;
- perception scheduler with different update budgets for distant vs nearby NPCs;
- distance/FOV broadphase before raycasts;
- raycast layers and simplified colliders;
- event-driven mission/relationship changes rather than polling every UI component;
- LOD/animation throttling for distant actors;
- bounded memory/logs; no unbounded per-frame event journal.

The existing browser feature branches already contain services described as `spatialHash.ts`, `npcPrompt.ts`, `npcRelationshipEngine.ts`, `pedestrianPanic.ts` and `gameDirector.ts`. They should inform the port, but verify their behavior and tests in the final selected branch before adopting them.

## 6. Test matrix

- Target just inside/outside vision range.
- Target just inside/outside FOV edge.
- Target directly above/below or behind NPC.
- Clear line-of-sight vs a wall, glass policy, terrain ridge and NPC's own collider.
- Player child collider vs root identity.
- Target despawn/scene reload.
- NPC loses sight then reacquires before search timeout.
- NPC loses sight beyond timeout and returns to patrol.
- Navigation path blocked/invalid; agent unable to reach target.
- Multiple NPCs detect one player without unbounded raycast or duplicate bark load.
- Pause/window focus changes do not leave movement/audio stuck.
- Repeatable seeded test proves deterministic transitions where applicable.

## 7. Integration rule

Do not put a second Godot NPC runtime beside Unity/Three.js just to reuse the snippet. Implement one authoritative NPC system for the chosen runtime, translate its logic and contracts deliberately, and use any other engine only for standalone prototypes or asset-generation workflows.
