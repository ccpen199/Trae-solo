import { useEffect, useState } from 'react';
import { Sun, Calculator, Battery, DollarSign, Leaf, CheckCircle, FileText, Clock, X, ChevronRight, TrendingUp, Zap, Home, Building2 } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface PVPlanResult {
  id: string;
  suitable: boolean;
  capacity: number;
  areaNeeded: number;
  estimatedCost: number;
  paybackYears: number;
  annualGeneration: number;
  annualSavings: number;
  co2Reduction: number;
  roofCondition: 'good' | 'fair' | 'poor';
  selfUseRatio: number;
  gridFeedInRatio: number;
  subsidyAmount: number;
  status: 'draft' | 'calculated' | 'applied' | 'approved' | 'installing' | 'completed' | 'rejected';
  createdAt: string;
  appliedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  remarks?: string;
}

interface SavedPlan extends PVPlanResult {
  roofArea: number;
  monthlyConsumption: number;
  roofType: string;
  orientation: string;
}

const generatePlanResult = (id: string, area: number, consumption: number, roofType: string, orientation: string): SavedPlan => {
  const capacity = Math.floor(area * 0.12);
  const annualGen = capacity * 1100;
  const savings = Math.floor((annualGen * 0.7) * 12);
  const cost = capacity * 4500;
  const co2 = parseFloat((annualGen * 0.00078).toFixed(1));
  const selfUseRatio = Math.min(95, 60 + Math.floor(Math.random() * 30));
  const subsidyAmount = Math.floor(cost * 0.15);

  return {
    id,
    suitable: area >= 30,
    capacity,
    areaNeeded: area,
    estimatedCost: cost,
    paybackYears: Math.round((cost / (savings + subsidyAmount / 5)) * 10) / 10,
    annualGeneration: annualGen,
    annualSavings: savings,
    co2Reduction: co2,
    roofCondition: area > 100 ? 'good' : area > 50 ? 'fair' : 'poor',
    selfUseRatio,
    gridFeedInRatio: 100 - selfUseRatio,
    subsidyAmount,
    status: 'calculated',
    createdAt: dayjs().format('YYYY-MM-DD'),
    roofArea: area,
    monthlyConsumption: consumption,
    roofType,
    orientation,
  };
};

const mockSavedPlans: SavedPlan[] = [
  { ...generatePlanResult('pv1', 200, 8000, 'flat', 'south'), status: 'installing', createdAt: '2026-05-15', appliedAt: '2026-05-20', approvedAt: '2026-06-01' },
  { ...generatePlanResult('pv2', 150, 5000, 'slope', 'south'), status: 'completed', createdAt: '2026-03-01', appliedAt: '2026-03-05', approvedAt: '2026-03-15', completedAt: '2026-05-10' },
  { ...generatePlanResult('pv3', 80, 2000, 'flat', 'east'), status: 'applied', createdAt: '2026-05-28', appliedAt: '2026-06-02' },
];

export default function PVPlan() {
  const { user } = useAuthStore();
  const [roofArea, setRoofArea] = useState('');
  const [monthlyConsumption, setMonthlyConsumption] = useState('');
  const [roofType, setRoofType] = useState('flat');
  const [orientation, setOrientation] = useState('south');
  const [result, setResult] = useState<PVPlanResult | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(mockSavedPlans);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [showTimeline, setShowTimeline] = useState<SavedPlan | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculate' | 'history'>('calculate');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<SavedPlan[]>('/energy/pv/plans');
        if (res.length > 0) setSavedPlans(res);
      } catch {
        setSavedPlans(mockSavedPlans);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<PVPlanResult>('/energy/pv/calculate', {
        roofArea: parseFloat(roofArea),
        monthlyConsumption: parseFloat(monthlyConsumption),
        roofType,
        orientation,
      });
      setResult(res);
    } catch {
      const newResult = generatePlanResult('pv' + Date.now(), parseFloat(roofArea), parseFloat(monthlyConsumption), roofType, orientation);
      setResult(newResult);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!result) return;
    setSavingPlan(true);
    try {
      const savedPlan: SavedPlan = {
        ...result,
        id: 'pv' + Date.now(),
        roofArea: parseFloat(roofArea),
        monthlyConsumption: parseFloat(monthlyConsumption),
        roofType,
        orientation,
      };
      setSavedPlans((prev) => [savedPlan, ...prev]);
      setSavingPlan(false);
      setActiveTab('history');
    } catch {
      const savedPlan: SavedPlan = {
        ...result,
        id: 'pv' + Date.now(),
        roofArea: parseFloat(roofArea),
        monthlyConsumption: parseFloat(monthlyConsumption),
        roofType,
        orientation,
      };
      setSavedPlans((prev) => [savedPlan, ...prev]);
      setSavingPlan(false);
      setActiveTab('history');
    }
  };

  const handleApply = async (planId: string) => {
    setShowApplyModal(false);
    setSavedPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, status: 'applied' as const, appliedAt: dayjs().format('YYYY-MM-DD') }
          : p
      )
    );
  };

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'badge-green';
    if (s === 'installing' || s === 'approved') return 'badge-blue';
    if (s === 'applied' || s === 'calculated') return 'badge-amber';
    if (s === 'rejected') return 'badge-red';
    return 'badge-gray';
  };
  const statusLabel = (s: string) => {
    if (s === 'completed') return '已完成';
    if (s === 'installing') return '安装中';
    if (s === 'approved') return '已批准';
    if (s === 'applied') return '已申请';
    if (s === 'calculated') return '方案已生成';
    if (s === 'rejected') return '已拒绝';
    return '草稿';
  };
  const roofTypeLabel = (t: string) => t === 'flat' ? '平屋顶' : t === 'slope' ? '斜屋顶' : '复杂屋顶';
  const orientationLabel = (o: string) => o === 'south' ? '正南' : o === 'east' ? '正东' : o === 'west' ? '正西' : '正北';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="page-header">
          <Sun size={28} className="text-csg-amber" />
          <div>
            <h1 className="page-title">光伏方案</h1>
            <p className="page-desc">获取个性化的屋顶光伏安装方案，追踪申请全流程</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('calculate')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'calculate' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <Calculator size={16} className="inline mr-1.5" /> 方案计算
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'history' ? 'border-csg-green text-csg-green' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <FileText size={16} /> 历史方案
          {savedPlans.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-csg-green/10 text-csg-green">
              {savedPlans.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'calculate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Calculator size={20} className="text-csg-navy" />
              输入参数
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  屋顶可用面积 (m²)
                </label>
                <input
                  type="number"
                  value={roofArea}
                  onChange={(e) => setRoofArea(e.target.value)}
                  placeholder="请输入屋顶面积"
                  className="input-field"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  月均用电量 (kWh)
                </label>
                <input
                  type="number"
                  value={monthlyConsumption}
                  onChange={(e) => setMonthlyConsumption(e.target.value)}
                  placeholder="请输入月均用电量"
                  className="input-field"
                  required
                  min="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    屋顶类型
                  </label>
                  <select value={roofType} onChange={(e) => setRoofType(e.target.value)} className="select-field">
                    <option value="flat">平屋顶</option>
                    <option value="slope">斜屋顶</option>
                    <option value="complex">复杂屋顶</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    朝向
                  </label>
                  <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="select-field">
                    <option value="south">正南</option>
                    <option value="east">正东</option>
                    <option value="west">正西</option>
                    <option value="north">正北</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-secondary w-full py-2.5">
                {loading ? '计算中...' : '生成光伏方案'}
              </button>
            </form>

            {result && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button onClick={handleSavePlan} disabled={savingPlan} className="btn-secondary flex-1">
                    {savingPlan ? '保存中...' : '保存方案'}
                  </button>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={!result.suitable}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${result.suitable ? 'bg-csg-green text-white hover:bg-csg-green/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    立即申请
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-5">方案结果</h3>
            {result ? (
              <div className="space-y-5">
                <div className={`p-4 rounded-lg ${result.suitable ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {result.suitable ? (
                      <CheckCircle size={20} className="text-csg-green" />
                    ) : (
                      <Sun size={20} className="text-csg-amber" />
                    )}
                    <span className={`font-semibold ${result.suitable ? 'text-csg-green' : 'text-csg-amber'}`}>
                      {result.suitable ? '适合安装光伏发电系统' : '建议评估后再安装'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    屋顶状况: {result.roofCondition === 'good' ? '良好' : result.roofCondition === 'fair' ? '一般' : '较差'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <Battery size={20} className="mx-auto text-csg-green mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">装机容量</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{result.capacity} kW</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <Sun size={20} className="mx-auto text-csg-amber mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">年发电量</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{result.annualGeneration.toLocaleString()} kWh</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <DollarSign size={20} className="mx-auto text-blue-500 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">投资成本</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">¥{(result.estimatedCost / 10000).toFixed(1)}万</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center">
                    <DollarSign size={20} className="mx-auto text-csg-green mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">预计补贴</p>
                    <p className="text-lg font-bold text-csg-green">¥{(result.subsidyAmount / 10000).toFixed(1)}万</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">自用比例</span>
                      <span className="text-sm font-bold text-csg-navy dark:text-white">{result.selfUseRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-csg-green rounded-full" style={{ width: `${result.selfUseRatio}%` }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">上网比例</span>
                      <span className="text-sm font-bold text-csg-navy dark:text-white">{result.gridFeedInRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-csg-amber rounded-full" style={{ width: `${result.gridFeedInRatio}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-csg-navy/5 dark:bg-csg-navy/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">投资回收期</span>
                    <span className="text-xl font-bold text-csg-navy dark:text-white">{result.paybackYears} 年</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">年节省电费</span>
                    <span className="font-medium text-csg-green">¥{result.annualSavings.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf size={18} className="text-csg-green" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">环保效益</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">年减排 CO₂</span>
                      <p className="font-bold text-gray-900 dark:text-white">{result.co2Reduction} 吨</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">等效种树</span>
                      <p className="font-bold text-gray-900 dark:text-white">{Math.round(result.co2Reduction / 0.018)} 棵</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-csg-amber/5 dark:bg-csg-amber/10 border border-csg-amber/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={18} className="text-csg-amber" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">收益分析</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    25年生命周期预计总收益 <strong className="text-csg-green">¥{(result.annualSavings * 25 + result.subsidyAmount).toLocaleString()}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                <Sun size={56} className="mb-4 opacity-30" />
                <p>请输入参数并生成方案</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {savedPlans.map((plan) => (
            <div key={plan.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-csg-amber/10 flex items-center justify-center">
                    <Sun size={24} className="text-csg-amber" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {plan.capacity}kW 光伏系统方案
                      </h4>
                      <span className={statusBadge(plan.status)}>{statusLabel(plan.status)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {roofTypeLabel(plan.roofType)} · {orientationLabel(plan.orientation)} · {plan.roofArea}m² · 创建于 {plan.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTimeline(plan)}
                    className="btn-outline px-3 py-1.5 text-sm flex items-center gap-1"
                  >
                    <Clock size={14} /> 流程追踪
                  </button>
                  {plan.status === 'calculated' && (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1"
                    >
                      提交申请
                    </button>
                  )}
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">装机容量</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{plan.capacity} kW</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">投资金额</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">¥{(plan.estimatedCost / 10000).toFixed(1)}万</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">年发电量</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{(plan.annualGeneration / 1000).toFixed(1)} MWh</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">投资回收期</p>
                  <p className="text-lg font-bold text-csg-green">{plan.paybackYears} 年</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {plan.appliedAt && <span>申请日期: {plan.appliedAt}</span>}
                {plan.approvedAt && <span>批准日期: {plan.approvedAt}</span>}
                {plan.completedAt && <span>完成日期: {plan.completedAt}</span>}
              </div>
            </div>
          ))}

          {savedPlans.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <Sun size={48} className="mx-auto mb-4 opacity-30" />
              <p>暂无历史方案，请先计算并保存方案</p>
            </div>
          )}
        </div>
      )}

      {showTimeline && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {showTimeline.capacity}kW 光伏项目全流程
              </h3>
              <button onClick={() => setShowTimeline(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
              {[
                { date: showTimeline.createdAt, title: '方案生成', desc: `完成${showTimeline.roofArea}m²屋顶光伏方案设计，装机容量${showTimeline.capacity}kW`, status: 'completed' },
                { date: showTimeline.appliedAt, title: '申请提交', desc: '向电网公司提交并网申请及相关材料', status: showTimeline.appliedAt ? 'completed' : 'pending' },
                { date: showTimeline.approvedAt, title: '方案审批', desc: '电网公司审核通过，出具并网意见', status: showTimeline.approvedAt ? 'completed' : 'pending' },
                { date: showTimeline.status === 'installing' ? '进行中' : undefined, title: '工程安装', desc: '设备采购、现场安装、系统调试', status: showTimeline.status === 'installing' ? 'in_progress' : showTimeline.completedAt ? 'completed' : 'pending' },
                { date: showTimeline.completedAt, title: '验收并网', desc: '竣工验收，签订并网协议，正式发电', status: showTimeline.completedAt ? 'completed' : 'pending' },
              ].filter(e => e.date !== undefined).map((event, i) => (
                <div key={i} className="relative pl-10 pb-6 last:pb-0">
                  <div className={`absolute left-1.5 w-5 h-5 rounded-full border-4 ${
                    event.status === 'completed' ? 'bg-csg-green border-csg-green/30' :
                    event.status === 'in_progress' ? 'bg-csg-amber border-csg-amber/30' :
                    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`} />
                  <div className={`p-4 rounded-lg ${
                    event.status === 'completed' ? 'bg-csg-green/5 dark:bg-csg-green/10' :
                    event.status === 'in_progress' ? 'bg-csg-amber/5 dark:bg-csg-amber/10' :
                    'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">{event.title}</span>
                      <span className={`text-xs ${statusBadge(event.status)}`}>
                        {event.status === 'completed' ? '已完成' : event.status === 'in_progress' ? '进行中' : '待开始'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{event.desc}</p>
                    {event.date && event.date !== '进行中' && (
                      <p className="text-xs text-gray-400 mt-1">{event.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">提交光伏申请</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-csg-green/5 dark:bg-csg-green/10">
                <div className="flex items-center gap-2 mb-2">
                  <Home size={18} className="text-csg-green" />
                  <span className="font-medium text-gray-900 dark:text-white">申请人信息</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{user?.realName || '用户'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user?.customerType === 'enterprise' ? '企业用户' : user?.customerType === 'park' ? '园区用户' : user?.customerType === 'family' ? '家庭用户' : '个人用户'}
                </p>
              </div>

              {result && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">申请方案</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">装机容量</span>
                      <p className="font-semibold">{result.capacity} kW</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">预计补贴</span>
                      <p className="font-semibold text-csg-green">¥{(result.subsidyAmount / 10000).toFixed(1)}万</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowApplyModal(false)} className="btn-outline flex-1">取消</button>
                <button
                  onClick={() => handleApply(result?.id || savedPlans[0]?.id)}
                  className="btn-secondary flex-1 bg-csg-green hover:bg-csg-green/90"
                >
                  确认提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
