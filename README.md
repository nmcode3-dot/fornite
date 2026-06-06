# Skybreak Royale

Skybreak Royale is an original, legally distinct, browser-playable battle royale vertical slice. It uses no Fortnite assets, names, map layouts, icons, sounds, trademarks, or proprietary content. The game is built as a local HTML5 Canvas project because Unreal Engine 5 is not available in this workspace.

## Run

```powershell
cd C:\Users\reena\Documents\Codex\2026-06-05\files-mentioned-by-the-user-pasted\outputs\skybreak-royale
.\run-server.cmd
```

Open `http://localhost:4173`.

You can also run validation checks:

```powershell
npm.cmd test
```

Run a full browser smoke test:

```powershell
npm.cmd run smoke
```

## Controls

- `WASD`: Move
- `Shift`: Sprint
- `Ctrl`: Crouch
- `Mouse`: Aim
- `Left mouse`: Fire, use selected consumable, or place build piece in build mode
- `Right mouse`: Aim tighter spread
- `1-5`: Inventory slots
- `R`: Reload
- `F`: Pick up loot or harvest nearby resources
- `B`: Toggle build mode
- `Q/E`: Cycle build piece
- `Space`: Descend faster while gliding
- `Esc`: Pause

## Gameplay

Start from the main menu, launch a solo bot match, glide onto Skybreak Island, collect loot, harvest wood/stone/metal, build defenses, survive the shrinking storm, and eliminate all opponents. The match ends with a win or loss screen that reports placement, eliminations, damage, accuracy, and survival time.

## Browser Support

The project is intentionally dependency-free and should run in current Chromium, Edge, Firefox, or Safari builds. It uses Canvas 2D, ES modules, localStorage, and WebAudio.
