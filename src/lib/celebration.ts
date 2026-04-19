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
    const speed = 1 + Math.random() * 5;
    parts.push({
      x: anchor.x,
      y: anchor.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: isFoil
        ? `hsl(${Math.random() * 360}, 90%, 70%)`
        : (cfg.colors[i % cfg.colors.length] ?? '#fff'),
      size: 1.5 + Math.random() * 3,
      life: 60 + Math.random() * 60,
    });
  }

  let frame = 0;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.dx;
      p.y += p.dy;
      p.dy += 0.08;
      p.life -= 1;
      ctx.globalAlpha = Math.max(0, p.life / 80);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    frame++;
    if (frame < 120 && parts.some((p) => p.life > 0)) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }
  requestAnimationFrame(tick);
}

export function celebrateCard(card: Card, canvas: HTMLCanvasElement | null, foil = false) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const cfg = CONFIG[pickRarity(card.rarity)];
  spawnParticles(canvas, { x: rect.width / 2, y: rect.height / 2 }, cfg, foil);
}

export function rarityConfig(r: string) {
  return CONFIG[pickRarity(r)];
}
