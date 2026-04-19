import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { Toast } from './components/Toast';
import { Dashboard } from './components/tabs/Dashboard';
import { Portfolio } from './components/tabs/Portfolio';
import { Timeline } from './components/tabs/Timeline';
import { Binder } from './components/tabs/Binder';
import { Collector } from './components/tabs/Collector';
import { Settings } from './components/tabs/Settings';
import { SearchModal } from './components/modals/SearchModal';
import { CardModal } from './components/modals/CardModal';
import { PackModal } from './components/modals/PackModal';
import { MoreSheet } from './components/MoreSheet';
import { useAutoSync } from './hooks/useAutoSync';
import { useThemeStore } from './store/theme';
import { useConfigStore } from './store/config';
import type { Card as CardT } from './lib/schemas';

export type TabKey = 'dashboard' | 'portfolio' | 'timeline' | 'binder' | 'collector' | 'settings';

export function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [active, setActive] = useState<CardT | null>(null);
  const mode = useThemeStore((s) => s.mode);
  const configured = useConfigStore((s) => s.binder.configured);

  useEffect(() => {
    if (!configured) setTab('settings');
  }, [configured]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useAutoSync();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-32 pt-3">
        {tab === 'dashboard' && <Dashboard onJumpTo={setTab} onOpenSearch={() => setSearchOpen(true)} onOpenPack={() => setPackOpen(true)} />}
        {tab === 'portfolio' && <Portfolio />}
        {tab === 'timeline' && <Timeline />}
        {tab === 'binder' && <Binder />}
        {tab === 'collector' && <Collector />}
        {tab === 'settings' && <Settings />}
      </main>
      <TabNav
        active={tab}
        onChange={setTab}
        onSearch={() => setSearchOpen(true)}
        onMore={() => setMoreOpen(true)}
      />
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
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onPick={(k) => {
          setTab(k);
          setMoreOpen(false);
        }}
      />
      <Toast />
    </div>
  );
}
