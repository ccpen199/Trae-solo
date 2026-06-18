import { useState } from 'react';
import { Sliders, Save, RotateCcw, Info, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Dimension {
  name: string;
  weight: number;
  indicators: { name: string; code: string; weight: number }[];
}

interface CategoryConfig {
  code: string;
  name: string;
  description: string;
  accentColor: string;
  dimensions: Dimension[];
}

const initialConfigs: CategoryConfig[] = [
  {
    code: 'medical',
    name: '医美服务',
    description: '高度侧重资质合规性与医疗安全，保障消费者生命健康',
    accentColor: '#EF4444',
    dimensions: [
      {
        name: '资质安全',
        weight: 0.65,
        indicators: [
          { name: '资质合规性', code: 'med_license', weight: 0.54 },
          { name: '医疗安全', code: 'med_safety', weight: 0.46 },
        ],
      },
      {
        name: '服务效果',
        weight: 0.30,
        indicators: [
          { name: '服务质量', code: 'med_service', weight: 0.50 },
          { name: '效果满意度', code: 'med_result', weight: 0.50 },
        ],
      },
      {
        name: '价格透明',
        weight: 0.05,
        indicators: [{ name: '价格透明度', code: 'med_price', weight: 1.0 }],
      },
    ],
  },
  {
    code: 'consumer',
    name: '消费品',
    description: '产品品质与口碑服务并重，关注复购率与长期满意度',
    accentColor: '#10B981',
    dimensions: [
      { name: '产品品质', weight: 0.30, indicators: [{ name: '产品质量', code: 'consumer_quality', weight: 1.0 }] },
      { name: '性价比', weight: 0.25, indicators: [{ name: '性价比', code: 'consumer_value', weight: 1.0 }] },
      {
        name: '口碑服务',
        weight: 0.35,
        indicators: [
          { name: '品牌口碑', code: 'consumer_reputation', weight: 0.57 },
          { name: '售后服务', code: 'consumer_service', weight: 0.43 },
        ],
      },
      { name: '合规性', weight: 0.10, indicators: [{ name: '合规性', code: 'consumer_compliance', weight: 1.0 }] },
    ],
  },
  {
    code: 'education',
    name: '教育机构',
    description: '教学实力为核心，兼顾学员口碑与办学资质',
    accentColor: '#6366F1',
    dimensions: [
      {
        name: '教学实力',
        weight: 0.55,
        indicators: [
          { name: '师资力量', code: 'edu_teachers', weight: 0.55 },
          { name: '教学质量', code: 'edu_quality', weight: 0.45 },
        ],
      },
      { name: '学员口碑', weight: 0.20, indicators: [{ name: '学员满意度', code: 'edu_satisfaction', weight: 1.0 }] },
      { name: '合规资质', weight: 0.15, indicators: [{ name: '办学资质', code: 'edu_license', weight: 1.0 }] },
      { name: '性价比', weight: 0.10, indicators: [{ name: '性价比', code: 'edu_value', weight: 1.0 }] },
    ],
  },
  {
    code: 'travel',
    name: '旅游景点',
    description: '服务体验优先，景区品质与交通便利综合考量',
    accentColor: '#F59E0B',
    dimensions: [
      { name: '景区品质', weight: 0.30, indicators: [{ name: '景区品质', code: 'travel_quality', weight: 1.0 }] },
      {
        name: '服务体验',
        weight: 0.45,
        indicators: [
          { name: '服务水平', code: 'travel_service', weight: 0.56 },
          { name: '游客体验', code: 'travel_experience', weight: 0.44 },
        ],
      },
      { name: '性价比', weight: 0.15, indicators: [{ name: '性价比', code: 'travel_value', weight: 1.0 }] },
      { name: '交通便利', weight: 0.10, indicators: [{ name: '交通便利性', code: 'travel_transport', weight: 1.0 }] },
    ],
  },
];

const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function WeightConfigPage() {
  const [configs, setConfigs] = useState<CategoryConfig[]>(initialConfigs);
  const [activeCategory, setActiveCategory] = useState('medical');
  const [saved, setSaved] = useState(false);

  const currentConfig = configs.find(c => c.code === activeCategory)!;

  const updateDimWeight = (dimIdx: number, newWeight: number) => {
    setSaved(false);
    setConfigs(prev => prev.map(cfg => {
      if (cfg.code !== activeCategory) return cfg;
      const newDims = [...cfg.dimensions];
      const diff = newWeight - newDims[dimIdx].weight;
      newDims[dimIdx] = { ...newDims[dimIdx], weight: newWeight };
      const others = newDims.filter((_, i) => i !== dimIdx);
      const othersTotal = others.reduce((s, d) => s + d.weight, 0);
      if (othersTotal > 0) {
        others.forEach((d, i) => {
          const origIdx = newDims.indexOf(d);
          const adj = (diff * d.weight) / othersTotal;
          newDims[origIdx] = { ...newDims[origIdx], weight: Math.max(0, d.weight - adj) };
        });
      }
      const total = newDims.reduce((s, d) => s + d.weight, 0);
      return { ...cfg, dimensions: newDims.map(d => ({ ...d, weight: d.weight / total })) };
    }));
  };

  const updateIndWeight = (dimIdx: number, indIdx: number, newWeight: number) => {
    setSaved(false);
    setConfigs(prev => prev.map(cfg => {
      if (cfg.code !== activeCategory) return cfg;
      const newDims = [...cfg.dimensions];
      const dim = { ...newDims[dimIdx] };
      const newInds = [...dim.indicators];
      const diff = newWeight - newInds[indIdx].weight;
      newInds[indIdx] = { ...newInds[indIdx], weight: newWeight };
      const others = newInds.filter((_, i) => i !== indIdx);
      const othersTotal = others.reduce((s, ind) => s + ind.weight, 0);
      if (othersTotal > 0) {
        others.forEach(ind => {
          const origIdx = newInds.indexOf(ind);
          const adj = (diff * ind.weight) / othersTotal;
          newInds[origIdx] = { ...newInds[origIdx], weight: Math.max(0, ind.weight - adj) };
        });
      }
      const total = newInds.reduce((s, ind) => s + ind.weight, 0);
      dim.indicators = newInds.map(ind => ({ ...ind, weight: ind.weight / total }));
      newDims[dimIdx] = dim;
      return { ...cfg, dimensions: newDims };
    }));
  };

  const resetConfig = () => {
    setConfigs(initialConfigs);
    setSaved(false);
  };

  const saveConfig = () => {
    setTimeout(() => setSaved(true), 500);
    setTimeout(() => setSaved(false), 3000);
  };

  const pieData = currentConfig.dimensions.map((d, i) => ({
    name: d.name,
    value: +(d.weight * 100).toFixed(1),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white flex items-center gap-2">
            <Sliders className="w-6 h-6" />
            动态权重配置
          </h1>
          <p className="text-slate-400 mt-1">为各垂直领域定制评价维度权重，体现行业特性差异</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetConfig} className="btn-outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            恢复默认
          </button>
          <button onClick={saveConfig} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {saved ? '已保存 ✓' : '保存配置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {configs.map(cfg => (
          <button
            key={cfg.code}
            onClick={() => setActiveCategory(cfg.code)}
            className={`card p-4 text-left transition-all duration-200 ${
              activeCategory === cfg.code
                ? 'border-l-4 border-l-[var(--accent)]'
                : 'hover:border-slate-600'
            }`}
            style={activeCategory === cfg.code ? { ['--accent' as string]: cfg.accentColor, borderLeftColor: cfg.accentColor } : {}}
          >
            <div className="font-semibold text-white mb-1">{cfg.name}</div>
            <div className="text-xs text-slate-400 line-clamp-2">{cfg.description}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: currentConfig.accentColor + '20', color: currentConfig.accentColor }}
              >
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{currentConfig.name} 权重配置</h2>
                <p className="text-sm text-slate-400">{currentConfig.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {currentConfig.dimensions.map((dim, dimIdx) => (
                <div key={dim.name} className="card p-4 bg-surface-light/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[dimIdx % COLORS.length] }}
                      />
                      <span className="font-semibold text-white">{dim.name}</span>
                    </div>
                    <div
                      className="text-2xl font-bold font-serif"
                      style={{ color: COLORS[dimIdx % COLORS.length] }}
                    >
                      {(dim.weight * 100).toFixed(1)}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dim.weight * 100}
                    onChange={e => updateDimWeight(dimIdx, +e.target.value / 100)}
                    className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary mb-4"
                  />
                  <div className="space-y-3 pl-6 border-l-2 border-slate-700/60">
                    {dim.indicators.map((ind, indIdx) => (
                      <div key={ind.code} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-sm text-slate-200 mb-1 flex items-center justify-between">
                            <span>{ind.name}</span>
                            <span className="font-mono text-slate-400">{(ind.weight * 100).toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={ind.weight * 100}
                            onChange={e => updateIndWeight(dimIdx, indIdx, +e.target.value / 100)}
                            className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: COLORS[dimIdx % COLORS.length] }}
                          />
                          <div className="h-1.5 mt-1 rounded-full overflow-hidden bg-surface-light/50">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${ind.weight * 100}%`,
                                backgroundColor: COLORS[dimIdx % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-warning/10 border-warning/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-warning mb-1">权重调整须知</div>
                <ul className="text-slate-300 space-y-1 list-disc list-inside">
                  <li>修改权重后将影响下一期榜单生成，已发布榜单保持不变</li>
                  <li>医美类资质合规性权重不得低于总权重的40%（合规要求）</li>
                  <li>所有维度权重总和始终为100%，调整某一维度时其他维度会自动按比例调整</li>
                  <li>重大权重调整建议经评审委员会讨论后实施</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">维度权重占比</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: '#E2E8F0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {pieData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-mono text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">权重影响预览</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-2">某样例综合评分变化</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-serif text-white">88.6</span>
                  <span className="text-sm text-primary">↑ +2.3分</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">因资质安全权重提升，合规得分占比加大</div>
              </div>
              <div className="divider" />
              <div>
                <div className="text-xs text-slate-400 mb-2">预估榜单变化</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">排名变动 ≥3位</span>
                    <span className="text-warning font-mono">约 12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">排名变动 1-2位</span>
                    <span className="text-blue-400 font-mono">约 28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">排名不变</span>
                    <span className="text-primary font-mono">约 60%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
