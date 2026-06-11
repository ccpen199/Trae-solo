import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Download,
  Trophy,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Award,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockExams, mockExamRegistrations } from '@/mock/data';
import { formatCurrency, formatDate, getStatusText, getStatusColor } from '@/utils/format';
import type { ExamInfo, ExamRegistration } from '@/types';

type TabType = 'list' | 'registration';

const examTypeFilters = ['全部', '职业资格', '执业资格', '专业技术', '职业水平'];

const getExamStatusText = (status: string): string => {
  const map: Record<string, string> = {
    not_started: '未开始',
    registering: '报名中',
    closed: '已结束',
    examining: '考试中',
    finished: '已完成',
  };
  return map[status] || getStatusText(status);
};

const getExamStatusBadgeClass = (status: string): string => {
  const colorMap: Record<string, string> = {
    not_started: 'bg-neutral-100 text-neutral-500',
    registering: 'bg-purple-500/10 text-purple-600',
    closed: 'bg-neutral-100 text-neutral-500',
    examining: 'bg-primary-500/10 text-primary-500',
    finished: 'bg-success-500/10 text-success-500',
    pending: 'bg-warning-500/10 text-warning-500',
    approved: 'bg-success-500/10 text-success-500',
    rejected: 'bg-danger-500/10 text-danger-500',
  };
  return colorMap[status] || 'bg-neutral-100 text-neutral-500';
};

const getStatusIcon = (status: string) => {
  if (status === 'approved' || status === 'finished' || status === 'registering') {
    return <CheckCircle className="w-3 h-3" />;
  }
  if (status === 'rejected') {
    return <XCircle className="w-3 h-3" />;
  }
  if (status === 'pending' || status === 'not_started' || status === 'examining') {
    return <Clock className="w-3 h-3" />;
  }
  return <AlertCircle className="w-3 h-3" />;
};

const ExamCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');

  const tabs = [
    { key: 'list', label: '考试列表', icon: BookOpen },
    { key: 'registration', label: '我的报名', icon: ClipboardList },
  ];

  const stats = useMemo(() => {
    const registeringCount = mockExams.filter((e) => e.status === 'registering').length;
    const registeredCount = mockExamRegistrations.length;
    const finishedCount = mockExamRegistrations.filter((r) => r.score !== undefined).length;
    return { registeringCount, registeredCount, finishedCount };
  }, []);

  const filteredExams = useMemo(() => {
    return mockExams.filter((exam) => {
      const matchKeyword = exam.name.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchType = typeFilter === '全部' || exam.examType === typeFilter;
      return matchKeyword && matchType;
    });
  }, [searchKeyword, typeFilter]);

  const getExamTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      '职业资格': 'bg-blue-100 text-blue-600',
      '执业资格': 'bg-purple-100 text-purple-600',
      '专业技术': 'bg-emerald-100 text-emerald-600',
      '职业水平': 'bg-amber-100 text-amber-600',
    };
    return colorMap[type] || 'bg-neutral-100 text-neutral-500';
  };

  const getActionButton = (exam: ExamInfo) => {
    if (exam.status === 'registering') {
      return (
        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
          立即报名
        </Button>
      );
    }
    if (exam.status === 'not_started') {
      return (
        <Button size="sm" variant="outline" disabled>
          即将开始
        </Button>
      );
    }
    return (
      <Button size="sm" variant="secondary">
        查看详情
      </Button>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white pb-20">
        <div className="container mx-auto px-4 pt-6">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">人事考试中心</h1>
              <p className="text-sm text-white/70">考试报名 · 成绩查询 · 证书管理</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">可报名考试</span>
              </div>
              <p className="text-2xl font-bold">{stats.registeringCount}</p>
              <p className="text-xs text-white/60 mt-1">正在报名中</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">已报名考试</span>
              </div>
              <p className="text-2xl font-bold">{stats.registeredCount}</p>
              <p className="text-xs text-white/60 mt-1">报名记录</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">已完成考试</span>
              </div>
              <p className="text-2xl font-bold">{stats.finishedCount}</p>
              <p className="text-xs text-white/60 mt-1">已出成绩</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-14 relative z-10">
        <Card padding="none" className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="border-b border-neutral-100">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 ${
                    activeTab === tab.key
                      ? 'text-purple-600'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'list' && (
            <div className="p-5">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="搜索考试名称..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {examTypeFilters.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-4 py-2 text-sm rounded-xl transition-all ${
                        typeFilter === type
                          ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredExams.map((exam, index) => (
                  <Card
                    key={exam.id}
                    hover
                    className="animate-fade-in-up overflow-hidden"
                    style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 -mx-5 -mt-5 mb-4" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-700 mb-2 line-clamp-1">{exam.name}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getExamTypeColor(exam.examType)}`}>
                          {exam.examType}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${getExamStatusBadgeClass(exam.status)} flex-shrink-0 ml-3`}>
                        {getStatusIcon(exam.status)}
                        {getExamStatusText(exam.status)}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>报名时间：</span>
                        <span className="text-neutral-600">
                          {formatDate(exam.registerStartTime)} - {formatDate(exam.registerEndTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>考试时间：</span>
                        <span className="text-neutral-600">{formatDate(exam.examDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        <span>报名费用：</span>
                        <span className="text-purple-600 font-semibold">¥{formatCurrency(exam.examFee, 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <span className="text-xs text-neutral-400">
                        {exam.totalQuestions && `${exam.totalQuestions}道题 · `}
                        {exam.duration && `${exam.duration}分钟`}
                      </span>
                      {getActionButton(exam)}
                    </div>
                  </Card>
                ))}
              </div>

              {filteredExams.length === 0 && (
                <div className="py-16 text-center">
                  <Search className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-400">未找到相关考试</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="p-5">
              <div className="space-y-4">
                {mockExamRegistrations.map((registration, index) => (
                  <Card
                    key={registration.id}
                    hover
                    className="animate-fade-in-up overflow-hidden"
                    style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-neutral-700 line-clamp-1">{registration.examName}</h3>
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${getExamStatusBadgeClass(registration.status)} flex-shrink-0 ml-3`}>
                            {getStatusIcon(registration.status)}
                            {getStatusText(registration.status)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mb-3">
                          报名号：{registration.registrationNo}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span>报名时间：{formatDate(registration.registerDate)}</span>
                          </div>
                          {registration.examRoom && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-purple-400" />
                              <span>{registration.examRoom} {registration.seatNo}</span>
                            </div>
                          )}
                          {registration.score !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <Trophy className="w-4 h-4 text-amber-500" />
                              <span className="text-amber-600 font-semibold">成绩：{registration.score}分</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-neutral-100">
                      {registration.ticketUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Download className="w-4 h-4" />}
                        >
                          准考证下载
                        </Button>
                      )}
                      {registration.score !== undefined && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                          icon={<Trophy className="w-4 h-4" />}
                        >
                          成绩查询
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        查看详情
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {mockExamRegistrations.length === 0 && (
                <div className="py-16 text-center">
                  <ClipboardList className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
                  <p className="text-neutral-400">暂无报名记录</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExamCenter;
