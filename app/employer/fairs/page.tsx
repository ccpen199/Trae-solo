"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
  Briefcase,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  FileText,
  QrCode,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Award,
  Star,
  Download,
  Settings,
  Building2,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/utils";
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
} from "recharts";

const jobFairs = [
  {
    id: "1",
    name: "2024春季互联网招聘会",
    type: "线上",
    status: "进行中",
    cover: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=200&fit=crop",
    startDate: "2024-03-15",
    endDate: "2024-03-17",
    booths: 56,
    jobs: 320,
    applicants: 12580,
    checkins: 8920,
    progress: 65,
  },
  {
    id: "2",
    name: "北京大学校园招聘会",
    type: "线下",
    status: "即将开始",
    cover: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=400&h=200&fit=crop",
    startDate: "2024-03-20",
    endDate: "2024-03-21",
    booths: 32,
    jobs: 180,
    applicants: 5680,
    checkins: 0,
    progress: 0,
  },
  {
    id: "3",
    name: "AI人才专场招聘会",
    type: "线上",
    status: "已结束",
    cover: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop",
    startDate: "2024-02-20",
    endDate: "2024-02-22",
    booths: 45,
    jobs: 210,
    applicants: 15680,
    checkins: 11250,
    progress: 100,
  },
];

const boothList = [
  {
    id: "b1",
    name: "字节跳动展位",
    company: "字节跳动",
    boothNo: "A-01",
    jobs: 8,
    received: 256,
    screening: 128,
    interviewed: 45,
    status: "online",
  },
  {
    id: "b2",
    name: "腾讯展位",
    company: "腾讯",
    boothNo: "A-02",
    jobs: 12,
    received: 312,
    screening: 156,
    interviewed: 62,
    status: "online",
  },
  {
    id: "b3",
    name: "阿里巴巴展位",
    company: "阿里巴巴",
    boothNo: "A-03",
    jobs: 10,
    received: 289,
    screening: 145,
    interviewed: 58,
    status: "online",
  },
  {
    id: "b4",
    name: "美团展位",
    company: "美团",
    boothNo: "B-01",
    jobs: 6,
    received: 178,
    screening: 89,
    interviewed: 32,
    status: "busy",
  },
  {
    id: "b5",
    name: "京东展位",
    company: "京东",
    boothNo: "B-02",
    jobs: 9,
    received: 201,
    screening: 100,
    interviewed: 38,
    status: "online",
  },
  {
    id: "b6",
    name: "网易展位",
    company: "网易",
    boothNo: "B-03",
    jobs: 7,
    received: 165,
    screening: 82,
    interviewed: 28,
    status: "offline",
  },
];

const resumes = [
  {
    id: "r1",
    name: "张明",
    avatar: null,
    position: "高级前端工程师",
    matchScore: 92,
    source: "扫码投递",
    time: "10分钟前",
    status: "待筛选",
    education: "本科 · 北京大学",
    experience: "5年",
  },
  {
    id: "r2",
    name: "李华",
    avatar: null,
    position: "Java工程师",
    matchScore: 85,
    source: "展位投递",
    time: "25分钟前",
    status: "AI通过",
    education: "硕士 · 清华大学",
    experience: "3年",
  },
  {
    id: "r3",
    name: "王芳",
    avatar: null,
    position: "产品经理",
    matchScore: 78,
    source: "扫码投递",
    time: "1小时前",
    status: "待筛选",
    education: "本科 · 浙江大学",
    experience: "4年",
  },
  {
    id: "r4",
    name: "陈伟",
    avatar: null,
    position: "算法工程师",
    matchScore: 95,
    source: "直播投递",
    time: "2小时前",
    status: "邀约面试",
    education: "博士 · 中科院",
    experience: "6年",
  },
  {
    id: "r5",
    name: "刘洋",
    avatar: null,
    position: "UI设计师",
    matchScore: 72,
    source: "展位投递",
    time: "3小时前",
    status: "AI淘汰",
    education: "本科 · 中国美院",
    experience: "2年",
  },
];

const checkinStats = [
  { time: "09:00", count: 520 },
  { time: "10:00", count: 1280 },
  { time: "11:00", count: 2150 },
  { time: "12:00", count: 2890 },
  { time: "13:00", count: 3200 },
  { time: "14:00", count: 4560 },
  { time: "15:00", count: 5890 },
  { time: "16:00", count: 7200 },
  { time: "17:00", count: 8120 },
  { time: "18:00", count: 8920 },
];

const screeningStats = [
  { name: "AI通过", value: 45, color: "#10b981" },
  { name: "待人工审核", value: 30, color: "#f59e0b" },
  { name: "AI淘汰", value: 25, color: "#ef4444" },
];

export default function JobFairManagementPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeTab, setActiveTab] = useState<"fairs" | "booths" | "resumes" | "screening">("fairs");
  const [selectedFair, setSelectedFair] = useState<string | null>(null);

  const statusConfig: Record<string, { label: string; variant: string }> = {
    进行中: { label: "进行中", variant: "success" },
    即将开始: { label: "即将开始", variant: "warning" },
    已结束: { label: "已结束", variant: "secondary" },
  };

  const boothStatusConfig: Record<string, { label: string; variant: string; dot: string }> = {
    online: { label: "在线", variant: "success", dot: "bg-emerald-500" },
    busy: { label: "繁忙", variant: "warning", dot: "bg-amber-500" },
    offline: { label: "离线", variant: "secondary", dot: "bg-slate-400" },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              招聘会数字化管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              线上展位搭建、简历自动归集、AI初筛、扫码签到一体化管理
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              生成签到码
            </Button>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              创建招聘会
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { key: "fairs", label: "招聘会管理", icon: <CalendarDays className="h-4 w-4" /> },
              { key: "booths", label: "展位管理", icon: <Building2 className="h-4 w-4" /> },
              { key: "resumes", label: "简历归集", icon: <FileText className="h-4 w-4" /> },
              { key: "screening", label: "AI初筛", icon: <Sparkles className="h-4 w-4" /> },
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
        {activeTab === "fairs" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "进行中", value: "1", icon: <Play className="h-5 w-5" />, color: "from-emerald-500 to-teal-500" },
                { label: "即将开始", value: "2", icon: <Clock className="h-5 w-5" />, color: "from-amber-500 to-orange-500" },
                { label: "已结束", value: "8", icon: <CheckCircle2 className="h-5 w-5" />, color: "from-slate-400 to-slate-500" },
                { label: "累计服务求职者", value: "58K+", icon: <Users className="h-5 w-5" />, color: "from-blue-500 to-indigo-500" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">全部招聘会</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    placeholder="搜索招聘会..."
                    leftIcon={<Search className="h-4 w-4" />}
                    className="w-64 h-9"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  筛选
                </Button>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "grid"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      viewMode === "list"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobFairs.map((fair) => {
                const status = statusConfig[fair.status];
                return (
                  <Card key={fair.id} hover className="overflow-hidden cursor-pointer"
                        onClick={() => setSelectedFair(fair.id)}>
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={fair.cover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge
                        variant={status.variant as "default" | "success" | "warning" | "secondary"}
                        className="absolute top-3 left-3"
                      >
                        {fair.type} · {status.label}
                      </Badge>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="font-semibold text-white line-clamp-1">
                          {fair.name}
                        </h4>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="p-2 rounded-lg bg-slate-50">
                          <p className="text-lg font-bold text-slate-900">{fair.booths}</p>
                          <p className="text-xs text-slate-500">参展企业</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <p className="text-lg font-bold text-slate-900">{fair.jobs}</p>
                          <p className="text-xs text-slate-500">招聘岗位</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50">
                          <p className="text-lg font-bold text-slate-900">
                            {(fair.applicants / 1000).toFixed(1)}K
                          </p>
                          <p className="text-xs text-slate-500">求职者</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {fair.startDate} ~ {fair.endDate}
                        </span>
                      </div>

                      {fair.status === "进行中" && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>签到进度</span>
                            <span>{fair.checkins.toLocaleString()} / {fair.applicants.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                              style={{ width: `${(fair.checkins / fair.applicants) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" fullWidth className="h-8">
                          查看详情
                        </Button>
                        <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "booths" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">展位布局</CardTitle>
                <CardDescription>点击展位查看详情</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-3">
                  {boothList.map((booth) => {
                    const status = boothStatusConfig[booth.status];
                    return (
                      <div
                        key={booth.id}
                        className="aspect-square rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center p-3 text-center"
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full mb-2 ${status.dot}`}
                        />
                        <p className="font-semibold text-slate-900 text-sm">{booth.boothNo}</p>
                        <p className="text-xs text-slate-500 truncate w-full">
                          {booth.company}
                        </p>
                        <Badge variant="secondary" size="sm" className="mt-2">
                          {booth.jobs}个岗位
                        </Badge>
                      </div>
                    );
                  })}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Plus className="h-6 w-6 text-slate-300" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">展位列表</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  添加展位
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          展位号
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          企业
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          岗位数
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          收到简历
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          初筛中
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          已面试
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          状态
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {boothList.map((booth) => {
                        const status = boothStatusConfig[booth.status];
                        return (
                          <tr key={booth.id} className="hover:bg-slate-50">
                            <td className="py-4 px-4">
                              <Badge variant="secondary">{booth.boothNo}</Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-slate-900">{booth.company}</p>
                                <p className="text-xs text-slate-500">{booth.name}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-medium text-slate-900">
                              {booth.jobs}
                            </td>
                            <td className="py-4 px-4 text-center text-slate-700">{booth.received}</td>
                            <td className="py-4 px-4 text-center text-amber-600">{booth.screening}</td>
                            <td className="py-4 px-4 text-center text-emerald-600">{booth.interviewed}</td>
                            <td className="py-4 px-4 text-center">
                              <Badge
                                variant={status.variant as "default" | "success" | "warning" | "secondary"}
                                size="sm"
                                className="gap-1.5"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button variant="ghost" size="sm">
                                管理
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "resumes" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: "累计收取简历", value: "1,256", change: "+128", trend: "up", color: "text-blue-600" },
                { label: "今天新增", value: "256", change: "+32", trend: "up", color: "text-emerald-600" },
                { label: "扫码投递", value: "892", change: "+56", trend: "up", color: "text-purple-600" },
                { label: "展位投递", value: "364", change: "+12", trend: "up", color: "text-amber-600" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className={cn("text-xs font-medium", stat.color)}>
                      {stat.change} 今日
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">简历列表</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                  <Button variant="gradient" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI批量筛选
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-3">
                  <Input
                    placeholder="搜索候选人..."
                    leftIcon={<Search className="h-4 w-4" />}
                    className="w-64 h-9"
                  />
                  <select className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
                    <option>全部来源</option>
                    <option>扫码投递</option>
                    <option>展位投递</option>
                    <option>直播投递</option>
                  </select>
                  <select className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
                    <option>全部状态</option>
                    <option>待筛选</option>
                    <option>AI通过</option>
                    <option>邀约面试</option>
                    <option>AI淘汰</option>
                  </select>
                </div>

                <div className="divide-y divide-slate-100">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="py-4 flex items-center gap-4 hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
                    >
                      <Avatar size="lg" fallback={resume.name} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{resume.name}</h4>
                          <Badge
                            variant={
                              resume.status === "AI通过" || resume.status === "邀约面试"
                                ? "success"
                                : resume.status === "AI淘汰"
                                ? "destructive"
                                : "warning"
                            }
                            size="sm"
                          >
                            {resume.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {resume.position} · {resume.education} · {resume.experience}经验
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {resume.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {resume.time}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Sparkles className="h-4 w-4 text-emerald-500" />
                          <span className="font-bold text-emerald-600 text-lg">
                            {resume.matchScore}
                          </span>
                          <span className="text-xs text-slate-400">分</span>
                        </div>
                        <p className="text-xs text-slate-500">AI匹配度</p>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button size="sm" variant="gradient">
                          查看详情
                        </Button>
                        {resume.status === "待筛选" && (
                          <Button size="sm" variant="outline">
                            AI初筛
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "screening" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">签到人数趋势</CardTitle>
                  <CardDescription>今日实时签到数据</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={checkinStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
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
                          dataKey="count"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="none"
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="签到人数"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">AI初筛结果</CardTitle>
                  <CardDescription>自动筛选分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={screeningStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {screeningStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {screeningStats.map((item) => (
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AI初筛配置</CardTitle>
                <CardDescription>设置筛选规则和权重</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "关键词匹配", weight: 35, desc: "JD关键词匹配度" },
                    { label: "工作经验", weight: 20, desc: "相关工作年限" },
                    { label: "学历背景", weight: 15, desc: "最高学历与学校" },
                    { label: "证书资质", weight: 15, desc: "专业证书匹配" },
                    { label: "技能匹配", weight: 15, desc: "技能栈匹配度" },
                    { label: "稳定性", weight: 10, desc: "过往工作稳定性" },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{item.label}</span>
                        <Badge variant="info" size="sm">
                          {item.weight}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={item.weight}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline">恢复默认</Button>
                  <Button variant="gradient">保存配置</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">签到管理</CardTitle>
                <CardDescription>线下扫码签到联动</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="w-40 h-40 bg-white rounded-xl p-4 shadow-sm flex items-center justify-center mb-4">
                      <QrCode className="w-full h-full text-slate-800" />
                    </div>
                    <p className="font-medium text-slate-900">现场签到码</p>
                    <p className="text-sm text-slate-500 mt-1">求职者扫码完成签到</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Download className="h-4 w-4 mr-2" />
                      下载二维码
                    </Button>
                  </div>

                  <div className="flex-1 space-y-4">
                    {[
                      { label: "今日签到", value: "2,856", change: "+156" },
                      { label: "累计签到", value: "8,920", change: "" },
                      { label: "签到率", value: "70.9%", change: "+2.3%" },
                      { label: "高峰时段", value: "14:00-15:00", change: "" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
                      >
                        <span className="text-slate-600">{item.label}</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-lg">
                            {item.value}
                          </span>
                          {item.change && (
                            <span className="text-xs text-emerald-600 ml-2">
                              {item.change}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Play(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
