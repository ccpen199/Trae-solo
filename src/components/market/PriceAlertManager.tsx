import React, { useState, useEffect } from 'react';
import { Plus, Bell, BellOff, Trash2, AlertTriangle, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { PriceAlert } from '../../../shared/types';
import { CATEGORIES } from '../../../shared/types';
import { marketAPI } from '@/services/api';
import { cn } from '@/lib/utils';

export const PriceAlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '1',
    threshold: '',
    type: 'above' as 'above' | 'below',
    notifyType: ['app'] as string[],
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await marketAPI.getAlerts();
      if (response.success && response.data) {
        setAlerts(response.data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.threshold || Number(formData.threshold) <= 0) {
      alert('请输入有效的价格阈值');
      return;
    }

    setSubmitLoading(true);
    try {
      const categoryName = CATEGORIES.find(c => c.id === formData.category)?.name || '';
      const response = await marketAPI.createAlert(
        categoryName,
        Number(formData.threshold),
        formData.type,
        formData.notifyType
      );
      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          category: '1',
          threshold: '',
          type: 'above',
          notifyType: ['app'],
        });
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
    setSubmitLoading(false);
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    try {
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, enabled: !enabled } : a
      ));
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('确定要删除这个预警吗？')) return;
    try {
      await marketAPI.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const toggleNotifyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      notifyType: prev.notifyType.includes(type)
        ? prev.notifyType.filter(t => t !== type)
        : [...prev.notifyType, type]
    }));
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">价格预警订阅</h2>
            <p className="text-sm text-slate-500 mt-1">设置价格阈值，及时获取行情变动提醒</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建预警
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <BellOff className="w-16 h-16 mb-4 opacity-30" />
              <p>暂无价格预警</p>
              <p className="text-sm mt-1">点击上方按钮创建新的预警</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                    alert.enabled
                      ? 'bg-white border-slate-200 hover:border-green-300'
                      : 'bg-slate-50 border-slate-100 opacity-60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      alert.enabled ? 'bg-green-100' : 'bg-slate-200'
                    )}>
                      <AlertTriangle className={cn(
                        'w-6 h-6',
                        alert.enabled ? 'text-green-600' : 'text-slate-400'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{alert.categoryName}</h3>
                        <Badge variant={alert.enabled ? 'success' : 'default'} size="sm">
                          {alert.enabled ? '已启用' : '已停用'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                        {alert.type === 'above' ? (
                          <ArrowUp className="w-4 h-4 text-orange-500" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-green-500" />
                        )}
                        <span>
                          价格{alert.type === 'above' ? '高于' : '低于'}
                          <span className="font-mono font-bold text-slate-800 mx-1">
                            ¥{Number(alert.threshold).toLocaleString()}
                          </span>
                          时提醒
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {alert.notifyChannels.map(channel => (
                          <span key={channel} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {channel === 'sms' ? '短信' : channel === 'email' ? '邮件' : 'APP推送'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, alert.enabled)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        alert.enabled
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      )}
                      title={alert.enabled ? '停用预警' : '启用预警'}
                    >
                      {alert.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除预警"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">新建价格预警</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择品类
                </label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  options={CATEGORIES.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  预警类型
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'above' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                      formData.type === 'above'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <ArrowUp className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">价格上涨</p>
                      <p className="text-xs opacity-70">高于阈值时提醒</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'below' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                      formData.type === 'below'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <ArrowDown className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">价格下跌</p>
                      <p className="text-xs opacity-70">低于阈值时提醒</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  价格阈值（元/吨）
                </label>
                <Input
                  type="number"
                  placeholder="请输入价格阈值"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  通知方式
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'sms', label: '短信通知', icon: '📱' },
                    { value: 'email', label: '邮件通知', icon: '📧' },
                    { value: 'app', label: 'APP推送', icon: '🔔' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleNotifyType(option.value)}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm',
                        formData.notifyType.includes(option.value)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </Button>
                <Button type="submit" className="flex-1" isLoading={submitLoading}>
                  创建预警
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
