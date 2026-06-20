import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Clock,
  Mail,
  MoreVertical,
  Edit3,
  Crown,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import PermissionMatrix from '@/components/agency/PermissionMatrix';

import {
  useAgencyStore,
  type TeamMember,
  type AgencyRole,
  type PermissionKey,
  ROLE_PERMISSION_PRESETS,
} from '@/store/useAgencyStore';

const roleBadgeVariant: Record<AgencyRole, 'primary' | 'secondary' | 'success' | 'warning' | 'default'> = {
  Owner: 'primary',
  Admin: 'secondary',
  'Casting Manager': 'success',
  'Talent Scout': 'warning',
  Viewer: 'default',
};

const roleIcons: Record<AgencyRole, React.ReactNode> = {
  Owner: <Crown className="w-3.5 h-3.5" />,
  Admin: <Shield className="w-3.5 h-3.5" />,
  'Casting Manager': <Users className="w-3.5 h-3.5" />,
  'Talent Scout': <UserPlus className="w-3.5 h-3.5" />,
  Viewer: <Shield className="w-3.5 h-3.5" />,
};

const statusLabels: Record<'active' | 'invited' | 'inactive', string> = {
  active: '活跃',
  invited: '已邀请',
  inactive: '已停用',
};

const statusBadgeVariant: Record<'active' | 'invited' | 'inactive', 'success' | 'warning' | 'danger'> = {
  active: 'success',
  invited: 'warning',
  inactive: 'danger',
};

const AgencyTeam: React.FC = () => {
  const { teamMembers, addTeamMember, updateTeamMemberPermissions, updateTeamMemberRole } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Viewer' as AgencyRole,
  });

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(
      (member) =>
        searchTerm === '' ||
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teamMembers, searchTerm]);

  const handleInvite = () => {
    if (inviteForm.name && inviteForm.email) {
      addTeamMember({
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        avatar: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('professional portrait avatar')}&image_size=square_hd`,
        permissions: ROLE_PERMISSION_PRESETS[inviteForm.role],
        lastActive: new Date().toISOString().split('T')[0],
        status: 'invited',
      });
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'Viewer' });
    }
  };

  const handleOpenPermissions = (member: TeamMember) => {
    setSelectedMember(member);
    setShowPermissionModal(true);
  };

  const handlePermissionChange = (permission: PermissionKey, checked: boolean) => {
    if (!selectedMember) return;
    const newPermissions = checked
      ? [...selectedMember.permissions, permission]
      : selectedMember.permissions.filter((p) => p !== permission);
    updateTeamMemberPermissions(selectedMember.id, newPermissions);
    setSelectedMember({ ...selectedMember, permissions: newPermissions });
  };

  const handleRoleChange = (role: AgencyRole) => {
    if (!selectedMember) return;
    updateTeamMemberRole(selectedMember.id, role);
    setSelectedMember({
      ...selectedMember,
      role,
      permissions: ROLE_PERMISSION_PRESETS[role],
    });
  };

  const IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
  const getImageUrl = (prompt: string): string => {
    return `${IMAGE_API}?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">团队与权限管理</h1>
              <p className="text-midnight-300">
                共 {teamMembers.length} 位团队成员
              </p>
            </div>
            <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowInviteModal(true)}>
              邀请成员
            </Button>
          </div>
        </div>

        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索成员姓名或邮箱..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredMembers.map((member, index) => (
            <Card
              key={member.id}
              variant="glass"
              hoverable
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(`professional portrait avatar ${member.name}`)}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-midnight-600"
                    />
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {member.name}
                        {member.role === 'Owner' && (
                          <Crown className="w-4 h-4 text-amber-400" />
                        )}
                      </h3>
                      <p className="text-sm text-midnight-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="p-2 rounded-lg hover:bg-midnight-700/50 transition-colors">
                      <MoreVertical className="w-5 h-5 text-midnight-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-36 bg-midnight-800 border border-midnight-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleOpenPermissions(member)}
                        className="w-full px-4 py-2 text-left text-sm text-midnight-200 hover:bg-midnight-700/50 flex items-center gap-2 rounded-t-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑权限
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg">
                        <Shield className="w-4 h-4" />
                        停用账户
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant={roleBadgeVariant[member.role]} size="sm" className="flex items-center gap-1">
                    {roleIcons[member.role]}
                    {member.role}
                  </Badge>
                  <Badge variant={statusBadgeVariant[member.status]} size="sm" dot>
                    {statusLabels[member.status]}
                  </Badge>
                </div>

                <div className="pt-4 border-t border-midnight-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-midnight-400">权限</span>
                    <button
                      onClick={() => handleOpenPermissions(member)}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      管理权限
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.permissions.slice(0, 3).map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-midnight-700/50 text-xs text-midnight-300"
                      >
                        {perm === 'viewArtists' && '查看艺人'}
                        {perm === 'editArtists' && '编辑艺人'}
                        {perm === 'publishCastings' && '发布选角'}
                        {perm === 'viewAnalytics' && '数据分析'}
                        {perm === 'manageTeam' && '管理团队'}
                        {perm === 'viewContactInfo' && '联系方式'}
                      </span>
                    ))}
                    {member.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-midnight-700/50 text-xs text-midnight-400">
                        +{member.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-midnight-700/50 flex items-center justify-between">
                  <span className="text-xs text-midnight-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    上次活跃: {member.lastActive}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Modal open={showInviteModal} onOpenChange={setShowInviteModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>邀请团队成员</ModalTitle>
              <ModalDescription>发送邀请邮件，对方接受后将加入团队</ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <Input
                label="姓名"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="请输入成员姓名"
              />
              <Input
                label="邮箱地址"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="请输入邮箱地址"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">选择角色</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AgencyRole })}
                  className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                >
                  <option value="Owner">Owner - 所有者</option>
                  <option value="Admin">Admin - 管理员</option>
                  <option value="Casting Manager">Casting Manager - 选角经理</option>
                  <option value="Talent Scout">Talent Scout - 星探</option>
                  <option value="Viewer">Viewer - 查看者</option>
                </select>
              </div>
              <div className="bg-midnight-700/30 rounded-xl p-4 border border-midnight-700/50">
                <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  角色权限预设
                </p>
                <p className="text-xs text-midnight-300">
                  该角色将获得以下权限: {ROLE_PERMISSION_PRESETS[inviteForm.role].length} 项
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ROLE_PERMISSION_PRESETS[inviteForm.role].map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-xs text-rose-400 border border-rose-500/20"
                    >
                      {perm === 'viewArtists' && '查看艺人'}
                      {perm === 'editArtists' && '编辑艺人'}
                      {perm === 'publishCastings' && '发布选角'}
                      {perm === 'viewAnalytics' && '数据分析'}
                      {perm === 'manageTeam' && '管理团队'}
                      {perm === 'viewContactInfo' && '联系方式'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
                取消
              </Button>
              <Button onClick={handleInvite} disabled={!inviteForm.name || !inviteForm.email}>
                发送邀请
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={showPermissionModal} onOpenChange={setShowPermissionModal}>
          <ModalContent className="max-w-4xl">
            <ModalHeader>
              <ModalTitle>管理权限 - {selectedMember?.name}</ModalTitle>
              <ModalDescription>
                自定义用户权限，或选择预设角色快速配置
              </ModalDescription>
            </ModalHeader>
            {selectedMember && (
              <div className="py-4">
                <PermissionMatrix
                  currentPermissions={selectedMember.permissions}
                  currentRole={selectedMember.role}
                  onPermissionChange={handlePermissionChange}
                  onRoleChange={handleRoleChange}
                  disabled={selectedMember.role === 'Owner'}
                />
                {selectedMember.role === 'Owner' && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Owner 角色拥有全部权限，无法修改。
                    </p>
                  </div>
                )}
              </div>
            )}
            <ModalFooter>
              <Button onClick={() => setShowPermissionModal(false)}>
                完成
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default AgencyTeam;
