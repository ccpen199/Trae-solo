import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Bookmark, Users, Eye, Heart } from 'lucide-react';
import { userAPI, guideAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('guides');
  const [myGuides, setMyGuides] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]);
  const [myFollowing, setMyFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'guides') {
        const response = await userAPI.getMyGuides();
        setMyGuides(response.data);
      } else if (activeTab === 'favorites') {
        const response = await userAPI.getMyFavorites();
        setMyFavorites(response.data);
      } else if (activeTab === 'following') {
        const response = await userAPI.getMyFollowing();
        setMyFollowing(response.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'guides', label: '我的攻略', icon: FileText },
    { id: 'favorites', label: '我的收藏', icon: Bookmark },
    { id: 'following', label: '我的关注', icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-6">
          <img
            src={user?.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
            alt={user?.username}
            className="h-24 w-24 rounded-full object-cover border-4 border-primary-100"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{user?.username}</h1>
            <p className="text-gray-500 mt-1">旅行者</p>
            <div className="flex items-center gap-8 mt-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-gray-800 text-lg">{myGuides.length}</p>
                <p className="text-gray-500">攻略</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-lg">{myFollowing.length}</p>
                <p className="text-gray-500">关注</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-lg">0</p>
                <p className="text-gray-500">粉丝</p>
              </div>
            </div>
          </div>
          <Link to="/create-guide" className="btn-primary">
            发布攻略
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'guides' && (
                <div className="space-y-4">
                  {myGuides.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">还没有发布过攻略</p>
                      <Link to="/create-guide" className="text-primary-500 hover:text-primary-600 mt-2 inline-block">
                        发布第一篇攻略
                      </Link>
                    </div>
                  ) : (
                    myGuides.map((guide) => (
                      <Link
                        key={guide.id}
                        to={`/guide/${guide.id}`}
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={guide.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`}
                          alt={guide.title}
                          className="h-24 w-36 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{guide.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            目的地: {guide.destination_name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {guide.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {guide.likes || 0}
                            </span>
                            <span className="text-xs">
                              {new Date(guide.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-4">
                  {myFavorites.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">还没有收藏任何攻略</p>
                      <Link to="/" className="text-primary-500 hover:text-primary-600 mt-2 inline-block">
                        去发现更多攻略
                      </Link>
                    </div>
                  ) : (
                    myFavorites.map((guide) => (
                      <Link
                        key={guide.id}
                        to={`/guide/${guide.id}`}
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={guide.cover_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=travel%20guide%20beautiful%20scenery&image_size=landscape_16_9`}
                          alt={guide.title}
                          className="h-24 w-36 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{guide.title}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={guide.author_avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                              alt={guide.author_name}
                              className="h-5 w-5 rounded-full object-cover"
                            />
                            <span className="text-sm text-gray-500">{guide.author_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {guide.views || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {guide.likes || 0}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'following' && (
                <div className="space-y-4">
                  {myFollowing.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">还没有关注任何人</p>
                      <Link to="/travel-bar" className="text-primary-500 hover:text-primary-600 mt-2 inline-block">
                        去旅吧发现更多有趣的旅行者
                      </Link>
                    </div>
                  ) : (
                    myFollowing.map((followUser) => (
                      <div
                        key={followUser.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={followUser.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traveler%20avatar%20portrait&image_size=square'}
                          alt={followUser.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{followUser.username}</h3>
                          <p className="text-sm text-gray-500">{followUser.bio || '旅行者'}</p>
                        </div>
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          已关注
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
