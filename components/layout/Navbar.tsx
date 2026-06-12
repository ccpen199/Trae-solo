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
  Eye,
  DollarSign,
  BarChart3,
  FileText,
  Brain,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
  { label: "工作台", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, badge: "AI" },
  { label: "找工作", href: "/jobs", icon: <Briefcase className="h-4 w-4" /> },
  { label: "AI解析简历", href: "/resume/ai", icon: <Brain className="h-4 w-4" />, badge: "NEW" },
  { label: "视频面试", href: "/interviews", icon: <Video className="h-4 w-4" /> },
  { label: "直播招聘", href: "/live", icon: <Radio className="h-4 w-4" /> },
  { label: "招聘会", href: "/employer/fairs", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "能力画像", href: "/profile", icon: <User className="h-4 w-4" /> },
];

const employerNav: NavItem[] = [
  { label: "数据看板", href: "/employer/dashboard", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "直播管理", href: "/employer/live", icon: <Radio className="h-4 w-4" />, badge: "直播中" },
  { label: "雇主品牌", href: "/employer/brand", icon: <Building2 className="h-4 w-4" /> },
  { label: "谁看过我", href: "/employer/views", icon: <Eye className="h-4 w-4" />, badge: "NEW" },
  { label: "薪酬报告", href: "/employer/salary", icon: <DollarSign className="h-4 w-4" /> },
  { label: "招聘会", href: "/employer/fairs", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "视频面试", href: "/interviews", icon: <Video className="h-4 w-4" /> },
];

export function Navbar({ role, user, unreadNotifications = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [activeRole, setActiveRole] = React.useState<"jobseeker" | "employer">(() => {
    if (pathname?.startsWith("/employer")) return "employer";
    return "jobseeker";
  });

  const navItems = activeRole === "employer" ? employerNav : jobSeekerNav;
  const currentRole = role || (pathname?.startsWith("/employer") ? "employer" : "jobseeker");
  const displayNavItems = currentRole === "employer" ? employerNav : jobSeekerNav;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg shadow-sm">
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

          <div className="hidden md:flex items-center bg-slate-100 rounded-full p-1 text-xs font-medium">
            <Link
              href="/dashboard"
              onClick={() => setActiveRole("jobseeker")}
              className={cn(
                "px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5",
                activeRole === "jobseeker"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              求职者
            </Link>
            <Link
              href="/employer/dashboard"
              onClick={() => setActiveRole("employer")}
              className={cn(
                "px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5",
                activeRole === "employer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              企业HR
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-1 ml-2">
            {displayNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={
                        item.badge === "直播中"
                          ? "destructive"
                          : item.badge === "NEW"
                          ? "info"
                          : "gradient"
                      }
                      size="sm"
                      className="ml-0.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={activeRole === "employer" ? "/employer/salary" : "/resume/ai"}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <FileText className="h-4 w-4" />
            <span>
              {activeRole === "employer" ? "薪酬报告" : "简历解析"}
            </span>
          </Link>

          <Link
            href={activeRole === "employer" ? "/employer/views" : "/profile"}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <LineChart className="h-4 w-4" />
            <span>
              {activeRole === "employer" ? "数据看板" : "能力画像"}
            </span>
          </Link>

          <div className="flex items-center gap-2 pl-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 transition-colors"
                >
                  <Avatar src={user.avatar} size="sm" fallback={user.name} />
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">
                      {user.role === "JOB_SEEKER"
                        ? "求职者"
                        : user.role === "EMPLOYER"
                        ? "企业HR"
                        : user.role}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border bg-white p-2 shadow-xl z-50">
                    <div className="px-2 py-2 border-b mb-1">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        切换身份进入不同工作台
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      求职者工作台
                    </Link>
                    <Link
                      href="/employer/dashboard"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      企业管理后台
                    </Link>
                    <div className="my-1 h-px bg-slate-200" />
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      个人中心 / 能力画像
                    </Link>
                    <Link
                      href="/resume/ai"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Brain className="h-4 w-4" />
                      AI简历解析
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
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/auth/register?role=jobseeker">
                    <Button variant="outline" size="sm">求职者注册</Button>
                  </Link>
                  <Link href="/auth/register?role=employer">
                    <Button variant="gradient" size="sm">企业注册</Button>
                  </Link>
                </div>
                <Link href="/auth/register" className="sm:hidden">
                  <Button variant="gradient" size="sm">立即注册</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white p-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 text-sm font-medium mb-4">
            <Link
              href="/dashboard"
              onClick={() => {
                setActiveRole("jobseeker");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex-1 px-3 py-2 rounded-full text-center transition-all",
                activeRole === "jobseeker"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              )}
            >
              求职者入口
            </Link>
            <Link
              href="/employer/dashboard"
              onClick={() => {
                setActiveRole("employer");
                setMobileMenuOpen(false);
              }}
              className={cn(
                "flex-1 px-3 py-2 rounded-full text-center transition-all",
                activeRole === "employer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              )}
            >
              企业HR入口
            </Link>
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2">
            {activeRole === "jobseeker" ? "求职者功能" : "企业管理功能"}
          </p>
          <div className="space-y-1 mb-4">
            {displayNavItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge
                        variant={
                          item.badge === "直播中"
                            ? "destructive"
                            : "info"
                        }
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2">
            快速入口
          </p>
          <div className="grid grid-cols-2 gap-2">
            {activeRole === "jobseeker" ? (
              <>
                <Link
                  href="/jobs"
                  className="p-3 rounded-lg bg-blue-50 text-blue-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">一键找工作</p>
                </Link>
                <Link
                  href="/resume/ai"
                  className="p-3 rounded-lg bg-purple-50 text-purple-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Brain className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">AI解析简历</p>
                </Link>
                <Link
                  href="/interviews"
                  className="p-3 rounded-lg bg-emerald-50 text-emerald-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Video className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">视频面试</p>
                </Link>
                <Link
                  href="/live"
                  className="p-3 rounded-lg bg-rose-50 text-rose-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Radio className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">直播带岗</p>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/employer/live"
                  className="p-3 rounded-lg bg-rose-50 text-rose-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Radio className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">开直播招聘</p>
                </Link>
                <Link
                  href="/employer/brand"
                  className="p-3 rounded-lg bg-blue-50 text-blue-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">雇主品牌</p>
                </Link>
                <Link
                  href="/employer/views"
                  className="p-3 rounded-lg bg-purple-50 text-purple-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Eye className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">谁看过我</p>
                </Link>
                <Link
                  href="/employer/salary"
                  className="p-3 rounded-lg bg-amber-50 text-amber-600 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <DollarSign className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">薪酬报告</p>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
