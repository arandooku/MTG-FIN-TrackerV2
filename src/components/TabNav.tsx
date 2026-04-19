import { Gem, Package, Search, BookOpen, MoreHorizontal } from 'lucide-react';
import type { TabKey } from '@/App';

interface TabNavProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
  onSearch: () => void;
  onMore: () => void;
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof Gem }> = [
  { key: 'dashboard', label: 'Home', icon: Gem },
  { key: 'portfolio', label: 'Value', icon: Package },
  { key: 'binder', label: 'Binder', icon: BookOpen },
];

export function TabNav({ active, onChange, onSearch, onMore }: TabNavProps) {
  const [home, value, binder] = TABS;

  return (
    <nav className="bnav">
      <div className="bnav-inner">
        <NavBtn tab={home} active={active} onChange={onChange} />
        <NavBtn tab={value} active={active} onChange={onChange} />
        <button
          type="button"
          className="bnav-fab"
          onClick={onSearch}
          aria-label="Search cards"
        >
          <Search className="h-6 w-6" strokeWidth={2.2} />
          <span className="bnav-fab-label">Search</span>
        </button>
        <NavBtn tab={binder} active={active} onChange={onChange} />
        <button
          type="button"
          className="bnav-btn"
          onClick={onMore}
          aria-current={
            active === 'timeline' || active === 'collector' || active === 'settings'
          }
        >
          <MoreHorizontal />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}

interface NavBtnProps {
  tab: (typeof TABS)[number];
  active: TabKey;
  onChange: (t: TabKey) => void;
}

function NavBtn({ tab, active, onChange }: NavBtnProps) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      className="bnav-btn"
      aria-current={active === tab.key}
      onClick={() => onChange(tab.key)}
    >
      <Icon />
      <span>{tab.label}</span>
    </button>
  );
}
