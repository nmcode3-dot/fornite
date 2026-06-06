import { AudioBus } from "./audio.js";
import { BOT_DIFFICULTIES, BUILD_PIECES, GAME, RARITIES, STORM_PHASES, WEAPONS } from "./data.js";
import { createLoot, createWorld, randomLootItem } from "./world.js";
import { angleTo, clamp, distance, formatTime, invLerp, lerp, normalizeAngle, normalizeVector, rayCircle, Rng } from "./utils.js";

const botNames = ["Mica", "Vesper", "Juno", "Orbit", "Sable", "Vale", "Nyx", "Kite", "Rook", "Echo", "Sol", "Pax", "Iris", "Flux", "Nero", "Bex", "Quill", "Ari"];

function createActor(id, x, y, isPlayer = false) {
  return {
    id,
    name: isPlayer ? "You" : id,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: GAME.playerRadius,
    health: 100,
    shield: isPlayer ? 50 : 25,
    alive: true,
    isPlayer,
    altitude: GAME.dropAltitude,
    gliding: true,
    fireCooldown: 0,
    reloadTimer: 0,
    useTimer: 0,
    activeSlot: 0,
    inventory: [null, null, null, null, null],
    ammo: { light: 64, shell: 12, heavy: 6, rocket: 2 },
    materials: { wood: 120, stone: 80, metal: 50 },
    kills: 0,
    damage: 0,
    shots: 0,
    hits: 0,
    target: null,
    ai: null
  };
}

export class Game {
  constructor(canvas, mapCanvas, input, ui, settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mapCanvas = mapCanvas;
    this.mapCtx = mapCanvas.getContext("2d");
    this.input = input;
    this.ui = ui;
    this.settings = settings;
    this.audio = new AudioBus(settings);
    this.rng = new Rng(732198);
    this.state = "menu";
    this.time = 0;
    this.hint = "";
    this.buildMode = false;
    this.buildPiece = "wall";
    this.camera = { x: 0, y: 0, shake: 0 };
    this.stats = { eliminations: 0, damage: 0, shots: 0, hits: 0, survivalTime: 0, placement: 1 };
    this.world = createWorld(this.rng);
    this.loot = [];
    this.builds = [];
    this.projectiles = [];
    this.particles = [];
    this.bots = [];
    this.player = createActor("player", 0, 0, true);
    this.player.alive = false;
    this.storm = {
      phase: 0,
      center: { x: 0, y: 0 },
      nextCenter: { x: 0, y: 0 },
      radius: 1300,
      startRadius: 1300,
      targetRadius: 1120,
      timer: 0,
      timeRemaining: 0,
      isShrinking: false,
      damage: 1
    };
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(window.innerWidth * ratio);
    this.canvas.height = Math.floor(window.innerHeight * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
  }

  reset() {
    this.rng = new Rng(732198);
    this.world = createWorld(this.rng);
    this.loot = createLoot(this.rng, this.world);
    this.builds = [];
    this.projectiles = [];
    this.particles = [];
    this.feed = [];
    this.time = 0;
    this.matchTime = 0;
    this.countdown = GAME.matchCountdown;
    this.state = "countdown";
    this.hint = "";
    this.buildMode = false;
    this.buildPiece = "wall";
    this.stats = { eliminations: 0, damage: 0, shots: 0, hits: 0, survivalTime: 0, placement: GAME.botCount + 1 };
    this.storm = {
      phase: 0,
      center: { x: this.rng.range(-260, 260), y: this.rng.range(-260, 260) },
      nextCenter: { x: this.rng.range(-360, 360), y: this.rng.range(-360, 360) },
      radius: 1450,
      startRadius: 1450,
      targetRadius: STORM_PHASES[0].radius,
      timer: STORM_PHASES[0].wait,
      timeRemaining: STORM_PHASES[0].wait,
      isShrinking: false,
      damage: STORM_PHASES[0].damage
    };
    this.player = createActor("player", this.rng.range(-560, 560), -1220, true);
    this.giveStarter(this.player);
    this.bots = [];
    for (let i = 0; i < GAME.botCount; i++) {
      const bot = createActor(botNames[i] || `Bot ${i + 1}`, this.rng.range(-1220, 1220), this.rng.range(-1220, 1220));
      bot.ai = {
        difficulty: this.rng.pick(Object.keys(BOT_DIFFICULTIES)),
        think: this.rng.range(0.05, 0.5),
        goal: { x: bot.x, y: bot.y },
        state: "dropping",
        trigger: 0
      };
      bot.altitude = GAME.dropAltitude + this.rng.range(-80, 120);
      this.giveStarter(bot);
      this.bots.push(bot);
    }
    this.ui.feed = [];
    this.ui.pushFeed("Transport crossing Skybreak Island.");
  }

  giveStarter(actor) {
    const def = WEAPONS.assault;
    actor.inventory[0] = { kind: "weapon", weaponKey: "assault", rarity: "common", name: `Common ${def.name}`, color: RARITIES.common.color, mag: def.magazine, def };
    actor.inventory[1] = { kind: "consumable", consumableKey: "shield", name: "Charge Cell", color: "#64cfff", count: 1, def: { kind: "shield", amount: 35, useTime: 1 } };
  }

  start() {
    this.reset();
    this.ui.show("none");
    this.ui.showHud(true);
  }

  update(dt) {
    this.time += dt;
    this.hint = "";
    if (this.state === "menu") return this.render();
    if (this.state === "paused" || this.state === "results") return this.render();
    if (this.input.consume("Escape")) this.pause();

    if (this.state === "countdown") {
      this.countdown -= dt;
      this.hint = `Drop begins in ${Math.max(1, Math.ceil(this.countdown))}`;
      this.updateActors(dt);
      if (this.countdown <= 0) {
        this.state = "playing";
        this.ui.pushFeed("Drop! Choose a landing route.");
      }
    } else if (this.state === "playing") {
      this.matchTime += dt;
      this.stats.survivalTime = this.matchTime;
      this.handlePlayerInput(dt);
      this.updateStorm(dt);
      this.updateActors(dt);
      this.updateBots(dt);
      this.updateProjectiles(dt);
      this.updateParticles(dt);
      this.resolveLoot();
      this.checkWinLose();
    }
    this.ui.updateHud(this);
    this.render();
    this.input.endFrame();
  }

  pause() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.ui.show("pauseMenu");
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.ui.show("none");
  }

  handlePlayerInput(dt) {
    const player = this.player;
    if (!player.alive) return;
    const axis = this.input.axis();
    const move = normalizeVector(axis.x, axis.y);
    const sprint = this.input.isDown(this.settings.keybinds.sprint);
    const crouch = this.input.isDown(this.settings.keybinds.crouch);
    const speed = player.gliding ? GAME.glideSpeed : sprint ? 265 : crouch ? 112 : 188;
    if (axis.x || axis.y) {
      player.vx += move.x * speed * 7 * dt;
      player.vy += move.y * speed * 7 * dt;
    }
    player.vx *= Math.pow(0.0009, dt);
    player.vy *= Math.pow(0.0009, dt);

    this.input.mouse.worldX = this.camera.x + (this.input.mouse.x - this.viewW / 2);
    this.input.mouse.worldY = this.camera.y + (this.input.mouse.y - this.viewH / 2);
    player.angle = angleTo(player, { x: this.input.mouse.worldX, y: this.input.mouse.worldY });

    for (let i = 0; i < 5; i++) if (this.input.consume(`Digit${i + 1}`)) player.activeSlot = i;
    if (this.input.consume("KeyB")) {
      this.buildMode = !this.buildMode;
      this.audio.ui();
    }
    if (this.input.consume("KeyQ")) this.cycleBuild(-1);
    if (this.input.consume("KeyE")) this.cycleBuild(1);
    if (this.input.consume("KeyR")) this.reload(player);
    if (this.input.consume("Space") && player.gliding) {
      player.altitude = Math.max(0, player.altitude - 150);
      this.audio.beep(360, 0.08, "triangle", 0.18);
    }

    if (this.input.consume(this.settings.keybinds.interact)) {
      if (!this.tryPickup(player)) this.harvest(player);
    }

    if (this.buildMode && this.input.mouse.down) this.tryBuild(player);
    if (!this.buildMode && this.input.mouse.down) this.useActive(player, false);
  }

  cycleBuild(direction) {
    const keys = Object.keys(BUILD_PIECES);
    const index = keys.indexOf(this.buildPiece);
    this.buildPiece = keys[(index + direction + keys.length) % keys.length];
    this.audio.ui();
  }

  updateActors(dt) {
    for (const actor of [this.player, ...this.bots]) {
      if (!actor.alive) continue;
      if (actor.gliding) {
        actor.altitude -= GAME.landingSpeed * dt;
        if (actor.altitude <= 0) {
          actor.altitude = 0;
          actor.gliding = false;
          this.puff(actor.x, actor.y, "#e8f3ff", 10);
        }
      }
      actor.fireCooldown = Math.max(0, actor.fireCooldown - dt);
      actor.reloadTimer = Math.max(0, actor.reloadTimer - dt);
      actor.useTimer = Math.max(0, actor.useTimer - dt);
      actor.x += actor.vx * dt;
      actor.y += actor.vy * dt;
      this.world.clampPoint(actor);
      this.resolveActorBuildCollisions(actor);
      this.applyStormDamage(actor, dt);
    }
  }

  updateBots(dt) {
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      const ai = bot.ai;
      ai.think -= dt;
      const difficulty = BOT_DIFFICULTIES[ai.difficulty];
      if (ai.think <= 0) {
        ai.think = this.rng.range(0.12, 0.32);
        const enemies = [this.player, ...this.bots].filter(a => a.alive && a !== bot && !a.gliding);
        const nearest = enemies.sort((a, b) => distance(bot, a) - distance(bot, b))[0];
        const stormDist = distance(bot, this.storm.center);
        if (stormDist > this.storm.radius * 0.88) {
          ai.state = "storm";
          ai.goal = { x: this.storm.center.x + this.rng.range(-100, 100), y: this.storm.center.y + this.rng.range(-100, 100) };
        } else if (bot.health < 42 && this.hasConsumable(bot)) {
          ai.state = "heal";
        } else if (nearest && distance(bot, nearest) < 560 + difficulty.aggression * 260) {
          ai.state = "combat";
          bot.target = nearest;
        } else {
          const loot = this.findNearestLoot(bot, 900);
          if (loot) {
            ai.state = "loot";
            ai.goal = loot;
          } else if (distance(bot, ai.goal) < 70) {
            ai.goal = { x: this.rng.range(-1100, 1100), y: this.rng.range(-1100, 1100) };
          }
        }
      }
      this.driveBot(bot, dt);
    }
  }

  driveBot(bot, dt) {
    const ai = bot.ai;
    const difficulty = BOT_DIFFICULTIES[ai.difficulty];
    let goal = ai.goal;
    if (bot.gliding) goal = { x: bot.x * 0.8, y: bot.y * 0.8 };
    if (ai.state === "combat" && bot.target?.alive) {
      const d = distance(bot, bot.target);
      bot.angle = angleTo(bot, bot.target) + this.rng.range(-difficulty.aimError, difficulty.aimError);
      if (d > 260) goal = bot.target;
      else goal = { x: bot.x - Math.cos(bot.angle) * 150, y: bot.y - Math.sin(bot.angle) * 150 };
      ai.trigger += dt;
      if (ai.trigger > difficulty.reaction && d < 860) {
        ai.trigger = 0;
        this.useActive(bot, true);
        if (this.rng.chance(difficulty.buildChance)) this.botBuild(bot);
      }
    } else if (ai.state === "heal") {
      this.useActiveConsumable(bot);
      goal = { x: bot.x, y: bot.y };
    }
    const dir = normalizeVector(goal.x - bot.x, goal.y - bot.y);
    const speed = bot.gliding ? GAME.glideSpeed * 0.75 : 158 + difficulty.aggression * 36;
    bot.vx += dir.x * speed * 5.2 * dt;
    bot.vy += dir.y * speed * 5.2 * dt;
    bot.vx *= Math.pow(0.0018, dt);
    bot.vy *= Math.pow(0.0018, dt);
    this.tryPickup(bot, true);
  }

  updateStorm(dt) {
    const phase = STORM_PHASES[this.storm.phase] || STORM_PHASES[STORM_PHASES.length - 1];
    this.storm.timer -= dt;
    this.storm.timeRemaining = this.storm.timer;
    if (this.storm.timer <= 0) {
      if (!this.storm.isShrinking) {
        this.storm.isShrinking = true;
        this.storm.timer = phase.shrink;
        this.storm.startRadius = this.storm.radius;
        this.storm.targetRadius = phase.radius;
        this.storm.damage = phase.damage;
        this.ui.pushFeed("Storm is closing.");
        this.audio.storm();
      } else {
        this.storm.radius = this.storm.targetRadius;
        this.storm.center = { ...this.storm.nextCenter };
        this.storm.phase = Math.min(this.storm.phase + 1, STORM_PHASES.length - 1);
        const next = STORM_PHASES[this.storm.phase];
        this.storm.nextCenter = { x: this.rng.range(-420, 420), y: this.rng.range(-420, 420) };
        this.storm.isShrinking = false;
        this.storm.timer = next.wait;
        this.ui.pushFeed("Safe zone updated.");
      }
    }
    if (this.storm.isShrinking) {
      const t = 1 - this.storm.timer / phase.shrink;
      this.storm.radius = lerp(this.storm.startRadius, this.storm.targetRadius, t);
      this.storm.center.x = lerp(this.storm.center.x, this.storm.nextCenter.x, dt / Math.max(1, this.storm.timer));
      this.storm.center.y = lerp(this.storm.center.y, this.storm.nextCenter.y, dt / Math.max(1, this.storm.timer));
    }
  }

  applyStormDamage(actor, dt) {
    if (this.state !== "playing" || actor.gliding) return;
    if (distance(actor, this.storm.center) > this.storm.radius) {
      this.damageActor(actor, this.storm.damage * dt, null, false, "storm");
    }
  }

  useActive(actor, isBot) {
    const slot = actor.inventory[actor.activeSlot];
    if (!slot) return;
    if (slot.kind === "weapon") return this.shoot(actor, slot, isBot);
    if (slot.kind === "consumable") return this.useConsumable(actor, slot);
  }

  useActiveConsumable(actor) {
    const index = actor.inventory.findIndex(slot => slot?.kind === "consumable");
    if (index >= 0) {
      actor.activeSlot = index;
      this.useConsumable(actor, actor.inventory[index]);
    }
  }

  useConsumable(actor, slot) {
    if (actor.useTimer > 0 || actor.gliding) return;
    actor.useTimer = slot.def.useTime;
    setTimeout(() => {
      if (!actor.alive || actor.inventory[actor.activeSlot] !== slot) return;
      if (slot.def.kind === "heal") actor.health = clamp(actor.health + slot.def.amount, 0, 100);
      if (slot.def.kind === "shield") actor.shield = clamp(actor.shield + slot.def.amount, 0, 100);
      slot.count -= 1;
      if (slot.count <= 0) actor.inventory[actor.activeSlot] = null;
      if (actor.isPlayer) this.audio.pickup();
    }, slot.def.useTime * 1000);
  }

  shoot(actor, slot, isBot) {
    const def = slot.def;
    if (actor.fireCooldown > 0 || actor.reloadTimer > 0 || actor.useTimer > 0 || actor.gliding) return;
    if (slot.mag <= 0) {
      this.reload(actor);
      return;
    }
    slot.mag -= 1;
    actor.fireCooldown = 1 / def.fireRate;
    actor.shots += 1;
    if (actor.isPlayer) {
      this.stats.shots += 1;
      this.audio.shoot(def === WEAPONS.shotgun ? "shotgun" : def === WEAPONS.sniper ? "sniper" : def === WEAPONS.explosive ? "explosive" : "gun");
      this.camera.shake = Math.min(14, this.camera.shake + def.recoil * 140);
    }
    if (def.type === "projectile") {
      this.projectiles.push({
        owner: actor,
        x: actor.x + Math.cos(actor.angle) * 26,
        y: actor.y + Math.sin(actor.angle) * 26,
        vx: Math.cos(actor.angle) * def.projectileSpeed,
        vy: Math.sin(actor.angle) * def.projectileSpeed,
        fuse: def.fuse,
        def
      });
      return;
    }
    for (let i = 0; i < def.pelletCount; i++) {
      const spread = this.rng.range(-def.spread, def.spread) * (isBot ? 1.2 : this.input.mouse.right ? 0.55 : 1);
      this.resolveHitScan(actor, actor.angle + spread, slot);
    }
  }

  resolveHitScan(actor, angle, slot) {
    const def = slot.def;
    const candidates = [this.player, ...this.bots].filter(target => target.alive && target !== actor && !target.gliding);
    let best = null;
    for (const target of candidates) {
      const hit = rayCircle(actor, angle, def.range, target, target.radius);
      if (hit && (!best || hit.distance < best.distance)) best = { target, ...hit };
    }
    let blockedAt = Infinity;
    for (const build of this.builds) {
      if (build.hp <= 0) continue;
      const hit = rayCircle(actor, angle, def.range, build, Math.max(build.w, build.h) * 0.38);
      if (hit) blockedAt = Math.min(blockedAt, hit.distance);
    }
    const endDistance = Math.min(def.range, best?.distance ?? def.range, blockedAt);
    this.tracer(actor.x, actor.y, actor.x + Math.cos(angle) * endDistance, actor.y + Math.sin(angle) * endDistance, def.color);
    if (blockedAt < (best?.distance ?? Infinity)) return;
    if (best) {
      const falloff = invLerp(def.falloffStart, def.falloffEnd, best.distance);
      const rarityMul = RARITIES[slot.rarity]?.damage || 1;
      const damage = def.damage * rarityMul * lerp(1, 0.55, falloff) * (best.headshot ? def.headshot : 1);
      actor.hits += 1;
      if (actor.isPlayer) {
        this.stats.hits += 1;
        this.stats.damage += damage;
        this.audio.hit();
      }
      actor.damage += damage;
      this.damageActor(best.target, damage, actor, best.headshot, slot.name);
    }
  }

  reload(actor) {
    const slot = actor.inventory[actor.activeSlot];
    if (!slot || slot.kind !== "weapon" || actor.reloadTimer > 0) return;
    const needed = slot.def.magazine - slot.mag;
    const available = actor.ammo[slot.def.ammoType] || 0;
    if (needed <= 0 || available <= 0) return;
    actor.reloadTimer = slot.def.reload;
    setTimeout(() => {
      if (!actor.alive || actor.inventory[actor.activeSlot] !== slot) return;
      const take = Math.min(needed, actor.ammo[slot.def.ammoType] || 0);
      slot.mag += take;
      actor.ammo[slot.def.ammoType] -= take;
    }, slot.def.reload * 1000);
  }

  updateProjectiles(dt) {
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.fuse -= dt;
      if (projectile.fuse <= 0) this.explode(projectile);
    }
    this.projectiles = this.projectiles.filter(p => p.fuse > 0);
  }

  explode(projectile) {
    projectile.fuse = -1;
    this.puff(projectile.x, projectile.y, "#ff895f", 26);
    for (const actor of [this.player, ...this.bots]) {
      if (!actor.alive || actor === projectile.owner || actor.gliding) continue;
      const d = distance(actor, projectile);
      if (d < projectile.def.splash) {
        const damage = projectile.def.damage * (1 - d / projectile.def.splash);
        this.damageActor(actor, damage, projectile.owner, false, "Arc Burster");
      }
    }
  }

  damageActor(actor, amount, attacker, headshot, source) {
    if (!actor.alive) return;
    let remaining = amount;
    const shieldHit = Math.min(actor.shield, remaining);
    actor.shield -= shieldHit;
    remaining -= shieldHit;
    actor.health -= remaining;
    this.puff(actor.x, actor.y, headshot ? "#ffcf5a" : "#ffffff", headshot ? 8 : 5);
    if (actor.health <= 0) {
      actor.alive = false;
      actor.health = 0;
      if (attacker) {
        attacker.kills += 1;
        if (attacker.isPlayer) this.stats.eliminations += 1;
      }
      this.dropDeathLoot(actor);
      this.ui.pushFeed(`${attacker?.name || "The storm"} eliminated ${actor.name}${source ? ` (${source})` : ""}.`);
    }
  }

  dropDeathLoot(actor) {
    for (const slot of actor.inventory) {
      if (slot) this.loot.push({ ...slot, id: `drop-${this.time}-${this.rng.next()}`, x: actor.x + this.rng.range(-32, 32), y: actor.y + this.rng.range(-32, 32), bob: 0 });
    }
    for (const material of ["wood", "stone", "metal"]) {
      if (actor.materials[material] > 10) this.loot.push({ kind: "material", material, name: `${material} Cache`, amount: Math.floor(actor.materials[material] * 0.45), color: material === "wood" ? "#bf8a55" : material === "stone" ? "#aab0ad" : "#9fc0cc", x: actor.x, y: actor.y, bob: 0, id: `mat-${this.time}-${material}` });
    }
  }

  tryPickup(actor, silent = false) {
    const nearest = this.findNearestLoot(actor, GAME.pickupRange);
    if (!nearest) return false;
    this.applyLoot(actor, nearest);
    this.loot = this.loot.filter(item => item !== nearest);
    if (actor.isPlayer && !silent) this.audio.pickup();
    return true;
  }

  resolveLoot() {
    const nearest = this.findNearestLoot(this.player, GAME.pickupRange);
    if (nearest) this.hint = `F pick up ${nearest.name}`;
    for (const resource of this.world.resources) {
      if (resource.hp > 0 && distance(this.player, resource) < GAME.harvestRange) this.hint = this.hint || `F harvest ${resource.type}`;
    }
  }

  applyLoot(actor, item) {
    if (item.kind === "ammo") {
      actor.ammo[item.ammoType] = (actor.ammo[item.ammoType] || 0) + item.amount;
      return;
    }
    if (item.kind === "material") {
      actor.materials[item.material] += item.amount;
      return;
    }
    if (item.kind === "weapon" || item.kind === "consumable") {
      const empty = actor.inventory.findIndex(slot => !slot);
      const index = empty >= 0 ? empty : actor.activeSlot;
      actor.inventory[index] = { ...item };
      if (!actor.isPlayer) actor.activeSlot = index;
    }
  }

  findNearestLoot(actor, maxDistance) {
    let best = null;
    let bestD = maxDistance;
    for (const item of this.loot) {
      const d = distance(actor, item);
      if (d < bestD) {
        best = item;
        bestD = d;
      }
    }
    return best;
  }

  harvest(actor) {
    const resource = this.world.resources.find(node => node.hp > 0 && distance(actor, node) < GAME.harvestRange);
    if (!resource) return false;
    resource.hp -= 34;
    actor.materials[resource.type] += 18;
    this.puff(resource.x, resource.y, resource.type === "wood" ? "#d49a64" : "#cbd2d0", 8);
    this.audio.beep(240, 0.07, "square", 0.12);
    if (resource.hp <= 0) {
      actor.materials[resource.type] += resource.amount;
      this.ui.pushFeed(`Harvested ${resource.type} resources.`);
    }
    return true;
  }

  tryBuild(actor) {
    if (actor.gliding) return false;
    const piece = BUILD_PIECES[this.buildPiece];
    const ahead = actor.isPlayer ? { x: this.input.mouse.worldX, y: this.input.mouse.worldY } : { x: actor.x + Math.cos(actor.angle) * 92, y: actor.y + Math.sin(actor.angle) * 92 };
    const cell = GAME.buildCell;
    const x = Math.round(ahead.x / cell) * cell;
    const y = Math.round(ahead.y / cell) * cell;
    if (distance(actor, { x, y }) > 180) return false;
    if (!this.canAfford(actor, piece.cost)) {
      if (actor.isPlayer) this.hint = "Need materials";
      return false;
    }
    if (this.builds.some(build => distance(build, { x, y }) < 42)) return false;
    for (const key of Object.keys(piece.cost)) actor.materials[key] -= piece.cost[key];
    this.builds.push({
      id: `build-${this.time}-${this.builds.length}`,
      owner: actor,
      type: this.buildPiece,
      x,
      y,
      w: piece.w,
      h: piece.h,
      hp: piece.durability,
      maxHp: piece.durability,
      angle: ["wall", "ramp"].includes(this.buildPiece) ? actor.angle : 0,
      color: piece.color
    });
    if (actor.isPlayer) this.audio.beep(460, 0.08, "triangle", 0.16);
    return true;
  }

  botBuild(bot) {
    const old = this.buildPiece;
    this.buildPiece = this.rng.pick(["wall", "ramp"]);
    this.tryBuild(bot);
    this.buildPiece = old;
  }

  canAfford(actor, cost) {
    return Object.entries(cost).every(([key, value]) => actor.materials[key] >= value);
  }

  resolveActorBuildCollisions(actor) {
    for (const build of this.builds) {
      const dx = actor.x - build.x;
      const dy = actor.y - build.y;
      const minX = build.w / 2 + actor.radius;
      const minY = build.h / 2 + actor.radius;
      if (Math.abs(dx) < minX && Math.abs(dy) < minY) {
        if (Math.abs(dx / minX) > Math.abs(dy / minY)) {
          actor.x = build.x + Math.sign(dx || 1) * minX;
          actor.vx *= -0.1;
        } else {
          actor.y = build.y + Math.sign(dy || 1) * minY;
          actor.vy *= -0.1;
        }
      }
    }
  }

  hasConsumable(actor) {
    return actor.inventory.some(slot => slot?.kind === "consumable");
  }

  checkWinLose() {
    const alive = this.aliveActors();
    this.stats.placement = alive.filter(actor => actor !== this.player).length + (this.player.alive ? 1 : 2);
    if (!this.player.alive) {
      this.state = "results";
      this.ui.showResults(this.stats, false);
      this.audio.defeat();
      return;
    }
    if (alive.length === 1 && alive[0] === this.player) {
      this.state = "results";
      this.stats.placement = 1;
      this.ui.showResults(this.stats, true);
      this.audio.victory();
    }
  }

  aliveActors() {
    return [this.player, ...this.bots].filter(actor => actor.alive);
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
    this.camera.shake = Math.max(0, this.camera.shake - dt * 24);
  }

  tracer(x1, y1, x2, y2, color) {
    this.particles.push({ kind: "tracer", x: x1, y: y1, x2, y2, color, life: 0.07, vx: 0, vy: 0 });
  }

  puff(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const s = this.rng.range(30, 150);
      this.particles.push({ kind: "puff", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: this.rng.range(0.2, 0.7), size: this.rng.range(2, 7) });
    }
  }

  render() {
    const ctx = this.ctx;
    const player = this.player || { x: 0, y: 0 };
    const shakeX = this.settings.graphics.cameraShake ? this.rng.range(-this.camera.shake, this.camera.shake) : 0;
    const shakeY = this.settings.graphics.cameraShake ? this.rng.range(-this.camera.shake, this.camera.shake) : 0;
    this.camera.x = lerp(this.camera.x, player.x, 0.12);
    this.camera.y = lerp(this.camera.y, player.y, 0.12);
    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.save();
    ctx.translate(this.viewW / 2 - this.camera.x + shakeX, this.viewH / 2 - this.camera.y + shakeY);
    this.drawWorld(ctx);
    this.drawStorm(ctx);
    this.drawLoot(ctx);
    this.drawBuilds(ctx);
    this.drawResources(ctx);
    this.drawActors(ctx);
    this.drawProjectiles(ctx);
    this.drawParticles(ctx);
    this.drawBuildPreview(ctx);
    ctx.restore();
    this.drawReticle(ctx);
    this.drawMinimap();
  }

  drawWorld(ctx) {
    const half = this.world?.half || GAME.worldSize / 2;
    ctx.fillStyle = "#315f4d";
    ctx.fillRect(-half, -half, half * 2, half * 2);
    ctx.fillStyle = "#426f51";
    for (let x = -half; x < half; x += 160) for (let y = -half; y < half; y += 160) {
      if ((Math.floor(x + y) / 160) % 2 === 0) ctx.fillRect(x, y, 160, 160);
    }
    ctx.fillStyle = "#4f8fa3";
    ctx.fillRect(-half, -half, half * 2, 90);
    ctx.fillRect(-half, half - 130, half * 2, 130);
    ctx.fillStyle = "#6b695a";
    for (const road of this.world.roads) ctx.fillRect(road.x, road.y, road.w, road.h);
    for (const poi of this.world.pois) {
      ctx.fillStyle = poi.color;
      ctx.globalAlpha = 0.28;
      ctx.fillRect(poi.x - poi.w / 2, poi.y - poi.h / 2, poi.w, poi.h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.56)";
      ctx.font = "700 18px sans-serif";
      ctx.fillText(poi.name, poi.x - poi.w / 2 + 14, poi.y - poi.h / 2 + 28);
    }
    for (const cover of this.world.cover) {
      ctx.fillStyle = cover.color;
      ctx.fillRect(cover.x - cover.w / 2, cover.y - cover.h / 2, cover.w, cover.h);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.strokeRect(cover.x - cover.w / 2, cover.y - cover.h / 2, cover.w, cover.h);
    }
  }

  drawStorm(ctx) {
    if (!this.storm) return;
    const half = this.world.half;
    ctx.save();
    ctx.fillStyle = "rgba(88, 74, 170, 0.34)";
    ctx.beginPath();
    ctx.rect(-half - 400, -half - 400, half * 2 + 800, half * 2 + 800);
    ctx.arc(this.storm.center.x, this.storm.center.y, this.storm.radius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.strokeStyle = "rgba(164, 142, 255, 0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(this.storm.center.x, this.storm.center.y, this.storm.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawResources(ctx) {
    for (const r of this.world.resources) {
      if (r.hp <= 0) continue;
      ctx.fillStyle = r.type === "wood" ? "#2d6b42" : r.type === "stone" ? "#9da5a5" : "#8fb7c7";
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fill();
      if (r.type === "wood") {
        ctx.fillStyle = "#6e4c32";
        ctx.fillRect(r.x - 5, r.y + r.r * 0.4, 10, r.r);
      }
    }
  }

  drawLoot(ctx) {
    for (const item of this.loot) {
      const bob = Math.sin(this.time * 4 + item.bob) * 4;
      ctx.fillStyle = item.color;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(item.x - 12, item.y - 12 + bob, 24, 24, 5);
      ctx.fill();
      ctx.stroke();
    }
  }

  drawBuilds(ctx) {
    for (const build of this.builds) {
      ctx.save();
      ctx.translate(build.x, build.y);
      ctx.rotate(build.angle || 0);
      ctx.fillStyle = build.color;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-build.w / 2, -build.h / 2, build.w, build.h);
      if (build.type === "ramp") {
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.moveTo(-build.w / 2, build.h / 2);
        ctx.lineTo(build.w / 2, build.h / 2);
        ctx.lineTo(build.w / 2, -build.h / 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.strokeRect(-build.w / 2, -build.h / 2, build.w, build.h);
      ctx.restore();
    }
  }

  drawActors(ctx) {
    for (const actor of [...this.bots, this.player]) {
      if (!actor.alive) continue;
      const z = actor.altitude || 0;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(actor.x + z * 0.08, actor.y + z * 0.08, actor.radius * (1 + z / 500), actor.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(actor.x, actor.y - z * 0.18);
      ctx.rotate(actor.angle);
      ctx.fillStyle = actor.isPlayer ? "#48e0a4" : "#ff7d5c";
      ctx.beginPath();
      ctx.roundRect(-16, -15, 32, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#111920";
      ctx.fillRect(8, -4, 24, 8);
      if (actor.gliding) {
        ctx.fillStyle = "rgba(230,245,255,0.88)";
        ctx.beginPath();
        ctx.moveTo(-34, -28);
        ctx.lineTo(0, -46);
        ctx.lineTo(34, -28);
        ctx.lineTo(18, -22);
        ctx.lineTo(0, -30);
        ctx.lineTo(-18, -22);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(actor.x - 22, actor.y - z * 0.18 - 35, 44, 5);
      ctx.fillStyle = actor.shield > 0 ? "#5ec7ff" : "#54e17f";
      ctx.fillRect(actor.x - 22, actor.y - z * 0.18 - 35, 44 * ((actor.shield > 0 ? actor.shield : actor.health) / 100), 5);
    }
  }

  drawProjectiles(ctx) {
    ctx.fillStyle = "#ffb15e";
    for (const p of this.projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life * 3, 0, 1);
      if (p.kind === "tracer") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  drawBuildPreview(ctx) {
    if (!this.buildMode || !this.player?.alive || this.player.gliding) return;
    const piece = BUILD_PIECES[this.buildPiece];
    const cell = GAME.buildCell;
    const x = Math.round(this.input.mouse.worldX / cell) * cell;
    const y = Math.round(this.input.mouse.worldY / cell) * cell;
    const valid = distance(this.player, { x, y }) < 180 && this.canAfford(this.player, piece.cost);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(x, y);
    ctx.rotate(["wall", "ramp"].includes(this.buildPiece) ? this.player.angle : 0);
    ctx.fillStyle = valid ? "#48e0a4" : "#ff5e6a";
    ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    ctx.restore();
    this.hint = `${piece.name} cost W${piece.cost.wood} S${piece.cost.stone} M${piece.cost.metal}`;
  }

  drawReticle(ctx) {
    if (!this.player) return;
    const x = this.input.mouse.moved ? this.input.mouse.x : this.viewW / 2;
    const y = this.input.mouse.moved ? this.input.mouse.y : this.viewH / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.86)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 3, y);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y - 3);
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
  }

  drawMinimap() {
    if (!this.world) return;
    const ctx = this.mapCtx;
    const size = this.mapCanvas.width;
    const half = this.world.half;
    const map = p => (p + half) / (half * 2) * size;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#274537";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#a48eff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(map(this.storm.center.x), map(this.storm.center.y), this.storm.radius / (half * 2) * size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ff7d5c";
    for (const b of this.bots) if (b.alive) ctx.fillRect(map(b.x) - 1, map(b.y) - 1, 2, 2);
    ctx.fillStyle = "#48e0a4";
    ctx.beginPath();
    ctx.arc(map(this.player.x), map(this.player.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
