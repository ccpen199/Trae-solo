import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Team } from '../../types';
import type { LucideIcon } from 'lucide-react';
import { mockStudents } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import {
  Award,
  RefreshCw,
  Upload,
  Download,
  CheckCircle,
  Clock,
  Search,
  Filter,
  User,
  X,
  ChevronDown,
  ChevronRight,
  Eye,
  MapPin,
  BookOpen,
  FileText,
  Users,
  Building2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

type TabKey = 'team' | 'individual';

const creditProgressMap: Record<
  string,
  { label: string; color: string; step: number }
> = {
  not_started: { label: '未开始', color: 'text-gray-400', step: 0 },
  hours_collecting: { label: '时长收集中', color: 'text-blue-500', step: 1 },
  hours_confirmed: { label: '时长已确认', color: 'text-blue-600', step: 2 },
  dept_reviewing: { label: '院系审核中', color: 'text-purple-500', step: 3 },
  credited: { label: '已认定', color: 'text-green-600', step: 4 },
  rejected: { label: '已驳回', color: 'text-red-500', step: -1 },
};

const CreditManagement = () => {
  const navigate = useNavigate();
  const { teams, updateTeam, checkIns, logs } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('team');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [reviewTeam, setReviewTeam] = useState<Team | null>(null);
  const [reviewOpinion, setReviewOpinion] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    members: false,
    checkins: false,
    logs: false,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const pendingTeams = useMemo(() => {
    return teams.filter(
      (t) =>
        t.status === 'completed' ||
        (t.creditProgress && t.creditProgress !== 'not_started')
    );
  }, [teams]);

  const teamCheckIns = useMemo(() => {
    if (!reviewTeam) return [];
    return checkIns.filter((c) => c.teamId === reviewTeam.id);
  }, [reviewTeam, checkIns]);

  const teamLogs = useMemo(() => {
    if (!reviewTeam) return [];
    return logs.filter((l) => l.teamId === reviewTeam.id);
  }, [reviewTeam, logs]);

  const suggestedCredits = useMemo(() => {
    if (!reviewTeam) return 0;
    const totalHours = reviewTeam.totalServiceHours || 0;
    return Math.min(Math.floor(totalHours / 50) * 1 + 2, 8);
  }, [reviewTeam]);

  const reviewedTeams = useMemo(() => {
    return teams
      .filter((t) => t.creditProgress === 'credited' || t.creditProgress === 'rejected')
      .sort((a, b) => {
        const timeA = a.creditReviewTime || '';
        const timeB = b.creditReviewTime || '';
        return timeB.localeCompare(timeA);
      })
      .slice(0, 10);
  }, [teams]);

  const filteredTeams = pendingTeams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || team.creditProgress === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const creditRecords = [
    { id: '1', student: mockStudents[0], teamId: '1', teamName: '乡村振兴实践团', course: '暑期三下乡社会实践', hours: 128, credits: 6.5, status: 'approved', applyDate: '2024-08-20', approver: '王老师' },
    { id: '2', student: mockStudents[1], teamId: '1', teamName: '乡村振兴实践团', course: '社区志愿服务', hours: 96, credits: 4.8, status: 'pending', applyDate: '2024-08-22', approver: '-' },
    { id: '3', student: mockStudents[2], teamId: '5', teamName: '数字助农先锋团', course: '企业实习实践', hours: 156, credits: 7.8, status: 'approved', applyDate: '2024-08-15', approver: '李老师' },
    { id: '4', student: mockStudents[3], teamId: '4', teamName: '社区服务小分队', course: '农业技术推广', hours: 210, credits: 10.5, status: 'approved', applyDate: '2024-08-18', approver: '张老师' },
  ];

  const statusMap: Record<string, { label: string; color: string; icon: LucideIcon }> = {
    pending: { label: '待认定', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { label: '已认定', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-700', icon: Clock },
  };

  const filteredRecords = creditRecords.filter((record) => {
    const matchesSearch =
      record.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student.studentId.includes(searchTerm) ||
      record.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalApplicants = pendingTeams.reduce((sum, t) => sum + t.members.length, 0);
  const totalCredits = reviewedTeams
    .filter((t) => t.creditProgress === 'credited')
    .reduce((sum, t) => sum + (t.creditAmount || 0), 0);
  const totalHours = pendingTeams.reduce((sum, t) => sum + (t.totalServiceHours || 0), 0);
  const passRate =
    reviewedTeams.length > 0
      ? (
          (reviewedTeams.filter((t) => t.creditProgress === 'credited').length /
            reviewedTeams.length) *
          100
        ).toFixed(1)
      : '0';

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleReview = (team: Team) => {
    setReviewTeam(team);
    setReviewOpinion('');
    setExpandedSections({ members: false, checkins: false, logs: false });
  };

  const handleReject = () => {
    if (!reviewTeam) return;
    if (!reviewOpinion.trim()) {
      alert('请填写驳回原因');
      return;
    }
    setSubmitLoading(true);
    setTimeout(() => {
      updateTeam(reviewTeam.id, {
        creditProgress: 'rejected',
        creditReviewer: '教务处-当前管理员',
        creditReviewTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        departmentRejectReason: reviewOpinion,
      });
      setSubmitLoading(false);
      setReviewTeam(null);
      setReviewOpinion('');
    }, 500);
  };

  const handleApprove = () => {
    if (!reviewTeam) return;
    setSubmitLoading(true);
    setTimeout(() => {
      updateTeam(reviewTeam.id, {
        creditProgress: 'credited',
        creditAmount: suggestedCredits,
        creditReviewer: '教务处-当前管理员',
        creditReviewTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      });
      setSubmitLoading(false);
      setReviewTeam(null);
      setReviewOpinion('');
    }, 500);
  };

  const navigateToTeam = (teamId: string) => {
    window.location.assign(`/sanxiaxiang/teams?teamId=${teamId}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">学分认定工作台</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">团队申报</span>
                <span className="text-red-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">打卡+日志</span>
                <span className="text-red-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">时长确认</span>
                <span className="text-red-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full ring-2 ring-red-400">审核认定</span>
                <span className="text-red-300">→</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-200 text-green-800 text-xs font-medium rounded-full">第二课堂成绩单</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/sanxiaxiang/teams')} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              <Users className="w-4 h-4" />
              团队申报
            </button>
            <button onClick={() => navigate('/admin/departments')} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
              <Building2 className="w-4 h-4" />
              院系管理
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">教育部实践学分对接标准</h2>
            <p className="text-blue-100 text-sm mt-1">
              依据《普通高等学校学生管理规定》，学生在校期间需完成不少于100小时社会实践，
              认定学分为第二课堂成绩单重要组成部分
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-colors">
              <RefreshCw className="w-4 h-4" />
              同步数据
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors">
              <Upload className="w-4 h-4" />
              上报教育部
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalApplicants}</p>
              <p className="text-xs text-gray-500">本学期申请人数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalCredits.toFixed(1)}</p>
              <p className="text-xs text-gray-500">认定总学分</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalHours}</p>
              <p className="text-xs text-gray-500">总服务时长</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{passRate}%</p>
              <p className="text-xs text-gray-500">认定通过率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'team'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          团队学分认定
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'individual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          个人学分记录
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'team' ? '搜索团队名称、项目、院系...' : '搜索学生姓名、学号、实践项目...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              {activeTab === 'team' ? (
                Object.entries(creditProgressMap).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="pending">待认定</option>
                  <option value="approved">已认定</option>
                  <option value="rejected">已驳回</option>
                </>
              )}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    团队名称
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    院系
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    成员数
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    累计服务时长
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    打卡次数
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    日志数
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    学分进度
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeams.map((team) => {
                  const progress = creditProgressMap[team.creditProgress || 'not_started'];
                  const showReviewButton =
                    team.creditProgress === 'hours_confirmed' ||
                    team.creditProgress === 'dept_reviewing';
                  return (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{team.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {team.projectName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{team.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {team.members.length}人
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {team.totalServiceHours || 0}小时
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{team.checkInCount}次</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{team.logCount}篇</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Award className={`w-4 h-4 ${progress.color}`} />
                            <span className={`text-xs font-medium ${progress.color}`}>
                              {progress.label}
                            </span>
                          </div>
                          <div className="flex gap-0.5 w-24">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-1.5 flex-1 rounded-full ${
                                  (progress.step || 0) >= step
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                                }`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {showReviewButton && (
                          <button
                            onClick={() => handleReview(team)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            审核
                          </button>
                        )}
                        {team.creditProgress === 'credited' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" />
                            {team.creditAmount}学分
                          </span>
                        )}
                        {team.creditProgress === 'rejected' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3" />
                            已驳回
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              最近审核记录
            </h3>
            <div className="space-y-4">
              {reviewedTeams.map((team, index) => (
                <div key={team.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        team.creditProgress === 'credited'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    ></div>
                    {index < reviewedTeams.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-800">{team.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            team.creditProgress === 'credited'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {team.creditProgress === 'credited' ? (
                            <ThumbsUp className="w-3 h-3" />
                          ) : (
                            <ThumbsDown className="w-3 h-3" />
                          )}
                          {team.creditProgress === 'credited' ? '通过' : '驳回'}
                        </span>
                        {team.creditProgress === 'credited' && team.creditAmount && (
                          <span className="text-sm font-bold text-green-600">
                            {team.creditAmount}学分
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{team.creditReviewer}</p>
                        <p className="text-xs text-gray-400">{team.creditReviewTime}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{team.projectName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  学生信息
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  实践项目
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  服务时长
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  认定学分
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  申请日期
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  审核人
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  来源追溯
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {record.student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {record.student.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.student.studentId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{record.course}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700">
                      {record.hours}小时
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600">
                      {record.credits}学分
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{record.applyDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                        statusMap[record.status].color
                      }`}
                    >
                      {(() => {
                        const IconComponent = statusMap[record.status].icon;
                        return IconComponent ? (
                          <IconComponent className="w-3 h-3" />
                        ) : null;
                      })()}
                      {statusMap[record.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{record.approver}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigateToTeam(record.teamId)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      查看详情
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  学分认定审核
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reviewTeam.name} · {reviewTeam.projectName}
                </p>
              </div>
              <button
                onClick={() => !submitLoading && setReviewTeam(null)}
                disabled={submitLoading}
                className="p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('members')}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        成员学籍表 ({reviewTeam.members.length}人)
                      </span>
                    </div>
                    {expandedSections.members ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.members && (
                    <div className="border-l-2 border-blue-200 pl-4 p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-gray-500 border-b border-gray-100">
                            <th className="text-left py-2">姓名</th>
                            <th className="text-left py-2">学号</th>
                            <th className="text-left py-2">院系</th>
                            <th className="text-left py-2">专业</th>
                            <th className="text-left py-2">年级</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reviewTeam.members.map((member) => (
                            <tr key={member.id} className="text-sm">
                              <td className="py-2 text-gray-800">{member.name}</td>
                              <td className="py-2 text-gray-600">{member.studentId}</td>
                              <td className="py-2 text-gray-600">{member.department}</td>
                              <td className="py-2 text-gray-600">{member.major}</td>
                              <td className="py-2 text-gray-600">{member.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('checkins')}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        打卡记录列表 ({teamCheckIns.length}条)
                      </span>
                    </div>
                    {expandedSections.checkins ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.checkins && (
                    <div className="border-l-2 border-blue-200 pl-4 p-4 space-y-3">
                      {teamCheckIns.length === 0 ? (
                        <p className="text-sm text-gray-400">暂无打卡记录</p>
                      ) : (
                        teamCheckIns.map((checkin) => (
                          <div
                            key={checkin.id}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {checkin.authorName || '未知用户'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {checkin.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {checkin.location}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {checkin.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection('logs')}
                    className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">
                        日志列表 ({teamLogs.length}篇)
                      </span>
                    </div>
                    {expandedSections.logs ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.logs && (
                    <div className="border-l-2 border-blue-200 pl-4 p-4 space-y-3">
                      {teamLogs.length === 0 ? (
                        <p className="text-sm text-gray-400">暂无日志记录</p>
                      ) : (
                        teamLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">
                                  {log.author}
                                </span>
                                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {log.serviceHours}小时
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {log.date}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {log.summary || log.content}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.keywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  学分认定标准表
                </h3>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                        累计服务时长
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                        认定学分
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                        说明
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-2 text-gray-700">100小时</td>
                      <td className="px-4 py-2 text-gray-700">2学分</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">基础学分</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">150小时</td>
                      <td className="px-4 py-2 text-gray-700">3学分</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">每增加50小时+1学分</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">200小时</td>
                      <td className="px-4 py-2 text-gray-700">4学分</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">每增加50小时+1学分</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">300小时及以上</td>
                      <td className="px-4 py-2 text-gray-700">8学分</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">最高学分上限</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      团队累计服务时长
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {reviewTeam.totalServiceHours || 0} 小时
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">建议认定学分</p>
                    <p className="text-3xl font-bold text-green-600">
                      {suggestedCredits}
                      <span className="text-sm font-normal text-green-600 ml-1">学分</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  计算公式：Math.min(Math.floor({reviewTeam.totalServiceHours || 0} / 50) * 1 + 2, 8) = {suggestedCredits}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  审核意见
                </label>
                <textarea
                  value={reviewOpinion}
                  onChange={(e) => setReviewOpinion(e.target.value)}
                  placeholder="请填写审核意见（驳回时必填）"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 inline mr-1 text-yellow-500" />
                审核结果将自动通知团队所有成员
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={submitLoading}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  {submitLoading ? '提交中...' : '驳回'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitLoading}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {submitLoading ? '提交中...' : '认定通过'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagement;
