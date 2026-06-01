import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Wifi, Grid3X3 } from 'lucide-react';
import useHomeStore from '../store/useHomeStore';
import { useToast } from '../components/Toast';

interface DeviceCategory {
  type: string;
  name: string;
  icon: string;
  devices: string[];
}

const AddDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentHomeId, rooms, addDevice } = useHomeStore();
  const [activeTab, setActiveTab] = useState<'nearby' | 'category'>('nearby');
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [nearbyDevices, setNearbyDevices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addingDevice, setAddingDevice] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchNearbyDevices();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/devices/categories/list');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchNearbyDevices = async () => {
    try {
      const response = await fetch('/api/devices/search/nearby');
      const result = await response.json();
      if (result.success) {
        setNearbyDevices(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch nearby devices:', err);
    }
  };

  const handleAddDevice = async (device: any) => {
    if (!currentHomeId) {
      showToast('请先选择家庭', 'error');
      return;
    }

    setAddingDevice(true);
    try {
      await addDevice({
        name: device.name,
        type: device.type,
        icon: device.icon,
        roomId: rooms[0]?.id,
      });
      showToast('设备添加成功', 'success');
      navigate(-1);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAddingDevice(false);
    }
  };

  const handleAddCategoryDevice = async (categoryType: string, deviceName: string) => {
    if (!currentHomeId) {
      showToast('请先选择家庭', 'error');
      return;
    }

    setAddingDevice(true);
    try {
      await addDevice({
        name: deviceName,
        type: categoryType,
        roomId: rooms[0]?.id,
      });
      showToast('设备添加成功', 'success');
      setSelectedCategory(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAddingDevice(false);
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
        <h1 className="text-lg font-semibold ml-2">添加设备</h1>
      </div>

      <div className="flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'nearby'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          附近设备
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'category'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          分类添加
        </button>
      </div>

      {activeTab === 'nearby' && (
        <div className="p-4">
          <div className="bg-white rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-primary-500" />
              <span className="font-medium">正在搜索附近设备...</span>
            </div>
            
            {nearbyDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Wifi className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>未发现附近设备</p>
                <p className="text-sm mt-1">请确保设备已通电并处于配网模式</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-gray-500">信号强度: {device.signal}%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddDevice(device)}
                      disabled={addingDevice}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="p-4">
          {selectedCategory ? (
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center text-primary-600 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回分类
              </button>
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-medium mb-3">选择设备类型</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories
                    .find((c) => c.type === selectedCategory)
                    ?.devices.map((deviceName) => (
                      <button
                        key={deviceName}
                        onClick={() => handleAddCategoryDevice(selectedCategory, deviceName)}
                        disabled={addingDevice}
                        className="p-4 bg-gray-50 rounded-lg text-center hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-50"
                      >
                        <p className="font-medium">{deviceName}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.type}
                  onClick={() => setSelectedCategory(category.type)}
                  className="bg-white rounded-xl p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                    <Grid3X3 className="w-6 h-6 text-primary-500" />
                  </div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.devices.length} 种设备</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddDevicePage;
