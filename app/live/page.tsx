"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Radio,
  Users,
  Heart,
  Send,
  Play,
  CalendarDays,
  Clock,
  Briefcase,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  ThumbsUp,
  Share2,
  Bookmark,
  X,
  SendHorizonal,
  Phone,
  Video,
  MessageCircle,
  Settings,
  MoreHorizontal,
  MapPin,
  Building2,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface LiveStream {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  host: string;
  hostAvatar?: string;
  coverImage: string;
  viewers: number;
  likes: number;
  status: "live" | "scheduled" | "ended";
  scheduledAt?: string;
  category: string;
  tags: string[];
  description: string;
  jobs: LiveJob[];
}

interface LiveJob {
  id: string;
  title: string;
  salary: string;
  location: string;
  tags: string[];
  appliedCount: number;
}

interface Danmaku {
  id: string;
  user: string;
  content: string;
  color: string;
  time: string;
  isHost?: boolean;
}

const mockLiveStreams: LiveStream[] = [
  {
    id: "1",
    title: "春招季 | 字节跳动技术岗专场",
    company: "字节跳动",
    companyLogo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
    host: "李招聘官",
    hostAvatar: "",
    coverImage: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&h=500&fit=crop",
    viewers: 3256,
    likes: 12450,
    status: "live",
    category: "技术研发",
    tags: ["前端", "后端", "算法", "春招"],
    description: "字节跳动2026春季招聘技术专场，前端、后端、算法岗位热招中！",
    jobs: [
      {
        id: "j1",
        title: "高级前端工程师",
        salary: "25-50K",
        location: "北京",
        tags: ["React", "TypeScript"],
        appliedCount: 128,
      },
      {
        id: "j2",
        title: "后端开发工程师",
        salary: "22-45K",
        location: "北京/上海",
        tags: ["Java", "Go"],
        appliedCount: 96,
      },
      {
        id: "j3",
        title: "AI算法工程师",
        salary: "30-60K",
        location: "北京",
        tags: ["机器学习", "NLP"],
        appliedCount: 75,
      },
    ],
  },
  {
    id: "2",
    title: "华为2026校招宣讲会",
    company: "华为",
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
    host: "华为HR团队",
    coverImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop",
    viewers: 8921,
    likes: 28600,
    status: "live",
    category: "校园招聘",
    tags: ["校招", "技术", "产品", "设计"],
    description: "华为2026届校园招聘空中宣讲会，带你了解华为的文化与机会",
    jobs: [
      {
        id: "j4",
        title: "软件开发工程师",
        salary: "18-30K",
        location: "深圳/东莞",
        tags: ["校招", "Java"],
        appliedCount: 356,
      },
      {
        id: "j5",
        title: "产品经理",
        salary: "15-25K",
        location: "深圳",
        tags: ["校招", "产品"],
        appliedCount: 245,
      },
    ],
  },
  {
    id: "3",
    title: "网易游戏美术设计师专场",
    company: "网易游戏",
    companyLogo: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=80&h=80&fit=crop",
    host: "网易游戏招聘",
    coverImage: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=500&fit=crop",
    viewers: 1542,
    likes: 5600,
    status: "live",
    category: "设计创意",
    tags: ["游戏", "UI设计", "原画"],
    description: "热爱游戏的你，来网易一起打造现象级游戏！",
    jobs: [
      {
        id: "j6",
        title: "游戏UI设计师",
        salary: "15-30K",
        location: "杭州",
        tags: ["UI", "游戏"],
        appliedCount: 89,
      },
    ],
  },
  {
    id: "4",
    title: "腾讯云解决方案专场",
    company: "腾讯",
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
    host: "腾讯云招聘",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop",
    viewers: 0,
    likes: 0,
    status: "scheduled",
    scheduledAt: "2024-01-20T19:00:00",
    category: "云计算",
    tags: ["云计算", "解决方案", "架构"],
    description: "腾讯云解决方案团队招聘，一起探索云计算的无限可能",
    jobs: [],
  },
  {
    id: "5",
    title: "美团产品经理专场",
    company: "美团",
    companyLogo: "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=80&h=80&fit=crop",
    host: "美团产品团队",
    coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=500&fit=crop",
    viewers: 0,
    likes: 0,
    status: "scheduled",
    scheduledAt: "2024-01-22T14:00:00",
    category: "产品运营",
    tags: ["产品", "B端", "C端"],
    description: "美团产品经理岗位专场招聘，帮大家吃的更好、生活更好",
    jobs: [],
  },
];

const mockDanmakus: Danmaku[] = [
  { id: "1", user: "求职者小王", content: "请问这个岗位有转正机会吗？", color: "#ffffff", time: "00:05" },
  { id: "2", user: "李招聘官", content: "有的，表现优秀可以转正哦~", color: "#ffd700", time: "00:08", isHost: true },
  { id: "3", user: "前端小李", content: "React技术栈吗？", color: "#ffffff", time: "00:12" },
  { id: "4", user: "找工作的阿杰", content: "薪资范围是多少呀", color: "#ffffff", time: "00:15" },
  { id: "5", user: "产品萌新", content: "产品岗有内推吗？", color: "#ffffff", time: "00:20" },
  { id: "6", user: "李招聘官", content: "点击下方岗位卡片可以直接投递！", color: "#ffd700", time: "00:25", isHost: true },
  { id: "7", user: "码农小张", content: "算法岗对学历要求高吗", color: "#ffffff", time: "00:30" },
  { id: "8", user: "求职小白", content: "请问有远程的岗位吗", color: "#ffffff", time: "00:35" },
  { id: "9", user: "前端工程师", content: "主播好漂亮！", color: "#ff69b4", time: "00:40" },
  { id: "10", user: "Java开发", content: "有内推链接吗？", color: "#ffffff", time: "00:45" },
];

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<"all" | "live" | "scheduled">("all");
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStreams = mockLiveStreams.filter((stream) => {
    if (activeTab === "live") return stream.status === "live";
    if (activeTab === "scheduled") return stream.status === "scheduled";
    if (searchQuery) {
      return (
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const liveCount = mockLiveStreams.filter((s) => s.status === "live").length;
  const scheduledCount = mockLiveStreams.filter((s) => s.status === "scheduled").length;

  if (selectedStream && selectedStream.status === "live") {
    return (
      <LiveRoom stream={selectedStream} onLeave={() => setSelectedStream(null)} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="jobseeker" user={{ name: "张三", role: "JOB_SEEKER" }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Radio className="h-6 w-6 text-red-500" />
              直播招聘
            </h1>
            <p className="mt-1 text-slate-600">
              {liveCount} 场直播正在进行，{scheduledCount} 场即将开始
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索直播或公司..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex bg-white rounded-xl p-1 mb-6 border w-fit">
          {[
            { value: "all", label: "全部" },
            { value: "live", label: "正在直播", count: liveCount },
            { value: "scheduled", label: "即将开播", count: scheduledCount },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.value
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge
                  variant={activeTab === tab.value ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    activeTab === tab.value
                      ? "bg-white/20 text-white"
                      : "text-slate-500"
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStreams.length > 0 ? (
            filteredStreams.map((stream) => (
              <Card
                key={stream.id}
                hover
                className="overflow-hidden cursor-pointer group"
                onClick={() => setSelectedStream(stream)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={stream.coverImage}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {stream.status === "live" ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500 text-white text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      直播中
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 backdrop-blur text-white text-xs font-medium">
                      <CalendarDays className="h-3 w-3" />
                      即将开播
                    </div>
                  )}

                  {stream.status === "live" && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-xs">
                      <Users className="h-3 w-3" />
                      {stream.viewers.toLocaleString()}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white line-clamp-2 mb-2">
                      {stream.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <img
                        src={stream.companyLogo}
                        alt={stream.company}
                        className="w-6 h-6 rounded-md object-cover"
                      />
                      <span className="text-sm text-white/80">{stream.company}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {stream.category}
                      </Badge>
                      {stream.status === "scheduled" && stream.scheduledAt && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(stream.scheduledAt, "MM月DD日 HH:mm")}
                        </span>
                      )}
                    </div>
                    {stream.status === "live" && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Heart className="h-3.5 w-3.5" />
                        <span className="text-xs">{stream.likes.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {stream.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                    {stream.tags.length > 3 && (
                      <Badge variant="outline" size="sm">
                        +{stream.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {stream.jobs.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-slate-500 mb-2">
                        岗位 {stream.jobs.length} 个
                      </p>
                      <div className="space-y-1.5">
                        {stream.jobs.slice(0, 2).map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-slate-700 truncate flex-1">
                              {job.title}
                            </span>
                            <span className="text-red-500 font-medium flex-shrink-0 ml-2">
                              {job.salary}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant={stream.status === "live" ? "gradient" : "outline"}
                    size="sm"
                    fullWidth
                    className="mt-4"
                  >
                    {stream.status === "live" ? (
                      <>
                        <Play className="h-4 w-4 mr-1.5" />
                        立即观看
                      </>
                    ) : (
                      <>
                        <CalendarDays className="h-4 w-4 mr-1.5" />
                        预约提醒
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Radio className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                暂无相关直播
              </h3>
              <p className="text-slate-500">试试其他筛选条件或搜索关键词</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LiveRoom({
  stream,
  onLeave,
}: {
  stream: LiveStream;
  onLeave: () => void;
}) {
  const [danmakus, setDanmakus] = useState<Danmaku[]>(mockDanmakus);
  const [inputValue, setInputValue] = useState("");
  const [viewers, setViewers] = useState(stream.viewers);
  const [likes, setLikes] = useState(stream.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "jobs" | "info">("chat");
  const danmakuEndRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    danmakuEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [danmakus]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => v + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendDanmaku = () => {
    if (!inputValue.trim()) return;
    const newDanmaku: Danmaku = {
      id: Date.now().toString(),
      user: "我",
      content: inputValue,
      color: "#ffffff",
      time: "00:00",
    };
    setDanmakus([...danmakus, newDanmaku]);
    setInputValue("");
  };

  const handleLike = () => {
    setLikes(likes + 1);
    setIsLiked(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800/90 backdrop-blur border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-white font-medium">{stream.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1.5">
                <img
                  src={stream.companyLogo}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
                <span className="text-sm text-slate-400">{stream.company}</span>
              </div>
              <span className="text-sm text-red-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                直播中
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-400 text-sm">
            <Users className="h-4 w-4" />
            <span>{viewers.toLocaleString()}</span>
          </div>
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1 text-sm",
              isLiked ? "text-red-500" : "text-slate-400 hover:text-red-500"
            )}
          >
            <Heart className={cn("h-5 w-5", isLiked && "fill-red-500")} />
            <span>{likes.toLocaleString()}</span>
          </button>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-black">
          <img
            src={stream.coverImage}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge
              variant="destructive"
              className="bg-red-500/90 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
              LIVE
            </Badge>
            <Badge variant="secondary" className="bg-black/40 backdrop-blur-sm text-white">
              {viewers.toLocaleString()} 人观看
            </Badge>
          </div>

          <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
            <div className="flex flex-wrap gap-2 text-white text-sm">
              {danmakus.slice(-5).map((d) => (
                <span
                  key={d.id}
                  className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm"
                  style={{ color: d.color }}
                >
                  {d.isHost && <span className="text-amber-400 mr-1">[主播]</span>}
                  <span className="opacity-70 mr-1">{d.user}:</span>
                  {d.content}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar size="sm" fallback={stream.host} />
                <div>
                  <p className="text-white text-sm font-medium">{stream.host}</p>
                  <p className="text-white/60 text-xs">主播</p>
                </div>
                <Button size="sm" variant="outline" className="ml-2 h-7">
                  关注
                </Button>
              </div>
              <Button
                size="sm"
                variant="gradient"
                onClick={() => setIsInviteModalOpen(true)}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                连麦申请
              </Button>
            </div>
          </div>
        </div>

        <div className="w-80 bg-slate-800 flex flex-col border-l border-slate-700">
          <div className="flex border-b border-slate-700">
            {[
              { key: "chat", label: "弹幕", icon: <MessageCircle className="h-4 w-4" /> },
              { key: "jobs", label: "岗位", icon: <Briefcase className="h-4 w-4" /> },
              { key: "info", label: "详情", icon: <Sparkles className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActivePanel(tab.key as typeof activePanel)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2",
                  activePanel === tab.key
                    ? "text-blue-400 border-blue-400"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "jobs" && stream.jobs.length > 0 && (
                  <Badge variant="destructive" size="sm">
                    {stream.jobs.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {activePanel === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {danmakus.map((d) => (
                  <div key={d.id} className="text-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-[10px] text-white font-medium">
                        {d.user[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">
                          {d.isHost && (
                            <Badge variant="warning" size="sm" className="mr-1">
                              主播
                            </Badge>
                          )}
                          {d.user}
                        </p>
                        <p
                          className="text-slate-200 mt-0.5"
                          style={{ color: d.isHost ? "#ffd700" : undefined }}
                        >
                          {d.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={danmakuEndRef} />
              </div>

              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendDanmaku()}
                    placeholder="发送弹幕..."
                    className="flex-1 h-9 px-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendDanmaku}
                    className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <SendHorizonal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activePanel === "jobs" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {stream.jobs.length > 0 ? (
                stream.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{job.title}</h4>
                      <Badge variant="destructive" size="sm">
                        {job.salary}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span>{job.appliedCount} 人投递</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          size="sm"
                          className="text-slate-400 border-slate-600"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="gradient" fullWidth>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      一键投递
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Briefcase className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm">暂无岗位</p>
                </div>
              )}
            </div>
          )}

          {activePanel === "info" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">直播介绍</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {stream.description}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">直播标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {stream.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-2">公司信息</h3>
                  <div className="p-3 rounded-xl bg-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={stream.companyLogo}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium">{stream.company}</p>
                        <p className="text-xs text-slate-400">{stream.category}</p>
                      </div>
                    </div>
                    <Link href="#">
                      <Button variant="outline" size="sm" fullWidth className="mt-2">
                        <Building2 className="h-3.5 w-3.5 mr-1.5" />
                        查看雇主主页
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card className="w-full max-w-md animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>申请连麦</CardTitle>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 mb-4">
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">连麦说明</p>
                    <p className="text-sm text-blue-700 mt-1">
                      连麦后主播可以与你视频沟通，请提前准备好自我介绍和相关问题
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    求职岗位
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm">
                    <option>请选择意向岗位</option>
                    {stream.jobs.map((job) => (
                      <option key={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    简短介绍
                  </label>
                  <textarea
                    className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="简单介绍一下你的背景和优势..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  取消
                </Button>
                <Button
                  variant="gradient"
                  fullWidth
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    alert("已提交连麦申请，请等待主播回应~");
                  }}
                >
                  提交申请
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
