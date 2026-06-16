import { useState } from 'react';
import { Plus, Search, TrendingUp, Flame, Sparkles } from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { CommunityPost } from '@shared/types';
import { cn } from '@/lib/utils';

const mockPosts: CommunityPost[] = [
  {
    id: 'post1',
    ownerId: 'u1',
    petId: '1',
    content: '今天带豆豆去做了年度体检，各项指标都很正常！医生说它的毛发状态特别好，分享一下我平时的护理心得：\n\n1. 每天梳毛15分钟\n2. 每周洗澡一次，用宠物专用沐浴露\n3. 饮食以优质狗粮为主，偶尔加一些鸡胸肉\n4. 每天保证至少1小时的户外运动\n\n希望对大家有帮助～',
    images: [],
    tags: ['金毛', '宠物护理', '体检日记'],
    vaccineTag: '已接种狂犬疫苗',
    likes: 128,
    comments: 32,
    createdAt: '2025-06-14T10:30:00Z',
  },
  {
    id: 'post2',
    ownerId: 'u2',
    content: '新手养猫求助！我家猫咪最近总是抓耳朵，是不是有耳螨啊？有没有有经验的铲屎官分享一下治疗方法？',
    images: [],
    tags: ['猫咪', '求助', '耳螨'],
    likes: 45,
    comments: 18,
    createdAt: '2025-06-13T15:20:00Z',
  },
  {
    id: 'post3',
    ownerId: 'u3',
    petId: '2',
    content: '晒一下我家咪咪的新窝！她超级喜欢，一放好就钻进去不肯出来了哈哈～选了奶油色的，和我家装修风格也很搭！',
    images: [],
    tags: ['猫咪', '宠物用品', '晒宠'],
    dewormingTag: '已完成本月驱虫',
    likes: 256,
    comments: 48,
    createdAt: '2025-06-12T20:15:00Z',
  },
  {
    id: 'post4',
    ownerId: 'u4',
    content: '【科普】狗狗不能吃的食物清单\n\n1. 巧克力 - 含有可可碱，对狗狗有毒\n2. 葡萄/葡萄干 - 可能导致肾衰竭\n3. 洋葱/大蒜 - 会损伤红细胞\n4. 木糖醇 - 可能导致低血糖\n5. 煮熟的骨头 - 容易碎裂划伤消化道\n\n转发给身边养狗的朋友！',
    images: [],
    tags: ['科普', '养狗知识', '安全提醒'],
    likes: 589,
    comments: 87,
    createdAt: '2025-06-11T09:00:00Z',
  },
];

const tabs = [
  { value: 'latest', label: '最新', Icon: Sparkles },
  { value: 'hot', label: '热门', Icon: Flame },
  { value: 'trending', label: '话题', Icon: TrendingUp },
];

const hotTags = ['金毛', '猫咪', '求助', '宠物护理', '科普', '晒宠', '狗粮推荐', '领养'];

export default function Community() {
  const [tab, setTab] = useState('latest');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">宠物社区</h1>
          <p className="section-subtitle">和铲屎官们一起交流分享</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-5 h-5" />
          发布动态
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索话题、内容..."
                  className="input-field pl-12"
                />
              </div>
              <div className="flex gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium transition-all',
                      tab === t.value
                        ? 'bg-forest-500 text-white shadow-soft'
                        : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                    )}
                  >
                    <t.Icon className="w-4 h-4" />
                    <span className="text-sm">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-warm-500" />
              热门话题
            </h3>
            <div className="flex flex-wrap gap-2">
              {hotTags.map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-cream-50 text-gray-700 text-sm hover:bg-cream-100 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display font-bold text-gray-900 mb-4">社区公约</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  1
                </span>
                尊重他人，友善交流
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  2
                </span>
                分享真实养宠经验
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  3
                </span>
                拒绝广告和不实信息
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                  4
                </span>
                保护宠物，反对虐待
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
