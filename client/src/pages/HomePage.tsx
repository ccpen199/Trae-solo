import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { categoryLabels } from '../utils/constants';
import { formatRelative } from '../utils/format';
import Card from '../components/Card';
import Tag from '../components/Tag';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import type { Post } from '@/types/shared';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts', {
        params: {
          page,
          pageSize: 10,
          category: activeCategory || undefined,
        },
      });
      setPosts(res.data.data.data);
      setTotal(res.data.data.total);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [page, activeCategory]);

  const categories = [
    { key: '', label: '全部' },
    ...Object.entries(categoryLabels).map(([key, label]) => ({ key, label })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
        ) : posts.length === 0 ? (
          <EmptyState
            icon="📝"
            title="暂无爆料"
            description="快来发布第一条爆料吧"
            action={
              <Link to="/create-post">
                <button className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  + 发布爆料
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} hoverable className="p-4">
                <Link to={`/post/${post.id}`} className="block">
                  <div className="flex items-center gap-3 mb-3">
                    {post.user && <Avatar src={post.user.avatar} alt={post.user.nickname} />}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{post.user?.nickname}</p>
                      <p className="text-xs text-gray-400">{formatRelative(post.createdAt)}</p>
                    </div>
                    <Tag color="primary" className="ml-auto">
                      {categoryLabels[post.category]}
                    </Tag>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {post.content}
                  </p>

                  {post.media && post.media.length > 0 && (
                    <div className={`grid gap-2 mb-3 ${
                      post.media.length === 1 ? 'grid-cols-1' :
                      post.media.length === 2 ? 'grid-cols-2' :
                      'grid-cols-3'
                    }`}>
                      {post.media.slice(0, 3).map((media, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={media.url || media.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {media.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-white text-2xl">▶️</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {post.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <span>📍</span>
                      <span>{post.location.district} · {post.location.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👁️ {post.views}</span>
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {total > 10 && (
          <div className="flex justify-center gap-2 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white text-gray-600 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-gray-600">
              第 {page} 页
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= total}
              className="px-4 py-2 rounded-lg bg-white text-gray-600 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">🔥 热门话题</h3>
          <div className="space-y-2">
            {['#惠州西湖夜景', '#桥东美食探店', '#罗浮山徒步', '#中考加油', '#夏日玩水好去处'].map((topic, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-gray-700 hover:text-primary-600 cursor-pointer">{topic}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">⚡ 快捷入口</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🚌', label: '客运班次', to: '/services?tab=transport' },
              { icon: '🎬', label: '影院排片', to: '/services?tab=cinema' },
              { icon: '💼', label: '招聘岗位', to: '/services?tab=jobs' },
              { icon: '🏛️', label: '政务预约', to: '/services?tab=government' },
            ].map((item) => (
              <Link key={item.label} to={item.to}>
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🌸</span>
            <h3 className="font-semibold">小红花积分</h3>
          </div>
          <p className="text-sm text-primary-100 mb-3">
            发帖、参加活动赚积分，兑换商家优惠券
          </p>
          <Link to="/points" className="inline-block bg-white text-primary-600 px-4 py-1.5 rounded-lg text-sm font-medium">
            去看看
          </Link>
        </Card>
      </div>
    </div>
  );
}
