import { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  User,
  Clock,
  Building,
  Home,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import {
  channelLabels,
  tierLabels,
  districts,
} from '@shared/types';
import type { ContentItem } from '@shared/types';
import { cn } from '@/lib/utils';

type TierType = 'city' | 'district' | 'street';

const mockContent: Record<TierType, ContentItem[]> = {
  city: [
    {
      id: 'city_1',
      title: '市委召开常委会会议 研究部署经济社会发展重点工作',
      channel: 'politics',
      tier: 'city',
      status: 'published',
      source: 'manual',
      summary: '会议指出，要深入贯彻落实上级决策部署，扎实推进各项工作任务落地见效...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=120&h=80&fit=crop',
      viewCount: 12580,
      publishTime: '2024-06-20 10:30:00',
      createTime: '2024-06-20 09:00:00',
      updateTime: '2024-06-20 10:30:00',
      creatorId: '1',
      creatorName: '张编辑',
    },
    {
      id: 'city_2',
      title: '徐州地铁4号线一期工程正式开通运营',
      channel: 'livelihood',
      tier: 'city',
      status: 'published',
      source: 'api',
      summary: '徐州地铁4号线一期工程于今日正式开通，全长25.4公里，设站19座...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=120&h=80&fit=crop',
      viewCount: 28960,
      publishTime: '2024-06-20 09:15:00',
      createTime: '2024-06-19 16:00:00',
      updateTime: '2024-06-20 09:15:00',
      creatorId: '2',
      creatorName: '李记者',
    },
  ],
  district: [
    {
      id: 'district_1',
      title: '云龙区召开安全生产工作会议',
      channel: 'politics',
      tier: 'district',
      status: 'published',
      source: 'manual',
      summary: '云龙区召开安全生产工作会议，部署下一阶段安全生产重点任务...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=120&h=80&fit=crop',
      viewCount: 5280,
      publishTime: '2024-06-19 14:20:00',
      createTime: '2024-06-19 10:00:00',
      updateTime: '2024-06-19 14:20:00',
      creatorId: '5',
      creatorName: '陈静',
    },
    {
      id: 'district_2',
      title: '泉山区文化惠民演出活动圆满举办',
      channel: 'culture',
      tier: 'district',
      status: 'pending',
      source: 'manual',
      summary: '泉山区文化惠民演出活动在市民广场举行，吸引了众多市民参与...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&h=80&fit=crop',
      viewCount: 0,
      createTime: '2024-06-19 17:20:00',
      updateTime: '2024-06-19 17:20:00',
      creatorId: '5',
      creatorName: '陈静',
    },
  ],
  street: [
    {
      id: 'street_1',
      title: '彭城街道开展夏季食品安全宣传活动',
      channel: 'livelihood',
      tier: 'street',
      status: 'pending',
      source: 'manual',
      summary: '彭城街道办事处组织开展夏季食品安全宣传进社区活动...',
      content: '',
      coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=80&fit=crop',
      viewCount: 0,
      createTime: '2024-06-20 07:45:00',
      updateTime: '2024-06-20 07:45:00',
      creatorId: '6',
      creatorName: '赵明',
    },
  ],
};

export default function TieredPublishing() {
  const [expandedTiers, setExpandedTiers] = useState<Set<TierType>>(new Set(['city', 'district', 'street']));
  const [selectedDistrict, setSelectedDistrict] = useState(districts[0]);

  const toggleTier = (tier: TierType) => {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  };

  const tierInfo = [
    { key: 'city' as TierType, label: '市级内容池', icon: Building, color: 'from-blue-500', description: '面向全市发布的权威内容' },
    { key: 'district' as TierType, label: '区县级内容池', icon: Home, color: 'from-green-500', description: '各区县自主发布内容' },
    { key: 'street' as TierType, label: '街道级内容池', icon: Home, color: 'from-orange-500', description: '街道基层信息上报' },
  ];

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    rejected: '已驳回',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="分级发布管理"
        description="市级/区县/街道三级内容池分级管理与权限控制"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
        {tierInfo.map((tier) => {
          const Icon = tier.icon;
          const isExpanded = expandedTiers.has(tier.key);
          const contents = mockContent[tier.key];

          return (
            <div key={tier.key} className="bg-white rounded-xl shadow-card overflow-hidden">
              <button
                onClick={() => toggleTier(tier.key)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', tier.color)}>
                <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{tier.label}</h3>
                    <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                      {contents.length} 条内容
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{tier.description}</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {contents.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <img
                        src={item.coverImage}
                        alt=""
                        className="w-20 h-14 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                            {channelLabels[item.channel]}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.creatorName}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(item.publishTime || item.createTime).slice(5, 16)}
                          </span>
                        </div>
                      </div>

                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColors[item.status])}>
                        {statusLabels[item.status]}
                      </span>

                      <div className="flex items-center gap-1">
                        {tier.key !== 'city' && (
                          <button
                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="升级到上一级"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        )}
                        {tier.key !== 'street' && (
                          <button
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="下沉到下一级"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card p-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-600" />
              权限说明
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-700">市级运营员</p>
              <p className="text-blue-600 text-xs mt-1">可管理全市内容，可上下架</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-700">区县级运营员</p>
              <p className="text-green-600 text-xs mt-1">仅可管理本区县内容</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
              <p className="font-medium text-orange-700">街道级运营员</p>
              <p className="text-orange-600 text-xs mt-1">仅可上报街道级内容</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <h3 className="font-semibold text-slate-900 mb-4">区县列表</h3>
            <div className="space-y-1">
              {districts.map((district) => (
                <button
                  key={district}
                  onClick={() => setSelectedDistrict(district)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    selectedDistrict === district
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Building className="w-4 h-4" />
                  {district}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
            <h4 className="font-semibold mb-2">内容流转规则</h4>
            <ul className="text-sm text-white/80 space-y-1">
              <li>• 街道内容可升级到区县</li>
              <li>• 区县内容可升级到市级</li>
              <li>• 市级内容可全平台发布</li>
              <li>• 所有升级需审核通过</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

