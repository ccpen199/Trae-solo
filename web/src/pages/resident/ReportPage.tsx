import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceApi, workorderApi } from '../../api';
import type { Device } from '../../types';

const typeOptions = [
  { value: 'repair', label: '设备故障', icon: '⚠️' },
  { value: 'maintenance', label: '维护保养', icon: '🔧' },
  { value: 'complaint', label: '其他投诉', icon: '💬' }
];

const priorityOptions = [
  { value: 'low', label: '低', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'medium', label: '中', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'high', label: '高', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'urgent', label: '紧急', color: 'bg-red-50 text-red-700 border-red-200' }
];

const ReportPage = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [type, setType] = useState('repair');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({ pageSize: 100 });
      setDevices(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!deviceId) {
      alert('请选择设备');
      return;
    }
    if (!description.trim()) {
      alert('请填写问题描述');
      return;
    }
    if (description.trim().length < 5) {
      alert('问题描述至少需要 5 个字符');
      return;
    }
    setSubmitting(true);
    try {
      await workorderApi.create({
        deviceId,
        description: description.trim(),
        type,
        priority
      });
      const typeLabel = typeOptions.find(o => o.value === type)?.label || '';
      const priorityLabel = priorityOptions.find(o => o.value === priority)?.label || '';
      alert(`✅ 报修提交成功！\n\n报修类型：${typeLabel}\n优先级：${priorityLabel}\n\n我们会尽快安排处理人员，感谢您的反馈。`);
      navigate('/home');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || '提交失败，请稍后重试';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDevice = devices.find(d => d.id === deviceId);

  return (
    <div className="p-4 pb-6">
      <div className="flex items-center mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-lg"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-gray-800">报修中心</h2>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            选择设备 <span className="text-red-500">*</span>
          </label>
          {loading ? (
            <div className="text-center py-6 text-gray-400">加载设备列表...</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-6 text-gray-400">暂无设备</div>
          ) : (
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-gray-800"
            >
              <option value="">请选择需要报修的设备</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.location})
                </option>
              ))}
            </select>
          )}
          {selectedDevice && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                📍 {selectedDevice.location}<br />
                🔧 设备类型：{{ washer: '洗衣机', water_dispenser: '饮水机', shower: '淋浴终端' }[selectedDevice.type]}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">报修类型</label>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  type === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-2xl mb-1">{opt.icon}</span>
                <span className={`text-sm ${type === opt.value ? 'text-primary-600 font-medium' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">优先级</label>
          <div className="grid grid-cols-4 gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  priority === opt.value
                    ? `${opt.color} border-current`
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            紧急优先级适用于严重故障、安全隐患等情况
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            问题描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述遇到的问题，例如：\n• 具体的故障现象\n• 发生的时间\n• 尝试过的操作\n• 是否有异常声响等"
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-gray-800"
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-400">请至少填写 5 个字符</p>
            <p className="text-xs text-gray-400">{description.length} / 500</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-sm text-amber-700">
            💡 <strong>温馨提示：</strong><br />
            提交后我们将尽快安排专业人员处理。如遇紧急情况，请拨打物业电话。
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/30"
        >
          {submitting ? '提交中...' : '提交报修'}
        </button>
      </div>
    </div>
  );
};

export default ReportPage;
