import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deviceApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  Database,
  ArrowLeft,
  RefreshCw,
  Activity,
  Heart,
  Moon,
  MapPin,
  RotateCcw,
  PlusCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import dayjs from 'dayjs';

const DataSync: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlDeviceId = searchParams.get('deviceId');
  
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(urlDeviceId ? parseInt(urlDeviceId) : null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [syncTypes, setSyncTypes] = useState({
    steps: true,
    heart_rate: true,
    sleep: true,
    track: false
  });
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [supplementForm, setSupplementForm] = useState<{
    show: boolean;
    batchId: string;
    dataType: string;
    value: string;
  }>({ show: false, batchId: '', dataType: 'steps', value: '' });

  const addToast = useToastStore((s) => s.addToast);

  const deviceTypeLabels: Record<string, string> = {
    band: '手环',
    watch: '手表',
    web: 'Web',
    other: '其他'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    partially_completed: '部分完成'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    partially_completed: 'bg-orange-100 text-orange-700'
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadSyncHistory();
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const response = await deviceApi.getDevices({ status: 'active' });
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '加载设备列表失败');
    }
  };

  const loadSyncHistory = async () => {
    if (!selectedDevice) return;
    try {
      setHistoryLoading(true);
      const response = await deviceApi.getSyncHistory({ device_id: selectedDevice, page_size: 20 });
      if (response.data.success) {
        setSyncHistory(response.data.data.list || response.data.data);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '加载同步历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateMockData = () => {
    const dataPoints: any[] = [];
    const now = dayjs();

    if (syncTypes.steps) {
      dataPoints.push({
        type: 'steps',
        value: Math.floor(Math.random() * 5000) + 3000,
        timestamp: now.toISOString(),
        source: 'manual'
      });
    }
    if (syncTypes.heart_rate) {
      dataPoints.push({
        type: 'heart_rate',
        value: Math.floor(Math.random() * 40) + 60,
        timestamp: now.toISOString(),
        source: 'manual'
      });
    }
    if (syncTypes.sleep) {
      dataPoints.push({
        type: 'sleep',
        value: {
          deep: Math.floor(Math.random() * 120) + 60,
          light: Math.floor(Math.random() * 180) + 120,
          rem: Math.floor(Math.random() * 60) + 30
        },
        timestamp: now.subtract(1, 'day').toISOString(),
        source: 'manual'
      });
    }
    if (syncTypes.track) {
      dataPoints.push({
        type: 'track',
        value: {
          distance: Math.random() * 5 + 1,
          duration: Math.floor(Math.random() * 1800) + 600,
          points: [
            { lat: 39.9042 + Math.random() * 0.01, lng: 116.4074 + Math.random() * 0.01 },
            { lat: 39.9042 + Math.random() * 0.01, lng: 116.4074 + Math.random() * 0.01 }
          ]
        },
        timestamp: now.toISOString(),
        source: 'manual'
      });
    }

    return dataPoints;
  };

  const handleSync = async () => {
    if (!selectedDevice) {
      addToast('error', '请先选择设备');
      return;
    }
    const dataPoints = generateMockData();
    if (dataPoints.length === 0) {
      addToast('error', '请至少选择一种数据类型');
      return;
    }

    try {
      setLoading(true);
      const response = await deviceApi.syncData({
        device_id: selectedDevice,
        data_points: dataPoints
      });
      if (response.data.success) {
        addToast('success', '数据同步成功');
        loadSyncHistory();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '同步失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (batchId: string) => {
    try {
      const response = await deviceApi.retrySync(batchId);
      if (response.data.success) {
        addToast('success', '重试同步成功');
        loadSyncHistory();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '重试失败');
    }
    setOpenActionMenu(null);
  };

  const handleRevoke = async (dataId: number) => {
    if (!window.confirm('确定要撤销此批次数据吗？撤销后数据将被标记为无效。')) {
      return;
    }
    try {
      const response = await deviceApi.revokeData(dataId, { reason: '手动撤销' });
      if (response.data.success) {
        addToast('success', '数据撤销成功');
        loadSyncHistory();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '撤销失败');
    }
    setOpenActionMenu(null);
  };

  const handleSupplement = async () => {
    if (!selectedDevice || !supplementForm.value) {
      addToast('error', '请填写补录数据');
      return;
    }

    const dataPoints = [{
      type: supplementForm.dataType,
      value: supplementForm.dataType === 'steps' || supplementForm.dataType === 'heart_rate'
        ? parseInt(supplementForm.value)
        : supplementForm.value,
      timestamp: dayjs().toISOString(),
      source: 'supplement'
    }];

    try {
      setLoading(true);
      const response = await deviceApi.supplementData({
        device_id: selectedDevice,
        data_points: dataPoints
      });
      if (response.data.success) {
        addToast('success', '数据补录成功');
        setSupplementForm({ show: false, batchId: '', dataType: 'steps', value: '' });
        loadSyncHistory();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '补录失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedDeviceInfo = devices.find(d => d.id === selectedDevice);

  return (
    <div className="space-y-6">
      <Link
        to="/devices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回设备列表
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据同步</h1>
          <p className="text-sm text-gray-500 mt-1">手动同步和管理设备健康数据</p>
        </div>
        <button
          onClick={loadSyncHistory}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">选择设备</h3>
            <select
              value={selectedDevice || ''}
              onChange={(e) => setSelectedDevice(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">-- 请选择设备 --</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.device_name} ({deviceTypeLabels[device.device_type] || device.device_type})
                </option>
              ))}
            </select>

            {selectedDeviceInfo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Database className="w-4 h-4" />
                  <span>设备UUID: {selectedDeviceInfo.device_uuid}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">同步数据类型</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncTypes.steps}
                  onChange={(e) => setSyncTypes({ ...syncTypes, steps: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-700">步数</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncTypes.heart_rate}
                  onChange={(e) => setSyncTypes({ ...syncTypes, heart_rate: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-gray-700">心率</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncTypes.sleep}
                  onChange={(e) => setSyncTypes({ ...syncTypes, sleep: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Moon className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-700">睡眠</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncTypes.track}
                  onChange={(e) => setSyncTypes({ ...syncTypes, track: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">轨迹</span>
                </div>
              </label>
            </div>

            <button
              onClick={handleSync}
              disabled={loading || !selectedDevice}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  同步中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  开始同步
                </>
              )}
            </button>

            <button
              onClick={() => setSupplementForm({ ...supplementForm, show: true })}
              disabled={!selectedDevice}
              className="w-full mt-3 py-3 border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              补录数据
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">同步历史</h3>
            
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : !selectedDevice ? (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>请先选择设备查看同步历史</p>
              </div>
            ) : syncHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>暂无同步记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">批次ID</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">成功</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">重复</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">错误</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">同步时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.map((batch) => (
                      <tr key={batch.batch_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {batch.batch_id}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[batch.status] || 'bg-gray-100 text-gray-700'}`}>
                            {statusLabels[batch.status] || batch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-600 font-medium">{batch.success_count || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-600 font-medium">{batch.duplicate_count || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-red-600 font-medium">{batch.error_count || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {dayjs(batch.sync_at).format('MM-DD HH:mm')}
                        </td>
                        <td className="py-3 px-4 text-right relative">
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === batch.batch_id ? null : batch.batch_id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {openActionMenu === batch.batch_id && (
                            <div className="absolute right-4 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                              {(batch.status === 'failed' || batch.status === 'partially_completed') && batch.error_count > 0 && (
                                <button
                                  onClick={() => handleRetry(batch.batch_id)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  重试失败
                                </button>
                              )}
                              <button
                                onClick={() => setSupplementForm({ show: true, batchId: batch.batch_id, dataType: 'steps', value: '' })}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                              >
                                <PlusCircle className="w-4 h-4" />
                                补录数据
                              </button>
                              {batch.status === 'completed' && (
                                <button
                                  onClick={() => handleRevoke(batch.id || batch.batch_id)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  撤销数据
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {syncHistory.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  总同步次数
                </div>
                <p className="text-2xl font-bold text-gray-800">{syncHistory.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  成功数据
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {syncHistory.reduce((sum, b) => sum + (b.success_count || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  重复数据
                </div>
                <p className="text-2xl font-bold text-gray-600">
                  {syncHistory.reduce((sum, b) => sum + (b.duplicate_count || 0), 0)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  错误数据
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {syncHistory.reduce((sum, b) => sum + (b.error_count || 0), 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {supplementForm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">补录数据</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">数据类型</label>
                <select
                  value={supplementForm.dataType}
                  onChange={(e) => setSupplementForm({ ...supplementForm, dataType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="steps">步数</option>
                  <option value="heart_rate">心率</option>
                  <option value="sleep">睡眠</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {supplementForm.dataType === 'steps' ? '步数' : supplementForm.dataType === 'heart_rate' ? '心率 (BPM)' : '睡眠数据 (JSON)'}
                </label>
                {supplementForm.dataType === 'sleep' ? (
                  <textarea
                    value={supplementForm.value}
                    onChange={(e) => setSupplementForm({ ...supplementForm, value: e.target.value })}
                    placeholder='{"deep": 120, "light": 180, "rem": 60}'
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                ) : (
                  <input
                    type="number"
                    value={supplementForm.value}
                    onChange={(e) => setSupplementForm({ ...supplementForm, value: e.target.value })}
                    placeholder={supplementForm.dataType === 'steps' ? '例如：8000' : '例如：75'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSupplementForm({ show: false, batchId: '', dataType: 'steps', value: '' })}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSupplement}
                disabled={loading}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? '补录中...' : '确认补录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSync;
