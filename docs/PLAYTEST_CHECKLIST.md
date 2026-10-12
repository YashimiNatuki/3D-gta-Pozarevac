# Gameplay smoke-test checklist

Use this checklist before merging changes that affect movement, the camera, collisions, or the city scene.

## Player controls

- [ ] `WASD` and arrow keys move the player relative to the camera.
- [ ] Diagonal movement is not faster than straight movement.
- [ ] Hold `Shift` while moving to sprint; release it to return to walking speed.
- [ ] Press `Space` to jump; the browser page does not scroll while using gameplay controls.
- [ ] Type into chat, search, and other form controls: gameplay movement and jumping must not trigger.
- [ ] Focus a button or modal and press `Space` or an arrow key: the game must not hijack the control.
- [ ] Hold a movement key, switch tabs or minimize the window, then return: the player must not continue moving.
- [ ] Release movement keys after changing focus: no key should remain stuck.

## Camera

- [ ] Drag with the mouse to orbit the follow camera.
- [ ] Use the mouse wheel to zoom; the camera remains within its configured minimum and maximum distances.
- [ ] Change camera mode through the HUD and confirm the selected mode remains usable.

## City and collision regression

- [ ] Walk around the central monolith, planters, benches, and building edges.
- [ ] Confirm collision resolution still permits sliding along obstacle edges.
- [ ] Verify traffic, weather, sound, quests, and nearby-POI interactions still update during movement.
- [ ] Confirm the Požarevac scene loads with its existing world origin and map layers.

## Scope notes

This checklist is manual; it is not an automated test suite. The input-stability change should not alter city coordinates, Cesium configuration, saved progression, scene assets, or backend data.
