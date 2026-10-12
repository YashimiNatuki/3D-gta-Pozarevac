# Godot proposal review: NPC perception, AI, physics and world streaming

**Reviewed:** 2026-10-12  
**Status:** engineering assessment and isolated reference implementation; not imported into the active web or Unity project.

## Decision summary

The ideas are useful; switching the game to Godot is not an immediate prerequisite. The existing work is split across a Unity/Cesium city project and a React/Three.js gameplay prototype. A Godot migration would create a third runtime and re-implement scene, georeference, asset, physics, UI and save contracts.

**Recommended target:** preserve Unity/Cesium as the candidate authoritative 3D runtime until its local project is inspected and a reproducible Unity build is proven. Treat the web game as the current gameplay/content prototype. If Unity cannot satisfy a measured requirement, run a small Godot 4.6 vertical-slice spike before committing to an engine migration. Do not migrate because of one AI snippet.

## Assessment of the newer snippet

### Good ideas worth keeping

- Squared-distance broad-phase before angular and raycast checks.
- Cached player reference, with invalidation/recache when the player node is removed or reloaded.
- A true per-NPC phase offset in addition to a 0.15 s perception cadence.
- Dot-product field-of-view test, using horizontal normalized vectors.
- A ray from eye height to several target points, with an explicit collision mask and self-exclusion.
- NavigationAgent/NavMesh for collision-aware pursuit.
- Path target throttling, AI update budgets, and simplified distant entities.
- Procedural/modular building assets, terrain material blending and LOD, when backed by measured performance budgets.

### Bugs and gaps to fix

1. **Invalid angular-axis locking.** `axis_lock_angular_x` and `axis_lock_angular_z` are not CharacterBody3D controls. CharacterBody3D is a script-driven body; keep movement/yaw under explicit control. If a physics-simulated RigidBody3D needs angular constraints, configure that body's actual rigid-body properties.
2. **The FOV angle is ambiguous.** With `fov_degrees = 65`, comparing a dot product against `cos(65°)` gives a cone with a 130° full angle. Use `cos(deg_to_rad(full_fov * 0.5))` for a variable that means full FOV.
3. **The direction should be horizontal.** Flatten both the NPC forward vector and target vector before dot-product comparison; otherwise elevation changes the viewing cone.
4. **Path following is incomplete.** The snippet changes `nav_agent.target_position` only after it has lost the player. In the visible CHASE state the navigation destination is never updated to follow a moving player.
5. **Initial path state can be invalid.** A NavigationAgent may have no useful path yet. Do not interpret its initial finished state as a valid completed investigation without checking the state/timer and assigned destination.
6. **The alleged O(1) cache is not used.** `get_first_node_in_group()` is called every perception update. Cache the node and reacquire it only when it becomes invalid. This lookup is generally not the main performance bottleneck, but the implementation contradicts its own claim.
7. **Frame staggering is only commented, not implemented.** `tick_rate = (tick_rate + 1) % 5` with the same initial phase still synchronizes many NPCs. Give each NPC a deterministic phase offset.
8. **Raycast masks need a real layer contract.** The mask must include both the player collider and world occluders. Exclude the NPC's own RID. A ray result may name a body under the player rather than the exact target root, so handle descendants intentionally.
9. **The new code allocates a fresh target-point array each LOS check.** Use a constant heights list or fixed checks. With three raycasts per check, raycasts—not the dot product—will typically dominate this portion of the work.
10. **The behavior tree/AI state is incomplete.** FLEE is declared but never implemented; awareness/suspicion, a search timeout and last-known position are missing or weak. Add only states with implemented transitions.
11. **No consistent movement/gravity path.** Movement and `move_and_slide()` must be called every physics tick; gravity must continue while the NPC is idle or investigating.
12. **Velocity interpolation needs bounded acceleration.** `lerp(..., delta * 12)` can exceed a weight of 1 after a large frame. `move_toward` with acceleration is easier to tune and remains bounded.
13. **The direct global singleton is undocumented.** The snippet assumes an `EventBus` autoload exists. A typed signal is a safer standalone contract; project wiring can connect it later.
14. **No tests or profiler evidence.** The snippet has not been compiled in a Godot project in this session. "Leak-free" and "zero-error" are not established without runtime tests and lifecycle/scene teardown checks.

## Recommended AI architecture

Use a hybrid, not "FSM or everything":

- **FSM:** reliable low-level movement modes, e.g. IDLE, PATROL, INVESTIGATE, CHASE, FLEE.
- **Utility AI:** rank tactical choices from facts such as health, danger, allies, exits, cover and current objective.
- **GOAP:** introduce only for NPCs that need multi-step planning across preconditions and world effects. It is not a drop-in replacement for perception and costs more to debug.
- **NavigationAgent/NavMesh:** move to a destination while avoiding world obstacles.
- **Perception:** candidate/range → FOV → line-of-sight → awareness/memory → state/utility decision.
- **Event signals:** report meaningful transitions, not every-frame data.
- **Simulation LOD:** near actors run full perception/physics/animation; distant actors use lower-rate decisions or aggregate simulation.

For around 500 entities, first reduce work with distance buckets, spatial partitioning, tick budgets, path-query throttling and low-detail distant simulation. Move code to C++/Rust GDExtension only after a profiler shows a specific hot loop that cannot meet budget in optimized GDScript. Compute shaders may render crowd effects, but they are not a replacement for authoritative collision, navigation, or interactive NPC state.

## Physics and renderer choices

### Jolt Physics
In Godot 4.4+, Jolt is available as a built-in alternative 3D physics engine; the legacy extension is separate and in maintenance mode. The active Unity project is not a Godot project, so enabling Godot Jolt cannot improve its Unity physics. If Godot is selected in a future migration, benchmark the relevant vehicle joints, suspension, character collisions, terrain contacts and ray queries on a test scene before switching the whole project.

Do not globally reduce collision margins or modify stabilization settings as a blind "anti-clipping" fix. Capture a reproducible failing case and tune the relevant collider/shape/project setting after comparing results.

### World chunks, HLOD and assets
The zone distances in the proposal (0–50 m, 50–200 m, 200 m+) are placeholders, not universal thresholds. Set them from profiling on the target machine and view distance. Use:
- spatial chunks for loading/unloading bounded city data;
- modular facades only for repeated building archetypes, with landmark assets reserved for recognizable places;
- separate simplified collision proxies;
- material/texture atlases and LODs;
- instancing for many copies of the same mesh/material (MultiMeshInstance3D in Godot; InstancedMesh in Three.js), not as a magical merger for arbitrary geometry;
- baked/simplified distant blocks if visual quality and occlusion remain acceptable;
- far-field cars as lightweight traffic agents that can transition to nearby interactive entities, with state handoff preserving their route and identity.

Don't add 4K textures to every nearby building by default. Texture resolution, shadow map resolution/distance, draw calls, overdraw and GPU/CPU frame time need budgets and before/after captures.

### Input buffering
Buffer discrete actions (jump, interact, dodge) for a short configurable interval and clear them on expiry, pause or modal focus loss. Do not apply action buffering indiscriminately to continuous movement inputs such as WASD.

## Corrected reference implementation (Godot 4.x)

This is a standalone example for a Godot spike, **not code for the existing React/Three.js repository**. It expects a `NavigationAgent3D` child, optional `HeadPosition` child, player in the exported group, and collision layers configured so the mask sees both the player and obstacles. Run it in a Godot project and validate its node paths/layers before using it in production.

```gdscript
extends CharacterBody3D
class_name AdvancedNPCBrain

signal npc_alerted(npc: Node3D, world_position: Vector3)

enum State { IDLE, CHASE, INVESTIGATE }

const TARGET_RAY_HEIGHTS: Array[float] = [1.65, 1.0, 0.25]
const EPSILON_SQUARED: float = 0.0001

@export var player_group: StringName = &"player"
@export_range(3.0, 100.0, 0.5) var view_distance: float = 25.0
@export_range(10.0, 170.0, 1.0) var fov_degrees: float = 110.0
@export_range(0.05, 1.0, 0.01) var perception_interval: float = 0.15
@export_flags_3d_physics var vision_collision_mask: int = 3
@export var move_speed: float = 5.5
@export var acceleration: float = 14.0
@export var turn_speed: float = 8.0
@export var search_timeout: float = 5.0
@export var repath_distance: float = 1.5
@export var gravity_strength: float = 9.8

@onready var nav_agent: NavigationAgent3D = get_node_or_null("NavigationAgent3D") as NavigationAgent3D
@onready var eye_origin: Node3D = get_node_or_null("HeadPosition") as Node3D

var target: Node3D
var current_state: int = State.IDLE

var _cos_half_fov: float = 0.0
var _vision_elapsed: float = 0.0
var _time_without_sight: float = 0.0
var _last_known_position: Vector3 = Vector3.ZERO
var _has_last_known_position: bool = false
var _last_nav_target: Vector3 = Vector3.ZERO
var _has_nav_target: bool = false


func _ready() -> void:
    if nav_agent == null:
        push_error("AdvancedNPCBrain requires a NavigationAgent3D child.")
        set_physics_process(false)
        return

    _cos_half_fov = cos(deg_to_rad(fov_degrees * 0.5))

    # Stable per-instance phase; avoids every NPC sensing in the same tick.
    var interval := maxf(perception_interval, 0.05)
    _vision_elapsed = float(get_instance_id() % 1000) / 1000.0 * interval
    target = _find_target()


func _physics_process(delta: float) -> void:
    if not is_instance_valid(target):
        target = _find_target()

    if is_instance_valid(target):
        _vision_elapsed += delta
        var interval := maxf(perception_interval, 0.05)
        if _vision_elapsed >= interval:
            _vision_elapsed = fposmod(_vision_elapsed, interval)
            _evaluate_perception()
    elif current_state != State.IDLE:
        current_state = State.IDLE
        _has_nav_target = false

    _update_state_timers(delta)
    _update_movement(delta)
    _apply_gravity(delta)
    move_and_slide()


func _find_target() -> Node3D:
    var candidate := get_tree().get_first_node_in_group(player_group)
    return candidate as Node3D


func _evaluate_perception() -> void:
    if not is_instance_valid(target):
        return

    if _can_see_target():
        _last_known_position = target.global_position
        _has_last_known_position = true
        _time_without_sight = 0.0

        if current_state != State.CHASE:
            current_state = State.CHASE
            npc_alerted.emit(self, global_position)

        _request_navigation_target(_last_known_position)
    elif current_state == State.CHASE:
        current_state = State.INVESTIGATE
        _time_without_sight = 0.0
        if _has_last_known_position:
            _request_navigation_target(_last_known_position)


func _can_see_target() -> bool:
    if not is_instance_valid(target):
        return false

    var target_position := target.global_position
    if global_position.distance_squared_to(target_position) > view_distance * view_distance:
        return false

    # Full FOV is split into half-angle. Height does not distort the horizontal cone.
    var forward := -global_transform.basis.z
    forward.y = 0.0
    var to_target := target_position - global_position
    to_target.y = 0.0

    if to_target.length_squared() <= EPSILON_SQUARED:
        return _has_line_of_sight(target_position)

    if forward.length_squared() <= EPSILON_SQUARED:
        return false

    forward = forward.normalized()
    to_target = to_target.normalized()
    if forward.dot(to_target) < _cos_half_fov:
        return false

    return _has_line_of_sight(target_position)


func _has_line_of_sight(target_position: Vector3) -> bool:
    var origin := global_position + Vector3.UP * 1.6
    if is_instance_valid(eye_origin):
        origin = eye_origin.global_position

    var space_state := get_world_3d().direct_space_state
    var exclude_rids: Array[RID] = [get_rid()]

    for target_height in TARGET_RAY_HEIGHTS:
        var point := target_position + Vector3.UP * target_height
        var query := PhysicsRayQueryParameters3D.create(
            origin,
            point,
            vision_collision_mask,
            exclude_rids
        )
        var hit := space_state.intersect_ray(query)
        if hit.is_empty():
            continue

        var collider := hit.get("collider") as Node
        if collider == target:
            return true
        if is_instance_valid(collider) and target.is_ancestor_of(collider):
            return true

    return false


func _request_navigation_target(destination: Vector3) -> void:
    var threshold := maxf(repath_distance, 0.1)
    if not _has_nav_target or _last_nav_target.distance_squared_to(destination) >= threshold * threshold:
        nav_agent.target_position = destination
        _last_nav_target = destination
        _has_nav_target = true


func _update_state_timers(delta: float) -> void:
    if current_state != State.INVESTIGATE:
        return

    _time_without_sight += delta
    var timed_out := _time_without_sight >= maxf(search_timeout, 0.1)
    var reached_last_position := nav_agent.is_navigation_finished() and _time_without_sight >= 0.8

    if timed_out or reached_last_position:
        current_state = State.IDLE
        _has_last_known_position = false
        _has_nav_target = false


func _update_movement(delta: float) -> void:
    var desired_direction := Vector3.ZERO

    if current_state == State.CHASE or current_state == State.INVESTIGATE:
        if not nav_agent.is_navigation_finished():
            var next_position := nav_agent.get_next_path_position()
            var to_next := next_position - global_position
            to_next.y = 0.0
            if to_next.length_squared() > EPSILON_SQUARED:
                desired_direction = to_next.normalized()

    var desired_velocity := desired_direction * move_speed
    velocity.x = move_toward(velocity.x, desired_velocity.x, acceleration * delta)
    velocity.z = move_toward(velocity.z, desired_velocity.z, acceleration * delta)

    if desired_direction.length_squared() > EPSILON_SQUARED:
        var target_yaw := atan2(-desired_direction.x, -desired_direction.z)
        global_rotation.y = lerp_angle(
            global_rotation.y,
            target_yaw,
            clampf(turn_speed * delta, 0.0, 1.0)
        )


func _apply_gravity(delta: float) -> void:
    if is_on_floor():
        velocity.y = 0.0
    else:
        velocity.y -= gravity_strength * delta
```

## Limitations of the reference

- It is a perception/navigation baseline, not a complete GOAP brain. It has no patrol planner, combat, flee, cover selection, group tactics, sound perception, or relationship-aware behavior.
- The ray mask and player collider layers must match the actual scene.
- It expects target ray points in the player's local vertical space and is not a crouch/cover animation system.
- `NavigationAgent3D` must have a valid navigation map and walkable destination. An unreachable destination needs diagnostics and a designed fallback; direct chase through walls is not an acceptable silent fallback.
- It has not been compiled or Play-tested in Godot in this workspace. Validate it in a minimal Godot 4.6 test scene before integrating anything into the production project.

## Test gate before accepting the AI

1. Target in/out of range and just inside/outside the horizontal FOV edge.
2. Target above/below, behind a wall, partially behind a vehicle, and behind a moving NPC.
3. Self-collider exclusion and target child-collider behavior.
4. Deleted/reloaded player node and group lookup recovery.
5. Reacquisition during investigation, successful arrival, unreachable target and timeout.
6. Multiple NPCs with staggered checks; measure raycasts and path queries per second.
7. Verify no navigation destination is reset every frame; verify the NPC stops and remains grounded.
8. Record CPU time and frame-time percentiles at target NPC counts before increasing complexity.

## Recommended implementation order

1. Correct and test perception/line-of-sight in an isolated scene.
2. Add bounded suspicion/last-known-position behavior and low-priority bark cooldown.
3. Add Utility AI for flee/investigate/chase/patrol selection.
4. Add GOAP only for important NPCs whose multi-step behavior requires it.
5. Profile, then consider a GDExtension or GPU-based crowd rendering.
6. Port the proven behavior into the chosen authoritative runtime, not into every runtime.
