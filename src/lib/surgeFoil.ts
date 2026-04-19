/**
 * Surge Foil pattern generator — ported from V1 (SURGE_FOIL_OVERLAY.md).
 * Draws seed-deterministic spectral jagged-polygon streaks onto a canvas
 * and exposes it as a data URL for CSS background use.
 */

type RGB = readonly [number, number, number];

const SPECTRAL: readonly RGB[] = [
  [30, 0, 200], [0, 80, 255], [0, 180, 240], [0, 230, 180],
  [40, 240, 100], [160, 240, 40], [230, 220, 0], [255, 170, 0],
  [255, 80, 30], [240, 30, 100], [180, 0, 220], [100, 20, 255],
  [0, 120, 255], [0, 210, 200], [60, 250, 80], [200, 230, 0],
  [255, 140, 0], [255, 50, 80], [200, 0, 180],
];

const STREAK_COUNT = 65;
const ANGLE = (20 * Math.PI) / 180;

function drawSurgeFoil(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  let s = seed || 1;
  const rand = (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  for (let i = 0; i < STREAK_COUNT; i++) {
    const t = rand();
    const col = SPECTRAL[Math.floor(t * SPECTRAL.length) % SPECTRAL.length];
    const cx = rand() * w;
    const cy = rand() * h;

    const r = rand();
    let length: number;
    if (r < 0.3) length = 40 + rand() * 100;
    else if (r < 0.6) length = 120 + rand() * 200;
    else if (r < 0.85) length = 280 + rand() * 250;
    else length = 450 + rand() * 250;

    const baseWidth = 5 + rand() * 16;
    const steps = 15 + Math.floor(rand() * 25);
    const leftPts: Array<[number, number]> = [];
    const rightPts: Array<[number, number]> = [];

    const wobble = (rand() - 0.5) * 0.1;
    const dX = Math.cos(ANGLE + wobble + Math.PI / 2) * -1;
    const dY = Math.sin(ANGLE + wobble + Math.PI / 2) * -1;
    const nX = Math.cos(ANGLE + wobble);
    const nY = Math.sin(ANGLE + wobble);

    for (let st = 0; st <= steps; st++) {
      const frac = st / steps;
      const px = cx + dX * (frac - 0.5) * length;
      const py = cy + dY * (frac - 0.5) * length;
      const taper = Math.pow(Math.sin(frac * Math.PI), 0.7);
      const wSeg = Math.max(2.5, baseWidth * taper * (0.5 + 0.5 * rand()));
      const jagL = (rand() - 0.5) * 9;
      const jagR = (rand() - 0.5) * 9;
      leftPts.push([px + nX * (wSeg + jagL), py + nY * (wSeg + jagL)]);
      rightPts.push([px - nX * (wSeg + jagR), py - nY * (wSeg + jagR)]);
    }

    ctx.beginPath();
    ctx.moveTo(leftPts[0][0], leftPts[0][1]);
    for (let st2 = 1; st2 < leftPts.length; st2++) ctx.lineTo(leftPts[st2][0], leftPts[st2][1]);
    for (let st3 = rightPts.length - 1; st3 >= 0; st3--) ctx.lineTo(rightPts[st3][0], rightPts[st3][1]);
    ctx.closePath();

    const alpha = (0.13 + rand() * 0.28).toFixed(3);
    ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
    ctx.fill();
  }
}

export function generateSurgeFoilURL(w: number, h: number, seed: number): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawSurgeFoil(ctx, w, h, seed);
  return canvas.toDataURL('image/png');
}

/**
 * Deterministic seed from a collector number string.
 * Same CN → same pattern across renders, so foil layers stay stable when the modal re-opens.
 */
export function seedFromCollectorNumber(cn: string): number {
  let h = 0;
  for (let i = 0; i < cn.length; i++) h = (h * 31 + cn.charCodeAt(i)) | 0;
  return Math.abs(h) % 2147483647 || 1;
}

/**
 * Generates the shared slot-size pattern and installs it on :root as `--surge-foil-bg`.
 * Call once at app startup.
 */
export function initSurgeFoilPattern(): void {
  if (typeof document === 'undefined') return;
  const url = generateSurgeFoilURL(260, 364, 42);
  if (url) {
    document.documentElement.style.setProperty('--surge-foil-bg', `url(${url})`);
  }
}
