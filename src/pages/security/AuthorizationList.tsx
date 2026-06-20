import React, { useMemo, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Ban,
  Clock,
  Building2,
  UserCircle2,
  FileText,
  ChevronRight,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import DataScopeSelector, { DEFAULT_DATA_SCOPE_CATEGORIES } from '@/components/security/DataScopeSelector';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type AuthorizationStatus = 'active' | 'expired' | 'revoked';

interface GranteeInfo {
  id: string;
  name: string;
  logo?: string;
  type: 'company' | 'individual' | 'agency';
  description?: string;
}

interface AuthorizationItem {
  id: string;
  grantee: GranteeInfo;
  grantedAt: Date;
  expiresAt?: Date;
  dataScope: string[];
  status: AuthorizationStatus;
  accessCount: number;
  lastAccessedAt?: Date;
}

const mockAuthorizations: AuthorizationItem[] = [
  {
    id: '1',
    grantee: {
      id: 'g1',
      name: '星耀模特经纪有限公司',
      type: 'agency',
      description: '国内知名模特经纪公司',
    },
    grantedAt: new Date('2024-03-15'),
    expiresAt: new Date('2025-03-15'),
    dataScope: ['stageName', 'realName', 'age', 'photos', 'phone', 'height', 'weight', 'schedule'],
    status: 'active',
    accessCount: 23,
    lastAccessedAt: new Date('2024-12-10'),
  },
  {
    id: '2',
    grantee: {
      id: 'g2',
      name: '华谊兄弟时尚文化传媒',
      type: 'company',
      description: '大型影视文化传媒集团',
    },
    grantedAt: new Date('2024-05-20'),
    expiresAt: new Date('2024-12-31'),
    dataScope: ['stageName', 'photos', 'height', 'weight', 'bust', 'waist', 'hips'],
    status: 'active',
    accessCount: 15,
    lastAccessedAt: new Date('2024-12-08'),
  },
  {
    id: '3',
    grantee: {
      id: 'g3',
      name: '张伟 (摄影师)',
      type: 'individual',
      description: '时尚摄影师',
    },
    grantedAt: new Date('2024-08-01'),
    expiresAt: new Date('2024-09-01'),
    dataScope: ['stageName', 'photos', 'email'],
    status: 'expired',
    accessCount: 8,
    lastAccessedAt: new Date('2024-08-28'),
  },
  {
    id: '4',
    grantee: {
      id: 'g4',
      name: '国际奢侈品牌',
      type: 'company',
      description: '欧洲奢侈品集团',
    },
    grantedAt: new Date('2024-01-10'),
    expiresAt: new Date('2024-07-10'),
    dataScope: ['stageName', 'realName', 'photos', 'measurements'],
    status: 'revoked',
    accessCount: 34,
    lastAccessedAt: new Date('2024-06-20'),
  },
  {
    id: '5',
    grantee: {
      id: 'g5',
      name: '新锐模特工作室',
      type: 'agency',
      description: '新生代模特经纪',
    },
    grantedAt: new Date('2024-10-01'),
    expiresAt: new Date('2025-10-01'),
    dataScope: ['stageName', 'photos', 'schedule', 'height', 'weight'],
    status: 'active',
    accessCount: 5,
    lastAccessedAt: new Date('2024-12-05'),
  },
];

const getStatusBadge = (status: AuthorizationStatus) => {
  switch (status) {
    case 'active':
      return <Badge variant="success" size="sm" dot>有效</Badge>;
    case 'expired':
      return <Badge variant="warning" size="sm" dot>已过期</Badge>;
    case 'revoked':
      return <Badge variant="danger" size="sm" dot>已撤销</Badge>;
  }
};

const getGranteeIcon = (type: GranteeInfo['type'], className: string) => {
  switch (type) {
    case 'company':
    case 'agency':
      return <Building2 className={className} />;
    case 'individual':
      return <UserCircle2 className={className} />;
  }
};

const getScopeLabels = (scope: string[]): string[] => {
  const labels: string[] = [];
  const basicFields = ['stageName', 'realName', 'age', 'gender', 'location'];
  const photoFields = ['photos', 'threeView', 'videos'];
  const contactFields = ['phone', 'email', 'wechat'];
  const measurementFields = ['height', 'weight', 'bust', 'waist', 'hips', 'eyeColor', 'hairColor'];
  const scheduleFields = ['schedule', 'history'];

  if (scope.some((f) => basicFields.includes(f))) labels.push('基本信息');
  if (scope.some((f) => photoFields.includes(f))) labels.push('照片资料');
  if (scope.some((f) => contactFields.includes(f))) labels.push('联系方式');
  if (scope.some((f) => measurementFields.includes(f))) labels.push('身体数据');
  if (scope.some((f) => scheduleFields.includes(f))) labels.push('日程安排');

  return labels;
};

const AuthorizationList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthorizationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<string | null>(null);
  const [showNewAuthModal, setShowNewAuthModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState<AuthorizationItem | null>(null);
  const [newAuthFields, setNewAuthFields] = useState<string[]>([]);
  const [newAuthGrantee, setNewAuthGrantee] = useState('');
  const [newAuthExpires, setNewAuthExpires] = useState('');

  const filteredAuthorizations = useMemo(() => {
    return mockAuthorizations.filter((auth) => {
      if (activeTab !== 'all' && auth.status !== activeTab) return false;
      if (searchQuery && !auth.grantee.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedDataType) {
        const hasScope = getScopeLabels(auth.dataScope).includes(selectedDataType);
        if (!hasScope) return false;
      }
      return true;
    });
  }, [activeTab, searchQuery, selectedDataType]);

  const handleViewDetails = (auth: AuthorizationItem) => {
    setSelectedAuth(auth);
    setShowDetailModal(true);
  };

  const handleRevoke = (authId: string) => {
    console.log(`Revoking authorization ${authId}`);
  };

  const handleExtend = (authId: string) => {
    console.log(`Extending authorization ${authId}`);
  };

  const handleCreateAuthorization = () => {
    console.log('Creating authorization:', { newAuthGrantee, newAuthFields, newAuthExpires });
    setShowNewAuthModal(false);
    setNewAuthFields([]);
    setNewAuthGrantee('');
    setNewAuthExpires('');
  };

  const stats = useMemo(() => ({
    total: mockAuthorizations.length,
    active: mockAuthorizations.filter((a) => a.status === 'active').length,
    expired: mockAuthorizations.filter((a) => a.status === 'expired').length,
    revoked: mockAuthorizations.filter((a) => a.status === 'revoked').length,
  }), []);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-rose-500" />
                数据授权管理
              </h1>
              <p className="text-midnight-300">GDPR 第7条 - 管理授予第三方的数据访问权限</p>
            </div>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowNewAuthModal(true)}
            >
              授权新访问
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">全部授权</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">有效授权</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">已过期</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.expired}</p>
            </CardContent>
          </Card>
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <p className="text-sm text-midnight-400">已撤销</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.revoked}</p>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass" className="mb-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索被授权方名称..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-midnight-400 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  数据类型：
                </span>
                {['全部', '基本信息', '照片资料', '联系方式', '身体数据', '日程安排'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedDataType(type === '全部' ? null : type)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all duration-300',
                      (type === '全部' && !selectedDataType) || selectedDataType === type
                        ? 'bg-gradient-primary text-white shadow-button'
                        : 'bg-midnight-800 text-midnight-300 hover:bg-midnight-700'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <CardHeader>
              <TabsList>
                <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">有效 ({stats.active})</TabsTrigger>
                <TabsTrigger value="expired">已过期 ({stats.expired})</TabsTrigger>
                <TabsTrigger value="revoked">已撤销 ({stats.revoked})</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value={activeTab}>
                {filteredAuthorizations.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-midnight-600 mx-auto mb-4" />
                    <p className="text-midnight-400">暂无符合条件的授权记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAuthorizations.map((auth, index) => (
                      <div
                        key={auth.id}
                        className="rounded-xl border border-midnight-700 bg-midnight-900/50 p-5 hover:border-rose-500/30 transition-all duration-300 animate-fade-in-up"
                        style={{ animationDelay: `${600 + index * 50}ms` }}
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-lg">
                              {getGranteeIcon(auth.grantee.type, 'w-7 h-7')}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white text-lg">{auth.grantee.name}</h3>
                              {getStatusBadge(auth.status)}
                              <Badge variant="secondary" size="sm">
                                {auth.grantee.type === 'company' ? '公司' : auth.grantee.type === 'agency' ? '经纪公司' : '个人'}
                              </Badge>
                            </div>
                            {auth.grantee.description && (
                              <p className="text-sm text-midnight-400 mb-3">{auth.grantee.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {getScopeLabels(auth.dataScope).map((label) => (
                                <Badge key={label} variant="default" size="sm">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-midnight-400">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                授权时间：{format(new Date(auth.grantedAt), 'yyyy-MM-dd', { locale: zhCN })}
                              </span>
                              {auth.expiresAt && (
                                <span className={cn(
                                  'flex items-center gap-1',
                                  auth.status === 'expired' && 'text-amber-400'
                                )}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {auth.status === 'expired' ? '过期时间' : '到期时间'}：
                                  {format(new Date(auth.expiresAt), 'yyyy-MM-dd', { locale: zhCN })}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                已访问 {auth.accessCount} 次
                              </span>
                              {auth.lastAccessedAt && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5" />
                                  最近访问：{format(new Date(auth.lastAccessedAt), 'yyyy-MM-dd', { locale: zhCN })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Eye className="w-4 h-4" />}
                              onClick={() => handleViewDetails(auth)}
                            >
                              详情
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<FileText className="w-4 h-4" />}
                              onClick={() => navigate('/security/access-log', { state: { granteeId: auth.grantee.id } })}
                            >
                              审计日志
                            </Button>
                            {auth.status === 'active' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Clock className="w-4 h-4" />}
                                  onClick={() => handleExtend(auth.id)}
                                >
                                  续期
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  leftIcon={<Ban className="w-4 h-4" />}
                                  onClick={() => handleRevoke(auth.id)}
                                >
                                  撤销
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Modal open={showNewAuthModal} onOpenChange={setShowNewAuthModal}>
          <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ModalHeader>
              <ModalTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                授权新的数据访问
              </ModalTitle>
              <ModalDescription>
                选择被授权方和允许访问的数据字段范围
              </ModalDescription>
            </ModalHeader>
            <div className="space-y-5">
              <Input
                label="被授权方名称"
                placeholder="输入公司、机构或个人名称"
                value={newAuthGrantee}
                onChange={(e) => setNewAuthGrantee(e.target.value)}
              />
              <Input
                label="授权到期日期"
                type="date"
                value={newAuthExpires}
                onChange={(e) => setNewAuthExpires(e.target.value)}
                leftIcon={<CalendarDays className="w-4 h-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">
                  可访问的数据范围
                </label>
                <DataScopeSelector
                  selectedFields={newAuthFields}
                  onChange={setNewAuthFields}
                  categories={DEFAULT_DATA_SCOPE_CATEGORIES}
                />
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">授权注意事项</p>
                    <ul className="space-y-1 text-amber-300/80">
                      <li>• 仅授权给您信任的公司或个人</li>
                      <li>• 您可以随时在授权管理中撤销访问权限</li>
                      <li>• 所有数据访问均会被记录在审计日志中</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowNewAuthModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleCreateAuthorization}
                disabled={!newAuthGrantee || newAuthFields.length === 0}
              >
                确认授权
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal open={showDetailModal} onOpenChange={setShowDetailModal}>
          <ModalContent className="max-w-xl">
            <ModalHeader>
              <ModalTitle>授权详情</ModalTitle>
              <ModalDescription>查看该授权的详细信息</ModalDescription>
            </ModalHeader>
            {selectedAuth && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-midnight-800/50">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-lg">
                    {getGranteeIcon(selectedAuth.grantee.type, 'w-7 h-7')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{selectedAuth.grantee.name}</h3>
                    <p className="text-sm text-midnight-400">{selectedAuth.grantee.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedAuth.status)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-midnight-400">授权时间</p>
                    <p className="text-sm text-white mt-1">
                      {format(new Date(selectedAuth.grantedAt), 'yyyy年MM月dd日', { locale: zhCN })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-midnight-400">到期时间</p>
                    <p className="text-sm text-white mt-1">
                      {selectedAuth.expiresAt
                        ? format(new Date(selectedAuth.expiresAt), 'yyyy年MM月dd日', { locale: zhCN })
                        : '长期有效'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-midnight-400">访问次数</p>
                    <p className="text-sm text-white mt-1">{selectedAuth.accessCount} 次</p>
                  </div>
                  <div className="p-3 rounded-lg bg-midnight-800/50">
                    <p className="text-xs text-midnight-400">最近访问</p>
                    <p className="text-sm text-white mt-1">
                      {selectedAuth.lastAccessedAt
                        ? format(new Date(selectedAuth.lastAccessedAt), 'yyyy年MM月dd日', { locale: zhCN })
                        : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-midnight-200 mb-2">授权数据范围</p>
                  <div className="flex flex-wrap gap-2">
                    {getScopeLabels(selectedAuth.dataScope).map((label) => (
                      <Badge key={label} variant="primary" size="sm">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-midnight-200 mb-2">具体字段</p>
                  <div className="rounded-lg bg-midnight-800/50 p-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedAuth.dataScope.map((field) => (
                        <span
                          key={field}
                          className="px-2.5 py-1 rounded-md bg-midnight-700 text-sm text-midnight-200"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              <Button
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={() => {
                  setShowDetailModal(false);
                  if (selectedAuth) {
                    navigate('/security/access-log', { state: { granteeId: selectedAuth.grantee.id } });
                  }
                }}
              >
                查看审计日志
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default AuthorizationList;
