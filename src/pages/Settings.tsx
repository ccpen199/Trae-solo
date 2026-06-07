import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../utils/api';
import { Settings as SettingsIcon, Save, DollarSign, Clock, Award, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getSettings();
      setSettings(res.settings);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dashboardApi.updateSettings(settings);
      setSavedMsg('保存成功！');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">系统设置</h2>
        <p className="text-sm text-gray-500">配置平台核心业务规则与参数</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-600" /> 佣金计费规则
          </h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                二手房买卖佣金费率（%）
              </label>
              <input
                type="number"
                step="0.01"
                value={parseFloat(settings.commission_rate_sale || '0') * 100}
                onChange={e => updateSetting('commission_rate_sale', (parseFloat(e.target.value) / 100).toFixed(4))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">如 2.5 表示费率为 2.5%</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                佣金折扣（折）
              </label>
              <input
                type="number"
                step="0.1"
                value={parseFloat(settings.commission_discount || '1') * 10}
                onChange={e => updateSetting('commission_discount', (parseFloat(e.target.value) / 10).toFixed(2))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">如 5 表示五折优惠，10 表示不打折</p>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-800">
              <span className="font-medium">计费示例：</span>
              成交价 500 万 × {parseFloat(settings.commission_rate_sale || '0.025') * 100}% × {parseFloat(settings.commission_discount || '0.5') * 10}折 =
              <span className="font-bold ml-1">
                ¥ {(5000000 * parseFloat(settings.commission_rate_sale || '0.025') * parseFloat(settings.commission_discount || '0.5')).toLocaleString()} 元
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" /> 工单SLA时效配置（小时）
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">保洁工单</label>
            <input
              type="number"
              value={settings.sla_cleaning || '48'}
              onChange={e => updateSetting('sla_cleaning', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">维修工单</label>
            <input
              type="number"
              value={settings.sla_repair || '24'}
              onChange={e => updateSetting('sla_repair', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">搬家工单</label>
            <input
              type="number"
              value={settings.sla_moving || '72'}
              onChange={e => updateSetting('sla_moving', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">装修工单</label>
            <input
              type="number"
              value={settings.sla_renovation || '168'}
              onChange={e => updateSetting('sla_renovation', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" /> 信用分规则
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">按时支付租金奖励（分/期）</label>
            <input
              type="number"
              value={settings.credit_score_on_time_bonus || '5'}
              onChange={e => updateSetting('credit_score_on_time_bonus', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-green-600 mt-1">每按时支付一期租金增加的信用分</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">逾期支付扣减（分/次）</label>
            <input
              type="number"
              value={settings.credit_score_overdue_penalty || '10'}
              onChange={e => updateSetting('credit_score_overdue_penalty', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-red-600 mt-1">每次逾期支付扣减的信用分</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">信用分联动说明：</span>
              系统已对接芝麻信用模拟接口，租客信用分 = 内部信用分 + 芝麻信用分加权。
              按时支付可获得奖励分，逾期支付将扣减信用分，信用分范围 350-950。
              信用分过低的租客将无法签约新租约。
            </p>
          </div>
        </div>
      </div>

      {/* Current settings table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary-600" /> 所有配置项
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">配置键</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">配置值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(settings).map(([k, v]) => (
                <tr key={k} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-mono text-gray-800">{k}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end items-center gap-4">
        {savedMsg && <span className="text-green-600 text-sm flex items-center gap-1">✓ {savedMsg}</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
