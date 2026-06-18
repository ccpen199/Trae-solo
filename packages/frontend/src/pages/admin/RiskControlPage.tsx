import { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Search,
  Eye,
  Gift,
  DollarSign,
  UserX,
  Settings,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import Modal from '@/components/common/Modal';
import type { RiskAlert } from '@neighborhood/shared';
import * as adminApi from '@/api/admin';

type RiskTab = 'alerts' | 'sensitive' | 'redpacket' | 'withdraw' | 'aml';

const severityColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-red-500 bg-red-50',
  medium: 'text-orange-500 bg-orange-50',
  low: 'text-yellow-500 bg-yellow-50',
};

const severityLabels: Record<string, string> = {
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
};

const mockAlerts: RiskAlert[] = [
  {
    id: '1',
    type: 'withdraw_limit',
    severity: 'high',
    title: '用户异常提现',
    description: '用户UID12345 24小时内累计提现超过限额',
    isHandled: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'sensitive_topic',
    severity: 'medium',
    title: '敏感话题预警',
    description: '话题TOPIC678 包含敏感词汇，敏感度评分0.85',
    isHandled: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'aml',
    severity: 'critical',
    title: '反洗钱预警',
    description: '用户UID67890 月累计交易金额超过AML阈值',
    isHandled: true,
    createdAt: new Date(),
  },
];

const typeFilters = [
  { label: '全部', value: 'all' },
  { label: '提现限额', value: 'withdraw_limit' },
  { label: 'AML', value: 'aml' },
  { label: '可疑活动', value: 'suspicious_activity' },
  { label: '异常登录', value: 'abnormal_login' },
  { label: '敏感话题', value: 'sensitive_topic' },
];

const sensitiveLogs = [
  { id: '1', userId: 'UID12345', matchedWords: ['违禁词A', '违禁词B'], contentSnippet: '内容片段...', riskScore: 0.85, isBlocked: true, createdAt: '2024-01-15 10:30' },
  { id: '2', userId: 'UID67890', matchedWords: ['违禁词C'], contentSnippet: '内容片段...', riskScore: 0.65, isBlocked: false, createdAt: '2024-01-15 11:20' },
];

export default function RiskControlPage() {
  const [tab, setTab] = useState<RiskTab>('alerts');
  const [alertTypeFilter, setAlertTypeFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [handleRemark, setHandleRemark] = useState('');
  const [amlUserId, setAmlUserId] = useState('');
  const [amlResult, setAmlResult] = useState<string | null>(null);

  const filteredAlerts =
    alertTypeFilter === 'all'
      ? mockAlerts
      : mockAlerts.filter((a) => a.type === alertTypeFilter);

  const handleAlert = async () => {
    if (!selectedAlert) return;
    try {
      await adminApi.handleRiskAlert(selectedAlert.id, { handleRemark });
      setSelectedAlert(null);
      setHandleRemark('');
    } catch {}
  };

  const runAmlCheck = async () => {
    if (!amlUserId.trim()) return;
    try {
      const res = await adminApi.runAmlCheck(amlUserId);
      setAmlResult(JSON.stringify(res.data?.data || { passed: true, riskLevel: 'low' }, null, 2));
    } catch {
      setAmlResult('检查失败');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="风控中心" subtitle="风险预警、敏感词监控与反洗钱管理" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'alerts', label: '风险预警', icon: AlertTriangle },
          { key: 'sensitive', label: '敏感词日志', icon: Eye },
          { key: 'redpacket', label: '红包池', icon: Gift },
          { key: 'withdraw', label: '提现统计', icon: DollarSign },
          { key: 'aml', label: 'AML检查', icon: Shield },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setAlertTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  alertTypeFilter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${severityColors[alert.severity]}`}>
                        {severityLabels[alert.severity]}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {alert.isHandled ? (
                      <StatusBadge status="resolved" label="已处理" />
                    ) : (
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'sensitive' && (
        <div className="space-y-4">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">用户ID</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">匹配词</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">风险分</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">状态</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">时间</th>
                </tr>
              </thead>
              <tbody>
                {sensitiveLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-900">{log.userId}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        {log.matchedWords.map((w) => (
                          <span key={w} className="badge-red">{w}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={log.riskScore > 0.7 ? 'text-red-500 font-bold' : 'text-orange-500'}>
                        {log.riskScore}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {log.isBlocked ? (
                        <StatusBadge status="blocked" label="已拦截" />
                      ) : (
                        <StatusBadge status="active" label="已放行" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-400">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'redpacket' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500">当前余额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥52,300</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">累计发放</p>
              <p className="text-2xl font-bold text-green-500 mt-1">¥128,500</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">累计使用</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">¥76,200</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">提现统计</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">今日提现总额</p>
                <p className="text-lg font-bold text-gray-900 mt-1">¥8,500</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">今日提现笔数</p>
                <p className="text-lg font-bold text-gray-900 mt-1">23</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500">标记账户</p>
                <p className="text-lg font-bold text-red-500 mt-1">2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'aml' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">反洗钱检查工具</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={amlUserId}
                  onChange={(e) => setAmlUserId(e.target.value)}
                  placeholder="输入用户ID..."
                  className="input-field pl-9"
                />
              </div>
              <button onClick={runAmlCheck} className="btn-primary">
                执行检查
              </button>
            </div>
            {amlResult && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">检查结果</h4>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{amlResult}</pre>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">风控配置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">每日提现限额</span>
                <span className="text-sm font-medium text-gray-900">¥5,000</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">单次提现限额</span>
                <span className="text-sm font-medium text-gray-900">¥2,000</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">AML交易阈值</span>
                <span className="text-sm font-medium text-gray-900">¥30,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!selectedAlert}
        onClose={() => {
          setSelectedAlert(null);
          setHandleRemark('');
        }}
        title="处理风险预警"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedAlert.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedAlert.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`badge ${severityColors[selectedAlert.severity]}`}>
                  {severityLabels[selectedAlert.severity]}
                </span>
                <span className="text-xs text-gray-400">{selectedAlert.type}</span>
              </div>
            </div>
            <textarea
              value={handleRemark}
              onChange={(e) => setHandleRemark(e.target.value)}
              placeholder="处理备注..."
              className="input-field min-h-[80px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  setHandleRemark('');
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button onClick={handleAlert} className="btn-primary flex-1">
                确认处理
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
