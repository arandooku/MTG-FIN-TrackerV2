import { useMemo, useState } from 'react';
import {
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Download,
  Upload,
  Cloud,
  HelpCircle,
  Info,
  KeyRound,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useConfigStore } from '@/store/config';
import { useSyncStore } from '@/store/sync';
import { useCollectionStore } from '@/store/collection';
import { useThemeStore } from '@/store/theme';
import { useAllCards } from '@/hooks/useCards';
import { BINDER_PRESETS } from '@/lib/binder';
import { BinderWizard } from '../BinderWizard';
import { toast } from '@/store/toast';
import { relativeTime } from '@/lib/utils';
import type { ReactNode } from 'react';

type SectionKey = 'binder' | 'collection' | 'cloud' | 'data' | 'about';

export function Settings() {
  const cfg = useConfigStore();
  const sync = useSyncStore();
  const coll = useCollectionStore();
  const theme = useThemeStore();
  const { main } = useAllCards();
  const [open, setOpen] = useState<SectionKey | null>(null);

  const owned = coll.owned;
  const ownedCount = useMemo(() => new Set(owned).size, [owned]);

  if (!cfg.binder.configured) {
    return (
      <div className="app-content has-fab-top scroll">
        <BinderWizard onDone={() => undefined} />
      </div>
    );
  }

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

  const toggleSection = (k: SectionKey) => setOpen((cur) => (cur === k ? null : k));

  return (
    <div className="app-content has-fab-top scroll">
      {/* PROFILE HERO — glass-raised + gold glow */}
      <div
        className="glass-raised glow-gold"
        style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div className="app-avatar">P</div>
        <div className="flex-1 min-w-0">
          <div
            className="text-display"
            style={{
              fontSize: 13,
              letterSpacing: '0.25em',
              color: 'var(--accent-gold-bright)',
            }}
          >
            Planeswalker
          </div>
          <div
            className="text-display mt-1"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'var(--ink-muted)',
            }}
          >
            Lv. {Math.floor(ownedCount / 5)} · {ownedCount} owned · {coll.packs.length} packs
          </div>
        </div>
        <button
          type="button"
          className="app-btn ghost !py-1.5 !px-3"
          style={{ fontSize: 10 }}
          onClick={() => theme.toggle()}
        >
          {theme.mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme.mode}
        </button>
      </div>

      <div className="stack cols-2">
      <div className="flex flex-col gap-1.5 min-w-0">
      <Section
        label="Binder Layout"
        icon={<Layers size={16} />}
        isOpen={open === 'binder'}
        onToggle={() => toggleSection('binder')}
      >
        <div className="app-rows">
          <div className="app-row">
            <div className="rl">
              <span className="ri">▦</span>Preset
            </div>
            <div className="rv flex-wrap justify-end">
              {BINDER_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`app-chip ${cfg.binder.presetName === p.name ? 'active' : ''}`}
                  onClick={() => cfg.applyPreset(p.name, main.length || 309)}
                  title={p.name}
                  style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="app-row">
            <div className="rl">
              <span className="ri">⊞</span>Grid
            </div>
            <div className="rv">
              {cfg.binder.gridRows}×{cfg.binder.gridCols} · {cfg.binder.pageCount} pages
            </div>
          </div>
          <div className="app-row">
            <div className="rl">
              <span className="ri">✦</span>Collector Binder
            </div>
            <div className="rv">
              <button
                type="button"
                className={`app-toggle ${cfg.binder.scope.collectorBinder ? 'on' : ''}`}
                onClick={() => cfg.setCollectorBinder(!cfg.binder.scope.collectorBinder)}
                aria-pressed={cfg.binder.scope.collectorBinder}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        label="Collection"
        icon={<DollarSign size={16} />}
        isOpen={open === 'collection'}
        onToggle={() => toggleSection('collection')}
      >
        <div className="app-rows">
          <Row icon={<DollarSign size={16} />} label="Currency">
            <div className="flex gap-1">
              {(['USD', 'MYR'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`app-chip ${cfg.currency === c ? 'active' : ''}`}
                  onClick={() => cfg.setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </Row>
          <Row icon={<Layers size={16} />} label="OCR Engine">
            <div className="flex gap-1">
              {(['tesseract', 'ocrspace'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  className={`app-chip ${cfg.ocrEngine === e ? 'active' : ''}`}
                  onClick={() => cfg.setOcrEngine(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </Row>
          {cfg.ocrEngine === 'ocrspace' && (
            <Row icon={<KeyRound size={16} />} label="OCR.space Key">
              <input
                type="password"
                className="app-search text-truncate !p-1.5 max-w-[180px]"
                placeholder="paste key"
                value={cfg.ocrSpaceKey}
                onChange={(e) => cfg.setOcrSpaceKey(e.target.value)}
                style={{ fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))' }}
              />
            </Row>
          )}
          <Row icon={<Sparkles size={16} />} label="Mute Celebrations">
            <button
              type="button"
              className={`app-toggle ${cfg.muteCelebration ? '' : 'on'}`}
              onClick={() => cfg.setMuteCelebration(!cfg.muteCelebration)}
              aria-pressed={!cfg.muteCelebration}
            />
          </Row>
        </div>
      </Section>

      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
      <Section
        label="Cloud Sync"
        icon={<Cloud size={16} />}
        isOpen={open === 'cloud'}
        onToggle={() => toggleSection('cloud')}
      >
        <div className="app-rows">
          <Row icon={<KeyRound size={16} />} label="GitHub Token">
            <input
              type="password"
              className="app-search text-truncate !p-1.5 max-w-[180px]"
              placeholder="ghp_…"
              value={sync.token}
              onChange={(e) => sync.setToken(e.target.value)}
              style={{ fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))' }}
            />
          </Row>
          <Row icon={<Cloud size={16} />} label="Gist ID">
            <input
              type="text"
              className="app-search text-truncate !p-1.5 max-w-[180px]"
              placeholder="auto-discover"
              value={sync.gistId}
              onChange={(e) => sync.setGistId(e.target.value)}
              style={{ fontSize: 'var(--fs-body, clamp(0.85rem, 1.2vw, 0.95rem))' }}
              title={sync.gistId || undefined}
            />
          </Row>
          <Row icon={<RefreshCw size={16} />} label="Auto Push">
            <button
              type="button"
              className={`app-toggle ${sync.autoSync ? 'on' : ''}`}
              onClick={() => sync.setAutoSync(!sync.autoSync)}
              aria-pressed={sync.autoSync}
            />
          </Row>
          <div className="app-row">
            <div className="rl">
              <span className="ri">⤡</span>Sync
            </div>
            <div className="rv">
              <button
                type="button"
                className="app-chip"
                onClick={onDiscover}
                disabled={!sync.token || sync.isSyncing}
              >
                Discover
              </button>
              <button
                type="button"
                className="app-chip"
                onClick={onPull}
                disabled={sync.isSyncing}
              >
                <Download size={16} /> Pull
              </button>
              <button
                type="button"
                className="app-chip"
                onClick={onPush}
                disabled={sync.isSyncing}
              >
                <Upload size={16} /> Push
              </button>
            </div>
          </div>
          {sync.lastSyncedAt && (
            <div className="app-row">
              <div
                className="rl text-display"
                style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--ink-muted)' }}
              >
                Last sync
              </div>
              <div className="rv">{relativeTime(sync.lastSyncedAt)}</div>
            </div>
          )}
          {sync.lastError && (
            <div className="app-row">
              <div
                className="rl text-display"
                style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--danger)' }}
              >
                Error
              </div>
              <div className="rv" style={{ color: 'var(--danger)', fontSize: 10 }}>
                {sync.lastError}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* DATA — Danger Zone red-glow border */}
      <Section
        label="Data · Danger Zone"
        icon={<AlertTriangle size={16} />}
        isOpen={open === 'data'}
        onToggle={() => toggleSection('data')}
        danger
      >
        <div className="app-rows">
          <button
            type="button"
            className="app-row w-full text-left"
            onClick={() => {
              if (
                confirm(
                  'Wipe all local collection data and restart onboarding? This cannot be undone.',
                )
              ) {
                coll.clearAll();
                cfg.resetOnboarding();
                toast({ title: 'Collection cleared', variant: 'success' });
              }
            }}
          >
            <div className="rl" style={{ color: 'var(--danger)' }}>
              <span className="ri" style={{ color: 'var(--danger)' }}>
                <Trash2 size={16} />
              </span>
              Reset App Data
            </div>
            <div className="rv" style={{ color: 'var(--danger)' }}>
              ›
            </div>
          </button>
        </div>
      </Section>

      <Section
        label="About"
        icon={<Info size={16} />}
        isOpen={open === 'about'}
        onToggle={() => toggleSection('about')}
      >
        <div className="app-rows">
          <div className="app-row">
            <div className="rl">
              <span className="ri">
                <HelpCircle size={16} />
              </span>
              Documentation
            </div>
            <div className="rv">
              <a
                href="https://scryfall.com/sets/fin"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-gold)' }}
              >
                Scryfall ›
              </a>
            </div>
          </div>
          <div className="app-row">
            <div className="rl">
              <span className="ri">
                <Info size={16} />
              </span>
              Version
            </div>
            <div className="rv">2.0.0</div>
          </div>
        </div>
      </Section>
      </div>
      </div>
    </div>
  );
}

interface SectionProps {
  label: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  danger?: boolean;
}

function Section({ label, icon, isOpen, onToggle, children, danger = false }: SectionProps) {
  const accent = danger ? 'var(--danger)' : 'var(--accent-gold)';
  const glowClass = danger ? '' : isOpen ? 'glow-gold' : '';
  const borderStyle = danger
    ? {
        borderColor: 'rgba(211, 106, 106, 0.35)',
        boxShadow: '0 0 0 1px rgba(211, 106, 106, 0.35), 0 0 18px rgba(211, 106, 106, 0.2)',
      }
    : undefined;
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        type="button"
        className={`glass w-full text-left flex items-center justify-between ${glowClass}`}
        onClick={onToggle}
        style={{ padding: '10px 12px', ...borderStyle }}
      >
        <span className="flex items-center gap-2">
          <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>
          <span
            className="text-display"
            style={{
              fontSize: 11,
              letterSpacing: '0.28em',
              color: danger ? 'var(--danger)' : 'var(--ink-primary)',
            }}
          >
            {label}
          </span>
        </span>
        <span style={{ color: accent }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {isOpen && (
        <div
          className="glass"
          style={{ padding: '10px 12px', marginTop: 4, ...borderStyle }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface RowProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}
function Row({ icon, label, children }: RowProps) {
  return (
    <div className="app-row">
      <div className="rl">
        <span className="ri">{icon}</span>
        {label}
      </div>
      <div className="rv">{children}</div>
    </div>
  );
}
