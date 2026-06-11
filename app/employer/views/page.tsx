"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Eye,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Filter,
  Calendar,
  ChevronDown,
  Sparkles,
  Award,
  Briefcase,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  LineChart,
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
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const timeRangeOptions = [
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
];

const viewTrendData = [
  { name: "周一", profileViews: 850, jobViews: 1200, resumeOpens: 180, applications: 45 },
  { name: "周二", profileViews: 920, jobViews: 1350, resumeOpens: 210, applications: 52 },
  { name: "周三", profileViews: 1100, jobViews: 1580, resumeOpens: 260, applications: 68 },
  { name: "周四", profileViews: 980, jobViews: 1420, resumeOpens: 230, applications: 55 },
  { name: "周五", profileViews: 1050, jobViews: 1650, resumeOpens: 245, applications: 61 },
  { name: "周六", profileViews: 680, jobViews: 950, resumeOpens: 120, applications: 32 },
  { name: "周日", profileViews: 520, jobViews: 780, resumeOpens: 95, applications: 24 },
];

const hrActivityData = [
  { name: "王HR", views: 156, replies: 89, interviews: 12, hires: 3, score: 95 },
  { name: "李HR", views: 142, replies: 76, interviews: 10, hires: 2, score: 88 },
  { name: "张HR", views: 128, replies: 95, interviews: 15, hires: 4, score: 92 },
  { name: "赵HR", views: 98, replies: 62, interviews: 8, hires: 1, score: 75 },
  { name: "陈HR", views: 115, replies: 88, interviews: 11, hires: 2, score: 85 },
];

const jobHeatmapData = [
  { job: "高级前端工程师", views: 1520, clicks: 680, applications: 128, openRate: "8.4%" },
  { job: "产品经理", views: 1280, clicks: 520, applications: 96, openRate: "7.5%" },
  { job: "Java工程师", views: 1350, clicks: 610, applications: 105, openRate: "7.8%" },
  { job: "AI算法工程师", views: 1890, clicks: 890, applications: 78, openRate: "4.1%" },
  { job: "UI设计师", views: 960, clicks: 420, applications: 85, openRate: "8.9%" },
  { job: "数据分析师", views: 780, clicks: 350, applications: 62, openRate: "7.9%" },
  { job: "运营专员", views: 650, clicks: 280, applications: 72, openRate: "11.1%" },
];

const sourceData = [
  { name: "直接搜索", value: 35, color: "#3b82f6" },
  { name: "推荐算法", value: 28, color: "#8b5cf6" },
  { name: "直播招聘", value: 18, color: "#10b981" },
  { name: "招聘会", value: 12, color: "#f59e0b" },
  { name: "内推", value: 7, color: "#ec4899" },
];

const profileViewers = [
  {
    id: "1",
    name: "张明",
    avatar: null,
    position: "高级前端工程师",
    company: "腾讯",
    viewTime: "5分钟前",
    isVip: true,
    matchScore: 92,
    viewedJob: "高级前端工程师",
  },
  {
    id: "2",
    name: "李华",
    avatar: null,
    position: "产品经理",
    company: "美团",
    viewTime: "12分钟前",
    isVip: true,
    matchScore: 85,
    viewedJob: "产品经理",
  },
  {
    id: "3",
    name: "王芳",
    avatar: null,
    position: "UI设计师",
    company: "网易",
    viewTime: "25分钟前",
    isVip: false,
    matchScore: 78,
    viewedJob: "UI设计师",
  },
  {
    id: "4",
    name: "陈伟",
    avatar: null,
    position: "Java工程师",
    company: "阿里",
    viewTime: "1小时前",
    isVip: true,
    matchScore: 88,
    viewedJob: "Java工程师",
  },
  {
    id: "5",
    name: "刘洋",
    avatar: null,
    position: "数据分析师",
    company: "京东",
    viewTime: "2小时前",
    isVip: false,
    matchScore: 72,
    viewedJob: "数据分析师",
  },
  {
    id: "6",
    name: "赵磊",
    avatar: null,
    position: "运营专员",
    company: "小米",
    viewTime: "3小时前",
    isVip: false,
    matchScore: 65,
    viewedJob: "运营专员",
  },
];

const resumeStats = {
  totalOpened: 328,
  totalReceived: 1256,
  openRate: "26.1%",
  avgOpenTime: "2.3天",
  firstStepRate: "42%",
};

export default function ViewHeatmapPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [activeTab, setActiveTab] = useState<"overview" | "hr" | "jobs" | "viewers">("overview");

  const statsCards = [
    {
      label: "主页浏览量",
      value: "3,180",
      change: "+12.5%",
      trend: "up",
      icon: <Eye className="h-5 w-5" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "职位浏览量",
      value: "8,930",
      change: "+18.2%",
      trend: "up",
      icon: <Briefcase className="h-5 w-5" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "简历打开率",
      value: resumeStats.openRate,
      change: "+3.1%",
      trend: "up",
      icon: <FileText className="h-5 w-5" />,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "HR活跃度",
      value: "89.5",
      change: "+5.2",
      trend: "up",
      icon: <Zap className="h-5 w-5" />,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              「谁看过我」热力看板
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              实时追踪求职者浏览行为，洞察招聘效果
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {timeRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    timeRange === opt.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              自定义
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { key: "overview", label: "数据概览", icon: <BarChart3 className="h-4 w-4" /> },
              { key: "hr", label: "HR活跃度", icon: <Users className="h-4 w-4" /> },
              { key: "jobs", label: "岗位热区", icon: <Target className="h-4 w-4" /> },
              { key: "viewers", label: "访客列表", icon: <Eye className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat) => (
                <Card key={stat.label} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                      >
                        {stat.icon}
                      </div>
                      <Badge
                        variant={stat.trend === "up" ? "success" : "destructive"}
                        size="sm"
                        className="gap-1"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">浏览趋势分析</CardTitle>
                    <CardDescription>主页浏览、职位浏览、简历打开</CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-slate-600">主页浏览</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-slate-600">职位浏览</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">简历打开</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={viewTrendData}>
                        <defs>
                          <linearGradient id="colorProfile" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorJob" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
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
                        <Area
                          type="monotone"
                          dataKey="jobViews"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="url(#colorJob)"
                          name="职位浏览"
                        />
                        <Area
                          type="monotone"
                          dataKey="profileViews"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#colorProfile)"
                          name="主页浏览"
                        />
                        <Area
                          type="monotone"
                          dataKey="resumeOpens"
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="none"
                          name="简历打开"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">流量来源分布</CardTitle>
                  <CardDescription>求职者从哪里找到你</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {sourceData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-slate-900">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">简历打开漏斗</CardTitle>
                  <CardDescription>从浏览到打开的转化路径</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "职位浏览", value: 8930, percent: 100, color: "bg-blue-500" },
                      { label: "点击查看", value: 3820, percent: 42.8, color: "bg-purple-500" },
                      { label: "投递简历", value: 1256, percent: 14.1, color: "bg-amber-500" },
                      { label: "简历被打开", value: 328, percent: 3.7, color: "bg-emerald-500" },
                      { label: "进入面试", value: 86, percent: 1.0, color: "bg-rose-500" },
                    ].map((item, index) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-slate-600 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                              {index + 1}
                            </span>
                            {item.label}
                          </span>
                          <span className="font-medium text-slate-900">
                            {item.value.toLocaleString()}
                            <span className="text-slate-400 text-xs ml-1">
                              ({item.percent}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">简历打开关键指标</CardTitle>
                  <CardDescription>招聘效率核心指标</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50">
                      <p className="text-sm text-blue-600 mb-1">累计收到简历</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {resumeStats.totalReceived.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50">
                      <p className="text-sm text-emerald-600 mb-1">已打开简历</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {resumeStats.totalOpened.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50">
                      <p className="text-sm text-amber-600 mb-1">平均打开时长</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {resumeStats.avgOpenTime}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50">
                      <p className="text-sm text-purple-600 mb-1">初筛通过率</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {resumeStats.firstStepRate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">AI优化建议</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          优化职位描述关键词可提升 23% 简历打开率
                        </p>
                      </div>
                      <Button size="sm" variant="gradient">
                        去优化
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "hr" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">HR活跃度排行</CardTitle>
                  <CardDescription>综合处理效率与候选人反馈</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hrActivityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#64748b"
                          fontSize={12}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="views" name="浏览简历" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="replies" name="回复沟通" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="interviews" name="邀约面试" fill="#10b981" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="hires" name="成功入职" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">综合能力雷达</CardTitle>
                  <CardDescription>HR能力五维评估</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { subject: "简历处理", A: 95, fullMark: 100 },
                        { subject: "回复速度", A: 88, fullMark: 100 },
                        { subject: "面试邀约", A: 92, fullMark: 100 },
                        { subject: "入职转化", A: 85, fullMark: 100 },
                        { subject: "候选人体验", A: 90, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="团队平均"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">HR详情列表</CardTitle>
                <CardDescription>按活跃度排序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          排名
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          HR
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          浏览简历
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          回复数
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          面试邀约
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          入职人数
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          综合评分
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hrActivityData.map((hr, index) => (
                        <tr key={hr.name} className="hover:bg-slate-50">
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                index === 0
                                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                  : index === 1
                                  ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                                  : index === 2
                                  ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                                  : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar size="sm" fallback={hr.name[0]} />
                              <div>
                                <p className="font-medium text-slate-900">{hr.name}</p>
                                <p className="text-xs text-slate-500">招聘专员</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-slate-900">
                            {hr.views}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-700">{hr.replies}</td>
                          <td className="py-4 px-4 text-right text-slate-700">{hr.interviews}</td>
                          <td className="py-4 px-4 text-right">
                            <Badge variant="success">{hr.hires} 人</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-lg font-bold text-blue-600">{hr.score}</span>
                            <span className="text-xs text-slate-400"> 分</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">岗位点击热区</CardTitle>
                <CardDescription>各职位的浏览与转化情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobHeatmapData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="job" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" height={70} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="views" name="浏览量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicks" name="点击数" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="applications" name="投递数" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="base">岗位热度排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobHeatmapData.map((job, index) => (
                    <div
                      key={job.job}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                          index < 3
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900 truncate">{job.job}</h4>
                          {index === 0 && (
                            <Badge variant="warning" size="sm">
                              最热
                            </Badge>
                          )}
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${(job.views / jobHeatmapData[0].views) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 w-32">
                        <div className="text-sm font-medium text-slate-900">
                          {job.views.toLocaleString()} 浏览
                        </div>
                        <div className="text-xs text-slate-500">
                          {job.applications} 投递 · 打开率 {job.openRate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "viewers" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">最近访客</CardTitle>
                  <CardDescription>共 {profileViewers.length} 位求职者浏览过</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    筛选
                  </Button>
                  <Button variant="gradient" size="sm">
                    导出列表
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {profileViewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="py-4 flex items-center gap-4 hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
                    >
                      <Avatar size="lg" fallback={viewer.name} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{viewer.name}</h4>
                          {viewer.isVip && (
                            <Badge variant="warning" size="sm">
                              <Award className="h-3 w-3 mr-1" />
                              优质人才
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {viewer.position} @ {viewer.company}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            查看了：{viewer.viewedJob}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {viewer.viewTime}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold text-emerald-600 text-lg">
                            {viewer.matchScore}
                          </span>
                          <span className="text-xs text-slate-400">分</span>
                        </div>
                        <p className="text-xs text-slate-500">匹配度</p>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button size="sm" variant="gradient">
                          查看简历
                        </Button>
                        <Button size="sm" variant="outline">
                          发起沟通
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
