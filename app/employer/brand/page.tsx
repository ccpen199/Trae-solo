"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  Star,
  Play,
  Video,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Move,
  ZoomIn,
  ZoomOut,
  Tag,
  Award,
  Clock,
  BookOpen,
  Coffee,
  Dumbbell,
  Gamepad2,
  Music,
  Plane,
  GraduationCap,
  Sparkles,
  Edit3,
  Plus,
  Eye,
  MessageSquare,
  ThumbsUp,
  Camera,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const companyInfo = {
  name: "字节跳动",
  logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=120&h=120&fit=crop",
  banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=400&fit=crop",
  industry: "互联网/科技",
  size: "10000人以上",
  founded: "2012年",
  location: "北京 · 上海 · 深圳 · 杭州",
  website: "www.bytedance.com",
  intro:
    "字节跳动是一家全球化的科技公司，致力于通过技术创新连接全球用户。公司旗下产品包括抖音、今日头条、TikTok等，覆盖全球超过150个国家和地区。我们相信，优秀的人才是公司最宝贵的财富。",
  tags: [
    "扁平化管理",
    "弹性工作",
    "六险一金",
    "免费三餐",
    "年终奖金",
    "定期体检",
    "健身房",
    "下午茶",
  ],
  stats: {
    employees: 120000,
    offices: 30,
    jobs: 128,
    avgRating: 4.8,
    reviews: 2560,
  },
};

const vrScenes = [
  {
    id: "1",
    name: "办公大厅",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
    description: "宽敞明亮的办公区域，开放式工位设计",
  },
  {
    id: "2",
    name: "休闲区",
    image: "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800&h=500&fit=crop",
    description: "舒适的休息区，提供咖啡和零食",
  },
  {
    id: "3",
    name: "健身房",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop",
    description: "专业健身器材，免费向员工开放",
  },
  {
    id: "4",
    name: "会议室",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop",
    description: "现代化会议室，配备先进音视频设备",
  },
  {
    id: "5",
    name: "餐厅",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop",
    description: "免费三餐，丰富多样的菜品选择",
  },
];

const teamVlogs = [
  {
    id: "1",
    title: "字节工程师的一天",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=250&fit=crop",
    duration: "08:25",
    views: "12.5K",
    likes: "892",
    author: "技术团队",
  },
  {
    id: "2",
    title: "产品经理的工作日常",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
    duration: "06:42",
    views: "9.8K",
    likes: "654",
    author: "产品团队",
  },
  {
    id: "3",
    title: "设计部的创意空间",
    thumbnail: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop",
    duration: "10:15",
    views: "15.2K",
    likes: "1.2K",
    author: "设计团队",
  },
  {
    id: "4",
    title: "新员工入职vlog",
    thumbnail: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=250&fit=crop",
    duration: "07:30",
    views: "8.6K",
    likes: "521",
    author: "HR团队",
  },
  {
    id: "5",
    title: "团建活动特辑",
    thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop",
    duration: "12:00",
    views: "20.1K",
    likes: "2.3K",
    author: "行政团队",
  },
  {
    id: "6",
    title: "算法工程师的日常",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop",
    duration: "09:45",
    views: "11.3K",
    likes: "789",
    author: "算法团队",
  },
];

const cultureValues = [
  {
    title: "始终创业",
    description: "保持创业心态，拥抱变化，持续创新",
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "坦诚清晰",
    description: "开放坦诚地沟通，直接表达观点",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "多元兼容",
    description: "尊重多样性，包容不同背景和观点",
    icon: <Users className="h-6 w-6" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "追求极致",
    description: "对品质有极致追求，不断超越自我",
    icon: <Award className="h-6 w-6" />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "求真务实",
    description: "实事求是，用数据和事实说话",
    icon: <BookOpen className="h-6 w-6" />,
    color: "from-indigo-500 to-violet-500",
  },
  {
    title: "敢于担当",
    description: "主动承担责任，不推诿不逃避",
    icon: <Dumbbell className="h-6 w-6" />,
    color: "from-rose-500 to-red-500",
  },
];

const benefits = [
  { icon: <Coffee className="h-5 w-5" />, name: "免费三餐", desc: "早中晚餐 + 下午茶" },
  { icon: <Dumbbell className="h-5 w-5" />, name: "健身房", desc: "专业健身设施" },
  { icon: <Gamepad2 className="h-5 w-5" />, name: "游戏区", desc: "休息放松" },
  { icon: <Music className="h-5 w-5" />, name: "音乐室", desc: "琴房乐器" },
  { icon: <Plane className="h-5 w-5" />, name: "带薪年假", desc: "15-20天" },
  { icon: <GraduationCap className="h-5 w-5" />, name: "学习补贴", desc: "年度培训基金" },
];

const teamMembers = [
  { name: "张一鸣", role: "CEO & 创始人", avatar: null },
  { name: "梁汝波", role: "CEO", avatar: null },
  { name: "周受资", role: "CFO", avatar: null },
];

const hotJobs = [
  { id: "1", title: "高级前端工程师", salary: "25-50K", location: "北京", exp: "3-5年" },
  { id: "2", title: "资深产品经理", salary: "30-50K", location: "上海", exp: "5-10年" },
  { id: "3", title: "AI算法工程师", salary: "30-60K", location: "北京", exp: "3-5年" },
  { id: "4", title: "UI设计师", salary: "18-35K", location: "杭州", exp: "1-3年" },
];

export default function EmployerBrandPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "vr" | "vlog" | "culture" | "jobs">("overview");
  const [currentVrScene, setCurrentVrScene] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [vrRotation, setVrRotation] = useState(0);
  const [vrZoom, setVrZoom] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={companyInfo.banner}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white p-2 shadow-xl">
                <img
                  src={companyInfo.logo}
                  alt={companyInfo.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  {companyInfo.name}
                  <Badge
                    variant="success"
                    className="bg-emerald-500/20 border-emerald-400 text-emerald-200"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    认证企业
                  </Badge>
                </h1>
                <div className="flex items-center gap-3 mt-1 text-white/70 text-sm">
                  <span>{companyInfo.industry}</span>
                  <span>·</span>
                  <span>{companyInfo.size}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    {companyInfo.stats.avgRating}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Heart className="h-4 w-4 mr-2" />
                关注
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {[
              { key: "overview", label: "公司概况" },
              { key: "vr", label: "VR全景", badge: "NEW" },
              { key: "vlog", label: "团队Vlog" },
              { key: "culture", label: "企业文化" },
              { key: "jobs", label: "在招职位" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors relative",
                  activeTab === tab.key
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                )}
              >
                {tab.label}
                {tab.badge && (
                  <Badge variant="info" size="sm" className="ml-2">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公司介绍</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{companyInfo.intro}</p>

                  <div className="flex flex-wrap gap-2 mt-5">
                    {companyInfo.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="px-3 py-1 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>VR逛公司</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("vr")}
                  >
                    查看全部 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer"
                       onClick={() => setIsViewerOpen(true)}>
                    <img
                      src={vrScenes[0].image}
                      alt=""
                      className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <Maximize2 className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{vrScenes[0].name}</p>
                        <p className="text-white/70 text-sm">{vrScenes[0].description}</p>
                      </div>
                      <Badge variant="info" className="bg-blue-500/80">
                        {vrScenes.length} 个场景
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>企业文化</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("culture")}
                  >
                    了解更多 <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cultureValues.slice(0, 6).map((value) => (
                      <div
                        key={value.title}
                        className="p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
                        >
                          {value.icon}
                        </div>
                        <h4 className="font-semibold text-slate-900">{value.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {value.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公司信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500">公司规模</p>
                      <p className="font-medium text-slate-900">{companyInfo.size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500">公司地址</p>
                      <p className="font-medium text-slate-900">{companyInfo.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500">成立时间</p>
                      <p className="font-medium text-slate-900">{companyInfo.founded}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500">在招职位</p>
                      <p className="font-medium text-blue-600">{companyInfo.stats.jobs} 个</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>员工福利</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {benefits.map((benefit) => (
                      <div key={benefit.name} className="p-3 rounded-lg bg-slate-50">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                          {benefit.icon}
                        </div>
                        <p className="text-sm font-medium text-slate-900">{benefit.name}</p>
                        <p className="text-xs text-slate-500">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>管理团队</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <Avatar size="md" fallback={member.name[0]} />
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "vr" && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900">
              <div
                className="aspect-[21/9] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                style={{ transform: `scale(${vrZoom})`, transition: "transform 0.2s" }}
              >
                <img
                  src={vrScenes[currentVrScene].image}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ transform: `rotateY(${vrRotation}deg)` }}
                />
              </div>

              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                <button
                  onClick={() =>
                    setCurrentVrScene((prev) =>
                      prev === 0 ? vrScenes.length - 1 : prev - 1
                    )
                  }
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentVrScene((prev) =>
                      prev === vrScenes.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur rounded-full px-4 py-2">
                <button
                  onClick={() => setVrZoom(Math.max(0.5, vrZoom - 0.1))}
                  className="p-1.5 text-white/80 hover:text-white"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-white text-xs w-12 text-center">
                  {Math.round(vrZoom * 100)}%
                </span>
                <button
                  onClick={() => setVrZoom(Math.min(2, vrZoom + 0.1))}
                  className="p-1.5 text-white/80 hover:text-white"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <div className="w-px h-4 bg-white/30" />
                <button
                  onClick={() => {
                    setVrRotation(0);
                    setVrZoom(1);
                  }}
                  className="p-1.5 text-white/80 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsViewerOpen(true)}
                  className="p-1.5 text-white/80 hover:text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur rounded-lg px-3 py-2">
                <h3 className="text-white font-medium">{vrScenes[currentVrScene].name}</h3>
                <p className="text-white/70 text-xs">{vrScenes[currentVrScene].description}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">全部场景</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {vrScenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    onClick={() => setCurrentVrScene(index)}
                    className={cn(
                      "rounded-xl overflow-hidden cursor-pointer transition-all",
                      currentVrScene === index
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:shadow-lg"
                    )}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={scene.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {currentVrScene === index && (
                        <div className="absolute inset-0 bg-blue-500/20" />
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-sm font-medium text-slate-900">{scene.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "vlog" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-slate-900">团队Vlog</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  最新
                </Button>
                <Button variant="ghost" size="sm">
                  热门
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teamVlogs.map((vlog) => (
                <Card key={vlog.id} hover className="overflow-hidden">
                  <div className="relative aspect-video group cursor-pointer">
                    <img
                      src={vlog.thumbnail}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Play className="h-6 w-6 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                      {vlog.duration}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-slate-900 line-clamp-2 mb-2">
                      {vlog.title}
                    </h4>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {vlog.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {vlog.likes}
                      </span>
                      <span>{vlog.author}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "culture" && (
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-500" />
                文化价值观
              </h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cultureValues.map((value) => (
                  <Card key={value.title} hover>
                    <CardContent className="p-6">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-4`}
                      >
                        {value.icon}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">
                        {value.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                员工福利
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                {benefits.map((benefit) => (
                  <Card key={benefit.name} hover className="text-center">
                    <CardContent className="p-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white mx-auto mb-3">
                        {benefit.icon}
                      </div>
                      <h5 className="font-semibold text-slate-900 mb-1">
                        {benefit.name}
                      </h5>
                      <p className="text-xs text-slate-500">{benefit.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                工作环境
              </h3>
              <div className="grid gap-4 md:grid-cols-4">
                {vrScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="relative rounded-xl overflow-hidden group cursor-pointer"
                    onClick={() => {
                      setActiveTab("vr");
                      setCurrentVrScene(vrScenes.findIndex((s) => s.id === scene.id));
                    }}
                  >
                    <img
                      src={scene.image}
                      alt=""
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-medium text-sm">{scene.name}</p>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-slate-900">
                在招职位 ({companyInfo.stats.jobs})
              </h3>
              <div className="flex gap-2">
                <select className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
                  <option>全部城市</option>
                  <option>北京</option>
                  <option>上海</option>
                  <option>深圳</option>
                  <option>杭州</option>
                </select>
                <select className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
                  <option>全部类别</option>
                  <option>技术</option>
                  <option>产品</option>
                  <option>设计</option>
                  <option>运营</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {hotJobs.map((job) => (
                <Card key={job.id} hover className="cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 text-lg mb-1">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="text-red-500 font-semibold">{job.salary}</span>
                          <span>·</span>
                          <span>{job.location}</span>
                          <span>·</span>
                          <span>{job.exp}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="secondary">技术</Badge>
                          <Badge variant="secondary">正式</Badge>
                          <Badge variant="success">急招</Badge>
                        </div>
                      </div>
                      <Button variant="gradient" size="sm">
                        立即投递
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {isViewerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setIsViewerOpen(false)}
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20"
          >
            ✕
          </button>

          <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-6">
            <img
              src={vrScenes[currentVrScene].image}
              alt=""
              className="w-full h-full object-contain"
            />

            <button
              onClick={() =>
                setCurrentVrScene((prev) =>
                  prev === 0 ? vrScenes.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() =>
                setCurrentVrScene((prev) =>
                  prev === vrScenes.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur rounded-full px-5 py-2.5">
              {vrScenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => setCurrentVrScene(index)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm text-white transition-colors",
                    currentVrScene === index
                      ? "bg-white/30"
                      : "hover:bg-white/10"
                  )}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
