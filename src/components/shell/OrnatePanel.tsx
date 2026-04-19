import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

interface OrnatePanelProps extends HTMLAttributes<HTMLDivElement> {
  gold?: boolean;
  tight?: boolean;
  children: ReactNode;
}

function CornerFlourish({
  pos,
}: {
  pos: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const transform: Record<typeof pos, string> = {
    tl: 'rotate(0deg)',
    tr: 'rotate(90deg)',
    br: 'rotate(180deg)',
    bl: 'rotate(270deg)',
  };
  const place: Record<typeof pos, CSSProperties> = {
    tl: { top: -2, left: -2 },
    tr: { top: -2, right: -2 },
    bl: { bottom: -2, left: -2 },
    br: { bottom: -2, right: -2 },
  };
  return (
    <svg
      aria-hidden
      width={18}
      height={18}
      viewBox="0 0 18 18"
      style={{
        position: 'absolute',
        ...place[pos],
        transform: transform[pos],
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 4px rgba(240,207,110,0.45))',
      }}
    >
      <path
        d="M0 12 L0 0 L12 0"
        stroke="var(--app-gold-bright)"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M3 9 L3 3 L9 3"
        stroke="var(--app-gold)"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
      <circle cx="2" cy="2" r="1.2" fill="var(--app-gold-bright)" />
    </svg>
  );
}

export function OrnatePanel({
  gold = false,
  tight = false,
  className = '',
  children,
  style,
  ...rest
}: OrnatePanelProps) {
  const cls = ['app-mod', gold && 'gold', tight && 'tight', className].filter(Boolean).join(' ');
  const baseStyle: CSSProperties = gold
    ? {
        background:
          'linear-gradient(180deg, rgba(15,26,48,0.62) 0%, rgba(10,17,32,0.55) 100%)',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        border: '1px solid rgba(212,168,74,0.40)',
        boxShadow:
          'inset 0 0 0 1px rgba(212,168,74,0.10), inset 0 1px 0 rgba(240,207,110,0.18), 0 4px 18px rgba(0,0,0,0.45)',
        position: 'relative',
        ...style,
      }
    : { ...style };
  return (
    <div className={cls} style={baseStyle} {...rest}>
      {children}
      {gold && (
        <>
          {/* keep legacy spans for any external CSS hooks */}
          <span className="app-corner-bl" aria-hidden />
          <span className="app-corner-br" aria-hidden />
          <CornerFlourish pos="tl" />
          <CornerFlourish pos="tr" />
          <CornerFlourish pos="bl" />
          <CornerFlourish pos="br" />
        </>
      )}
    </div>
  );
}

export function GoldDivider() {
  return (
    <div
      className="app-divider"
      role="separator"
      aria-hidden
      style={{
        position: 'relative',
        height: 1,
        margin: '12px 0',
        background:
          'linear-gradient(90deg, transparent, rgba(138,111,44,0.7) 18%, rgba(240,207,110,0.95) 50%, rgba(138,111,44,0.7) 82%, transparent)',
        boxShadow: '0 0 6px rgba(240,207,110,0.35)',
      }}
    />
  );
}

interface ManaPipProps {
  color: 'w' | 'u' | 'b' | 'r' | 'g' | 'c';
  label?: string;
}

export function ManaPip({ color, label }: ManaPipProps) {
  return (
    <span className={`app-mana ${color}`} aria-label={label ?? color.toUpperCase()}>
      {label ?? color.toUpperCase()}
    </span>
  );
}
