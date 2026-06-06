export class AudioBus {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.musicNode = null;
  }

  ensure() {
    if (!this.context) this.context = new AudioContext();
  }

  beep(freq, duration = 0.08, type = "sine", volume = 0.3) {
    this.ensure();
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume * this.settings.sfx;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  shoot(kind = "gun") {
    const tones = { gun: [130, 0.06, "square"], shotgun: [92, 0.11, "sawtooth"], sniper: [70, 0.16, "triangle"], explosive: [58, 0.2, "sawtooth"] };
    this.beep(...(tones[kind] || tones.gun), 0.28);
  }

  hit() {
    this.beep(620, 0.055, "triangle", 0.24);
  }

  pickup() {
    this.beep(820, 0.07, "sine", 0.2);
    setTimeout(() => this.beep(1040, 0.08, "sine", 0.18), 55);
  }

  storm() {
    this.beep(190, 0.14, "sawtooth", 0.18);
  }

  ui() {
    this.beep(520, 0.045, "sine", 0.12);
  }

  victory() {
    [420, 540, 690, 900].forEach((freq, i) => setTimeout(() => this.beep(freq, 0.16, "triangle", 0.22), i * 120));
  }

  defeat() {
    [280, 220, 160].forEach((freq, i) => setTimeout(() => this.beep(freq, 0.18, "sawtooth", 0.18), i * 140));
  }
}
