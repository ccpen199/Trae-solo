import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="flex h-full w-full bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div key={location.pathname} className="animate-fade-in-up max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
