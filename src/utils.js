export class Rng {
  constructor(seed = 123456789) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }

  chance(probability) {
    return this.next() < probability;
  }

  weighted(entries, weightKey = "weight") {
    const total = entries.reduce((sum, entry) => sum + entry[weightKey], 0);
    let roll = this.range(0, total);
    for (const entry of entries) {
      roll -= entry[weightKey];
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  }
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, value) => clamp((value - a) / (b - a), 0, 1);
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const length = (x, y) => Math.hypot(x, y);
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const normalizeAngle = angle => {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

export function normalizeVector(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function circleIntersectsRect(circle, rect) {
  const x = clamp(circle.x, rect.x, rect.x + rect.w);
  const y = clamp(circle.y, rect.y, rect.y + rect.h);
  return Math.hypot(circle.x - x, circle.y - y) <= circle.r;
}

export function rayCircle(origin, angle, maxDistance, target, radius) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const ox = target.x - origin.x;
  const oy = target.y - origin.y;
  const projection = ox * dx + oy * dy;
  if (projection < 0 || projection > maxDistance) return null;
  const closestX = origin.x + dx * projection;
  const closestY = origin.y + dy * projection;
  const miss = Math.hypot(target.x - closestX, target.y - closestY);
  if (miss > radius) return null;
  return { distance: projection, headshot: miss < radius * 0.32 };
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
