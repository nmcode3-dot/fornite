# Architecture Summary

Skybreak Royale is organized around data-driven systems and a single deterministic local simulation.

## Files

- `index.html`: Menu, HUD, minimap, pause, settings, and results screens.
- `styles.css`: Responsive HUD and menu styling.
- `src/data.js`: Weapons, rarities, storm phases, build pieces, bot difficulty, POIs, and constants.
- `src/utils.js`: RNG, geometry helpers, clamping, ray/circle hit tests, formatting.
- `src/settings.js`: Save/load support for sensitivity, audio, debug telemetry, keybinds, and graphics flags.
- `src/input.js`: Keyboard and mouse state abstraction.
- `src/audio.js`: Original procedural WebAudio cues and stingers.
- `src/ui.js`: Screen switching, HUD rendering, elimination feed, result summaries.
- `src/world.js`: Island, cover, resources, and loot generation.
- `src/game.js`: Match flow, player movement, bots, combat, storm, building, harvesting, pickups, rendering, and win/loss checks.
- `tests/validate.mjs`: Automated data/world validation.

## Runtime Flow

`main.js` loads settings, creates input/UI/game instances, binds menu buttons, and starts the animation loop. The `Game` class owns match state and updates systems in a fixed order each frame:

1. Player input and build/combat actions.
2. Storm phase timing and damage.
3. Actor movement, landing, cooldowns, and collisions.
4. Bot decision making and bot actions.
5. Projectiles, particles, and loot interactions.
6. Win/loss checks, HUD updates, and rendering.

## Data-Driven Content

Weapons, build pieces, storm phases, loot rarities, bot difficulty, and POIs are plain data objects. Adding a new weapon or changing the loot curve should not require rewriting combat or UI logic.

## Multiplayer Upgrade Path

The local simulation is structured so authoritative multiplayer can be layered in later:

- Split `Game` into client prediction, server authority, and shared simulation packages.
- Convert actors, loot, builds, projectiles, and storm state into replicated entity snapshots.
- Move damage, pickups, building validation, storm timing, and win checks to the server.
- Replace direct input effects with command messages.
- Add interpolation/reconciliation for remote actors.
- Add lobby matchmaking, team assignment, revive/downed state replication, and anti-cheat validation.
- Keep data definitions synchronized between client and server using versioned content manifests.
