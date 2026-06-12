import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Briefcase,
  FileText,
  Video,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  User,
  MapPin,
  Star,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function JobSeekerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "JOB_SEEKER") {
    redirect("/auth/login?role=jobseeker");
  }

  const applications = await prisma.jobApplication.findMany({
    where: { jobSeekerId: user.jobSeeker?.id || "" },
    include: {
      job: {
        include: { company: true },
      },
    },
    orderBy: { appliedAt: "desc" },
    take: 5,
  });

  const interviews = await prisma.videoInterview.findMany({
    where: { jobSeekerId: user.jobSeeker?.id || "" },
    include: {
      application: {
        include: {
          job: {
            include: { company: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });

  const recommendations = await prisma.jobRecommendation.findMany({
    where: {
      profile: { jobSeekerId: user.jobSeeker?.id || "" },
      isApplied: false,
    },
    include: {
      job: {
        include: { company: true },
      },
    },
    orderBy: { score: "desc" },
    take: 4,
  });

  const stats = {
    totalApplied: applications.length,
    interviews: interviews.filter((i) => i.status === "SCHEDULED").length,
    offers: applications.filter((a) => a.status === "OFFER_SENT").length,
    profileScore: user.jobSeeker ? 85 : 0,
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "info" | "secondary" | "destructive"; icon: React.ReactNode }> = {
    APPLIED: { label: "已投递", variant: "info", icon: <Clock3 className="h-3 w-3" /> },
    RESUME_SCREENING: { label: "简历筛选中", variant: "warning", icon: <Clock className="h-3 w-3" /> },
    INITIAL_INTERVIEW: { label: "初面中", variant: "warning", icon: <Clock3 className="h-3 w-3" /> },
    TECHNICAL_INTERVIEW: { label: "技术面", variant: "warning", icon: <Clock3 className="h-3 w-3" /> },
    FINAL_INTERVIEW: { label: "终面", variant: "warning", icon: <Clock3 className="h-3 w-3" /> },
    OFFER_SENT: { label: "已发Offer", variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
    HIRED: { label: "已入职", variant: "success", icon: <CheckCircle2 className="h-3 w-3" /> },
    REJECTED: { label: "未通过", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        role="jobseeker"
        user={{ name: user.name, avatar: user.avatar || undefined, role: user.role }}
        unreadNotifications={3}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            早上好，{user.name} 👋
          </h1>
          <p className="mt-1 text-slate-600">
            今天有 {applications.filter((a) => a.status === "APPLIED").length} 个投递在等待反馈
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">已投递职位</p>
                  <p className="mt-1 text-3xl font-bold">{stats.totalApplied}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">待面试</p>
                  <p className="mt-1 text-3xl font-bold">{stats.interviews}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Video className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">收到Offer</p>
                  <p className="mt-1 text-3xl font-bold">{stats.offers}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-100">能力画像分</p>
                  <p className="mt-1 text-3xl font-bold">{stats.profileScore}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">AI智能推荐</CardTitle>
                  <CardDescription>基于你的能力画像，为你精选好工作</CardDescription>
                </div>
                <Badge variant="gradient">
                  <Sparkles className="h-3 w-3 mr-1" /> AI推荐
                </Badge>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <img
                          src={rec.job.company.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=48&h=48&fit=crop"}
                          alt={rec.job.company.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {rec.job.title}
                            </h4>
                            <Badge variant="secondary" size="sm">
                              匹配度 {Math.round(rec.score)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{rec.job.company.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-red-500 font-semibold text-sm">
                              {rec.job.salaryMin && rec.job.salaryMax
                                ? `${rec.job.salaryMin / 1000}-${rec.job.salaryMax / 1000}K`
                                : "薪资面议"}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[rec.job.city, rec.job.district, rec.job.address].filter(Boolean).join(" · ") || "地点不限"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>完善简历，获取AI推荐职位</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t">
                  <Link href="/jobs">
                    <Button variant="ghost" size="sm" className="w-full">
                      查看更多职位 <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">投递记录</CardTitle>
                  <CardDescription>最近的投递状态实时更新</CardDescription>
                </div>
                <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-700">
                  全部
                </Link>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const status = statusConfig[app.status] || statusConfig.APPLIED;
                      return (
                        <div
                          key={app.id}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <img
                            src={app.job.company.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=48&h=48&fit=crop"}
                            alt={app.job.company.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm">{app.job.title}</h4>
                            <p className="text-xs text-slate-500">{app.job.company.name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={status.variant} size="sm" className="mb-1">
                              {status.label}
                            </Badge>
                            <p className="text-xs text-slate-400">{formatDate(app.appliedAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>还没有投递记录</p>
                    <Link href="/jobs">
                      <Button variant="outline" size="sm" className="mt-4">
                        去投递职位
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/resume">
                  <Button variant="ghost" size="lg" fullWidth className="justify-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">我的简历</p>
                      <p className="text-xs text-slate-500">管理和编辑简历</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Button>
                </Link>
                <Link href="/resume/ai">
                  <Button variant="ghost" size="lg" fullWidth className="justify-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">AI简历解析</p>
                      <p className="text-xs text-slate-500">一键上传智能解析</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Button>
                </Link>
                <Link href="/interviews">
                  <Button variant="ghost" size="lg" fullWidth className="justify-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Video className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">视频面试</p>
                      <p className="text-xs text-slate-500">预约与回放</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Button>
                </Link>
                <Link href="/live">
                  <Button variant="ghost" size="lg" fullWidth className="justify-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Radio className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">直播招聘</p>
                      <p className="text-xs text-slate-500">看直播投简历</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Button>
                </Link>
                <Link href="/job-fairs">
                  <Button variant="ghost" size="lg" fullWidth className="justify-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">招聘会</p>
                      <p className="text-xs text-slate-500">线上线下招聘会</p>
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">待面试</CardTitle>
                <CardDescription>即将开始的视频面试</CardDescription>
              </CardHeader>
              <CardContent>
                {interviews.length > 0 ? (
                  <div className="space-y-3">
                    {interviews.map((interview) => {
                      const interviewJob = interview.application?.job;
                      return (
                        <div key={interview.id} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{interview.title || "视频面试"}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2">
                            {interviewJob ? `${interviewJob.company.name} · ${interviewJob.title}` : "智能视频面试"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(interview.scheduledAt || interview.createdAt, "MM月DD日 HH:mm")}</span>
                          </div>
                          {interview.status === "SCHEDULED" && (
                            <Link href={`/interviews/${interview.id}`}>
                              <Button size="sm" variant="default" fullWidth className="mt-3">
                                进入面试
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">暂无待面试</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">能力画像</CardTitle>
                <CardDescription>基于行为数据的能力评估</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "技术能力", score: 85, color: "bg-blue-500" },
                    { name: "沟通能力", score: 78, color: "bg-purple-500" },
                    { name: "项目经验", score: 72, color: "bg-emerald-500" },
                    { name: "学历背景", score: 90, color: "bg-amber-500" },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{item.name}</span>
                        <span className="text-xs font-medium text-slate-900">{item.score}分</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/profile/portrait">
                  <Button variant="outline" size="sm" fullWidth className="mt-4">
                    查看完整画像
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
