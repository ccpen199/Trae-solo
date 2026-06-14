import { useState, useEffect } from 'react';
import { TileLayer } from 'react-leaflet';

const TILE_PROVIDERS = [
  {
    name: '高德地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    attribution: '&copy; 高德地图',
  },
  {
    name: '腾讯地图',
    url: 'https://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; 腾讯地图',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap',
  },
  {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    attribution: '&copy; CARTO',
  },
];

export default function MapTileLayer() {
  const [providerIndex, setProviderIndex] = useState(0);
  const [failedProviders, setFailedProviders] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setFailedProviders(new Set());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleError = () => {
    setFailedProviders((prev) => {
      const next = new Set(prev);
      next.add(providerIndex);
      let nextIdx = providerIndex + 1;
      while (nextIdx < TILE_PROVIDERS.length && next.has(nextIdx)) {
        nextIdx++;
      }
      if (nextIdx >= TILE_PROVIDERS.length) {
        nextIdx = 0;
      }
      if (nextIdx !== providerIndex) {
        setProviderIndex(nextIdx);
      }
      return next;
    });
  };

  const provider = TILE_PROVIDERS[providerIndex];

  return (
    <>
      <TileLayer
        key={providerIndex}
        url={provider.url}
        subdomains={provider.subdomains}
        attribution={provider.attribution}
        maxZoom={19}
        onError={handleError}
        crossOrigin={false}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 1000,
          background: 'rgba(15, 25, 35, 0.85)',
          color: '#94a3b8',
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 4,
          pointerEvents: 'none',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        }}
      >
        底图: {provider.name}
      </div>
    </>
  );
}
