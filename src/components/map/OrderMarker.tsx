import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { ShoppingBag, Package, ClipboardList } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { Order } from '../../types';

interface OrderMarkerProps {
  order: Order;
  onClick?: () => void;
  selected?: boolean;
}

const statusConfig: Record<string, { color: string; pulse: boolean }> = {
  pending_accept: { color: '#1E40FF', pulse: true },
  pending_pay: { color: '#1E40FF', pulse: true },
  picking: { color: '#FF6B1A', pulse: false },
  delivering: { color: '#FF6B1A', pulse: false },
  completed: { color: '#00C48C', pulse: false },
  cancelled: { color: '#6B7280', pulse: false },
  fused: { color: '#8B5CF6', pulse: false },
};

const typeIcons: Record<string, React.ReactNode> = {
  buy: <ShoppingBag size={14} color="#fff" />,
  deliver: <Package size={14} color="#fff" />,
  errand: <ClipboardList size={14} color="#fff" />,
};

export default function OrderMarker({ order, onClick, selected }: OrderMarkerProps) {
  const cfg = statusConfig[order.status] || statusConfig.pending_accept;
  const size = selected ? 44 : 38;
  const iconNode = typeIcons[order.type] || typeIcons.errand;
  const iconSvg = renderToString(iconNode as React.ReactElement);

  const icon = L.divIcon({
    className: 'order-marker',
    html: `
      <div style="position:relative;width:${size + 16}px;height:${size + 20}px;">
        ${cfg.pulse ? `
          <div style="
            position:absolute;
            top:4px;left:8px;
            width:${size}px;height:${size}px;
            border-radius:12px;
            background:${cfg.color}30;
            animation:order-pulse 1.8s ease-out infinite;
          "></div>
        ` : ''}
        <div style="
          position:absolute;
          top:8px;left:8px;
          width:${size}px;height:${size}px;
          border-radius:12px;
          background:${cfg.color};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 12px ${cfg.color}50, 0 0 0 2px #0F1629;
          transform:rotate(45deg);
        ">
          <div style="transform:rotate(-45deg);">${iconSvg}</div>
        </div>
        <div style="
          position:absolute;
          bottom:0;
          left:50%;
          transform:translateX(-50%);
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:10px solid ${cfg.color};
        "></div>
        ${selected ? `
          <div style="
            position:absolute;
            top:4px;left:4px;
            width:${size + 8}px;height:${size + 8}px;
            border-radius:16px;
            border:2px solid #fff;
            animation:order-selected 1s ease-in-out infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes order-pulse {
          0% { transform:scale(1); opacity:0.8; }
          100% { transform:scale(1.5); opacity:0; }
        }
        @keyframes order-selected {
          0%,100% { opacity:1; }
          50% { opacity:0.5; }
        }
      </style>
    `,
    iconSize: [size + 16, size + 20],
    iconAnchor: [(size + 16) / 2, size + 20],
  });

  return (
    <Marker
      position={[order.deliver.lat, order.deliver.lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
      zIndexOffset={selected ? 1000 : 0}
    />
  );
}
