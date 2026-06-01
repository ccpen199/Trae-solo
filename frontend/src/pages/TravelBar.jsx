import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart, Eye, Plus } from 'lucide-react';
import { travelBarAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const TravelBar = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchTopics(1);
  }, []);

  const fetchTopics = async (pageNum) => {
    setLoading(true);
    try {
      const response = await travelBarAPI.getTravelBars({ page: pageNum, limit: 10 });
      if (pageNum === 1) {
        setTopics(response.data.travelBars);
      } else {
        setTopics(prev => [...prev, ...response.data.travelBars]);
      }
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error('获取旅吧话题失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTopics(nextPage);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">旅吧</h1>
          <p className="text-gray-500 mt-1">分享旅行经验，讨论旅行话题</p>
        </div>
        {isAuthenticated && (
          <Link to="#" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            发布话题
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/travel-bar/${topic.id}`}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow block"
          >
            <div className="flex items-start gap-4">
              <img
                src={topic.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                alt={topic.author_name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{topic.author_name}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(topic.created_at).toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">{topic.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{topic.content}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {topic.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {topic.comments_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center py-8">
          <button onClick={handleLoadMore} className="btn-secondary">
            加载更多
          </button>
        </div>
      )}

      {!loading && topics.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">暂无话题</p>
          {isAuthenticated && (
            <p className="mt-2">发布第一个话题，开始讨论吧！</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelBar;
