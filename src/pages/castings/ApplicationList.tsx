import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Star,
  MoreVertical,
  ChevronDown,
  Users,
  Eye,
  MessageSquare,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/Card';
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

import MatchScoreBar from '@/components/castings/MatchScoreBar';

import useCastingStore from '@/store/useCastingStore';
import useArtistStore from '@/store/useArtistStore';
import { cn } from '@/lib/utils';
import type { ApplicationStatus, CastingApplication, ArtistProfile } from '@shared/types';

type FilterStatus = 'all' | ApplicationStatus;

interface ApplicationWithArtist extends CastingApplication {
  artist: ArtistProfile | undefined;
  matchScore: number;
}

const statusFilters: { id: FilterStatus; label: string; count?: number }[] = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待审核' },
  { id: 'shortlisted', label: '已入选' },
  { id: 'interview', label: '面试中' },
  { id: 'hired', label: '已录用' },
  { id: 'rejected', label: '已拒绝' },
];

const statusConfig: Record<ApplicationStatus, { variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
  pending: { variant: 'default', label: '待审核' },
  shortlisted: { variant: 'primary', label: '已入选' },
  interview: { variant: 'warning', label: '面试中' },
  hired: { variant: 'success', label: '已录用' },
  rejected: { variant: 'danger', label: '已拒绝' },
};

const getImageUrl = (prompt: string): string => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
};

const ApplicationList: React.FC<{ castingId?: string; onBack?: () => void }> = ({ castingId, onBack }) => {
  const { applications, castings, updateApplicationStatus, loading } = useCastingStore();
  const { artists } = useArtistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<ApplicationWithArtist | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);

  const currentCasting = useMemo(() => {
    if (castingId) return castings.find((c) => c.id === castingId);
    return castings[0];
  }, [castingId, castings]);

  const applicationsWithArtists = useMemo<ApplicationWithArtist[]>(() => {
    const filtered = castingId
      ? applications.filter((a) => a.castingId === castingId)
      : applications;

    return filtered.map((app) => {
      const artist = artists.find((a) => a.id === app.artistProfileId);
      let matchScore = 60;

      if (artist && currentCasting) {
        matchScore = 50;
        currentCasting.requirements.forEach((req) => {
          if (req.field === 'gender') {
            if (req.operator === 'eq' && artist.gender === req.value) matchScore += 15;
            else if (req.operator === 'in' && Array.isArray(req.value) && req.value.includes(artist.gender)) matchScore += 15;
          }
          if (req.field === 'age' && req.operator === 'between' && Array.isArray(req.value)) {
            if (artist.age >= req.value[0] && artist.age <= req.value[1]) matchScore += 10;
          }
          if (req.field === 'height') {
            if (req.operator === 'gte' && artist.height >= req.value) matchScore += 10;
            else if (req.operator === 'between' && Array.isArray(req.value)) {
              if (artist.height >= req.value[0] && artist.height <= req.value[1]) matchScore += 10;
            }
          }
          if (req.field === 'skills' && req.operator === 'in' && Array.isArray(req.value)) {
            const matched = artist.skills.filter((s) => req.value.includes(s));
            matchScore += matched.length * 5;
          }
        });
      }

      return {
        ...app,
        artist,
        matchScore: Math.min(100, matchScore),
      };
    });
  }, [applications, artists, castingId, currentCasting]);

  const filteredApplications = useMemo(() => {
    let result = applicationsWithArtists;

    if (filterStatus !== 'all') {
      result = result.filter((a) => a.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a.artist?.stageName.toLowerCase().includes(query) ||
        a.artist?.realName.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => b.matchScore - a.matchScore);
  }, [applicationsWithArtists, filterStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applicationsWithArtists.length };
    applicationsWithArtists.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
  }, [applicationsWithArtists]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  const handleBulkAction = async (status: 'shortlisted' | 'rejected') => {
    for (const id of selectedIds) {
      await updateApplicationStatus(id, status);
    }
    setSelectedIds(new Set());
    setShowBulkActions(false);
  };

  const handleStatusChange = async (applicationId: string, status: ApplicationStatus) => {
    await updateApplicationStatus(applicationId, status);
    setStatusDropdownOpen(null);
  };

  const StatsBar = () => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {statusFilters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setFilterStatus(filter.id)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
            filterStatus === filter.id
              ? 'bg-gradient-primary text-white shadow-button'
              : 'bg-midnight-800/50 text-midnight-300 hover:bg-midnight-800 hover:text-white border border-midnight-700'
          )}
        >
          {filter.label}
          <span
            className={cn(
              'ml-2 px-1.5 py-0.5 rounded-full text-xs',
              filterStatus === filter.id
                ? 'bg-white/20 text-white'
                : 'bg-midnight-700 text-midnight-400'
            )}
          >
            {statusCounts[filter.id] || 0}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-midnight-300 hover:text-rose-400 transition-colors mb-3 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              返回
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">申请管理</h1>
          <p className="text-midnight-300">
            {currentCasting ? `${currentCasting.title} - ` : ''}
            共收到 {applicationsWithArtists.length} 份申请
          </p>
        </div>

        {currentCasting && (
          <Card variant="glass" className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-rose-500 to-sapphire-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{currentCasting.title}</h3>
                  <p className="text-sm text-midnight-400">
                    截止日期: {format(new Date(currentCasting.endDate), 'yyyy年MM月dd日', { locale: zhCN })}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{statusCounts.pending || 0}</p>
                    <p className="text-midnight-400">待审核</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-400">{statusCounts.shortlisted || 0}</p>
                    <p className="text-midnight-400">已入选</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{statusCounts.hired || 0}</p>
                    <p className="text-midnight-400">已录用</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4">
          <StatsBar />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="搜索模特姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="filled"
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  rightIcon={<ChevronDown className="w-4 h-4" />}
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  批量操作 ({selectedIds.size})
                </Button>
                {showBulkActions && (
                  <div className="absolute right-0 mt-2 w-44 bg-midnight-800 border border-midnight-700 rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
                    <button
                      onClick={() => handleBulkAction('shortlisted')}
                      className="w-full px-4 py-2.5 text-left text-sm text-midnight-200 hover:bg-midnight-700/50 transition-colors flex items-center gap-2"
                    >
                      <Star className="w-4 h-4 text-rose-400" />
                      加入候选
                    </button>
                    <button
                      onClick={() => handleBulkAction('rejected')}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝申请
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button variant="outline" size="md" leftIcon={<Filter className="w-4 h-4" />}>
              高级筛选
            </Button>
          </div>
        </div>

        <Card variant="glass">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-midnight-700/50">
                    <th className="w-12 px-4 py-3">
                      <Checkbox
                        checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-midnight-400 uppercase tracking-wider">模特</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-midnight-400 uppercase tracking-wider hidden md:table-cell">申请时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-midnight-400 uppercase tracking-wider">匹配度</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-midnight-400 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-midnight-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-midnight-700/30">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-midnight-800 flex items-center justify-center">
                          <Users className="w-8 h-8 text-midnight-500" />
                        </div>
                        <p className="text-midnight-400">暂无申请记录</p>
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => {
                      const config = statusConfig[app.status];
                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-midnight-800/30 transition-colors cursor-pointer"
                          onClick={() => setViewingApplication(app)}
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(app.id)}
                              onCheckedChange={() => toggleSelect(app.id)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-midnight-700">
                                <img
                                  src={app.artist?.mediaAssets?.[0]?.url || getImageUrl('asian model portrait')}
                                  alt={app.artist?.stageName || 'Model'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate">
                                  {app.artist?.stageName || '未知模特'}
                                </p>
                                <p className="text-xs text-midnight-400 truncate">
                                  {app.artist?.height}cm · {app.artist?.age}岁 · {app.artist?.location}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-midnight-300 hidden md:table-cell">
                            {format(new Date(app.appliedAt), 'yyyy-MM-dd', { locale: zhCN })}
                          </td>
                          <td className="px-4 py-4 w-32">
                            <MatchScoreBar score={app.matchScore} size="sm" showLabel={false} />
                            <span className="text-xs text-midnight-400 mt-1 block">{app.matchScore}%</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setStatusDropdownOpen(statusDropdownOpen === app.id ? null : app.id)}
                                className="flex items-center gap-1"
                              >
                                <Badge variant={config.variant} size="sm">
                                  {config.label}
                                  <ChevronDown className="w-3 h-3 ml-1" />
                                </Badge>
                              </button>
                              {statusDropdownOpen === app.id && (
                                <div className="absolute left-0 mt-2 w-36 bg-midnight-800 border border-midnight-700 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                                  {Object.entries(statusConfig).map(([key, cfg]) => (
                                    <button
                                      key={key}
                                      onClick={() => handleStatusChange(app.id, key as ApplicationStatus)}
                                      className={cn(
                                        'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                                        app.status === key
                                          ? 'bg-rose-500/10 text-rose-400'
                                          : 'text-midnight-200 hover:bg-midnight-700/50'
                                      )}
                                    >
                                      {app.status === key && <Check className="w-3.5 h-3.5" />}
                                      <span className={app.status === key ? '' : 'ml-5'}>{cfg.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setViewingApplication(app)}
                                className="p-2 rounded-lg text-midnight-400 hover:bg-midnight-700/50 hover:text-white transition-colors"
                                title="查看详情"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg text-midnight-400 hover:bg-midnight-700/50 hover:text-white transition-colors"
                                title="发送消息"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg text-midnight-400 hover:bg-midnight-700/50 hover:text-white transition-colors"
                                title="更多操作"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Modal open={!!viewingApplication} onOpenChange={(o) => !o && setViewingApplication(null)}>
          <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {viewingApplication && (
              <>
                <ModalHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-midnight-700">
                      <img
                        src={viewingApplication.artist?.mediaAssets?.[0]?.url || getImageUrl('asian model portrait')}
                        alt={viewingApplication.artist?.stageName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ModalTitle className="flex items-center gap-2">
                        {viewingApplication.artist?.stageName}
                        <Badge variant={statusConfig[viewingApplication.status].variant} size="sm">
                          {statusConfig[viewingApplication.status].label}
                        </Badge>
                      </ModalTitle>
                      <ModalDescription>
                        申请于 {format(new Date(viewingApplication.appliedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </ModalDescription>
                    </div>
                  </div>
                </ModalHeader>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">匹配度分析</h4>
                    <Card variant="default">
                      <CardContent className="p-4">
                        <MatchScoreBar score={viewingApplication.matchScore} />
                      </CardContent>
                    </Card>
                  </div>

                  {viewingApplication.coverLetter && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-400" />
                        求职信
                      </h4>
                      <Card variant="default">
                        <CardContent className="p-4">
                          <p className="text-midnight-200 leading-relaxed whitespace-pre-line">
                            {viewingApplication.coverLetter}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {viewingApplication.artist && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">基本信息</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <p className="text-xs text-midnight-400 mb-1">身高</p>
                            <p className="font-medium text-white">{viewingApplication.artist.height} cm</p>
                          </div>
                          <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <p className="text-xs text-midnight-400 mb-1">体重</p>
                            <p className="font-medium text-white">{viewingApplication.artist.weight} kg</p>
                          </div>
                          <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <p className="text-xs text-midnight-400 mb-1">年龄</p>
                            <p className="font-medium text-white">{viewingApplication.artist.age} 岁</p>
                          </div>
                          <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <p className="text-xs text-midnight-400 mb-1">三围</p>
                            <p className="font-medium text-white">
                              {viewingApplication.artist.bust}/{viewingApplication.artist.waist}/{viewingApplication.artist.hips}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 col-span-2">
                            <p className="text-xs text-midnight-400 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              所在地
                            </p>
                            <p className="font-medium text-white">{viewingApplication.artist.location}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">技能标签</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingApplication.artist.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" size="sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">语言能力</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewingApplication.artist.languages.map((lang) => (
                            <Badge key={lang} variant="primary" size="sm">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">联系方式</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <Mail className="w-4 h-4 text-midnight-400" />
                            <span className="text-midnight-200">需要授权后可见</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                            <Phone className="w-4 h-4 text-midnight-400" />
                            <span className="text-midnight-200">需要授权后可见</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">作品集</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {viewingApplication.artist.mediaAssets.slice(0, 6).map((asset, idx) => (
                            <div
                              key={asset.id}
                              className="aspect-square rounded-lg overflow-hidden group cursor-pointer"
                            >
                              <img
                                src={asset.url}
                                alt={`作品 ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <ModalFooter className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="w-full sm:w-auto" leftIcon={<Download className="w-4 h-4" />}>
                    导出简历
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" leftIcon={<XCircle className="w-4 h-4" />}>
                    拒绝
                  </Button>
                  <Button variant="secondary" className="w-full sm:w-auto" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    联系
                  </Button>
                  <Button className="w-full sm:w-auto" leftIcon={<Star className="w-4 h-4" />}>
                    入选候选
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default ApplicationList;
