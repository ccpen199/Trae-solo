import React, { useState } from 'react';
import {
  User,
  Ruler,
  Eye,
  Scissors,
  Languages,
  MapPin,
  Briefcase,
  FileCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import type { ExtendedSearchCriteria } from '@shared/types';

interface AdvancedFilterPanelProps {
  criteria: ExtendedSearchCriteria;
  onChange: (criteria: ExtendedSearchCriteria) => void;
  onSearch: () => void;
  onReset: () => void;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SKILL_OPTIONS = [
  'T台走秀', '平面拍摄', '影视表演', '主持', '舞蹈', '唱歌',
  '钢琴', '吉他', '瑜伽', '健身', '游泳', '篮球',
  '美妆', '穿搭', '淘宝直播', '短视频拍摄', '珠宝展示',
  '街舞', '滑板', '摄影', '高尔夫', '马术', '拳击', 'DJ',
  '茶艺', '绘画',
];

const LANGUAGE_OPTIONS = [
  '中文', '英语', '日语', '韩语', '法语', '西班牙语',
  '粤语', '上海话',
];

const EYE_COLOR_OPTIONS = ['黑色', '棕色', '深棕色', '蓝色', '绿色', '灰色', '榛色'];
const HAIR_COLOR_OPTIONS = ['黑色', '自然黑', '棕色', '深棕色', '亚麻色', '栗色', '金色', '红色', '灰色'];
const CONTRACT_STATUS_OPTIONS = [
  { value: 'available', label: '可接通告' },
  { value: 'signed', label: '已签约' },
  { value: 'exclusive', label: '专属合约' },
  { value: 'unavailable', label: '暂不可用' },
];

const FilterSection: React.FC<FilterSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-midnight-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-1 hover:bg-midnight-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-rose-400">{icon}</span>
          <span className="font-medium text-white">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-midnight-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-midnight-400" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out-expo pb-4',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = '',
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-midnight-300">{label}</span>
        <span className="text-sm font-medium text-rose-400">
          {value[0]}{unit} - {value[1]}{unit}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
      >
        <Slider.Track className="bg-midnight-700 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-gradient-primary rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 rounded-full bg-gradient-primary shadow-lg shadow-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800 transition-transform hover:scale-110"
          aria-label={`${label} min`}
        />
        <Slider.Thumb
          className="block w-5 h-5 rounded-full bg-gradient-primary shadow-lg shadow-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800 transition-transform hover:scale-110"
          aria-label={`${label} max`}
        />
      </Slider.Root>
    </div>
  );
};

interface MultiSelectTagsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  options,
  selected,
  onChange,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
    secondary: 'bg-sapphire-500/15 text-sapphire-300 border-sapphire-500/30 hover:bg-sapphire-500/25',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
  };

  const activeColorClasses = {
    primary: 'bg-gradient-primary text-white border-rose-500 shadow-lg shadow-rose-500/20',
    secondary: 'bg-gradient-secondary text-white border-sapphire-500 shadow-lg shadow-sapphire-500/20',
    success: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20',
    warning: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20',
  };

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            onClick={() => toggleTag(option)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300',
              isActive ? activeColorClasses[color] : colorClasses[color]
            )}
          >
            {option}
            {isActive && <X className="w-3 h-3 ml-1.5" />}
          </button>
        );
      })}
    </div>
  );
};

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  criteria,
  onChange,
  onSearch,
  onReset,
  className,
}) => {
  const updateCriteria = (updates: Partial<ExtendedSearchCriteria>) => {
    onChange({ ...criteria, ...updates });
  };

  return (
    <Card variant="glass" className={cn('h-fit sticky top-6', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">高级筛选</h2>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onReset}
          >
            重置
          </Button>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 space-y-0 custom-scrollbar">
          <FilterSection title="基本信息" icon={<User className="w-4 h-4" />}>
            <div className="space-y-5 pl-1">
              <div>
                <label className="block text-sm text-midnight-300 mb-2">性别</label>
                <div className="flex gap-2">
                  {[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                    { value: 'other', label: '不限' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        updateCriteria({
                          gender: criteria.gender === option.value ? undefined : option.value,
                        })
                      }
                      className={cn(
                        'flex-1 py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-300',
                        criteria.gender === option.value
                          ? 'bg-gradient-primary border-rose-500 text-white shadow-lg shadow-rose-500/20'
                          : 'bg-midnight-800/50 border-midnight-700 text-midnight-200 hover:border-rose-500/50 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <RangeSlider
                label="年龄范围"
                min={16}
                max={60}
                value={[criteria.ageMin || 16, criteria.ageMax || 60]}
                onChange={([min, max]) => updateCriteria({ ageMin: min, ageMax: max })}
                unit="岁"
              />

              <RangeSlider
                label="身高范围"
                min={150}
                max={200}
                value={[criteria.heightMin || 150, criteria.heightMax || 200]}
                onChange={([min, max]) => updateCriteria({ heightMin: min, heightMax: max })}
                unit="cm"
              />

              <RangeSlider
                label="体重范围"
                min={40}
                max={100}
                value={[criteria.weightMin || 40, criteria.weightMax || 100]}
                onChange={([min, max]) => updateCriteria({ weightMin: min, weightMax: max })}
                unit="kg"
              />
            </div>
          </FilterSection>

          <FilterSection title="身体特征" icon={<Ruler className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-5 pl-1">
              <RangeSlider
                label="胸围范围"
                min={70}
                max={120}
                value={[criteria.bustMin || 70, criteria.bustMax || 120]}
                onChange={([min, max]) => updateCriteria({ bustMin: min, bustMax: max })}
                unit="cm"
              />

              <RangeSlider
                label="腰围范围"
                min={50}
                max={100}
                value={[criteria.waistMin || 50, criteria.waistMax || 100]}
                onChange={([min, max]) => updateCriteria({ waistMin: min, waistMax: max })}
                unit="cm"
              />

              <RangeSlider
                label="臀围范围"
                min={70}
                max={120}
                value={[criteria.hipsMin || 70, criteria.hipsMax || 120]}
                onChange={([min, max]) => updateCriteria({ hipsMin: min, hipsMax: max })}
                unit="cm"
              />

              <div>
                <label className="block text-sm text-midnight-300 mb-2">
                  <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                  眼睛颜色
                </label>
                <MultiSelectTags
                  options={EYE_COLOR_OPTIONS}
                  selected={criteria.eyeColor ? [criteria.eyeColor] : []}
                  onChange={(selected) =>
                    updateCriteria({ eyeColor: selected[0] || undefined })
                  }
                  color="secondary"
                />
              </div>

              <div>
                <label className="block text-sm text-midnight-300 mb-2">
                  <Scissors className="w-3.5 h-3.5 inline mr-1.5" />
                  头发颜色
                </label>
                <MultiSelectTags
                  options={HAIR_COLOR_OPTIONS}
                  selected={criteria.hairColor ? [criteria.hairColor] : []}
                  onChange={(selected) =>
                    updateCriteria({ hairColor: selected[0] || undefined })
                  }
                  color="warning"
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="专业技能" icon={<Briefcase className="w-4 h-4" />}>
            <div className="pl-1">
              <MultiSelectTags
                options={SKILL_OPTIONS}
                selected={criteria.skills || []}
                onChange={(selected) => updateCriteria({ skills: selected })}
                color="primary"
              />
            </div>
          </FilterSection>

          <FilterSection title="语言能力" icon={<Languages className="w-4 h-4" />} defaultOpen={false}>
            <div className="pl-1">
              <MultiSelectTags
                options={LANGUAGE_OPTIONS}
                selected={criteria.languages || []}
                onChange={(selected) => updateCriteria({ languages: selected })}
                color="success"
              />
            </div>
          </FilterSection>

          <FilterSection title="位置范围" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-4 pl-1">
              <Input
                label="城市"
                placeholder="输入城市名称"
                value={criteria.location || ''}
                onChange={(e) => updateCriteria({ location: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4" />}
              />

              <RangeSlider
                label="搜索半径"
                min={5}
                max={500}
                step={5}
                value={[5, criteria.radius || 100]}
                onChange={([, max]) => updateCriteria({ radius: max })}
                unit="km"
              />
            </div>
          </FilterSection>

          <FilterSection title="经验背景" icon={<FileCheck className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-4 pl-1">
              <RangeSlider
                label="从业年限"
                min={0}
                max={20}
                value={[0, criteria.experienceMin || 20]}
                onChange={([, max]) => updateCriteria({ experienceMin: max })}
                unit="年"
              />

              <div className="space-y-3">
                <Checkbox
                  checked={criteria.hasCommercialExperience || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ hasCommercialExperience: checked as boolean })
                  }
                  label="有商业代言经验"
                  description="曾参与品牌代言、商业广告拍摄"
                />
                <Checkbox
                  checked={criteria.hasFilmTvExperience || false}
                  onCheckedChange={(checked) =>
                    updateCriteria({ hasFilmTvExperience: checked as boolean })
                  }
                  label="有影视表演经历"
                  description="参与过电影、电视剧或网络剧拍摄"
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="合同状态" icon={<FileCheck className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-2 pl-1">
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    updateCriteria({
                      contractStatus:
                        criteria.contractStatus === option.value ? undefined : option.value,
                    })
                  }
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border-2 text-sm transition-all duration-300',
                    criteria.contractStatus === option.value
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-midnight-800/50 border-midnight-700 text-midnight-200 hover:border-rose-500/50'
                  )}
                >
                  <span>{option.label}</span>
                  {criteria.contractStatus === option.value && (
                    <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="档期安排" icon={<Calendar className="w-4 h-4" />} defaultOpen={false}>
            <div className="space-y-4 pl-1">
              <div>
                <label className="block text-sm text-midnight-300 mb-2">可用起始日期</label>
                <input
                  type="date"
                  value={
                    criteria.availableFrom
                      ? new Date(criteria.availableFrom).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    updateCriteria({
                      availableFrom: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-11 px-4 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 text-white placeholder-midnight-500 focus:outline-none focus:border-rose-500 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm text-midnight-300 mb-2">可用结束日期</label>
                <input
                  type="date"
                  value={
                    criteria.availableTo
                      ? new Date(criteria.availableTo).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    updateCriteria({
                      availableTo: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-11 px-4 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 text-white placeholder-midnight-500 focus:outline-none focus:border-rose-500 transition-all duration-300"
                />
              </div>
            </div>
          </FilterSection>
        </div>

        <div className="pt-4 mt-2 border-t border-midnight-700/50">
          <Button
            variant="primary"
            className="w-full"
            leftIcon={<Search className="w-4 h-4" />}
            onClick={onSearch}
          >
            搜索匹配
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilterPanel;
