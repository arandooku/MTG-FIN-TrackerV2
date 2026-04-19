interface SparklineProps {
  values: number[];
  height?: number;
  color?: string;
  fillId?: string;
}

export function Sparkline({
  values,
  height = 70,
  color = 'var(--app-crystal)',
  fillId = 'app-spark-grad',
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] tracking-widest text-[var(--app-muted)]"
        style={{ height }}
      >
        NO HISTORY
      </div>
    );
  }
  const W = 300;
  const H = height;
  const PAD = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = (W - PAD * 2) / (values.length - 1);
  const xy = (v: number, i: number) =>
    [PAD + i * step, H - PAD - ((v - min) / range) * (H - PAD * 2)] as const;
  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xy(v, i)[0].toFixed(1)} ${xy(v, i)[1].toFixed(1)}`)
    .join(' ');
  const lastX = xy(values[values.length - 1], values.length - 1)[0];
  const firstX = xy(values[0], 0)[0];
  const fillPath = `${linePath} L ${lastX.toFixed(1)} ${H - PAD} L ${firstX.toFixed(1)} ${H - PAD} Z`;
  const glowId = `${fillId}-glow`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="app-spark"
      preserveAspectRatio="none"
      style={{ height, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="60%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      />
    </svg>
  );
}
