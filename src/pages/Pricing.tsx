import { useState, useMemo } from 'react';
import {
  Settings,
  TrendingUp,
  CloudRain,
  Sun,
  Cloud,
  ThermometerSun,
  Package,
  Clock,
  Calculator,
  History,
  Save,
  RotateCcw,
  Plus,
  Minus,
  Gauge,
  Layers,
  Zap,
  Calendar,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingRule {
  id: string;
  name: string;
  type: 'distance' | 'time' | 'weather' | 'goods';
  value: number;
  enabled: boolean;
  description: string;
}

type PricingTab = PricingRule['type'];

const initialRules: PricingRule[] = [
  { id: '1', name: '基础起送价', type: 'distance', value: 8, enabled: true, description: '3公里内基础配送费' },
  { id: '2', name: '3-5公里加价', type: 'distance', value: 3, enabled: true, description: '每公里额外费用' },
  { id: '3', name: '5-10公里加价', type: 'distance', value: 2.5, enabled: true, description: '每公里额外费用' },
  { id: '4', name: '10公里以上加价', type: 'distance', value: 2, enabled: true, description: '每公里额外费用' },
  { id: '5', name: '早高峰溢价 (07:00-09:00)', type: 'time', value: 15, enabled: true, description: '时段溢价百分比' },
  { id: '6', name: '晚高峰溢价 (17:00-20:00)', type: 'time', value: 20, enabled: true, description: '时段溢价百分比' },
  { id: '7', name: '夜间溢价 (22:00-06:00)', type: 'time', value: 25, enabled: true, description: '时段溢价百分比' },
  { id: '8', name: '雨天系数', type: 'weather', value: 20, enabled: true, description: '雨天溢价百分比' },
  { id: '9', name: '雪天系数', type: 'weather', value: 35, enabled: true, description: '雪天溢价百分比' },
  { id: '10', name: '高温/低温系数', type: 'weather', value: 10, enabled: false, description: '极端气温溢价' },
  { id: '11', name: '生鲜冷链加价', type: 'goods', value: 5, enabled: true, description: '需冷藏货品额外费用' },
  { id: '12', name: '易碎品加价', type: 'goods', value: 3, enabled: true, description: '易碎品保障费用' },
  { id: '13', name: '大件/重物加价', type: 'goods', value: 8, enabled: true, description: '超过5kg加价' },
];

const historyVersions = [
  { id: 'v3', version: 'v3.0.0', date: '2024-06-10', author: '管理员', active: true, changes: ['调整晚高峰溢价至20%', '新增大件重物加价'] },
  { id: 'v2', version: 'v2.5.0', date: '2024-05-20', author: '运营主管', active: false, changes: ['新增夜间溢价25%', '优化距离阶梯价格'] },
  { id: 'v1', version: 'v2.0.0', date: '2024-04-15', author: '管理员', active: false, changes: ['定价体系重构', '引入动态系数'] },
];

const weatherOptions = [
  { key: 'sunny', label: '晴天', icon: Sun, multiplier: 1 },
  { key: 'cloudy', label: '多云', icon: Cloud, multiplier: 1 },
  { key: 'rain', label: '雨天', icon: CloudRain, multiplier: 1.2 },
  { key: 'snow', label: '雪天', icon: CloudRain, multiplier: 1.35 },
  { key: 'extreme', label: '极端', icon: ThermometerSun, multiplier: 1.1 },
];

const goodsOptions = [
  { key: 'normal', label: '普通物品', icon: Package, extra: 0 },
  { key: 'fragile', label: '易碎品', icon: Package, extra: 3 },
  { key: 'cold', label: '生鲜冷链', icon: Package, extra: 5 },
  { key: 'heavy', label: '大件重物', icon: Package, extra: 8 },
];

export default function Pricing() {
  const [rules, setRules] = useState<PricingRule[]>(initialRules);
  const [activeTab, setActiveTab] = useState<'distance' | 'time' | 'weather' | 'goods'>('distance');
  const [simulator, setSimulator] = useState({
    distance: 5,
    time: '18:30',
    weather: 'sunny',
    goods: 'normal',
    weight: 2,
  });
  const [activeVersion, setActiveVersion] = useState('v3');

  const typeLabels: Record<string, { label: string; icon: typeof Gauge }> = {
    distance: { label: '距离阶梯', icon: Layers },
    time: { label: '时段溢价', icon: Clock },
    weather: { label: '天气系数', icon: CloudRain },
    goods: { label: '货品加价', icon: Package },
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const updateRuleValue = (id: string, value: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: Math.max(0, value) } : r))
    );
  };

  const simulatedPrice = useMemo(() => {
    let price = 8;

    if (simulator.distance > 3) {
      if (simulator.distance <= 5) {
        price += (simulator.distance - 3) * 3;
      } else if (simulator.distance <= 10) {
        price += 2 * 3 + (simulator.distance - 5) * 2.5;
      } else {
        price += 2 * 3 + 5 * 2.5 + (simulator.distance - 10) * 2;
      }
    }

    const hour = parseInt(simulator.time.split(':')[0]);
    if ((hour >= 7 && hour < 9)) price *= 1.15;
    if ((hour >= 17 && hour < 20)) price *= 1.2;
    if (hour >= 22 || hour < 6) price *= 1.25;

    const weather = weatherOptions.find((w) => w.key === simulator.weather);
    if (weather) price *= weather.multiplier;

    const goods = goodsOptions.find((g) => g.key === simulator.goods);
    if (goods) price += goods.extra;

    if (simulator.weight > 5) price += Math.ceil(simulator.weight - 5) * 2;

    return Math.round(price * 100) / 100;
  }, [simulator]);

  const filteredRules = rules.filter((r) => r.type === activeTab);
  const IconType = typeLabels[activeTab].icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">动态定价配置</h1>
          <p className="text-sm text-gray-400 mt-1">配置定价规则，实时模拟运价计算</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors">
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-accent-400" />
                定价规则编辑器
              </h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success-500/15 border border-success-500/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />
                <span className="text-xs text-success-400">规则生效中</span>
              </div>
            </div>

            <div className="flex gap-2 mb-5 border-b border-space-blue-600 pb-4">
              {(Object.keys(typeLabels) as PricingTab[]).map((type) => {
                const { label, icon: TabIcon } = typeLabels[type];
                const count = rules.filter((r) => r.type === type).length;
                const enabledCount = rules.filter((r) => r.type === type && r.enabled).length;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border-b-2',
                      activeTab === type
                        ? 'text-amber-accent-400 border-amber-accent-500 -mb-[17px] pb-[19px] bg-amber-accent-500/10'
                        : 'text-gray-400 border-transparent hover:text-gray-200'
                    )}
                  >
                    <TabIcon className="w-4 h-4" />
                    {label}
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs',
                      activeTab === type ? 'bg-amber-accent-500/20' : 'bg-space-blue-600'
                    )}>
                      {enabledCount}/{count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              {filteredRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    rule.enabled
                      ? 'bg-space-blue-700/50 border-space-blue-500'
                      : 'bg-space-blue-800 border-space-blue-700 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-md bg-space-blue-600 flex items-center justify-center text-xs text-amber-accent-400 font-mono-code">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-100">{rule.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-8">{rule.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {activeTab === 'time' || activeTab === 'weather' ? (
                          <>
                            <input
                              type="number"
                              value={rule.value}
                              onChange={(e) => updateRuleValue(rule.id, Number(e.target.value))}
                              disabled={!rule.enabled}
                              className="w-16 px-2 py-1.5 bg-space-blue-600 border border-space-blue-500 rounded-md text-sm text-gray-200 text-center focus:outline-none focus:border-amber-accent-500/50 disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-400">%</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-amber-accent-400">¥</span>
                            <input
                              type="number"
                              step="0.5"
                              value={rule.value}
                              onChange={(e) => updateRuleValue(rule.id, Number(e.target.value))}
                              disabled={!rule.enabled}
                              className="w-16 px-2 py-1.5 bg-space-blue-600 border border-space-blue-500 rounded-md text-sm text-gray-200 text-center focus:outline-none focus:border-amber-accent-500/50 disabled:opacity-50"
                            />
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          rule.enabled ? 'bg-success-500' : 'bg-space-blue-600'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                            rule.enabled ? 'left-[22px]' : 'left-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-info-400" />
              历史版本
            </h2>
            <div className="space-y-3">
              {historyVersions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all cursor-pointer',
                    activeVersion === version.id
                      ? 'bg-amber-accent-500/10 border-amber-accent-500/40'
                      : 'bg-space-blue-700/30 border-space-blue-600 hover:bg-space-blue-700/50'
                  )}
                  onClick={() => setActiveVersion(version.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-sm text-amber-accent-400">{version.version}</span>
                      {version.active && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-success-500/15 text-success-400 text-xs rounded-full border border-success-500/30">
                          <Check className="w-3 h-3" />
                          当前版本
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {version.date}
                      <span>·</span>
                      <span>{version.author}</span>
                    </div>
                  </div>
                  <div className="space-y-1 ml-2">
                    {version.changes.map((change, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        {change}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card sticky top-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-accent-400" />
              运价模拟器
              <Zap className="w-4 h-4 text-warning-400 ml-auto" />
            </h2>

            <div className="mb-6 p-5 bg-gradient-to-br from-amber-accent-500/10 to-amber-accent-500/5 border border-amber-accent-500/30 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">预估运费</div>
              <div className="text-4xl font-bold text-amber-accent-400 font-mono-code">
                ¥{simulatedPrice.toFixed(2)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    配送距离
                  </span>
                  <span className="text-sm text-amber-accent-400 font-mono-code">{simulator.distance} km</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSimulator({ ...simulator, distance: Math.max(0.5, simulator.distance - 0.5) })}
                    className="w-8 h-8 rounded-lg bg-space-blue-700 border border-space-blue-500 flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-space-blue-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="30"
                    step="0.5"
                    value={simulator.distance}
                    onChange={(e) => setSimulator({ ...simulator, distance: Number(e.target.value) })}
                    className="flex-1 h-2 bg-space-blue-600 rounded-full appearance-none cursor-pointer accent-amber-accent-500"
                  />
                  <button
                    onClick={() => setSimulator({ ...simulator, distance: Math.min(30, simulator.distance + 0.5) })}
                    className="w-8 h-8 rounded-lg bg-space-blue-700 border border-space-blue-500 flex items-center justify-center text-gray-400 hover:text-gray-100 hover:bg-space-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    配送时间
                  </span>
                  <span className="text-sm text-gray-400 font-mono-code">{simulator.time}</span>
                </label>
                <input
                  type="time"
                  value={simulator.time}
                  onChange={(e) => setSimulator({ ...simulator, time: e.target.value })}
                  className="w-full px-3 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-gray-500" />
                  天气状况
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {weatherOptions.map((weather) => {
                    const WeatherIcon = weather.icon;
                    return (
                      <button
                        key={weather.key}
                        onClick={() => setSimulator({ ...simulator, weather: weather.key })}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                          simulator.weather === weather.key
                            ? 'bg-info-500/15 border-info-500/40 text-info-400'
                            : 'bg-space-blue-700/50 border-space-blue-600 text-gray-400 hover:bg-space-blue-700'
                        )}
                      >
                        <WeatherIcon className="w-5 h-5" />
                        <span className="text-xs">{weather.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-gray-500" />
                  物品类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {goodsOptions.map((goods) => (
                    <button
                      key={goods.key}
                      onClick={() => setSimulator({ ...simulator, goods: goods.key })}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                        simulator.goods === goods.key
                          ? 'bg-success-500/15 border-success-500/40 text-success-400'
                          : 'bg-space-blue-700/50 border-space-blue-600 text-gray-400 hover:bg-space-blue-700'
                      )}
                    >
                      <Package className="w-4 h-4" />
                      {goods.label}
                      {goods.extra > 0 && (
                        <span className="ml-auto text-xs opacity-70">+¥{goods.extra}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    物品重量
                  </span>
                  <span className="text-sm text-gray-400 font-mono-code">{simulator.weight} kg</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={simulator.weight}
                  onChange={(e) => setSimulator({ ...simulator, weight: Number(e.target.value) })}
                  className="w-full h-2 bg-space-blue-600 rounded-full appearance-none cursor-pointer accent-amber-accent-500"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-space-blue-600">
              <div className="text-xs text-gray-500 mb-2">费用明细</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>基础配送费</span>
                  <span className="font-mono-code">¥8.00</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>里程加价</span>
                  <span className="font-mono-code">
                    ¥{simulatedPrice > 8 ? (simulatedPrice - 8).toFixed(2) : '0.00'}
                  </span>
                </div>
                {weatherOptions.find((w) => w.key === simulator.weather)?.multiplier &&
                  weatherOptions.find((w) => w.key === simulator.weather)!.multiplier > 1 && (
                    <div className="flex justify-between text-info-400">
                      <span>天气系数</span>
                      <span className="font-mono-code">
                        ×{weatherOptions.find((w) => w.key === simulator.weather)!.multiplier}
                      </span>
                    </div>
                  )}
                {goodsOptions.find((g) => g.key === simulator.goods)?.extra &&
                  goodsOptions.find((g) => g.key === simulator.goods)!.extra > 0 && (
                    <div className="flex justify-between text-success-400">
                      <span>特殊物品加价</span>
                      <span className="font-mono-code">
                        +¥{goodsOptions.find((g) => g.key === simulator.goods)!.extra}
                      </span>
                    </div>
                  )}
                <div className="pt-2 mt-2 border-t border-space-blue-600 flex justify-between text-gray-100 font-semibold">
                  <span>总计</span>
                  <span className="font-mono-code text-amber-accent-400">¥{simulatedPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
