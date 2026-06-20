import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { performAIAnalysis, AIAnalysisInput } from '@/engine/aiAnalysis';
import {
  Upload,
  Sparkles,
  Clock,
  Target,
  Wrench,
  Lightbulb,
  Calendar,
  Fish,
  Thermometer,
  Droplets,
  MapPin,
  Zap,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';

export default function AIAnalysis() {
  const { theme, selectedSpot, selectedSpecies, selectedMethod, currentEnvironment } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    duration: '240',
    catchCount: '3',
    totalWeight: '5.5',
    equipment: '',
    weatherNotes: '',
  });
  
  const handleAnalyze = () => {
    if (!selectedSpot || !selectedSpecies || !selectedMethod || !currentEnvironment) return;
    
    setIsAnalyzing(true);
    
    const equipmentList = formData.equipment 
      ? formData.equipment.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
      : ['鱼竿', '鱼线', '浮漂'];
    
    const input: AIAnalysisInput = {
      spot: selectedSpot,
      species: selectedSpecies,
      method: selectedMethod,
      photoUrl: 'https://example.com/fish.jpg',
      duration: parseInt(formData.duration) || 240,
      date: new Date(),
      catchCount: parseInt(formData.catchCount) || 3,
      totalWeight: parseFloat(formData.totalWeight) || 5.5,
      equipment: equipmentList,
      weatherNotes: formData.weatherNotes || '天气晴朗，鱼口一般',
    };
    
    setTimeout(() => {
      const result = performAIAnalysis(input);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    }, 1500);
  };
  
  const getActivityColor = (level: string) => {
    if (level === 'high') return 'text-lake-green-400';
    if (level === 'medium') return 'text-yellow-400';
    return 'text-sunset-orange-400';
  };
  
  const getActivityBg = (level: string) => {
    if (level === 'high') return 'from-lake-green-500/20 to-lake-green-500/5';
    if (level === 'medium') return 'from-yellow-500/20 to-yellow-500/5';
    return 'from-sunset-orange-500/20 to-sunset-orange-500/5';
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 标题区域 */}
      <div className={cn(
        'rounded-2xl p-6 bg-gradient-to-r from-deep-sea-500/20 via-lake-green-500/10 to-deep-sea-500/20',
        theme === 'dark' ? 'border border-deep-sea-700/50' : 'border border-moonlight-200'
      )}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lake-green-400 to-deep-sea-500 flex items-center justify-center">
            <Sparkles size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">AI 渔获分析</h2>
            <p className="text-moonlight-400 mt-1">上传渔获照片，AI智能分析鱼口活跃度，给出黄金时段与装备建议</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：上传区域 */}
        <div className="space-y-6">
          {/* 照片上传 */}
          <div className={cn(
            'rounded-2xl p-6',
            theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
          )}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-lake-green-400" />
              上传渔获照片
            </h3>
            <div className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-lake-green-500/50',
              theme === 'dark' ? 'border-deep-sea-700' : 'border-moonlight-200'
            )}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lake-green-500/10 flex items-center justify-center">
                <Upload size={32} className="text-lake-green-400" />
              </div>
              <p className="font-medium mb-1">点击或拖拽上传照片</p>
              <p className="text-sm text-moonlight-400">支持 JPG、PNG 格式，大小不超过 10MB</p>
            </div>
          </div>
          
          {/* 当前选择 */}
          <div className={cn(
            'rounded-2xl p-6',
            theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
          )}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} className="text-deep-sea-400" />
              当前分析配置
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-deep-sea-800/30">
                <span className="text-moonlight-400">钓点</span>
                <span className="font-medium">{selectedSpot?.name || '未选择'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-deep-sea-800/30">
                <span className="text-moonlight-400">目标鱼种</span>
                <span className="font-medium">{selectedSpecies?.name || '未选择'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-deep-sea-800/30">
                <span className="text-moonlight-400">钓法</span>
                <span className="font-medium">{selectedMethod?.name || '未选择'}</span>
              </div>
            </div>
          </div>
          
          {/* 渔获信息 */}
          <div className={cn(
            'rounded-2xl p-6',
            theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
          )}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Fish size={20} className="text-lake-green-400" />
              渔获信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="垂钓时长(分钟)"
                placeholder="如：240"
                value={formData.duration}
                onChange={(v) => setFormData({ ...formData, duration: v })}
                theme={theme}
              />
              <FormField
                label="渔获数量"
                placeholder="如：3"
                value={formData.catchCount}
                onChange={(v) => setFormData({ ...formData, catchCount: v })}
                theme={theme}
              />
              <FormField
                label="总重量(kg)"
                placeholder="如：5.5"
                value={formData.totalWeight}
                onChange={(v) => setFormData({ ...formData, totalWeight: v })}
                theme={theme}
              />
              <FormField
                label="使用装备"
                placeholder="如：鱼竿,鱼线,浮漂"
                value={formData.equipment}
                onChange={(v) => setFormData({ ...formData, equipment: v })}
                theme={theme}
              />
            </div>
            <div className="mt-4">
              <FormField
                label="天气/渔况备注"
                placeholder="描述一下今天的天气和鱼口情况..."
                value={formData.weatherNotes}
                onChange={(v) => setFormData({ ...formData, weatherNotes: v })}
                theme={theme}
                type="textarea"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-lake-green-500 to-deep-sea-500 text-white font-medium flex items-center justify-center gap-2 hover:from-lake-green-600 hover:to-deep-sea-600 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  开始 AI 分析
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* 右侧：分析结果 */}
        <div className="space-y-6">
          {analysisResult ? (
            <>
              {/* 活跃度评分 */}
              <div className={cn(
                'rounded-2xl p-6 bg-gradient-to-br',
                getActivityBg(analysisResult.activityLevel),
                theme === 'dark' ? 'border border-deep-sea-700/50' : 'border border-moonlight-200'
              )}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={20} className={getActivityColor(analysisResult.activityLevel)} />
                  鱼口活跃度预测
                </h3>
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <span className={cn('text-6xl font-bold', getActivityColor(analysisResult.activityLevel))}>
                      {analysisResult.activityScore}
                    </span>
                    <p className="text-2xl font-bold mt-2">{analysisResult.activityLevelName}</p>
                    <p className="text-moonlight-400 mt-2">{analysisResult.activityDescription}</p>
                  </div>
                </div>
              </div>
              
              {/* 黄金时段 */}
              <div className={cn(
                'rounded-2xl p-6',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-yellow-400" />
                  黄金时段推荐
                </h3>
                <div className="space-y-3">
                  {analysisResult.primeTimes.map((time: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        'p-4 rounded-xl flex items-center justify-between',
                        theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Clock size={18} className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium">{time.time}</p>
                          <p className="text-xs text-moonlight-400">{time.reason}</p>
                        </div>
                      </div>
                      <span className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        time.level === 'excellent' ? 'bg-lake-green-500/20 text-lake-green-400' :
                        time.level === 'good' ? 'bg-deep-sea-500/20 text-deep-sea-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      )}>
                        {time.levelName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 装备建议 */}
              <div className={cn(
                'rounded-2xl p-6',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wrench size={20} className="text-sunset-orange-400" />
                  装备匹配建议
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {analysisResult.gearRecommendations.map((gear: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        'p-4 rounded-xl',
                        theme === 'dark' ? 'bg-deep-sea-800/50' : 'bg-moonlight-50'
                      )}
                    >
                      <p className="text-xs text-moonlight-400 mb-1">{gear.type}</p>
                      <p className="font-medium text-lake-green-400">{gear.recommendation}</p>
                      <p className="text-xs text-moonlight-500 mt-1">{gear.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 钓法优化策略 */}
              <div className={cn(
                'rounded-2xl p-6',
                theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
              )}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb size={20} className="text-lake-green-400" />
                  钓法优化策略
                </h3>
                <div className="space-y-3">
                  {analysisResult.strategyTips.map((tip: string, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-lake-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-lake-green-400" />
                      </div>
                      <p className="text-sm text-moonlight-300">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={cn(
              'rounded-2xl p-12 text-center',
              theme === 'dark' ? 'bg-deep-sea-900/50 border border-deep-sea-700/50' : 'bg-white border border-moonlight-200'
            )}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-deep-sea-500/10 flex items-center justify-center">
                <Sparkles size={40} className="text-deep-sea-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">等待分析</h3>
              <p className="text-moonlight-400">上传渔获照片并填写基础信息<br />AI 将为您生成专业的垂钓建议</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  theme: string;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
}

function FormField({ label, placeholder, value, onChange, theme, type = 'text', options = [] }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm text-moonlight-400 mb-2 block">{label}</label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border outline-none transition-all',
            theme === 'dark'
              ? 'bg-deep-sea-800/50 border-deep-sea-700 text-moonlight-100 focus:border-lake-green-500/50'
              : 'bg-moonlight-50 border-moonlight-200 text-deep-sea-900 focus:border-lake-green-500/50'
          )}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border outline-none transition-all',
            theme === 'dark'
              ? 'bg-deep-sea-800/50 border-deep-sea-700 text-moonlight-100 placeholder-moonlight-500 focus:border-lake-green-500/50'
              : 'bg-moonlight-50 border-moonlight-200 text-deep-sea-900 placeholder-moonlight-400 focus:border-lake-green-500/50'
          )}
        />
      )}
    </div>
  );
}
