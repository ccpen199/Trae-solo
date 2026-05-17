import React, { useState, useEffect } from 'react';
import { adminApi, userApi } from '../api/client';
import {
  Video,
  Users,
  Play,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';

interface Stats {
  totalVideos: number;
  totalUsers: number;
  totalPlays: number;
  totalAds: number;
  vipUsers: number;
}

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'videos' | 'ads'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    is_vip: false,
    aspect_ratio: '16:9'
  });

  useEffect(() => {
    loadStats();
    loadVideos();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      const response = await adminApi.getVideos(1, 50);
      if (response.success && response.data) {
        setVideos(response.data.list);
      }
    } catch (err) {
      console.error('加载视频列表失败:', err);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await adminApi.updateVideo(editingVideo.id, formData);
      } else {
        await adminApi.createVideo(formData);
      }
      setShowVideoModal(false);
      setEditingVideo(null);
      setFormData({ title: '', description: '', url: '', thumbnail: '', is_vip: false, aspect_ratio: '16:9' });
      loadVideos();
      loadStats();
    } catch (err) {
      console.error('保存视频失败:', err);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (window.confirm('确定要删除这个视频吗？')) {
      try {
        await adminApi.deleteVideo(id);
        loadVideos();
        loadStats();
      } catch (err) {
        console.error('删除视频失败:', err);
      }
    }
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      url: video.url,
      thumbnail: video.thumbnail || '',
      is_vip: video.is_vip,
      aspect_ratio: video.aspect_ratio || '16:9'
    });
    setShowVideoModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-64 bg-gray-800 p-4">
        <h1 className="text-xl font-bold text-white mb-8">XX视频管理后台</h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            数据概览
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'videos' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Video className="w-5 h-5" />
            视频管理
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'ads' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Play className="w-5 h-5" />
            广告管理
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8">
        {activeTab === 'dashboard' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">数据概览</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Video className="w-8 h-8 text-blue-500" />
                  <span className="text-green-500 text-sm">↑ 12%</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalVideos}</p>
                <p className="text-gray-400 text-sm">总视频数</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-500" />
                  <span className="text-green-500 text-sm">↑ 8%</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-gray-400 text-sm">总用户数</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Play className="w-8 h-8 text-green-500" />
                  <span className="text-green-500 text-sm">↑ 25%</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalPlays}</p>
                <p className="text-gray-400 text-sm">总播放量</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-yellow-500" />
                  <span className="text-green-500 text-sm">↑ 5%</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.vipUsers}</p>
                <p className="text-gray-400 text-sm">VIP用户</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">视频管理</h2>
              <button
                onClick={() => {
                  setEditingVideo(null);
                  setFormData({ title: '', description: '', url: '', thumbnail: '', is_vip: false, aspect_ratio: '16:9' });
                  setShowVideoModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Plus className="w-5 h-5" />
                添加视频
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">视频</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">类型</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">状态</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={video.thumbnail || 'https://picsum.photos/80/45'}
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="text-white font-medium">{video.title}</p>
                            <p className="text-gray-400 text-sm truncate max-w-xs">{video.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {video.is_vip ? (
                          <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
                            VIP
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
                            免费
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          video.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {video.status === 'active' ? '已上线' : '已下线'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="p-2 text-blue-400 hover:bg-gray-700 rounded transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-2 text-red-400 hover:bg-gray-700 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">广告管理</h2>
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">广告管理功能开发中...</p>
            </div>
          </div>
        )}
      </div>

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingVideo ? '编辑视频' : '添加视频'}
            </h3>
            <form onSubmit={handleSubmitVideo} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">视频标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">视频描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">视频地址</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">封面地址</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_vip}
                    onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
                    className="w-4 h-4 accent-yellow-500"
                  />
                  <span className="text-gray-300 text-sm">VIP专享</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">宽高比:</span>
                  <select
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="px-3 py-1 bg-gray-700 text-white rounded focus:outline-none"
                  >
                    <option value="16:9">16:9</option>
                    <option value="4:3">4:3</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
