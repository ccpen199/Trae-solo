import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Download,
  Printer,
  Award,
  CheckCircle,
  Clock,
  FileCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Heart,
  Lightbulb,
  Trophy,
  Star,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { mockCreditApplications } from '@/mock/credits';
import { useAuthStore } from '@/store/useAuthStore';
import { CreditStatus } from '@/constants/enums';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

const creditCategories = [
  { key: 'all', label: '全部记录', icon: FileCheck },
  { key: 'social_practice', label: '社会实践', icon: Users, color: 'text-primary-600 bg-primary-50' },
  { key: 'volunteer', label: '志愿服务', icon: Heart, color: 'text-rose-600 bg-rose-50' },
  { key: 'innovation', label: '创新创业', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { key: 'culture', label: '文体活动', icon: Trophy, color: 'text-purple-600 bg-purple-50' },
  { key: 'ideology', label: '思政素养', icon: Star, color: 'text-rose-600 bg-rose-50' },
  { key: 'skill', label: '技能培训', icon: Award, color: 'text-green-600 bg-green-50' },
];

const categoryProgress = [
  { key: 'social_practice', label: '社会实践', earned: 9, required: 6, icon: Users, color: 'from-blue-500 to-blue-600' },
  { key: 'volunteer', label: '志愿服务', earned: 4, required: 4, icon: Heart, color: 'from-rose-500 to-rose-600' },
  { key: 'innovation', label: '创新创业', earned: 3, required: 4, icon: Lightbulb, color: 'from-amber-500 to-amber-600' },
  { key: 'culture', label: '文体活动', earned: 2, required: 2, icon: Trophy, color: 'from-purple-500 to-purple-600' },
  { key: 'ideology', label: '思政素养', earned: 5, required: 4, icon: Star, color: 'from-rose-500 to-rose-600' },
  { key: 'skill', label: '技能培训', earned: 2, required: 2, icon: Award, color: 'from-green-500 to-green-600' },
];

const reviewRecords = [
  { id: 'r1', time: '2026-05-20 14:30', reviewer: '李伟', department: '计算机学院团委', action: '首次认定', status: 'approved' },
  { id: 'r2', time: '2026-04-15 09:15', reviewer: '王芳', department: '校实践中心', action: '校级复核', status: 'approved' },
  { id: 'r3', time: '2026-03-10 16:45', reviewer: '李伟', department: '计算机学院团委', action: '补录认定', status: 'approved', note: '补充2025年暑期支教材料' },
];

export default function Transcript() {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalEarned = categoryProgress.reduce((acc, c) => acc + c.earned, 0);
  const totalRequired = categoryProgress.reduce((acc, c) => acc + c.required, 0);
  const progressPercent = Math.round((totalEarned / totalRequired) * 100);

  const filteredRecords = mockCreditApplications.filter(
    (c) => activeCategory === 'all' || c.type === activeCategory
  );

  const approvedRecords = filteredRecords.filter((r) => r.status === 'approved');
  const pendingRecords = filteredRecords.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary-600" />
            第二课堂成绩单
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            教育部高校共青团第二课堂成绩单制度 · 学籍系统对接
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" />
            打印
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">官方认证成绩单</h2>
                <p className="text-white/70 text-sm">教育部高校共青团第二课堂学分系统对接</p>
              </div>
              <div className="ml-auto text-right">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  学籍已认证
                </span>
                <p className="text-white/60 text-xs mt-1">学号：{user?.studentId || '2023010101'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6">
              <div>
                <p className="text-white/70 text-sm">总学分</p>
                <p className="text-4xl font-bold font-mono mt-1">{totalEarned}</p>
                <p className="text-white/60 text-xs mt-0.5">/ {totalRequired} 学分</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">完成度</p>
                <p className="text-4xl font-bold font-mono mt-1">{progressPercent}%</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-white/70 text-sm">已认定记录</p>
                <p className="text-4xl font-bold font-mono mt-1">{approvedRecords.length}</p>
                <p className="text-white/60 text-xs mt-0.5">项有效学分</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">待审核</p>
                <p className="text-4xl font-bold font-mono mt-1">{pendingRecords.length}</p>
                <p className="text-white/60 text-xs mt-0.5">项等待认定</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-surface-100 bg-surface-50/50">
          <div className="grid grid-cols-4 gap-6 text-sm">
            <div>
              <span className="text-surface-500">姓名：</span>
              <span className="font-medium text-surface-800">{user?.name || '张明'}</span>
            </div>
            <div>
              <span className="text-surface-500">学号：</span>
              <span className="font-mono font-medium text-surface-800">{user?.studentId || '2023010101'}</span>
            </div>
            <div>
              <span className="text-surface-500">院系：</span>
              <span className="font-medium text-surface-800">{user?.department || '计算机学院'}</span>
            </div>
            <div>
              <span className="text-surface-500">入学年份：</span>
              <span className="font-medium text-surface-800">2023级</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent-500" />
          分类学分进度
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryProgress.map((cat) => {
            const percent = Math.min(100, Math.round((cat.earned / cat.required) * 100));
            const isComplete = cat.earned >= cat.required;
            return (
              <div
                key={cat.key}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  isComplete ? 'border-success-200 bg-success-50/50' : 'border-surface-200 bg-white'
                )}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    cat.color.replace('text-', 'bg-').replace('600', '500') + ' text-white'
                  )}>
                    <cat.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">{cat.label}</p>
                    <p className="text-xs text-surface-500">需 {cat.required} 学分</p>
                  </div>
                  {isComplete && (
                    <CheckCircle className="w-4.5 h-4.5 text-success-500 ml-auto" />
                  )}
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold font-mono text-surface-800">
                    {cat.earned}
                    <span className="text-xs text-surface-400 font-normal"> / {cat.required}</span>
                  </p>
                  <span className={cn(
                    'text-xs font-medium',
                    isComplete ? 'text-success-600' : 'text-surface-500'
                  )}>
                    {percent}%
                  </span>
                </div>
                <div className="w-full bg-surface-100 h-1.5 rounded-full mt-2">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r', cat.color.replace('text-', ''))}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            学分明细记录
          </h3>
          <span className="text-xs text-surface-500">共 {filteredRecords.length} 条记录</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {creditCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                activeCategory === cat.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const cat = categoryProgress.find((c) => c.key === record.type);
            const isExpanded = expandedId === record.id;
            return (
              <motion.div
                key={record.id}
                layout
                className="border border-surface-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-surface-50 transition-colors text-left"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    cat?.color || 'bg-surface-100 text-surface-600'
                  )}>
                    {cat?.icon ? <cat.icon className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 truncate">{record.relatedName}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(record.applyTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {record.department || '校团委'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold font-mono text-surface-800">
                      +{record.creditHours}
                      <span className="text-xs text-surface-400 font-normal ml-0.5">学分</span>
                    </p>
                    <span className={cn('status-badge text-[10px]', CreditStatus[record.status as keyof typeof CreditStatus]?.color)}>
                      {CreditStatus[record.status as keyof typeof CreditStatus]?.label}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-surface-400 shrink-0"
                  >
                    <ChevronDown className="w-4.5 h-4.5" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-surface-100 bg-surface-50/50">
                        <div className="pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-surface-500 text-xs mb-1">学分类型</p>
                              <p className="font-medium text-surface-800">{cat?.label || record.type}</p>
                            </div>
                            <div>
                              <p className="text-surface-500 text-xs mb-1">认定学分数</p>
                              <p className="font-mono font-bold text-surface-800">{record.creditHours} 学分</p>
                            </div>
                            <div>
                              <p className="text-surface-500 text-xs mb-1">申请时间</p>
                              <p className="text-surface-800">{formatDate(record.applyTime)}</p>
                            </div>
                            <div>
                              <p className="text-surface-500 text-xs mb-1">认定时间</p>
                              <p className="text-surface-800">{record.auditTime ? formatDate(record.auditTime) : '—'}</p>
                            </div>
                            <div>
                              <p className="text-surface-500 text-xs mb-1">认定部门</p>
                              <p className="text-surface-800">{record.department || '计算机学院团委'}</p>
                            </div>
                            <div>
                              <p className="text-surface-500 text-xs mb-1">审核人</p>
                              <p className="text-surface-800">{record.auditor || '李伟'}</p>
                            </div>
                          </div>

                          {record.description && (
                            <div>
                              <p className="text-surface-500 text-xs mb-1">成果说明</p>
                              <p className="text-sm text-surface-700 bg-white p-2.5 rounded-lg border border-surface-100">
                                {record.description}
                              </p>
                            </div>
                          )}

                          {record.feedback && (
                            <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                              <p className="text-xs text-success-600 font-medium mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                认定意见
                              </p>
                              <p className="text-sm text-success-700">{record.feedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-500" />
          院系认定复查记录
        </h3>
        <div className="space-y-3">
          {reviewRecords.map((record, index) => (
            <div
              key={record.id}
              className="flex gap-4 p-3 rounded-xl bg-surface-50 border border-surface-100"
            >
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-surface-200 text-surface-500'
                )}>
                  {index === 0 ? <CheckCircle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                </div>
                {index < reviewRecords.length - 1 && (
                  <div className="w-0.5 flex-1 bg-surface-200 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-surface-800 text-sm">{record.action}</p>
                  <span className="text-xs text-surface-400">{record.time}</span>
                </div>
                <p className="text-xs text-surface-500 mt-0.5">
                  {record.department} · {record.reviewer}
                </p>
                {record.note && (
                  <p className="text-xs text-surface-600 mt-2 bg-white px-2.5 py-2 rounded-lg border border-surface-100">
                    {record.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-surface-100 to-surface-50 rounded-2xl p-5 border border-surface-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <ExternalLink className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-surface-800 text-sm">教育部第二课堂学分对接标准</h4>
            <p className="text-xs text-surface-500 mt-1 leading-relaxed">
              本平台已完成教育部高校共青团"第二课堂成绩单"制度数据标准对接，支持学分数据实时同步至全国高校共青团第二课堂学分手册系统。
              数据符合《高校共青团"第二课堂成绩单"制度实施指导意见》《普通高等学校学生管理规定》等文件要求，
              成绩单可作为评优评先、推优入党、就业推荐的重要依据。
            </p>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-surface-600">
                <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                数据标准达标
              </div>
              <div className="flex items-center gap-1.5 text-xs text-surface-600">
                <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                学籍系统对接
              </div>
              <div className="flex items-center gap-1.5 text-xs text-surface-600">
                <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                校级数据看板
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
