import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Eye, Heart, BookmarkPlus } from 'lucide-react';
import { guideAPI, destinationAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [guides, setGuides] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchDestinations();
  }, []);

  useEffect(() => {
    fetchGuides(1);
  }, [selectedDestination, search]);

  const fetchDestinations = async () => {
    try {
      const response = await destinationAPI.getDestinations();
      setDestinations(response.data);
    } catch (error) {
      console.error('获取目的地失败:', error);
    }
  };

  const fetchGuides = async (pageNum) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 10 };
      if (selectedDestination) params.destination_id = selectedDestination;
      if (search) params.search = search;

      const response = await guideAPI.getGuides(params);
      if (pageNum === 1) {
        setGuides(response.data.guides);
      } else {
        setGuides(prev => [...prev, ...response.data.guides]);
      }
      setHasMore(response.data.pagination.hasMore);
    } catch (error) {
      console.error('获取攻略失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGuides(nextPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchGuides(1);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">发现世界的美好</h1>
        <p className="text-lg text-blue-100 mb-6">探索精彩旅行攻略，分享您的旅行故事</p>

        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索目的地、攻略..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            搜索
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-500" />
          热门目的地
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setSelectedDestination(null); setPage(1); }}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              !selectedDestination
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {destinations.slice(0, 8).map((dest) => (
            <button
              key={dest.id}
              onClick={() => { setSelectedDestination(dest.id); setPage(1); }}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedDestination === dest.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">精选攻略</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              to={`/guide/${guide.id}`}
              className="card group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={guide.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  {guide.destination_name}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                  {guide.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {guide.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {guide.likes || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={guide.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                      alt={guide.author_name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>{guide.author_name}</span>
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
            <button
              onClick={handleLoadMore}
              className="btn-secondary"
            >
              加载更多
            </button>
          </div>
        )}

        {!loading && guides.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BookmarkPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">暂无攻略</p>
            {isAuthenticated && (
              <Link to="/create-guide" className="text-primary-500 hover:text-primary-600 mt-2 inline-block">
                发布第一篇攻略
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
