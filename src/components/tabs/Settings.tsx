import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useConfigStore } from '@/store/config';
import { useSyncStore } from '@/store/sync';
import { useCollectionStore } from '@/store/collection';
import { toast } from '@/store/toast';
import { BINDER_PRESETS } from '@/lib/binder';
import { useAllCards } from '@/hooks/useCards';
import { BinderWizard } from '../BinderWizard';

export function Settings() {
  const cfg = useConfigStore();
  const sync = useSyncStore();
  const collection = useCollectionStore();
  const { main } = useAllCards();

  const onDiscover = async () => {
    await sync.discoverOrCreate();
    const err = useSyncStore.getState().lastError;
    toast({
      title: err ? 'Discover failed' : 'Gist ready',
      description: err ?? useSyncStore.getState().gistId,
      variant: err ? 'error' : 'success',
    });
  };

  const onPull = async () => {
    await sync.pull();
    const err = useSyncStore.getState().lastError;
    toast({
      title: err ? 'Pull failed' : 'Pulled from Gist',
      description: err ?? undefined,
      variant: err ? 'error' : 'success',
    });
  };

  const onPush = async () => {
    await sync.push();
    const err = useSyncStore.getState().lastError;
    toast({
      title: err ? 'Push failed' : 'Pushed to Gist',
      description: err ?? undefined,
      variant: err ? 'error' : 'success',
    });
  };

  if (!cfg.binder.configured) {
    return <BinderWizard onDone={() => { /* config now configured; tab stays */ }} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Binder Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BINDER_PRESETS.map((p) => (
              <Button
                key={p.name}
                variant={cfg.binder.presetName === p.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => cfg.applyPreset(p.name, main.length || 309)}
              >
                {p.name}
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {cfg.binder.gridRows} × {cfg.binder.gridCols} · {cfg.binder.slotsPerPage} slots/page · {cfg.binder.pageCount} pages
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & OCR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {(['USD', 'MYR'] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cfg.currency === c ? 'default' : 'outline'}
                onClick={() => cfg.setCurrency(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['tesseract', 'ocrspace'] as const).map((e) => (
              <Button
                key={e}
                size="sm"
                variant={cfg.ocrEngine === e ? 'default' : 'outline'}
                onClick={() => cfg.setOcrEngine(e)}
              >
                {e}
              </Button>
            ))}
          </div>
          {cfg.ocrEngine === 'ocrspace' && (
            <div className="space-y-1">
              <Label htmlFor="ocrkey">OCR.space API key</Label>
              <Input
                id="ocrkey"
                type="password"
                value={cfg.ocrSpaceKey}
                onChange={(e) => cfg.setOcrSpaceKey(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gist Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="gtoken">GitHub token (gist scope)</Label>
            <Input
              id="gtoken"
              type="password"
              value={sync.token}
              onChange={(e) => sync.setToken(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="gid">Gist ID</Label>
            <Input
              id="gid"
              value={sync.gistId}
              onChange={(e) => sync.setGistId(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sync.autoSync}
              onChange={(e) => sync.setAutoSync(e.target.checked)}
            />
            Auto-push on changes
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onDiscover} disabled={!sync.token || sync.isSyncing}>
              Discover / Create Gist
            </Button>
            <Button size="sm" variant="outline" onClick={onPull} disabled={sync.isSyncing}>
              Pull
            </Button>
            <Button size="sm" variant="outline" onClick={onPush} disabled={sync.isSyncing}>
              Push
            </Button>
            <Button size="sm" variant="destructive" onClick={sync.clearCredentials}>
              Clear credentials
            </Button>
          </div>
          {sync.lastError && <div className="text-xs text-destructive">{sync.lastError}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Wipe all local collection data? This cannot be undone.')) {
                collection.clearAll();
                toast({ title: 'Collection cleared', variant: 'success' });
              }
            }}
          >
            Clear collection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
