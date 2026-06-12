import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  MapPin,
  Send,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const jobs = {
  "1": {
    title: "高级前端工程师",
    company: "字节跳动",
    location: "北京",
    salary: "25-50K",
    experience: "3-5年",
    education: "本科",
    match: 92,
    tags: ["React", "TypeScript", "微前端", "性能优化"],
  },
  "2": {
    title: "高级产品经理",
    company: "阿里巴巴",
    location: "杭州",
    salary: "20-35K",
    experience: "5-10年",
    education: "本科",
    match: 85,
    tags: ["B端产品", "SaaS", "数据分析", "项目管理"],
  },
} as const;

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs[params.id as keyof typeof jobs] || jobs["1"];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="jobseeker" user={{ name: "张三", role: "JOB_SEEKER" }} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/jobs" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          返回职位列表
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="gradient">AI 推荐</Badge>
                      <Badge variant="destructive">急招</Badge>
                      <span className="text-sm text-slate-500">更新于今天</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
                    <p className="mt-2 text-lg text-slate-600">{job.company}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{job.experience}</span>
                      <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{job.education}</span>
                      <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />全职</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm text-red-500">薪资范围</p>
                    <p className="text-2xl font-bold text-red-600">{job.salary}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <Badge variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>职位描述</CardTitle>
                <CardDescription>岗位职责与团队协作方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-600">
                <p>负责核心招聘业务产品的前端研发和体验优化，参与从需求评审、技术方案、开发联调到上线复盘的完整流程。</p>
                <p>与产品、设计、后端和算法团队紧密协作，建设可复用组件、数据可视化模块和高质量工程规范。</p>
                <p>关注性能、稳定性和可维护性，推动复杂页面加载速度、交互反馈和异常监控持续改进。</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>任职要求</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  "熟悉 React、TypeScript 和现代前端工程化体系。",
                  "具备复杂业务页面抽象能力，能独立推进模块设计与落地。",
                  "有性能优化、组件库或数据可视化经验者优先。",
                  "沟通清晰，能在快节奏业务环境中保持交付质量。",
                ].map((item) => (
                  <div className="flex gap-3 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">AI 匹配度</p>
                    <p className="text-2xl font-bold text-emerald-600">{job.match}%</p>
                  </div>
                </div>
                <Button variant="gradient" fullWidth>
                  <Send className="mr-2 h-4 w-4" />
                  一键投递
                </Button>
                <Button variant="outline" fullWidth className="mt-2">
                  <Star className="mr-2 h-4 w-4" />
                  收藏职位
                </Button>
                <Button variant="ghost" fullWidth className="mt-2">
                  <Share2 className="mr-2 h-4 w-4" />
                  分享
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">公司信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />{job.company}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.location} · 互联网</div>
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" />六险一金、年终奖、弹性工作</div>
                <Link href="/employer/brand">
                  <Button variant="outline" size="sm" className="mt-2 w-full">查看雇主品牌</Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
