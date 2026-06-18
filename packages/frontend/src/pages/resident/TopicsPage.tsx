import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Heart,
  MessageSquare,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { TOPIC_CATEGORIES } from '@neighborhood/shared';
import type { TopicCategory } from '@neighborhood/shared';

const categoryTabs: { label: string; value: TopicCategory | 'all' }[] = [
  { label: '全部', value: 'all' },
  ...TOPIC_CATEGORIES,
];

export default function TopicsPage() {
  const [activeCategory, setActiveCategory] = useState<TopicCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [crossCommunity, setCrossCommunity] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索话题..."
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setCrossCommunity(!crossCommunity)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          {crossCommunity ? (
            <ToggleRight className="w-5 h-5 text-primary-600" />
          ) : (
            <ToggleLeft className="w-5 h-5" />
          )}
          跨社区
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Link key={i} to={`/topics/${i}`} className="card block hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">邻居{i}</span>
                  <span className="badge-blue">生活</span>
                </div>
                <h4 className="mt-1 text-sm font-medium text-gray-900">
                  社区话题标题示例 - 关于小区绿化带的讨论
                </h4>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  最近发现小区绿化带的花开了，非常漂亮，大家有没有注意到？分享一下你们拍的照片吧...
                </p>
                <div className="mt-2 flex gap-2">
                  {[1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0"
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>幸福花园</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {5 + i}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {2 + i}
                    </span>
                    <span>2小时前</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/topics/create"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
