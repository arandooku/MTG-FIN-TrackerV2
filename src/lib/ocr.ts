import { createWorker, PSM, type Worker } from 'tesseract.js';
import type { Card } from './schemas';

let worker: Worker | null = null;

export async function getTesseractWorker(): Promise<Worker> {
  if (worker) return worker;
  const w = await createWorker('eng');
  await w.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  worker = w;
  return w;
}

export async function terminateTesseract(): Promise<void> {
  if (worker) {
    try {
      await worker.terminate();
    } catch {
      /* ignore */
    }
    worker = null;
  }
}

export interface TesseractResult {
  text: string;
  confidence: number;
}

export async function tesseractRecognize(
  image: HTMLCanvasElement | Blob,
): Promise<string> {
  const w = await getTesseractWorker();
  const { data } = await w.recognize(image);
  return data.text;
}

export async function tesseractRecognizeDetail(
  image: HTMLCanvasElement | Blob,
): Promise<TesseractResult> {
  const w = await getTesseractWorker();
  const { data } = await w.recognize(image);
  return { text: data.text, confidence: data.confidence };
}

export async function ocrSpaceRecognize(
  apiKey: string,
  base64Image: string,
): Promise<string> {
  const form = new FormData();
  form.append('base64Image', base64Image);
  form.append('language', 'eng');
  form.append('OCREngine', '2');
  form.append('scale', 'true');
  form.append('isTable', 'false');
  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: apiKey },
    body: form,
  });
  if (!resp.ok) throw new Error(`OCR.space ${resp.status}`);
  const data = (await resp.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
  };
  return data.ParsedResults?.[0]?.ParsedText ?? '';
}

const COLLECTOR_REGEX = /\b(\d{1,4})\b/g;

export function extractCollectorNumbers(text: string): string[] {
  const matches = text.matchAll(COLLECTOR_REGEX);
  return Array.from(matches, (m) => m[1] ?? '').filter(Boolean);
}

// ── OCR.space usage tracking ──

const OCR_USAGE_KEY = 'fin2-ocr-usage';
const OCR_SPACE_FREE_LIMIT = 25_000;

interface OcrUsage {
  count: number;
  month: string;
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function loadUsage(): OcrUsage {
  try {
    const raw = localStorage.getItem(OCR_USAGE_KEY);
    if (!raw) return { count: 0, month: '' };
    const parsed = JSON.parse(raw) as OcrUsage;
    if (typeof parsed.count !== 'number' || typeof parsed.month !== 'string') {
      return { count: 0, month: '' };
    }
    return parsed;
  } catch {
    return { count: 0, month: '' };
  }
}

function saveUsage(u: OcrUsage): void {
  try {
    localStorage.setItem(OCR_USAGE_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

export function getOcrUsageRemaining(): number {
  const u = loadUsage();
  if (u.month !== currentMonthKey()) return OCR_SPACE_FREE_LIMIT;
  return Math.max(0, OCR_SPACE_FREE_LIMIT - u.count);
}

export function trackOcrUsage(): void {
  const m = currentMonthKey();
  const u = loadUsage();
  const next: OcrUsage =
    u.month === m ? { count: u.count + 1, month: m } : { count: 1, month: m };
  saveUsage(next);
}

export function getMonthKey(): string {
  return currentMonthKey();
}

// ── Canvas preprocessing: grayscale + contrast stretch ──

export function preprocessCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  try {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const r = d[p] ?? 0;
      const g = d[p + 1] ?? 0;
      const b = d[p + 2] ?? 0;
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      gray = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
      d[p] = gray;
      d[p + 1] = gray;
      d[p + 2] = gray;
    }
    ctx.putImageData(img, 0, 0);
  } catch {
    /* CORS or memory — proceed with raw frame */
  }
}

// ── Name normalization + fuzzy matching ──

export function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const OCR_STOP_WORDS = new Set<string>([
  'creature', 'enchantment', 'sorcery', 'artifact', 'legendary', 'aura',
  'equipment', 'basic', 'token', 'human',
  'flash', 'flying', 'trample', 'vigilance', 'deathtouch', 'lifelink',
  'defender', 'hexproof', 'menace',
  'indestructible', 'planeswalker', 'tribal', 'adventure', 'vehicle',
  'that', 'this', 'your', 'each',
  'all', 'any', 'target', 'cards', 'player', 'turn',
  'mana', 'tap', 'untap', 'draw', 'discard', 'destroy', 'exile', 'put',
  'get', 'pay', 'its', 'may', 'when', 'whenever', 'if', 'then', 'until',
  'end', 'phase', 'step', 'attack', 'block', 'damage', 'life',
  'toughness', 'counter', 'counters', 'ability', 'cost', 'control', 'owner',
  'graveyard', 'library', 'battlefield', 'hand', 'stack', 'zone',
]);

const OCR_CONFUSIONS: Set<string> = new Set();
(function buildConfusions() {
  const pairs: Array<[string, string]> = [
    ['l', '1'], ['l', 'i'], ['1', 'i'], ['o', '0'], ['o', 'q'],
    ['s', '5'], ['z', '2'], ['b', '6'], ['g', '9'], ['g', 'q'],
    ['n', 'h'], ['u', 'v'], ['c', 'e'], ['a', 'o'], ['t', 'f'],
    ['d', 'cl'], ['m', 'rn'], ['w', 'vv'], ['ii', 'u'],
  ];
  for (const [a, b] of pairs) {
    OCR_CONFUSIONS.add(`${a}|${b}`);
    OCR_CONFUSIONS.add(`${b}|${a}`);
  }
})();

export function ocrLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev: number[] = new Array<number>(n + 1);
  let curr: number[] = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] ?? 0;
      } else {
        let subCost = 1;
        if (OCR_CONFUSIONS.has(`${a[i - 1]}|${b[j - 1]}`)) subCost = 0.2;
        if (i >= 2) {
          const pair = (a[i - 2] ?? '') + (a[i - 1] ?? '');
          if (OCR_CONFUSIONS.has(`${pair}|${b[j - 1]}`)) subCost = Math.min(subCost, 0.2);
        }
        if (j >= 2) {
          const bPair = (b[j - 2] ?? '') + (b[j - 1] ?? '');
          if (OCR_CONFUSIONS.has(`${a[i - 1]}|${bPair}`)) subCost = Math.min(subCost, 0.2);
        }
        curr[j] = Math.min(
          (prev[j] ?? 0) + 1,
          (curr[j - 1] ?? 0) + 1,
          (prev[j - 1] ?? 0) + subCost,
        );
      }
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n] ?? 0;
}

export interface NameMatch {
  name: string;
  cards: Card[];
  score: number;
}

export interface NameIndex {
  map: Map<string, Card[]>;
  firstWord: Map<string, Array<{ name: string; cards: Card[] }>>;
}

export function buildNameMap(cards: Card[]): NameIndex {
  const map = new Map<string, Card[]>();
  const firstWord = new Map<string, Array<{ name: string; cards: Card[] }>>();
  for (const card of cards) {
    const faces = card.name.split('//');
    for (const face of faces) {
      const norm = normalizeCardName(face);
      if (!norm) continue;
      let bucket = map.get(norm);
      if (!bucket) {
        bucket = [];
        map.set(norm, bucket);
      }
      bucket.push(card);
      const fw = norm.split(/\s+/)[0];
      if (fw) {
        let list = firstWord.get(fw);
        if (!list) {
          list = [];
          firstWord.set(fw, list);
        }
        if (!list.some((e) => e.name === norm)) list.push({ name: norm, cards: bucket });
      }
    }
    if (faces.length > 1) {
      const full = normalizeCardName(card.name);
      let bucket = map.get(full);
      if (!bucket) {
        bucket = [];
        map.set(full, bucket);
      }
      if (!bucket.includes(card)) bucket.push(card);
    }
  }
  return { map, firstWord };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function fuzzyMatchCardName(
  ocrText: string,
  idx: NameIndex,
): NameMatch | null {
  const norm = normalizeCardName(ocrText);
  if (norm.length < 2) return null;

  // 1. Exact match on full text
  const exact = idx.map.get(norm);
  if (exact) return { name: norm, cards: exact, score: 1.0 };

  // 2. Known name as whole words in OCR text, or OCR as whole words in name
  let bestSub: NameMatch | null = null;
  let bestSubLen = 0;
  idx.map.forEach((cards, name) => {
    if (name.length < 3) return;
    try {
      const nameRe = new RegExp(`\\b${escapeRegex(name)}\\b`);
      if (nameRe.test(norm) && name.length > bestSubLen) {
        bestSubLen = name.length;
        bestSub = { name, cards, score: 0.95 };
      }
    } catch {
      /* ignore */
    }
    if (norm.length >= 5) {
      try {
        const normRe = new RegExp(`\\b${escapeRegex(norm)}\\b`);
        if (normRe.test(name)) {
          const revScore = norm.length / name.length;
          if (revScore >= 0.5 && norm.length > bestSubLen) {
            bestSubLen = norm.length;
            bestSub = { name, cards, score: revScore };
          }
        }
      } catch {
        /* ignore */
      }
    }
  });
  if (bestSub) return bestSub;

  // 3. Sliding window with stopword filtering + Levenshtein
  const rawWords = norm.split(/\s+/);
  let words = rawWords.filter((w) => !OCR_STOP_WORDS.has(w));
  if (words.length === 0) words = rawWords;

  let bestWin: NameMatch | null = null;
  let bestWinScore = 0;

  for (let winSize = Math.min(5, words.length); winSize >= 1; winSize--) {
    for (let wi = 0; wi <= words.length - winSize; wi++) {
      const phrase = words.slice(wi, wi + winSize).join(' ');
      if (phrase.length < 3) continue;

      const exactWin = idx.map.get(phrase);
      if (exactWin) return { name: phrase, cards: exactWin, score: 1.0 };

      idx.map.forEach((cards, name) => {
        if (phrase.length >= 4 && name.includes(phrase)) {
          const subScore = phrase.length / name.length;
          if (
            subScore >= 0.4 &&
            (subScore > bestWinScore || phrase.length > bestWinScore * 20)
          ) {
            bestWinScore = subScore;
            bestWin = { name, cards, score: subScore + 0.1 };
          }
        }
      });
      if (bestWin) {
        const bw = bestWin as NameMatch;
        if (bw.score >= 0.6) return bw;
      }

      if (winSize < 2 && phrase.length < 6) continue;

      let candidates: Map<string, Card[]> | null = null;
      if (winSize >= 2) {
        candidates = new Map<string, Card[]>();
        for (let wk = wi; wk < wi + winSize; wk++) {
          const w = words[wk];
          if (!w) continue;
          const entries = idx.firstWord.get(w);
          if (entries) {
            for (const e of entries) candidates.set(e.name, e.cards);
          }
        }
        if (candidates.size === 0) candidates = null;
      }

      const searchMap: Map<string, Card[]> = candidates ?? idx.map;
      searchMap.forEach((cards, name) => {
        if (Math.abs(phrase.length - name.length) > name.length * 0.6) return;
        const maxLen = Math.max(phrase.length, name.length);
        const dist = ocrLevenshtein(phrase, name);
        const score = 1 - dist / maxLen;
        if (score > bestWinScore) {
          bestWinScore = score;
          bestWin = { name, cards, score };
        }
      });

      if (bestWin) {
        const bw = bestWin as NameMatch;
        if (bw.score >= 0.9) return bw;
      }
    }
  }
  if (bestWin) {
    const bw = bestWin as NameMatch;
    if (bw.score >= 0.65) return bw;
  }
  return null;
}
