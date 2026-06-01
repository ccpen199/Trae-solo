import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  Home,
  Tv,
  Settings,
  Plus,
  Play,
  BarChart3,
  Package,
  LogOut,
  Power,
  Clock,
  Wifi,
  Bluetooth,
  Zap,
  ChevronRight,
  TrendingUp,
  Activity,
  Database,
  Shield,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mic,
  Volume2,
  VolumeX,
  Camera,
  Grid3x3,
  Trash2,
  Edit3,
  Save,
  X,
  PlayCircle,
  SaveCircle
} from 'lucide-react';

const API_BASE = `http://127.0.0.1:${import.meta.env.VITE_BACKEND_PORT || '56792'}/api`;
const SOCKET_URL = `http://127.0.0.1:${import.meta.env.VITE_BACKEND_PORT || '56792'}`;

const socket = io(SOCKET_URL);

function App() {
  const [devices, setDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadDevices();

    socket.on('device:status', (data) => {
      setDevices(prev => prev.map(d =>
        d.id === data.deviceId ? { ...d, status: data.status } : d
      ));
    });

    return () => {
      socket.off('device:status');
    };
  }, []);

  const loadDevices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Zap className="h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">智能家电控制</span>
                </div>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                  <Link
                    to="/"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'dashboard'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <Home className="h-4 w-4 mr-1" />
                    控制台
                  </Link>
                  <Link
                    to="/epg"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'epg'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('epg')}
                  >
                    <Tv className="h-4 w-4 mr-1" />
                    节目单
                  </Link>
                  <Link
                    to="/analytics"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'analytics'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    数据分析
                  </Link>
                  <Link
                    to="/sdk"
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'sdk'
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('sdk')}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    SDK管理
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-4">
                  {devices.length} 个设备在线
                </span>
                <Link
                  to="/admin"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<DeviceList />} />
            <Route path="/devices/:id" element={<DeviceDetail />} />
            <Route path="/devices/:id/control" element={<DeviceControl />} />
            <Route path="/learn" element={<LearningWizard />} />
            <Route path="/epg" element={<EPGPage />} />
            <Route path="/recordings" element={<RecordingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/sdk" element={<SDKPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    error: 0
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      setDevices(response.data);

      const newStats = {
        total: response.data.length,
        online: response.data.filter(d => d.status === 'online').length,
        offline: response.data.filter(d => d.status === 'offline').length,
        error: response.data.filter(d => d.status === 'error').length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const getProtocolIcon = (protocol) => {
    switch (protocol) {
      case 'IR':
        return <Zap className="h-5 w-5" />;
      case 'WIFI':
        return <Wifi className="h-5 w-5" />;
      case 'BLUETOOTH_MESH':
        return <Bluetooth className="h-5 w-5" />;
      default:
        return <Power className="h-5 w-5" />;
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">控制台</h1>
        <p className="mt-2 text-sm text-gray-600">管理您的智能家居设备</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">设备总数</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">在线设备</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.online}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                <Power className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">离线设备</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.offline}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">异常设备</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.error}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <Link
          to="/devices"
          className="btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          添加设备
        </Link>
        <Link
          to="/learn"
          className="btn-secondary inline-flex items-center"
        >
          <Camera className="h-5 w-5 mr-2" />
          红外学习向导
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">设备列表</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {devices.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              暂无设备，点击上方按钮添加
            </li>
          ) : (
            devices.map((device) => (
              <li key={device.id}>
                <Link
                  to={`/devices/${device.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getProtocolIcon(device.protocol)}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-primary-600 truncate">{device.name}</p>
                            <span className={`ml-2 status-badge ${device.status === 'online' ? 'status-online' : device.status === 'offline' ? 'status-offline' : 'status-error'}`}>
                              {device.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {device.device_type} • {device.protocol}
                            {device.manufacturer && ` • ${device.manufacturer}`}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    device_type: 'air_conditioner',
    protocol: 'IR',
    manufacturer: '',
    model: ''
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleAddDevice = async () => {
    try {
      await axios.post(`${API_BASE}/devices`, newDevice);
      setShowAddModal(false);
      setNewDevice({
        name: '',
        device_type: 'air_conditioner',
        protocol: 'IR',
        manufacturer: '',
        model: ''
      });
      loadDevices();
    } catch (error) {
      console.error('Failed to add device:', error);
      alert('添加设备失败');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">设备管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理所有已连接的智能家居设备</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary inline-flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          添加设备
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">添加新设备</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备名称</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="input-field"
                  placeholder="例如：客厅空调"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
                <select
                  value={newDevice.device_type}
                  onChange={(e) => setNewDevice({ ...newDevice, device_type: e.target.value })}
                  className="input-field"
                >
                  <option value="air_conditioner">空调</option>
                  <option value="television">电视</option>
                  <option value="fan">风扇</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">通信协议</label>
                <select
                  value={newDevice.protocol}
                  onChange={(e) => setNewDevice({ ...newDevice, protocol: e.target.value })}
                  className="input-field"
                >
                  <option value="IR">红外（IR）</option>
                  <option value="WIFI">Wi-Fi</option>
                  <option value="BLUETOOTH_MESH">蓝牙Mesh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">厂商（可选）</label>
                <input
                  type="text"
                  value={newDevice.manufacturer}
                  onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
                  className="input-field"
                  placeholder="例如：格力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">型号（可选）</label>
                <input
                  type="text"
                  value={newDevice.model}
                  onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                  className="input-field"
                  placeholder="例如：KFR-35GW"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddDevice} className="btn-primary flex-1">
                  添加
                </button>
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {devices.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">暂无设备</li>
          ) : (
            devices.map((device) => (
              <li key={device.id}>
                <Link
                  to={`/devices/${device.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary-600">{device.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {device.device_type} • {device.protocol}
                        </p>
                      </div>
                      <span className={`status-badge ${device.status === 'online' ? 'status-online' : device.status === 'offline' ? 'status-offline' : 'status-error'}`}>
                        {device.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    loadDevice();
    loadCodes();
  }, [id]);

  const loadDevice = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices/${id}`);
      setDevice(response.data);
    } catch (error) {
      console.error('Failed to load device:', error);
    }
  };

  const loadCodes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/control/${id}/codes`);
      setCodes(response.data);
    } catch (error) {
      console.error('Failed to load codes:', error);
    }
  };

  if (!device) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link to="/devices" className="text-primary-600 hover:text-primary-800 text-sm">
          ← 返回设备列表
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{device.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {device.device_type} • {device.protocol}
              {device.manufacturer && ` • ${device.manufacturer}`}
              {device.model && ` • ${device.model}`}
            </p>
          </div>
          <span className={`status-badge ${device.status === 'online' ? 'status-online' : device.status === 'offline' ? 'status-offline' : 'status-error'}`}>
            {device.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">设备指纹</p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1">{device.fingerprint}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">最后控制时间</p>
            <p className="text-sm mt-1">
              {device.last_control_at ? new Date(device.last_control_at).toLocaleString() : '从未'}
            </p>
          </div>
        </div>

        {device.capabilities && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">设备能力</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm font-mono overflow-x-auto">
                {JSON.stringify(device.capabilities, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to={`/devices/${id}/control`}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-6 flex items-center justify-between transition-colors"
        >
          <div>
            <h3 className="text-lg font-medium">遥控面板</h3>
            <p className="text-sm text-primary-100 mt-1">控制此设备</p>
          </div>
          <Grid3x3 className="h-8 w-8" />
        </Link>

        <Link
          to="/learn"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 flex items-center justify-between transition-colors"
        >
          <div>
            <h3 className="text-lg font-medium">红外学习</h3>
            <p className="text-sm text-green-100 mt-1">学习新按键</p>
          </div>
          <Camera className="h-8 w-8" />
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">已学习的按键</h3>
        {codes.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无已学习的按键</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {codes.map((code) => (
              <div key={code.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{code.key_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {code.event_type === 'short' ? '短按' : '长按'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeviceControl() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [codes, setCodes] = useState([]);
  const [controlState, setControlState] = useState({});
  const [isControlling, setIsControlling] = useState(false);

  useEffect(() => {
    loadDevice();
    loadCodes();
  }, [id]);

  const loadDevice = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices/${id}`);
      setDevice(response.data);
    } catch (error) {
      console.error('Failed to load device:', error);
    }
  };

  const loadCodes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/control/${id}/codes`);
      setCodes(response.data);
    } catch (error) {
      console.error('Failed to load codes:', error);
    }
  };

  const handleControl = async (keyName, codeData) => {
    setIsControlling(true);
    try {
      const response = await axios.post(`${API_BASE}/control/${id}/control`, {
        command: keyName,
        params: codeData
      });

      if (response.data.success) {
        setControlState(prev => ({ ...prev, [keyName]: true }));
        setTimeout(() => {
          setControlState(prev => ({ ...prev, [keyName]: false }));
        }, 300);
      }

      loadDevice();
    } catch (error) {
      console.error('Control failed:', error);
    } finally {
      setIsControlling(false);
    }
  };

  if (!device) {
    return <div className="text-center py-8">加载中...</div>;
  }

  const powerCode = codes.find(c => c.key_name === 'power');
  const otherCodes = codes.filter(c => c.key_name !== 'power');

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/devices/${id}`} className="text-primary-600 hover:text-primary-800 text-sm">
          ← 返回设备详情
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{device.name}</h1>
        <p className="text-sm text-gray-600">
          {device.device_type} • {device.protocol}
          {device.manufacturer && ` • ${device.manufacturer}`}
        </p>
      </div>

      {codes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无遥控按键</h3>
          <p className="text-sm text-gray-600 mb-6">
            请使用红外学习向导添加遥控按键
          </p>
          <Link
            to="/learn"
            className="btn-primary inline-flex items-center"
          >
            <Camera className="h-5 w-5 mr-2" />
            前往学习
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="grid grid-cols-4 gap-4">
            {codes.map((code) => (
              <button
                key={code.id}
                onClick={() => handleControl(code.key_name, code.code_data)}
                disabled={isControlling}
                className={`
                  relative h-20 rounded-xl font-medium text-sm
                  transition-all duration-200 transform
                  ${code.key_name === 'power'
                    ? 'bg-red-600 hover:bg-red-700 text-white col-span-2'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }
                  ${controlState[code.key_name] ? 'scale-95 ring-4 ring-primary-300' : ''}
                  ${isControlling ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span>{code.key_name}</span>
                {controlState[code.key_name] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LearningWizard() {
  const [step, setStep] = useState(1);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [keyName, setKeyName] = useState('');
  const [learningStatus, setLearningStatus] = useState('idle');
  const [cameraStream, setCameraStream] = useState(null);
  const [learningResult, setLearningResult] = useState(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setLearningStatus('capturing');
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startLearning = async () => {
    if (!selectedDevice || !keyName) {
      alert('请选择设备和按键名称');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/control/${selectedDevice}/learn`, {
        key_name: keyName
      });

      setLearningResult(response.data);
      setLearningStatus('waiting_confirmation');

      setTimeout(() => {
        if (learningStatus === 'waiting_confirmation') {
          confirmLearning();
        }
      }, 30000);
    } catch (error) {
      console.error('Learning failed:', error);
      alert('学习失败');
    }
  };

  const confirmLearning = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/control/${selectedDevice}/learn/${learningResult.learning_id}/confirm`,
        {
          frequency: 38000,
          format: 'NEC',
          event_type: 'short'
        }
      );

      setLearningStatus('success');
      setStep(4);
      stopCamera();
    } catch (error) {
      console.error('Confirmation failed:', error);
      setLearningStatus('failed');
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedDevice(null);
    setKeyName('');
    setLearningStatus('idle');
    setLearningResult(null);
    stopCamera();
  };

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">红外学习向导</h1>
        <p className="mt-2 text-sm text-gray-600">通过摄像头扫描遥控器按键生成红外码库</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium
                ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step >= 1 ? 'text-primary-600' : 'text-gray-600'}>选择设备</span>
          <span className={step >= 2 ? 'text-primary-600' : 'text-gray-600'}>准备扫描</span>
          <span className={step >= 3 ? 'text-primary-600' : 'text-gray-600'}>捕获信号</span>
          <span className={step >= 4 ? 'text-primary-600' : 'text-gray-600'}>完成</span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">选择设备</h2>
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                暂无设备，请先添加设备
              </p>
            ) : (
              devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedDevice === device.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {device.device_type} • {device.protocol}
                      </p>
                    </div>
                    {selectedDevice === device.id && (
                      <CheckCircle className="h-6 w-6 text-primary-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedDevice}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">输入按键信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">按键名称</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="input-field"
                placeholder="例如：电源、音量+、频道1"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              上一步
            </button>
            <button
              onClick={() => {
                setStep(3);
                startCamera();
              }}
              disabled={!keyName}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始扫描
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">捕获红外信号</h2>

          <div className="aspect-video bg-gray-900 rounded-lg mb-4 overflow-hidden relative">
            {cameraStream ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream;
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                等待摄像头启动...
              </div>
            )}

            {learningStatus === 'capturing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <div className="animate-pulse">
                    <Camera className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">将遥控器对准摄像头，按下要学习的按键</p>
                  </div>
                </div>
              </div>
            )}

            {learningStatus === 'waiting_confirmation' && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-900 bg-opacity-75">
                <div className="text-center text-white">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">信号已捕获！请在设备上确认</p>
                  <p className="text-sm mt-2 text-green-200">等待时间：30秒</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={confirmLearning}
              disabled={learningStatus !== 'waiting_confirmation'}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="h-5 w-5 mr-2 inline" />
              确认学习
            </button>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                setStep(2);
                stopCamera();
              }}
              className="btn-secondary"
            >
              上一步
            </button>
            <button onClick={resetWizard} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-gray-900 mb-2">学习成功！</h2>
            <p className="text-gray-600 mb-6">
              按键 "{keyName}" 已成功学习并保存
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={resetWizard} className="btn-primary">
                继续学习
              </button>
              <Link to="/devices" className="btn-secondary">
                返回设备列表
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EPGPage() {
  const [channels, setChannels] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].channel_id);
    }
  }, [channels]);

  useEffect(() => {
    if (selectedChannel) {
      loadPrograms();
    }
  }, [selectedChannel, selectedDate]);

  const loadChannels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/epg/channels`);
      if (response.data.length === 0) {
        await seedChannels();
        const newResponse = await axios.get(`${API_BASE}/epg/channels`);
        setChannels(newResponse.data);
      } else {
        setChannels(response.data);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const seedChannels = async () => {
    const defaultChannels = [
      { channel_id: 'cctv1', channel_name: 'CCTV-1 综合', channel_number: 1, category: '综合' },
      { channel_id: 'cctv2', channel_name: 'CCTV-2 财经', channel_number: 2, category: '财经' },
      { channel_id: 'cctv5', channel_name: 'CCTV-5 体育', channel_number: 5, category: '体育' },
      { channel_id: 'hunan', channel_name: '湖南卫视', channel_number: 10, category: '综艺' },
      { channel_id: 'zjtv', channel_name: '浙江卫视', channel_number: 11, category: '综艺' }
    ];

    for (const channel of defaultChannels) {
      try {
        await axios.post(`${API_BASE}/epg/channels`, channel);
      } catch (error) {
        console.error('Failed to seed channel:', error);
      }
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await axios.get(`${API_BASE}/epg/programs`, {
        params: {
          channel_id: selectedChannel,
          date: selectedDate
        }
      });

      if (response.data.length === 0) {
        await seedPrograms();
        const newResponse = await axios.get(`${API_BASE}/epg/programs`, {
          params: {
            channel_id: selectedChannel,
            date: selectedDate
          }
        });
        setPrograms(newResponse.data);
      } else {
        setPrograms(response.data);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  };

  const seedPrograms = async () => {
    const programs = [
      { channel_id: 'cctv1', program_name: '新闻联播', start_time: `${selectedDate} 19:00:00`, end_time: `${selectedDate} 19:30:00`, description: '权威新闻节目', category: '新闻' },
      { channel_id: 'cctv1', program_name: '天气预报', start_time: `${selectedDate} 19:32:00`, end_time: `${selectedDate} 19:38:00`, description: '全国天气预报', category: '生活' },
      { channel_id: 'cctv1', program_name: '焦点访谈', start_time: `${selectedDate} 19:38:00`, end_time: `${selectedDate} 20:00:00`, description: '深度报道', category: '新闻' },
      { channel_id: 'cctv5', program_name: '体育新闻', start_time: `${selectedDate} 18:00:00`, end_time: `${selectedDate} 19:00:00`, description: '最新体育资讯', category: '体育' },
      { channel_id: 'cctv5', program_name: '足球直播', start_time: `${selectedDate} 20:00:00`, end_time: `${selectedDate} 22:00:00`, description: '精彩足球赛事', category: '体育' },
      { channel_id: 'hunan', program_name: '综艺节目', start_time: `${selectedDate} 20:00:00`, end_time: `${selectedDate} 22:00:00`, description: '精彩综艺节目', category: '综艺' }
    ];

    for (const program of programs) {
      try {
        await axios.post(`${API_BASE}/epg/programs`, program);
      } catch (error) {
        console.error('Failed to seed program:', error);
      }
    }
  };

  const handleRecord = async (program) => {
    try {
      await axios.post(`${API_BASE}/epg/recordings`, {
        channel_id: program.channel_id,
        program_name: program.program_name,
        scheduled_time: program.start_time,
        end_time: program.end_time
      });
      alert('录制预约成功！');
    } catch (error) {
      console.error('Failed to schedule recording:', error);
      alert('录制预约失败');
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">节目单</h1>
        <p className="mt-2 text-sm text-gray-600">查看节目预告和录制预约</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">频道列表</h3>
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.channel_id}
                  onClick={() => setSelectedChannel(channel.channel_id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedChannel === channel.channel_id
                      ? 'bg-primary-100 text-primary-900'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{channel.channel_name}</p>
                  <p className="text-xs text-gray-600">{channel.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">节目预告</h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field w-auto"
              />
            </div>

            <div className="space-y-3">
              {programs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无节目信息</p>
              ) : (
                programs.map((program) => (
                  <div
                    key={program.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{program.program_name}</h4>
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {program.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {program.start_time.split(' ')[1]} - {program.end_time.split(' ')[1]}
                        </p>
                        {program.description && (
                          <p className="text-sm text-gray-500 mt-2">{program.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRecord(program)}
                        className="ml-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        预约
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/recordings"
              className="btn-secondary inline-flex items-center"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              查看所有录制计划
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/epg/recordings`);
      setRecordings(response.data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-offline',
      recording: 'bg-blue-100 text-blue-800',
      completed: 'status-online',
      failed: 'status-error'
    };
    return badges[status] || 'status-offline';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待执行',
      recording: '录制中',
      completed: '已完成',
      failed: '失败'
    };
    return texts[status] || status;
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">录制管理</h1>
        <p className="mt-2 text-sm text-gray-600">管理所有预约的录制任务</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">录制列表</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recordings.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              暂无录制计划
            </li>
          ) : (
            recordings.map((recording) => (
              <li key={recording.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{recording.program_name}</p>
                      <span className={`ml-2 status-badge ${getStatusBadge(recording.status)}`}>
                        {getStatusText(recording.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {recording.channel_id} • {new Date(recording.scheduled_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const [usageData, setUsageData] = useState([]);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const usageResponse = await axios.get(`${API_BASE}/analytics/usage`);
      setUsageData(usageResponse.data);

      const prefResponse = await axios.get(`${API_BASE}/analytics/preferences`);
      setPreferences(prefResponse.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
        <p className="mt-2 text-sm text-gray-600">设备使用报告和观看偏好分析</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">观看偏好</h3>
          {preferences ? (
            <div className="space-y-4">
              {preferences.preferences?.length > 0 ? (
                preferences.preferences.map((pref, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{pref.category}</span>
                      <span className="font-medium">{pref.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${pref.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">暂无观看数据</p>
              )}

              {preferences.interest_tags?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">兴趣标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences.interest_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">加载中...</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">设备使用统计</h3>
          {usageData.length > 0 ? (
            <div className="space-y-4">
              {usageData.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-900">设备 #{report.device_id}</p>
                    <span className="text-sm text-gray-600">{report.report_date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">使用时长</p>
                      <p className="font-medium">{(report.total_duration / 60).toFixed(1)} 小时</p>
                    </div>
                    <div>
                      <p className="text-gray-600">控制次数</p>
                      <p className="font-medium">{report.control_count} 次</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无使用数据</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SDKPage() {
  const [packages, setPackages] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    package_name: '',
    version: '',
    device_type: 'air_conditioner',
    package_data: {}
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sdk/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const handleUpload = async () => {
    try {
      await axios.post(`${API_BASE}/sdk/upload`, newPackage);
      setShowUploadModal(false);
      setNewPackage({
        package_name: '',
        version: '',
        device_type: 'air_conditioner',
        package_data: {}
      });
      loadPackages();
    } catch (error) {
      console.error('Failed to upload package:', error);
      alert('上传失败');
    }
  };

  const handleTest = async (id) => {
    try {
      await axios.post(`${API_BASE}/sdk/${id}/test`);
      loadPackages();
    } catch (error) {
      console.error('Failed to test package:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'status-offline',
      testing: 'bg-yellow-100 text-yellow-800',
      approved: 'status-online',
      rejected: 'status-error'
    };
    return badges[status] || 'status-offline';
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SDK管理</h1>
          <p className="mt-2 text-sm text-gray-600">管理设备能力描述模型和SDK适配包</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary inline-flex items-center"
        >
          <Upload className="h-5 w-5 mr-2" />
          上传SDK
        </button>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">上传SDK包</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">包名称</label>
                <input
                  type="text"
                  value={newPackage.package_name}
                  onChange={(e) => setNewPackage({ ...newPackage, package_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
                <input
                  type="text"
                  value={newPackage.version}
                  onChange={(e) => setNewPackage({ ...newPackage, version: e.target.value })}
                  className="input-field"
                  placeholder="1.0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备类型</label>
                <select
                  value={newPackage.device_type}
                  onChange={(e) => setNewPackage({ ...newPackage, device_type: e.target.value })}
                  className="input-field"
                >
                  <option value="air_conditioner">空调</option>
                  <option value="television">电视</option>
                  <option value="fan">风扇</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpload} className="btn-primary flex-1">
                  上传
                </button>
                <button onClick={() => setShowUploadModal(false)} className="btn-secondary flex-1">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {packages.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              暂无SDK包，点击上方按钮上传
            </li>
          ) : (
            packages.map((pkg) => (
              <li key={pkg.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">{pkg.package_name}</p>
                      <span className="ml-2 text-sm text-gray-600">v{pkg.version}</span>
                      <span className={`ml-2 status-badge ${getStatusBadge(pkg.status)}`}>
                        {pkg.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {pkg.device_type} • {new Date(pkg.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {pkg.status === 'pending' && (
                      <button
                        onClick={() => handleTest(pkg.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        测试
                      </button>
                    )}
                    {pkg.status === 'testing' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        测试中...
                      </span>
                    )}
                    {pkg.status === 'approved' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                        已上线
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function AdminPage() {
  const [capabilities, setCapabilities] = useState([]);

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/devices`);
      const devices = response.data;
      const caps = await Promise.all(
        devices.map(async (device) => {
          try {
            const capResponse = await axios.get(`${API_BASE}/devices/${device.id}/capabilities`);
            return {
              device_id: device.id,
              device_name: device.name,
              device_type: device.device_type,
              capabilities: capResponse.data
            };
          } catch {
            return null;
          }
        })
      );
      setCapabilities(caps.filter(c => c !== null));
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
        <p className="mt-2 text-sm text-gray-600">系统管理和配置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">设备能力模型</h3>
          {capabilities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无设备能力数据</p>
          ) : (
            <div className="space-y-4">
              {capabilities.map((cap) => (
                <div key={cap.device_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-gray-900">{cap.device_name}</p>
                    <span className="text-sm text-gray-600">{cap.device_type}</span>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(cap.capabilities, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">系统信息</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">前端端口</p>
              <p className="font-medium">{import.meta.env.VITE_FRONTEND_PORT || '46792'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">后端端口</p>
              <p className="font-medium">{import.meta.env.VITE_BACKEND_PORT || '56792'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">数据库路径</p>
              <p className="font-medium text-sm">./data/app.sqlite</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">安全特性</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  设备指纹水印
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  TLS 1.3 加密
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  用户主动确认
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
