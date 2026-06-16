import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  List,
  Clock,
  MapPin,
  Building2,
  Users,
  FileText,
  Bot,
  Video,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Timer,
  Smile,
  Mic,
  MessageSquare,
  ChevronDown,
  CalendarCheck2,
  QrCode,
  ExternalLink,
  Eye,
  XCircle,
  Navigation,
  BookOpen,
  Play,
  FileQuestion,
  BarChart3,
  MonitorCheck,
  VideoIcon,
  Map as MapIcon,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  Banknote,
} from 'lucide-react';
import {
  Tabs,
  Button,
  Tag,
  Progress,
  Badge,
  Calendar,
  Radio,
  Space,
  message,
  Modal,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';
import {
  campusProgress as initialCampusProgress,
  type MyCampusSession,
  type MyWrittenExam,
  type MyAIInterview,
  type MyFinalInterview,
} from '@/mock/progress';

interface CampusSessionMock {
  id: string;
  name: string;
  school: string;
  enterpriseCount: number;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  registered: number;
  format: '线上' | '线下' | '混合';
  status: '可预约' | '已满' | '进行中' | '已结束';
}

interface WrittenExamMock {
  id: string;
  enterprise: string;
  position: string;
  duration: number;
  questionCount: number;
  deadline: string;
  status: '待开始' | '进行中' | '已截止';
}

interface AIInterviewMock {
  id: string;
  enterprise: string;
  position: string;
  questionCount: number;
  durationPerQuestion: number;
  expressionWeight: number;
  speechWeight: number;
  semanticsWeight: number;
  deadline: string;
  status: '待开始' | '进行中' | '已完成';
}

interface FinalInterviewMock {
  id: string;
  enterprise: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: '腾讯会议' | '线下面试';
  location: string;
  meetingUrl?: string;
}

const mockSessions: CampusSessionMock[] = [
  {
    id: 'cs1',
    name: '中山市2025届秋季校园招聘会',
    school: '广东工业大学',
    enterpriseCount: 45,
    date: '2024-10-15',
    time: '09:00-17:00',
    venue: '大学城校区体育馆',
    capacity: 2000,
    registered: 1580,
    format: '线下',
    status: '可预约',
  },
  {
    id: 'cs2',
    name: '智能制造专场招聘会',
    school: '华南理工大学',
    enterpriseCount: 32,
    date: '2024-10-18',
    time: '14:00-18:00',
    venue: '五山校区就业指导中心',
    capacity: 800,
    registered: 800,
    format: '线下',
    status: '已满',
  },
  {
    id: 'cs3',
    name: '中山企业线上宣讲会',
    school: '广州大学',
    enterpriseCount: 28,
    date: '2024-10-20',
    time: '19:00-21:00',
    venue: '腾讯会议',
    capacity: 500,
    registered: 320,
    format: '线上',
    status: '可预约',
  },
  {
    id: 'cs4',
    name: '灯饰照明行业专场',
    school: '佛山科学技术学院',
    enterpriseCount: 38,
    date: '2024-10-22',
    time: '10:00-16:00',
    venue: '江湾校区学术报告厅',
    capacity: 1000,
    registered: 650,
    format: '混合',
    status: '可预约',
  },
  {
    id: 'cs5',
    name: '电子信息行业招聘会',
    school: '五邑大学',
    enterpriseCount: 25,
    date: '2024-10-25',
    time: '09:30-16:30',
    venue: '北校区学生活动中心',
    capacity: 600,
    registered: 420,
    format: '线下',
    status: '可预约',
  },
  {
    id: 'cs6',
    name: '新能源产业专场宣讲',
    school: '广东技术师范大学',
    enterpriseCount: 20,
    date: '2024-10-28',
    time: '14:30-17:30',
    venue: '白云校区综合楼',
    capacity: 400,
    registered: 180,
    format: '混合',
    status: '可预约',
  },
];

const mockWrittenExams: WrittenExamMock[] = [
  {
    id: 'we1',
    enterprise: '中山市明阳电器有限公司',
    position: '电气工程师',
    duration: 90,
    questionCount: 35,
    deadline: '2024-10-16 18:00',
    status: '待开始',
  },
  {
    id: 'we2',
    enterprise: '广东三和管桩股份有限公司',
    position: '结构工程师',
    duration: 120,
    questionCount: 45,
    deadline: '2024-10-15 20:00',
    status: '进行中',
  },
  {
    id: 'we3',
    enterprise: '中顺洁柔纸业股份有限公司',
    position: '供应链管理岗',
    duration: 60,
    questionCount: 30,
    deadline: '2024-10-12 12:00',
    status: '已截止',
  },
  {
    id: 'we4',
    enterprise: '中山大洋电机股份有限公司',
    position: '电机研发工程师',
    duration: 100,
    questionCount: 40,
    deadline: '2024-10-20 23:59',
    status: '待开始',
  },
];

const mockAIInterviews: AIInterviewMock[] = [
  {
    id: 'ai1',
    enterprise: '中山市木林森股份有限公司',
    position: 'LED研发工程师',
    questionCount: 5,
    durationPerQuestion: 120,
    expressionWeight: 25,
    speechWeight: 35,
    semanticsWeight: 40,
    deadline: '2024-10-18 23:59',
    status: '待开始',
  },
  {
    id: 'ai2',
    enterprise: '广东长青（集团）股份有限公司',
    position: '热能工程师',
    questionCount: 4,
    durationPerQuestion: 90,
    expressionWeight: 20,
    speechWeight: 40,
    semanticsWeight: 40,
    deadline: '2024-10-16 18:00',
    status: '进行中',
  },
  {
    id: 'ai3',
    enterprise: '中山华帝燃具股份有限公司',
    position: '产品设计师',
    questionCount: 6,
    durationPerQuestion: 150,
    expressionWeight: 30,
    speechWeight: 30,
    semanticsWeight: 40,
    deadline: '2024-10-10 12:00',
    status: '已完成',
  },
];

const mockFinalInterviews: FinalInterviewMock[] = [
  {
    id: 'fi1',
    enterprise: '中山市格兰仕集团有限公司',
    position: '硬件研发工程师',
    interviewer: '李经理（HR总监）',
    date: '2024-10-16',
    time: '10:00-11:00',
    type: '腾讯会议',
    location: '腾讯会议ID: 856-234-901',
    meetingUrl: 'https://meeting.tencent.com/dm/example',
  },
  {
    id: 'fi2',
    enterprise: '广东奥马电器股份有限公司',
    position: '制冷工程师',
    interviewer: '王总（技术总监）',
    date: '2024-10-18',
    time: '14:30-15:30',
    type: '线下面试',
    location: '中山市南头镇东福北路58号奥马工业园行政楼3楼会议室',
  },
  {
    id: 'fi3',
    enterprise: '中山中炬高新技术实业股份有限公司',
    position: '项目管理岗',
    interviewer: '张女士（人力资源部）',
    date: '2024-10-21',
    time: '09:30-10:30',
    type: '腾讯会议',
    location: '腾讯会议ID: 428-765-132',
    meetingUrl: 'https://meeting.tencent.com/dm/example2',
  },
  {
    id: 'fi4',
    enterprise: '广东顶固集创家居股份有限公司',
    position: '结构设计师',
    interviewer: '刘经理（研发部）',
    date: '2024-10-23',
    time: '15:00-16:00',
    type: '线下面试',
    location: '中山市东凤镇和穗工业区顶固工业园',
  },
];

export default function Campus() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [messageApi, contextHolder] = message.useMessage();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MyCampusSession | null>(null);

  const [sessions, setSessions] = useState<MyCampusSession[]>(initialCampusProgress.sessions);
  const [exams, setExams] = useState<MyWrittenExam[]>(initialCampusProgress.exams);
  const [aiInterviews, setAiInterviews] = useState<MyAIInterview[]>(initialCampusProgress.aiInterviews);
  const [finalInterviews, setFinalInterviews] = useState<MyFinalInterview[]>(initialCampusProgress.finalInterviews);

  const [examCountdowns, setExamCountdowns] = useState<Record<string, number>>({});

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    exams.forEach((exam) => {
      if (exam.status === '待开始') {
        const deadline = dayjs(exam.deadline);
        const updateCountdown = () => {
          const now = dayjs();
          const diff = deadline.diff(now, 'second');
          setExamCountdowns((prev) => ({ ...prev, [exam.id]: Math.max(0, diff) }));
          if (diff <= 0) {
            setExams((prev) =>
              prev.map((e) => (e.id === exam.id ? { ...e, status: '进行中' as const } : e))
            );
          }
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearInterval);
  }, [exams]);

  const showToast = (content: string, type: 'success' | 'error' | 'info' = 'success') => {
    messageApi[type](content);
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}小时${m}分${s}秒`;
    if (m > 0) return `${m}分${s}秒`;
    return `${s}秒`;
  };

  const getSessionCountdown = (session: MyCampusSession) => {
    const now = dayjs();
    const start = dayjs(`${session.date} ${session.time.split('-')[0]}`);
    const diff = start.diff(now, 'minute');
    if (diff < 0) return null;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return { hours, minutes };
  };

  const handleSessionSignIn = (session: MyCampusSession) => {
    setSelectedSession(session);
    setQrModalOpen(true);
    showToast('正在加载签到二维码...', 'info');
  };

  const handleConfirmSignIn = () => {
    if (selectedSession) {
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? { ...s, status: '进行中' as const } : s))
      );
      showToast('已签到成功！祝您宣讲会愉快', 'success');
      setQrModalOpen(false);
    }
  };

  const handleCancelSession = (sessionId: string) => {
    Modal.confirm({
      title: '确认取消预约',
      content: '取消后将无法恢复，确定要取消吗？',
      onOk: () => {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: '已取消' as const } : s))
        );
        showToast('已取消预约', 'success');
      },
    });
  };

  const handleViewNavigation = (venue: string) => {
    showToast(`正在导航到：${venue}`, 'info');
    window.open(`https://maps.google.com/?q=${encodeURIComponent(venue)}`, '_blank');
  };

  const handleViewMaterials = (url?: string) => {
    showToast('正在打开宣讲会资料...', 'info');
  };

  const handleViewReplay = (url?: string) => {
    showToast('正在打开回放视频...', 'info');
  };

  const handleApplyPosition = (position: string) => {
    showToast(`正在投递：${position}`, 'info');
  };

  const handleEnterExam = (examId: string) => {
    setExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, status: '进行中' as const, answeredCount: 0 } : e))
    );
    showToast('正在进入考场，请遵守考试纪律', 'success');
  };

  const handleViewInstructions = (url?: string) => {
    showToast('正在查看考试须知...', 'info');
  };

  const handleMockTest = (url?: string) => {
    showToast('正在进入模拟测试...', 'info');
  };

  const handleContinueExam = (examId: string) => {
    showToast('正在继续答题...', 'info');
  };

  const handleViewScore = (exam: MyWrittenExam) => {
    showToast(`您的成绩：${exam.score}分`, 'success');
  };

  const handleViewWrongAnswers = (url?: string) => {
    showToast('正在查看错题解析...', 'info');
  };

  const handleDeviceTest = () => {
    showToast('正在进行设备测试...', 'info');
  };

  const handleEnterAIInterview = (interviewId: string) => {
    setAiInterviews((prev) =>
      prev.map((i) =>
        i.id === interviewId ? { ...i, status: '进行中' as const, currentQuestionIndex: 1 } : i
      )
    );
    showToast('正在进入AI面试，请确保摄像头和麦克风正常工作', 'success');
  };

  const handleContinueAIInterview = (interviewId: string) => {
    showToast('正在继续面试...', 'info');
  };

  const handleViewReport = (interview: MyAIInterview) => {
    showToast(`综合评分：${interview.totalScore}分`, 'success');
  };

  const handleViewHRFeedback = (feedback?: string) => {
    if (feedback) {
      Modal.info({
        title: 'HR 反馈',
        content: feedback,
      });
    }
  };

  const handleJoinMeeting = (url?: string) => {
    if (url) {
      showToast('正在加入会议...', 'info');
      window.open(url, '_blank');
    }
  };

  const handleViewMap = (url?: string) => {
    if (url) {
      showToast('正在打开地图导航...', 'info');
      window.open(url, '_blank');
    }
  };

  const handleCancelFinalInterview = (interviewId: string) => {
    Modal.confirm({
      title: '确认取消排期',
      content: '取消后将需要重新预约，确定要取消吗？',
      onOk: () => {
        setFinalInterviews((prev) =>
          prev.map((i) => (i.id === interviewId ? { ...i, status: '已拒绝' as const } : i))
        );
        showToast('已取消排期', 'success');
      },
    });
  };

  const handleAcceptOffer = (interviewId: string) => {
    Modal.confirm({
      title: '确认接受 Offer',
      content: '接受后我们将为您发送入职指引邮件，确定接受吗？',
      onOk: () => {
        setFinalInterviews((prev) =>
          prev.map((i) => (i.id === interviewId ? { ...i, status: '已结束' as const } : i))
        );
        showToast('恭喜！已接受 Offer，入职指南已发送至您的邮箱', 'success');
      },
    });
  };

  const handleRejectOffer = (interviewId: string) => {
    Modal.confirm({
      title: '确认拒绝 Offer',
      content: '拒绝后将无法恢复，确定要拒绝吗？',
      onOk: () => {
        setFinalInterviews((prev) =>
          prev.map((i) => (i.id === interviewId ? { ...i, status: '已拒绝' as const } : i))
        );
        showToast('已拒绝 Offer，感谢您的参与', 'info');
      },
    });
  };

  const handleViewSalaryDetail = (detail?: string) => {
    if (detail) {
      Modal.info({
        title: '薪资详情',
        content: detail,
        icon: <Banknote className="text-vital-orange-500" />,
      });
    }
  };

  const getSessionStatusColor = (status: MyCampusSession['status']) => {
    switch (status) {
      case '待参加':
        return 'success';
      case '进行中':
        return 'processing';
      case '已结束':
        return 'default';
      case '已取消':
        return 'error';
      default:
        return 'default';
    }
  };

  const getExamStatusColor = (status: MyWrittenExam['status']) => {
    switch (status) {
      case '待开始':
        return 'success';
      case '进行中':
        return 'processing';
      case '已完成':
        return 'default';
      case '已截止':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAIStatusColor = (status: MyAIInterview['status']) => {
    switch (status) {
      case '待开始':
        return 'success';
      case '进行中':
        return 'processing';
      case '已完成':
        return 'default';
      case '待评分':
        return 'warning';
      case '已出分':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getFinalStatusColor = (status: MyFinalInterview['status']) => {
    switch (status) {
      case '待参加':
        return 'success';
      case '进行中':
        return 'processing';
      case '已结束':
        return 'default';
      case 'Offer 已发':
        return 'gold';
      case '已拒绝':
        return 'error';
      default:
        return 'default';
    }
  };

  const sessionDates = useMemo(() => {
    const map = new Map<string, CampusSessionMock[]>();
    mockSessions.forEach((s) => {
      const key = dayjs(s.date).format('YYYY-MM-DD');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, []);

  const finalInterviewDates = useMemo(() => {
    const map = new Map<string, FinalInterviewMock[]>();
    mockFinalInterviews.forEach((f) => {
      const key = dayjs(f.date).format('YYYY-MM-DD');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return map;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '可预约':
      case '待开始':
      case '待参加':
        return 'success';
      case '已满':
      case '进行中':
      case '待评分':
        return 'warning';
      case '已结束':
      case '已截止':
      case '已完成':
        return 'default';
      case '已取消':
      case '已拒绝':
        return 'error';
      case '已出分':
      case 'Offer 已发':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case '线上':
        return 'blue';
      case '线下':
        return 'green';
      case '混合':
        return 'purple';
      default:
        return 'default';
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const sessions = sessionDates.get(dateStr);
    if (sessions && sessions.length > 0) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="text-right text-sm">{value.date()}</div>
          <div className="mt-1 space-y-0.5">
            {sessions.slice(0, 2).map((s) => (
              <div
                key={s.id}
                className="text-[10px] px-1 py-0.5 rounded bg-industrial-blue-50 text-industrial-blue-600 truncate"
              >
                {s.school.slice(0, 6)}
              </div>
            ))}
            {sessions.length > 2 && (
              <div className="text-[10px] text-gray-400">+{sessions.length - 2}场</div>
            )}
          </div>
        </div>
      );
    }
    return <div className="text-right text-sm">{value.date()}</div>;
  };

  const finalInterviewCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const interviews = finalInterviewDates.get(dateStr);
    if (interviews && interviews.length > 0) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="text-right text-sm">{value.date()}</div>
          <div className="mt-1 space-y-0.5">
            {interviews.slice(0, 2).map((i) => (
              <div
                key={i.id}
                className={cn(
                  'text-[10px] px-1 py-0.5 rounded truncate',
                  i.type === '腾讯会议'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-vital-orange-50 text-vital-orange-600'
                )}
              >
                {i.time.slice(0, 5)} {i.enterprise.slice(0, 6)}
              </div>
            ))}
            {interviews.length > 2 && (
              <div className="text-[10px] text-gray-400">+{interviews.length - 2}场</div>
            )}
          </div>
        </div>
      );
    }
    return <div className="text-right text-sm">{value.date()}</div>;
  };

  const countdownText = (deadline: string) => {
    const now = dayjs();
    const end = dayjs(deadline);
    const diffHours = end.diff(now, 'hour');
    if (diffHours < 0) return '已截止';
    if (diffHours < 24) return `剩余 ${diffHours} 小时`;
    return `剩余 ${Math.floor(diffHours / 24)} 天 ${diffHours % 24} 小时`;
  };

  return (
    <div className="space-y-6">
      {contextHolder}
      <Modal
        title="宣讲会签到"
        open={qrModalOpen}
        onOk={handleConfirmSignIn}
        onCancel={() => setQrModalOpen(false)}
        okText="确认签到"
        cancelText="取消"
      >
        {selectedSession && (
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-gray-900">{selectedSession.name}</div>
            <div className="text-sm text-gray-500">
              {dayjs(selectedSession.date).format('YYYY-MM-DD')} {selectedSession.time}
            </div>
            <div className="text-sm text-gray-500">{selectedSession.venue}</div>
            <div className="flex justify-center py-4">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <QrCode size={120} className="text-gray-400" />
              </div>
            </div>
            <div className="text-xs text-gray-400">请扫描二维码完成签到，或点击下方确认按钮</div>
          </div>
        )}
      </Modal>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="bg-gradient-to-r from-industrial-blue-600 to-cyan-500 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-vital-orange-400/20 blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">校园招聘大厅</h1>
            <p className="text-industrial-blue-100">
              宣讲会 · 在线笔试 · AI面试 · HR终面 · 一站式校园招聘闭环体验
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarCheck2 size={20} className="text-industrial-blue-500" />
              我的校招进度
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <CalendarDays size={16} />
                  宣讲会预约
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{sessions.length}</div>
                    <div className="text-xs text-gray-500">已预约</div>
                  </div>
                  {sessions.length > 0 && (
                    <Tag color="success" className="!m-0">
                      {sessions[0].status}
                    </Tag>
                  )}
                </div>
                {sessions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {sessions[0].name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {dayjs(sessions[0].date).format('MM-DD')} {sessions[0].time}
                    </div>
                    {getSessionCountdown(sessions[0]) && (
                      <div className="text-xs text-cyan-600 font-medium">
                        距离开始还有 {getSessionCountdown(sessions[0])!.hours} 小时 {getSessionCountdown(sessions[0])!.minutes} 分钟
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无安排，去看看 →</div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !h-auto !text-xs !text-industrial-blue-600"
                    onClick={() => setActiveTab('sessions')}
                  >
                    查看全部 <ChevronDown size={12} className="inline" />
                  </Button>
                  {sessions.length > 0 && (
                    <Space>
                      <Button
                        size="small"
                        icon={<Eye size={12} />}
                        onClick={() => showToast('正在查看宣讲会详情...', 'info')}
                      >
                        详情
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<QrCode size={12} />}
                        disabled={sessions[0].status === '已结束' || sessions[0].status === '已取消'}
                        onClick={() => handleSessionSignIn(sessions[0])}
                        className="!bg-cyan-500 !border-cyan-500 hover:!bg-cyan-600"
                      >
                        {sessions[0].status === '进行中' ? '立即签到' : '查看签到'}
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-vital-orange-500 to-vital-orange-600 p-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <FileText size={16} />
                  在线笔试
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {exams.filter((e) => e.status !== '已完成').length}
                    </div>
                    <div className="text-xs text-gray-500">待考试</div>
                  </div>
                  {exams.length > 0 && exams[0].status !== '已完成' && (
                    <Tag color="warning" className="!m-0">
                      进行中
                    </Tag>
                  )}
                </div>
                {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止').length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].position}
                    </div>
                    <div className="text-xs text-vital-orange-600 flex items-center gap-1 font-medium">
                      <Timer size={12} />
                      {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '待开始' && examCountdowns[exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].id] !== undefined
                        ? `距离开始：${formatCountdown(examCountdowns[exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].id])}`
                        : exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '进行中'
                        ? `已答 ${exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].answeredCount || 0}/${exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].questionCount} 题`
                        : countdownText(exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].deadline)}
                    </div>
                    {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '进行中' && (
                      <Progress
                        percent={((exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].answeredCount || 0) / exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].questionCount) * 100}
                        showInfo={false}
                        size="small"
                        strokeColor={{ '0%': '#FF7D00', '100%': '#FF9A2E' }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无安排，去看看 →</div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !h-auto !text-xs !text-industrial-blue-600"
                    onClick={() => setActiveTab('exam')}
                  >
                    查看全部 <ChevronDown size={12} className="inline" />
                  </Button>
                  {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止').length > 0 && (
                    <Space>
                      <Button
                        size="small"
                        icon={<BookOpen size={12} />}
                        onClick={() => handleViewInstructions(exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].instructionsUrl)}
                      >
                        须知
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlayCircle size={12} />}
                        disabled={
                          exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '待开始' &&
                          (examCountdowns[exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].id] || 0) > 0
                        }
                        onClick={() =>
                          exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '进行中'
                            ? handleContinueExam(exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].id)
                            : handleEnterExam(exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].id)
                        }
                        className="!bg-vital-orange-500 !border-vital-orange-500 hover:!bg-vital-orange-600"
                      >
                        {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止')[0].status === '进行中' ? '继续答题' : '进入考场'}
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Bot size={16} />
                  AI 面试
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {aiInterviews.filter((i) => i.status !== '已完成').length}
                    </div>
                    <div className="text-xs text-gray-500">待面试</div>
                  </div>
                  {aiInterviews.length > 0 && (
                    <Tag color="processing" className="!m-0">
                      {aiInterviews[0].appointmentStatus}
                    </Tag>
                  )}
                </div>
                {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分').length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].position}
                    </div>
                    <div className="text-xs text-gray-500">
                      评分维度：表情{aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].expressionWeight}% / 语音
                      {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].speechWeight}% / 语义{aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].semanticsWeight}%
                    </div>
                    {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].status === '进行中' && (
                      <div className="space-y-1">
                        <div className="text-xs text-purple-600 font-medium">
                          第 {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].currentQuestionIndex || 1} 题 / 共 {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].questionCount} 题
                        </div>
                        <Progress
                          percent={((aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].currentQuestionIndex || 1) / aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].questionCount) * 100}
                          showInfo={false}
                          size="small"
                          strokeColor={{ '0%': '#9254DE', '100%': '#722ED1' }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无安排，去看看 →</div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !h-auto !text-xs !text-industrial-blue-600"
                    onClick={() => setActiveTab('ai')}
                  >
                    查看全部 <ChevronDown size={12} className="inline" />
                  </Button>
                  {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分').length > 0 && (
                    <Space>
                      <Button
                        size="small"
                        icon={<MonitorCheck size={12} />}
                        onClick={handleDeviceTest}
                        disabled={aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].status === '进行中'}
                      >
                        设备
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={<VideoIcon size={12} />}
                        disabled={aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].status === '待评分'}
                        onClick={() =>
                          aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].status === '进行中'
                            ? handleContinueAIInterview(aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].id)
                            : handleEnterAIInterview(aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].id)
                        }
                        className="!bg-purple-500 !border-purple-500 hover:!bg-purple-600"
                      >
                        {aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分')[0].status === '进行中' ? '继续面试' : '开始面试'}
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-industrial-blue-500 to-industrial-blue-600 p-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Video size={16} />
                  HR 终面
                </h3>
              </div>
              <div className="p-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{finalInterviews.length}</div>
                    <div className="text-xs text-gray-500">终面排期</div>
                  </div>
                  {finalInterviews.length > 0 && (
                    <Tag
                      color={finalInterviews[0].type === '线上' ? 'purple' : 'orange'}
                      className="!m-0"
                    >
                      {finalInterviews[0].type}
                    </Tag>
                  )}
                </div>
                {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝').length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].position}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {dayjs(finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].date).format('MM-DD')} {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].time}
                    </div>
                    <div className="flex items-center gap-1">
                      {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上' ? (
                        <Video size={12} className="text-purple-500" />
                      ) : (
                        <MapPin size={12} className="text-vital-orange-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无安排，去看看 →</div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Button
                    type="link"
                    size="small"
                    className="!p-0 !h-auto !text-xs !text-industrial-blue-600"
                    onClick={() => setActiveTab('final')}
                  >
                    查看全部 <ChevronDown size={12} className="inline" />
                  </Button>
                  {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝').length > 0 && (
                    <Space>
                      <Button
                        size="small"
                        icon={finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上' ? <Eye size={12} /> : <MapIcon size={12} />}
                        onClick={() =>
                          finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上'
                            ? showToast(`会议地址：${finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].location}`, 'info')
                            : handleViewMap(finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].mapUrl)
                        }
                      >
                        {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上' ? '地址' : '地图'}
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        icon={finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].status === 'Offer 已发' ? <ThumbsUp size={12} /> : <Video size={12} />}
                        disabled={finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].status === '已拒绝'}
                        onClick={() =>
                          finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].status === 'Offer 已发'
                            ? handleAcceptOffer(finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].id)
                            : finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上'
                            ? handleJoinMeeting(finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].meetingUrl)
                            : handleViewMap(finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].mapUrl)
                        }
                        className="!bg-industrial-blue-500 !border-industrial-blue-500 hover:!bg-industrial-blue-600"
                      >
                        {finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].status === 'Offer 已发'
                          ? '接受 Offer'
                          : finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝')[0].type === '线上'
                          ? '进入会议'
                          : '查看地址'}
                      </Button>
                    </Space>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'sessions',
              label: (
                <span className="flex items-center gap-2">
                  <CalendarDays size={18} />
                  宣讲会
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {sessions.length > 0 && (
                    <div className="bg-gradient-to-r from-cyan-50 to-white rounded-xl border border-cyan-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <CalendarDays size={16} className="text-cyan-500" />
                          我的预约
                          <Badge count={sessions.filter((s) => s.status !== '已取消' && s.status !== '已结束').length} size="small" />
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {sessions.map((session, idx) => {
                            const countdown = getSessionCountdown(session);
                            return (
                              <motion.div
                                key={session.id}
                                layout
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                                className="bg-white rounded-lg p-3 border border-cyan-100"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-900 truncate flex-1">
                                    {session.name}
                                  </h4>
                                  <Tag
                                    color={getSessionStatusColor(session.status)}
                                    className="!m-0 !ml-2 flex-shrink-0"
                                  >
                                    {session.status}
                                  </Tag>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Building2 size={12} />
                                    {session.school}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {dayjs(session.date).format('MM-DD')} {session.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {session.venue}
                                  </div>
                                  {countdown && (
                                    <div className="text-cyan-600 font-medium flex items-center gap-1">
                                      <Timer size={12} />
                                      距离开始还有 {countdown.hours} 小时 {countdown.minutes} 分钟
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {session.status === '待参加' && (
                                    <>
                                      <Button
                                        size="small"
                                        danger
                                        icon={<XCircle size={12} />}
                                        onClick={() => handleCancelSession(session.id)}
                                      >
                                        取消预约
                                      </Button>
                                      <Button
                                        size="small"
                                        icon={<Navigation size={12} />}
                                        onClick={() => handleViewNavigation(session.venue)}
                                      >
                                        查看导航
                                      </Button>
                                    </>
                                  )}
                                  {session.status === '进行中' && (
                                    <>
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<QrCode size={12} />}
                                        onClick={() => handleSessionSignIn(session)}
                                        className="!bg-cyan-500 !border-cyan-500"
                                      >
                                        立即签到
                                      </Button>
                                      <Button
                                        size="small"
                                        icon={<BookOpen size={12} />}
                                        onClick={() => handleViewMaterials(session.materialsUrl)}
                                      >
                                        查看资料
                                      </Button>
                                    </>
                                  )}
                                  {session.status === '已结束' && (
                                    <>
                                      <Button
                                        size="small"
                                        icon={<Play size={12} />}
                                        onClick={() => handleViewReplay(session.replayUrl)}
                                      >
                                        查看回放
                                      </Button>
                                      {session.relatedPositions && session.relatedPositions.length > 0 && (
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<ExternalLink size={12} />}
                                          onClick={() => handleApplyPosition(session.relatedPositions![0])}
                                          className="!bg-cyan-500 !border-cyan-500"
                                        >
                                          投递职位
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  {session.status === '已取消' && (
                                    <Tag color="error" className="!m-0">
                                      预约已取消
                                    </Tag>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Radio.Group
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value)}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="list">
                        <List size={14} className="inline mr-1" />
                        列表视图
                      </Radio.Button>
                      <Radio.Button value="calendar">
                        <CalendarDays size={14} className="inline mr-1" />
                        日历视图
                      </Radio.Button>
                    </Radio.Group>
                    <Space>
                      <span className="text-sm text-gray-500">
                        共 {mockSessions.length} 场宣讲会
                      </span>
                    </Space>
                  </div>

                  {viewMode === 'calendar' ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold">
                          {currentMonth.format('YYYY年MM月')}
                        </h3>
                        <Space>
                          <Button
                            size="small"
                            icon={<ChevronLeft size={14} />}
                            onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                          />
                          <Button
                            size="small"
                            onClick={() => setCurrentMonth(dayjs())}
                          >
                            今天
                          </Button>
                          <Button
                            size="small"
                            icon={<ChevronRight size={14} />}
                            onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                          />
                        </Space>
                      </div>
                      <Calendar
                        value={currentMonth}
                        fullscreen={false}
                        cellRender={dateCellRender}
                        onChange={setCurrentMonth}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockSessions.map((session, idx) => {
                        const progress = (session.registered / session.capacity) * 100;
                        return (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + idx * 0.05, duration: 0.4 }}
                            whileHover={{ y: -3 }}
                            className="bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                                  {session.name}
                                </h3>
                                <p className="text-sm text-industrial-blue-600 font-medium">
                                  {session.school}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                <Tag color={getFormatColor(session.format)} className="!m-0">
                                  {session.format}
                                </Tag>
                                <Badge status={getStatusColor(session.status) as any} text={session.status} />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Building2 size={14} className="text-gray-400" />
                                <span>{session.enterpriseCount} 家企业</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Users size={14} className="text-gray-400" />
                                <span>{session.registered}/{session.capacity} 人</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Clock size={14} className="text-gray-400" />
                                <span>{dayjs(session.date).format('MM-DD')} {session.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="truncate">{session.venue}</span>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">预约进度</span>
                                <span className="text-industrial-blue-600 font-medium">
                                  {progress.toFixed(0)}%
                                </span>
                              </div>
                              <Progress
                                percent={progress}
                                showInfo={false}
                                size="small"
                                strokeColor={{
                                  '0%': '#699EFF',
                                  '100%': '#165DFF',
                                }}
                              />
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="primary"
                                disabled={session.status === '已满' || session.status === '已结束'}
                              >
                                {session.status === '已满'
                                  ? '预约已满'
                                  : session.status === '已结束'
                                  ? '已结束'
                                  : '立即预约'}
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'exam',
              label: (
                <span className="flex items-center gap-2">
                  <FileText size={18} />
                  在线笔试
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {exams.filter((e) => e.status !== '已完成' && e.status !== '已截止').length > 0 && (
                    <div className="bg-gradient-to-r from-vital-orange-50 to-white rounded-xl border border-vital-orange-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <FileText size={16} className="text-vital-orange-500" />
                          我的待考
                          <Badge
                            count={exams.filter((e) => e.status !== '已完成' && e.status !== '已截止').length}
                            size="small"
                          />
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {exams
                            .filter((e) => e.status !== '已完成' && e.status !== '已截止')
                            .map((exam, idx) => {
                              const countdown = examCountdowns[exam.id];
                              const progress = exam.answeredCount
                                ? (exam.answeredCount / exam.questionCount) * 100
                                : 0;
                              return (
                                <motion.div
                                  key={exam.id}
                                  layout
                                  initial={{ opacity: 0, x: -16 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                                  className="bg-white rounded-lg p-3 border border-vital-orange-100"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {exam.position}
                                      </h4>
                                      <p className="text-xs text-gray-500 truncate">
                                        {exam.enterprise}
                                      </p>
                                    </div>
                                    <Tag
                                      color={getExamStatusColor(exam.status)}
                                      className="!m-0 !ml-2 flex-shrink-0"
                                    >
                                      {exam.status}
                                    </Tag>
                                  </div>
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="text-gray-500">
                                        {exam.duration}分钟 · {exam.questionCount}题
                                      </div>
                                      <div className="text-vital-orange-600 font-medium flex items-center gap-1">
                                        <Timer size={12} />
                                        {exam.status === '待开始' && countdown !== undefined
                                          ? `距离开始：${formatCountdown(countdown)}`
                                          : exam.status === '进行中'
                                          ? `已答 ${exam.answeredCount || 0}/${exam.questionCount} 题`
                                          : countdownText(exam.deadline)}
                                      </div>
                                    </div>
                                    {exam.status === '进行中' && (
                                      <Progress
                                        percent={progress}
                                        showInfo={false}
                                        size="small"
                                        strokeColor={{ '0%': '#FF7D00', '100%': '#FF9A2E' }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {exam.status === '待开始' && (
                                      <>
                                        <Button
                                          size="small"
                                          icon={<BookOpen size={12} />}
                                          onClick={() => handleViewInstructions(exam.instructionsUrl)}
                                        >
                                          查看须知
                                        </Button>
                                        <Button
                                          size="small"
                                          icon={<FileQuestion size={12} />}
                                          onClick={() => handleMockTest(exam.mockTestUrl)}
                                        >
                                          模拟测试
                                        </Button>
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<PlayCircle size={12} />}
                                          disabled={countdown !== undefined && countdown > 0}
                                          onClick={() => handleEnterExam(exam.id)}
                                          className="!bg-vital-orange-500 !border-vital-orange-500"
                                        >
                                          进入考场
                                        </Button>
                                      </>
                                    )}
                                    {exam.status === '进行中' && (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<Play size={12} />}
                                        onClick={() => handleContinueExam(exam.id)}
                                        className="!bg-vital-orange-500 !border-vital-orange-500"
                                      >
                                        继续答题 ({exam.answeredCount || 0}/{exam.questionCount})
                                      </Button>
                                    )}
                                    {exam.status === '已完成' && (
                                      <>
                                        <Button
                                          size="small"
                                          icon={<BarChart3 size={12} />}
                                          onClick={() => handleViewScore(exam)}
                                        >
                                          查看成绩
                                        </Button>
                                        <Button
                                          size="small"
                                          icon={<FileQuestion size={12} />}
                                          onClick={() => handleViewWrongAnswers(exam.wrongAnswersUrl)}
                                        >
                                          错题解析
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    共 {mockWrittenExams.length} 场受邀笔试
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockWrittenExams.map((exam, idx) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                        whileHover={{ y: -3 }}
                        className="bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {exam.position}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">{exam.enterprise}</p>
                          </div>
                          <Badge
                            status={getStatusColor(exam.status) as any}
                            text={exam.status}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-gray-50">
                          <div className="text-center">
                            <div className="text-lg font-bold text-industrial-blue-600">{exam.duration}</div>
                            <div className="text-xs text-gray-500">考试时长(分钟)</div>
                          </div>
                          <div className="text-center border-x border-gray-100">
                            <div className="text-lg font-bold text-vital-orange-500">{exam.questionCount}</div>
                            <div className="text-xs text-gray-500">题目数</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-success-500">100</div>
                            <div className="text-xs text-gray-500">总分</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Timer size={14} className="text-vital-orange-500" />
                            <span className={cn(
                              exam.status === '已截止' ? 'text-gray-400' : 'text-vital-orange-600'
                            )}>
                              {countdownText(exam.deadline)}
                            </span>
                          </div>
                          <Button
                            type="primary"
                            icon={<PlayCircle size={14} />}
                            disabled={exam.status === '已截止'}
                          >
                            {exam.status === '进行中' ? '继续考试' : '进入考试'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'ai',
              label: (
                <span className="flex items-center gap-2">
                  <Bot size={18} />
                  AI面试
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {aiInterviews.filter((i) => i.status !== '已完成').length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Bot size={16} className="text-purple-500" />
                          我的面试
                          <Badge
                            count={aiInterviews.filter((i) => i.status !== '已完成' && i.status !== '已出分').length}
                            size="small"
                          />
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {aiInterviews
                            .filter((i) => i.status !== '已完成')
                            .map((interview, idx) => {
                              const progress = interview.currentQuestionIndex
                                ? (interview.currentQuestionIndex / interview.questionCount) * 100
                                : 0;
                              return (
                                <motion.div
                                  key={interview.id}
                                  layout
                                  initial={{ opacity: 0, x: -16 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                                  className="bg-white rounded-lg p-3 border border-purple-100"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {interview.position}
                                      </h4>
                                      <p className="text-xs text-gray-500 truncate">
                                        {interview.enterprise}
                                      </p>
                                    </div>
                                    <Tag
                                      color={getAIStatusColor(interview.status)}
                                      className="!m-0 !ml-2 flex-shrink-0"
                                    >
                                      {interview.status}
                                    </Tag>
                                  </div>
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="text-gray-500">
                                        {interview.questionCount}题 · 每题{interview.durationPerQuestion}秒
                                      </div>
                                      <div className="text-purple-600 font-medium flex items-center gap-1">
                                        <Timer size={12} />
                                        {interview.status === '进行中'
                                          ? `第 ${interview.currentQuestionIndex || 1} 题 / 共 ${interview.questionCount} 题`
                                          : countdownText(interview.deadline)}
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs">
                                        <Smile size={12} className="text-purple-500" />
                                        <span className="text-gray-500">表情</span>
                                        <Progress
                                          percent={interview.expressionWeight}
                                          showInfo={false}
                                          size="small"
                                          strokeColor="#722ED1"
                                        />
                                        <span className="text-purple-600 font-medium w-8 text-right">
                                          {interview.expressionScore || interview.expressionWeight}%
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <Mic size={12} className="text-industrial-blue-500" />
                                        <span className="text-gray-500">语音</span>
                                        <Progress
                                          percent={interview.speechWeight}
                                          showInfo={false}
                                          size="small"
                                          strokeColor="#165DFF"
                                        />
                                        <span className="text-industrial-blue-600 font-medium w-8 text-right">
                                          {interview.speechScore || interview.speechWeight}%
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <MessageSquare size={12} className="text-vital-orange-500" />
                                        <span className="text-gray-500">语义</span>
                                        <Progress
                                          percent={interview.semanticsWeight}
                                          showInfo={false}
                                          size="small"
                                          strokeColor="#FF7D00"
                                        />
                                        <span className="text-vital-orange-600 font-medium w-8 text-right">
                                          {interview.semanticsScore || interview.semanticsWeight}%
                                        </span>
                                      </div>
                                    </div>
                                    {interview.status === '进行中' && (
                                      <Progress
                                        percent={progress}
                                        showInfo={false}
                                        size="small"
                                        strokeColor={{ '0%': '#9254DE', '100%': '#722ED1' }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {interview.status === '待开始' && (
                                      <>
                                        <Button
                                          size="small"
                                          icon={<MonitorCheck size={12} />}
                                          onClick={handleDeviceTest}
                                        >
                                          设备测试
                                        </Button>
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<VideoIcon size={12} />}
                                          onClick={() => handleEnterAIInterview(interview.id)}
                                          className="!bg-purple-500 !border-purple-500"
                                        >
                                          进入面试
                                        </Button>
                                      </>
                                    )}
                                    {interview.status === '进行中' && (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<Play size={12} />}
                                        onClick={() => handleContinueAIInterview(interview.id)}
                                        className="!bg-purple-500 !border-purple-500"
                                      >
                                        继续面试 (第 {interview.currentQuestionIndex || 1}/{interview.questionCount} 题)
                                      </Button>
                                    )}
                                    {interview.status === '已出分' && (
                                      <>
                                        <Button
                                          size="small"
                                          icon={<BarChart3 size={12} />}
                                          onClick={() => handleViewReport(interview)}
                                        >
                                          查看报告
                                        </Button>
                                        <Button
                                          size="small"
                                          icon={<MessageSquare size={12} />}
                                          onClick={() => handleViewHRFeedback(interview.hrFeedback)}
                                        >
                                          HR 反馈
                                        </Button>
                                      </>
                                    )}
                                    {interview.status === '待评分' && (
                                      <Tag color="warning" className="!m-0">
                                        AI 评分中，请耐心等待
                                      </Tag>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    共 {mockAIInterviews.length} 个AI面试任务
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockAIInterviews.map((interview, idx) => (
                      <motion.div
                        key={interview.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                        whileHover={{ y: -3 }}
                        className="bg-white rounded-xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              {interview.position}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">{interview.enterprise}</p>
                          </div>
                          <Badge
                            status={getStatusColor(interview.status) as any}
                            text={interview.status}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-industrial-blue-600">{interview.questionCount}</div>
                            <div className="text-xs text-gray-500">题目数量</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-vital-orange-500">{interview.durationPerQuestion}s</div>
                            <div className="text-xs text-gray-500">每题时长</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">AI评分维度权重</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Smile size={14} className="text-purple-500" />
                              <span className="text-xs text-gray-600 w-16">表情分析</span>
                              <Progress
                                percent={interview.expressionWeight}
                                showInfo={false}
                                size="small"
                                strokeColor="#722ED1"
                              />
                              <span className="text-xs font-medium text-purple-600 w-8 text-right">
                                {interview.expressionWeight}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mic size={14} className="text-industrial-blue-500" />
                              <span className="text-xs text-gray-600 w-16">语音分析</span>
                              <Progress
                                percent={interview.speechWeight}
                                showInfo={false}
                                size="small"
                                strokeColor="#165DFF"
                              />
                              <span className="text-xs font-medium text-industrial-blue-600 w-8 text-right">
                                {interview.speechWeight}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-vital-orange-500" />
                              <span className="text-xs text-gray-600 w-16">语义分析</span>
                              <Progress
                                percent={interview.semanticsWeight}
                                showInfo={false}
                                size="small"
                                strokeColor="#FF7D00"
                              />
                              <span className="text-xs font-medium text-vital-orange-600 w-8 text-right">
                                {interview.semanticsWeight}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Timer size={14} className="text-vital-orange-500" />
                            <span className={cn(
                              interview.status === '已完成' ? 'text-gray-400' : 'text-vital-orange-600'
                            )}>
                              {countdownText(interview.deadline)}
                            </span>
                          </div>
                          <Button
                            type="primary"
                            icon={<Bot size={14} />}
                            disabled={interview.status === '已完成'}
                          >
                            {interview.status === '进行中' ? '继续面试' : interview.status === '已完成' ? '查看报告' : '开始AI面试'}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'final',
              label: (
                <span className="flex items-center gap-2">
                  <Video size={18} />
                  终面排期
                </span>
              ),
              children: (
                <div className="space-y-4">
                  {finalInterviews.length > 0 && (
                    <div className="bg-gradient-to-r from-industrial-blue-50 to-white rounded-xl border border-industrial-blue-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Video size={16} className="text-industrial-blue-500" />
                          我的排期
                          <Badge count={finalInterviews.filter((i) => i.status !== '已结束' && i.status !== '已拒绝').length} size="small" />
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AnimatePresence mode="popLayout">
                          {finalInterviews.map((interview, idx) => (
                            <motion.div
                              key={interview.id}
                              layout
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                              className="bg-white rounded-lg p-3 border border-industrial-blue-100"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                    interview.type === '线上' ? 'bg-purple-50' : 'bg-vital-orange-50'
                                  )}
                                >
                                  {interview.type === '线上' ? (
                                    <Video size={18} className="text-purple-600" />
                                  ) : (
                                    <MapPin size={18} className="text-vital-orange-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Tag
                                      color={interview.type === '线上' ? 'purple' : 'orange'}
                                      className="!m-0"
                                    >
                                      {interview.type}
                                    </Tag>
                                    <Tag
                                      color={getFinalStatusColor(interview.status)}
                                      className="!m-0"
                                    >
                                      {interview.status}
                                    </Tag>
                                  </div>
                                  <div className="text-xs text-gray-500 mb-1">
                                    {dayjs(interview.date).format('MM-DD')} {interview.time}
                                  </div>
                                  <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {interview.position}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate">
                                    {interview.enterprise}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate mt-0.5">
                                    面试官：{interview.interviewer}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {interview.status === '待参加' && (
                                  <>
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={interview.type === '线上' ? <Video size={12} /> : <MapIcon size={12} />}
                                      onClick={() =>
                                        interview.type === '线上'
                                          ? handleJoinMeeting(interview.meetingUrl)
                                          : handleViewMap(interview.mapUrl)
                                      }
                                      className="!bg-industrial-blue-500 !border-industrial-blue-500"
                                    >
                                      {interview.type === '线上' ? '加入会议' : '查看地图'}
                                    </Button>
                                    <Button
                                      size="small"
                                      danger
                                      icon={<XCircle size={12} />}
                                      onClick={() => handleCancelFinalInterview(interview.id)}
                                    >
                                      取消排期
                                    </Button>
                                  </>
                                )}
                                {interview.status === 'Offer 已发' && (
                                  <>
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<ThumbsUp size={12} />}
                                      onClick={() => handleAcceptOffer(interview.id)}
                                      className="!bg-success-500 !border-success-500"
                                    >
                                      接受 Offer
                                    </Button>
                                    <Button
                                      size="small"
                                      danger
                                      icon={<ThumbsDown size={12} />}
                                      onClick={() => handleRejectOffer(interview.id)}
                                    >
                                      拒绝 Offer
                                    </Button>
                                    <Button
                                      size="small"
                                      icon={<Banknote size={12} />}
                                      onClick={() => handleViewSalaryDetail(interview.salaryDetail)}
                                    >
                                      薪资详情
                                    </Button>
                                  </>
                                )}
                                {interview.status === '已拒绝' && (
                                  <Tag color="error" className="!m-0">
                                    已拒绝
                                  </Tag>
                                )}
                                {interview.status === '已结束' && (
                                  <Tag color="default" className="!m-0">
                                    已结束
                                  </Tag>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-semibold">
                            {currentMonth.format('YYYY年MM月')} 终面安排
                          </h3>
                          <Space>
                            <Button
                              size="small"
                              icon={<ChevronLeft size={14} />}
                              onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                            />
                            <Button size="small" onClick={() => setCurrentMonth(dayjs())}>
                              今天
                            </Button>
                            <Button
                              size="small"
                              icon={<ChevronRight size={14} />}
                              onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                            />
                          </Space>
                        </div>
                        <Calendar
                          value={currentMonth}
                          fullscreen={false}
                          cellRender={finalInterviewCellRender}
                          onChange={setCurrentMonth}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-base font-semibold">即将到来的终面</h3>
                      {mockFinalInterviews.map((interview, idx) => (
                        <motion.div
                          key={interview.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                          whileHover={{ x: -2 }}
                          className="bg-white rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:shadow-card-hover hover:border-industrial-blue-200"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                interview.type === '腾讯会议'
                                  ? 'bg-purple-50'
                                  : 'bg-vital-orange-50'
                              )}
                            >
                              {interview.type === '腾讯会议' ? (
                                <Video size={18} className="text-purple-600" />
                              ) : (
                                <MapPin size={18} className="text-vital-orange-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Tag
                                  color={interview.type === '腾讯会议' ? 'purple' : 'orange'}
                                  className="!m-0"
                                >
                                  {interview.type}
                                </Tag>
                                <span className="text-xs text-gray-500">
                                  {dayjs(interview.date).format('MM-DD')} {interview.time}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {interview.position}
                              </h4>
                              <p className="text-xs text-gray-500 truncate mb-1">
                                {interview.enterprise}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                面试官：{interview.interviewer}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {interview.location}
                              </p>
                              {interview.meetingUrl && (
                                <Button
                                  type="link"
                                  size="small"
                                  className="!p-0 !h-auto mt-1"
                                >
                                  加入会议
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
