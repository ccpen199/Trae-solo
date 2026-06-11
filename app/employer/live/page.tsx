"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Settings,
  Users,
  Eye,
  ThumbsUp,
  MessageSquare,
  Video,
  Play,
  Pause,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Check,
  Send,
  Briefcase,
  Pin,
  ChevronUp,
  ChevronDown,
  XCircle as XIcon,
  PhoneCall,
  UserPlus,
  Mic,
  Video as VideoIcon,
  Monitor,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/utils";

type LiveStatus = "live" | "scheduled" | "ended" | "draft";

interface LiveStream {
  id: string;
  title: string;
  coverImage: string;
  status: LiveStatus;
  viewers: number;
  likes: number;
  danmakuCount: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  jobs: number;
  host: string;
}

interface Danmaku {
  id: string;
  user: string;
  avatar?: string;
  content: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  isHost?: boolean;
}

const mockLiveStreams: LiveStream[] = [
  {
    id: "1",
    title: "春招季 | 字节跳动技术岗专场",
    coverImage: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=250&fit=crop",
    status: "live",
    viewers: 3256,
    likes: 12450,
    danmakuCount: 1580,
    startedAt: "2024-01-15T14:00:00",
    jobs: 8,
    host: "李招聘官",
  },
  {
    id: "2",
    title: "产品经理专场宣讲",
    coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
    status: "scheduled",
    viewers: 0,
    likes: 0,
    danmakuCount: 0,
    scheduledAt: "2024-01-18T19:00:00",
    jobs: 5,
    host: "张HR",
  },
  {
    id: "3",
    title: "校招空中宣讲会",
    coverImage: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=400&h=250&fit=crop",
    status: "ended",
    viewers: 12580,
    likes: 45600,
    danmakuCount: 8920,
    startedAt: "2024-01-10T19:00:00",
    endedAt: "2024-01-10T21:30:00",
    jobs: 12,
    host: "王经理",
  },
  {
    id: "4",
    title: "设计岗位招聘专场",
    coverImage: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=250&fit=crop",
    status: "draft",
    viewers: 0,
    likes: 0,
    danmakuCount: 0,
    jobs: 3,
    host: "未设置",
  },
];

const mockDanmakus: Danmaku[] = [
  { id: "1", user: "求职者小王", content: "请问这个岗位有转正机会吗？", time: "14:05:23", status: "approved" },
  { id: "2", user: "前端小李", content: "技术栈是什么？", time: "14:05:45", status: "approved" },
  { id: "3", user: "找工作的阿杰", content: "薪资范围是多少呀", time: "14:06:12", status: "approved" },
  { id: "4", user: "产品小白", content: "产品岗有内推吗？", time: "14:06:30", status: "approved" },
  { id: "5", user: "敏感词用户", content: "加微信xxx私聊...", time: "14:07:00", status: "pending" },
  { id: "6", user: "求职萌新", content: "请问学历要求高吗？", time: "14:07:15", status: "pending" },
  { id: "7", user: "算法工程师", content: "算法岗对学历要求严格吗", time: "14:07:30", status: "approved" },
  { id: "8", user: "广告哥", content: "加QQ群xxxx领资料", time: "14:08:00", status: "pending" },
  { id: "9", user: "Java开发", content: "有远程办公的岗位吗？", time: "14:08:20", status: "approved" },
];

const mountedJobs = [
  {
    id: "j1",
    title: "高级前端工程师",
    salary: "25-50K",
    location: "北京",
    applicants: 128,
    isPinned: true,
    clicks: 520,
  },
  {
    id: "j2",
    title: "后端开发工程师",
    salary: "22-45K",
    location: "北京/上海",
    applicants: 96,
    isPinned: false,
    clicks: 380,
  },
  {
    id: "j3",
    title: "AI算法工程师",
    salary: "30-60K",
    location: "北京",
    applicants: 75,
    isPinned: true,
    clicks: 420,
  },
  {
    id: "j4",
    title: "产品经理",
    salary: "20-35K",
    location: "杭州",
    applicants: 156,
    isPinned: false,
    clicks: 680,
  },
];

const connectRequests = [
  { id: "1", name: "张明", position: "高级前端工程师", score: 92, time: "2分钟前" },
  { id: "2", name: "李华", position: "Java工程师", score: 85, time: "5分钟前" },
  { id: "3", name: "王芳", position: "UI设计师", score: 78, time: "8分钟前" },
];

export default function EmployerLivePage() {
  const [activeTab, setActiveTab] = useState<"list" | "studio">("list");
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [studioTab, setStudioTab] = useState<"control" | "danmaku" | "jobs" | "connect">("danmaku");
  const [danmakuFilter, setDanmakuFilter] = useState<"all" | "pending" | "approved">("all");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJobMountModal, setShowJobMountModal] = useState(false);

  const filteredDanmakus = mockDanmakus.filter((d) => {
    if (danmakuFilter === "all") return true;
    return d.status === danmakuFilter;
  });

  const pendingCount = mockDanmakus.filter((d) => d.status === "pending").length;

  const liveCount = mockLiveStreams.filter((s) => s.status === "live").length;
  const scheduledCount = mockLiveStreams.filter((s) => s.status === "scheduled").length;

  const statusConfig: Record<LiveStatus, { label: string; variant: string; dot: string }> = {
    live: { label: "直播中", variant: "destructive", dot: "bg-red-500" },
    scheduled: { label: "待开播", variant: "warning", dot: "bg-amber-500" },
    ended: { label: "已结束", variant: "secondary", dot: "bg-slate-400" },
    draft: { label: "草稿", variant: "outline", dot: "bg-slate-300" },
  };

  if (activeTab === "studio" && activeStream) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab("list");
                setActiveStream(null);
              }}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-white font-medium">{activeStream.title}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <Badge
                  variant={isStreaming ? "destructive" : "secondary"}
                  size="sm"
                  className={isStreaming ? "bg-red-500" : ""}
                >
                  {isStreaming ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
                      直播中
                    </>
                  ) : (
                    "未开播"
                  )}
                </Badge>
                <span className="text-xs text-slate-400">
                  {activeStream.viewers.toLocaleString()} 观看
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isStreaming ? "destructive" : "success"}
              size="sm"
              onClick={() => setIsStreaming(!isStreaming)}
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-1.5" />
                  结束直播
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" />
                  开始直播
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-black flex flex-col">
            {isStreaming ? (
              <div className="flex-1 flex items-center justify-center relative">
                <img
                  src={activeStream.coverImage}
                  alt=""
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-6 text-white">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      <span>{activeStream.viewers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5" />
                      <span>{activeStream.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>{activeStream.danmakuCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Video className="h-10 w-10 text-slate-600" />
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">还没有开始直播</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    点击右上角「开始直播」按钮开始你的招聘直播
                  </p>
                  <Button variant="gradient" onClick={() => setIsStreaming(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    开始直播
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700 p-4">
              <div className="flex items-center justify-center gap-4">
                <button className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                  <Mic className="h-5 w-5" />
                </button>
                <button className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                  <VideoIcon className="h-5 w-5" />
                </button>
                <button className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                  <Monitor className="h-5 w-5" />
                </button>
                <div className="w-px h-8 bg-slate-600 mx-2" />
                <button className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIsStreaming(false)}
                  className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col">
            <div className="flex border-b border-slate-700">
              {[
                { key: "control", label: "控制台", icon: <Settings className="h-4 w-4" /> },
                {
                  key: "danmaku",
                  label: "弹幕审核",
                  icon: <MessageSquare className="h-4 w-4" />,
                  badge: pendingCount,
                },
                {
                  key: "jobs",
                  label: "岗位挂载",
                  icon: <Briefcase className="h-4 w-4" />,
                },
                {
                  key: "connect",
                  label: "连麦申请",
                  icon: <PhoneCall className="h-4 w-4" />,
                  badge: connectRequests.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStudioTab(tab.key as typeof studioTab)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2",
                    studioTab === tab.key
                      ? "text-blue-400 border-blue-400"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                  <div className="relative">
                    {tab.icon}
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  {tab.label}
                </button>
              ))}
            </div>

            {studioTab === "control" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-4 rounded-xl bg-slate-700/50">
                  <h3 className="text-white font-medium mb-3">直播信息</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">直播标题</span>
                      <span className="text-white">{activeStream.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">开播时长</span>
                      <span className="text-white">01:23:45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">累计观看</span>
                      <span className="text-white">{activeStream.viewers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">最高在线</span>
                      <span className="text-white">{(activeStream.viewers * 1.2).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/50">
                  <h3 className="text-white font-medium mb-3">推流信息</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">推流地址</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value="rtmp://push.example.com/live/abc123"
                          readOnly
                          className="flex-1 h-9 px-3 rounded-lg bg-slate-600 text-white text-xs"
                        />
                        <button className="p-2 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">推流密钥</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value="secret-key-12345"
                          readOnly
                          className="flex-1 h-9 px-3 rounded-lg bg-slate-600 text-white text-xs"
                        />
                        <button className="p-2 rounded-lg bg-slate-600 text-slate-300 hover:bg-slate-500">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-700/50">
                  <h3 className="text-white font-medium mb-3">弹幕设置</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">弹幕审核</span>
                      <button className="w-11 h-6 rounded-full bg-blue-500 relative">
                        <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">敏感词过滤</span>
                      <button className="w-11 h-6 rounded-full bg-blue-500 relative">
                        <span className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">显示弹幕</span>
                      <button className="w-11 h-6 rounded-full bg-slate-600 relative">
                        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {studioTab === "danmaku" && (
              <>
                <div className="flex gap-1 p-2 border-b border-slate-700">
                  {[
                    { key: "all", label: "全部", count: mockDanmakus.length },
                    { key: "pending", label: "待审核", count: pendingCount },
                    { key: "approved", label: "已通过", count: mockDanmakus.filter(d => d.status === "approved").length },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setDanmakuFilter(filter.key as typeof danmakuFilter)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                        danmakuFilter === filter.key
                          ? "bg-blue-500/20 text-blue-400"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
                  {filteredDanmakus.map((danmaku) => (
                    <div
                      key={danmaku.id}
                      className={cn(
                        "p-3 hover:bg-slate-700/30 transition-colors",
                        danmaku.status === "pending" && "bg-amber-500/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar size="sm" fallback={danmaku.user[0]} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">
                              {danmaku.user}
                            </span>
                            <span className="text-xs text-slate-500">{danmaku.time}</span>
                            {danmaku.status === "pending" && (
                              <Badge variant="warning" size="sm">
                                待审核
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-200 mt-1">{danmaku.content}</p>
                        </div>
                      </div>
                      {danmaku.status === "pending" && (
                        <div className="flex gap-2 mt-3 pl-9">
                          <Button size="sm" variant="success" className="flex-1 h-7 text-xs">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            通过
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs">
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {studioTab === "jobs" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white font-medium">
                      已挂载 ({mountedJobs.length})
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => setShowJobMountModal(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      添加岗位
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {mountedJobs.map((job, index) => (
                    <div key={job.id} className="p-3 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {job.isPinned && (
                              <Pin className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <h4 className="text-sm font-medium text-white">{job.title}</h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="text-red-400 font-medium">{job.salary}</span>
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>{job.clicks} 点击</span>
                            <span>{job.applicants} 投递</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white">
                            {index > 0 ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <span className="w-4 h-4" />
                            )}
                          </button>
                          <button className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white">
                            {index < mountedJobs.length - 1 ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <span className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          {job.isPinned ? "取消置顶" : "置顶"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          移除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {studioTab === "connect" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {connectRequests.map((req) => (
                  <div key={req.id} className="p-3 rounded-xl bg-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar size="md" fallback={req.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{req.name}</h4>
                          <Badge variant="success" size="sm">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {req.score}分
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{req.position}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">申请时间：{req.time}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="success" className="flex-1 h-8 text-xs">
                        <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                        接受连麦
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        拒绝
                      </Button>
                    </div>
                  </div>
                ))}

                {connectRequests.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <UserPlus className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">暂无连麦申请</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showJobMountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <Card className="w-full max-w-lg animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>添加挂载岗位</CardTitle>
                <button
                  onClick={() => setShowJobMountModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <XIcon className="h-5 w-5 text-slate-400" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input placeholder="搜索岗位..." leftIcon={<Search className="h-4 w-4" />} />
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <input type="checkbox" className="w-4 h-4" />
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">测试岗位 {i}</h4>
                        <p className="text-xs text-slate-500">
                          20-{20 + i}K · 北京 · 3-5年
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowJobMountModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="gradient"
                    fullWidth
                    onClick={() => setShowJobMountModal(false)}
                  >
                    确认挂载
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" />
              直播招聘管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {liveCount} 场直播中，{scheduledCount} 场待开播
            </p>
          </div>
          <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建直播
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "全部" },
            { value: "live", label: "直播中", count: liveCount },
            { value: "scheduled", label: "待开播", count: scheduledCount },
            { value: "ended", label: "已结束" },
            { value: "draft", label: "草稿" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <Badge variant="secondary" size="sm" className="ml-2">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockLiveStreams.map((stream) => {
            const status = statusConfig[stream.status];
            return (
              <Card key={stream.id} hover className="overflow-hidden cursor-pointer group">
                <div
                  className="relative aspect-video overflow-hidden"
                  onClick={() => {
                    setActiveStream(stream);
                    setActiveTab("studio");
                    setStudioTab("control");
                  }}
                >
                  <img
                    src={stream.coverImage}
                    alt={stream.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <Badge
                    variant={status.variant as "default" | "destructive" | "secondary"}
                    className="absolute top-3 left-3"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot} ${stream.status === "live" ? "animate-pulse" : ""}`} />
                    {status.label}
                  </Badge>

                  {stream.status === "live" && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-xs">
                      <Users className="h-3 w-3" />
                      {stream.viewers.toLocaleString()}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-semibold text-white line-clamp-2">
                      {stream.title}
                    </h3>
                    <p className="text-sm text-white/70 mt-1">主播：{stream.host}</p>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {stream.jobs} 个岗位
                    </span>
                    {stream.status === "live" && (
                      <>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {stream.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {stream.danmakuCount.toLocaleString()}
                        </span>
                      </>
                    )}
                    {stream.status === "scheduled" && stream.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(stream.scheduledAt, "MM月DD日 HH:mm")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {stream.status === "draft" ? (
                      <>
                        <Button size="sm" variant="gradient" fullWidth className="h-8">
                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                          编辑配置
                        </Button>
                      </>
                    ) : stream.status === "scheduled" ? (
                      <>
                        <Button size="sm" variant="gradient" fullWidth className="h-8">
                          <Play className="h-3.5 w-3.5 mr-1.5" />
                          开始直播
                        </Button>
                      </>
                    ) : stream.status === "live" ? (
                      <>
                        <Button
                          size="sm"
                          variant="gradient"
                          fullWidth
                          className="h-8"
                          onClick={() => {
                            setActiveStream(stream);
                            setActiveTab("studio");
                          }}
                        >
                          <Settings className="h-3.5 w-3.5 mr-1.5" />
                          进入直播间
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" fullWidth className="h-8">
                          <Play className="h-3.5 w-3.5 mr-1.5" />
                          查看回放
                        </Button>
                      </>
                    )}
                    <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card className="w-full max-w-lg animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>创建直播</CardTitle>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <XIcon className="h-5 w-5 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    直播标题
                  </label>
                  <input
                    type="text"
                    placeholder="请输入直播标题"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    直播封面
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600">点击或拖拽上传封面图</p>
                    <p className="text-xs text-slate-400 mt-1">建议尺寸 800x500，不超过 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      预计开播时间
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      预计时长
                    </label>
                    <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>30分钟</option>
                      <option>60分钟</option>
                      <option>90分钟</option>
                      <option>120分钟</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    直播分类
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>技术研发</option>
                    <option>产品设计</option>
                    <option>运营市场</option>
                    <option>职能支持</option>
                    <option>校园招聘</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    直播简介
                  </label>
                  <textarea
                    rows={3}
                    placeholder="简要介绍一下本次直播的内容..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </Button>
                <Button
                  variant="gradient"
                  fullWidth
                  onClick={() => {
                    setShowCreateModal(false);
                  }}
                >
                  创建直播
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Upload(props: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
