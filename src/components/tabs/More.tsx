import { Clock, Settings as Cog, Sun, Moon, Package, ExternalLink, ChevronRight } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { useCollectionStore } from '@/store/collection';
import type { TabKey } from '@/App';
import type { ReactNode } from 'react';

interface MoreProps {
  onPick: (k: TabKey) => void;
  onOpenPack: () => void;
}

export function More({ onPick, onOpenPack }: MoreProps) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  const owned = useCollectionStore((s) => s.owned);
  const packs = useCollectionStore((s) => s.packs);

  return (
    <div className="app-content">
      {/* PROFILE HERO */}
      <div
        className="glass-raised glow-gold"
        style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div className="app-avatar">P</div>
        <div className="flex-1">
          <div
            className="text-display"
            style={{
              fontSize: 14,
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
            {new Set(owned).size} unique · {packs.length} packs
          </div>
        </div>
      </div>

      <SectionHeader>Navigate</SectionHeader>
      <div className="more-grid">
        <MoreRow
          icon={<Clock size={20} />}
          label="Timeline"
          onClick={() => onPick('timeline')}
        />
        <MoreRow
          icon={<Package size={20} />}
          label="Open Booster Pack"
          onClick={onOpenPack}
        />
        <MoreRow
          icon={<Cog size={20} />}
          label="Settings"
          onClick={() => onPick('settings')}
        />
      </div>

      <SectionHeader>Display</SectionHeader>
      <div className="more-grid">
        <MoreRow
          icon={mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          label={mode === 'dark' ? 'Light Theme' : 'Dark Theme'}
          onClick={toggle}
        />
      </div>

      <SectionHeader>Links</SectionHeader>
      <div className="more-grid">
        <a
          href="https://scryfall.com/sets/fin"
          target="_blank"
          rel="noreferrer"
          className="glass flex items-center gap-3"
          style={{
            padding: '14px 16px',
            minHeight: 56,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span style={{ color: 'var(--accent-gold)', display: 'inline-flex' }}>
            <ExternalLink size={20} />
          </span>
          <span
            className="text-display text-truncate flex-1"
            style={{
              fontSize: 12,
              letterSpacing: '0.22em',
              color: 'var(--ink-primary)',
            }}
          >
            Scryfall · FIN Set
          </span>
          <span style={{ color: 'var(--accent-gold)' }}>↗</span>
        </a>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2" style={{ margin: '6px 2px -2px' }}>
      <span className="mo-section-label">{children}</span>
      <span
        style={{
          flex: 1,
          height: 1,
          background:
            'linear-gradient(90deg, var(--border-hair), transparent)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}

interface MoreRowProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}
function MoreRow({ icon, label, onClick }: MoreRowProps) {
  return (
    <button
      type="button"
      className="glass flex items-center gap-3 w-full text-left transition-colors hover:border-[var(--border-glow)]"
      style={{ padding: '14px 16px', minHeight: 56 }}
      onClick={onClick}
    >
      <span style={{ color: 'var(--accent-gold)', display: 'inline-flex' }}>
        {icon}
      </span>
      <span
        className="text-display text-truncate flex-1"
        style={{
          fontSize: 12,
          letterSpacing: '0.22em',
          color: 'var(--ink-primary)',
        }}
      >
        {label}
      </span>
      <span style={{ color: 'var(--ink-muted)', display: 'inline-flex' }}>
        <ChevronRight size={16} />
      </span>
    </button>
  );
}
