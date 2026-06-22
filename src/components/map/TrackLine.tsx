import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { GeoPoint } from '../../types';

interface TrackLineProps {
  points: GeoPoint[];
  pickup?: GeoPoint;
  deliver?: GeoPoint;
}

export default function TrackLine({ points, pickup, deliver }: TrackLineProps) {
  const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <>
      <Polyline
        positions={latlngs}
        pathOptions={{
          color: '#1E40FF',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      >
        <Tooltip sticky direction="top" opacity={0.9}>
          <div className="text-xs text-dark font-medium whitespace-nowrap">
            配送轨迹 · 共 {points.length} 个追踪点
          </div>
        </Tooltip>
      </Polyline>

      <Polyline
        positions={latlngs}
        pathOptions={{
          color: '#60A5FA',
          weight: 2,
          opacity: 0.6,
          dashArray: '8, 8',
          lineCap: 'round',
          className: 'track-line-flow',
        }}
      />

      {pickup && (
        <CircleMarker
          center={[pickup.lat, pickup.lng]}
          radius={10}
          pathOptions={{
            color: '#00C48C',
            fillColor: '#00C48C',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -14]} opacity={1}>
            <div className="bg-success text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap">
              取货点 {pickup.address || ''}
            </div>
          </Tooltip>
          <CircleMarker
            center={[pickup.lat, pickup.lng]}
            radius={18}
            pathOptions={{
              color: '#00C48C',
              fillColor: '#00C48C',
              fillOpacity: 0.15,
              weight: 0,
              className: 'pickup-halo',
            }}
          />
        </CircleMarker>
      )}

      {deliver && (
        <CircleMarker
          center={[deliver.lat, deliver.lng]}
          radius={10}
          pathOptions={{
            color: '#FF6B1A',
            fillColor: '#FF6B1A',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -14]} opacity={1}>
            <div className="bg-accent text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap">
              送货点 {deliver.address || ''}
            </div>
          </Tooltip>
          <CircleMarker
            center={[deliver.lat, deliver.lng]}
            radius={18}
            pathOptions={{
              color: '#FF6B1A',
              fillColor: '#FF6B1A',
              fillOpacity: 0.15,
              weight: 0,
              className: 'deliver-halo',
            }}
          />
        </CircleMarker>
      )}

      <style>{`
        .track-line-flow {
          stroke-dasharray: 8 8;
          animation: track-flow 1.2s linear infinite;
        }
        @keyframes track-flow {
          to { stroke-dashoffset: -16; }
        }
        .pickup-halo {
          animation: halo-pulse 2.2s ease-out infinite;
          transform-origin: center;
        }
        .deliver-halo {
          animation: halo-pulse 2.2s ease-out infinite 1.1s;
          transform-origin: center;
        }
        @keyframes halo-pulse {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}
