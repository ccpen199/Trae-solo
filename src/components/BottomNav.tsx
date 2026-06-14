import { useLocation, Link } from "react-router-dom";
import { Home, Footprints, PlayCircle, UserPlus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "首页", icon: Home, path: "/" },
  { label: "步数", icon: Footprints, path: "/steps" },
  { label: "视频", icon: PlayCircle, path: "/video" },
  { label: "邀请", icon: UserPlus, path: "/invite" },
  { label: "钱包", icon: Wallet, path: "/wallet" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-night-800/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center">
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "nav-link",
                active ? "nav-link-active" : "nav-link-inactive"
              )}
            >
              <tab.icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
