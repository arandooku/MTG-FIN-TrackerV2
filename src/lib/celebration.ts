import type { Card } from './schemas';

type RarityKey = 'common' | 'uncommon' | 'rare' | 'mythic';

interface RarityConfig {
  colors: string[];
  glow: string;
  border: string;
  flash: boolean;
  fireworks: number;
  sparkles: number;
  goldShower: boolean;
  glowRing: boolean;
}

const CONFIG: Record<RarityKey, RarityConfig> = {
  common: {
    colors: ['#aaa', '#ccc', '#ddd'],
    glow: 'rgba(136,136,136,0.3)',
    border: '#888',
    flash: false,
    fireworks: 0,
    sparkles: 0,
    goldShower: false,
    glowRing: false,
  },
  uncommon: {
    colors: ['#72b5b5', '#a8dede', '#d0f0f0'],
    glow: 'rgba(114,181,181,0.5)',
    border: '#72b5b5',
    flash: false,
    fireworks: 0,
    sparkles: 6,
    goldShower: false,
    glowRing: false,
  },
  rare: {
    colors: ['#c9a14e', '#e8c878', '#fff2c0'],
    glow: 'rgba(201,161,78,0.7)',
    border: '#c9a14e',
    flash: true,
    fireworks: 3,
    sparkles: 12,
    goldShower: false,
    glowRing: true,
  },
  mythic: {
    colors: ['#e8702a', '#ff9b5c', '#ffd8a8'],
    glow: 'rgba(232,112,42,0.8)',
    border: '#e8702a',
    flash: true,
    fireworks: 6,
    sparkles: 20,
    goldShower: true,
    glowRing: true,
  },
};

function pickRarity(r: string): RarityKey {
  return (['common', 'uncommon', 'rare', 'mythic'] as const).includes(r as RarityKey)
    ? (r as RarityKey)
    : 'common';
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rot: number;
  dr: number;
  shape: 'circle' | 'rect';
}

const GRAVITY = 0.12;
const DRAG = 0.985;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function spawnParticles(
  canvas: HTMLCanvasElement,
  anchor: { x: number; y: number },
  cfg: RarityConfig,
  isFoil = false,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const parts: Particle[] = [];
  const w = canvas.width;
  const h = canvas.height;
  const total = cfg.sparkles + cfg.fireworks * 20;
  for (let i = 0; i < total; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    const life = 70 + Math.random() * 60;
    parts.push({
      x: anchor.x,
      y: anchor.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 2,
      color: isFoil
        ? `hsl(${Math.random() * 360}, 95%, 68%)`
        : (cfg.colors[i % cfg.colors.length] ?? '#fff'),
      size: 2 + Math.random() * 3.5,
      life,
      maxLife: life,
      rot: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 0.4,
      shape: Math.random() < 0.55 ? 'rect' : 'circle',
    });
  }

  let frame = 0;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.dx *= DRAG;
      p.dy = p.dy * DRAG + GRAVITY;
      p.x += p.dx;
      p.y += p.dy;
      p.rot += p.dr;
      p.life -= 1;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    frame++;
    if (frame < 150 && parts.some((p) => p.life > 0)) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }
  requestAnimationFrame(tick);
}

export function celebrateCard(card: Card, canvas: HTMLCanvasElement | null, foil = false) {
  if (!canvas || prefersReducedMotion()) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const cfg = CONFIG[pickRarity(card.rarity)];
  spawnParticles(canvas, { x: rect.width / 2, y: rect.height / 2 }, cfg, foil);
}

export function rarityConfig(r: string) {
  return CONFIG[pickRarity(r)];
}

export function spawnGlobalConfetti(rarity: string, foil = false): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-global-canvas';
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;';
  document.body.appendChild(canvas);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  const cfg = CONFIG[pickRarity(rarity)];
  spawnParticles(canvas, { x: w / 2, y: h / 2 }, cfg, foil);
  window.setTimeout(() => canvas.remove(), 2500);
}
