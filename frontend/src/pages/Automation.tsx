import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Zap, Calendar, Sun, Thermometer } from 'lucide-react';
import useHomeStore from '../store/useHomeStore';
import { useToast } from '../components/Toast';

interface Automation {
  id: string;
  name: string;
  enabled: number;
  conditions: any[];
  actions: any[];
  createdAt: number;
}

interface LogEntry {
  id: string;
  automationId?: string;
  deviceId?: string;
  type: string;
  message: string;
  success: number;
  createdAt: number;
  automationName?: string;
  deviceName?: string;
}

const AutomationPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentHomeId } = useHomeStore();
  const [activeTab, setActiveTab] = useState<'my' | 'recommended' | 'logs'>('my');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAutomationName, setNewAutomationName] = useState('');

  useEffect(() => {
    if (currentHomeId) {
      fetchAutomations();
      fetchLogs();
    }
  }, [currentHomeId]);

  useEffect(() => {
    if (currentHomeId && activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, currentHomeId]);

  const fetchAutomations = async () => {
    try {
      const response = await fetch(`/api/automations/home/${currentHomeId}`);
      const result = await response.json();
      if (result.success) {
        setAutomations(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch automations:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/automations/logs/home/${currentHomeId}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const toggleAutomation = async (id: string, currentEnabled: number) => {
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: currentEnabled ? 0 : 1 }),
      });
      const result = await response.json();
      
      if (result.success) {
        showToast('操作成功', 'success');
        fetchAutomations();
      } else {
        showToast(result.message || '操作失败', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '操作失败', 'error');
    }
  };

  const handleAddAutomation = async () => {
    if (!newAutomationName.trim()) {
      showToast('请输入自动化名称', 'error');
      return;
    }

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeId: currentHomeId,
          name: newAutomationName.trim(),
          conditions: [{ type: 'time', time: '18:00' }],
          actions: [{ type: 'device', action: 'powerOn' }],
        }),
      });
      const result = await response.json();

      if (result.success) {
        showToast('自动化创建成功', 'success');
        setShowAddModal(false);
        setNewAutomationName('');
        fetchAutomations();
      } else {
        showToast(result.message || '创建失败', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '创建失败', 'error');
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!window.confirm('确定要删除这个自动化吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        showToast('删除成功', 'success');
        fetchAutomations();
      } else {
        showToast(result.message || '删除失败', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '删除失败', 'error');
    }
  };

  const executeAutomation = async (id: string) => {
    try {
      const response = await fetch(`/api/automations/${id}/execute`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        showToast(result.message || '执行成功', 'success');
        fetchLogs();
        useHomeStore.getState().refreshDevices();
      } else {
        showToast(result.message || '执行失败', 'error');
      }
    } catch (err: any) {
      showToast(err.message || '执行失败', 'error');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'time':
        return <Clock className="w-4 h-4" />;
      case 'weather':
        return <Sun className="w-4 h-4" />;
      case 'sensor':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold ml-2">智能自动化</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-gray-100 bg-white">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'my'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          我的自动化
        </button>
        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'recommended'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          推荐
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          日志
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'my' && (
          <div className="space-y-3">
            {automations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无自动化</p>
                <p className="text-sm mt-1">点击右上角按钮创建</p>
              </div>
            ) : (
              automations.map((auto) => (
                <div
                  key={auto.id}
                  className="bg-white rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80"
                      onClick={() => executeAutomation(auto.id)}
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium">{auto.name}</p>
                        <p className="text-sm text-gray-500">
                          {auto.conditions?.length || 0} 个条件 · {auto.actions?.length || 0} 个动作
                        </p>
                        <p className="text-xs text-primary-500 mt-1">点击执行</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => toggleAutomation(auto.id, auto.enabled)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${
                          auto.enabled ? 'bg-primary-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                            auto.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => deleteAutomation(auto.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {auto.conditions && auto.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {auto.conditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {getConditionIcon(cond.type)}
                          <span>{cond.time || cond.type}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recommended' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">回家模式</p>
                  <p className="text-sm text-gray-500 mb-2">18:00 自动打开客厅灯和空调</p>
                  <button
                    onClick={() => {
                      setNewAutomationName('回家模式');
                      setShowAddModal(true);
                    }}
                    className="text-sm text-primary-600 font-medium"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">离家模式</p>
                  <p className="text-sm text-gray-500 mb-2">关闭所有设备</p>
                  <button
                    onClick={() => {
                      setNewAutomationName('离家模式');
                      setShowAddModal(true);
                    }}
                    className="text-sm text-primary-600 font-medium"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Moon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">睡眠模式</p>
                  <p className="text-sm text-gray-500 mb-2">22:00 关闭主灯，打开夜灯</p>
                  <button
                    onClick={() => {
                      setNewAutomationName('睡眠模式');
                      setShowAddModal(true);
                    }}
                    className="text-sm text-primary-600 font-medium"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">最近 {logs.length} 条记录</p>
              <button
                onClick={fetchLogs}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                刷新
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无日志</p>
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <div key={log.id} className="bg-white rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        log.success ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Zap
                        className={`w-4 h-4 ${log.success ? 'text-green-500' : 'text-red-500'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">
                        {log.automationName || log.deviceName || '设备控制'}
                      </p>
                      <p className="text-sm text-gray-500">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">添加自动化</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自动化名称
              </label>
              <input
                type="text"
                value={newAutomationName}
                onChange={(e) => setNewAutomationName(e.target.value)}
                placeholder="例如：回家模式"
                className="input"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAutomationName('');
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddAutomation}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
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

const Moon = (props: any) => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

export default AutomationPage;
