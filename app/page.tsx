import Link from "next/link";
import {
  Video,
  Radio,
  ArrowRight,
  Star,
  Users,
  Briefcase,
  MapPin,
  Upload,
  Eye,
  DollarSign,
  CheckCircle2,
  BarChart3,
  Brain,
  UserCircle,
  QrCode,
  ListFilter,
  LayoutGrid,
  FileSearch,
  ChevronRight,
  Building2,
  Shield,
  Film,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const jobs = [
  {
    id: "1",
    title: "高级前端工程师",
    company: "字节跳动",
    logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
    location: "北京",
    salary: "25-50K",
    tags: ["React", "TypeScript", "3-5年"],
  },
  {
    id: "2",
    title: "B端产品经理",
    company: "阿里巴巴",
    logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=80&h=80&fit=crop",
    location: "杭州",
    salary: "20-35K",
    tags: ["SaaS", "5-10年"],
  },
  {
    id: "3",
    title: "AI算法工程师",
    company: "腾讯",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
    location: "深圳",
    salary: "30-60K",
    tags: ["NLP", "机器学习"],
  },
  {
    id: "4",
    title: "资深Java开发",
    company: "美团",
    logo: "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=80&h=80&fit=crop",
    location: "上海",
    salary: "22-45K",
    tags: ["Java", "微服务"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-400/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-4 py-1.5 border border-blue-100 shadow-sm">
                <Badge variant="gradient" size="sm">2026</Badge>
                <span className="text-sm text-slate-600">智能招聘操作系统</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                求职者 &amp; 企业双端闭环
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  AI 全程陪伴
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                求职者：简历解析 → 智能匹配 → 一键投递 → 视频面试 → 回放复盘 → 能力画像。
                企业：直播招聘 → 雇主品牌 → 数据热力图 → 薪酬报告 → 招聘会数字化。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button size="lg" variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    求职者工作台
                  </Button>
                </Link>
                <Link href="/employer/dashboard">
                  <Button size="lg" variant="outline">
                    企业管理后台
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="lg" variant="ghost">免费注册</Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-xl">
                <Link href="/resume/ai" className="rounded-xl bg-white/80 backdrop-blur p-3 text-center hover:bg-white hover:shadow-md transition-all border border-white/60">
                  <Brain className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs font-semibold text-slate-700">AI 解析</p>
                  <p className="text-[10px] text-slate-500">3秒补全</p>
                </Link>
                <Link href="/jobs" className="rounded-xl bg-white/80 backdrop-blur p-3 text-center hover:bg-white hover:shadow-md transition-all border border-white/60">
                  <Briefcase className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700">一键投递</p>
                  <p className="text-[10px] text-slate-500">AI匹配</p>
                </Link>
                <Link href="/interviews" className="rounded-xl bg-white/80 backdrop-blur p-3 text-center hover:bg-white hover:shadow-md transition-all border border-white/60">
                  <Video className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-700">视频面试</p>
                  <p className="text-[10px] text-slate-500">云端录制</p>
                </Link>
                <Link href="/employer/live" className="rounded-xl bg-white/80 backdrop-blur p-3 text-center hover:bg-white hover:shadow-md transition-all border border-white/60">
                  <Radio className="h-5 w-5 mx-auto mb-1 text-rose-500" />
                  <p className="text-xs font-semibold text-slate-700">直播招聘</p>
                  <p className="text-[10px] text-slate-500">弹幕连麦</p>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {["A", "B", "C", "D", "E"].map((c) => (
                    <div key={c} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-medium">{c}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-slate-900">4.9 分</span>
                  </div>
                  <p className="text-xs text-slate-500">500万+用户 · 10万+企业</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 rounded-2xl bg-white/80 backdrop-blur border border-white/60 p-5 shadow-2xl shadow-indigo-200/60">
                <div className="aspect-video w-full relative rounded-xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&h=560&fit=crop" className="w-full h-full object-cover" alt="product" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="rounded-lg bg-white/95 backdrop-blur p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 rounded-lg items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">AI简历解析完成</p>
                          <p className="text-xs text-slate-500">已识别5段经历 · 3所院校 · 12技能</p>
                        </div>
                        <Link href="/resume/ai"><Button size="sm" variant="gradient">查看</Button></Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Link href="/jobs" className="rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-blue-200 transition-all p-3 text-center">
                    <Briefcase className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-semibold text-slate-700">岗位匹配</p>
                    <p className="text-[10px] text-slate-500">238 个</p>
                  </Link>
                  <Link href="/interviews" className="rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-200 transition-all p-3 text-center">
                    <Video className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-700">待面试</p>
                    <p className="text-[10px] text-slate-500">3 场</p>
                  </Link>
                  <Link href="/employer/views" className="rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-purple-200 transition-all p-3 text-center">
                    <Eye className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs font-semibold text-slate-700">被查看</p>
                    <p className="text-[10px] text-slate-500">12 次</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 求职者四步闭环 ========== */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="info" size="lg" className="mb-3">求职者路径</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">四步闭环：上传简历 → 拿到 Offer</h2>
            <p className="text-slate-600">每一步均可点击进入对应业务页面 <span className="text-blue-600 font-medium">点击卡片体验</span></p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Link href="/resume/ai" className="group">
              <Card hover className="h-full">
                <CardContent className="p-6 relative">
                  <div className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 1</div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">AI简历解析</h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">上传PDF/Word，自动补全教育/工作/技能字段</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 -mx-6 px-6">
                    <span className="text-xs font-medium text-slate-500">点击进入</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">立即体验 <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Step 2 */}
            <Link href="/jobs" className="group">
              <Card hover className="h-full">
                <CardContent className="p-6 relative">
                  <div className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 2</div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">一键投递</h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">基于能力画像智能匹配，一键批量投递</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 -mx-6 px-6">
                    <span className="text-xs font-medium text-slate-500">点击进入</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">找工作 <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Step 3 */}
            <Link href="/interviews" className="group">
              <Card hover className="h-full">
                <CardContent className="p-6 relative">
                  <div className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 3</div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    <Video className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">视频面试</h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">预约面试 + 云端录制回放，复盘表现</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 -mx-6 px-6">
                    <span className="text-xs font-medium text-slate-500">点击进入</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">进入面试 <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Step 4 */}
            <Link href="/profile" className="group">
              <Card hover className="h-full">
                <CardContent className="p-6 relative">
                  <div className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Step 4</div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    <UserCircle className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">能力画像沉淀</h3>
                  <p className="text-sm text-slate-600 mb-5 leading-relaxed">所有行为沉淀六维画像，持续推荐机会</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 -mx-6 px-6">
                    <span className="text-xs font-medium text-slate-500">点击进入</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">查看画像 <ArrowRight className="h-4 w-4" /></span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 企业 6 大模块 ========== */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="gradient" size="lg" className="mb-3">企业工作台</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">6 大模块 · 点击直达真实业务后台</h2>
            <p className="text-slate-600">直播招聘/雇主品牌/数据热力/薪酬报告/招聘会/看板 <span className="font-medium text-indigo-600">全链路运营</span></p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* 直播招聘 */}
            <Link href="/employer/live" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <Radio className="h-6 w-6" />
                    </div>
                    <Badge variant="destructive" size="sm">热门</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">直播招聘后台</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">推流管理、弹幕审核、岗位挂载、连麦邀约</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">进入后台 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>

            {/* 雇主品牌 */}
            <Link href="/employer/brand" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">雇主品牌主页</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">VR导览、团队Vlog、文化价值观标签维护</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">维护主页 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>

            {/* 谁看过我 */}
            <Link href="/employer/views" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <Eye className="h-6 w-6" />
                    </div>
                    <Badge variant="info" size="sm">NEW</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">谁看过我</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">HR活跃度、岗位点击热区、简历打开率</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">看数据 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>

            {/* 薪酬报告 */}
            <Link href="/employer/salary" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">薪酬分位报告</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">第三方薪资库 · P25/P50/P75 城市对比</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">查报告 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>

            {/* 招聘会管理 */}
            <Link href="/employer/fairs" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">招聘会管理</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">展位搭建、简历归集、AI初筛、扫码签到</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">去管理 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>

            {/* 企业数据看板 */}
            <Link href="/employer/dashboard" className="group">
              <Card hover className="h-full group-hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-md group-hover:scale-110 transition-transform">
                      <LineChart className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">企业数据看板</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">招聘全链路数据分析漏斗和状态流转</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">进入控制台 <ChevronRight className="h-4 w-4" /></span>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/employer/dashboard">
              <Button size="lg" variant="gradient" rightIcon={<BarChart3 className="h-4 w-4" />}>
                进入企业控制台
              </Button>
            </Link>
            <Link href="/employer/views">
              <Button size="lg" variant="outline" rightIcon={<Eye className="h-4 w-4" />}>
                查看「谁看过我」热力
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 热门职位 ========== */}
      <section id="jobs" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <Badge variant="success" size="lg" className="mb-3">热门职位</Badge>
              <h2 className="text-3xl font-bold text-slate-900">今日精选好工作</h2>
              <p className="mt-2 text-slate-600">基于能力画像智能推荐，<Link href="/jobs" className="text-blue-600 font-medium hover:underline underline-offset-2">全部职位 →</Link></p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/jobs"><Button variant="outline">全部职位</Button></Link>
              <Link href="/resume/ai"><Button variant="gradient" rightIcon={<Upload className="h-4 w-4" />}>上传简历</Button></Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs?job=${job.id}`}>
                <Card hover className="group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img src={job.logo} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 shadow-sm" alt={job.company} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>
                          </div>
                          <span className="text-xl font-bold text-red-500 whitespace-nowrap">{job.salary}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {job.tags.map((t) => <Badge key={t} variant="outline" size="sm">{t}</Badge>)}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 -mx-6 px-6">
                          <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />AI匹配度 92%</span>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">一键投递 <ArrowRight className="h-4 w-4" /></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 直播招聘 ========== */}
      <section id="live" className="py-20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <Badge variant="destructive" size="lg" className="mb-3 bg-red-500/20 text-red-300 border-red-500/30" dot>正在直播</Badge>
              <h2 className="text-3xl font-bold">直播带岗 · 边看边投</h2>
              <p className="mt-2 text-slate-300">弹幕互动/岗位挂载/连麦邀约 <Link href="/live" className="text-blue-400 underline underline-offset-2 ml-1">全部直播 →</Link></p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/live"><Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">直播大厅</Button></Link>
              <Link href="/employer/live"><Button variant="gradient">企业开启直播</Button></Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { id: "1", title: "小米技术岗专场直播", host: "Lisa", avatar: "L", viewers: 3256, jobCount: 12, cover: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=250&fit=crop", isLive: true },
              { id: "2", title: "华为2026校招宣讲会", host: "HR团队", avatar: "H", viewers: 8921, jobCount: 38, cover: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=250&fit=crop", isLive: true },
              { id: "3", title: "网易游戏岗位专场", host: "网易招聘", avatar: "N", viewers: 1542, jobCount: 7, cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=250&fit=crop", isLive: false },
            ].map((s) => (
              <Link key={s.id} href={`/live?room=${s.id}`} className="group relative rounded-2xl overflow-hidden">
                <div className="aspect-[16/10] relative">
                  <img src={s.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={s.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {s.isLive ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />直播中</div>
                  ) : (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-700/90 text-white text-xs font-medium">预告</div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs"><Users className="h-3.5 w-3.5" />{s.viewers.toLocaleString()}</div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-xs"><Briefcase className="h-3.5 w-3.5" />{s.jobCount}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-1">{s.title}</h3>
                    <div className="flex items-center gap-2"><Avatar size="xs" fallback={s.avatar} /><span className="text-sm text-slate-200">{s.host}</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 pt-8 border-t border-white/10">
            <Link href="/employer/live" className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Shield className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div className="flex-1"><p className="text-white font-semibold">弹幕审核</p><p className="text-xs text-slate-400">关键词过滤+人工审核</p></div>
              <span className="text-xs font-medium text-blue-400 whitespace-nowrap">去配置 →</span>
            </Link>
            <Link href="/employer/live" className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Briefcase className="h-6 w-6 text-emerald-400 flex-shrink-0" />
              <div className="flex-1"><p className="text-white font-semibold">岗位挂载</p><p className="text-xs text-slate-400">直播中挂载岗位一键投递</p></div>
              <span className="text-xs font-medium text-blue-400 whitespace-nowrap">立即挂载 →</span>
            </Link>
            <Link href="/live" className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <Film className="h-6 w-6 text-rose-400 flex-shrink-0" />
              <div className="flex-1"><p className="text-white font-semibold">连麦邀约</p><p className="text-xs text-slate-400">一键邀请求职者上麦面试</p></div>
              <span className="text-xs font-medium text-blue-400 whitespace-nowrap">去体验 →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 招聘会 ========== */}
      <section id="fairs" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="warning" size="lg" className="mb-4">招聘会数字化</Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">招聘会管理子系统</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                线上线下融合的招聘会解决方案，每一步均可在 <Link href="/employer/fairs" className="text-blue-600 font-semibold underline underline-offset-2 mx-1">招聘会后台</Link> 中操作和复盘数据
              </p>

              <div className="space-y-3 mb-8">
                <Link href="/employer/fairs" className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors"><LayoutGrid className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="font-semibold text-slate-900">线上展位搭建</p><p className="text-sm text-slate-600 mt-0.5">拖拽展位装修、主题色、岗位列表</p></div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
                <Link href="/employer/fairs" className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors"><FileSearch className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="font-semibold text-slate-900">简历归集 + AI初筛</p><p className="text-sm text-slate-600 mt-0.5">JD关键词/年限/证书多维评分排序</p></div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
                <Link href="/employer/fairs" className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors"><ListFilter className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="font-semibold text-slate-900">JD关键词匹配权重</p><p className="text-sm text-slate-600 mt-0.5">调整五维评分权重，自动生成报告</p></div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
                <Link href="/employer/fairs" className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 group-hover:bg-blue-100 transition-colors"><QrCode className="h-5 w-5" /></div>
                  <div className="flex-1"><p className="font-semibold text-slate-900">扫码签到联动</p><p className="text-sm text-slate-600 mt-0.5">签到数据实时同步，沉淀能力画像</p></div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/employer/fairs"><Button size="lg" variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>进入招聘会后台</Button></Link>
                <Link href="/employer/salary"><Button size="lg" variant="outline" rightIcon={<DollarSign className="h-4 w-4" />}>查看薪酬报告</Button></Link>
              </div>
            </div>

            <div className="relative">
              <img src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=650&h=480&fit=crop" className="rounded-2xl shadow-2xl shadow-indigo-200/30 w-full" alt="招聘会" />
              <div className="grid grid-cols-2 gap-4 mt-5">
                <Link href="/employer/views" className="rounded-xl bg-white p-4 shadow-lg border hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-3 mb-2"><Eye className="h-5 w-5 text-purple-500" /><p className="text-sm font-semibold text-slate-900">谁看过我</p></div>
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">热力看板</p>
                  <p className="text-xs text-slate-500 mt-1">HR活跃度/岗位热区</p>
                  <p className="text-xs font-medium text-purple-600 mt-2">查看数据 →</p>
                </Link>
                <Link href="/employer/salary" className="rounded-xl bg-white p-4 shadow-lg border hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-3 mb-2"><DollarSign className="h-5 w-5 text-emerald-500" /><p className="text-sm font-semibold text-slate-900">薪酬报告</p></div>
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">P25/P50/P75</p>
                  <p className="text-xs text-slate-500 mt-1">分位值城市对比</p>
                  <p className="text-xs font-medium text-emerald-600 mt-2">查看报告 →</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl" />
            <div className="relative z-10 grid gap-10 md:grid-cols-5 items-center">
              <div className="md:col-span-3">
                <Badge variant="outline" size="lg" className="mb-4 bg-white/10 text-white/90 border-white/20">立即开始</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">加入智聘 OS，让招聘求职更智能</h2>
                <p className="text-indigo-100 text-lg leading-relaxed">求职者：上传简历到拿 Offer，AI 全程陪伴。企业：直播、品牌、数据、薪酬、招聘会一站式搞定。</p>
              </div>
              <div className="md:col-span-2 space-y-3">
                <Link href="/dashboard" className="flex w-full">
                  <Button size="lg" className="w-full justify-center bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl text-lg py-6" rightIcon={<ArrowRight className="h-5 w-5" />}>求职者工作台</Button>
                </Link>
                <Link href="/employer/dashboard" className="flex w-full">
                  <Button size="lg" className="w-full justify-center bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur text-lg py-6" rightIcon={<ArrowRight className="h-5 w-5" />}>企业管理后台</Button>
                </Link>
                <div className="flex gap-3 pt-2">
                  <Link href="/resume/ai" className="flex-1 text-center"><span className="text-indigo-200 text-sm hover:text-white underline underline-offset-2">AI简历解析 →</span></Link>
                  <Link href="/profile" className="flex-1 text-center"><span className="text-indigo-200 text-sm hover:text-white underline underline-offset-2">能力画像 →</span></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
