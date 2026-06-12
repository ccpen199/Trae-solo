"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Play,
  Plus,
  Radio,
  Video,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const interviews = [
  { id: "iv-001", candidate: "张明", job: "高级前端工程师", time: "今天 14:00", type: "视频面试", status: "待面试", score: 92 },
  { id: "iv-002", candidate: "李华", job: "产品经理", time: "今天 15:30", type: "视频面试", status: "待面试", score: 85 },
  { id: "iv-003", candidate: "王芳", job: "UI/UX设计师", time: "明天 10:00", type: "电话面试", status: "待面试", score: 78 },
  { id: "iv-004", candidate: "陈伟", job: "Java开发工程师", time: "昨天 16:00", type: "视频面试", status: "已完成", score: 88 },
];

export default function EmployerInterviewsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="employer" user={{ name: "企业管理员", role: "EMPLOYER" }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
              <Video className="h-4 w-4" />
              企业面试中台
            </div>
            <h1 className="text-2xl font-bold text-slate-900">面试安排</h1>
            <p className="mt-1 text-slate-600">统一管理视频面试、电话面试、录制回放和候选人反馈</p>
          </div>
          <div className="flex gap-2">
            <Link href="/employer/resumes">
              <Button variant="outline">返回简历库</Button>
            </Link>
            <Button variant="gradient">
              <Plus className="mr-2 h-4 w-4" />
              新建面试
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>今日日程</CardTitle>
              <CardDescription>候选人、面试官与会议链接已同步</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {interviews.map((interview) => (
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <Avatar fallback={interview.candidate} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{interview.candidate}</h3>
                        <Badge variant={interview.status === "已完成" ? "success" : "warning"} size="sm">
                          {interview.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{interview.job}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{interview.time}</span>
                        <span className="flex items-center gap-1.5"><Video className="h-4 w-4" />{interview.type}</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      AI 匹配 <span className="font-bold text-emerald-600">{interview.score}%</span>
                    </div>
                    <div className="flex gap-2">
                      {interview.status === "已完成" ? (
                        <Button variant="outline" size="sm">
                          <Play className="mr-2 h-4 w-4" />
                          回放
                        </Button>
                      ) : (
                        <Button variant="gradient" size="sm">
                          <Video className="mr-2 h-4 w-4" />
                          入会
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">面试漏斗</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  ["待筛选", 36],
                  ["待面试", 12],
                  ["已完成", 18],
                  ["进入终面", 5],
                ].map(([label, value]) => (
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Number(value) * 2}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  同步日历
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  导出记录
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  面试评价模板
                </Button>
                <Link href="/employer/live">
                  <Button variant="outline" className="w-full justify-start">
                    <Radio className="mr-2 h-4 w-4" />
                    直播招聘间
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  面试视频、聊天记录和评价表会自动归档到候选人档案，便于复盘和协同决策。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
