import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';
import { styleOptions, materialOptions } from '../data/mockQuotes';
import type { DecorationStyle, MaterialPreference, QuoteItem } from '../types';
import FileUpload from '../components/ui/FileUpload';
import PieChart from '../components/charts/PieChart';

export default function AIQuote() {
  const { quoteResults, isGeneratingQuote, generateQuote } = useAppStore();
  const [area, setArea] = useState(120);
  const [rooms, setRooms] = useState(3);
  const [style, setStyle] = useState<DecorationStyle>('modern');
  const [material, setMaterial] = useState<MaterialPreference>('mid-range');
  const [floorPlanImage, setFloorPlanImage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [displayResult, setDisplayResult] = useState(quoteResults[0]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isGeneratingQuote) {
      setCountdown(3);
      timer = setInterval(() => setCountdown((p) => p <= 1 ? (clearInterval(timer), 0) : p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isGeneratingQuote]);

  useEffect(() => {
    if (!isGeneratingQuote && quoteResults.length > 0) {
      setDisplayResult(quoteResults[quoteResults.length - 1]);
    }
  }, [isGeneratingQuote, quoteResults]);

  const pieData = useMemo(() => displayResult ? [
    { name: '人工费', value: displayResult.breakdown.labor },
    { name: '辅料费', value: displayResult.breakdown.auxiliaryMaterials },
    { name: '主材费', value: displayResult.breakdown.mainMaterials },
    { name: '管理费', value: displayResult.breakdown.managementFee },
    { name: '设计费', value: displayResult.breakdown.designFee },
  ] : [], [displayResult]);

  const groupedItems = useMemo(() => {
    if (!displayResult) return {};
    return displayResult.itemizedQuotes.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, QuoteItem[]>);
  }, [displayResult]);

  const handleGenerate = async () => {
    const result = await generateQuote(area, rooms, style, material, floorPlanImage);
    setDisplayResult(result);
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setFloorPlanImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (!displayResult) return null;

  const RadioDot = ({ active, color }: { active: boolean; color: string }) => active ? (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`absolute top-3 right-3 w-5 h-5 ${color} rounded-full flex items-center justify-center`}>
      <div className="w-2 h-2 bg-white rounded-full" />
    </motion.div>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-amber-500" />
          AI智能报价
        </h1>
        <p className="text-lg text-slate-600">10秒生成精准装修报价</p>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            填写装修需求
          </h2>

          <div className="space-y-6">
            <FileUpload onFileSelect={handleFileSelect} label="上传户型图" description="支持 JPG、PNG 格式，最大 10MB" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">面积（㎡）</label>
                <input type="number" value={area} onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">房间数</label>
                <input type="number" value={rooms} onChange={(e) => setRooms(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" min="1" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">装修风格</label>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((option) => (
                  <label key={option.value} className={`relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    style === option.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="style" value={option.value} checked={style === option.value}
                      onChange={(e) => setStyle(e.target.value as DecorationStyle)} className="sr-only" />
                    <div>
                      <p className="font-medium text-slate-800">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                    </div>
                    <RadioDot active={style === option.value} color="bg-blue-500" />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">材料档次</label>
              <div className="grid grid-cols-2 gap-3">
                {materialOptions.map((option) => (
                  <label key={option.value} className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    material === option.value ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <input type="radio" name="material" value={option.value} checked={material === option.value}
                      onChange={(e) => setMaterial(e.target.value as MaterialPreference)} className="sr-only" />
                    <p className="font-medium text-slate-800">{option.label}</p>
                    <RadioDot active={material === option.value} color="bg-amber-500" />
                  </label>
                ))}
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={isGeneratingQuote}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isGeneratingQuote ? 'AI正在生成报价...' : '生成报价'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {isGeneratingQuote ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-96">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full mb-6" />
                <motion.div key={countdown} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl font-bold text-blue-600 mb-4">
                  {countdown}
                </motion.div>
                <p className="text-slate-600 text-lg">AI正在分析户型并计算报价...</p>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="text-center py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                  <p className="text-blue-100 mb-2">预估总报价</p>
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="text-5xl font-bold">
                    {formatCurrency(displayResult.totalPrice)}
                  </motion.div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">费用构成</h3>
                  <PieChart data={pieData} height={280} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">分项报价明细</h3>
                  <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <p className="font-medium text-slate-800">{category}</p>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-slate-600 font-medium">项目</th>
                              <th className="px-4 py-2 text-right text-slate-600 font-medium">数量</th>
                              <th className="px-4 py-2 text-right text-slate-600 font-medium">单价</th>
                              <th className="px-4 py-2 text-right text-slate-600 font-medium">小计</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx} className="border-t border-slate-100">
                                <td className="px-4 py-2 text-slate-700">{item.name}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{item.quantity}{item.unit}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-4 py-2 text-right font-medium text-slate-800">{formatCurrency(item.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
