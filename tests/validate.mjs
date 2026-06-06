import { BUILD_PIECES, GAME, STORM_PHASES, WEAPONS } from "../src/data.js";
import { Rng } from "../src/utils.js";
import { createLoot, createWorld } from "../src/world.js";

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(GAME.botCount >= 8, "bot count should support a battle royale loop");
assert(Object.keys(WEAPONS).length >= 5, "weapon system should include five variants");
for (const [key, weapon] of Object.entries(WEAPONS)) {
  assert(weapon.damage > 0, `${key} damage must be positive`);
  assert(weapon.magazine > 0, `${key} magazine must be positive`);
  assert(weapon.fireRate > 0, `${key} fireRate must be positive`);
  assert(weapon.range > 0, `${key} range must be positive`);
}
for (const [key, piece] of Object.entries(BUILD_PIECES)) {
  assert(piece.durability > 0, `${key} durability must be positive`);
  assert(Object.values(piece.cost).every(v => v > 0), `${key} needs material costs`);
}
assert(STORM_PHASES.length >= 4, "storm needs multiple shrinking phases");
for (let i = 1; i < STORM_PHASES.length; i++) {
  assert(STORM_PHASES[i].radius < STORM_PHASES[i - 1].radius, "storm radii must shrink");
}

const rng = new Rng(42);
const world = createWorld(rng);
const loot = createLoot(rng, world);
assert(world.resources.length >= 100, "world should have harvestable resources");
assert(world.cover.length >= 30, "world should have authored cover");
assert(loot.length >= 100, "world should spawn enough loot");
assert(loot.some(item => item.kind === "weapon"), "loot should include weapons");
assert(loot.some(item => item.kind === "consumable"), "loot should include consumables");
assert(loot.some(item => item.kind === "ammo"), "loot should include ammo");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validation passed: data, world generation, loot, storm, weapons, and build costs are internally consistent.");
