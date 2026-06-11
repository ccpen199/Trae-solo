"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Video,
  Radio,
  Building2,
  LineChart,
  CalendarDays,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavbarProps {
  role?: "jobseeker" | "employer" | "admin";
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  unreadNotifications?: number;
}

const jobSeekerNav: NavItem[] = [
  { label: "职位推荐", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, badge: "AI" },
  { label: "职位搜索", href: "/jobs", icon: <Briefcase className="h-5 w-5" /> },
  { label: "视频面试", href: "/interviews", icon: <Video className="h-5 w-5" /> },
  { label: "我的简历", href: "/resume", icon: <User className="h-5 w-5" /> },
  { label: "招聘会", href: "/job-fairs", icon: <CalendarDays className="h-5 w-5" />, badge: "热门" },
];

const employerNav: NavItem[] = [
  { label: "数据看板", href: "/employer/dashboard", icon: <LineChart className="h-5 w-5" /> },
  { label: "职位管理", href: "/employer/jobs", icon: <Briefcase className="h-5 w-5" /> },
  { label: "直播招聘", href: "/employer/live", icon: <Radio className="h-5 w-5" />, badge: "直播中" },
  { label: "视频面试", href: "/employer/interviews", icon: <Video className="h-5 w-5" /> },
  { label: "雇主主页", href: "/employer/company", icon: <Building2 className="h-5 w-5" /> },
  { label: "薪酬报告", href: "/employer/salary", icon: <LineChart className="h-5 w-5" /> },
  { label: "招聘会管理", href: "/employer/fairs", icon: <CalendarDays className="h-5 w-5" /> },
];

export function Navbar({ role = "jobseeker", user, unreadNotifications = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const navItems = role === "employer" ? employerNav : jobSeekerNav;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              智聘OS
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.slice(0, 5).map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badge === "直播中" ? "destructive" : "gradient"} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1">
            <button className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <button className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 pl-3 border-l">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 transition-colors"
                >
                  <Avatar src={user.avatar} size="sm" fallback={user.name} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.role === "JOB_SEEKER" ? "求职者" : user.role === "EMPLOYER" ? "企业HR" : user.role}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white p-2 shadow-lg">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      个人中心
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      账号设置
                    </Link>
                    <div className="my-1 h-px bg-slate-200" />
                    <button
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="gradient" size="sm">立即注册</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <Badge variant={item.badge === "直播中" ? "destructive" : "info"} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-3 px-4 py-2">
                <Avatar src={user.avatar} size="md" fallback={user.name} />
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-sm text-slate-500">
                    {user.role === "JOB_SEEKER" ? "求职者" : user.role === "EMPLOYER" ? "企业HR" : user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
