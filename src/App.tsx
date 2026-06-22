import React, { useEffect } from 'react';
import AppRouter from '@/router';
import { useAppStore } from '@/stores/appStore';

const App: React.FC = () => {
  const initMockData = useAppStore(s => s.initMockData);
  const mockRiders = useAppStore(s => s.mockRiders);
  const mockOrders = useAppStore(s => s.mockOrders);
  const updateRiderLocation = useAppStore(s => s.updateRiderLocation);
  const CITY_CENTER = { lat: 31.2304, lng: 121.4737 };

  useEffect(() => {
    initMockData();
  }, [initMockData]);

  useEffect(() => {
    if (mockRiders.length === 0) return;

    const interval = setInterval(() => {
      mockRiders.forEach(rider => {
        if (rider.status === 'offline') return;
        const deltaLat = (Math.random() - 0.5) * 0.0015;
        const deltaLng = (Math.random() - 0.5) * 0.0015;
        let newLat = rider.location.lat + deltaLat;
        let newLng = rider.location.lng + deltaLng;
        const dist = Math.sqrt(
          Math.pow((newLat - CITY_CENTER.lat) * 111000, 2) +
          Math.pow((newLng - CITY_CENTER.lng) * 111000 * Math.cos(CITY_CENTER.lat * Math.PI / 180), 2)
        );
        if (dist > 3500) {
          newLat = CITY_CENTER.lat + (Math.random() - 0.5) * 0.04;
          newLng = CITY_CENTER.lng + (Math.random() - 0.5) * 0.04;
        }
        updateRiderLocation(rider.userId, { lat: newLat, lng: newLng, address: rider.location.address });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [mockRiders, mockOrders, updateRiderLocation]);

  return <AppRouter />;
};

export default App;
