"use client";

import * as React from "react";
import { useState } from "react";
import {
  Video,
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  ChevronRight,
  Play,
  Clock3,
  CheckCircle2,
  XCircle,
  VideoIcon,
  AlertCircle,
  FileText,
  Download,
  Share2,
  Star,
  Plus,
  X,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

type InterviewStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

interface Interview {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  jobTitle: string;
  status: InterviewStatus;
  type: "video" | "phone" | "onsite";
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  interviewer: string;
  meetingLink?: string;
  recordingUrl?: string;
  location?: string;
  notes?: string;
  questions?: string[];
  score?: number;
  feedback?: string;
}

const mockInterviews: Interview[] = [
  {
    id: "1",
    title: "高级前端工程师 - 技术一面",
    company: "字节跳动",
    companyLogo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
    jobTitle: "高级前端工程师",
    status: "upcoming",
    type: "video",
    scheduledStart: "2024-01-18T14:00:00",
    scheduledEnd: "2024-01-18T15:00:00",
    duration: 60,
    interviewer: "李经理 · 技术负责人",
    meetingLink: "https://meeting.example.com/abc123",
    questions: [
      "请介绍一下你最有成就感的项目",
      "React Hooks 的原理是什么？",
      "如何优化大型列表的渲染性能？",
      "微前端架构有哪些优缺点？",
    ],
  },
  {
    id: "2",
    title: "高级前端工程师 - HR面",
    company: "字节跳动",
    companyLogo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
    jobTitle: "高级前端工程师",
    status: "completed",
    type: "video",
    scheduledStart: "2024-01-15T10:00:00",
    scheduledEnd: "2024-01-15T10:45:00",
    duration: 45,
    interviewer: "王女士 · HRBP",
    recordingUrl: "https://video.example.com/record/xyz789",
    score: 88,
    feedback:
      "沟通表达能力强，职业规划清晰，对岗位有较高的热情。建议进入下一轮。",
  },
  {
    id: "3",
    title: "产品经理 - 初面",
    company: "阿里巴巴",
    companyLogo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=80&h=80&fit=crop",
    jobTitle: "B端产品经理",
    status: "completed",
    type: "video",
    scheduledStart: "2024-01-12T14:30:00",
    scheduledEnd: "2024-01-12T15:30:00",
    duration: 60,
    interviewer: "张总监 · 产品总监",
    recordingUrl: "https://video.example.com/record/def456",
    score: 75,
    feedback:
      "产品思维较好，但B端经验稍显不足。综合评估待定。",
  },
  {
    id: "4",
    title: "AI算法工程师 - 终面",
    company: "腾讯",
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
    jobTitle: "AI算法工程师",
    status: "upcoming",
    type: "onsite",
    scheduledStart: "2024-01-20T09:30:00",
    scheduledEnd: "2024-01-20T11:30:00",
    duration: 120,
    interviewer: "陈博士 · AI研究院院长",
    location: "深圳市南山区科技园腾讯大厦",
  },
];

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [inInterviewRoom, setInInterviewRoom] = useState(false);

  const filteredInterviews = mockInterviews.filter((interview) => {
    if (activeTab === "all") return true;
    return interview.status === activeTab;
  });

  const statusConfig: Record<InterviewStatus, { label: string; variant: string; dot: string }> = {
    upcoming: { label: "待面试", variant: "warning", dot: "bg-amber-500" },
    in_progress: { label: "进行中", variant: "info", dot: "bg-blue-500" },
    completed: { label: "已完成", variant: "success", dot: "bg-emerald-500" },
    cancelled: { label: "已取消", variant: "secondary", dot: "bg-slate-400" },
  };

  const upcomingCount = mockInterviews.filter((i) => i.status === "upcoming").length;
  const completedCount = mockInterviews.filter((i) => i.status === "completed").length;

  if (inInterviewRoom && selectedInterview) {
    return (
      <InterviewRoom
        interview={selectedInterview}
        onLeave={() => {
          setInInterviewRoom(false);
          setSelectedInterview({ ...selectedInterview, status: "completed" });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="jobseeker" user={{ name: "张三", role: "JOB_SEEKER" }} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">视频面试</h1>
            <p className="mt-1 text-slate-600">
              你有 {upcomingCount} 场待面试，{completedCount} 场已完成
            </p>
          </div>
          <Button variant="gradient" onClick={() => setShowBookingModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            预约面试
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex bg-white rounded-xl p-1 mb-6 border">
              {[
                { value: "all", label: "全部面试", count: mockInterviews.length },
                { value: "upcoming", label: "待面试", count: upcomingCount },
                { value: "completed", label: "已完成", count: completedCount },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as typeof activeTab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {tab.label}
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
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredInterviews.length > 0 ? (
                filteredInterviews.map((interview) => {
                  const status = statusConfig[interview.status];
                  return (
                    <Card
                      key={interview.id}
                      hover
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedInterview?.id === interview.id &&
                          "ring-2 ring-blue-500"
                      )}
                      onClick={() => setSelectedInterview(interview)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <img
                            src={interview.companyLogo}
                            alt={interview.company}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  {interview.title}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                  {interview.company}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  status.variant as
                                    | "default"
                                    | "secondary"
                                    | "destructive"
                                    | "outline"
                                    | "success"
                                    | "warning"
                                    | "info"
                                }
                                size="sm"
                                dot
                              >
                                {status.label}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                {formatDate(interview.scheduledStart, "MM月DD日 HH:mm")}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {interview.duration} 分钟
                              </span>
                              <span className="flex items-center gap-1.5">
                                {interview.type === "video" ? (
                                  <Video className="h-4 w-4" />
                                ) : interview.type === "phone" ? (
                                  <PhoneOff className="h-4 w-4" />
                                ) : (
                                  <MapPin className="h-4 w-4" />
                                )}
                                {interview.type === "video"
                                  ? "视频面试"
                                  : interview.type === "phone"
                                  ? "电话面试"
                                  : "现场面试"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                              <span className="text-xs text-slate-500">
                                面试官：{interview.interviewer}
                              </span>
                              {interview.status === "upcoming" && (
                                <Button
                                  size="sm"
                                  variant="gradient"
                                  className="ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInterview(interview);
                                    setInInterviewRoom(true);
                                  }}
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  进入面试
                                </Button>
                              )}
                              {interview.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInterview(interview);
                                  }}
                                >
                                  查看详情
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Video className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="font-medium text-slate-900 mb-1">暂无面试安排</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      投递简历后，HR会邀请你进行视频面试
                    </p>
                    <Link href="/jobs">
                      <Button variant="outline" size="sm">
                        去投递职位
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedInterview ? (
              <div className="space-y-4">
                <Card className="sticky top-20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">面试详情</CardTitle>
                      {selectedInterview.status === "upcoming" && (
                        <Badge variant="warning" size="sm" dot>
                          待面试
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      <img
                        src={selectedInterview.companyLogo}
                        alt={selectedInterview.company}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {selectedInterview.company}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {selectedInterview.jobTitle}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-slate-900">
                            {formatDate(
                              selectedInterview.scheduledStart,
                              "YYYY年MM月DD日"
                            )}
                          </p>
                          <p className="text-slate-500">
                            {formatDate(
                              selectedInterview.scheduledStart,
                              "HH:mm"
                            )}{" "}
                            -{" "}
                            {formatDate(selectedInterview.scheduledEnd, "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">
                          时长 {selectedInterview.duration} 分钟
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <User2 className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-600">
                          {selectedInterview.interviewer}
                        </span>
                      </div>
                      {selectedInterview.location && (
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                          <span className="text-slate-600">
                            {selectedInterview.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedInterview.questions &&
                      selectedInterview.questions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            面试题目预览
                          </h4>
                          <div className="space-y-2">
                            {selectedInterview.questions.map((q, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 text-sm text-slate-600"
                              >
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                                  {i + 1}
                                </span>
                                <span>{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedInterview.status === "completed" && (
                      <>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="h-5 w-5 text-amber-500" />
                            <span className="font-medium text-slate-900">
                              面试评分
                            </span>
                          </div>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-slate-900">
                              {selectedInterview.score}
                            </span>
                            <span className="text-slate-500 mb-1">/ 100分</span>
                          </div>
                          <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${selectedInterview.score}%` }}
                            />
                          </div>
                        </div>

                        {selectedInterview.feedback && (
                          <div className="mb-6">
                            <h4 className="font-medium text-slate-900 mb-2">
                              面试官评价
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {selectedInterview.feedback}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedInterview.status === "upcoming" && (
                      <Button
                        variant="gradient"
                        size="lg"
                        fullWidth
                        onClick={() => setInInterviewRoom(true)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        进入面试房间
                      </Button>
                    )}

                    {selectedInterview.recordingUrl && (
                      <Button variant="outline" size="lg" fullWidth className="mt-3">
                        <Play className="h-4 w-4 mr-2" />
                        观看回放
                      </Button>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1.5" />
                        下载报告
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4 mr-1.5" />
                        分享
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="sticky top-20">
                <CardContent className="p-12 text-center">
                  <VideoIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-medium text-slate-900 mb-1">选择面试查看详情</h3>
                  <p className="text-sm text-slate-500">
                    点击左侧面试卡片查看完整信息
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">面试指南</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">面试前准备</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      提前测试摄像头和麦克风，确保网络稳定
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">面试技巧</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      保持眼神交流，回答问题简洁明了
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>预约面试</CardTitle>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                选择合适的时间段预约视频面试
              </p>
              <div className="space-y-3 mb-6">
                {[
                  { date: "2024-01-18", time: "10:00-10:30", available: true },
                  { date: "2024-01-18", time: "14:00-14:30", available: true },
                  { date: "2024-01-19", time: "09:30-10:00", available: false },
                  { date: "2024-01-19", time: "15:00-15:30", available: true },
                ].map((slot, i) => (
                  <button
                    key={i}
                    disabled={!slot.available}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                      slot.available
                        ? "hover:bg-blue-50 hover:border-blue-200 cursor-pointer"
                        : "opacity-50 cursor-not-allowed bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {slot.date}
                        </p>
                        <p className="text-xs text-slate-500">{slot.time}</p>
                      </div>
                    </div>
                    {slot.available ? (
                      <Badge variant="success" size="sm">
                        可预约
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        已约满
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="gradient"
                fullWidth
                onClick={() => setShowBookingModal(false)}
              >
                确认预约
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}

function User2(props: { className?: string }) {
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
      <path d="M14 2a3.8 4 0 0 1 4 4" />
      <path d="M21 6v-.5a2.5 2.5 0 0 0-5 0V6" />
      <path d="M21 13.5a17.3 17.3 0 0 1-1.5 6" />
      <path d="M20 16c1 0 2-1 2-2.5v-4c0-1 0-2.5-2-2.5h-3" />
      <path d="M13 14a16.3 16.3 0 0 0-1 6" />
      <path d="M9 20a4 4 0 0 1-4-4v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2a4 4 0 0 1-4 4Z" />
      <path d="M10.25 11.5a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0Z" />
      <path d="M5.8 3.8a4 4 0 0 0-3 4" />
      <path d="M3 10v-.5a2.5 2.5 0 0 1 5 0V10" />
      <path d="M3 17.5a17.3 17.3 0 0 0 1.5 6" />
      <path d="M4 20c-1 0-2-1-2-2.5v-4c0-1 0-2.5 2-2.5h3" />
    </svg>
  );
}

function InterviewRoom({
  interview,
  onLeave,
}: {
  interview: Interview;
  onLeave: () => void;
}) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState([
    { id: 1, sender: "面试官", content: "你好，欢迎参加今天的面试！", time: "14:00" },
    { id: 2, sender: "我", content: "您好，谢谢", time: "14:01" },
    { id: 3, sender: "面试官", content: "我们先做个简单的自我介绍吧", time: "14:01" },
  ]);
  const [chatInput, setChatInput] = useState("");

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        sender: "我",
        content: chatInput,
        time: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-white font-medium">面试中</span>
          </div>
          <div className="h-4 w-px bg-slate-600" />
          <div>
            <p className="text-white font-medium">{interview.title}</p>
            <p className="text-sm text-slate-400">{interview.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700/50">
          <Clock className="h-4 w-4 text-white" />
          <span className="text-white font-mono">{formatTime(elapsed)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="h-4 w-4" />
            结束
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative p-4">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800 relative">
            {isVideoOn ? (
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop"
                alt="面试官"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <VideoOff className="h-10 w-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400">对方已关闭摄像头</p>
                </div>
              </div>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge variant="destructive" className="bg-red-500/80 backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
                REC
              </Badge>
            </div>

            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
              {isVideoOn ? (
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=150&fit=crop"
                  alt="自己"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-slate-600" />
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur">
                <img
                  src={interview.companyLogo}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-white text-sm">{interview.interviewer}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/90 backdrop-blur border border-slate-700 shadow-xl">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isMicOn
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isVideoOn
                  ? "bg-slate-700 text-white hover:bg-slate-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isScreenSharing
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              )}
            >
              {isScreenSharing ? (
                <Monitor className="h-5 w-5" />
              ) : (
                <MonitorOff className="h-5 w-5" />
              )}
            </button>

            <div className="w-px h-8 bg-slate-600 mx-1" />

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={cn(
                "p-3 rounded-xl transition-colors",
                isChatOpen
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={onLeave}
              className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isChatOpen && (
          <div className="w-80 border-l border-slate-700 bg-slate-800 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700">
              <h3 className="font-medium text-white">面试助手</h3>
              <p className="text-xs text-slate-400">实时消息与提示</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-300">AI提示</span>
                </div>
                <p className="text-sm text-blue-200">
                  回答问题时可以使用 STAR 法则：情境、任务、行动、结果。
                </p>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[85%]",
                    msg.sender === "我" ? "ml-auto" : "mr-auto"
                  )}
                >
                  <p className="text-xs text-slate-500 mb-1">
                    {msg.sender} · {msg.time}
                  </p>
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl text-sm",
                      msg.sender === "我"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-slate-700 text-slate-200 rounded-bl-md"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 h-9 px-3 rounded-lg bg-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
