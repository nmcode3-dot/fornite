const KEY = "skybreak-royale-settings";

const defaults = {
  sensitivity: 1,
  music: 0.35,
  sfx: 0.75,
  showTelemetry: false,
  keybinds: {
    forward: "KeyW",
    back: "KeyS",
    left: "KeyA",
    right: "KeyD",
    sprint: "ShiftLeft",
    crouch: "ControlLeft",
    jump: "Space",
    interact: "KeyF",
    reload: "KeyR",
    build: "KeyB"
  },
  graphics: {
    particles: true,
    cameraShake: true
  }
};

export function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export { defaults as defaultSettings };
