import { Outlet } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-cyber-bg">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div
        className={`transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-56"
        }`}
      >
        <Header />
        <main className="p-4 md:p-6 min-h-[calc(100vh-3.5rem)]">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden fixed inset-0 z-30 pointer-events-none">
        <Sidebar />
      </div>
    </div>
  );
}
