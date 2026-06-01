import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Mic, Settings, Wifi, WifiOff, ChevronDown } from 'lucide-react';
import useHomeStore from '../store/useHomeStore';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { homes, currentHomeId, rooms, devices, loading, loadHomes, setCurrentHome, controlDevice } = useHomeStore();
  const [showHomeSelector, setShowHomeSelector] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  useEffect(() => {
    loadHomes();
  }, []);

  const currentHome = homes.find((h) => h.id === currentHomeId);

  const filteredDevices = activeRoomId
    ? devices.filter((d) => d.roomId === activeRoomId)
    : devices;

  const handleDeviceToggle = async (device: any) => {
    if (device.status === 'offline') {
      showToast('设备离线，无法控制', 'error');
      return;
    }
    try {
      await controlDevice(device.id, 'toggle');
      showToast('操作成功', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getDeviceIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      light: <Home className="w-6 h-6" />,
      ac: <Home className="w-6 h-6" />,
      outlet: <Home className="w-6 h-6" />,
      tv: <Home className="w-6 h-6" />,
    };
    return icons[type] || <Home className="w-6 h-6" />;
  };

  if (loading && devices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="加载中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setShowHomeSelector(!showHomeSelector)}
          >
            <h1 className="text-2xl font-bold">{currentHome?.name || '请选择家庭'}</h1>
            <ChevronDown className="w-5 h-5" />
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        {currentHome?.location && (
          <p className="text-white/80 text-sm">{currentHome.location}</p>
        )}
        <div className="flex items-center space-x-6 mt-4">
          <div>
            <p className="text-2xl font-bold">{devices.length}</p>
            <p className="text-white/80 text-sm">设备</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{devices.filter((d) => d.state?.power).length}</p>
            <p className="text-white/80 text-sm">运行中</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{devices.filter((d) => d.status === 'offline').length}</p>
            <p className="text-white/80 text-sm">离线</p>
          </div>
        </div>
      </div>

      {showHomeSelector && (
        <div className="bg-white mx-4 -mt-4 rounded-xl shadow-lg p-4 relative z-10">
          <h3 className="font-medium mb-3 text-gray-800">选择家庭</h3>
          <div className="space-y-2">
            {homes.map((home) => (
              <button
                key={home.id}
                onClick={() => {
                  setCurrentHome(home.id);
                  setShowHomeSelector(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  home.id === currentHomeId
                    ? 'bg-primary-50 text-primary-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{home.name}</p>
                {home.location && (
                  <p className="text-sm text-gray-500">{home.location}</p>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="w-full mt-3 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition-colors"
          >
            + 添加家庭
          </button>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setActiveRoomId(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              !activeRoomId
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                room.id === activeRoomId
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              onClick={() => handleDeviceToggle(device)}
              className={`cursor-pointer rounded-xl p-4 transition-all ${
                device.status === 'offline'
                  ? 'bg-gray-100 opacity-60'
                  : device.state?.power
                  ? 'device-card-on'
                  : 'device-card-off'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                {getDeviceIcon(device.type)}
                {device.status === 'offline' ? (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-400" />
                )}
              </div>
              <p className="font-medium mb-1">{device.name}</p>
              <p className="text-sm opacity-80">
                {device.status === 'offline'
                  ? '离线'
                  : device.state?.power
                  ? '运行中'
                  : '已关闭'}
              </p>
            </div>
          ))}
          
          <button
            onClick={() => navigate('/add-device')}
            className="rounded-xl p-4 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-8 h-8 mb-2" />
            <p className="text-sm">添加设备</p>
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center text-primary-500">
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">首页</span>
          </button>
          <button
            onClick={() => navigate('/automation')}
            className="flex flex-col items-center text-gray-400"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">智能</span>
          </button>
          <button
            onClick={() => navigate('/voice')}
            className="flex flex-col items-center -mt-8"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs mt-1 text-gray-500">语音</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
