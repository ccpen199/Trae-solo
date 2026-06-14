import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '@/stores/vehicleStore';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  onClick?: (vehicle: Vehicle) => void;
}

function createVehicleIcon(status: Vehicle['status'], heading: number): L.DivIcon {
  const statusClass = `vehicle-marker-${status}`;
  const rotation = heading || 0;

  return L.divIcon({
    className: 'vehicle-marker-wrapper',
    html: `
      <div class="vehicle-marker ${statusClass}" style="transform: rotate(0deg);">
        <div class="arrow" style="transform: rotate(${rotation}deg);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

export default function VehicleMarker({ vehicle, onClick }: VehicleMarkerProps) {
  const icon = createVehicleIcon(vehicle.status, vehicle.heading);

  return (
    <Marker
      position={[vehicle.lat, vehicle.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(vehicle),
      }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        <div className="text-xs">
          <div className="font-bold">{vehicle.plate_number}</div>
          <div className="text-gray-500">{vehicle.speed} km/h</div>
        </div>
      </Tooltip>
    </Marker>
  );
}
