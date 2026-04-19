import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function formatMYR(n: number) {
  return n.toLocaleString('en-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 2 });
}

export function relativeTime(date: Date | string | number) {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, wait: number) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function scryfallLarge(url: string): string {
  if (!url) return url;
  return url
    .replace('/normal/', '/large/')
    .replace('/small/', '/large/');
}

export function scryfallPng(url: string): string {
  if (!url) return url;
  return url
    .replace('/normal/', '/png/')
    .replace('/large/', '/png/')
    .replace('/small/', '/png/')
    .replace(/\.jpg(\?|$)/, '.png$1');
}

export const MTG_CARD_BACK =
  'https://backs.scryfall.io/large/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg';
