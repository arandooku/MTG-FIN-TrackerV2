import { createWorker, type Worker } from 'tesseract.js';

let worker: Worker | null = null;

export async function getTesseractWorker(): Promise<Worker> {
  if (worker) return worker;
  worker = await createWorker('eng');
  return worker;
}

export async function terminateTesseract() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

export async function tesseractRecognize(image: HTMLCanvasElement | Blob): Promise<string> {
  const w = await getTesseractWorker();
  const { data } = await w.recognize(image);
  return data.text;
}

export async function ocrSpaceRecognize(apiKey: string, base64Image: string): Promise<string> {
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
  const data = (await resp.json()) as { ParsedResults?: Array<{ ParsedText?: string }> };
  return data.ParsedResults?.[0]?.ParsedText ?? '';
}

const COLLECTOR_REGEX = /\b(\d{1,4})\b/g;

export function extractCollectorNumbers(text: string): string[] {
  const matches = text.matchAll(COLLECTOR_REGEX);
  return Array.from(matches, (m) => m[1] ?? '').filter(Boolean);
}

export interface OcrUsage {
  count: number;
  month: string;
}

export function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
