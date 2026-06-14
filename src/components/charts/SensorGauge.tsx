import { useMemo } from 'react';

interface GaugeZone {
  from: number;
  to: number;
  color: string;
}

interface SensorGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  zones?: GaugeZone[];
}

export function SensorGauge({ value, max, label, unit, zones }: SensorGaugeProps) {
  const progress = Math.min(100, Math.max(0, (value / max) * 100));

  const gaugeColor = useMemo(() => {
    if (!zones || zones.length === 0) return '#F97316';
    for (const zone of zones) {
      if (value >= zone.from && value <= zone.to) {
        return zone.color;
      }
    }
    return '#F97316';
  }, [value, zones]);

  const zoneStops = useMemo(() => {
    if (!zones || zones.length === 0) return '';
    const sorted = [...zones].sort((a, b) => a.from - b.from);
    return sorted
      .map((z) => {
        const startPct = Math.min(100, Math.max(0, (z.from / max) * 100));
        const endPct = Math.min(100, Math.max(0, (z.to / max) * 100));
        return `${z.color} ${startPct}% ${endPct}%`;
      })
      .join(', ');
  }, [zones, max]);

  const gradientStyle = useMemo(() => {
    if (zones && zones.length > 0) {
      return {
        background: `conic-gradient(${zoneStops}, #1A2238 100%)`,
      };
    }
    return {};
  }, [zones, zoneStops]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <div
          className="gauge-ring absolute inset-0 rounded-full transition-all duration-700 ease-out"
          style={
            zones && zones.length > 0
              ? gradientStyle
              : {
                  '--gauge-progress': progress,
                  '--gauge-color': gaugeColor,
                } as React.CSSProperties
          }
        />
        <div className="absolute inset-[10px] rounded-full bg-ink-900/95 backdrop-blur flex flex-col items-center justify-center border border-ink-700/40">
          <div className="flex items-baseline gap-0.5">
            <span
              className="font-display font-bold text-2xl tracking-wide transition-colors duration-300"
              style={{ color: gaugeColor }}
            >
              {typeof value === 'number' && !Number.isInteger(value)
                ? value.toFixed(1)
                : value}
            </span>
            <span className="text-[10px] font-mono text-slate-500">{unit}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">/ {max}{unit}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400 font-medium tracking-wide">{label}</div>
    </div>
  );
}

export default SensorGauge;
