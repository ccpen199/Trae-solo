import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface RiderMarkerProps {
  rider: {
    userId: string;
    location: { lat: number; lng: number };
    status: 'offline' | 'idle' | 'on_order' | 'break';
    user?: { avatarUrl: string; nickname: string };
  };
  onClick?: () => void;
  selected?: boolean;
}

const statusRingColors: Record<string, string> = {
  idle: '#00C48C',
  on_order: '#FF6B1A',
  offline: '#6B7280',
  break: '#6B7280',
};

export default function RiderMarker({ rider, onClick, selected }: RiderMarkerProps) {
  const ringColor = statusRingColors[rider.status] || '#6B7280';
  const innerSize = selected ? 44 : 40;
  const outerSize = selected ? 60 : 54;

  const icon = L.divIcon({
    className: 'rider-marker',
    html: `
      <div style="position:relative;width:${outerSize}px;height:${outerSize}px;">
        <div style="
          position:absolute;
          inset:0;
          border-radius:50%;
          background:${ringColor}20;
          animation:rider-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;
          inset:${(outerSize - innerSize) / 2}px;
          border-radius:50%;
          padding:3px;
          background:${ringColor};
          box-shadow:0 0 0 2px #0F1629,0 4px 12px ${ringColor}60;
        ">
          <div style="
            width:100%;
            height:100%;
            border-radius:50%;
            background:#1E293B;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
            font-weight:700;
            font-size:14px;
            color:#fff;
            border:2px solid #0F1629;
          ">
            ${rider.user?.nickname?.charAt(0) || '骑'}
          </div>
        </div>
        ${selected ? `
          <div style="
            position:absolute;
            inset:-4px;
            border-radius:50%;
            border:2px solid #1E40FF;
            animation:rider-selected 1.2s ease-in-out infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes rider-pulse {
          0% { transform:scale(1); opacity:0.7; }
          100% { transform:scale(1.6); opacity:0; }
        }
        @keyframes rider-selected {
          0%,100% { transform:scale(1); opacity:1; }
          50% { transform:scale(1.08); opacity:0.7; }
        }
      </style>
    `,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
  });

  return (
    <Marker
      position={[rider.location.lat, rider.location.lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
      zIndexOffset={selected ? 1000 : 0}
    />
  );
}
