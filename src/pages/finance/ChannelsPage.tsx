import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Gauge,
  HeartPulse,
  Save,
  ShieldAlert,
  SlidersVertical,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { cn } from '../../utils';
import { useAppStore } from '@/stores/appStore';

type ChannelKey = 'wechat' | 'alipay' | 'unionpay' | 'balance';

interface ChannelState {
  enabled: boolean;
  rate: number;
  weight: number;
  dailyLimit: number;
  usedAmount: number;
  successRate: number;
  requestCount: number;
  avgResponseMs: number;
  todayFails: number;
}

const defaultChannels: Record<ChannelKey, ChannelState> = {
  wechat: {
    enabled: true,
    rate: 0.38,
    weight: 40,
    dailyLimit: 500000,
    usedAmount: 312450,
    successRate: 99.2,
    requestCount: 8421,
    avgResponseMs: 185,
    todayFails: 12,
  },
  alipay: {
    enabled: true,
    rate: 0.38,
    weight: 35,
    dailyLimit: 500000,
    usedAmount: 198720,
    successRate: 98.8,
    requestCount: 5230,
    avgResponseMs: 210,
    todayFails: 18,
  },
  unionpay: {
    enabled: true,
    rate: 0.55,
    weight: 10,
    dailyLimit: 200000,
    usedAmount: 28600,
    successRate: 96.5,
    requestCount: 892,
    avgResponseMs: 320,
    todayFails: 42,
  },
  balance: {
    enabled: true,
    rate: 0.05,
    weight: 15,
    dailyLimit: 300000,
    usedAmount: 45830,
    successRate: 99.9,
    requestCount: 1560,
    avgResponseMs: 45,
    todayFails: 2,
  },
};

const channelMeta: Record<ChannelKey, {
  name: string;
  icon: string;
  gradient: string;
  iconBg: string;
  accent: string;
}> = {
  wechat: {
    name: '微信支付',
    icon: '💚',
    gradient: 'from-green-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-green-500/15 text-green-600',
    accent: 'border-green-500/30',
  },
  alipay: {
    name: '支付宝',
    icon: '💙',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-500/15 text-blue-600',
    accent: 'border-blue-500/30',
  },
  unionpay: {
    name: '银联支付',
    icon: '💳',
    gradient: 'from-red-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-red-500/15 text-red-600',
    accent: 'border-red-500/30',
  },
  balance: {
    name: '余额支付',
    icon: '💰',
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
    iconBg: 'bg-yellow-500/15 text-yellow-600',
    accent: 'border-yellow-500/30',
  },
};

export default function ChannelsPage() {
  const { showToast } = useAppStore();

  const [channels, setChannels] = useState<Record<ChannelKey, ChannelState>>(defaultChannels);
  const [thresholds, setThresholds] = useState({
    timeoutSeconds: 30,
    failRatePercent: 5,
    maxDailyFails: 100,
  });
  const [originalChannels] = useState(defaultChannels);

  const hasChanges = useMemo(() => {
    return (Object.keys(channels) as ChannelKey[]).some(
      (k) =>
        channels[k].enabled !== originalChannels[k].enabled ||
        channels[k].rate !== originalChannels[k].rate ||
        channels[k].weight !== originalChannels[k].weight ||
        channels[k].dailyLimit !== originalChannels[k].dailyLimit
    );
  }, [channels, originalChannels]);

  const totalWeight = useMemo(
    () => (Object.values(channels) as ChannelState[]).reduce((s, c) => s + (c.enabled ? c.weight : 0), 0),
    [channels]
  );

  const healthStatus = useMemo(() => {
    return (Object.keys(channels) as ChannelKey[]).map((key) => {
      const c = channels[key];
      if (!c.enabled) return { key, status: 'off' as const, score: 0 };
      const rateScore = Math.max(0, 100 - (100 - c.successRate) * 20);
      const respScore = Math.max(0, 100 - (c.avgResponseMs - 100));
      const failScore = Math.max(0, 100 - c.todayFails * 2);
      const usagePercent = (c.usedAmount / c.dailyLimit) * 100;
      const usageScore = usagePercent > 90 ? Math.max(0, 100 - (usagePercent - 90) * 10) : 100;
      const score = Math.round((rateScore + respScore + failScore + usageScore) / 4);
      let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
      if (score < 40) status = 'critical';
      else if (score < 65) status = 'warning';
      else if (score < 85) status = 'good';
      return { key, status, score };
    });
  }, [channels]);

  const statusConfig = {
    excellent: { text: '优秀', color: 'text-success', bg: 'bg-success/15', border: 'border-success/30' },
    good: { text: '良好', color: 'text-primary', bg: 'bg-primary/15', border: 'border-primary/30' },
    warning: { text: '注意', color: 'text-accent', bg: 'bg-accent/15', border: 'border-accent/30' },
    critical: { text: '异常', color: 'text-danger', bg: 'bg-danger/15', border: 'border-danger/30' },
    off: { text: '已停用', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
  };

  const updateChannel = (key: ChannelKey, patch: Partial<ChannelState>) => {
    setChannels((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSave = () => {
    showToast('通道配置已保存，新配置立即生效', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-7 h-7 text-primary" />
              支付通道配置
            </h1>
            <p className="text-sm text-gray-500 mt-1">管理支付通道开关、费率权重与熔断阈值</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs text-accent flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                有未保存的更改
              </span>
            )}
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1.5" />
              保存配置
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {healthStatus.map(({ key, status, score }) => {
            const meta = channelMeta[key];
            const st = statusConfig[status];
            return (
              <Card key={key} className={cn(
                'bg-gradient-to-br overflow-hidden transition-all',
                meta.gradient,
                st.border,
                channels[key].enabled ? 'border' : 'border border-gray-200 opacity-60'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{meta.name}</div>
                        <div className="text-[11px] text-gray-500">
                          费率 {channels[key].rate}% · 权重 {channels[key].weight}%
                        </div>
                      </div>
                    </div>
                    <Badge variant={status === 'excellent' ? 'success' : status === 'good' ? 'info' : status === 'warning' ? 'warning' : status === 'critical' ? 'danger' : 'default'}>
                      {st.text}
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[11px] text-gray-500 mb-1">健康分</div>
                      <div className={cn('text-2xl font-bold', st.color)}>
                        {status === 'off' ? '--' : score}
                      </div>
                    </div>
                    <div className="w-24">
                      <ProgressBar
                        value={status === 'off' ? 0 : score}
                        variant={status === 'excellent' ? 'success' : status === 'good' ? 'primary' : 'accent'}
                        height={6}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {(Object.keys(channels) as ChannelKey[]).map((key) => {
            const c = channels[key];
            const meta = channelMeta[key];
            const usagePercent = Math.round((c.usedAmount / c.dailyLimit) * 100);
            const isUnhealthy = c.successRate < 97 || c.todayFails > 20;
            return (
              <Card
                key={key}
                className={cn(
                  'overflow-hidden transition-all',
                  c.enabled ? 'hover:shadow-lg' : 'opacity-70',
                  isUnhealthy && c.enabled && 'border-danger/30'
                )}
              >
                <CardHeader className={cn(
                  'px-5 py-4 border-b border-gray-100 flex items-center justify-between',
                  c.enabled && `bg-gradient-to-r ${meta.gradient}`
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl', meta.iconBg)}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{meta.name}</h3>
                        {isUnhealthy && c.enabled && (
                          <span className="flex items-center gap-1 text-[10px] text-danger font-medium bg-danger/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            异常
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        处理请求 {c.requestCount.toLocaleString()} 次 · 平均 {c.avgResponseMs}ms
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">成功率</div>
                      <div className={cn(
                        'text-sm font-bold',
                        c.successRate >= 99 ? 'text-success' : c.successRate >= 97 ? 'text-primary' : 'text-danger'
                      )}>
                        {c.successRate}%
                      </div>
                    </div>
                    <button
                      onClick={() => updateChannel(key, { enabled: !c.enabled })}
                      className={cn(
                        'relative w-14 h-8 rounded-full transition-colors shrink-0',
                        c.enabled ? 'bg-primary' : 'bg-gray-300'
                      )}
                    >
                      <span className={cn(
                        'absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all',
                        c.enabled ? 'left-7' : 'left-1'
                      )} />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-gray-400" />
                          通道费率
                        </label>
                        <span className="text-xs font-semibold text-gray-900">{c.rate}%</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={c.rate}
                        onChange={(e) => updateChannel(key, { rate: parseFloat(e.target.value) || 0 })}
                        disabled={!c.enabled}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-gray-400" />
                          轮询权重
                          <span className="text-gray-400 font-normal">
                            ({totalWeight > 0 ? Math.round((c.weight / totalWeight) * 100) : 0}%)
                          </span>
                        </label>
                        <span className="text-xs font-semibold text-gray-900">{c.weight}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={c.weight}
                        onChange={(e) => updateChannel(key, { weight: parseInt(e.target.value) })}
                        disabled={!c.enabled}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-gray-400" />
                        当日限额
                      </label>
                      <div className="text-xs">
                        <span className="text-gray-500">已用</span>
                        <span className="font-semibold text-gray-900 ml-1">
                          ¥{c.usedAmount.toLocaleString()}
                        </span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="font-semibold text-gray-900">
                          ¥{c.dailyLimit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="10000"
                        value={c.dailyLimit}
                        onChange={(e) => updateChannel(key, { dailyLimit: parseFloat(e.target.value) || 0 })}
                        disabled={!c.enabled}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={usagePercent}
                        variant={usagePercent > 85 ? 'accent' : 'primary'}
                        height={5}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                      <div className="text-[10px] text-gray-500 mb-0.5">请求量</div>
                      <div className="text-sm font-bold text-gray-900">{c.requestCount.toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                      <div className="text-[10px] text-gray-500 mb-0.5">响应</div>
                      <div className={cn(
                        'text-sm font-bold',
                        c.avgResponseMs < 200 ? 'text-success' : c.avgResponseMs < 300 ? 'text-primary' : 'text-accent'
                      )}>
                        {c.avgResponseMs}ms
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                      <div className="text-[10px] text-gray-500 mb-0.5">失败</div>
                      <div className={cn(
                        'text-sm font-bold',
                        c.todayFails < 10 ? 'text-success' : c.todayFails < 30 ? 'text-accent' : 'text-danger'
                      )}>
                        {c.todayFails}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">熔断阈值设置</h3>
                <p className="text-xs text-gray-500 mt-0.5">触发通道自动熔断的条件，保护系统稳定性</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                熔断监控运行中
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/20">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">超时熔断</div>
                    <div className="text-[11px] text-gray-500">单次请求超过该时间视为失败</div>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={thresholds.timeoutSeconds}
                    onChange={(e) => setThresholds({ ...thresholds, timeoutSeconds: parseInt(e.target.value) || 30 })}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
                  />
                  <span className="text-sm text-gray-500 pb-3">秒</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {[15, 30, 60, 120].map((v) => (
                    <button
                      key={v}
                      onClick={() => setThresholds({ ...thresholds, timeoutSeconds: v })}
                      className={cn(
                        'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                        thresholds.timeoutSeconds === v
                          ? 'bg-accent text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/30'
                      )}
                    >
                      {v}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-danger/5 to-transparent border border-danger/20">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">失败率熔断</div>
                    <div className="text-[11px] text-gray-500">5分钟内失败率超过则自动降级</div>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={thresholds.failRatePercent}
                    onChange={(e) => setThresholds({ ...thresholds, failRatePercent: parseInt(e.target.value) || 5 })}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:border-danger/50 focus:ring-2 focus:ring-danger/10"
                  />
                  <span className="text-sm text-gray-500 pb-3">%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar
                    value={thresholds.failRatePercent * 2}
                    variant={thresholds.failRatePercent > 10 ? 'accent' : 'primary'}
                    height={5}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>宽松 1%</span>
                    <span>严格 50%</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersVertical className="w-5 h-5 text-violet-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">累计失败熔断</div>
                    <div className="text-[11px] text-gray-500">当日失败次数达到阈值自动降级</div>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    step={10}
                    value={thresholds.maxDailyFails}
                    onChange={(e) => setThresholds({ ...thresholds, maxDailyFails: parseInt(e.target.value) || 100 })}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10"
                  />
                  <span className="text-sm text-gray-500 pb-3">次</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {[50, 100, 200, 500].map((v) => (
                    <button
                      key={v}
                      onClick={() => setThresholds({ ...thresholds, maxDailyFails: v })}
                      className={cn(
                        'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                        thresholds.maxDailyFails === v
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">熔断机制说明：</span>
                通道触发熔断后，系统将自动降低该通道权重 {thresholds.maxDailyFails > 50 ? '80%' : '50%'}，
                并将流量切换至其他健康通道。熔断状态持续 {thresholds.timeoutSeconds * 2} 秒后自动恢复权重，
                如连续触发 3 次熔断将发送告警通知运维人员。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
