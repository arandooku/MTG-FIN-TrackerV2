import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Home,
  Layers,
  Sparkles,
  ScanLine,
  TrendingUp,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import type { TabKey } from '@/App';
import { useConfigStore } from '@/store/config';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/store/toast';

interface BottomNavProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
  onSearch: () => void;
}

interface TabDef {
  key: TabKey;
  label: string;
  icon: typeof Home;
  gated?: boolean;
}

const LEFT_TABS: TabDef[] = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'binder', label: 'Binder', icon: Layers },
  { key: 'collector', label: 'Collector', icon: Sparkles, gated: true },
];

const RIGHT_TABS: TabDef[] = [
  { key: 'scan', label: 'Scan', icon: ScanLine },
  { key: 'portfolio', label: 'Market', icon: TrendingUp },
  { key: 'more', label: 'More', icon: MoreHorizontal },
];

/* Side-rail mode disabled — bottom-pill nav is used at every viewport size
   for symmetric, consistent UX between mobile and desktop. */
function useIsSideRail(): boolean {
  return false;
}

export function BottomNav({ active, onChange, onSearch }: BottomNavProps) {
  const collectorOn = useConfigStore((s) => s.binder.scope.collectorBinder);
  const reduceMotion = useReducedMotion();
  const isSideRail = useIsSideRail();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isNarrow = useMediaQuery('(max-width: 400px)');
  const spring = reduceMotion
    ? { type: 'tween' as const, duration: 0.18 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };

  const tabIconSize = isDesktop ? 24 : isNarrow ? 24 : 22;
  const tabLabelSize = isDesktop ? 11 : 10;
  const searchBtnSize = isDesktop ? 60 : 56;
  const showLabel = !isNarrow;

  const navStyle: CSSProperties = isSideRail
    ? {
        position: 'fixed',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        bottom: 'auto',
        width: 76,
        maxWidth: 76,
        padding: '12px 6px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridAutoRows: 'minmax(56px, auto)',
        gap: 4,
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        borderRadius: 999,
        border: '1px solid rgba(212,168,74,0.30)',
        boxShadow:
          '0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(240,207,110,0.18), 0 0 0 1px rgba(0,0,0,0.4)',
        zIndex: 60,
      }
    : {
        position: 'fixed',
        left: '50%',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        // Cap pill width: 600 on desktop, never wider than viewport - 32.
        // The hard cap of 640 below ensures nav never grows past it.
        width: 'min(600px, calc(100% - 32px))',
        maxWidth: 640,
        padding: isDesktop ? '10px 8px' : '8px 6px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr) 64px repeat(3, 1fr)',
        alignItems: 'center',
        gap: 2,
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        borderRadius: 999,
        border: '1px solid rgba(212,168,74,0.30)',
        boxShadow:
          '0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(240,207,110,0.18), 0 0 0 1px rgba(0,0,0,0.4)',
        zIndex: 60,
      };

  const renderTab = (t: TabDef) => {
    const Icon = t.icon;
    const isMore = t.key === 'more';
    const moreActive =
      isMore && (active === 'more' || active === 'timeline' || active === 'settings');
    const isActive = active === t.key || moreActive;
    const disabled = t.gated && !collectorOn;
    const handleClick = () => {
      if (disabled) {
        toast({
          title: 'Collector Binder disabled',
          description: 'Enable it in Settings → Binder.',
        });
        return;
      }
      onChange(t.key);
    };
    return (
      <button
        key={t.key}
        type="button"
        className={`app-tab ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        aria-current={isActive}
        aria-disabled={disabled || undefined}
        style={{ position: 'relative', padding: '6px 0', minHeight: 52 }}
      >
        {isActive && (
          <motion.span
            layoutId="nav-active"
            className="app-tab-indicator"
            transition={spring}
            aria-hidden
            style={{
              position: 'absolute',
              inset: 2,
              borderRadius: 999,
              background:
                'linear-gradient(180deg, rgba(79,196,240,0.22) 0%, rgba(43,123,168,0.16) 100%)',
              border: '1px solid rgba(79,196,240,0.55)',
              boxShadow:
                '0 0 18px rgba(79,196,240,0.45), inset 0 1px 0 rgba(141,219,245,0.35)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        <motion.span
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            color: isActive ? 'var(--app-crystal)' : undefined,
          }}
          animate={{ scale: isActive && !reduceMotion ? 1.12 : 1 }}
          transition={spring}
        >
          <Icon size={tabIconSize} strokeWidth={1.6} />
        </motion.span>
        {showLabel && (
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'var(--app-ui)',
              fontSize: tabLabelSize,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginTop: 2,
              color: isActive ? 'var(--app-crystal)' : undefined,
            }}
          >
            {t.label}
          </span>
        )}
      </button>
    );
  };

  const searchBtn = (
    <motion.button
      key="search"
      type="button"
      aria-label="Search"
      onClick={onSearch}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={spring}
      className="app-nav-search"
      style={{
        justifySelf: 'center',
        alignSelf: 'center',
        width: isSideRail ? 60 : searchBtnSize,
        height: isSideRail ? 60 : searchBtnSize,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#2a1a0a',
        background:
          'linear-gradient(180deg, var(--app-gold-bright), var(--app-gold))',
        border: '1px solid var(--app-gold)',
        boxShadow: isSideRail
          ? '0 8px 18px rgba(212,168,74,0.35), inset 0 1px 0 rgba(255,255,255,0.55)'
          : '0 10px 22px rgba(212,168,74,0.45), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 4px rgba(13,22,40,0.85)',
        transform: isSideRail ? 'none' : 'translateY(-14px)',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <Search size={isSideRail ? 24 : isDesktop ? 24 : 22} strokeWidth={2} />
    </motion.button>
  );

  return (
    <nav
      className="app-bottomnav app-bottomnav-glass"
      aria-label="Primary"
      aria-orientation={isSideRail ? 'vertical' : 'horizontal'}
      style={navStyle}
    >
      {isSideRail ? (
        <>
          {LEFT_TABS.map(renderTab)}
          {searchBtn}
          {RIGHT_TABS.map(renderTab)}
        </>
      ) : (
        <>
          {LEFT_TABS.map(renderTab)}
          {searchBtn}
          {RIGHT_TABS.map(renderTab)}
        </>
      )}
    </nav>
  );
}
