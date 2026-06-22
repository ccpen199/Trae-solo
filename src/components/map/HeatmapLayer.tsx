import { useMap, CircleMarker } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { RiderProfile } from '../../types';

interface HeatmapLayerProps {
  riders: RiderProfile[];
}

export default function HeatmapLayer({ riders }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    void map.getZoom();
  }, [map]);

  const activeRiders = riders.filter((r) => r.status !== 'offline');

  const radiusForScore = (score: number) => {
    const base = score / 100;
    return 14 + base * 22;
  };

  const opacityForScore = (score: number) => {
    return 0.12 + (score / 100) * 0.28;
  };

  return (
    <>
      {activeRiders.map((rider, idx) => {
        const composite = Math.min(
          100,
          Math.round(
            (rider.creditScore * 0.4 + rider.fulfillRate * 100 * 0.3 + (rider.avgRating / 5) * 100 * 0.3)
          )
        );
        return (
          <CircleMarker
            key={`heat-${rider.userId}-${idx}`}
            center={[rider.location.lat, rider.location.lng]}
            radius={radiusForScore(composite)}
            pathOptions={{
              color: '#FF6B1A',
              fillColor: '#FF6B1A',
              fillOpacity: opacityForScore(composite),
              weight: 0,
              className: 'heat-circle',
            }}
          />
        );
      })}

      {activeRiders.map((rider, idx) => {
        const composite = Math.min(
          100,
          Math.round(
            (rider.creditScore * 0.4 + rider.fulfillRate * 100 * 0.3 + (rider.avgRating / 5) * 100 * 0.3)
          )
        );
        return (
          <CircleMarker
            key={`heat-inner-${rider.userId}-${idx}`}
            center={[rider.location.lat, rider.location.lng]}
            radius={Math.max(3, radiusForScore(composite) * 0.35)}
            pathOptions={{
              color: '#FDBA74',
              fillColor: '#FDBA74',
              fillOpacity: 0.55,
              weight: 0,
            }}
          />
        );
      })}

      <style>{`
        .heat-circle {
          transition: r 0.5s ease, fill-opacity 0.5s ease;
        }
      `}</style>

      <HeatmapLegend riders={activeRiders} />
    </>
  );
}

function HeatmapLegend({ riders }: { riders: RiderProfile[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 500,
        background: 'rgba(15, 22, 41, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 14px',
        color: '#fff',
        fontSize: 12,
        pointerEvents: 'none',
      }}
      ref={(el) => {
        if (el) {
          const map = el.closest('.leaflet-container') as HTMLElement | null;
          if (map && el.parentElement !== map) {
            map.appendChild(el);
          }
        }
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#FF6B1A', opacity: 0.6 }} />
        <span className="font-semibold">骑手热力分布</span>
        <span className="text-white/50">· {riders.length} 人在线</span>
      </div>
      <div className="flex items-center gap-2 text-white/60">
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full" style={{ background: '#FDBA74', opacity: 0.5 }} />
          <span>高分骑手</span>
        </div>
        <span className="mx-1">→</span>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full" style={{ background: '#FF6B1A', opacity: 0.15 }} />
          <span>普通</span>
        </div>
      </div>
    </div>
  );
}

// ensure L used to avoid TS unused warning
void L;
