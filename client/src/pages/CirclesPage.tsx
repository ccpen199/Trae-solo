import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { circleCategoryLabels } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import type { Circle, CircleCategory } from '@/types/shared';

export default function CirclesPage() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/circles', {
        params: {
          category: activeCategory || undefined,
          pageSize: 20,
        },
      });
      setCircles(res.data.data.data);
    } catch (error) {
      console.error('Failed to fetch circles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, [activeCategory]);

  const categories = [
    { key: '', label: '全部' },
    ...Object.entries(circleCategoryLabels).map(([key, label]) => ({ key, label })),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">兴趣圈子</h1>
        <Button>+ 创建圈子</Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12">
          <Loading text="加载中..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((circle) => (
            <Card key={circle.id} hoverable className="overflow-hidden">
              <Link to={`/circle/${circle.id}`}>
                <div className="h-32 bg-gray-200 relative">
                  <img
                    src={circle.coverImage}
                    alt={circle.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={circle.avatar} alt={circle.name} size="md" />
                      <h3 className="text-white font-semibold">{circle.name}</h3>
                    </div>
                    <Tag color="secondary" size="sm">
                      {circleCategoryLabels[circle.category as CircleCategory]}
                    </Tag>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">
                    {circle.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{circle.memberCount} 成员</span>
                    <span>{circle.postCount} 帖子</span>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
