import { formatTime } from "./utils.js";

const screens = ["splash", "mainMenu", "modeMenu", "settingsMenu", "lobby", "pauseMenu", "results"];

export class Ui {
  constructor(settings) {
    this.settings = settings;
    this.hud = document.getElementById("hud");
    this.elements = Object.fromEntries([...screens, "inventory", "materials", "stormPanel", "alivePanel", "feed", "hpBar", "shieldBar", "centerHint", "summary", "resultTitle", "telemetry"].map(id => [id, document.getElementById(id)]));
    this.feed = [];
  }

  show(screen) {
    for (const id of screens) this.elements[id].classList.toggle("active", id === screen);
    this.hud.classList.toggle("visible", ["pauseMenu", "results"].includes(screen) || screen === "none");
  }

  showHud(visible) {
    this.hud.classList.toggle("visible", visible);
  }

  pushFeed(text) {
    this.feed.unshift(text);
    this.feed = this.feed.slice(0, 4);
    this.elements.feed.innerHTML = this.feed.map(line => `<div>${line}</div>`).join("");
  }

  updateHud(game) {
    const player = game.player;
    this.elements.hpBar.style.width = `${Math.max(0, player.health)}%`;
    this.elements.shieldBar.style.width = `${Math.max(0, player.shield)}%`;
    this.elements.alivePanel.textContent = `Alive: ${game.aliveActors().length}`;
    this.elements.stormPanel.textContent = `Storm: ${game.storm.isShrinking ? "closing" : "holds"} ${formatTime(game.storm.timeRemaining)}`;
    this.elements.inventory.innerHTML = player.inventory.map((slot, index) => {
      const active = index === player.activeSlot ? " active" : "";
      if (!slot) return `<div class="slot${active}"><div class="key">${index + 1}</div><div class="name">Empty</div><div class="ammo">--</div></div>`;
      const ammo = slot.kind === "weapon" ? `${slot.mag}/${player.ammo[slot.def.ammoType] || 0}` : `${slot.count} use`;
      return `<div class="slot${active}" style="border-color:${slot.color}"><div class="key">${index + 1}</div><div class="name">${slot.name}</div><div class="ammo">${ammo}</div></div>`;
    }).join("");
    this.elements.materials.innerHTML = [
      `Wood ${Math.floor(player.materials.wood)}`,
      `Stone ${Math.floor(player.materials.stone)}`,
      `Metal ${Math.floor(player.materials.metal)}`,
      `${game.buildMode ? `Build: ${game.buildPiece}` : "Combat mode"}`
    ].map(x => `<div>${x}</div>`).join("");
    this.elements.centerHint.textContent = game.hint || "";
    this.elements.telemetry.classList.toggle("visible", this.settings.showTelemetry);
    if (this.settings.showTelemetry) {
      this.elements.telemetry.textContent = `state ${game.state}\npos ${Math.round(player.x)}, ${Math.round(player.y)}\nitems ${game.loot.length}\nbots ${game.bots.filter(b => b.alive).length}\nshots ${game.stats.shots}\nhits ${game.stats.hits}`;
    }
  }

  showResults(stats, victory) {
    this.elements.resultTitle.textContent = victory ? "Victory" : "Eliminated";
    this.elements.summary.innerHTML = [
      `Placement: #${stats.placement}`,
      `Eliminations: ${stats.eliminations}`,
      `Damage dealt: ${Math.round(stats.damage)}`,
      `Accuracy: ${stats.shots ? Math.round((stats.hits / stats.shots) * 100) : 0}%`,
      `Survival time: ${formatTime(stats.survivalTime)}`
    ].map(line => `<p>${line}</p>`).join("");
    this.show("results");
  }
}
