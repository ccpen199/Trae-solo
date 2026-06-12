"use client";

import Link from "next/link";
import {
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Filter,
  Mail,
  MapPin,
  Search,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const resumes = [
  {
    id: "resume-001",
    name: "张明",
    position: "高级前端工程师",
    city: "北京",
    experience: "5年经验",
    education: "本科",
    match: 92,
    status: "新投递",
    source: "AI智能推荐",
    appliedAt: "10分钟前",
    skills: ["React", "TypeScript", "微前端", "性能优化"],
  },
  {
    id: "resume-002",
    name: "李华",
    position: "产品经理",
    city: "杭州",
    experience: "6年经验",
    education: "硕士",
    match: 85,
    status: "待筛选",
    source: "直播招聘",
    appliedAt: "25分钟前",
    skills: ["SaaS", "增长", "数据分析", "项目管理"],
  },
  {
    id: "resume-003",
    name: "王芳",
    position: "UI/UX设计师",
    city: "上海",
    experience: "3年经验",
    education: "本科",
    match: 78,
    status: "已查看",
    source: "招聘会扫码",
    appliedAt: "1小时前",
    skills: ["Figma", "交互设计", "用户研究", "设计系统"],
  },
  {
    id: "resume-004",
    name: "陈伟",
    position: "Java开发工程师",
    city: "深圳",
    experience: "7年经验",
    education: "本科",
    match: 88,
    status: "待约面",
    source: "职位详情投递",
    appliedAt: "2小时前",
    skills: ["Java", "Spring Cloud", "Redis", "高并发"],
  },
];

const statusVariant = {
  新投递: "info",
  待筛选: "warning",
  已查看: "secondary",
  待约面: "success",
} as const;

export default function EmployerResumesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="employer" user={{ name: "企业管理员", role: "EMPLOYER" }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <Brain className="h-4 w-4" />
              AI 简历管理
            </div>
            <h1 className="text-2xl font-bold text-slate-900">企业简历库</h1>
            <p className="mt-1 text-slate-600">集中筛选投递简历、查看匹配度并推进面试流程</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
            <Link href="/employer/interviews">
              <Button variant="gradient">
                安排面试
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            { label: "本周新增", value: "86", icon: FileText, color: "text-blue-600 bg-blue-50" },
            { label: "AI高匹配", value: "24", icon: Sparkles, color: "text-purple-600 bg-purple-50" },
            { label: "待约面", value: "12", icon: CalendarDays, color: "text-amber-600 bg-amber-50" },
            { label: "已入库", value: "328", icon: UserCheck, color: "text-emerald-600 bg-emerald-50" },
          ].map((item) => (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>最新投递</CardTitle>
              <CardDescription>按投递时间排序，默认展示全部招聘渠道</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="搜索姓名、岗位或技能"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumes.map((resume) => (
              <div className="rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <Avatar size="lg" fallback={resume.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{resume.name}</h3>
                      <Badge variant={statusVariant[resume.status as keyof typeof statusVariant]} size="sm">
                        {resume.status}
                      </Badge>
                      <span className="text-sm text-slate-500">{resume.appliedAt}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{resume.position} · {resume.experience} · {resume.education}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resume.skills.map((skill) => (
                        <Badge variant="secondary" size="sm">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-500 lg:w-44">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{resume.city}</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{resume.source}</span>
                  </div>
                  <div className="flex items-center gap-3 lg:w-44">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-lg font-bold">{resume.match}%</span>
                    </div>
                    <span className="text-sm text-slate-500">匹配</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">查看简历</Button>
                    <Link href="/employer/interviews">
                      <Button variant="gradient" size="sm">约面</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
