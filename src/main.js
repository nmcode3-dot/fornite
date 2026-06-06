import { Game } from "./game.js";
import { Input } from "./input.js";
import { loadSettings, saveSettings } from "./settings.js";
import { Ui } from "./ui.js";

const canvas = document.getElementById("game");
const mapCanvas = document.getElementById("mapCanvas");
const settings = loadSettings();
const input = new Input(canvas, settings);
const ui = new Ui(settings);
const game = new Game(canvas, mapCanvas, input, ui, settings);

const bind = (id, handler) => document.getElementById(id).addEventListener("click", handler);

function show(screen) {
  ui.show(screen);
  game.audio.ui();
}

bind("continueFromSplash", () => show("mainMenu"));
bind("openModes", () => show("modeMenu"));
bind("openSettings", () => {
  document.getElementById("sensitivity").value = settings.sensitivity;
  document.getElementById("music").value = settings.music;
  document.getElementById("sfx").value = settings.sfx;
  document.getElementById("showTelemetry").checked = settings.showTelemetry;
  show("settingsMenu");
});
bind("quickStart", () => game.start());
bind("soloMode", () => show("lobby"));
bind("backToMenu", () => show("mainMenu"));
bind("settingsBack", () => show("mainMenu"));
bind("launchMatch", () => game.start());
bind("resumeGame", () => game.resume());
bind("restartFromPause", () => game.start());
bind("quitToMenu", () => {
  game.state = "menu";
  ui.showHud(false);
  show("mainMenu");
});
bind("playAgain", () => game.start());
bind("resultsMenu", () => {
  game.state = "menu";
  ui.showHud(false);
  show("mainMenu");
});
bind("saveSettings", () => {
  settings.sensitivity = Number(document.getElementById("sensitivity").value);
  settings.music = Number(document.getElementById("music").value);
  settings.sfx = Number(document.getElementById("sfx").value);
  settings.showTelemetry = document.getElementById("showTelemetry").checked;
  saveSettings(settings);
  show("mainMenu");
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.skybreak = game;
