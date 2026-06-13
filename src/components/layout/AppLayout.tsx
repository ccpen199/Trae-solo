import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '@/store/appStore';

export default function AppLayout() {
  const fetchDevices = useAppStore((s) => s.fetchDevices);
  const fetchAlerts = useAppStore((s) => s.fetchAlerts);
  const fetchAlertStats = useAppStore((s) => s.fetchAlertStats);
  const fetchOtaStatus = useAppStore((s) => s.fetchOtaStatus);

  useEffect(() => {
    fetchDevices();
    fetchAlerts();
    fetchAlertStats();
    fetchOtaStatus();

    const interval = setInterval(() => {
      fetchDevices();
      fetchAlerts();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchDevices, fetchAlerts, fetchAlertStats, fetchOtaStatus]);

  return (
    <div className="min-h-screen bg-deep-950 text-slate-200 grid-bg">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
