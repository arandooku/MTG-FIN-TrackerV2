import { useState } from 'react';
import { useConfigStore } from '@/store/config';
import { useAllCards } from '@/hooks/useCards';
import { BINDER_PRESETS, calcPageCount } from '@/lib/binder';
import { toast } from '@/store/toast';

interface BinderWizardProps {
  onDone: () => void;
}

export function BinderWizard({ onDone }: BinderWizardProps) {
  const cfg = useConfigStore();
  const { main, variants } = useAllCards();
  const total = main.length || 309;

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [presetName, setPresetName] = useState(cfg.binder.presetName || '9-pocket');
  const [rows, setRows] = useState(cfg.binder.gridRows);
  const [cols, setCols] = useState(cfg.binder.gridCols);
  const [collectorBinder, setCollectorBinder] = useState(cfg.binder.scope.collectorBinder);

  const isCustom = presetName === 'Custom';
  const preset = BINDER_PRESETS.find((p) => p.name === presetName);
  const spp = isCustom ? Math.max(1, rows * cols) : preset?.slotsPerPage ?? 9;
  const pages = calcPageCount(total, spp);
  const pct = ((step / 3) * 100).toFixed(1) + '%';

  const advance = (d: 1 | -1) => {
    setDir(d);
    setStep((s) => Math.max(1, Math.min(3, s + d)));
  };

  const handleFinish = () => {
    if (isCustom) {
      cfg.setCustomGrid(rows, cols, total);
    } else {
      cfg.applyPreset(presetName, total);
    }
    cfg.setCollectorBinder(collectorBinder);
    cfg.markConfigured(total);
    toast({ title: 'Binder configured!', description: 'Welcome.', variant: 'success' });
    onDone();
  };

  return (
    <div className="settings-wrap">
      <div className="wizard-card">
          <div className="wizard-progress">
            <div className="wizard-progress-fill" style={{ width: pct }} />
          </div>
          <div className="wizard-step-container">
            <div
              key={step}
              className={dir > 0 ? 'wizard-step' : 'wizard-step enter-back'}
            >
              {step === 1 && (
                <>
                  <h2>Choose your binder</h2>
                  <p className="step-sub">
                    Select the pocket size that matches your physical binder.
                  </p>
                  <div className="settings-row">
                    <label htmlFor="wiz-preset">Binder type</label>
                    <select
                      id="wiz-preset"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px' }}
                      value={presetName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPresetName(v);
                        const p = BINDER_PRESETS.find((pp) => pp.name === v);
                        if (p) {
                          setRows(p.gridRows);
                          setCols(p.gridCols);
                        }
                      }}
                    >
                      {BINDER_PRESETS.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.gridRows}×{p.gridCols})
                        </option>
                      ))}
                      <option value="Custom">Custom…</option>
                    </select>
                  </div>
                  {isCustom && (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={rows}
                        onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Rows"
                        className="w-20 px-2 py-1.5 rounded bg-[var(--slot-bg)] border border-[var(--ff-border)]"
                      />
                      <span className="text-[var(--text-muted)]">×</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={cols}
                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Cols"
                        className="w-20 px-2 py-1.5 rounded bg-[var(--slot-bg)] border border-[var(--ff-border)]"
                      />
                    </div>
                  )}
                  <p className="settings-live-summary">
                    <span className="pop">{spp}</span> slots per page · approx{' '}
                    <span className="pop">{pages}</span> pages
                  </p>
                  <div className="wizard-nav">
                    <button className="btn btn-primary wizard-cta" onClick={() => advance(1)}>
                      Next →
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2>What will you collect?</h2>
                  <p className="step-sub">Choose the card pools you want to track.</p>
                  <div className="toggle-wrap flex items-center gap-3 mb-3 p-3 rounded-lg bg-[var(--slot-bg)] border border-[var(--ff-border)]">
                    <div className="toggle-label flex-1">
                      <strong>Main Set</strong>
                      <span className="block text-xs text-[var(--text-muted)]">
                        ~{total} booster-pack cards (always included)
                      </span>
                    </div>
                    <label className="toggle-switch locked">
                      <input type="checkbox" checked disabled />
                      <span className="toggle-track" />
                      <span className="toggle-thumb" />
                    </label>
                  </div>
                  <div className="toggle-wrap flex items-center gap-3 mb-3 p-3 rounded-lg bg-[var(--slot-bg)] border border-[var(--ff-border)]">
                    <div className="toggle-label flex-1">
                      <strong>Collector Binder</strong>
                      <span className="block text-xs text-[var(--text-muted)]">
                        Foils, extended art, showcase, surge foil & more
                      </span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={collectorBinder}
                        onChange={(e) => setCollectorBinder(e.target.checked)}
                      />
                      <span className="toggle-track" />
                      <span className="toggle-thumb" />
                    </label>
                  </div>
                  <p className="settings-live-summary">
                    Tracking <span className="pop">{total}</span> cards across{' '}
                    <span className="pop">{pages}</span> pages
                    {collectorBinder && variants.length > 0 && (
                      <span className="block text-[0.72rem] text-[var(--text-muted)]">
                        + {variants.length} collector variants
                      </span>
                    )}
                  </p>
                  <div className="wizard-nav">
                    <button className="btn btn-secondary" onClick={() => advance(-1)}>
                      ← Back
                    </button>
                    <button className="btn btn-primary wizard-cta" onClick={() => advance(1)}>
                      Next →
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2>Ready to go</h2>
                  <p className="step-sub">
                    Your binder is configured. You can change this later in Settings.
                  </p>
                  <div className="settings-section">
                    <div className="settings-section-title">Summary</div>
                    <p className="text-sm mb-1">
                      <strong>{presetName}</strong> · {spp} slots/page · {pages} pages
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Main Set{collectorBinder ? ' · Collector Binder' : ''}
                    </p>
                  </div>
                  <div className="wizard-nav">
                    <button className="btn btn-secondary" onClick={() => advance(-1)}>
                      ← Back
                    </button>
                    <button className="btn btn-primary wizard-cta" onClick={handleFinish}>
                      Set Up My Binder
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
