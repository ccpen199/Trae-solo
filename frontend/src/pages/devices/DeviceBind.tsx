import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deviceApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Watch, ArrowLeft, CheckCircle, Copy } from 'lucide-react';

const DeviceBind: React.FC = () => {
  const [formData, setFormData] = useState({
    device_type: 'band',
    device_name: '',
    device_uuid: ''
  });
  const [loading, setLoading] = useState(false);
  const [bindResult, setBindResult] = useState<{ auth_token: string; device_id: number } | null>(null);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const deviceTypeOptions = [
    { value: 'band', label: '手环' },
    { value: 'watch', label: '手表' },
    { value: 'web', label: 'Web' },
    { value: 'other', label: '其他' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.device_name.trim()) {
      addToast('error', '请输入设备名称');
      return;
    }
    if (!formData.device_uuid.trim()) {
      addToast('error', '请输入设备UUID');
      return;
    }

    try {
      setLoading(true);
      const response = await deviceApi.bindDevice(formData);
      if (response.data.success) {
        setBindResult(response.data.data);
        addToast('success', '设备绑定成功');
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '绑定失败');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (bindResult?.auth_token) {
      navigator.clipboard.writeText(bindResult.auth_token);
      addToast('success', 'Token 已复制到剪贴板');
    }
  };

  if (bindResult) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">绑定成功</h1>
            <p className="text-gray-500 mt-1">设备已成功绑定，请保存好授权令牌</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">设备名称</label>
              <p className="text-gray-800 font-medium">{formData.device_name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">设备ID</label>
              <p className="text-gray-800 font-mono">{bindResult.device_id}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <label className="block text-sm font-medium text-yellow-800 mb-2">授权令牌 (auth_token)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded border border-yellow-200 text-sm text-yellow-800 break-all">
                  {bindResult.auth_token}
                </code>
                <button
                  onClick={copyToken}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-yellow-700" />
                </button>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                请妥善保存此令牌，后续数据同步需要使用。令牌丢失后需重新绑定设备。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/devices"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Link>
            <button
              onClick={() => navigate(`/devices/sync?deviceId=${bindResult.device_id}`)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              开始同步数据
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to="/devices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        返回设备列表
      </Link>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Watch className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">绑定新设备</h1>
            <p className="text-sm text-gray-500">填写设备信息完成绑定</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {deviceTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.device_type === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="device_type"
                    value={option.value}
                    checked={formData.device_type === option.value}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.device_name}
              onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              placeholder="例如：我的小米手环7"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              设备UUID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.device_uuid}
              onChange={(e) => setFormData({ ...formData, device_uuid: e.target.value })}
              placeholder="例如：00:11:22:33:44:55 或设备唯一标识"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              您可以在设备的关于页面或设置中找到设备UUID
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                绑定中...
              </span>
            ) : (
              '确认绑定'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeviceBind;
