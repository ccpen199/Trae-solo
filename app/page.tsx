import Link from "next/link";
import {
  Sparkles,
  Video,
  Radio,
  Bot,
  LineChart,
  Building2,
  Target,
  CalendarDays,
  ArrowRight,
  Check,
  Star,
  Users,
  Briefcase,
  TrendingUp,
  MapPin,
  Award,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export default function HomePage() {
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "AI简历解析",
      description: "一键上传简历，智能提取教育背景、工作经历、技能证书，自动补全所有字段",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: <Video className="h-6 w-6" />,
      title: "视频面试",
      description: "支持预约制与即开式视频面试，云端录制回放，AI辅助分析候选人表现",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: <Radio className="h-6 w-6" />,
      title: "直播招聘",
      description: "企业直播带岗，弹幕互动，岗位挂载，连麦面试，招聘效率提升300%",
      color: "from-red-500 to-orange-500",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "雇主品牌",
      description: "VR办公环境导览、团队Vlog、文化价值观标签，全方位展示企业魅力",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "数据热力看板",
      description: "实时追踪HR活跃度、岗位点击热区、简历打开率，数据驱动招聘决策",
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "薪酬分位报告",
      description: "对接第三方薪资数据库，生成P25/P50/P75分位值报告，科学定薪",
      color: "from-indigo-500 to-violet-500",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ];

  const stats = [
    { value: "500万+", label: "注册用户" },
    { value: "10万+", label: "合作企业" },
    { value: "500万+", label: "成功匹配" },
    { value: "98.5%", label: "用户满意度" },
  ];

  const featuredJobs = [
    {
      id: "1",
      title: "高级前端工程师",
      company: "字节跳动",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
      location: "北京",
      salary: "25-50K",
      tags: ["React", "TypeScript", "3-5年"],
      urgent: true,
    },
    {
      id: "2",
      title: "产品经理",
      company: "阿里巴巴",
      logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=80&h=80&fit=crop",
      location: "杭州",
      salary: "20-35K",
      tags: ["B端产品", "SaaS", "5-10年"],
      urgent: false,
    },
    {
      id: "3",
      title: "AI算法工程师",
      company: "腾讯",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
      location: "深圳",
      salary: "30-60K",
      tags: ["机器学习", "NLP", "博士"],
      urgent: true,
    },
    {
      id: "4",
      title: "资深Java开发",
      company: "美团",
      logo: "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=80&h=80&fit=crop",
      location: "上海",
      salary: "22-45K",
      tags: ["Java", "微服务", "高并发"],
      urgent: false,
    },
  ];

  const liveStreams = [
    {
      id: "1",
      title: "春招季 | 小米技术岗专场",
      host: "小米招聘官",
      avatar: null,
      viewers: 3256,
      cover: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=250&fit=crop",
      isLive: true,
    },
    {
      id: "2",
      title: "华为2026校招宣讲会",
      host: "华为HR团队",
      avatar: null,
      viewers: 8921,
      cover: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=250&fit=crop",
      isLive: true,
    },
    {
      id: "3",
      title: "网易游戏岗位专场",
      host: "网易游戏招聘",
      avatar: null,
      viewers: 1542,
      cover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=250&fit=crop",
      isLive: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              智聘OS
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">产品功能</Link>
            <Link href="#jobs" className="text-sm font-medium text-slate-600 hover:text-slate-900">热门职位</Link>
            <Link href="#live" className="text-sm font-medium text-slate-600 hover:text-slate-900">直播招聘</Link>
            <Link href="#fairs" className="text-sm font-medium text-slate-600 hover:text-slate-900">招聘会</Link>
            <Link href="/enterprise" className="text-sm font-medium text-slate-600 hover:text-slate-900">企业服务</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="gradient" size="sm">立即注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-1.5 border border-blue-100 shadow-sm">
                <Badge variant="gradient" size="sm">NEW</Badge>
                <span className="text-sm text-slate-600">AI驱动的智能招聘操作系统</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                让招聘更智能
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  让求职更高效
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                融合直播招聘、视频面试与雇主品牌可视化的新一代智能招聘平台。
                AI简历解析、智能岗位匹配、薪酬分位报告，助力每一次职业选择。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register?role=jobseeker">
                  <Button size="lg" variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    立即开始求职
                  </Button>
                </Link>
                <Link href="/auth/register?role=employer">
                  <Button size="lg" variant="outline">
                    企业HR入驻
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-slate-900">4.9</span>
                  </div>
                  <p className="text-sm text-slate-500">500万+用户的共同选择</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 p-4 shadow-2xl shadow-indigo-200/50">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=500&fit=crop"
                  alt="智聘OS产品展示"
                  className="w-full rounded-xl"
                />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-xl bg-white/90 p-3 text-center">
                    <Bot className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-medium text-slate-700">AI解析</p>
                    <p className="text-[10px] text-slate-500">3秒识别</p>
                  </div>
                  <div className="rounded-xl bg-white/90 p-3 text-center">
                    <Video className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs font-medium text-slate-700">视频面试</p>
                    <p className="text-[10px] text-slate-500">云端录制</p>
                  </div>
                  <div className="rounded-xl bg-white/90 p-3 text-center">
                    <Radio className="h-6 w-6 mx-auto mb-1 text-red-500" />
                    <p className="text-xs font-medium text-slate-700">直播带岗</p>
                    <p className="text-[10px] text-slate-500">实时互动</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="info" size="lg" className="mb-4">核心功能</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              全链路智能招聘解决方案
            </h2>
            <p className="text-slate-600">
              从简历投递到最终入职，AI全程陪伴，让招聘和求职都更简单
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} hover className="group">
                <CardContent className="p-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgColor} ${feature.iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="jobs" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="success" size="lg" className="mb-3">热门职位</Badge>
              <h2 className="text-3xl font-bold text-slate-900">今日精选好工作</h2>
              <p className="mt-2 text-slate-600">基于你的能力画像，为你智能推荐</p>
            </div>
            <Link href="/jobs" className="hidden md:flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredJobs.map((job) => (
              <Card key={job.id} hover className="group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>
                        </div>
                        {job.urgent && (
                          <Badge variant="destructive" size="sm" dot>
                            急招
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-lg font-bold text-red-500">{job.salary}</span>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
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
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/jobs">
              <Button variant="outline" size="lg">
                查看全部职位
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="live" className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="destructive" size="lg" className="mb-3 bg-red-500/20 text-red-300 border-red-500/30" dot>
                直播中
              </Badge>
              <h2 className="text-3xl font-bold">直播带岗 边看边投</h2>
              <p className="mt-2 text-slate-300">知名企业在线宣讲，弹幕互动，一键投递心仪岗位</p>
            </div>
            <Link href="/live" className="hidden md:flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300">
              更多直播 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {liveStreams.map((stream) => (
              <div key={stream.id} className="group relative rounded-2xl overflow-hidden cursor-pointer">
                <div className="aspect-[16/10] relative">
                  <img
                    src={stream.cover}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {stream.isLive ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500 text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      直播中
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-slate-700/80 text-white text-xs font-medium">
                      预告
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-xs">
                    <Users className="h-3.5 w-3.5" />
                    {stream.viewers.toLocaleString()}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">{stream.title}</h3>
                    <div className="flex items-center gap-2">
                      <Avatar size="xs" fallback={stream.host} />
                      <span className="text-sm text-slate-200">{stream.host}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fairs" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <Badge variant="warning" size="lg" className="mb-4">招聘会</Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                数字化招聘会管理
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                线上线下融合的招聘会解决方案，支持线上展位搭建、简历自动归集、
                AI智能初筛与线下扫码签到联动，让招聘会管理更高效。
              </p>
              <div className="space-y-4">
                {[
                  { icon: <CalendarDays className="h-5 w-5" />, text: "线上展位自助搭建，一键装修企业展位" },
                  { icon: <Bot className="h-5 w-5" />, text: "AI初筛按JD关键词、经验、证书智能匹配" },
                  { icon: <Award className="h-5 w-5" />, text: "线下扫码签到，参会数据实时统计" },
                  { icon: <Briefcase className="h-5 w-5" />, text: "简历自动归集，统一筛选管理" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                      {item.icon}
                    </div>
                    <p className="text-slate-700 pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link href="/job-fairs" className="mt-8 inline-block">
                <Button variant="gradient" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  浏览招聘会
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=450&fit=crop"
                alt="招聘会"
                className="rounded-2xl shadow-2xl shadow-indigo-200/30"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">+127%</p>
                    <p className="text-xs text-slate-500">简历投递量</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="gradient" size="lg" className="mb-4">立即开始</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            开启你的智能招聘之旅
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            加入智聘OS，让AI帮你找到理想的工作或人才
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=jobseeker">
              <Button size="lg" variant="gradient" rightIcon={<ArrowRight className="h-4 w-4" />}>
                我要求职
              </Button>
            </Link>
            <Link href="/auth/register?role=employer">
              <Button size="lg" variant="outline">
                我要招聘
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  智聘OS
                </span>
              </Link>
              <p className="text-sm text-slate-600 mb-4 max-w-xs">
                融合直播、视频面试与雇主品牌可视化的新一代智能招聘操作系统。
              </p>
            </div>

            {[
              {
                title: "产品",
                links: ["职位搜索", "AI简历", "视频面试", "直播招聘", "招聘会"],
              },
              {
                title: "企业",
                links: ["企业版", "雇主品牌", "薪酬报告", "招聘系统", "价格方案"],
              },
              {
                title: "关于",
                links: ["关于我们", "加入我们", "新闻动态", "隐私政策", "联系我们"],
              },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} 智聘OS. 保留所有权利.
            </p>
            <div className="flex items-center gap-4">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">support@zhipinos.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
