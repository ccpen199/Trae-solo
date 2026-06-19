import { motion } from 'framer-motion';
import {
  Settings2,
  DollarSign,
  MapPin,
  Building2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { cities, companySizes, industryPreferences } from '@/data/mockCompetency';

interface Step4ExpectationsProps {
  salaryMin: number;
  salaryMax: number;
  selectedCities: string[];
  selectedSize: string | null;
  selectedIndustries: string[];
  onSalaryMinChange: (value: number) => void;
  onSalaryMaxChange: (value: number) => void;
  onToggleCity: (city: string) => void;
  onSelectSize: (size: string | null) => void;
  onToggleIndustry: (industry: string) => void;
}

export function Step4Expectations({
  salaryMin,
  salaryMax,
  selectedCities,
  selectedSize,
  selectedIndustries,
  onSalaryMinChange,
  onSalaryMaxChange,
  onToggleCity,
  onSelectSize,
  onToggleIndustry,
}: Step4ExpectationsProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-lavender-100 flex items-center justify-center">
          <Settings2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <div className="text-xs text-lavender-600 font-semibold mb-0.5">Step 4 / 4</div>
          <h2 className="text-2xl font-bold font-heading">设定期望条件</h2>
        </div>
      </div>
      <p className="text-slate-600">
        告诉我们你的求职偏好，系统将结合能力评估进行多维度匹配推荐
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">期望薪资范围</h3>
                <p className="text-xs text-slate-500">拖动滑块选择月薪范围（单位：元）</p>
              </div>
            </div>
            <Badge variant="gold" size="md">
              {salaryMin.toLocaleString()} - {salaryMax.toLocaleString()}
            </Badge>
          </div>
          <div className="relative px-4 py-8">
            <div className="relative h-2 bg-slate-200 rounded-full">
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-emerald-500 via-lavender-500 to-space-indigo-500 rounded-full"
                style={{
                  left: `${((salaryMin - 5000) / 95000) * 100}%`,
                  right: `${100 - ((salaryMax - 5000) / 95000) * 100}%`,
                }}
              />
              <input
                type="range"
                min={5000}
                max={100000}
                step={1000}
                value={salaryMin}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), salaryMax - 5000);
                  onSalaryMinChange(val);
                }}
                className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <input
                type="range"
                min={5000}
                max={100000}
                step={1000}
                value={salaryMax}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), salaryMin + 5000);
                  onSalaryMaxChange(val);
                }}
                className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-lavender-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-3 text-xs text-slate-500">
              <span>5K</span>
              <span>25K</span>
              <span>50K</span>
              <span>75K</span>
              <span>100K</span>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">期望城市</h3>
                <p className="text-xs text-slate-500">可多选，已选 {selectedCities.length} 个</p>
              </div>
            </div>
            {selectedCities.length > 0 && (
              <button
                onClick={() => selectedCities.forEach((c) => onToggleCity(c))}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const selected = selectedCities.includes(city);
              return (
                <motion.button
                  key={city}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onToggleCity(city)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200',
                    selected
                      ? 'border-emerald-400 bg-gradient-to-r from-emerald-50 to-lavender-50 text-emerald-700 shadow-md'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-lavender-300 hover:bg-lavender-50/40'
                  )}
                >
                  {selected && (
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  )}
                  {city}
                </motion.button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">公司规模偏好</h3>
              <p className="text-xs text-slate-500">选择你倾向的公司发展阶段</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {companySizes.map((sz) => {
              const selected = selectedSize === sz.value;
              return (
                <motion.button
                  key={sz.value}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectSize(selected ? null : sz.value)}
                  className={cn(
                    'p-4 rounded-xl text-center border-2 transition-all',
                    selected
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-lavender-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-lavender-200'
                  )}
                >
                  <div
                    className={cn(
                      'text-lg font-bold mb-1',
                      selected ? 'gradient-text' : 'text-slate-900'
                    )}
                  >
                    {sz.label}
                  </div>
                  <div className="text-xs text-slate-500">{sz.sub}</div>
                </motion.button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 to-lavender-100">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">行业偏好</h3>
                <p className="text-xs text-slate-500">可多选，优先匹配这些行业的岗位</p>
              </div>
            </div>
            {selectedIndustries.length > 0 && (
              <button
                onClick={() => selectedIndustries.forEach((i) => onToggleIndustry(i))}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {industryPreferences.map((ind) => {
              const selected = selectedIndustries.includes(ind);
              return (
                <motion.button
                  key={ind}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onToggleIndustry(ind)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-medium border-2 transition-all',
                    selected
                      ? 'border-lavender-400 bg-lavender-50 text-lavender-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                  )}
                >
                  {ind}
                </motion.button>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
