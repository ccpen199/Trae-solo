import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { faultTypes, findFaultTypeById } from '@/data/faults';
import { getWorkersBySkillCategory } from '@/data/workers';
import { getPartsByCategory, getLaborRateByCity } from '@/data/parts';
import { ChevronRight, Star, MapPin, Shield, Clock, Check, Award, FileText, Upload, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { FaultType } from '@/types';

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

  const matchedWorkers = selectedFault
    ? getWorkersBySkillCategory(selectedFault.skillCategoryId)
        .map(w => ({ ...w, matchScore: Math.floor(80 + Math.random() * 20) }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    : [];

  const cityRate = getLaborRateByCity('上海');
  const faultParts = selectedFault ? getPartsByCategory(selectedFault.skillCategoryId).slice(0, 4) : [];

  const handleFaultSelect = (fault: FaultType) => {
    setSelectedFault(fault);
    setSelectedFaultType(fault.id);
    setStep('worker');
  };

  const handleWorkerSelect = (workerId: string) => {
    setSelectedWorker(workerId);
    setStep('quote');
  };

  const calculateTotal = () => {
    const partsTotal = faultParts.reduce((sum, p) => sum + p.price * 1, 0);
    const laborTotal = (cityRate?.baseRate || 80) * 1.5;
    const platformFee = Math.round((partsTotal + laborTotal) * 0.05);
    return {
      parts: faultParts.map(p => ({ partId: p.id, name: p.name, price: p.price, quantity: 1 })),
      partsTotal,
      laborHours: 1.5,
      laborRate: cityRate?.baseRate || 80,
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
                              className={`text-xs px-2 py-0.5 rounded-md ${
                                skill.status === 'verified'
                                  ? 'bg-green-50 text-green-600 border border-green-200'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}
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
                    <h3 className="font-semibold text-slate-800">标准化配件费用</h3>
                    <span className="text-xs text-slate-400">平台统一价</span>
                  </div>
                  <div className="space-y-2">
                    {faultParts.map(part => (
                      <div key={part.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm text-slate-700">{part.name}</p>
                          <p className="text-xs text-slate-400">x1</p>
                        </div>
                        <span className="text-sm font-medium text-slate-700">¥{part.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-dashed border-slate-200">
                    <span className="text-sm text-slate-600">配件小计</span>
                    <span className="font-semibold text-slate-800">¥{quoteData.partsTotal}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/50 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">工时费用</h3>
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      <Award className="w-3 h-3" />
                      <span>上海基准 ¥{cityRate?.baseRate || 80}/小时</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-slate-700">基础工时</p>
                        <p className="text-xs text-slate-400">1.5 小时 × ¥{cityRate?.baseRate || 80}</p>
                      </div>
                      <span className="text-sm font-medium text-slate-700">¥{quoteData.laborTotal.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {cityRate?.tierRates.map(tier => (
                      <div
                        key={tier.tier}
                        className={`text-center p-2 rounded-lg border ${
                          tier.tier === '基础工时'
                            ? 'border-orange-300 bg-orange-50 text-orange-600'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        <p className="text-xs font-medium">{tier.tier}</p>
                        <p className="text-xs mt-0.5">×{tier.multiplier}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">平台服务保障</h4>
                  </div>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 资金担保：验收确认后 T+1 释放给师傅</li>
                    <li>• 质保 30 天：维修后同一问题免费复修</li>
                    <li>• 差价双倍返还：发现乱收费，差额双倍返还</li>
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
              <h3 className="font-semibold text-slate-800 mb-4">订单摘要</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">故障类型</span>
                  <span className="text-slate-700 font-medium">
                    {selectedFault?.name || '请选择'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">指派师傅</span>
                  <span className="text-slate-700 font-medium">
                    {matchedWorkers.find(w => w.id === selectedWorker)?.name || '智能匹配'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">预计上门</span>
                  <span className="text-slate-700 font-medium">30 分钟内</span>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">配件费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.partsTotal}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-500">工时费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.laborTotal.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-500">平台服务费</span>
                  <span className="text-sm text-slate-700">¥{quoteData.platformFee}</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between">
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
          </div>
        </div>
      </div>
    </div>
  );
}
