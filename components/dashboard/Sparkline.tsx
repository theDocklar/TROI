/**
 * Pure SVG sparkline — 80×28px, no axes.
 * Accepts a data array and a stroke color.
 */

'use client';

interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

/** Renders a tiny line chart with no axes for use inside summary cards. */
export default function Sparkline({ data, color = '#6366f1', className }: SparklineProps): React.JSX.Element {
  if (data.length < 2) return <svg width={80} height={28} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const W = 80;
  const H = 28;
  const PAD = 2;

  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const areaClose = `${points[points.length - 1].split(',')[0]},${H} ${PAD},${H}`;
  const areaPoints = `${polyline} ${areaClose}`;

  return (
    <svg width={W} height={H} className={className} aria-hidden="true">
      <polygon points={areaPoints} fill={color} fillOpacity={0.12} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
