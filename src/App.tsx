import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Settings as Cog, ChevronLeft } from 'lucide-react';
import { Toast } from './components/Toast';
import { BottomNav } from './components/shell/BottomNav';
import { Dashboard } from './components/tabs/Dashboard';
import { Binder } from './components/tabs/Binder';
import { Market } from './components/tabs/Market';
import { Scan } from './components/tabs/Scan';
import { Settings } from './components/tabs/Settings';
import { More } from './components/tabs/More';
import { Timeline } from './components/tabs/Timeline';
import { Collector } from './components/tabs/Collector';
import { SearchModal } from './components/modals/SearchModal';
import { CardModal } from './components/modals/CardModal';
import { PackModal } from './components/modals/PackModal';
import { Ff7rMockup } from './components/ff7r/Ff7rMockup';
import { FfxivMockup } from './components/ffxiv/FfxivMockup';
import { AetherMockup } from './components/aether/AetherMockup';
import { useAutoSync } from './hooks/useAutoSync';
import { useThemeStore } from './store/theme';
import { useConfigStore } from './store/config';
import { useSyncStore } from './store/sync';
import { isValidGistId } from './lib/gist';
import type { Card as CardT } from './lib/schemas';

export type TabKey =
  | 'dashboard'
  | 'binder'
  | 'scan'
  | 'portfolio'
  | 'more'
  | 'timeline'
  | 'collector'
  | 'settings';

type DesignKey = 'ff7r' | 'ffxiv' | 'aether' | null;
const readDesign = (): DesignKey => {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('design');
  return v === 'ff7r' || v === 'ffxiv' || v === 'aether' ? v : null;
};

export function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [active, setActive] = useState<CardT | null>(null);
  const [design, setDesign] = useState<DesignKey>(readDesign);
  const mode = useThemeStore((s) => s.mode);
  const configured = useConfigStore((s) => s.binder.configured);
  const autoPullDone = useRef(false);

  useEffect(() => {
    if (!configured) setTab('settings');
  }, [configured]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-theme', mode);
    document.body.classList.add('app-active');
    return () => {
      document.body.classList.remove('app-active');
    };
  }, [mode]);

  useEffect(() => {
    const onPop = () => setDesign(readDesign());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (autoPullDone.current) return;
    const { token, gistId, pull } = useSyncStore.getState();
    const cfg = useConfigStore.getState().binder;
    if (token && isValidGistId(gistId) && !cfg.configured) {
      autoPullDone.current = true;
      void pull();
    }
  }, []);

  const exitDesign = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('design');
    window.history.replaceState({}, '', url.toString());
    setDesign(null);
  };

  useAutoSync();

  const inMoreSubpage = tab === 'timeline' || tab === 'settings';
  const reduceMotion = useReducedMotion();

  const pageTransition = reduceMotion
    ? { type: 'tween' as const, duration: 0.18 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };
  const pageInitial = reduceMotion ? { opacity: 0 } : { opacity: 0, x: 24 };
  const pageAnimate = reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 };
  const pageExit = reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 };

  const renderTab = (): ReactNode => {
    switch (tab) {
      case 'dashboard':
        return <Dashboard onJumpTo={setTab} onPickCard={(c) => setActive(c)} />;
      case 'binder':
        return <Binder onPickCard={setActive} />;
      case 'scan':
        return <Scan onPickCard={setActive} />;
      case 'portfolio':
        return <Market onPickCard={setActive} />;
      case 'more':
        return <More onPick={(k) => setTab(k)} onOpenPack={() => setPackOpen(true)} />;
      case 'timeline':
        return <Timeline />;
      case 'collector':
        return <Collector onPickCard={setActive} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell relative">
      {/* Aurora + noise background layers (Mythic Obsidian) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(79,196,240,0.10), transparent 60%),' +
            'radial-gradient(ellipse 70% 55% at 80% 110%, rgba(212,168,74,0.10), transparent 65%),' +
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(60,40,120,0.08), transparent 70%),' +
            'linear-gradient(180deg, var(--app-bg-0) 0%, #03050a 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div
        className="app-frame relative z-10"
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingLeft: 'clamp(16px, 4vw, 48px)',
          paddingRight: 'clamp(16px, 4vw, 48px)',
        }}
      >
        {inMoreSubpage && (
          <button
            type="button"
            className="app-fab app-fab-top left"
            onClick={() => setTab('more')}
            aria-label="Back"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {tab === 'dashboard' && (
          <button
            type="button"
            className="app-fab app-fab-top right"
            onClick={() => setTab('settings')}
            aria-label="Settings"
          >
            <Cog size={16} />
          </button>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="app-page"
            initial={pageInitial}
            animate={pageAnimate}
            exit={pageExit}
            transition={pageTransition}
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform, opacity',
            }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>

        <BottomNav
          active={tab}
          onChange={setTab}
          onSearch={() => setSearchOpen(true)}
        />
      </div>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPick={(c) => setActive(c)}
        onOpenPack={() => {
          setSearchOpen(false);
          setPackOpen(true);
        }}
      />
      <PackModal open={packOpen} onClose={() => setPackOpen(false)} />
      <CardModal card={active} onClose={() => setActive(null)} onSwitchCard={setActive} />
      <Toast />
      {design === 'ff7r' && <Ff7rMockup onExit={exitDesign} />}
      {design === 'ffxiv' && <FfxivMockup onExit={exitDesign} />}
      {design === 'aether' && <AetherMockup onExit={exitDesign} />}
    </div>
  );
}
