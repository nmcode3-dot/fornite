export class Input {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, right: false, moved: false };
    this.bind();
  }

  bind() {
    window.addEventListener("keydown", event => {
      this.keys.add(event.code);
      this.pressed.add(event.code);
      if (["Space", "Tab"].includes(event.code)) event.preventDefault();
    });
    window.addEventListener("keyup", event => this.keys.delete(event.code));
    this.canvas.addEventListener("mousemove", event => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
      this.mouse.moved = true;
    });
    this.canvas.addEventListener("mousedown", event => {
      if (event.button === 0) this.mouse.down = true;
      if (event.button === 2) this.mouse.right = true;
    });
    window.addEventListener("mouseup", event => {
      if (event.button === 0) this.mouse.down = false;
      if (event.button === 2) this.mouse.right = false;
    });
    this.canvas.addEventListener("contextmenu", event => event.preventDefault());
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  consume(code) {
    const had = this.pressed.has(code);
    this.pressed.delete(code);
    return had;
  }

  axis() {
    const b = this.settings.keybinds;
    return {
      x: (this.isDown(b.right) ? 1 : 0) - (this.isDown(b.left) ? 1 : 0),
      y: (this.isDown(b.back) ? 1 : 0) - (this.isDown(b.forward) ? 1 : 0)
    };
  }

  endFrame() {
    this.pressed.clear();
  }
}
