import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  ChevronRight,
  Send,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  channelLabels,
  tierLabels,
  statusLabels,
} from '@shared/types';
import type { ContentItem, ContentChannel, ContentTier, ContentStatus } from '@shared/types';
import { cn } from '@/lib/utils';

const channels: { value: ContentChannel | 'all'; label: string }[] = [
  { value: 'all', label: '全部频道' },
  { value: 'politics', label: '时政新闻' },
  { value: 'livelihood', label: '民生服务' },
  { value: 'culture', label: '文化教育' },
  { value: 'education', label: '教育资讯' },
];

const tiers: { value: ContentTier | 'all'; label: string }[] = [
  { value: 'all', label: '全部级别' },
  { value: 'city', label: '市级' },
  { value: 'district', label: '区县级' },
  { value: 'street', label: '街道级' },
];

const statuses: { value: ContentStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审核' },
  { value: 'published', label: '已发布' },
  { value: 'rejected', label: '已驳回' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-yellow-50 text-yellow-700',
  published: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function ContentManagement() {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<ContentChannel | 'all'>('all');
  const [activeTier, setActiveTier] = useState<ContentTier | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<ContentStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContents();
  }, [activeChannel, activeTier, activeStatus]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeChannel !== 'all') params.append('channel', activeChannel);
      if (activeTier !== 'all') params.append('tier', activeTier);
      if (activeStatus !== 'all') params.append('status', activeStatus);
      if (keyword) params.append('keyword', keyword);

      const res = await fetch(`http://localhost:3001/api/content?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContents(data.data.list);
      }
    } catch (e) {
      const mockData: ContentItem[] = [
        {
          id: '1',
          title: '市委召开常委会会议 研究部署经济社会发展重点工作',
          summary: '会议指出，要深入贯彻落实上级决策部署，扎实推进各项工作任务落地见效...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop',
          channel: 'politics',
          tier: 'city',
          status: 'published',
          source: 'manual',
          viewCount: 12580,
          publishTime: '2024-06-20 10:30:00',
          createTime: '2024-06-20 09:00:00',
          updateTime: '2024-06-20 10:30:00',
          creatorId: '1',
          creatorName: '张编辑',
        },
        {
          id: '2',
          title: '徐州地铁4号线一期工程正式开通运营',
          summary: '徐州地铁4号线一期工程于今日正式开通，全长25.4公里，设站19座...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&h=250&fit=crop',
          channel: 'livelihood',
          tier: 'city',
          status: 'published',
          source: 'api',
          viewCount: 28960,
          publishTime: '2024-06-20 09:15:00',
          createTime: '2024-06-19 16:00:00',
          updateTime: '2024-06-20 09:15:00',
          creatorId: '2',
          creatorName: '李记者',
        },
        {
          id: '3',
          title: '徐州汉文化旅游节盛大开幕 擦亮汉文化名片',
          summary: '本届汉文化旅游节以"汉风新韵·魅力徐州"为主题，将持续一个月...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop',
          channel: 'culture',
          tier: 'city',
          status: 'published',
          source: 'manual',
          viewCount: 15420,
          publishTime: '2024-06-19 16:45:00',
          createTime: '2024-06-19 10:00:00',
          updateTime: '2024-06-19 16:45:00',
          creatorId: '3',
          creatorName: '王主任',
        },
        {
          id: '4',
          title: '我市今年新建改扩建中小学20所 增加学位3万个',
          summary: '2024年我市计划新建改扩建中小学20所，预计新增学位3万个...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop',
          channel: 'education',
          tier: 'city',
          status: 'pending',
          source: 'rss',
          viewCount: 0,
          createTime: '2024-06-20 08:30:00',
          updateTime: '2024-06-20 08:30:00',
          creatorId: '4',
          creatorName: '刘编辑',
        },
        {
          id: '5',
          title: '全区安全生产工作会议召开 压实责任筑牢防线',
          summary: '云龙区召开安全生产工作会议，部署下一阶段安全生产重点任务...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&h=250&fit=crop',
          channel: 'politics',
          tier: 'district',
          status: 'published',
          source: 'manual',
          viewCount: 5280,
          publishTime: '2024-06-19 14:20:00',
          createTime: '2024-06-19 10:00:00',
          updateTime: '2024-06-19 14:20:00',
          creatorId: '5',
          creatorName: '陈静',
        },
        {
          id: '6',
          title: '街道社区开展夏季食品安全宣传活动',
          summary: '彭城街道办事处组织开展夏季食品安全宣传进社区活动...',
          content: '',
          coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
          channel: 'livelihood',
          tier: 'street',
          status: 'pending',
          source: 'manual',
          viewCount: 0,
          createTime: '2024-06-20 07:45:00',
          updateTime: '2024-06-20 07:45:00',
          creatorId: '6',
          creatorName: '赵明',
        },
      ];
      setContents(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAudit = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/content/submit/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        loadContents();
      }
    } catch (e) {
      setContents(contents.map(c => c.id === id ? { ...c, status: 'pending' as ContentStatus } : c));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="内容管理"
        description="管理多频道内容流，支持时政、民生、文化、教育四大频道"
        actions={
          <button
            onClick={() => navigate('/content/publish')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建内容
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {channels.map((ch) => (
              <button
                key={ch.value}
                onClick={() => setActiveChannel(ch.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeChannel === ch.value
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索内容..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={activeTier}
            onChange={(e) => setActiveTier(e.target.value as ContentTier | 'all')}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            {tiers.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value as ContentStatus | 'all')}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="w-4 h-4" />
            共 {contents.length} 条内容
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contents.map((item) => (
            <div
              key={item.id}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-card-hover transition-all duration-200"
            >
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-600 text-white rounded">
                    {channelLabels[item.channel]}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/90 text-slate-700 rounded">
                    {tierLabels[item.tier]}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColors[item.status])}>
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base font-semibold text-slate-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.creatorName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(item.publishTime || item.createTime)?.slice(5, 10)}
                    </span>
                  </div>
                  {item.viewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.viewCount.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/content/${item.id}`)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/content/edit/${item.id}`)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitAudit(item.id)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="提交审核"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
