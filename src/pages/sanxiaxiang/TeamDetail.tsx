import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Image,
  FileText,
  BadgeCheck,
  Star,
  Map,
  PenLine,
  GraduationCap,
  Building2,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockTeams } from '@/mock/teams';
import { mockJournals } from '@/mock/journals';
import { TeamStatus } from '@/constants/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/date';
import { generateAISummary, extractKeywords } from '@/utils/ai';
import { cn } from '@/lib/utils';

type TabKey = 'members' | 'schedule' | 'checkins' | 'journals' | 'achievement';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'members', label: '成员学籍', icon: Users },
  { key: 'schedule', label: '行程安排', icon: Calendar },
  { key: 'checkins', label: '打卡记录', icon: MapPin },
  { key: 'journals', label: '实践日志', icon: BookOpen },
  { key: 'achievement', label: '成果认证', icon: Award },
];

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const team = mockTeams.find((t) => t.id === id);
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [isAdmin] = useState(user?.role === 'school_admin' || user?.role === 'department_admin');

  const teamJournals = mockJournals.filter((j) => j.teamId === id);
  const checkIns = [
    { id: 'c1', location: '安徽省黄山市黟县宏村镇政府', time: '2026-07-10 09:30:00', photo: true, type: '签到' },
    { id: 'c2', location: '宏村镇中心小学支教点', time: '2026-07-10 14:15:00', photo: true, type: '支教' },
    { id: 'c3', location: '塔川村产业调研', time: '2026-07-11 08:45:00', photo: true, type: '调研' },
    { id: 'c4', location: '宏村景区文化考察', time: '2026-07-11 15:30:00', photo: true, type: '考察' },
    { id: 'c5', location: '星光村农产品直播带货', time: '2026-07-12 10:00:00', photo: true, type: '实践' },
    { id: 'c6', location: '宏村镇政府总结会', time: '2026-07-12 16:30:00', photo: false, type: '总结' },
  ];

  const schedule = [
    { day: 'Day 1', date: '7月10日', title: '出征仪式 & 驻地报道', desc: '出征仪式、集体乘车、驻地安顿、安全培训', status: 'done' },
    { day: 'Day 2', date: '7月11日', title: '支教启动 & 村情调研', desc: '中心小学支教开课、塔川村产业调研走访', status: 'done' },
    { day: 'Day 3', date: '7月12日', title: '文化考察 & 直播助农', desc: '宏村文化遗产考察、农产品直播带货', status: 'done' },
    { day: 'Day 4', date: '7月13日', title: '支教深化 & 访谈记录', desc: '拓展课程教学、村民深度访谈', status: 'active' },
    { day: 'Day 5', date: '7月14日', title: '成果整理 & 总结汇报', desc: '实践成果梳理、向镇政府汇报', status: 'pending' },
    { day: 'Day 6', date: '7月15日', title: '返程 & 后续工作', desc: '集体返程、总结报告撰写', status: 'pending' },
  ];

  if (!team) {
    return (
      <div className="text-center py-20 max-w-4xl mx-auto">
        <p className="text-surface-400">团队未找到</p>
        <Link to="/sanxiaxiang/teams" className="text-primary-600 hover:underline mt-2 inline-block">
          返回团队列表
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl mx-auto">
      <Link
        to="/sanxiaxiang/teams"
        className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        返回团队列表
      </Link>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white relative">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <span className={cn(
                  'inline-block status-badge mb-3',
                  TeamStatus[team.status as keyof typeof TeamStatus]?.color
                )}>
                  {TeamStatus[team.status as keyof typeof TeamStatus]?.label}
                </span>
                <h1 className="text-2xl font-bold">{team.name}</h1>
                <p className="text-white/80 text-sm mt-1">{team.theme} · {team.practiceBase}</p>
              </div>
              {isAdmin && team.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-success-500 hover:bg-success-600 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    通过
                  </button>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
                    驳回
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6">
              <div>
                <p className="text-white/60 text-xs">团队成员</p>
                <p className="text-xl font-bold font-mono mt-0.5">{team.members.length} 人</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">实践天数</p>
                <p className="text-xl font-bold font-mono mt-0.5">6 天</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">累计打卡</p>
                <p className="text-xl font-bold font-mono mt-0.5">{checkIns.length} 次</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">日志数</p>
                <p className="text-xl font-bold font-mono mt-0.5">{teamJournals.length} 篇</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-surface-100 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'text-primary-600'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="teamDetailTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-600"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-success-500" />
                      成员学籍信息
                    </h3>
                    <span className="text-xs text-surface-500 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      已对接学籍库
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {team.members.map((m) => {
                      const aiSummary = generateAISummary(m.name, m.major);
                      const keywords = extractKeywords(m.major);
                      return (
                        <div
                          key={m.userId}
                          className="p-4 rounded-xl border border-surface-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                                {m.name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-surface-800">{m.name}</p>
                                {m.role === 'leader' && (
                                  <span className="status-badge bg-accent-100 text-accent-600 text-[10px]">
                                    队长
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-surface-500 mt-0.5">{m.major} · {m.grade}</p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-surface-100 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-surface-400">学号：</span>
                              <span className="font-mono text-surface-700">{m.studentId || '202301' + Math.floor(Math.random() * 1000)}</span>
                            </div>
                            <div>
                              <span className="text-surface-400">学院：</span>
                              <span className="text-surface-700">{m.department || '计算机学院'}</span>
                            </div>
                            <div>
                              <span className="text-surface-400">学籍状态：</span>
                              <span className="text-success-600 font-medium">正常在籍</span>
                            </div>
                            <div>
                              <span className="text-surface-400">实践学分：</span>
                              <span className="font-mono text-surface-700">{m.creditHours || 3} 学分</span>
                            </div>
                          </div>

                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {keywords.slice(0, 3).map((kw) => (
                              <span
                                key={kw}
                                className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-[10px]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    实践行程安排
                  </h3>

                  <div className="space-y-0">
                    {schedule.map((item, i) => (
                      <div key={item.day} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                            item.status === 'done' && 'bg-success-100 text-success-600',
                            item.status === 'active' && 'bg-primary-100 text-primary-600 ring-2 ring-primary-200',
                            item.status === 'pending' && 'bg-surface-100 text-surface-500'
                          )}>
                            {item.status === 'done' ? <CheckCircle className="w-4.5 h-4.5" /> : item.day.split(' ')[1]}
                          </div>
                          {i < schedule.length - 1 && (
                            <div className={cn(
                              'w-0.5 flex-1 my-1',
                              item.status === 'done' ? 'bg-success-200' : 'bg-surface-100'
                            )} />
                          )}
                        </div>
                        <div className={cn(
                          'flex-1 pb-5',
                          item.status === 'active' && 'pb-5'
                        )}>
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              'font-semibold text-sm',
                              item.status === 'done' && 'text-surface-500 line-through',
                              item.status === 'active' && 'text-primary-700',
                              item.status === 'pending' && 'text-surface-700'
                            )}>
                              {item.title}
                            </p>
                            <span className="text-xs text-surface-400">{item.date}</span>
                            {item.status === 'active' && (
                              <span className="status-badge bg-primary-100 text-primary-600 text-[10px]">
                                进行中
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-surface-500 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'checkins' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-success-500" />
                      轨迹打卡记录
                    </h3>
                    <Link
                      to="/sanxiaxiang/checkin"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      前往打卡 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="bg-surface-50 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50" />
                    <div className="relative z-10 h-48 flex items-center justify-center">
                      <div className="text-center">
                        <Map className="w-12 h-12 text-surface-300 mx-auto mb-2" />
                        <p className="text-sm text-surface-500">LBS 轨迹地图区域</p>
                        <p className="text-xs text-surface-400 mt-1">共 {checkIns.length} 个打卡点</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {checkIns.map((checkin, i) => (
                      <div
                        key={checkin.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors"
                      >
                        <div className="relative flex flex-col items-center">
                          <div className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white shadow-md',
                            i === 0 ? 'bg-primary-500' : 'bg-success-500'
                          )}>
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-surface-800 text-sm">{checkin.location}</p>
                            <span className="status-badge bg-surface-100 text-surface-600 text-[10px]">
                              {checkin.type}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5">{checkin.time}</p>
                        </div>
                        {checkin.photo && (
                          <div className="w-12 h-12 rounded-lg bg-surface-100 flex items-center justify-center shrink-0">
                            <Image className="w-5 h-5 text-surface-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'journals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                      <PenLine className="w-5 h-5 text-accent-500" />
                      实践日志
                    </h3>
                    <Link
                      to="/sanxiaxiang/journals"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      全部日志 <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {teamJournals.length === 0 ? (
                    <div className="text-center py-10 text-surface-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无日志</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamJournals.slice(0, 3).map((journal) => (
                        <div key={journal.id} className="p-4 rounded-xl border border-surface-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-surface-800 text-sm">{journal.title}</h4>
                            <span className="text-xs text-surface-400">{formatDate(journal.createdAt)}</span>
                          </div>

                          <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-lg p-3 mb-2 border border-accent-100/50">
                            <p className="text-xs text-accent-700 font-medium flex items-center gap-1.5 mb-1.5">
                              <Lightbulb className="w-3.5 h-3.5" />
                              AI 智能摘要
                            </p>
                            <p className="text-xs text-surface-700 leading-relaxed">
                              {journal.aiSummary || generateAISummary(journal.title, journal.content)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(journal.keywords || extractKeywords(journal.content)).slice(0, 5).map((kw) => (
                              <span
                                key={kw}
                                className="px-2 py-0.5 bg-surface-100 text-surface-600 rounded-full text-[10px]"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-100">
                            <span className="text-xs text-surface-500">
                              作者：{journal.authorName}
                            </span>
                            <span className="text-xs text-primary-600 font-medium">
                              阅读全文 →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievement' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-surface-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    成果认证
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                      <Award className="w-8 h-8 text-amber-500 mb-2" />
                      <p className="text-2xl font-bold text-surface-800 font-mono">{team.creditHours || 8}</p>
                      <p className="text-xs text-surface-500 mt-0.5">实践学分</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-success-50 to-emerald-50 border border-success-200/50">
                      <Clock className="w-8 h-8 text-success-500 mb-2" />
                      <p className="text-2xl font-bold text-surface-800 font-mono">48</p>
                      <p className="text-xs text-surface-500 mt-0.5">服务时长 (h)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200/50">
                      <Star className="w-8 h-8 text-primary-500 mb-2" />
                      <p className="text-2xl font-bold text-surface-800 font-mono">优</p>
                      <p className="text-xs text-surface-500 mt-0.5">基地评价</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-surface-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-surface-800 text-sm">实践总结报告</p>
                          <p className="text-xs text-surface-500 mt-0.5">已提交 · PDF 格式 · 2.3MB</p>
                        </div>
                        <span className="status-badge bg-success-50 text-success-600">已通过</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-surface-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center shrink-0">
                          <Image className="w-5 h-5 text-success-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-surface-800 text-sm">成果照片集</p>
                          <p className="text-xs text-surface-500 mt-0.5">已上传 · 36 张照片 · 带位置水印</p>
                        </div>
                        <span className="status-badge bg-success-50 text-success-600">已通过</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-surface-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-accent-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-surface-800 text-sm">基地满意度评价</p>
                          <p className="text-xs text-surface-500 mt-0.5">
                            评分：4.8 / 5.0 · 评价：优秀实践团队
                          </p>
                          <div className="flex gap-0.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-3.5 h-3.5',
                                  i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-amber-400 fill-amber-400'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="status-badge bg-success-50 text-success-600">已认证</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-success-50 to-emerald-50 rounded-xl p-4 border border-success-200/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success-500 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-success-800">学分已认定</p>
                        <p className="text-xs text-success-600 mt-0.5">
                          计算机学院团委 · 李伟老师 · 2026年7月15日 审核通过
                        </p>
                        <p className="text-xs text-success-700 mt-1.5">
                          已同步至第二课堂成绩单系统，可在「我的成绩」中查看
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
