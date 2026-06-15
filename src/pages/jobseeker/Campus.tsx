import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

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
        return 'success';
      case '已满':
      case '进行中':
        return 'warning';
      case '已结束':
      case '已截止':
      case '已完成':
        return 'default';
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
