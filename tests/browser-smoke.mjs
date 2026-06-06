import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = "C:/Users/reena/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules";
const require = createRequire(`${nodeModules}/playwright/package.json`);
const { chromium } = require("playwright");
const chromePath = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].find(existsSync);

const port = 4281;
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

const waitForServer = () => new Promise((resolveReady, reject) => {
  const timer = setTimeout(() => reject(new Error("server did not start")), 8000);
  server.stdout.on("data", data => {
    if (String(data).includes(`http://localhost:${port}`)) {
      clearTimeout(timer);
      resolveReady();
    }
  });
  server.stderr.on("data", data => {
    const text = String(data);
    if (text.includes("EADDRINUSE")) {
      clearTimeout(timer);
      reject(new Error(text));
    }
  });
});

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const consoleErrors = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto(`http://localhost:${port}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(root, "tests", "splash.png") });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Quick Solo" }).click();
  await page.waitForFunction(() => window.skybreak?.state === "playing", null, { timeout: 6000 });
  await page.waitForFunction(() => window.skybreak?.player && !window.skybreak.player.gliding, null, { timeout: 8000 });
  await page.mouse.move(740, 350);
  await page.keyboard.down("KeyW");
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.up();
  await page.keyboard.up("KeyW");
  await page.keyboard.press("KeyB");
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.screenshot({ path: resolve(root, "tests", "match.png") });
  const state = await page.evaluate(() => ({
    state: window.skybreak.state,
    alive: window.skybreak.aliveActors().length,
    loot: window.skybreak.loot.length,
    builds: window.skybreak.builds.length,
    shots: window.skybreak.stats.shots,
    playerAlive: window.skybreak.player.alive,
    canvasPixels: (() => {
      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d");
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBlank = 0;
      for (let i = 0; i < data.length; i += 4000) {
        if (data[i] || data[i + 1] || data[i + 2]) nonBlank++;
      }
      return nonBlank;
    })()
  }));
  await browser.close();

  if (consoleErrors.length) throw new Error(`console errors:\n${consoleErrors.join("\n")}`);
  if (state.state !== "playing") throw new Error(`expected playing state, got ${state.state}`);
  if (!state.playerAlive) throw new Error("player died during smoke test");
  if (state.alive < 2) throw new Error("expected active bots");
  if (state.loot < 50) throw new Error("expected loot to remain in world");
  if (state.shots < 1) throw new Error("expected player weapon fire");
  if (state.canvasPixels < 20) throw new Error("canvas appears blank");
  console.log(`Browser smoke passed: state=${state.state}, alive=${state.alive}, loot=${state.loot}, builds=${state.builds}, shots=${state.shots}, nonblank=${state.canvasPixels}`);
} finally {
  server.kill();
}
