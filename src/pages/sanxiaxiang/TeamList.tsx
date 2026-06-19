import { useState, useMemo, useEffect } from 'react';
import type { Team } from '../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockStudents, mockAdvisors } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Users,
  X,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck2,
  UserPlus,
  AlertCircle,
  Award,
  BookOpen,
  MessageSquare,
  User,
  MapPin,
  FileText,
} from 'lucide-react';

const statusMap: Record<
  string,
  { label: string; color: string; desc: string }
> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600', desc: '未提交' },
  pending: { label: '待提交', color: 'bg-gray-100 text-gray-700', desc: '等待学生提交' },
  advisor_reviewing: {
    label: '指导老师审核中',
    color: 'bg-blue-100 text-blue-700',
    desc: '指导老师审核',
  },
  advisor_rejected: {
    label: '指导老师驳回',
    color: 'bg-red-100 text-red-700',
    desc: '指导老师退回',
  },
  dept_reviewing: {
    label: '院系审核中',
    color: 'bg-purple-100 text-purple-700',
    desc: '院系管理员审核',
  },
  dept_rejected: {
    label: '院系驳回',
    color: 'bg-rose-100 text-rose-700',
    desc: '院系管理员退回',
  },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700', desc: '院系已通过' },
  ongoing: { label: '实践进行中', color: 'bg-blue-100 text-blue-600', desc: '正在开展' },
  completed: { label: '已完成', color: 'bg-cyan-100 text-cyan-700', desc: '实践结束' },
  certified: {
    label: '成果已认证',
    color: 'bg-emerald-100 text-emerald-700',
    desc: '成果认证通过',
  },
};

const creditProgressMap: Record<
  string,
  { label: string; color: string; step: number }
> = {
  not_started: { label: '未启动', color: 'text-gray-400', step: 0 },
  hours_collecting: { label: '时长累计中', color: 'text-blue-500', step: 1 },
  hours_confirmed: { label: '时长已确认', color: 'text-blue-600', step: 2 },
  dept_reviewing: { label: '院系审核中', color: 'text-purple-500', step: 3 },
  credited: { label: '学分已认定', color: 'text-green-600', step: 4 },
  rejected: { label: '认定驳回', color: 'text-red-500', step: -1 },
};

const TeamList = () => {
  const { teams, addTeam } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Team | null>(null);

  const urlParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      dept: params.get('dept'),
      base: params.get('base'),
      action: params.get('action'),
    };
  }, [location.search]);

  const hasUrlFilter = urlParams.dept || urlParams.base;

  useEffect(() => {
    if (urlParams.action === 'create') {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [urlParams.action]);

  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    department: '计算机学院',
    leaderId: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    advisorId: '',
    memberIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leaderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    const matchesDept = !urlParams.dept || team.department === urlParams.dept;
    const matchesBase = !urlParams.base || team.location.includes(urlParams.base);
    return matchesSearch && matchesStatus && matchesDept && matchesBase;
  });

  const leaderStudent = formData.leaderId
    ? mockStudents.find((s) => s.id === formData.leaderId)
    : null;

  const handleAddMember = (stuId: string) => {
    if (formData.memberIds.includes(stuId)) return;
    setFormData((prev) => ({
      ...prev,
      memberIds: [...prev.memberIds, stuId],
    }));
  };
  const handleRemoveMember = (stuId: string) => {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => id !== stuId),
    }));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = '请填写团队名称';
    if (!formData.projectName.trim()) errs.projectName = '请填写项目名称';
    if (!formData.leaderId) errs.leaderId = '请选择队长（自动关联学籍）';
    if (!formData.advisorId) errs.advisorId = '请选择指导老师';
    if (!formData.location.trim()) errs.location = '请填写实践地点';
    if (!formData.startDate) errs.startDate = '请选择开始日期';
    if (!formData.endDate) errs.endDate = '请选择结束日期';
    if (formData.description.trim().length < 20)
      errs.description = '项目简介至少20个字';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitTeam = (submitForReview: boolean) => {
    if (!validateForm()) return;
    if (!leaderStudent) return;
    const members = [
      leaderStudent,
      ...formData.memberIds
        .map((id) => mockStudents.find((s) => s.id === id))
        .filter(Boolean) as any,
    ];
    const advisor = mockAdvisors.find((a) => a.id === formData.advisorId);

    const newTeam: Omit<Team, 'id'> = {
      name: formData.name,
      projectName: formData.projectName,
      department: leaderStudent.department,
      leaderId: leaderStudent.id,
      leaderName: leaderStudent.name,
      members,
      status: submitForReview ? 'advisor_reviewing' : 'draft',
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      description: formData.description,
      checkInCount: 0,
      logCount: 0,
      advisorId: advisor?.id,
      advisorName: advisor?.name,
      applyTime: new Date()
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19),
      advisorStatus: submitForReview ? 'pending' : undefined,
      departmentStatus: undefined,
      creditProgress: 'not_started',
      certificationStatus: 'not_started',
      totalServiceHours: 0,
      allKeywords: [],
      teamAchievements: [],
    };
    addTeam(newTeam);
    setShowCreateModal(false);
    setFormData({
      name: '',
      projectName: '',
      department: '计算机学院',
      leaderId: '',
      location: '',
      startDate: '',
      endDate: '',
      description: '',
      advisorId: '',
      memberIds: [],
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* URL参数过滤提示条 - 强化醒目版本 */}
      {hasUrlFilter && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 text-blue-900 px-5 py-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-blue-900">
                📍 数据来源追溯：「{urlParams.dept || urlParams.base}」
              </p>
              <p className="text-sm text-blue-700 mt-0.5">
                共筛选出 <span className="font-bold">{filteredTeams.length}</span> 支团队
                <span className="mx-2 text-blue-400">|</span>
                可直接查看学籍、成员、打卡、日志证据链
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sanxiaxiang/checkin')}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              查看打卡记录
            </button>
            <button
              onClick={() => navigate('/sanxiaxiang/logs')}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              查看实践日志
            </button>
            <button
              onClick={() => navigate('/sanxiaxiang/teams')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 顶部操作栏 - 强化版本 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索团队名称、项目、负责人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 h-11 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
              >
                <option value="all">全部状态</option>
                {Object.entries(statusMap).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sanxiaxiang/checkin')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <MapPin className="w-4 h-4" />
              行程打卡
            </button>
            <button
              onClick={() => navigate('/sanxiaxiang/logs')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-100 transition-colors border border-orange-200"
            >
              <FileText className="w-4 h-4" />
              实践日志
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              新建团队申报
            </button>
          </div>
        </div>
      </div>

      {/* 状态概览卡片 */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(statusMap).map(([key, val]) => {
          const count = teams.filter((t) => t.status === key).length;
          if (count === 0 && ['draft', 'pending'].includes(key)) return null;
          return (
            <div
              key={key}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === key
                  ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
              onClick={() =>
                setStatusFilter(statusFilter === key ? 'all' : key)
              }
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${val.color}`}>
                  {val.label}
                </span>
                <span className="text-2xl font-bold text-gray-800">{count}</span>
              </div>
              <p className="text-xs text-gray-400">{val.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 团队表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  团队 / 项目
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  指导老师
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  审核流程
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  驳回原因
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  学分认定
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  成果认证
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  证据链
                </th>
                <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTeams.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {team.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            statusMap[team.status].color
                          }`}
                        >
                          {statusMap[team.status].label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 max-w-[240px] truncate">
                        {team.projectName}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {team.members.length}人
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {team.leaderName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">
                          {team.department}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {team.advisorName ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {team.advisorName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {team.advisorStatus === 'approved' && (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-600">
                                已同意
                              </span>
                            </>
                          )}
                          {team.advisorStatus === 'rejected' && (
                            <>
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-600">
                                已驳回
                              </span>
                            </>
                          )}
                          {team.advisorStatus === 'pending' && (
                            <>
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                审核中
                              </span>
                            </>
                          )}
                          {team.advisorStatus === undefined && (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">未分配</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      {/* 指导老师步骤 */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${
                            team.advisorStatus === 'approved'
                              ? 'bg-green-500'
                              : team.advisorStatus === 'rejected'
                              ? 'bg-red-500'
                              : ['advisor_reviewing', 'dept_reviewing', 'approved', 'ongoing', 'completed', 'certified'].includes(
                                  team.status
                                )
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {team.advisorStatus === 'approved' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : team.advisorStatus === 'rejected' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <span className="text-[8px]">1</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          指导老师审核
                        </span>
                        {team.advisorOpinion && (
                          <div className="group relative">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
                              {team.advisorOpinion}
                              <div className="absolute -bottom-1 left-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* 院系步骤 */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${
                            team.departmentStatus === 'approved'
                              ? 'bg-green-500'
                              : team.departmentStatus === 'rejected'
                              ? 'bg-red-500'
                              : ['dept_reviewing', 'approved', 'ongoing', 'completed', 'certified'].includes(
                                  team.status
                                )
                              ? 'bg-purple-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          {team.departmentStatus === 'approved' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : team.departmentStatus === 'rejected' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <span className="text-[8px]">2</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">院系管理员审核</span>
                        {team.departmentOpinion && (
                          <div className="group relative">
                            <MessageSquare className="w-3 h-3 text-purple-500" />
                            <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal">
                              {team.departmentOpinion}
                              <div className="absolute -bottom-1 left-2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 max-w-[200px]">
                    {team.departmentRejectReason ? (
                      <div className="p-2 bg-red-50 rounded border border-red-100">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-700 leading-relaxed line-clamp-3">
                            {team.departmentRejectReason}
                          </p>
                        </div>
                      </div>
                    ) : team.status === 'advisor_rejected' ? (
                      <div className="p-2 bg-orange-50 rounded border border-orange-100">
                        <p className="text-xs text-orange-700">
                          指导老师环节驳回，请联系指导老师
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">无驳回</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Award
                          className={`w-4 h-4 ${
                            creditProgressMap[team.creditProgress || 'not_started']
                              .color
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            creditProgressMap[team.creditProgress || 'not_started']
                              .color
                          }`}
                        >
                          {creditProgressMap[team.creditProgress || 'not_started'].label}
                        </span>
                      </div>
                      <div className="flex gap-0.5 w-24">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full ${
                              (creditProgressMap[team.creditProgress || 'not_started']
                                .step || 0) >= step
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        累计{team.totalServiceHours || 0}h ·{' '}
                        {team.creditAmount ? `${team.creditAmount}学分` : '待认定'}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck2
                          className={`w-4 h-4 ${
                            team.certificationStatus === 'approved'
                              ? 'text-emerald-600'
                              : team.certificationStatus === 'submitted'
                              ? 'text-blue-500'
                              : team.certificationStatus === 'reviewing'
                              ? 'text-purple-500'
                              : team.certificationStatus === 'rejected'
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {team.certificationStatus === 'approved'
                            ? '已认证'
                            : team.certificationStatus === 'submitted'
                            ? '已提交'
                            : team.certificationStatus === 'reviewing'
                            ? '评审中'
                            : team.certificationStatus === 'rejected'
                            ? '已退回'
                            : '未提交'}
                        </span>
                      </div>
                      {(team.allKeywords || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {(team.allKeywords || [])
                            .slice(0, 4)
                            .map((k, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded"
                              >
                                #{k}
                              </span>
                            ))}
                          {(team.allKeywords || []).length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-gray-400">
                              +{(team.allKeywords || []).length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      {(team.teamAchievements || []).length > 0 && (
                        <p className="text-[11px] text-gray-500">
                          成果 {team.teamAchievements?.length} 项
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center px-2 py-1 bg-gray-50 rounded">
                        <p className="text-sm font-semibold text-gray-700">
                          {team.checkInCount}
                        </p>
                        <p className="text-[10px] text-gray-400">LBS打卡</p>
                      </div>
                      <div className="text-center px-2 py-1 bg-gray-50 rounded">
                        <p className="text-sm font-semibold text-gray-700">
                          {team.logCount}
                        </p>
                        <p className="text-[10px] text-gray-400">AI日志</p>
                      </div>
                      <div className="text-center px-2 py-1 bg-gray-50 rounded">
                        <p className="text-sm font-semibold text-gray-700">
                          {(team.allKeywords || []).length}
                        </p>
                        <p className="text-[10px] text-gray-400">关键词</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setShowDetailModal(team)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        复查
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================ 新建团队弹窗 ================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  三下乡团队申报表
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  请如实填写，提交后将进入指导老师 → 院系管理员审核流程
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded"></span>
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      团队名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="例：乡村振兴数字化实践团"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      所属院系
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[
                        '计算机学院',
                        '农学院',
                        '经济管理学院',
                        '教育学院',
                        '社会学院',
                        '文学院',
                      ].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      项目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) =>
                        setFormData({ ...formData, projectName: e.target.value })
                      }
                      placeholder="例：数字化赋能乡村振兴——梁家河村电商平台建设"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.projectName
                          ? 'border-red-400'
                          : 'border-gray-200'
                      }`}
                    />
                    {errors.projectName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.projectName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 指导老师 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded"></span>
                  指导老师 <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {mockAdvisors.map((a) => (
                    <div
                      key={a.id}
                      onClick={() =>
                        setFormData({ ...formData, advisorId: a.id })
                      }
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.advisorId === a.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {a.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {a.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {a.department} · {a.title}
                          </p>
                        </div>
                        {formData.advisorId === a.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.advisorId && (
                  <p className="text-xs text-red-500 mt-2">
                    {errors.advisorId}
                  </p>
                )}
              </div>

              {/* 队长 + 学籍关联 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded"></span>
                  队长（学籍自动关联）
                  <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {mockStudents.map((s) => {
                    const selected = formData.leaderId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            leaderId: s.id,
                            department: s.department,
                          })
                        }
                        className={`p-3 border rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                          selected
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-100'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {s.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {s.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-0.5">
                          <p>📚 {s.department} {s.major}</p>
                          <p>🎓 {s.grade} · ☎️ {s.phone.slice(-4)}</p>
                        </div>
                        {selected && (
                          <div className="absolute top-1.5 right-1.5">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {errors.leaderId && (
                  <p className="text-xs text-red-500 mt-2">{errors.leaderId}</p>
                )}
              </div>

              {/* 队员 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-cyan-500 rounded"></span>
                  队员（点击添加，成员学籍同样自动关联）
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.memberIds.length === 0 ? (
                    <span className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      尚未添加队员（可选）
                    </span>
                  ) : (
                    formData.memberIds.map((mid) => {
                      const stu = mockStudents.find((s) => s.id === mid);
                      if (!stu || mid === formData.leaderId) return null;
                      return (
                        <div
                          key={mid}
                          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-100"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {stu.name}
                          </span>
                          <span className="text-[10px] text-cyan-500">
                            {stu.major}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(mid);
                            }}
                            className="ml-1 hover:bg-cyan-100 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {mockStudents
                    .filter(
                      (s) =>
                        s.id !== formData.leaderId &&
                        !formData.memberIds.includes(s.id)
                    )
                    .map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleAddMember(s.id)}
                        className="p-2 border border-gray-200 border-dashed rounded-lg hover:border-cyan-400 hover:bg-cyan-50/50 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {s.major}
                          </p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    ))}
                </div>
              </div>

              {/* 实践地点 + 时间 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded"></span>
                  实践安排
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      实践地点 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="例：陕西省延安市延川县文安驿镇梁家河村"
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.location ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.location && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.location}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      开始日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.startDate ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      结束日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.endDate ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 项目简介 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-pink-500 rounded"></span>
                  项目简介 <span className="text-red-500">*</span>
                </h3>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请详细描述实践背景、目标、计划、预期成果等（不少于20字）"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.description ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  ) : (
                    <span></span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formData.description.length} 字
                  </span>
                </div>
              </div>

              {/* 审核流程提示 */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  审核流程说明
                </h4>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="px-2 py-1 bg-white rounded border border-amber-200">
                    ① 学生提交
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-white rounded border border-amber-200">
                    ② 指导老师审核（2个工作日）
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-white rounded border border-amber-200">
                    ③ 院系管理员审核（3个工作日）
                  </span>
                  <span>→</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">
                    ④ 立项通过
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <BookOpen className="w-4 h-4 inline mr-1" />
                已阅《暑期社会实践安全责任书》
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setErrors({});
                  }}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSubmitTeam(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  保存草稿
                </button>
                <button
                  onClick={() => handleSubmitTeam(true)}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm"
                >
                  提交审核
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================ 团队详情复查弹窗 ================ */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  成果认证闭环复查
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {showDetailModal.name} · {showDetailModal.projectName}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 审核流程 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">审核流程追溯</h3>
                <div className="space-y-3">
                  {showDetailModal.applyTime && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div className="w-px flex-1 bg-gray-200 my-1"></div>
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-700">
                          学生提交申报
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {showDetailModal.applyTime} · 队长：
                          {showDetailModal.leaderName}
                        </p>
                      </div>
                    </div>
                  )}
                  {showDetailModal.advisorReviewTime && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            showDetailModal.advisorStatus === 'approved'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        ></div>
                        <div className="w-px flex-1 bg-gray-200 my-1"></div>
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-700">
                          指导老师
                          {showDetailModal.advisorStatus === 'approved'
                            ? '通过'
                            : '驳回'}
                          <span className="text-gray-400 font-normal ml-2">
                            {showDetailModal.advisorName}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {showDetailModal.advisorReviewTime}
                        </p>
                        {showDetailModal.advisorOpinion && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
                            💬 {showDetailModal.advisorOpinion}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {showDetailModal.departmentReviewTime && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            showDetailModal.departmentStatus === 'approved'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        ></div>
                        <div className="w-px flex-1 bg-gray-200 my-1"></div>
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-gray-700">
                          院系管理员
                          {showDetailModal.departmentStatus === 'approved'
                            ? '通过'
                            : '驳回'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {showDetailModal.departmentReviewTime}
                        </p>
                        {showDetailModal.departmentOpinion && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-lg text-xs text-purple-700 border border-purple-100">
                            💬 {showDetailModal.departmentOpinion}
                          </div>
                        )}
                        {showDetailModal.departmentRejectReason && (
                          <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-700 border border-red-100">
                            🚫 驳回原因：{showDetailModal.departmentRejectReason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {showDetailModal.creditReviewTime && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          学分认定完成 ·{' '}
                          <span className="text-emerald-600">
                            {showDetailModal.creditAmount}学分
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {showDetailModal.creditReviewTime} ·{' '}
                          {showDetailModal.creditReviewer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 证据链统计 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  证据链与成果
                </h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                    <p className="text-xl font-bold text-blue-600">
                      {showDetailModal.checkInCount}
                    </p>
                    <p className="text-xs text-blue-500">LBS打卡</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                    <p className="text-xl font-bold text-green-600">
                      {showDetailModal.logCount}
                    </p>
                    <p className="text-xs text-green-600">AI日志</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                    <p className="text-xl font-bold text-purple-600">
                      {showDetailModal.totalServiceHours || 0}h
                    </p>
                    <p className="text-xs text-purple-500">累计时长</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                    <p className="text-xl font-bold text-amber-600">
                      {(showDetailModal.allKeywords || []).length}
                    </p>
                    <p className="text-xs text-amber-500">关键词</p>
                  </div>
                </div>

                {(showDetailModal.allKeywords || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      服务内容关键词（从AI日志自动沉淀）：
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {showDetailModal.allKeywords?.map((k, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-white text-purple-700 rounded-full border border-purple-200"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(showDetailModal.teamAchievements || []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      团队成果清单：
                    </p>
                    <ul className="space-y-1.5">
                      {showDetailModal.teamAchievements?.map((a, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-700 flex items-center gap-2"
                        >
                          <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 成员信息 */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  成员学籍信息（对接学籍库）
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">姓名</th>
                        <th className="text-left px-3 py-2 font-medium">学号</th>
                        <th className="text-left px-3 py-2 font-medium">院系专业</th>
                        <th className="text-left px-3 py-2 font-medium">年级</th>
                        <th className="text-left px-3 py-2 font-medium">联系电话</th>
                        <th className="text-left px-3 py-2 font-medium">
                          实践时长
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {showDetailModal.members.map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-2 font-medium text-gray-700">
                            {m.name}
                            {m.id === showDetailModal.leaderId && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                                队长
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {m.studentId}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {m.department} · {m.major}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{m.grade}</td>
                          <td className="px-3 py-2 text-gray-600">{m.phone}</td>
                          <td className="px-3 py-2 font-medium text-emerald-600">
                            {m.practiceHours}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamList;
