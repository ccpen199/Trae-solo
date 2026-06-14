import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { faultTypes, findFaultTypeById } from '@/data/faults';
import { getWorkersBySkillCategory } from '@/data/workers';
import { getPartsByCategory, getLaborRateByCity } from '@/data/parts';
import {
  ChevronRight, Star, MapPin, Shield, Clock, Check, Award,
  FileText, Upload, X, Info, ChevronDown, Building, Zap, Wrench,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { FaultType, PartItem } from '@/types';

function getIcon(name: string) {
  const iconMap: Record<string, React.ElementType> = {
    Snowflake: Icons.Snowflake,
    Zap: Icons.Zap,
    Droplets: Icons.Droplets,
    Lock: Icons.Lock,
    Tv: Icons.Tv,
    Flame: Icons.Flame,
    Wrench: Icons.Wrench,
    Bug: Icons.Bug,
    Droplet: Icons.Droplet,
    Volume2: Icons.Volume2,
    Sparkles: Icons.Sparkles,
    ArrowLeftRight: Icons.ArrowLeftRight,
    Plug: Icons.Plug,
    Power: Icons.Power,
    Lightbulb: Icons.Lightbulb,
    Cable: Icons.Cable,
    Trash2: Icons.Trash2,
    Diamond: Icons.Diamond,
    ShowerHead: Icons.ShowerHead,
    Thermometer: Icons.Thermometer,
    Settings: Icons.Settings,
    Unlock: Icons.Unlock,
    Key: Icons.Key,
    Smartphone: Icons.Smartphone,
    Refrigerator: Icons.Refrigerator,
    WashingMachine: Icons.WashingMachine,
    ChefHat: Icons.ChefHat,
    Home: Icons.Home,
    UtensilsCrossed: Icons.UtensilsCrossed,
    Bath: Icons.Bath,
    Rat: Icons.Rat,
  };
  return iconMap[name] || Icons.Wrench;
}

export default function RepairPage() {
  const { setSelectedFaultType, parts, laborRates } = useAppStore();
  const [step, setStep] = useState<'fault' | 'worker' | 'quote'>('fault');
  const [selectedCategory, setSelectedCategory] = useState<FaultType | null>(null);
  const [selectedFault, setSelectedFault] = useState<FaultType | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('上海市浦东新区陆家嘴花园一期');
  const [selectedCity] = useState('上海');
  const [selectedLaborTier, setSelectedLaborTier] = useState(0);
  const [showAllParts, setShowAllParts] = useState(false);

  const matchedWorkers = selectedFault
    ? getWorkersBySkillCategory(selectedFault.skillCategoryId)
        .map(w => ({ ...w, matchScore: Math.floor(80 + Math.random() * 20) }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : [];

  const cityRate = getLaborRateByCity(selectedCity);
  const allFaultParts = selectedFault ? getPartsByCategory(selectedFault.skillCategoryId) : [];
  const displayParts = showAllParts ? allFaultParts : allFaultParts.slice(0, 6);

  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});

  const handleFaultSelect = (fault: FaultType) => {
    setSelectedFault(fault);
    setSelectedFaultType(fault.id);
    const defaultParts = getPartsByCategory(fault.skillCategoryId).slice(0, 3);
    const defaults: Record<string, number> = {};
    defaultParts.forEach(p => { defaults[p.id] = 1; });
    setSelectedParts(defaults);
    setStep('worker');
  };

  const handleWorkerSelect = (workerId: string) => {
    setSelectedWorker(workerId);
    setStep('quote');
  };

  const updatePartQuantity = (partId: string, delta: number) => {
    setSelectedParts(prev => {
      const current = prev[partId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [partId]: next };
    });
  };

  const calculateTotal = () => {
    const partsList = allFaultParts
      .filter(p => selectedParts[p.id] && selectedParts[p.id] > 0)
      .map(p => ({ ...p, quantity: selectedParts[p.id] }));
    const partsTotal = partsList.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const baseHours = 1.5;
    const tierMultiplier = cityRate?.tierRates[selectedLaborTier]?.multiplier || 1;
    const laborRate = (cityRate?.baseRate || 80) * tierMultiplier;
    const laborTotal = laborRate * baseHours;
    const platformFee = Math.round((partsTotal + laborTotal) * 0.05);
    return {
      parts: partsList,
      partsTotal,
      laborHours: baseHours,
      laborRate,
      baseRate: cityRate?.baseRate || 80,
      tierMultiplier,
      tierName: cityRate?.tierRates[selectedLaborTier]?.tier || '基础工时',
      laborTotal,
      platformFee,
      total: partsTotal + laborTotal + platformFee,
    };
  };

  const quoteData = calculateTotal();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">业主报修</h2>
        <p className="text-sm text-slate-500 mt-1">选择故障类型，系统智能匹配持证师傅，透明报价</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {[
          { key: 'fault', label: '选择故障', num: 1 },
          { key: 'worker', label: '匹配师傅', num: 2 },
          { key: 'quote', label: '确认报价', num: 3 },
        ].map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <motion.div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full ${
                step === s.key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : idx < ['fault', 'worker', 'quote'].indexOf(step)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s.key ? 'bg-white/20' : ''
              }`}>
                {idx < ['fault', 'worker', 'quote'].indexOf(step) ? <Check className="w-4 h-4" /> : s.num}
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </motion.div>
            {idx < 2 && (
              <ChevronRight className={`w-5 h-5 mx-2 ${
                idx < ['fault', 'worker', 'quote'].indexOf(step) ? 'text-green-400' : 'text-slate-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <AnimatePresence mode="wait">
            {step === 'fault' && (
              <motion.div
                key="fault"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-800 mb-4">选择故障大类</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {faultTypes.map(cat => {
                      const Icon = getIcon(cat.icon);
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-500/10'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                            isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className="font-medium text-slate-800 text-sm">{cat.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{cat.children?.length || 0} 种故障</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCategory && selectedCategory.children && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5"
                  >
                    <h3 className="font-semibold text-slate-800 mb-4">
                      选择具体故障 <span className="text-orange-500">· {selectedCategory.name}</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedCategory.children.map(fault => {
                        const Icon = getIcon(fault.icon);
                        return (
                          <button
                            key={fault.id}
                            onClick={() => handleFaultSelect(fault)}
                            className="p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center text-slate-600 group-hover:text-orange-600 transition-colors">
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 text-sm">{fault.name}</p>
                                <p className="text-xs text-slate-400">持证师傅匹配</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-800 mb-4">故障描述（选填）</h3>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="请描述故障现象、发生时间等信息，便于师傅提前准备..."
                    className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {step === 'worker' && (
              <motion.div
                key="worker"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    为您匹配 <span className="text-orange-500">{matchedWorkers.length}</span> 位持证师傅
                  </h3>
                  <div className="flex gap-2 text-xs">
                    <button className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-full font-medium">
                      智能匹配
                    </button>
                    <button className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                      距离优先
                    </button>
                    <button className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                      评分优先
                    </button>
                  </div>
                </div>

                {matchedWorkers.map((worker, idx) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleWorkerSelect(worker.id)}
                    className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={worker.avatar}
                          alt={worker.name}
                          className="w-16 h-16 rounded-full bg-slate-100"
                        />
                        <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                          worker.status === 'online' ? 'bg-green-500' :
                          worker.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-lg">{worker.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            认证师傅
                          </span>
                          {worker.matchScore && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                              匹配度 {worker.matchScore}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium text-slate-700">{worker.rating}</span>
                            <span>分</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{worker.orderCount} 单</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{worker.distanceKm} km</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-500 mt-2 line-clamp-1">{worker.bio}</p>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {worker.skills.slice(0, 3).map(skill => (
                            <span
                              key={skill.categoryId}
                              className="text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-200"
                            >
                              <Check className="w-3 h-3 inline mr-1 -mt-0.5" />
                              {skill.categoryName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">预计上门</div>
                        <div className="text-lg font-bold text-slate-800">
                          {Math.floor(10 + Math.random() * 20)} 分钟
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 ml-auto mt-4 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => setStep('fault')}
                  className="text-sm text-slate-500 hover:text-orange-500 transition-colors"
                >
                  ← 返回选择故障类型
                </button>
              </motion.div>
            )}

            {step === 'quote' && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <h3 className="font-semibold text-slate-800 mb-4">服务地址</h3>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">标准配件库明细</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        平台统一采购，明码标价，支持现场核对
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      <Building className="w-3.5 h-3.5" />
                      <span>标准配件库</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {displayParts.map(part => {
                      const qty = selectedParts[part.id] || 0;
                      const isSelected = qty > 0;
                      return (
                        <div
                          key={part.id}
                          className={`flex items-center justify-between py-3 px-3 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-orange-50 border-orange-200'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Zap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{part.name}</p>
                              <p className="text-xs text-slate-400">
                                单价 ¥{part.price}/{part.unit} · 质保90天
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updatePartQuantity(part.id, -1)}
                                  className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium text-slate-700 w-6 text-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updatePartQuantity(part.id, 1)}
                                  className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            {!isSelected && (
                              <button
                                onClick={() => updatePartQuantity(part.id, 1)}
                                className="text-xs px-3 py-1 border border-slate-300 rounded-full text-slate-600 hover:border-orange-400 hover:text-orange-500 transition-colors"
                              >
                                添加
                              </button>
                            )}
                            {isSelected && (
                              <span className="text-sm font-semibold text-orange-600 w-16 text-right">
                                ¥{qty * part.price}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {allFaultParts.length > 6 && (
                    <button
                      onClick={() => setShowAllParts(!showAllParts)}
                      className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-orange-500 flex items-center justify-center gap-1"
                    >
                      {showAllParts ? '收起' : `展开全部 ${allFaultParts.length} 种配件`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllParts ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-600">配件小计</span>
                      <Info className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="font-semibold text-slate-800">¥{quoteData.partsTotal}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-800">工时费用明细</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        城市基准工时费公示 + 阶梯计价
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-md">
                      <Award className="w-3.5 h-3.5" />
                      <span>{selectedCity} 基准 ¥{cityRate?.baseRate || 80}/小时</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-500">选择工时档位</p>
                      <p className="text-xs text-slate-400">根据故障复杂程度由师傅选择</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {cityRate?.tierRates.map((tier, idx) => {
                        const rate = (cityRate.baseRate * tier.multiplier).toFixed(0);
                        const isActive = selectedLaborTier === idx;
                        return (
                          <button
                            key={tier.tier}
                            onClick={() => setSelectedLaborTier(idx)}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${
                              isActive
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <p className={`text-sm font-semibold ${isActive ? 'text-orange-600' : 'text-slate-700'}`}>
                              {tier.tier}
                            </p>
                            <p className={`text-xs mt-1 ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                              ×{tier.multiplier}
                            </p>
                            <p className={`text-sm font-bold mt-1 ${isActive ? 'text-orange-600' : 'text-slate-600'}`}>
                              ¥{rate}/h
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">城市基准工时费</span>
                      <span className="text-slate-600">¥{quoteData.baseRate} / 小时</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">工时档位</span>
                      <span className="text-slate-600">{quoteData.tierName}（×{quoteData.tierMultiplier}）</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">实际工时单价</span>
                      <span className="font-medium text-orange-600">¥{quoteData.laborRate.toFixed(0)} / 小时</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">预计工时</span>
                      <span className="text-slate-600">{quoteData.laborHours} 小时</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">工时费合计</span>
                      <span className="font-semibold text-slate-800">¥{quoteData.laborTotal.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-blue-700">计价公式说明</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          工时费 = 城市基准工时费 × 档位倍率 × 工时数
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          即：¥{quoteData.baseRate} × {quoteData.tierMultiplier} × {quoteData.laborHours}h = ¥{quoteData.laborTotal.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">平台服务保障</h4>
                  </div>
                  <ul className="text-xs text-blue-700 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>资金担保：验收确认后 T+1 释放给师傅，不满意可申诉</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>质保 30 天：维修后同一问题免费复修，配件质保 90 天</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>差价双倍返还：发现乱收费，差额双倍返还</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('worker')}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    返回
                  </button>
                  <button className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all">
                    提交订单并支付
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">订单摘要</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  step === 'fault' ? 'bg-orange-100 text-orange-600' :
                  step === 'worker' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  第{['fault', 'worker', 'quote'].indexOf(step) + 1}步
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500 text-xs">故障类型</span>
                    {selectedFault && <span className="text-[10px] text-green-600 font-medium">已选择</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedFault?.name || '请选择故障类型'}
                  </p>
                  {selectedCategory && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedCategory.name} · 共 {selectedCategory.children?.length || 0} 种故障
                    </p>
                  )}
                </div>

                <div className={`p-2.5 rounded-lg ${
                  selectedWorker ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500 text-xs">
                      {step === 'worker' ? '意向师傅' : '指派师傅'}
                    </span>
                    {selectedWorker && <span className="text-[10px] text-blue-600 font-medium">已选择</span>}
                  </div>
                  {selectedWorker ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={matchedWorkers.find(w => w.id === selectedWorker)?.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full bg-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {matchedWorkers.find(w => w.id === selectedWorker)?.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>{matchedWorkers.find(w => w.id === selectedWorker)?.rating}分</span>
                          <span>·</span>
                          <span>匹配{matchedWorkers.find(w => w.id === selectedWorker)?.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      {step === 'worker' ? '点击师傅卡片选择' : '智能匹配最优师傅'}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">服务城市</span>
                  <span className="text-slate-700 font-medium">{selectedCity}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">基准工时费</span>
                  <span className="text-orange-600 font-medium">¥{cityRate?.baseRate || 80}/h</span>
                </div>
              </div>

              {selectedFault && (
                <div className="border-t border-slate-100 my-3 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      标准配件（常用）
                    </p>
                    <span className="text-[10px] text-slate-400">{allFaultParts.length}种可选</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {allFaultParts.slice(0, 4).map(part => (
                      <span key={part.id} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {part.name}
                      </span>
                    ))}
                    {allFaultParts.length > 4 && (
                      <span className="text-[10px] text-slate-400 px-1">+{allFaultParts.length - 4}种</span>
                    )}
                  </div>
                </div>
              )}

              {cityRate && (
                <div className="border-t border-slate-100 my-3 pt-3">
                  <p className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    工时阶梯价
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {cityRate.tierRates.slice(0, 2).map(tier => (
                      <div key={tier.tier} className="p-1.5 bg-slate-50 rounded text-center">
                        <p className="text-[10px] text-slate-500">{tier.tier}</p>
                        <p className="text-xs font-semibold text-slate-700">
                          ¥{Math.round(cityRate.baseRate * tier.multiplier)}/h
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 my-3 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">配件费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.partsTotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">工时费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.laborTotal.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">平台服务费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.platformFee}</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-600 font-medium">合计</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-500">¥{quoteData.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-800">今日特惠</p>
              </div>
              <p className="text-xs text-orange-700">
                新用户首单立减 <span className="font-bold">¥20</span>，
                分享好友再得 ¥30 优惠券
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2.5">报价透明承诺</h4>
              <ul className="text-xs text-slate-500 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>配件价格公开透明，与平台标准库一致</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>工时费按城市基准×档位，有据可查</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>师傅不得私自加价，发现可投诉</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
