import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { useConfigStore } from '@/store/config';
import { useCollectionStore } from '@/store/collection';
import {
  extractCollectorNumbers,
  ocrSpaceRecognize,
  tesseractRecognize,
} from '@/lib/ocr';
import { toast } from '@/store/toast';

export function Scanner() {
  const engine = useConfigStore((s) => s.ocrEngine);
  const apiKey = useConfigStore((s) => s.ocrSpaceKey);
  const addCard = useCollectionStore((s) => s.addCard);
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setFound([]);
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
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
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
        <Button onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Scanning…' : 'Scan Card'}
        </Button>
        <span className="text-xs text-muted-foreground">Engine: {engine}</span>
      </div>
      {found.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm">Detected collector numbers:</div>
          <div className="flex flex-wrap gap-1">
            {found.map((cn, i) => (
              <Button
                key={`${cn}-${i}`}
                size="sm"
                variant="outline"
                onClick={() => {
                  addCard(cn, 'scan');
                  toast({ title: `Added #${cn}`, variant: 'success' });
                }}
              >
                + #{cn}
              </Button>
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
