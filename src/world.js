import { AMMO_PACKS, CONSUMABLES, GAME, POIS, RARITIES, WEAPONS } from "./data.js";
import { clamp } from "./utils.js";

export function createWorld(rng) {
  const half = GAME.worldSize / 2;
  const resources = [];
  const cover = [];
  const roads = [
    { x: -80, y: -half, w: 160, h: GAME.worldSize },
    { x: -half, y: -80, w: GAME.worldSize, h: 160 },
    { x: -920, y: -780, w: 1640, h: 90 },
    { x: -760, y: 650, w: 1460, h: 80 }
  ];

  for (const poi of POIS) {
    for (let i = 0; i < 10; i++) {
      cover.push({
        kind: "building",
        x: poi.x + rng.range(-poi.w / 2, poi.w / 2),
        y: poi.y + rng.range(-poi.h / 2, poi.h / 2),
        w: rng.range(46, 92),
        h: rng.range(38, 84),
        color: poi.color,
        hp: 220
      });
    }
  }

  for (let i = 0; i < 170; i++) {
    const type = rng.weighted([
      { type: "wood", weight: 52 },
      { type: "stone", weight: 30 },
      { type: "metal", weight: 18 }
    ]);
    const x = rng.range(-half + 70, half - 70);
    const y = rng.range(-half + 70, half - 70);
    resources.push({
      id: `res-${i}`,
      type: type.type,
      x,
      y,
      r: type.type === "wood" ? rng.range(16, 25) : rng.range(14, 22),
      amount: rng.int(35, 90),
      hp: type.type === "metal" ? 120 : type.type === "stone" ? 95 : 70
    });
  }

  return {
    half,
    resources,
    cover,
    roads,
    pois: POIS,
    clampPoint(actor) {
      actor.x = clamp(actor.x, -half + 20, half - 20);
      actor.y = clamp(actor.y, -half + 20, half - 20);
    }
  };
}

export function createLoot(rng, world) {
  const loot = [];
  const weaponKeys = Object.keys(WEAPONS);
  const rarityEntries = Object.entries(RARITIES).map(([key, value]) => ({ key, ...value }));
  let id = 0;

  const add = (x, y, item) => loot.push({ id: `loot-${id++}`, x, y, bob: rng.range(0, Math.PI * 2), ...item });

  for (const poi of world.pois) {
    for (let i = 0; i < 16; i++) add(
      poi.x + rng.range(-poi.w / 2, poi.w / 2),
      poi.y + rng.range(-poi.h / 2, poi.h / 2),
      randomLootItem(rng, weaponKeys, rarityEntries)
    );
  }

  for (let i = 0; i < 70; i++) add(
    rng.range(-world.half + 80, world.half - 80),
    rng.range(-world.half + 80, world.half - 80),
    randomLootItem(rng, weaponKeys, rarityEntries)
  );

  return loot;
}

export function randomLootItem(rng, weaponKeys = Object.keys(WEAPONS), rarityEntries = Object.entries(RARITIES).map(([key, value]) => ({ key, ...value }))) {
  const roll = rng.next();
  if (roll < 0.5) {
    const rarity = rng.weighted(rarityEntries);
    const weaponKey = rng.pick(weaponKeys);
    const def = WEAPONS[weaponKey];
    return {
      kind: "weapon",
      weaponKey,
      rarity: rarity.key,
      name: `${RARITIES[rarity.key].label} ${def.name}`,
      color: RARITIES[rarity.key].color,
      mag: def.magazine,
      def
    };
  }
  if (roll < 0.72) {
    const key = rng.pick(Object.keys(AMMO_PACKS));
    const pack = AMMO_PACKS[key];
    return { kind: "ammo", ammoType: key, name: pack.name, amount: rng.int(pack.amount[0], pack.amount[1]), color: pack.color };
  }
  if (roll < 0.9) {
    const key = rng.pick(Object.keys(CONSUMABLES));
    const def = CONSUMABLES[key];
    return { kind: "consumable", consumableKey: key, name: def.name, color: def.color, count: 1, def };
  }
  const mat = rng.pick(["wood", "stone", "metal"]);
  return { kind: "material", material: mat, name: `${mat[0].toUpperCase()}${mat.slice(1)} Bundle`, amount: rng.int(32, 70), color: mat === "wood" ? "#bf8a55" : mat === "stone" ? "#aab0ad" : "#9fc0cc" };
}
