import { useRef, useState } from 'react';
import { useConfigStore } from '@/store/config';
import { useCollectionStore } from '@/store/collection';
import {
  extractCollectorNumbers,
  ocrSpaceRecognize,
  tesseractRecognize,
} from '@/lib/ocr';
import { toast } from '@/store/toast';
import { useAllCards } from '@/hooks/useCards';
import { useCelebrate } from '@/hooks/useCelebrate';

export function Scanner() {
  const engine = useConfigStore((s) => s.ocrEngine);
  const apiKey = useConfigStore((s) => s.ocrSpaceKey);
  const addCard = useCollectionStore((s) => s.addCard);
  const all = useAllCards();
  const { celebrateAdd } = useCelebrate();
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setFound([]);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      let text: string;
      if (engine === 'ocrspace') {
        if (!apiKey) {
          toast({ title: 'OCR.space key missing', variant: 'error' });
          return;
        }
        const base64 = await fileToDataUrl(file);
        text = await ocrSpaceRecognize(apiKey, base64);
      } else {
        text = await tesseractRecognize(file);
      }
      const cns = extractCollectorNumbers(text);
      setFound(cns);
      if (!cns.length) toast({ title: 'No numbers detected', variant: 'error' });
    } catch (err: unknown) {
      toast({
        title: 'Scan failed',
        description: err instanceof Error ? err.message : 'unknown',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash-card !p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm">Card Scanner</h3>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          Engine: {engine}
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
      />

      <div className="scanner-viewfinder mb-3" onClick={() => fileRef.current?.click()}>
        {previewUrl ? (
          <img src={previewUrl} alt="scanned" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/60 text-xs">
            Tap to capture
          </div>
        )}
        <div className="scanner-guide-rect" />
        <div className="scanner-guide-label">{busy ? 'Scanning…' : 'Frame card · tap to capture'}</div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Scanning…' : '📷 Capture Card'}
        </button>
        {previewUrl && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPreviewUrl(null);
              setFound([]);
            }}
          >
            Reset
          </button>
        )}
      </div>

      {found.length > 0 && (
        <div className="mt-3">
          <div className="mb-2 text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)]">
            Detected
          </div>
          <div className="flex flex-wrap gap-1.5">
            {found.map((cn, i) => (
              <button
                key={`${cn}-${i}`}
                type="button"
                className="search-chip search-chip-scan"
                onClick={() => {
                  addCard(cn, 'scan');
                  const card =
                    all.main.find((c) => c.collector_number === cn) ??
                    all.variants.find((c) => c.collector_number === cn);
                  if (card) celebrateAdd(card);
                  else toast({ title: `Added #${cn}`, variant: 'success' });
                }}
              >
                + #{cn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
