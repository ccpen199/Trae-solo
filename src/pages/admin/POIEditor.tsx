import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useScenicStore } from '@/store/useScenicStore';
import POIConfigPanel from './POIConfigPanel';
import type { POIPoint } from '@/types';

export default function POIEditor() {
  const { id: scenicId } = useParams<{ id: string }>();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayerId = 'route-line';
  const routeSourceId = 'route-source';

  const { scenicAreas, pois, tourRoutes, loadPOIs, loadTourRoutes, createPOI, updatePOI, deletePOI } =
    useScenicStore();

  const currentScenic = scenicAreas.find((s) => s.id === scenicId);

  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPOIId, setSelectedPOIId] = useState<string | null>(null);
  const [tourOrder, setTourOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!scenicId) return;
    loadPOIs(scenicId);
    loadTourRoutes(scenicId);
  }, [scenicId, loadPOIs, loadTourRoutes]);

  useEffect(() => {
    if (tourRoutes.length > 0 && tourRoutes[0].poiIds.length > 0) {
      setTourOrder(tourRoutes[0].poiIds);
    } else {
      setTourOrder(pois.map((p) => p.id));
    }
  }, [tourRoutes, pois]);

  const updateRouteLine = useCallback(
    (currentPois: POIPoint[], order: string[]) => {
      const map = mapRef.current;
      if (!map) return;

      const ordered = order
        .map((oid) => currentPois.find((p) => p.id === oid))
        .filter((p): p is POIPoint => !!p && p.lat != null && p.lng != null);

      const source = map.getSource(routeSourceId) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: ordered.map((p) => [p.lng!, p.lat!]),
              },
            },
          ],
        });
      }
    },
    []
  );

  const syncMarkers = useCallback(
    (currentPois: POIPoint[], order: string[]) => {
      const map = mapRef.current;
      if (!map) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      currentPois.forEach((poi, idx) => {
        if (poi.lat == null || poi.lng == null) return;
        const el = document.createElement('div');
        el.className = 'poi-marker';
        el.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          background:#FF8F00;color:#fff;display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:700;cursor:grab;box-shadow:0 2px 8px rgba(255,143,0,0.5);
        `;
        el.textContent = String(idx + 1);

        const marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          updatePOI(poi.id, { lat: lngLat.lat, lng: lngLat.lng });
        });

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedPOIId(poi.id);
        });

        markersRef.current.push(marker);
      });

      updateRouteLine(currentPois, order);
    },
    [updatePOI, updateRouteLine]
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const center: [number, number] =
      currentScenic?.center
        ? [currentScenic.center.lng, currentScenic.center.lat]
        : currentScenic?.longitude && currentScenic?.latitude
          ? [currentScenic.longitude, currentScenic.latitude]
          : [116.397, 39.908];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center,
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-left');

    map.on('load', () => {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: routeLayerId,
        type: 'line',
        source: routeSourceId,
        paint: {
          'line-color': '#FF8F00',
          'line-width': 2,
          'line-dasharray': [4, 4],
        },
      });

      map.on('click', (e) => {
        setPendingLatLng({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        setSelectedPOIId(null);
      });
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    syncMarkers(pois, tourOrder);
  }, [pois, tourOrder, syncMarkers]);

  const handleAddPOI = (name: string, description: string, triggerRadius: number) => {
    if (!scenicId || !pendingLatLng) return;
    createPOI({
      scenicId,
      name,
      description,
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
      triggerRadius,
      order: pois.length + 1,
    });
    setPendingLatLng(null);
  };

  const handleDeletePOI = (poiId: string) => {
    deletePOI(poiId);
    setTourOrder((prev) => prev.filter((id) => id !== poiId));
    if (selectedPOIId === poiId) setSelectedPOIId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setTourOrder((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const handleMoveDown = (index: number) => {
    setTourOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <div className="flex-[7] relative">
        <div ref={mapContainer} className="h-full w-full" />
        {pendingLatLng && (
          <div className="absolute bottom-4 left-4 rounded-xl border border-amber-600/40 bg-[var(--bg-card)]/90 px-4 py-2 text-sm text-amber-400 backdrop-blur">
            已选坐标：{pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)}
          </div>
        )}
      </div>
      <POIConfigPanel
        scenicName={currentScenic?.name ?? ''}
        pois={pois}
        tourOrder={tourOrder}
        pendingLatLng={pendingLatLng}
        selectedPOIId={selectedPOIId}
        onAddPOI={handleAddPOI}
        onDeletePOI={handleDeletePOI}
        onSelectPOI={setSelectedPOIId}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onCancelPending={() => setPendingLatLng(null)}
      />
    </div>
  );
}
