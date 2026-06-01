import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import TicketPage from "@/pages/Ticket";
import CallStation from "@/pages/CallStation";
import Manager from "@/pages/Manager";
import Dashboard from "@/pages/Dashboard";
import { cn } from "@/lib/utils";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "px-4 py-2 rounded-lg transition-colors",
        isActive 
          ? "bg-blue-600 text-white" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">🏪 门店排队叫号系统</h1>
            <div className="flex gap-2">
              <NavLink to="/">首页</NavLink>
              <NavLink to="/ticket">顾客取号</NavLink>
              <NavLink to="/call">叫号台</NavLink>
              <NavLink to="/manager">店长管理</NavLink>
              <NavLink to="/dashboard">数据看板</NavLink>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ticket" element={<TicketPage />} />
            <Route path="/call" element={<CallStation />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
