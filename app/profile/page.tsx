"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  User,
  Award,
  Briefcase,
  GraduationCap,
  Star,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  MapPin,
  Sparkles,
  Target,
  BookOpen,
  Lightbulb,
  BarChart3,
  Activity,
  MessageSquare,
  FileText,
  ChevronRight,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

const profileData = {
  name: "张明",
  avatar: null,
  title: "高级前端工程师",
  overallScore: 87,
  level: "A+",
  updatedAt: "2024-01-15",
  city: "北京",
  experience: "5年",
  education: "本科 · 北京大学",
  expectedSalary: "30-40K",
};

const skillDimensions = [
  { skill: "专业技能", value: 92 },
  { skill: "项目经验", value: 88 },
  { skill: "学历背景", value: 85 },
  { skill: "沟通表达", value: 78 },
  { skill: "团队协作", value: 90 },
  { skill: "学习能力", value: 95 },
];

const skillTags = [
  { name: "React", level: "精通", score: 95 },
  { name: "TypeScript", level: "精通", score: 92 },
  { name: "Next.js", level: "熟练", score: 88 },
  { name: "Node.js", level: "熟练", score: 82 },
  { name: "Vue.js", level: "了解", score: 70 },
  { name: "Webpack", level: "熟练", score: 85 },
  { name: "性能优化", level: "熟练", score: 80 },
  { name: "单元测试", level: "了解", score: 72 },
];

const behaviorData = [
  { name: "浏览职位", count: 128, category: "求职行为" },
  { name: "投递简历", count: 32, category: "求职行为" },
  { name: "视频面试", count: 8, category: "面试行为" },
  { name: "直播观看", count: 15, category: "互动行为" },
  { name: "弹幕互动", count: 56, category: "互动行为" },
  { name: "简历更新", count: 6, category: "档案行为" },
];

const growthTrend = [
  { month: "2023-08", score: 72 },
  { month: "2023-09", score: 75 },
  { month: "2023-10", score: 78 },
  { month: "2023-11", score: 82 },
  { month: "2023-12", score: 85 },
  { month: "2024-01", score: 87 },
];

const recommendedJobs = [
  {
    id: "1",
    title: "高级前端工程师",
    company: "字节跳动",
    logo: null,
    salary: "30-50K",
    location: "北京",
    matchScore: 95,
    tags: ["React", "TypeScript", "大厂"],
    reason: "技能高度匹配，薪资符合预期",
  },
  {
    id: "2",
    title: "前端技术专家",
    company: "蚂蚁金服",
    logo: null,
    salary: "35-55K",
    location: "杭州",
    matchScore: 92,
    tags: ["React", "架构", "金融"],
    reason: "经验匹配，有成长空间",
  },
  {
    id: "3",
    title: "全栈开发工程师",
    company: "美团",
    logo: null,
    salary: "28-45K",
    location: "北京",
    matchScore: 88,
    tags: ["React", "Node.js", "全栈"],
    reason: "技能拓展性强，发展潜力大",
  },
  {
    id: "4",
    title: "资深前端工程师",
    company: "腾讯",
    logo: null,
    salary: "32-50K",
    location: "深圳",
    matchScore: 90,
    tags: ["Vue.js", "小程序", "大厂"],
    reason: "薪资优厚，平台资源好",
  },
];

const careerPath = [
  { title: "初级开发工程师", years: "1-2年", level: 1 },
  { title: "中级开发工程师", years: "2-4年", level: 2 },
  { title: "高级开发工程师", years: "4-7年", level: 3, current: true },
  { title: "技术专家", years: "7-10年", level: 4 },
  { title: "架构师", years: "10年+", level: 5 },
];

const improvementSuggestions = [
  {
    title: "提升架构设计能力",
    desc: "学习大型项目架构设计，提升系统设计能力",
    progress: 45,
    priority: "high",
    resources: "推荐课程 3 门",
  },
  {
    title: "补充后端知识",
    desc: "学习 Node.js 后端开发，向全栈发展",
    progress: 30,
    priority: "medium",
    resources: "推荐课程 5 门",
  },
  {
    title: "提升英语能力",
    desc: "提高英文读写能力，争取外企机会",
    progress: 60,
    priority: "low",
    resources: "推荐资源 2 个",
  },
  {
    title: "考取专业证书",
    desc: "获取 AWS 或前端相关认证",
    progress: 15,
    priority: "medium",
    resources: "推荐证书 3 个",
  },
];

const activityLog = [
  { time: "今天 14:30", action: "查看了职位", target: "高级前端工程师 @ 字节跳动", type: "view" },
  { time: "今天 11:20", action: "投递了简历", target: "前端技术专家 @ 蚂蚁金服", type: "apply" },
  { time: "昨天 16:45", action: "参加了视频面试", target: "美团 · 一面", type: "interview" },
  { time: "昨天 10:15", action: "更新了简历", target: "添加项目经验", type: "update" },
  { time: "2天前", action: "观看了直播", target: "字节跳动技术岗专场", type: "live" },
];

export default function CandidateProfilePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "recommend" | "growth">("overview");

  const actionIcons: Record<string, React.ReactNode> = {
    view: <Eye className="h-4 w-4" />,
    apply: <FileText className="h-4 w-4" />,
    interview: <Video className="h-4 w-4" />,
    update: <EditIcon className="h-4 w-4" />,
    live: <Radio className="h-4 w-4" />,
  };

  const actionColors: Record<string, string> = {
    view: "bg-blue-100 text-blue-600",
    apply: "bg-emerald-100 text-emerald-600",
    interview: "bg-purple-100 text-purple-600",
    update: "bg-amber-100 text-amber-600",
    live: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative">
              <Avatar size="xl" fallback="张" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800">
                {profileData.level}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{profileData.name}</h1>
                <Badge
                  variant="warning"
                  className="bg-amber-500/20 border-amber-400/30 text-amber-300"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  能力分 {profileData.overallScore}
                </Badge>
                <Badge
                  variant="success"
                  className="bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                >
                  <Award className="h-3 w-3 mr-1" />
                  高潜人才
                </Badge>
              </div>

              <p className="text-lg text-white/80 mb-3">{profileData.title}</p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {profileData.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {profileData.experience}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {profileData.education}
                </span>
                <span className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  期望 {profileData.expectedSalary}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white/60 text-sm mb-1">综合能力评分</p>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  {profileData.overallScore}
                </span>
                <span className="text-white/40 text-sm">/ 100</span>
              </div>
              <p className="text-xs text-white/40 mt-1">
                超过 <span className="text-amber-400 font-medium">92%</span> 的同岗位求职者
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { key: "overview", label: "能力概览", icon: <BarChart3 className="h-4 w-4" /> },
              { key: "skills", label: "技能详情", icon: <Zap className="h-4 w-4" /> },
              { key: "recommend", label: "岗位推荐", icon: <Target className="h-4 w-4" /> },
              { key: "growth", label: "成长建议", icon: <TrendingUp className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
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

      <main className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">六维能力雷达</CardTitle>
                  <CardDescription>全方位能力评估</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={skillDimensions}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="skill" stroke="#64748b" fontSize={12} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="能力值"
                          dataKey="value"
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">核心技能标签</CardTitle>
                  <CardDescription>技能熟练度评估</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {skillTags.map((skill) => (
                      <div
                        key={skill.name}
                        className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{skill.name}</span>
                          <Badge
                            variant={
                              skill.level === "精通"
                                ? "success"
                                : skill.level === "熟练"
                                ? "info"
                                : "secondary"
                            }
                            size="sm"
                          >
                            {skill.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                skill.score >= 90
                                  ? "bg-emerald-500"
                                  : skill.score >= 80
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              )}
                              style={{ width: `${skill.score}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8">{skill.score}分</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">行为数据记录</CardTitle>
                  <CardDescription>基于交互行为的能力画像补充</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={behaviorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" name="次数" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">能力成长趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                        <YAxis domain={[60, 100]} stroke="#64748b" fontSize={10} />
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
                          dataKey="score"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">近半年提升 15 分</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">最近活动</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityLog.slice(0, 5).map((log, index) => (
                    <div key={index} className="flex gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          actionColors[log.type]
                        )}
                      >
                        {actionIcons[log.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-medium">
                          {log.action}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{log.target}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">职场定位</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>初级</span>
                    <span>中级</span>
                    <span>高级</span>
                    <span>专家</span>
                    <span>架构师</span>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                        style={{ width: "60%" }}
                      />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: "60%" }}>
                      <div className="w-4 h-4 -ml-2 rounded-full bg-white border-2 border-blue-500 shadow-lg" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-600 mt-3">
                    当前阶段：<span className="font-medium text-blue-600">高级开发工程师</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">专业技能评分</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {skillTags.map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-900">
                          {skill.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              skill.level === "精通"
                                ? "success"
                                : skill.level === "熟练"
                                ? "info"
                                : "secondary"
                            }
                            size="sm"
                          >
                            {skill.level}
                          </Badge>
                          <span className="text-sm font-semibold text-blue-600 w-10 text-right">
                            {skill.score}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            skill.score >= 90
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : skill.score >= 80
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                              : "bg-gradient-to-r from-amber-500 to-orange-500"
                          )}
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">软技能评估</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "沟通表达", score: 78, desc: "面试表现良好" },
                    { name: "团队协作", score: 90, desc: "多项目协作经验" },
                    { name: "问题解决", score: 85, desc: "独立解决复杂问题" },
                    { name: "学习能力", score: 95, desc: "快速掌握新技术" },
                    { name: "项目管理", score: 72, desc: "有带小型项目经验" },
                    { name: "创新思维", score: 82, desc: "有技术创新案例" },
                  ].map((skill) => (
                    <div key={skill.name} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900 text-sm">{skill.name}</span>
                        <span className="text-sm font-bold text-purple-600">{skill.score}分</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{skill.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">能力验证记录</CardTitle>
                <CardDescription>系统通过行为数据自动验证的能力项</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "React 精通", verified: true, source: "项目经历验证", date: "2024-01-10" },
                    { title: "TypeScript 熟练", verified: true, source: "代码评审验证", date: "2024-01-08" },
                    { title: "系统设计能力", verified: false, source: "待面试验证", date: "" },
                    { title: "性能优化能力", verified: true, source: "项目经历验证", date: "2024-01-05" },
                    { title: "团队协作", verified: true, source: "多维度验证", date: "2024-01-01" },
                    { title: "英语读写能力", verified: false, source: "待证书验证", date: "" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-xl border",
                        item.verified
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {item.verified ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-500">{item.source}</p>
                      {item.date && (
                        <p className="text-xs text-slate-400 mt-1">验证于 {item.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "recommend" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">为你推荐</CardTitle>
                <CardDescription>基于能力画像的智能岗位匹配</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar size="lg" fallback="公" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h4>
                            <Badge
                              variant="success"
                              size="sm"
                              className="gap-1 bg-emerald-50"
                            >
                              <Sparkles className="h-3 w-3" />
                              {job.matchScore}% 匹配
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-2">{job.company}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="text-red-500 font-semibold">{job.salary}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {job.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" size="sm">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <Button variant="gradient" size="sm">
                          立即投递
                        </Button>
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-xs text-emerald-700 text-left">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Lightbulb className="h-3.5 w-3.5" />
                            推荐理由
                          </div>
                          <p>{job.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">推荐算法说明</CardTitle>
                <CardDescription>推荐结果是如何计算的</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { label: "技能匹配", weight: 40, desc: "技术栈与岗位要求重合度" },
                    { label: "经验匹配", weight: 25, desc: "工作年限与项目经验" },
                    { label: "学历匹配", weight: 15, desc: "学历背景与学校层次" },
                    { label: "行为偏好", weight: 20, desc: "历史浏览与投递偏好" },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{item.label}</span>
                        <Badge variant="info">{item.weight}%</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                      <div className="h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${item.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "growth" && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">职业发展路径</CardTitle>
                <CardDescription>你的进阶路线图</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-6">
                  {careerPath.map((path, index) => (
                    <React.Fragment key={path.title}>
                      <div className="flex flex-col items-center relative">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold mb-3 z-10",
                            path.current
                              ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {path.level}
                        </div>
                        <p
                          className={cn(
                            "text-sm font-medium text-center",
                            path.current ? "text-blue-600" : "text-slate-600"
                          )}
                        >
                          {path.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{path.years}</p>
                        {path.current && (
                          <Badge variant="info" className="mt-2">
                            当前
                          </Badge>
                        )}
                      </div>
                      {index < careerPath.length - 1 && (
                        <div
                          className={cn(
                            "flex-1 h-1 mx-2 -mt-10 rounded-full",
                            index < 2 ? "bg-blue-500" : "bg-slate-200"
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">能力提升建议</CardTitle>
                <CardDescription>AI 生成的个性化成长方案</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvementSuggestions.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          item.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : item.priority === "medium"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-blue-600"
                        )}
                      >
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <Badge
                            variant={
                              item.priority === "high"
                                ? "destructive"
                                : item.priority === "medium"
                                ? "warning"
                                : "info"
                            }
                            size="sm"
                          >
                            {item.priority === "high"
                              ? "高优先级"
                              : item.priority === "medium"
                              ? "中优先级"
                              : "低优先级"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{item.desc}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>提升进度</span>
                              <span>{item.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  item.priority === "high"
                                    ? "bg-red-500"
                                    : item.priority === "medium"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                )}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-slate-500">{item.resources}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        去学习
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">目标薪资预测</CardTitle>
                <CardDescription>基于成长轨迹的薪资预测</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { year: "现在", salary: 32, predicted: 32 },
                        { year: "1年后", salary: null, predicted: 40 },
                        { year: "2年后", salary: null, predicted: 48 },
                        { year: "3年后", salary: null, predicted: 58 },
                        { year: "5年后", salary: null, predicted: 75 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}K`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [`${value}K`, "预测薪资"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#colorPredicted)"
                        strokeDasharray="5 5"
                        name="预测薪资"
                      />
                      <defs>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">薪资增长预测</p>
                      <p className="text-sm text-slate-600">
                        按照当前成长速度，预计 3 年后薪资可达{" "}
                        <span className="font-bold text-purple-600">58K</span>，涨幅约{" "}
                        <span className="font-bold text-emerald-600">81%</span>
                      </p>
                    </div>
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

function Radio(props: { className?: string }) {
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
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function EditIcon(props: { className?: string }) {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function Video(props: { className?: string }) {
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
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
