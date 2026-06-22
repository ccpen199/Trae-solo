import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const navLinks = [
  { to: "/", label: "首页" },
  { to: "/storehall", label: "门店大厅" },
  { to: "/match", label: "智能匹配" },
  { to: "/pricing", label: "智能定价" },
  { to: "/knowledge", label: "知识库" },
  { to: "/broker", label: "经纪人中心" },
  { to: "/risk", label: "风险引擎" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A2540]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold">
            <span className="text-[#D4A843]">铺位</span>
            <span className="text-white">通</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "text-[#D4A843]"
                    : "text-gray-300 hover:text-white"
                )}
              >
                {link.label}
                {location.pathname === link.to && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D4A843] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            <Link
              to="/publish"
              className="px-5 py-2 text-sm font-semibold text-[#0A2540] rounded-lg bg-gradient-to-r from-[#D4A843] to-[#E8C86A] hover:from-[#E8C86A] hover:to-[#D4A843] transition-all shadow-md"
            >
              发布转让
            </Link>
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0A2540] border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  "block px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === link.to
                    ? "text-[#D4A843] bg-white/5"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                )}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/publish"
              className="block mx-3 mt-3 px-5 py-2 text-sm font-semibold text-[#0A2540] text-center rounded-lg bg-gradient-to-r from-[#D4A843] to-[#E8C86A]"
              onClick={() => setMenuOpen(false)}
            >
              发布转让
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
