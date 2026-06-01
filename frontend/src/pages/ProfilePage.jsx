import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { photoAPI, deviceAPI } from '../utils/api';

const ProfilePage = () => {
  const [photos, setPhotos] = useState([]);
  const [devices, setDevices] = useState([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const { user, logout, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      loadMyPhotos();
      loadDevices();
    }
  }, [isAuthenticated]);

  const loadMyPhotos = async () => {
    try {
      const data = await photoAPI.getMyPhotos();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('加载照片失败:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const data = await deviceAPI.getDevices();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('加载设备失败:', error);
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) return;
    try {
      const deviceId = `device_${user.id}_${Date.now()}`;
      await deviceAPI.registerDevice(deviceId, newDeviceName, 'camera');
      setNewDeviceName('');
      setShowDeviceModal(false);
      await loadDevices();
    } catch (error) {
      console.error('添加设备失败:', error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('确定要删除这张照片吗？')) return;
    try {
      await photoAPI.deletePhoto(photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (error) {
      console.error('删除照片失败:', error);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!confirm('确定要删除这个设备吗？')) return;
    try {
      await deviceAPI.deleteDevice(deviceId);
      setDevices(devices.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('删除设备失败:', error);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl font-semibold mb-2">登录查看个人中心</h2>
          <p className="text-gray-500 mb-6">登录后可以管理您的照片和设备</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 pt-12 pb-8 px-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-medium">
            {(user.nickname || user.username).charAt(0).toUpperCase()}
          </div>
          <div className="text-white">
            <h2 className="text-xl font-semibold">{user.nickname || user.username}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {user.bio && <p className="text-white/70 text-sm mt-1">{user.bio}</p>}
          </div>
        </div>

        <div className="flex justify-around mt-6 text-white text-center">
          <div>
            <div className="text-2xl font-semibold">{photos.length}</div>
            <div className="text-sm text-white/70">照片</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{user.followers_count || 0}</div>
            <div className="text-sm text-white/70">粉丝</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{user.following_count || 0}</div>
            <div className="text-sm text-white/70">关注</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{devices.length}</div>
            <div className="text-sm text-white/70">设备</div>
          </div>
        </div>
      </div>

      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'photos'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500'
          }`}
        >
          我的照片
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'devices'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500'
          }`}
        >
          虚拟设备
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'photos' && (
          <div>
            {photos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📷</div>
                <p className="text-gray-500 mb-4">还没有照片，去拍摄吧！</p>
                <button
                  onClick={() => navigate('/camera')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium"
                >
                  去拍摄
                </button>
              </div>
            ) : (
              <div className="photo-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={photo.edited_url || photo.original_url}
                      alt="照片"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/edit/${photo.id}`)}
                        className="p-2 bg-white rounded-full text-purple-600"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="p-2 bg-white rounded-full text-red-500"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                    {photo.filter_used && (
                      <div className="absolute bottom-1 left-1 bg-white/90 px-2 py-0.5 rounded text-xs">
                        {photo.filter_used}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'devices' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">虚拟设备列表</h3>
              <button
                onClick={() => setShowDeviceModal(true)}
                className="text-sm text-purple-600 font-medium"
              >
                + 添加设备
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📱</div>
                <p className="text-gray-500 mb-4">还没有绑定虚拟设备</p>
                <button
                  onClick={() => setShowDeviceModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium"
                >
                  添加设备
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xl">
                        📷
                      </div>
                      <div>
                        <div className="font-medium">{device.device_name}</div>
                        <div className="text-xs text-gray-500">
                          {device.device_type} · {device.status === 'idle' ? '空闲' : device.status}
                        </div>
                        <div className="text-xs text-gray-400">
                          最后操作: {device.last_action || '无'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-full"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
            onClick={() => alert('编辑资料功能开发中...')}
          >
            <span>📝 编辑资料</span>
            <span className="text-gray-400">›</span>
          </button>
          <button
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 border-t"
            onClick={() => alert('设置功能开发中...')}
          >
            <span>⚙️ 设置</span>
            <span className="text-gray-400">›</span>
          </button>
          <button
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 border-t text-red-500"
            onClick={handleLogout}
          >
            <span>🚪 退出登录</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </div>

      {showDeviceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">添加虚拟设备</h3>
            <input
              type="text"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              placeholder="设备名称"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeviceModal(false)}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAddDevice}
                disabled={!newDeviceName.trim()}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;