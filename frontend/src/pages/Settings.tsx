import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Home } from 'lucide-react';
import useHomeStore from '../store/useHomeStore';
import { useToast } from '../components/Toast';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { homes, currentHomeId, rooms, setCurrentHome, addHome, updateHome, deleteHome, addRoom, updateRoom, deleteRoom } = useHomeStore();
  
  const [showAddHomeModal, setShowAddHomeModal] = useState(false);
  const [showEditHomeModal, setShowEditHomeModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingHome, setEditingHome] = useState<any>(null);
  const [newHomeName, setNewHomeName] = useState('');
  const [newHomeLocation, setNewHomeLocation] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const currentHome = homes.find((h) => h.id === currentHomeId);
  const currentRooms = rooms.filter((r) => r.homeId === currentHomeId);

  const handleAddHome = async () => {
    if (!newHomeName.trim()) {
      showToast('请输入家庭名称', 'error');
      return;
    }
    try {
      await addHome(newHomeName.trim(), newHomeLocation.trim());
      showToast('家庭创建成功', 'success');
      setShowAddHomeModal(false);
      setNewHomeName('');
      setNewHomeLocation('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateHome = async () => {
    if (!editingHome || !newHomeName.trim()) {
      showToast('请输入家庭名称', 'error');
      return;
    }
    try {
      await updateHome(editingHome.id, {
        name: newHomeName.trim(),
        location: newHomeLocation.trim(),
      });
      showToast('家庭信息更新成功', 'success');
      setShowEditHomeModal(false);
      setEditingHome(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteHome = async (home: any) => {
    if (!window.confirm(`确定要删除家庭"${home.name}"吗？此操作不可恢复。`)) {
      return;
    }
    try {
      await deleteHome(home.id);
      showToast('家庭删除成功', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddRoom = async () => {
    if (!currentHomeId) {
      showToast('请先选择家庭', 'error');
      return;
    }
    if (!newRoomName.trim()) {
      showToast('请输入房间名称', 'error');
      return;
    }
    try {
      await addRoom(currentHomeId, newRoomName.trim());
      showToast('房间创建成功', 'success');
      setShowAddRoomModal(false);
      setNewRoomName('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !newRoomName.trim()) {
      showToast('请输入房间名称', 'error');
      return;
    }
    try {
      await updateRoom(editingRoom.id, newRoomName.trim());
      showToast('房间信息更新成功', 'success');
      setEditingRoom(null);
      setNewRoomName('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoom = async (room: any) => {
    if (!window.confirm(`确定要删除房间"${room.name}"吗？`)) {
      return;
    }
    try {
      await deleteRoom(room.id);
      showToast('房间删除成功', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold ml-2">家庭设置</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">家庭管理</h2>
            <button
              onClick={() => setShowAddHomeModal(true)}
              className="flex items-center space-x-1 text-primary-600 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>添加家庭</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {homes.map((home) => (
              <div
                key={home.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  home.id === currentHomeId
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => setCurrentHome(home.id)}
                  >
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Home className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium">{home.name}</p>
                      {home.location && (
                        <p className="text-sm text-gray-500">{home.location}</p>
                      )}
                    </div>
                    {home.id === currentHomeId && (
                      <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full ml-auto">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingHome(home);
                        setNewHomeName(home.name);
                        setNewHomeLocation(home.location || '');
                        setShowEditHomeModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHome(home)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {homes.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无家庭</p>
              </div>
            )}
          </div>
        </div>

        {currentHome && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">房间管理</h2>
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="flex items-center space-x-1 text-primary-600 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>添加房间</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {currentRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{room.name}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setNewRoomName(room.name);
                      }}
                      className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {currentRooms.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm">
                  暂无房间，点击上方按钮添加
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddHomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">添加家庭</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家庭名称
                </label>
                <input
                  type="text"
                  value={newHomeName}
                  onChange={(e) => setNewHomeName(e.target.value)}
                  placeholder="例如：我的家"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置（可选）
                </label>
                <input
                  type="text"
                  value={newHomeLocation}
                  onChange={(e) => setNewHomeLocation(e.target.value)}
                  placeholder="例如：北京市朝阳区"
                  className="input"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddHomeModal(false);
                  setNewHomeName('');
                  setNewHomeLocation('');
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddHome}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditHomeModal && editingHome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">编辑家庭</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家庭名称
                </label>
                <input
                  type="text"
                  value={newHomeName}
                  onChange={(e) => setNewHomeName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置（可选）
                </label>
                <input
                  type="text"
                  value={newHomeLocation}
                  onChange={(e) => setNewHomeLocation(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditHomeModal(false);
                  setEditingHome(null);
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateHome}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">添加房间</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                房间名称
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="例如：客厅"
                className="input"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRoomModal(false);
                  setNewRoomName('');
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRoom}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">编辑房间</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                房间名称
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingRoom(null);
                  setNewRoomName('');
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateRoom}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
