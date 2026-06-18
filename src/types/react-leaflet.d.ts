declare module 'react-leaflet' {
  import { ComponentType } from 'react';

  interface LeafletProps {
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const MapContainer: ComponentType<LeafletProps>;
  export const TileLayer: ComponentType<LeafletProps>;
  export const Marker: ComponentType<LeafletProps>;
  export const Popup: ComponentType<LeafletProps>;
  export const Circle: ComponentType<LeafletProps>;
  export const CircleMarker: ComponentType<LeafletProps>;
  export const Polygon: ComponentType<LeafletProps>;
  export const Polyline: ComponentType<LeafletProps>;
  export const Rectangle: ComponentType<LeafletProps>;
}
