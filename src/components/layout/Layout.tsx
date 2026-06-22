import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="h-10 shrink-0 border-t border-slate-200 bg-white/50 flex items-center justify-between px-6 text-[11px] text-slate-400">
          <span>© 2026 房掌柜 · 基于《民法典》租赁合同规范构建</span>
          <span>所有关键操作已留痕 · 数据本地加密存储</span>
        </footer>
      </div>
    </div>
  );
}
