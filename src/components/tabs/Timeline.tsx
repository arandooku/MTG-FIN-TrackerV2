import { useMemo, useState } from 'react';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useCollectionStore } from '@/store/collection';
import { relativeTime } from '@/lib/utils';
import type { TimelineEvent } from '@/lib/schemas';

const PAGE = 12;

interface EventGroup {
  label: string;
  items: TimelineEvent[];
}

function groupByDay(events: TimelineEvent[]): EventGroup[] {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const d = new Date(e.date);
    const key = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function Timeline() {
  const events = useCollectionStore((s) => s.timeline);
  const [shown, setShown] = useState(PAGE);

  const sorted = useMemo(
    () => [...events].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [events],
  );

  if (!sorted.length) {
    return (
      <div className="app-content has-fab-top">
        <div
          className="glass-raised"
          style={{ padding: '32px 20px', textAlign: 'center' }}
        >
          <div
            className="text-display"
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'var(--ink-muted)',
            }}
          >
            No activity yet
          </div>
        </div>
      </div>
    );
  }

  const visible = sorted.slice(0, shown);
  const groups = groupByDay(visible);
  const canLoadMore = shown < sorted.length;

  return (
    <div className="app-content has-fab-top">
      <div
        className="glass-raised"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px',
        }}
      >
        {groups.map((g, gi) => (
          <div key={`${g.label}-${gi}`} style={{ marginBottom: 14 }}>
            {/* Date section header — Cinzel small-caps + ornate-hr */}
            <div className="flex items-center gap-2.5 mb-2" style={{ marginTop: gi === 0 ? 0 : 4 }}>
              <span
                className="text-display"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: 'var(--accent-gold)',
                  whiteSpace: 'nowrap',
                }}
              >
                {g.label}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 1,
                  background:
                    'linear-gradient(90deg, var(--accent-gold), var(--border-hair) 50%, transparent)',
                  opacity: 0.6,
                }}
              />
            </div>

            {/* Ledger — rail with connecting dots */}
            <div className="mo-ledger">
              {g.items.map((e, i) => {
                const color =
                  e.type === 'remove'
                    ? 'var(--danger)'
                    : e.type === 'pack'
                      ? 'var(--accent-crystal)'
                      : 'var(--success)';
                const action =
                  e.type === 'remove' ? 'Removed' : e.type === 'pack' ? 'Pack Pull' : 'Added';
                return (
                  <div
                    key={`${e.date}-${e.cn}-${i}`}
                    className="mo-ledger-row glass"
                    style={{
                      marginBottom: 6,
                      padding: '8px 10px 8px 32px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      className="mo-ledger-dot"
                      style={{ borderColor: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span
                      style={{
                        width: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color,
                      }}
                      aria-hidden
                    >
                      {e.type === 'remove' ? (
                        <Minus size={16} />
                      ) : e.type === 'pack' ? (
                        <Sparkles size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-display"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.15em',
                          color: 'var(--ink-primary)',
                        }}
                      >
                        {action}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'baseline',
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, monospace)',
                            fontSize: 11,
                            color: 'var(--accent-gold)',
                          }}
                        >
                          #{e.cn}
                        </span>
                        <span
                          className="text-display"
                          style={{
                            fontSize: 9,
                            letterSpacing: '0.2em',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          {e.source}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, monospace)',
                        fontSize: 10,
                        color: 'var(--ink-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relativeTime(e.date)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {canLoadMore && (
        <button
          type="button"
          className="app-loadmore"
          onClick={() => setShown((n) => n + PAGE)}
        >
          Load More ({sorted.length - shown})
        </button>
      )}
    </div>
  );
}
