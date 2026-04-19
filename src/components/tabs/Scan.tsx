import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, RotateCcw, Plus, Search, X, Cpu, Cloud } from 'lucide-react';
import type { Worker } from 'tesseract.js';
import { CardImage } from '../CardImage';
import { useConfigStore } from '@/store/config';
import { useCollectionStore } from '@/store/collection';
import { useAllCards } from '@/hooks/useCards';
import { useCelebrate } from '@/hooks/useCelebrate';
import { toast } from '@/store/toast';
import { canBeFoil, classifyFoil, foilLabelMap } from '@/lib/foil';
import {
  buildNameMap,
  fuzzyMatchCardName,
  getOcrUsageRemaining,
  getTesseractWorker,
  ocrSpaceRecognize,
  preprocessCanvas,
  terminateTesseract,
  trackOcrUsage,
  type NameIndex,
  type NameMatch,
} from '@/lib/ocr';
import type { Card as CardT } from '@/lib/schemas';

type Engine = 'tesseract' | 'ocrspace';
type StatusKind = 'info' | 'success' | 'warn';

interface ScanFlags {
  busy: boolean;
  paused: boolean;
  cooldown: boolean;
  fails: number;
}

const SCAN_INTERVAL_MS = 1500;
const COOLDOWN_MS = 1500;
const MAX_FAILS_BEFORE_SHUTTER = 4;
const MIN_TESS_CONFIDENCE = 30;

export function Scan({ onPickCard }: { onPickCard?: (c: CardT) => void }) {
  const apiKey = useConfigStore((s) => s.ocrSpaceKey);
  const addCard = useCollectionStore((s) => s.addCard);
  const foilOwned = useCollectionStore((s) => s.foil);
  const setFoil = useCollectionStore((s) => s.setFoil);
  const { main, variants } = useAllCards();
  const { celebrateAdd, celebrateFoil } = useCelebrate();

  const allCards = useMemo(() => [...main, ...variants], [main, variants]);
  const nameIndex = useMemo<NameIndex>(() => buildNameMap(allCards), [allCards]);
  const ownedSet = useMemo(() => {
    const set = new Set<string>();
    useCollectionStore.getState().owned.forEach((cn) => set.add(cn));
    return set;
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const loopRef = useRef<number | null>(null);
  const scanFrameRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const sessionAddsRef = useRef<string[]>([]);
  const flagsRef = useRef<ScanFlags>({
    busy: false,
    paused: false,
    cooldown: false,
    fails: 0,
  });
  const modeRef = useRef<Engine | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [engine, setEngine] = useState<Engine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<StatusKind>('info');
  const [lastText, setLastText] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [showShutter, setShowShutter] = useState(false);
  const [variantMatch, setVariantMatch] = useState<{
    name: string;
    cards: CardT[];
  } | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    modeRef.current = engine;
  }, [engine]);

  function stopLoop() {
    if (loopRef.current !== null) {
      window.clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }

  function cleanup() {
    stopLoop();
    stopCamera();
    if (workerRef.current) {
      void terminateTesseract();
      workerRef.current = null;
    }
  }

  function updateStatus(text: string, kind: StatusKind = 'info') {
    setStatus(text);
    setStatusKind(kind);
  }

  async function pickEngine(m: Engine) {
    if (!allCards.length) {
      toast({ title: 'Cards loading', description: 'Try again in a moment', variant: 'error' });
      return;
    }
    if (m === 'ocrspace' && !apiKey) {
      toast({
        title: 'OCR.space key missing',
        description: 'Add it in Settings → Card Scanner',
        variant: 'error',
      });
      return;
    }
    setEngine(m);
    modeRef.current = m;
    updateStatus('Initializing camera…');
    const ok = await startCamera();
    if (!ok) return;
    if (m === 'tesseract') {
      updateStatus('Loading Tesseract…');
      try {
        const w = await getTesseractWorker();
        workerRef.current = w;
        setEngineReady(true);
        updateStatus('Hold card steady in the frame');
      } catch (err: unknown) {
        updateStatus(
          `Tesseract failed: ${err instanceof Error ? err.message : 'error'}`,
          'warn',
        );
        return;
      }
    } else {
      setEngineReady(true);
      updateStatus(`Cloud OCR ready — ${getOcrUsageRemaining()}/25K remaining`);
    }
    startLoop();
  }

  async function startCamera(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) resolve();
          else video.onloadedmetadata = () => resolve();
        });
      }
      return true;
    } catch (err: unknown) {
      updateStatus(
        `Camera denied — ${err instanceof Error ? err.message : 'check browser settings'}`,
        'warn',
      );
      return false;
    }
  }

  function startLoop() {
    if (loopRef.current !== null) return;
    loopRef.current = window.setInterval(() => {
      void scanFrameRef.current();
    }, SCAN_INTERVAL_MS);
  }

  async function scanFrame() {
    const f = flagsRef.current;
    const mode = modeRef.current;
    if (!mode) return;
    if (f.busy || f.paused || f.cooldown) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!streamRef.current || video.readyState < 2) return;
    if (mode === 'tesseract' && !workerRef.current) return;
    if (mode === 'ocrspace' && !apiKey) return;

    f.busy = true;
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;
      const scale = 2;
      canvas.width = vw * scale;
      canvas.height = vh * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      preprocessCanvas(canvas);

      let text = '';
      let engineLabel = '';
      if (mode === 'tesseract') {
        const w = workerRef.current;
        if (!w) return;
        const res = await w.recognize(canvas);
        const conf = Math.round(res.data.confidence);
        engineLabel = `Tesseract (${conf}%)`;
        if (res.data.confidence < MIN_TESS_CONFIDENCE) {
          onFail();
          return;
        }
        text = res.data.text;
      } else {
        const remaining = getOcrUsageRemaining();
        if (remaining <= 0) {
          updateStatus('OCR.space monthly limit reached', 'warn');
          stopLoop();
          return;
        }
        engineLabel = 'Cloud';
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        text = await ocrSpaceRecognize(apiKey, base64);
        trackOcrUsage();
      }
      text = text.trim().replace(/[\n\r]+/g, ' ');
      if (!text || text.length < 2) {
        onFail();
        return;
      }

      const match = fuzzyMatchCardName(text, nameIndex);
      if (match) {
        setLastText(`${engineLabel} → "${match.name}" (${Math.round(match.score * 100)}%)`);
        onSuccess(match);
      } else {
        setLastText(`${engineLabel}: "${text.slice(0, 50)}"`);
        onFail();
      }
    } catch (err: unknown) {
      setLastText(err instanceof Error ? err.message : 'scan error');
      onFail();
    } finally {
      flagsRef.current.busy = false;
    }
  }

  scanFrameRef.current = scanFrame;

  function onSuccess(match: NameMatch) {
    flagsRef.current.fails = 0;
    setShowShutter(false);
    const cards = match.cards;
    const single = cards.length === 1 ? cards[0] : null;
    const foilable = !!single && canBeFoil(single);
    if (single && !foilable) {
      addScannedCard(single);
      return;
    }
    setVariantMatch({ name: match.name, cards });
    flagsRef.current.paused = true;
  }

  function addScannedCard(card: CardT) {
    const cn = card.collector_number;
    const recent = sessionAddsRef.current.slice(-3);
    if (recent.includes(cn)) return;
    addCard(cn, 'scanner');
    sessionAddsRef.current.push(cn);
    setSessionCount(sessionAddsRef.current.length);
    celebrateAdd(card);
    updateStatus(`Added: ${card.name}`, 'success');
    startCooldown();
  }

  function addScannedFoil(card: CardT) {
    const cn = card.collector_number;
    const variant = classifyFoil(card);
    if (variant === 'none') {
      addScannedCard(card);
      return;
    }
    const owned = foilOwned[cn] ?? [];
    if (!owned.includes(variant)) setFoil(cn, [...owned, variant]);
    sessionAddsRef.current.push(cn);
    setSessionCount(sessionAddsRef.current.length);
    celebrateFoil(card, foilLabelMap[variant] ?? 'Foil');
    updateStatus(`Added foil: ${card.name}`, 'success');
    startCooldown();
  }

  function startCooldown() {
    flagsRef.current.cooldown = true;
    window.setTimeout(() => {
      flagsRef.current.cooldown = false;
      if (modeRef.current) updateStatus('Hold card steady in the frame');
    }, COOLDOWN_MS);
  }

  function onFail() {
    flagsRef.current.fails++;
    if (flagsRef.current.fails >= MAX_FAILS_BEFORE_SHUTTER) setShowShutter(true);
  }

  function closeVariantPicker(clearFails = false) {
    setVariantMatch(null);
    flagsRef.current.paused = false;
    if (clearFails) flagsRef.current.fails = 0;
  }

  async function onShutterFile(file: File) {
    flagsRef.current.paused = true;
    updateStatus('Processing photo…');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    const canvas = canvasRef.current;
    if (!canvas) {
      URL.revokeObjectURL(url);
      flagsRef.current.paused = false;
      return;
    }
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const maxDim = Math.max(iw, ih);
    let scale = 1;
    if (maxDim > 2000) scale = 2000 / maxDim;
    else if (maxDim < 1000) scale = 2;
    const sw = Math.floor(iw * scale);
    const sh = Math.floor(ih * scale);
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      flagsRef.current.paused = false;
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, iw, ih, 0, 0, sw, sh);
    preprocessCanvas(canvas);
    URL.revokeObjectURL(url);

    const mode = modeRef.current;
    try {
      let text = '';
      if (mode === 'ocrspace') {
        if (!apiKey) throw new Error('No API key');
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        text = await ocrSpaceRecognize(apiKey, base64);
        trackOcrUsage();
      } else {
        const w = workerRef.current ?? (await getTesseractWorker());
        workerRef.current = w;
        const res = await w.recognize(canvas);
        if (res.data.confidence < MIN_TESS_CONFIDENCE) {
          updateStatus('No text found — try a clearer photo', 'warn');
          flagsRef.current.paused = false;
          return;
        }
        text = res.data.text;
      }
      text = text.trim().replace(/[\n\r]+/g, ' ');
      if (!text || text.length < 2) {
        updateStatus('No text found — try a clearer photo', 'warn');
        flagsRef.current.paused = false;
        return;
      }
      const nums = text.match(/\b\d{4}\b/g) ?? [];
      for (const cn4 of nums) {
        const n = Number.parseInt(cn4, 10);
        if (n < 1 || n > 681) continue;
        const cn = cn4.slice(1);
        const card = allCards.find((c) => c.collector_number === cn);
        if (card) {
          flagsRef.current.paused = false;
          onSuccess({ name: card.name, cards: [card], score: 1.0 });
          return;
        }
      }
      const match = fuzzyMatchCardName(text, nameIndex);
      if (match) {
        flagsRef.current.paused = false;
        onSuccess(match);
        return;
      }
      updateStatus('Could not identify — try again or search', 'warn');
      flagsRef.current.paused = false;
    } catch (err: unknown) {
      updateStatus(
        `Photo error: ${err instanceof Error ? err.message : 'unknown'}`,
        'warn',
      );
      flagsRef.current.paused = false;
    }
  }

  function resetScanner() {
    cleanup();
    setEngine(null);
    modeRef.current = null;
    setEngineReady(false);
    sessionAddsRef.current = [];
    setSessionCount(0);
    flagsRef.current = { busy: false, paused: false, cooldown: false, fails: 0 };
    setStatus('');
    setLastText('');
    setShowShutter(false);
    setVariantMatch(null);
  }

  const searchResults = searchQ.trim()
    ? allCards
        .filter(
          (c) =>
            c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
            c.collector_number.includes(searchQ),
        )
        .slice(0, 12)
    : [];

  return (
    <div className="app-content flex flex-col gap-3">
      {!engine && (
        <div className="glass-raised" style={{ padding: '16px 14px' }}>
          <div className="mo-section-label mb-3">Select Scan Engine</div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              className="app-btn primary justify-start"
              onClick={() => void pickEngine('tesseract')}
            >
              <Cpu size={16} /> Tesseract OCR
              <span
                className="ml-auto text-display"
                style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.75 }}
              >
                Local · free
              </span>
            </button>
            <button
              type="button"
              className="app-btn primary justify-start"
              onClick={() => void pickEngine('ocrspace')}
            >
              <Cloud size={16} /> OCR.space
              <span
                className="ml-auto text-display"
                style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.75 }}
              >
                Cloud · {getOcrUsageRemaining()}/25K
              </span>
            </button>
            <button
              type="button"
              className="app-btn ghost justify-start"
              onClick={() => setSearchOpen((s) => !s)}
            >
              <Search size={16} /> Search manually
            </button>
          </div>
        </div>
      )}

      {engine && (
        <>
          {/* Crystal viewfinder — gold L-brackets + animated sweep */}
          <div
            className="mo-view-frame"
            style={{ aspectRatio: '3 / 4', maxHeight: '60vh' }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <span className="mo-view-corner tl" aria-hidden />
            <span className="mo-view-corner tr" aria-hidden />
            <span className="mo-view-corner bl" aria-hidden />
            <span className="mo-view-corner br" aria-hidden />
            {engineReady && !variantMatch && <div className="mo-scan-sweep" aria-hidden />}
            {variantMatch && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  boxShadow: 'inset 0 0 0 2px var(--accent-gold)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* OCR result card */}
          <div
            className="glass-raised"
            style={{ padding: '10px 12px', textAlign: 'center' }}
          >
            <div
              className="text-display"
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                color:
                  statusKind === 'success'
                    ? 'var(--success)'
                    : statusKind === 'warn'
                      ? 'var(--danger)'
                      : 'var(--ink-muted)',
              }}
            >
              {status || '—'}
            </div>
            {lastText && (
              <div
                className="text-display truncate mt-1"
                style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-subtle)' }}
              >
                {lastText}
              </div>
            )}
            {sessionCount > 0 && (
              <div
                className="text-display mt-1"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.25em',
                  color: 'var(--accent-gold)',
                }}
              >
                {sessionCount} card{sessionCount !== 1 ? 's' : ''} scanned
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onShutterFile(f);
              e.target.value = '';
            }}
          />

          <div className="flex gap-2">
            {showShutter && (
              <button
                type="button"
                className="app-btn primary flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={16} /> Take Photo
              </button>
            )}
            <button
              type="button"
              className="app-btn ghost flex-1"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} /> Search
            </button>
            <button
              type="button"
              className="app-btn"
              onClick={resetScanner}
              aria-label="Change engine"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </>
      )}

      {variantMatch && (
        <div className="glass-raised glow-gold" style={{ padding: '14px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="mo-section-label">
              Match: {variantMatch.cards[0]?.name ?? variantMatch.name}
            </span>
            <button
              type="button"
              className="app-btn ghost !px-2 !py-1"
              onClick={() => closeVariantPicker(true)}
              aria-label="Skip variant"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {variantMatch.cards.map((card) => {
              const cn = card.collector_number;
              const variant = classifyFoil(card);
              const foilable = canBeFoil(card);
              const foilList = foilOwned[cn] ?? [];
              const isFoilOwned = variant !== 'none' && foilList.includes(variant);
              const isOwned = ownedSet.has(cn);
              const label =
                variant === 'none' || variant === 'regular-foil'
                  ? 'Regular'
                  : (foilLabelMap[variant] ?? 'Variant');
              return (
                <div key={cn} className="app-variant-card">
                  <div className="app-price-thumb !w-full !h-28">
                    <CardImage src={card.image_small} alt={card.name} className="h-full w-full" />
                  </div>
                  <div
                    className="text-display mt-1"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.22em',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    #{cn} · {label}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      type="button"
                      className="app-btn primary flex-1 !px-2 !py-1 !text-[10px]"
                      onClick={() => {
                        addScannedCard(card);
                        closeVariantPicker(true);
                      }}
                    >
                      {isOwned ? '✓' : '+'} Add
                    </button>
                    {foilable && (
                      <button
                        type="button"
                        className={`app-btn flex-1 !px-2 !py-1 !text-[10px] ${isFoilOwned ? 'ghost' : ''}`}
                        onClick={() => {
                          addScannedFoil(card);
                          closeVariantPicker(true);
                        }}
                      >
                        {isFoilOwned ? '✓ Foil' : '✦ Foil'}
                      </button>
                    )}
                    {onPickCard && (
                      <button
                        type="button"
                        className="app-btn ghost !px-2 !py-1 !text-[10px]"
                        onClick={() => onPickCard(card)}
                        aria-label="Inspect"
                      >
                        ⓘ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="glass-raised" style={{ padding: '14px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="mo-section-label">Manual Search</span>
            <button
              type="button"
              className="app-btn ghost !px-2 !py-1"
              onClick={() => {
                setSearchOpen(false);
                setSearchQ('');
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <div className="app-search mb-2">
            <Search size={16} style={{ color: 'var(--accent-gold)' }} />
            <input
              placeholder="Type a card name or number…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              autoFocus
            />
          </div>
          {searchResults.length === 0 ? (
            <div
              className="text-display text-center"
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                color: 'var(--ink-muted)',
                padding: '12px 0',
              }}
            >
              Start typing to search
            </div>
          ) : (
            searchResults.map((c) => (
              <div
                key={c.collector_number}
                className="app-price-row"
                onClick={() => {
                  addScannedCard(c);
                  setSearchOpen(false);
                  setSearchQ('');
                }}
              >
                <div className="app-price-thumb">
                  <CardImage src={c.image_small} alt={c.name} className="h-full w-full" />
                </div>
                <div className="pi">
                  <div className="pi-name">{c.name}</div>
                  <div className="pi-sub">
                    FIN · #{c.collector_number} · {c.rarity}
                  </div>
                </div>
                <Plus size={20} style={{ color: 'var(--accent-gold)' }} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
