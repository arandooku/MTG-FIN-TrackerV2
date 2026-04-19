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
import { useAutoSync } from './hooks/useAutoSync';
import { useThemeStore } from './store/theme';

export type TabKey = 'dashboard' | 'portfolio' | 'timeline' | 'binder' | 'collector' | 'settings';

export function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useAutoSync();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'portfolio' && <Portfolio />}
        {tab === 'timeline' && <Timeline />}
        {tab === 'binder' && <Binder />}
        {tab === 'collector' && <Collector />}
        {tab === 'settings' && <Settings />}
      </main>
      <Toast />
    </div>
  );
}
