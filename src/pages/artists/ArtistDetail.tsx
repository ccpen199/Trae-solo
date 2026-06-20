import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Ruler,
  Scale,
  Mail,
  Phone,
  MessageCircle,
  Edit3,
  Heart,
  Share2,
  Download,
  CheckCircle2,
  Briefcase,
  Globe,
  Star,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TagCloud, SkillTag } from '@/components/ui/TagCloud';
import MediaGallery from '@/components/artists/MediaGallery';
import ScheduleDay from '@/components/artists/ScheduleDay';
import { useArtistStore } from '@/store/useArtistStore';
import { mockSchedules, mockCurrentArtistProfile } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { ArtistProfile, Schedule, TalentTag } from '@shared/types';

const contractStatusConfig: Record<string, { label: string; variant: 'success' | 'primary' | 'warning' | 'secondary' }> = {
  available: { label: '可接通告', variant: 'success' },
  signed: { label: '已签约', variant: 'primary' },
  exclusive: { label: '专属合约', variant: 'warning' },
  unavailable: { label: '暂不可用', variant: 'secondary' },
};

interface ArtistDetailProps {
  isProfile?: boolean;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ isProfile = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchArtistById, currentArtist, loading } = useArtistStore();
  const { artistProfile, user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!isProfile && id) {
      fetchArtistById(id);
    }
  }, [id, fetchArtistById, isProfile]);

  const artist: ArtistProfile = isProfile
    ? (artistProfile || mockCurrentArtistProfile)
    : (currentArtist || mockCurrentArtistProfile);

  const artistSchedules: Schedule[] = useMemo(() => {
    return mockSchedules.filter((s) => s.artistProfileId === artist.id);
  }, [artist.id]);

  const primaryPhoto = artist.mediaAssets.find((m) => m.isPrimary) || artist.mediaAssets[0];
  const status = contractStatusConfig[artist.contractStatus] || contractStatusConfig.available;

  const skillTags = artist.skills.map((skill, index) => ({
    id: `skill-${index}`,
    label: skill,
    level: Math.floor(Math.random() * 3) + 3,
    color: (['primary', 'secondary', 'success'] as const)[index % 3],
  }));

  const languageTags = artist.languages.map((lang, index) => ({
    id: `lang-${index}`,
    label: lang,
    color: (['warning', 'primary', 'secondary', 'success'] as const)[index % 4],
  }));

  const displayTags: { id: string | number; label: string; weight?: number; color?: any }[] = artist.tags.map(
    (tag: TalentTag) => ({
      id: tag.id,
      label: tag.tag,
      weight: tag.weight,
      color:
        tag.category === 'appearance'
          ? 'primary'
          : tag.category === 'experience'
          ? 'success'
          : tag.category === 'language'
          ? 'warning'
          : 'default',
    })
  );

  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: Date; isOutsideMonth: boolean }[] = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isOutsideMonth: true });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isOutsideMonth: false });
    }
    while (days.length % 7 !== 0) {
      const lastDate = days[days.length - 1].date;
      days.push({
        date: new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1),
        isOutsideMonth: true,
      });
    }

    return days;
  }, []);

  const getScheduleForDate = (date: Date) => {
    return artistSchedules.find((s) => {
      const scheduleDate = new Date(s.date);
      return (
        scheduleDate.getFullYear() === date.getFullYear() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getDate() === date.getDate()
      );
    });
  };

  const stats = [
    { icon: <Ruler className="w-4 h-4" />, label: '身高', value: `${artist.height}cm`, gradient: 'from-rose-500 to-rose-400' },
    { icon: <Scale className="w-4 h-4" />, label: '体重', value: `${artist.weight}kg`, gradient: 'from-sapphire-500 to-sapphire-400' },
    { icon: <Star className="w-4 h-4" />, label: '胸围', value: `${artist.bust}cm`, gradient: 'from-purple-500 to-purple-400' },
    { icon: <Star className="w-4 h-4" />, label: '腰围', value: `${artist.waist}cm`, gradient: 'from-amber-500 to-amber-400' },
    { icon: <Star className="w-4 h-4" />, label: '臀围', value: `${artist.hips}cm`, gradient: 'from-emerald-500 to-emerald-400' },
    { icon: <Calendar className="w-4 h-4" />, label: '年龄', value: `${artist.age}岁`, gradient: 'from-cyan-500 to-cyan-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 animate-fade-in-down">
          {!isProfile ? (
            <button
              onClick={() => navigate('/artists')}
              className="inline-flex items-center gap-2 text-midnight-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回人才库
            </button>
          ) : (
            <h2 className="text-xl font-semibold text-white">我的个人资料</h2>
          )}
        </div>

        <Card variant="elevated" className="overflow-hidden mb-8 animate-fade-in-up">
          <div className="relative h-80 md:h-96">
            <img
              src={primaryPhoto?.url}
              alt={artist.realName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/60 to-transparent" />

            <div className="absolute top-6 right-6 flex gap-3">
              {!isProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="!bg-midnight-900/60 backdrop-blur-md border border-white/10 !text-white hover:!bg-midnight-800"
                  onClick={() => setIsFavorited(!isFavorited)}
                  leftIcon={
                    <Heart className={cn('w-4 h-4', isFavorited && 'fill-rose-500 text-rose-500')} />
                  }
                >
                  收藏
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="!bg-midnight-900/60 backdrop-blur-md border border-white/10 !text-white hover:!bg-midnight-800"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                分享
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="!bg-midnight-900/60 backdrop-blur-md border border-white/10 !text-white hover:!bg-midnight-800"
                leftIcon={<Download className="w-4 h-4" />}
              >
                下载模卡
              </Button>
              {isProfile && (
                <Button
                  variant="primary"
                  size="sm"
                  className="!bg-midnight-900/60 backdrop-blur-md border border-white/10 !text-white hover:!bg-midnight-800"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                  onClick={() => navigate(`/artists/${artist.id}/edit`)}
                >
                  编辑资料
                </Button>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {artist.stageName}
                  </h1>
                  {true && (
                    <Badge variant="success" size="md" className="gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      已认证
                    </Badge>
                  )}
                  <Badge variant={status.variant} size="md" dot>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-lg text-midnight-200 mb-2">{artist.realName}</p>
                <div className="flex items-center gap-4 text-midnight-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {artist.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {artist.gender === 'male' ? '男模特' : artist.gender === 'female' ? '女模特' : '模特'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {!isProfile ? (
                  <>
                    <Button
                      variant="outline"
                      leftIcon={<MessageCircle className="w-4 h-4" />}
                    >
                      发送消息
                    </Button>
                    <Button leftIcon={<Mail className="w-4 h-4" />}>
                      申请合作
                    </Button>
                  </>
                ) : (
                  <Button
                    leftIcon={<Edit3 className="w-4 h-4" />}
                    onClick={() => navigate('/profile/schedule')}
                  >
                    管理日程
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-6 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card variant="glass" className="text-center py-4">
                <CardContent className="p-4">
                  <div
                    className={cn(
                      'w-10 h-10 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center mb-2',
                      stat.gradient
                    )}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-midnight-400 mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <CardHeader>
                <CardTitle>媒体资料</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaGallery assets={artist.mediaAssets} />
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '真实姓名', value: artist.realName },
                    { label: '艺名', value: artist.stageName },
                    { label: '性别', value: artist.gender === 'male' ? '男' : artist.gender === 'female' ? '女' : '其他' },
                    { label: '年龄', value: `${artist.age}岁` },
                    { label: '身高', value: `${artist.height}cm` },
                    { label: '体重', value: `${artist.weight}kg` },
                    { label: '胸围', value: `${artist.bust}cm` },
                    { label: '腰围', value: `${artist.waist}cm` },
                    { label: '臀围', value: `${artist.hips}cm` },
                    { label: '眼睛颜色', value: artist.eyeColor },
                    { label: '头发颜色', value: artist.hairColor },
                    { label: '所在地', value: artist.location },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-midnight-700/50 last:border-0">
                      <span className="text-sm text-midnight-400">{item.label}</span>
                      <span className="text-sm text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-rose-500" />
                  技能与语言
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">专业技能</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillTags.map((tag) => (
                      <SkillTag
                        key={tag.id}
                        label={tag.label}
                        level={tag.level}
                        color={tag.color}
                        showLevel
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">语言能力</h4>
                  <TagCloud tags={languageTags} sizeVariant="md" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-midnight-200 mb-3">特色标签</h4>
                  <TagCloud tags={displayTags} sizeVariant="md" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">档期预览</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/artists/${artist.id}/schedule`)}
                >
                  完整日程
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-white font-semibold">
                    {format(new Date(), 'yyyy年MM月', { locale: zhCN })}
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-midnight-400 font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.slice(0, 35).map((item, index) => {
                    const schedule = getScheduleForDate(item.date);
                    const isToday =
                      item.date.toDateString() === new Date().toDateString();
                    return (
                      <ScheduleDay
                        key={index}
                        date={item.date}
                        status={schedule?.status}
                        isToday={isToday}
                        isOutsideMonth={item.isOutsideMonth}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-midnight-700/50">
                  <h5 className="text-xs font-medium text-midnight-400 mb-2">图例说明</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-midnight-300">可接通告</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-midnight-300">已预订</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-midnight-300">待确认</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-midnight-500" />
                      <span className="text-midnight-300">不可用</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <CardHeader>
                <CardTitle className="text-base">即将到来的日程</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {artistSchedules
                    .filter((s) => new Date(s.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50 hover:border-rose-500/30 transition-all"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-sapphire-500 to-sapphire-400 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-white/80">
                            {format(new Date(schedule.date), 'MM月', { locale: zhCN })}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {format(new Date(schedule.date), 'dd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {schedule.description || '无描述'}
                          </h4>
                          <Badge
                            variant={
                              schedule.status === 'booked'
                                ? 'success'
                                : schedule.status === 'pending'
                                ? 'warning'
                                : schedule.status === 'available'
                                ? 'secondary'
                                : 'default'
                            }
                            size="sm"
                            className="mt-1"
                          >
                            {schedule.status === 'booked'
                              ? '已确认'
                              : schedule.status === 'pending'
                              ? '待确认'
                              : schedule.status === 'available'
                              ? '可接'
                              : '不可用'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {artistSchedules.filter((s) => new Date(s.date) >= new Date()).length === 0 && (
                    <p className="text-center text-midnight-400 text-sm py-4">暂无即将到来的日程</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <CardTitle className="text-base">联系方式</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-midnight-400">邮箱</p>
                    <p className="text-sm text-white">{isProfile && user ? user.email : '申请后可见'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-midnight-800/50 border border-midnight-700/50">
                  <div className="w-10 h-10 rounded-lg bg-sapphire-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-sapphire-400" />
                  </div>
                  <div>
                    <p className="text-xs text-midnight-400">电话</p>
                    <p className="text-sm text-white">{isProfile && user ? user.phone : '申请后可见'}</p>
                  </div>
                </div>
                {!isProfile ? (
                  <Button className="w-full" leftIcon={<Edit3 className="w-4 h-4" />}>
                    申请查看完整资料
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    leftIcon={<Edit3 className="w-4 h-4" />}
                    onClick={() => navigate('/settings')}
                  >
                    更新联系方式
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
