import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Building2,
  Download,
  FileText,
  Send,
  ChevronRight,
  Star,
  CheckCircle2,
  Image,
  Play,
  User,
  Eye,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import BudgetRange from '@/components/castings/BudgetRange';
import RequirementBadge from '@/components/castings/RequirementBadge';
import MatchScoreBar from '@/components/castings/MatchScoreBar';

import useCastingStore from '@/store/useCastingStore';
import useArtistStore from '@/store/useArtistStore';
import useModelCardStore from '@/store/useModelCardStore';
import { mockAgencies, mockCurrentArtistProfile } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Casting, ArtistProfile, CastingRequirement } from '@shared/types';

interface CastingDetailProps {
  castingId?: string;
  onBack?: () => void;
}

const categoryColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default'> = {
  '时装周': 'primary',
  '平面广告': 'secondary',
  '品牌代言': 'success',
  '电商拍摄': 'warning',
  '影视 casting': 'danger',
  '直播带货': 'primary',
  '活动展示': 'secondary',
};

const statusColors: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  published: 'success',
  draft: 'default',
  closed: 'danger',
  completed: 'warning',
};

const statusLabels: Record<string, string> = {
  published: '招募中',
  draft: '草稿',
  closed: '已关闭',
  completed: '已完成',
};

const getImageUrl = (prompt: string): string => {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
};

const formatRequirementLabel = (req: CastingRequirement): string => {
  const fieldLabels: Record<string, string> = {
    gender: '性别',
    age: '年龄',
    height: '身高',
    weight: '体重',
    skills: '技能',
    languages: '语言',
    contractStatus: '合约状态',
    experience: '经验',
  };

  const label = fieldLabels[req.field] || req.field;

  if (req.operator === 'between' && Array.isArray(req.value)) {
    if (req.field === 'age') return `${label}: ${req.value[0]}-${req.value[1]}岁`;
    if (req.field === 'height') return `${label}: ${req.value[0]}-${req.value[1]}cm`;
    if (req.field === 'weight') return `${label}: ${req.value[0]}-${req.value[1]}kg`;
    return `${label}: ${req.value[0]}-${req.value[1]}`;
  }

  if (req.operator === 'gte') {
    if (req.field === 'height') return `${label}: ≥${req.value}cm`;
    if (req.field === 'age') return `${label}: ≥${req.value}岁`;
    return `${label}: ≥${req.value}`;
  }

  if (req.operator === 'lte') {
    if (req.field === 'height') return `${label}: ≤${req.value}cm`;
    return `${label}: ≤${req.value}`;
  }

  if (req.operator === 'eq') {
    if (req.field === 'gender') {
      const genderMap: Record<string, string> = { male: '男', female: '女', other: '不限' };
      return `${label}: ${genderMap[req.value] || req.value}`;
    }
    return `${label}: ${req.value}`;
  }

  if (req.operator === 'in' && Array.isArray(req.value)) {
    if (req.field === 'gender') {
      const genderMap: Record<string, string> = { male: '男', female: '女', other: '不限' };
      return `${label}: ${req.value.map((v: string) => genderMap[v] || v).join('/')}`;
    }
    if (req.field === 'contractStatus') {
      const statusMap: Record<string, string> = { available: '可接', signed: '已签约', exclusive: '独家' };
      return `${label}: ${req.value.map((v: string) => statusMap[v] || v).join('、')}`;
    }
    return `${label}: ${req.value.join('、')}`;
  }

  return `${label}: ${req.value}`;
};

const getRequirementType = (field: string): 'gender' | 'age' | 'height' | 'weight' | 'skill' | 'language' | 'experience' | 'other' => {
  if (field === 'gender') return 'gender';
  if (field === 'age') return 'age';
  if (field === 'height') return 'height';
  if (field === 'weight') return 'weight';
  if (field === 'skills') return 'skill';
  if (field === 'languages') return 'language';
  if (field === 'experience' || field === 'contractStatus') return 'experience';
  return 'other';
};

const CastingDetail: React.FC<CastingDetailProps> = ({ castingId, onBack }) => {
  const {
    castings,
    currentCasting,
    fetchCastingById,
    applications,
    applyToCasting,
    loading,
  } = useCastingStore();

  const { artists } = useArtistStore();
  const { modelCards } = useModelCardStore();

  const [activeTab, setActiveTab] = useState('description');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedModelCardId, setSelectedModelCardId] = useState<string>('');
  const [applySuccess, setApplySuccess] = useState(false);

  const casting = useMemo<Casting | null>(() => {
    if (currentCasting) return currentCasting;
    if (castingId) return castings.find((c) => c.id === castingId) || null;
    return castings[0] || null;
  }, [currentCasting, castingId, castings]);

  useEffect(() => {
    if (castingId && !currentCasting) {
      fetchCastingById(castingId);
    }
  }, [castingId, currentCasting, fetchCastingById]);

  const agency = useMemo(() => {
    if (!casting) return null;
    return mockAgencies.find((a) => a.id === casting.agencyId) || null;
  }, [casting]);

  const applicationCount = useMemo(() => {
    if (!casting) return 0;
    return applications.filter((a) => a.castingId === casting.id).length;
  }, [casting, applications]);

  const matchingArtists = useMemo(() => {
    if (!casting) return [];
    return artists.slice(0, 5).map((artist) => {
      let score = 50;
      const reasons: string[] = [];

      casting.requirements.forEach((req) => {
        if (req.field === 'gender') {
          if (req.operator === 'eq' && artist.gender === req.value) {
            score += 15;
            reasons.push('性别符合');
          } else if (req.operator === 'in' && Array.isArray(req.value) && req.value.includes(artist.gender)) {
            score += 15;
            reasons.push('性别符合');
          }
        }
        if (req.field === 'age' && req.operator === 'between' && Array.isArray(req.value)) {
          if (artist.age >= req.value[0] && artist.age <= req.value[1]) {
            score += 10;
            reasons.push('年龄符合');
          }
        }
        if (req.field === 'height') {
          if (req.operator === 'gte' && artist.height >= req.value) {
            score += 10;
            reasons.push('身高达标');
          } else if (req.operator === 'between' && Array.isArray(req.value)) {
            if (artist.height >= req.value[0] && artist.height <= req.value[1]) {
              score += 10;
              reasons.push('身高符合');
            }
          }
        }
        if (req.field === 'skills' && req.operator === 'in' && Array.isArray(req.value)) {
          const matchedSkills = artist.skills.filter((s) => req.value.includes(s));
          if (matchedSkills.length > 0) {
            score += matchedSkills.length * 5;
            reasons.push(`具备技能: ${matchedSkills.join('、')}`);
          }
        }
        if (req.field === 'languages' && req.operator === 'in' && Array.isArray(req.value)) {
          const matchedLangs = artist.languages.filter((l) => req.value.includes(l));
          if (matchedLangs.length > 0) {
            score += matchedLangs.length * 3;
            reasons.push(`掌握语言: ${matchedLangs.join('、')}`);
          }
        }
      });

      return {
        artist,
        score: Math.min(100, score),
        reasons: reasons.slice(0, 3),
      };
    }).sort((a, b) => b.score - a.score);
  }, [casting, artists]);

  const daysLeft = useMemo(() => {
    if (!casting) return 0;
    return differenceInDays(new Date(casting.endDate), new Date());
  }, [casting]);

  const handleApply = async () => {
    if (!casting) return;
    const result = await applyToCasting(casting.id, mockCurrentArtistProfile.id, coverLetter);
    if (result) {
      setApplySuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
        setCoverLetter('');
        setSelectedModelCardId('');
      }, 2000);
    }
  };

  if (!casting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-midnight-300">加载中...</p>
        </div>
      </div>
    );
  }

  const badgeVariant = categoryColors[casting.category] || 'default';
  const statusVariant = statusColors[casting.status] || 'default';

  const mediaGallery = [
    { type: 'photo', url: getImageUrl(`high fashion editorial ${casting.category} professional photography`) },
    { type: 'photo', url: getImageUrl(`${casting.category} model portfolio studio shot`) },
    { type: 'photo', url: getImageUrl(`fashion backstage ${casting.category} behind the scenes`) },
    { type: 'video', url: getImageUrl(`${casting.category} casting video thumbnail`) },
    { type: 'photo', url: getImageUrl(`runway show ${casting.category} fashion week`) },
    { type: 'photo', url: getImageUrl(`commercial advertising ${casting.category} lifestyle`) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-midnight-300 hover:text-rose-400 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回列表
        </button>

        <Card variant="glass" className="mb-6 overflow-hidden">
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={getImageUrl(`${casting.category} casting hero banner professional fashion`)}
              alt={casting.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={badgeVariant} size="sm">
                      {casting.category}
                    </Badge>
                    <Badge variant={statusVariant} size="sm" dot>
                      {statusLabels[casting.status]}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {casting.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-midnight-200">
                    {agency && (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {agency.name}
                        {agency.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sapphire-400" />
                        )}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {casting.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(casting.startDate), 'yyyy年MM月dd日', { locale: zhCN })} - {format(new Date(casting.endDate), 'MM月dd日', { locale: zhCN })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {applicationCount} 人已申请
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <BudgetRange min={casting.budgetMin} max={casting.budgetMax} size="lg" />
                  {daysLeft <= 3 && daysLeft >= 0 && (
                    <Badge variant="danger" size="sm" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysLeft === 0 ? '今日截止' : `剩余 ${daysLeft} 天`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-6 pt-4 border-b border-midnight-700/50">
                    <TabsList>
                      <TabsTrigger value="description">项目介绍</TabsTrigger>
                      <TabsTrigger value="requirements">招募要求</TabsTrigger>
                      <TabsTrigger value="applications">申请管理</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="description" className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-midnight-200 leading-relaxed whitespace-pre-line">
                        {casting.description}
                      </p>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-rose-400" />
                        合同附件
                      </h3>
                      <Card variant="default" className="border-midnight-700">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">模特合作协议.pdf</p>
                              <p className="text-xs text-midnight-400">PDF · 245 KB</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                            下载
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5 text-rose-400" />
                        参考图集
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {mediaGallery.map((item, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                          >
                            <img
                              src={item.url}
                              alt={`参考图 ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {item.type === 'video' ? (
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                              ) : (
                                <Eye className="w-6 h-6 text-white" />
                              )}
                            </div>
                            {item.type === 'video' && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                视频
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">基本要求</h3>
                        <div className="flex flex-wrap gap-2">
                          {casting.requirements.map((req, idx) => (
                            <RequirementBadge
                              key={idx}
                              label={formatRequirementLabel(req)}
                              type={getRequirementType(req.field)}
                              size="md"
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">详细要求说明</h3>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-midnight-200">具备专业的职业素养，能够按时参加试镜和拍摄工作</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-midnight-200">无不良记录，与当前经纪公司无合约纠纷</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-midnight-200">能够配合品牌方的时间安排，包括周末和节假日</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-midnight-200">形象气质佳，上镜效果好，能够展现品牌调性</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">筛选条件</h3>
                        <Card variant="default">
                          <CardContent className="p-5 space-y-4">
                            {casting.requirements.map((req, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-midnight-300">{formatRequirementLabel(req).split(':')[0]}</span>
                                <span className="text-white font-medium">
                                  {formatRequirementLabel(req).split(':')[1]?.trim()}
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="applications" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        申请列表 ({applicationCount})
                      </h3>
                      <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                        管理全部
                      </Button>
                    </div>

                    {applications.filter((a) => a.castingId === casting.id).length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-midnight-800 flex items-center justify-center">
                          <Users className="w-8 h-8 text-midnight-500" />
                        </div>
                        <p className="text-midnight-400">暂无申请人</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {applications
                          .filter((a) => a.castingId === casting.id)
                          .slice(0, 5)
                          .map((app) => {
                            const artist = artists.find((a) => a.id === app.artistProfileId);
                            return (
                              <div
                                key={app.id}
                                className="flex items-center gap-4 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 hover:border-rose-500/30 transition-all"
                              >
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={artist?.mediaAssets?.[0]?.url || getImageUrl('model portrait')}
                                    alt={artist?.stageName || 'Model'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white truncate">{artist?.stageName}</p>
                                  <p className="text-xs text-midnight-400">
                                    {artist?.height}cm · {artist?.location}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    app.status === 'hired'
                                      ? 'success'
                                      : app.status === 'shortlisted'
                                      ? 'primary'
                                      : app.status === 'interview'
                                      ? 'warning'
                                      : app.status === 'rejected'
                                      ? 'danger'
                                      : 'default'
                                  }
                                  size="sm"
                                >
                                  {app.status === 'hired'
                                    ? '已录用'
                                    : app.status === 'shortlisted'
                                    ? '已入选'
                                    : app.status === 'interview'
                                    ? '面试中'
                                    : app.status === 'rejected'
                                    ? '已拒绝'
                                    : '待审核'}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="sticky bottom-6 lg:hidden">
              <Button
                className="w-full"
                size="lg"
                leftIcon={<Send className="w-5 h-5" />}
                onClick={() => setShowApplyModal(true)}
                disabled={casting.status !== 'published'}
              >
                {casting.status !== 'published' ? '当前不可申请' : '立即申请'}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card variant="glass" className="hidden lg:block">
              <CardContent className="p-6">
                <Button
                  className="w-full mb-4"
                  size="lg"
                  leftIcon={<Send className="w-5 h-5" />}
                  onClick={() => setShowApplyModal(true)}
                  disabled={casting.status !== 'published'}
                >
                  {casting.status !== 'published' ? '当前不可申请' : '立即申请'}
                </Button>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-midnight-400">发布时间</span>
                    <span className="text-midnight-200">
                      {format(new Date(casting.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-midnight-400">申请截止</span>
                    <span className="text-midnight-200">
                      {format(new Date(casting.endDate), 'yyyy-MM-dd', { locale: zhCN })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-midnight-400">已申请</span>
                    <span className="text-rose-400 font-medium">{applicationCount} 人</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {matchingArtists.length > 0 && (
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    推荐人才
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {matchingArtists.map(({ artist, score, reasons }, idx) => (
                      <div
                        key={artist.id}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          idx === 0
                            ? 'bg-rose-500/5 border-rose-500/30'
                            : 'bg-midnight-800/30 border-midnight-700/50 hover:border-rose-500/20'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={artist.mediaAssets?.[0]?.url || getImageUrl('model portrait')}
                              alt={artist.stageName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white truncate">{artist.stageName}</p>
                              {idx === 0 && (
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              )}
                            </div>
                            <p className="text-xs text-midnight-400">
                              {artist.height}cm · {artist.age}岁
                            </p>
                          </div>
                        </div>
                        <MatchScoreBar score={score} size="sm" />
                        {reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reasons.map((reason, i) => (
                              <span
                                key={i}
                                className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {agency && (
              <Card variant="glass">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sapphire-400" />
                    发布机构
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sapphire-500 to-sapphire-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-white truncate">{agency.name}</p>
                        {agency.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-sapphire-400" />
                        )}
                      </div>
                      <p className="text-sm text-midnight-400 mb-2">{agency.address}</p>
                      <div className="text-sm text-midnight-300 space-y-1">
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {agency.contactPerson}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Modal open={showApplyModal} onOpenChange={setShowApplyModal}>
          <ModalContent className="max-w-xl">
            {applySuccess ? (
              <div className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">申请提交成功！</h3>
                <p className="text-midnight-300">我们已收到你的申请，请耐心等待审核结果</p>
              </div>
            ) : (
              <>
                <ModalHeader>
                  <ModalTitle>申请试镜</ModalTitle>
                  <ModalDescription>
                    填写求职信并选择要附加的模特卡
                  </ModalDescription>
                </ModalHeader>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      求职信 <span className="text-midnight-500">(选填)</span>
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="介绍一下你自己，为什么你适合这个角色..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 text-white placeholder-midnight-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      选择模特卡 <span className="text-midnight-500">(选填)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {modelCards.length > 0 ? (
                        modelCards.map((card) => (
                          <button
                            key={card.id}
                            onClick={() =>
                              setSelectedModelCardId(
                                selectedModelCardId === card.id ? '' : card.id
                              )
                            }
                            className={cn(
                              'p-3 rounded-xl border-2 text-left transition-all',
                              selectedModelCardId === card.id
                                ? 'border-rose-500 bg-rose-500/10'
                                : 'border-midnight-700 bg-midnight-900/30 hover:border-midnight-600'
                            )}
                          >
                            <p className="font-medium text-white text-sm truncate">{card.name}</p>
                            <p className="text-xs text-midnight-400 mt-0.5">
                              {card.exportedSizes.length} 种尺寸
                            </p>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-midnight-500 col-span-2 py-4 text-center">
                          暂无模特卡，可先跳过
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-midnight-900/30 border border-midnight-700/50">
                    <p className="text-sm text-midnight-300">
                      <span className="text-rose-400 font-medium">提示：</span>
                      提交申请后，你的个人资料将对该机构可见，请确保信息真实有效。
                    </p>
                  </div>
                </div>

                <ModalFooter>
                  <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                    取消
                  </Button>
                  <Button onClick={handleApply} loading={loading}>
                    提交申请
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

export default CastingDetail;
