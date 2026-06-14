import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  GraduationCap,
  Briefcase,
  Star,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle,
} from 'lucide-react';
import { collaboration } from '@/api/client';
import type { User, CollaborationSpace, CollaborationMember } from '../../shared/types';

const roleConfig = {
  student: {
    label: '考生',
    bgColor: 'bg-blue-500',
    badgeBgColor: 'bg-blue-100',
    badgeTextColor: 'text-blue-700',
    borderColor: 'border-blue-500',
    description: '高考考生本人',
  },
  parent: {
    label: '家长',
    bgColor: 'bg-green-500',
    badgeBgColor: 'bg-green-100',
    badgeTextColor: 'text-green-700',
    borderColor: 'border-green-500',
    description: '考生家长或监护人',
  },
  teacher: {
    label: '教师',
    bgColor: 'bg-orange-500',
    badgeBgColor: 'bg-orange-100',
    badgeTextColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    description: '高中班主任或任课教师',
  },
  expert: {
    label: '专家',
    bgColor: 'bg-purple-500',
    badgeBgColor: 'bg-purple-100',
    badgeTextColor: 'text-purple-700',
    borderColor: 'border-purple-500',
    description: '志愿填报咨询专家',
  },
};

const spaceRoleConfig = {
  owner: { label: '创建者', bgColor: 'bg-yellow-500' },
  editor: { label: '编辑者', bgColor: 'bg-blue-500' },
  viewer: { label: '查看者', bgColor: 'bg-gray-500' },
};

type RoleType = keyof typeof roleConfig;
type SpaceRoleType = keyof typeof spaceRoleConfig;

interface MemberWithUser extends CollaborationMember {
  user?: User;
}

interface SpaceDetailResponse {
  space: CollaborationSpace;
  members: MemberWithUser[];
  messages: unknown[];
  plan?: unknown;
}

export default function Collaboration() {
  const [spaces, setSpaces] = useState<CollaborationSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<CollaborationSpace | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<SpaceRoleType>('viewer');
  const [inviteNote, setInviteNote] = useState('');
  const [inviting, setInviting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (selectedSpace) {
      loadSpaceMembers(selectedSpace.id);
    }
  }, [selectedSpace]);

  const loadSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await collaboration.getSpaces();
      if (response.success && response.data) {
        setSpaces(response.data);
        if (response.data.length > 0 && !selectedSpace) {
          setSelectedSpace(response.data[0]);
        }
      }
    } catch (err) {
      setError('加载协作空间失败');
      console.error('加载协作空间失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSpaceMembers = async (spaceId: number) => {
    setMembersLoading(true);
    setError(null);
    try {
      const response = await collaboration.getSpace(spaceId);
      if (response.success && response.data) {
        const data = response.data as unknown as SpaceDetailResponse;
        setMembers(data.members || []);
      }
    } catch (err) {
      setError('加载成员列表失败');
      console.error('加载成员列表失败:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim() || !selectedSpace) {
      setError('请输入用户ID');
      return;
    }

    setInviting(true);
    setError(null);
    try {
      const userId = parseInt(inviteUserId);
      if (isNaN(userId)) {
        throw new Error('用户ID必须是数字');
      }
      const response = await collaboration.addMember(selectedSpace.id, {
        userId,
        role: inviteRole,
      });
      if (response.success) {
        setShowInviteModal(false);
        setInviteUserId('');
        setInviteRole('viewer');
        setInviteNote('');
        setSuccessMessage('成员已添加');
        loadSpaceMembers(selectedSpace.id);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('添加成员失败');
      console.error('添加成员失败:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: SpaceRoleType) => {
    if (!selectedSpace) return;
    setUpdatingRole(memberId);
    setError(null);
    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;
      const response = await collaboration.removeMember(selectedSpace.id, member.userId);
      if (response.success) {
        const addResponse = await collaboration.addMember(selectedSpace.id, {
          userId: member.userId,
          role: newRole,
        });
        if (addResponse.success) {
          setMembers((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
          );
          setSuccessMessage('角色已更新');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      }
    } catch (err) {
      setError('更新角色失败');
      console.error('更新角色失败:', err);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selectedSpace || !confirm('确定要移除该成员吗？')) return;
    setRemovingId(memberId);
    setError(null);
    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;
      const response = await collaboration.removeMember(selectedSpace.id, member.userId);
      if (response.success) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSuccessMessage('成员已移除');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('移除成员失败');
      console.error('移除成员失败:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-4 h-4" />;
      case 'parent':
        return <Users className="w-4 h-4" />;
      case 'teacher':
        return <Briefcase className="w-4 h-4" />;
      case 'expert':
        return <Star className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getUserInitials = (user?: User) => {
    return (user?.name || '?').charAt(0).toUpperCase();
  };

  const roleCounts = members.reduce(
    (acc, member) => {
      const userRole = (member.user?.role as RoleType) || 'student';
      acc[userRole] = (acc[userRole] || 0) + 1;
      return acc;
    },
    {} as Record<RoleType, number>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">协作管理</h1>
            <p className="text-gray-600">邀请家人、老师和专家一起规划志愿方案</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!selectedSpace}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            添加成员
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-green-700">{successMessage}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {spaces.length > 1 && (
          <div className="flex gap-2 mb-6">
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => setSelectedSpace(space)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSpace?.id === space.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {space.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {(Object.keys(roleConfig) as RoleType[]).map((role) => {
            const config = roleConfig[role];
            const count = roleCounts[role] || 0;
            return (
              <div
                key={role}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                    <span className="text-white">{getRoleIcon(role)}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeBgColor} ${config.badgeTextColor}`}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{count}</div>
                <p className="text-sm text-gray-500 mt-1">{config.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSpace ? `${selectedSpace.name} - 成员列表` : '协作成员'}
              </h2>
              <span className="text-sm text-gray-500">{members.length} 位成员</span>
            </div>
          </div>

          {loading || membersLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">正在加载成员列表...</p>
            </div>
          ) : members.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {members.map((member) => {
                const userRole = (member.user?.role as RoleType) || 'student';
                const config = roleConfig[userRole];
                const isOwner = member.role === 'owner';
                const spaceConfig = spaceRoleConfig[member.role as SpaceRoleType];
                return (
                  <div
                    key={member.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${config.bgColor} border-2 ${config.borderColor}`}
                        >
                          {getUserInitials(member.user)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {member.user?.name || `用户 ${member.userId}`}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${config.badgeBgColor} ${config.badgeTextColor}`}
                            >
                              {getRoleIcon(member.user?.role)}
                              {config.label}
                            </span>
                            {isOwner && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                创建者
                              </span>
                            )}
                            {!isOwner && spaceConfig && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium text-white flex items-center gap-1 ${spaceConfig.bgColor}`}
                              >
                                {spaceConfig.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {member.user?.phone && (
                              <span>手机号: {member.user.phone}</span>
                            )}
                            {member.user?.schoolName && (
                              <span>学校: {member.user.schoolName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!isOwner && (
                          <>
                            <div className="relative group">
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateRole(member.id, e.target.value as SpaceRoleType)
                                }
                                disabled={updatingRole === member.id}
                                className="appearance-none pl-3 pr-8 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                              >
                                {(Object.keys(spaceRoleConfig) as SpaceRoleType[]).map((role) => (
                                  <option key={role} value={role}>
                                    {spaceRoleConfig[role].label}
                                  </option>
                                ))}
                              </select>
                              {updatingRole === member.id && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={removingId === member.id}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="移除成员"
                            >
                              {removingId === member.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无协作成员</h3>
              <p className="text-gray-600 mb-6">邀请家人、老师一起参与志愿规划</p>
              {selectedSpace && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  添加第一位成员
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            角色权限说明
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(roleConfig) as RoleType[]).map((role) => {
              const config = roleConfig[role];
              return (
                <div key={role} className="bg-white rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                      <span className="text-white">{getRoleIcon(role)}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeBgColor} ${config.badgeTextColor}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    {role === 'student' && (
                      <>
                        <li>• 编辑个人信息和成绩</li>
                        <li>• 查看所有方案</li>
                        <li>• 添加收藏院校</li>
                      </>
                    )}
                    {role === 'parent' && (
                      <>
                        <li>• 查看志愿方案</li>
                        <li>• 发表评论和建议</li>
                        <li>• 接收重要通知</li>
                      </>
                    )}
                    {role === 'teacher' && (
                      <>
                        <li>• 提供专业建议</li>
                        <li>• 编辑志愿顺序</li>
                        <li>• 导出分析报告</li>
                      </>
                    )}
                    {role === 'expert' && (
                      <>
                        <li>• 所有教师权限</li>
                        <li>• 风险评估和分析</li>
                        <li>• 一对一咨询服务</li>
                      </>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">添加协作成员</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户ID
                </label>
                <input
                  type="text"
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  placeholder="请输入用户ID（数字）"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  选择空间角色
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(spaceRoleConfig) as SpaceRoleType[]).map((role) => {
                    const config = spaceRoleConfig[role];
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          inviteRole === role
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 mx-auto mb-2 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="添加备注..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteUserId.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {inviting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    添加中...
                  </span>
                ) : (
                  '添加成员'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
