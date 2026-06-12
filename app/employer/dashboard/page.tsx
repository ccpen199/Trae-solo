"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Video,
  Radio,
  Building2,
  LineChart,
  CalendarDays,
  Users,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Home,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const sideNavItems = [
  { label: "数据看板", href: "/employer/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "职位管理", href: "/employer/jobs", icon: <Briefcase className="h-5 w-5" />, badge: "12" },
  { label: "简历管理", href: "/employer/resumes", icon: <FileText className="h-5 w-5" />, badge: "36" },
  { label: "直播招聘", href: "/employer/live", icon: <Radio className="h-5 w-5" />, badge: "直播中" },
  { label: "视频面试", href: "/employer/interviews", icon: <Video className="h-5 w-5" /> },
  { label: "谁看过我", href: "/employer/views", icon: <Eye className="h-5 w-5" />, badge: "NEW" },
  { label: "薪酬报告", href: "/employer/salary", icon: <DollarSign className="h-5 w-5" /> },
  { label: "雇主品牌", href: "/employer/brand", icon: <Building2 className="h-5 w-5" /> },
  { label: "招聘会", href: "/employer/fairs", icon: <CalendarDays className="h-5 w-5" /> },
  { label: "人才库", href: "/employer/talent", icon: <Users className="h-5 w-5" /> },
  { label: "团队成员", href: "/employer/team", icon: <Users className="h-5 w-5" /> },
  { label: "设置", href: "/employer/settings", icon: <Settings className="h-5 w-5" /> },
];

const statsData = [
  {
    label: "今日浏览",
    value: "1,286",
    change: "+12.5%",
    trend: "up",
    icon: <Eye className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
  },
  {
    label: "今日投递",
    value: "86",
    change: "+8.2%",
    trend: "up",
    icon: <FileText className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
  },
  {
    label: "进行中面试",
    value: "24",
    change: "+3",
    trend: "up",
    icon: <Video className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
  },
  {
    label: "本周入职",
    value: "5",
    change: "-2",
    trend: "down",
    icon: <Users className="h-5 w-5" />,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
  },
];

const viewsData = [
  { name: "周一", views: 800, applications: 45 },
  { name: "周二", views: 950, applications: 52 },
  { name: "周三", views: 1100, applications: 68 },
  { name: "周四", views: 920, applications: 49 },
  { name: "周五", views: 1050, applications: 61 },
  { name: "周六", views: 680, applications: 32 },
  { name: "周日", views: 520, applications: 24 },
];

const applicationSourceData = [
  { name: "直接投递", value: 45, color: "#3b82f6" },
  { name: "直播招聘", value: 25, color: "#8b5cf6" },
  { name: "内推", value: 15, color: "#10b981" },
  { name: "招聘会", value: 10, color: "#f59e0b" },
  { name: "其他", value: 5, color: "#64748b" },
];

const recentResumes = [
  {
    id: "1",
    name: "张明",
    avatar: null,
    position: "高级前端工程师",
    matchScore: 92,
    appliedTime: "10分钟前",
    status: "新投递",
  },
  {
    id: "2",
    name: "李华",
    avatar: null,
    position: "产品经理",
    matchScore: 85,
    appliedTime: "25分钟前",
    status: "新投递",
  },
  {
    id: "3",
    name: "王芳",
    avatar: null,
    position: "UI设计师",
    matchScore: 78,
    appliedTime: "1小时前",
    status: "待筛选",
  },
  {
    id: "4",
    name: "陈伟",
    avatar: null,
    position: "Java开发工程师",
    matchScore: 88,
    appliedTime: "2小时前",
    status: "已查看",
  },
  {
    id: "5",
    name: "刘洋",
    avatar: null,
    position: "数据分析师",
    matchScore: 72,
    appliedTime: "3小时前",
    status: "待约面",
  },
];

const recentInterviews = [
  {
    id: "1",
    candidate: "张明",
    position: "高级前端工程师",
    time: "今天 14:00",
    type: "视频面试",
    status: "待面试",
  },
  {
    id: "2",
    candidate: "李华",
    position: "产品经理",
    time: "今天 15:30",
    type: "视频面试",
    status: "待面试",
  },
  {
    id: "3",
    candidate: "王芳",
    position: "UI设计师",
    time: "明天 10:00",
    type: "电话面试",
    status: "待面试",
  },
];

const hotJobs = [
  { id: "1", title: "高级前端工程师", views: 1280, applications: 56, status: "招聘中" },
  { id: "2", title: "产品经理", views: 890, applications: 38, status: "招聘中" },
  { id: "3", title: "Java开发工程师", views: 1050, applications: 42, status: "招聘中" },
  { id: "4", title: "算法工程师", views: 1560, applications: 28, status: "急招" },
];

export default function EmployerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              智聘企业版
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {sideNavItems.map((item) => {
              const isActive = item.href.includes(activeNav);
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    const navKey = item.href.split("/").pop() || "dashboard";
                    setActiveNav(navKey);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.icon}
                  {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
                  {sidebarOpen && item.badge && (
                    <Badge
                      variant={
                        item.badge === "直播中"
                          ? "destructive"
                          : item.badge === "NEW"
                          ? "info"
                          : "secondary"
                      }
                      size="sm"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 p-2">
            <Avatar size="sm" fallback="HR" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">王HR</p>
                <p className="text-xs text-slate-500 truncate">字节跳动 · 招聘经理</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={cn("flex-1 flex flex-col min-h-screen transition-all", sidebarOpen ? "ml-64" : "ml-20")}>
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">数据看板</h1>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索职位、候选人..."
                className="h-9 pl-9 pr-4 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l">
              <Avatar size="sm" fallback="HR" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">王HR</p>
                <p className="text-xs text-slate-500">招聘经理</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {statsData.map((stat, index) => (
              <Card key={stat.label} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center bg-gradient-to-br ${stat.color}`}
                    >
                      <span className="text-white">{stat.icon}</span>
                    </div>
                    <Badge
                      variant={stat.trend === "up" ? "success" : "destructive"}
                      size="sm"
                      className="gap-1"
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">招聘数据趋势</CardTitle>
                  <CardDescription>近7天浏览量与投递量</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-slate-600">浏览量</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">投递量</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="浏览量"
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="投递量"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">简历来源分布</CardTitle>
                <CardDescription>各渠道投递占比</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {applicationSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {applicationSourceData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-600 truncate">{item.name}</span>
                      <span className="font-medium text-slate-900 ml-auto">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">最新简历</CardTitle>
                  <CardDescription>实时更新的投递简历</CardDescription>
                </div>
                <Link href="/employer/resumes">
                  <Button variant="ghost" size="sm">
                    查看全部 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentResumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Avatar size="md" fallback={resume.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 truncate">
                            {resume.name}
                          </h4>
                          <Badge
                            variant={
                              resume.status === "新投递"
                                ? "info"
                                : resume.status === "已查看"
                                ? "secondary"
                                : resume.status === "待约面"
                                ? "success"
                                : "warning"
                            }
                            size="sm"
                          >
                            {resume.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{resume.position}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="font-semibold">{resume.matchScore}%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{resume.appliedTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">今日面试</CardTitle>
                    <CardDescription>
                      {recentInterviews.length} 场待面试
                    </CardDescription>
                  </div>
                  <Badge variant="warning" size="sm">
                    {recentInterviews.length} 场
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-3 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 text-sm">
                          {interview.candidate}
                        </span>
                        <Badge variant="secondary" size="sm">
                          {interview.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{interview.position}</p>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Clock className="h-3.5 w-3.5" />
                        {interview.time}
                      </div>
                    </div>
                  ))}
                  <Link href="/employer/interviews">
                    <Button variant="outline" size="sm" fullWidth>
                      查看全部面试
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">热门职位</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hotJobs.slice(0, 4).map((job, index) => (
                    <div key={job.id} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          index < 3
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {job.views} 浏览 · {job.applications} 投递
                        </p>
                      </div>
                      <Badge
                        variant={job.status === "急招" ? "destructive" : "success"}
                        size="sm"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
