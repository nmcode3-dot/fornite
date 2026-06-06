export const GAME = {
  worldSize: 2800,
  playerRadius: 19,
  buildCell: 72,
  botCount: 17,
  matchCountdown: 3,
  dropAltitude: 460,
  glideSpeed: 245,
  landingSpeed: 120,
  interactRange: 62,
  pickupRange: 58,
  harvestRange: 68,
  reviveEnabled: false
};

export const RARITIES = {
  common: { label: "Common", color: "#d8e2ea", weight: 52, damage: 1, spread: 1 },
  uncommon: { label: "Uncommon", color: "#66df8d", weight: 28, damage: 1.08, spread: 0.94 },
  rare: { label: "Rare", color: "#58a9ff", weight: 14, damage: 1.16, spread: 0.88 },
  epic: { label: "Epic", color: "#c97dff", weight: 5, damage: 1.26, spread: 0.8 },
  mythic: { label: "Mythic", color: "#ffce5b", weight: 1, damage: 1.38, spread: 0.72 }
};

export const WEAPONS = {
  assault: {
    name: "Pulse Carbine",
    type: "hitscan",
    ammoType: "light",
    magazine: 30,
    fireRate: 8.3,
    reload: 1.55,
    damage: 24,
    headshot: 1.75,
    range: 850,
    falloffStart: 450,
    falloffEnd: 850,
    spread: 0.035,
    recoil: 0.018,
    pelletCount: 1,
    color: "#48e0a4"
  },
  shotgun: {
    name: "Breach Scatter",
    type: "hitscan",
    ammoType: "shell",
    magazine: 6,
    fireRate: 1.1,
    reload: 2.1,
    damage: 12,
    headshot: 1.35,
    range: 320,
    falloffStart: 120,
    falloffEnd: 320,
    spread: 0.18,
    recoil: 0.055,
    pelletCount: 9,
    color: "#ffcf5a"
  },
  smg: {
    name: "Sprinter SMG",
    type: "hitscan",
    ammoType: "light",
    magazine: 36,
    fireRate: 12.5,
    reload: 1.35,
    damage: 16,
    headshot: 1.5,
    range: 480,
    falloffStart: 210,
    falloffEnd: 480,
    spread: 0.06,
    recoil: 0.024,
    pelletCount: 1,
    color: "#f18bd2"
  },
  sniper: {
    name: "Horizon Lance",
    type: "hitscan",
    ammoType: "heavy",
    magazine: 4,
    fireRate: 0.55,
    reload: 2.35,
    damage: 82,
    headshot: 2.15,
    range: 1300,
    falloffStart: 900,
    falloffEnd: 1300,
    spread: 0.008,
    recoil: 0.08,
    pelletCount: 1,
    color: "#88d8ff"
  },
  explosive: {
    name: "Arc Burster",
    type: "projectile",
    ammoType: "rocket",
    magazine: 3,
    fireRate: 0.8,
    reload: 2.4,
    damage: 92,
    splash: 150,
    projectileSpeed: 480,
    fuse: 1.15,
    range: 720,
    spread: 0.025,
    recoil: 0.045,
    pelletCount: 1,
    color: "#ff7d5c"
  }
};

export const CONSUMABLES = {
  medkit: { name: "Patch Kit", kind: "heal", amount: 45, useTime: 1.2, color: "#ffffff" },
  shield: { name: "Charge Cell", kind: "shield", amount: 35, useTime: 1.0, color: "#64cfff" }
};

export const AMMO_PACKS = {
  light: { name: "Light Cells", amount: [24, 46], color: "#d9f5ff" },
  shell: { name: "Scatter Shells", amount: [8, 16], color: "#ffe2a6" },
  heavy: { name: "Heavy Rods", amount: [3, 8], color: "#c6e4ff" },
  rocket: { name: "Arc Charges", amount: [1, 3], color: "#ffc1a6" }
};

export const BUILD_PIECES = {
  wall: { name: "Wall", key: "Q", cost: { wood: 22, stone: 18, metal: 14 }, durability: 130, w: 72, h: 16, color: "#a67243" },
  floor: { name: "Floor", key: "E", cost: { wood: 18, stone: 14, metal: 12 }, durability: 110, w: 72, h: 72, color: "#6f955a" },
  ramp: { name: "Ramp", key: "R", cost: { wood: 28, stone: 22, metal: 18 }, durability: 120, w: 72, h: 72, color: "#b68f5b" },
  roof: { name: "Roof", key: "T", cost: { wood: 26, stone: 20, metal: 16 }, durability: 120, w: 72, h: 72, color: "#8bb7c2" }
};

export const BOT_DIFFICULTIES = {
  scout: { aimError: 0.14, reaction: 0.55, aggression: 0.45, buildChance: 0.08 },
  striker: { aimError: 0.08, reaction: 0.34, aggression: 0.7, buildChance: 0.16 },
  ace: { aimError: 0.045, reaction: 0.22, aggression: 0.9, buildChance: 0.28 }
};

export const STORM_PHASES = [
  { wait: 15, shrink: 28, radius: 1120, damage: 1 },
  { wait: 12, shrink: 28, radius: 820, damage: 2 },
  { wait: 10, shrink: 28, radius: 560, damage: 4 },
  { wait: 8, shrink: 25, radius: 310, damage: 7 },
  { wait: 6, shrink: 22, radius: 120, damage: 11 }
];

export const POIS = [
  { name: "Glassbay", x: -760, y: -690, w: 430, h: 330, color: "#3f6e82" },
  { name: "Forge Yard", x: 590, y: -600, w: 420, h: 330, color: "#755d52" },
  { name: "Pinewatch", x: -720, y: 520, w: 420, h: 360, color: "#365f47" },
  { name: "Sunline Farms", x: 420, y: 540, w: 520, h: 350, color: "#82743c" },
  { name: "Switchback Hills", x: 40, y: -40, w: 520, h: 420, color: "#546d52" }
];
