import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  MessageSquare,
  Eye,
  Edit3,
  RefreshCw,
  UserMinus,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';

import {
  useAgencyStore,
  type AgencyArtist,
  type ContractType,
  type ArtistStatus,
  type Department,
} from '@/store/useAgencyStore';

const contractTypeLabels: Record<ContractType, string> = {
  exclusive: '独家合约',
  signed: '已签约',
  available: '可合作',
  unavailable: '暂不可用',
};

const artistStatusLabels: Record<ArtistStatus, string> = {
  active: '活跃',
  inactive: '非活跃',
};

const departmentLabels: Record<Department, string> = {
  fashion: '时装',
  commercial: '商业',
  acting: '影视',
  fitness: '健身',
};

const contractTypeBadgeVariant: Record<ContractType, 'primary' | 'secondary' | 'success' | 'danger' | 'default'> = {
  exclusive: 'primary',
  signed: 'secondary',
  available: 'success',
  unavailable: 'danger',
};

const statusBadgeVariant: Record<ArtistStatus, 'success' | 'danger'> = {
  active: 'success',
  inactive: 'danger',
};

const IMAGE_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
const getImageUrl = (prompt: string): string => {
  return `${IMAGE_API}?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
};

interface FilterState {
  contractType: ContractType | 'all';
  artistStatus: ArtistStatus | 'all';
  department: Department | 'all';
}

const AgencyArtistList: React.FC = () => {
  const { artists, addArtist } = useAgencyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    contractType: 'all',
    artistStatus: 'all',
    department: 'all',
  });
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newArtist, setNewArtist] = useState({
    realName: '',
    stageName: '',
    contractType: 'signed' as ContractType,
    department: 'fashion' as Department,
  });

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => {
      const matchesSearch =
        searchTerm === '' ||
        artist.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.stageName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesContractType =
        filters.contractType === 'all' || artist.contractType === filters.contractType;
      const matchesStatus =
        filters.artistStatus === 'all' || artist.artistStatus === filters.artistStatus;
      const matchesDepartment =
        filters.department === 'all' || artist.department === filters.department;

      return matchesSearch && matchesContractType && matchesStatus && matchesDepartment;
    });
  }, [artists, searchTerm, filters]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArtists(filteredArtists.map((a) => a.id));
    } else {
      setSelectedArtists([]);
    }
  };

  const handleSelectArtist = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedArtists([...selectedArtists, id]);
    } else {
      setSelectedArtists(selectedArtists.filter((a) => a !== id));
    }
  };

  const handleExportCSV = () => {
    console.log('Export CSV for artists:', selectedArtists.length > 0 ? selectedArtists : 'all');
  };

  const handleSendMessage = () => {
    console.log('Send group message to artists:', selectedArtists);
  };

  const handleAddArtist = () => {
    const baseArtist: Omit<AgencyArtist, 'id'> = {
      userId: 'user-' + Date.now(),
      realName: newArtist.realName,
      stageName: newArtist.stageName,
      age: 0,
      gender: 'female',
      height: 0,
      weight: 0,
      bust: 0,
      waist: 0,
      hips: 0,
      eyeColor: '',
      hairColor: '',
      languages: [],
      skills: [],
      location: '',
      latitude: 0,
      longitude: 0,
      contractStatus: newArtist.contractType,
      agencyId: 'agency-1',
      mediaAssets: [],
      tags: [],
      contractType: newArtist.contractType,
      artistStatus: 'active',
      department: newArtist.department,
      upcomingBookings: 0,
      revenueGenerated: 0,
    };
    addArtist(baseArtist);
    setShowAddModal(false);
    setNewArtist({ realName: '', stageName: '', contractType: 'signed', department: 'fashion' });
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== 'all').length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">签约艺人管理</h1>
              <p className="text-midnight-300">
                共 {artists.length} 位签约艺人 · 当前显示 {filteredArtists.length} 位
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportCSV}
              >
                导出 CSV
              </Button>
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                添加艺人
              </Button>
            </div>
          </div>
        </div>

        <Card variant="glass" className="mb-6 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索艺人姓名或艺名..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  leftIcon={<Filter className="w-4 h-4" />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  筛选
                  {activeFiltersCount > 0 && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-midnight-700/50 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">合约类型</label>
                  <select
                    value={filters.contractType}
                    onChange={(e) => setFilters({ ...filters, contractType: e.target.value as ContractType | 'all' })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="all">全部</option>
                    <option value="exclusive">独家合约</option>
                    <option value="signed">已签约</option>
                    <option value="available">可合作</option>
                    <option value="unavailable">暂不可用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">活跃状态</label>
                  <select
                    value={filters.artistStatus}
                    onChange={(e) => setFilters({ ...filters, artistStatus: e.target.value as ArtistStatus | 'all' })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="all">全部</option>
                    <option value="active">活跃</option>
                    <option value="inactive">非活跃</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-200 mb-2">所属部门</label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value as Department | 'all' })}
                    className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                  >
                    <option value="all">全部</option>
                    <option value="fashion">时装</option>
                    <option value="commercial">商业</option>
                    <option value="acting">影视</option>
                    <option value="fitness">健身</option>
                  </select>
                </div>
                {activeFiltersCount > 0 && (
                  <div className="sm:col-span-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={<X className="w-4 h-4" />}
                      onClick={() => setFilters({ contractType: 'all', artistStatus: 'all', department: 'all' })}
                    >
                      清除筛选
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedArtists.length > 0 && (
          <Card variant="glass" className="mb-4 animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-midnight-200">
                  已选择 <span className="text-white font-semibold">{selectedArtists.length}</span> 位艺人
                </span>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportCSV}>
                    导出 CSV
                  </Button>
                  <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={handleSendMessage}>
                    发送群消息
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedArtists([])}>
                    取消选择
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="glass" className="animate-fade-in-up">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-midnight-700/30">
                  <th className="text-left p-4 w-12">
                    <Checkbox
                      checked={selectedArtists.length === filteredArtists.length && filteredArtists.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">艺人</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">合约类型</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">状态</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">部门</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">即将到来的工作</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">创收</th>
                  <th className="text-left p-4 text-sm font-medium text-midnight-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredArtists.map((artist) => (
                  <tr
                    key={artist.id}
                    className="border-t border-midnight-700/50 hover:bg-midnight-700/20 transition-colors"
                  >
                    <td className="p-4">
                      <Checkbox
                        checked={selectedArtists.includes(artist.id)}
                        onCheckedChange={(checked) => handleSelectArtist(artist.id, checked as boolean)}
                        aria-label={`Select ${artist.realName}`}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(`professional asian ${artist.gender} model portrait high quality`)}
                          alt={artist.realName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-midnight-600"
                        />
                        <div>
                          <p className="font-medium text-white">{artist.realName}</p>
                          <p className="text-sm text-midnight-400">{artist.stageName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={contractTypeBadgeVariant[artist.contractType]} size="sm">
                        {contractTypeLabels[artist.contractType]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={statusBadgeVariant[artist.artistStatus]} size="sm" dot>
                        {artistStatusLabels[artist.artistStatus]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-midnight-200">{departmentLabels[artist.department]}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white font-medium">{artist.upcomingBookings}</span>
                      <span className="text-sm text-midnight-400 ml-1">个</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-emerald-400 font-medium">
                        ¥{artist.revenueGenerated.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          查看
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Edit3 className="w-4 h-4" />}>
                          编辑
                        </Button>
                        <div className="relative group">
                          <Button variant="ghost" size="sm" rightIcon={<ChevronDown className="w-4 h-4" />}>
                            更多
                          </Button>
                          <div className="absolute right-0 top-full mt-1 w-36 bg-midnight-800 border border-midnight-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button className="w-full px-4 py-2 text-left text-sm text-midnight-200 hover:bg-midnight-700/50 flex items-center gap-2 rounded-t-lg">
                              <RefreshCw className="w-4 h-4" />
                              续约
                            </button>
                            <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 rounded-b-lg">
                              <UserMinus className="w-4 h-4" />
                              停用
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredArtists.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <Users className="w-12 h-12 text-midnight-600 mx-auto mb-4" />
                      <p className="text-midnight-400">暂无符合条件的艺人</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Modal open={showAddModal} onOpenChange={setShowAddModal}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>添加新艺人</ModalTitle>
              <ModalDescription>输入艺人基本信息，完成后可在详情页完善更多资料</ModalDescription>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <Input
                label="真实姓名"
                value={newArtist.realName}
                onChange={(e) => setNewArtist({ ...newArtist, realName: e.target.value })}
                placeholder="请输入真实姓名"
              />
              <Input
                label="艺名"
                value={newArtist.stageName}
                onChange={(e) => setNewArtist({ ...newArtist, stageName: e.target.value })}
                placeholder="请输入艺名"
              />
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">合约类型</label>
                <select
                  value={newArtist.contractType}
                  onChange={(e) => setNewArtist({ ...newArtist, contractType: e.target.value as ContractType })}
                  className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                >
                  <option value="exclusive">独家合约</option>
                  <option value="signed">已签约</option>
                  <option value="available">可合作</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-200 mb-2">所属部门</label>
                <select
                  value={newArtist.department}
                  onChange={(e) => setNewArtist({ ...newArtist, department: e.target.value as Department })}
                  className="w-full h-11 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 focus:border-rose-500 text-white px-4 transition-all"
                >
                  <option value="fashion">时装部门</option>
                  <option value="commercial">商业部门</option>
                  <option value="acting">影视部门</option>
                  <option value="fitness">健身部门</option>
                </select>
              </div>
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button onClick={handleAddArtist} disabled={!newArtist.realName || !newArtist.stageName}>
                添加艺人
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default AgencyArtistList;
