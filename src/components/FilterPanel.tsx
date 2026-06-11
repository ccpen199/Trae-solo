import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Home,
  BedDouble,
  Paintbrush,
  Compass,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  priceRange: [number, number];
  areaRange: [number, number];
  bedrooms: number[];
  decoration: string[];
  orientation: string[];
  buildingAge: [number, number];
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset?: () => void;
  className?: string;
}

export const defaultFilters: FilterState = {
  priceRange: [0, 2000],
  areaRange: [0, 300],
  bedrooms: [],
  decoration: [],
  orientation: [],
  buildingAge: [0, 50],
};

const bedroomOptions = [1, 2, 3, 4, 5];
const decorationOptions = ['毛坯', '简装', '精装', '豪装'];
const orientationOptions = ['南', '北', '东', '西', '东南', '西南'];

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  className,
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    area: true,
    bedrooms: true,
    decoration: false,
    orientation: false,
    buildingAge: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = [...filters.priceRange] as [number, number];
    if (type === 'min') {
      newRange[0] = Math.min(value, newRange[1] - 50);
    } else {
      newRange[1] = Math.max(value, newRange[0] + 50);
    }
    onChange({ ...filters, priceRange: newRange });
  };

  const handleAreaChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = [...filters.areaRange] as [number, number];
    if (type === 'min') {
      newRange[0] = Math.min(value, newRange[1] - 10);
    } else {
      newRange[1] = Math.max(value, newRange[0] + 10);
    }
    onChange({ ...filters, areaRange: newRange });
  };

  const handleAgeChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = [...filters.buildingAge] as [number, number];
    if (type === 'min') {
      newRange[0] = Math.min(value, newRange[1] - 5);
    } else {
      newRange[1] = Math.max(value, newRange[0] + 5);
    }
    onChange({ ...filters, buildingAge: newRange });
  };

  const toggleBedroom = (bedroom: number) => {
    const newBedrooms = filters.bedrooms.includes(bedroom)
      ? filters.bedrooms.filter((b) => b !== bedroom)
      : [...filters.bedrooms, bedroom];
    onChange({ ...filters, bedrooms: newBedrooms });
  };

  const toggleDecoration = (decoration: string) => {
    const newDecoration = filters.decoration.includes(decoration)
      ? filters.decoration.filter((d) => d !== decoration)
      : [...filters.decoration, decoration];
    onChange({ ...filters, decoration: newDecoration });
  };

  const toggleOrientation = (orientation: string) => {
    const newOrientation = filters.orientation.includes(orientation)
      ? filters.orientation.filter((o) => o !== orientation)
      : [...filters.orientation, orientation];
    onChange({ ...filters, orientation: newOrientation });
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange(defaultFilters);
    }
  };

  const activeFilterCount = [
    filters.priceRange[0] !== defaultFilters.priceRange[0] || filters.priceRange[1] !== defaultFilters.priceRange[1],
    filters.areaRange[0] !== defaultFilters.areaRange[0] || filters.areaRange[1] !== defaultFilters.areaRange[1],
    filters.bedrooms.length > 0,
    filters.decoration.length > 0,
    filters.orientation.length > 0,
    filters.buildingAge[0] !== defaultFilters.buildingAge[0] || filters.buildingAge[1] !== defaultFilters.buildingAge[1],
  ].filter(Boolean).length;

  const SectionHeader = ({
    title,
    icon: Icon,
    section,
  }: {
    title: string;
    icon: typeof Home;
    section: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex w-full items-center justify-between py-3 text-left"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary-600" />
        <span className="font-medium text-neutral-800">{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="h-4 w-4 text-neutral-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-neutral-400" />
      )}
    </button>
  );

  const RangeSlider = ({
    min,
    max,
    value,
    onChange,
    unit,
  }: {
    min: number;
    max: number;
    value: [number, number];
    onChange: (type: 'min' | 'max', value: number) => void;
    unit: string;
  }) => {
    const percentageMin = ((value[0] - min) / (max - min)) * 100;
    const percentageMax = ((value[1] - min) / (max - min)) * 100;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">最低</span>
            <span className="font-semibold text-primary-700">
              {value[0]}
              {unit}
            </span>
          </div>
          <span className="text-neutral-300">—</span>
          <div className="flex items-center gap-1">
            <span className="text-neutral-500">最高</span>
            <span className="font-semibold text-primary-700">
              {value[1]}
              {unit}
            </span>
          </div>
        </div>

        <div className="relative h-2">
          <div className="absolute inset-0 rounded-full bg-neutral-200" />
          <div
            className="absolute h-full rounded-full bg-primary-600"
            style={{
              left: `${percentageMin}%`,
              right: `${100 - percentageMax}%`,
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={value[0]}
            onChange={(e) => onChange('min', Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary-600"
          />
          <input
            type="range"
            min={min}
            max={max}
            value={value[1]}
            onChange={(e) => onChange('max', Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary-600"
          />
        </div>
      </div>
    );
  };

  const ChipGroup = ({
    options,
    selected,
    onToggle,
    suffix = '',
  }: {
    options: (string | number)[];
    selected: (string | number)[];
    onToggle: (value: string | number) => void;
    suffix?: string;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <motion.button
            key={String(option)}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(option)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition-all',
              isSelected
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-400 hover:text-primary-600'
            )}
          >
            {option}
            {suffix}
            {isSelected && <X className="ml-1 inline h-3 w-3" />}
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('card h-fit sticky top-4', className)}
    >
      <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-neutral-900">筛选条件</h3>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-primary-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="border-b border-neutral-100">
          <SectionHeader title="价格范围" icon={Home} section="price" />
          <AnimatePresence>
            {expandedSections.price && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <RangeSlider
                  min={0}
                  max={2000}
                  value={filters.priceRange}
                  onChange={handlePriceChange}
                  unit="万"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-neutral-100">
          <SectionHeader title="面积范围" icon={Home} section="area" />
          <AnimatePresence>
            {expandedSections.area && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <RangeSlider
                  min={0}
                  max={300}
                  value={filters.areaRange}
                  onChange={handleAreaChange}
                  unit="㎡"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-neutral-100">
          <SectionHeader title="户型" icon={BedDouble} section="bedrooms" />
          <AnimatePresence>
            {expandedSections.bedrooms && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <ChipGroup
                  options={bedroomOptions}
                  selected={filters.bedrooms}
                  onToggle={(v) => toggleBedroom(v as number)}
                  suffix="室"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-neutral-100">
          <SectionHeader title="装修" icon={Paintbrush} section="decoration" />
          <AnimatePresence>
            {expandedSections.decoration && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <ChipGroup
                  options={decorationOptions}
                  selected={filters.decoration}
                  onToggle={toggleDecoration}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-b border-neutral-100">
          <SectionHeader title="朝向" icon={Compass} section="orientation" />
          <AnimatePresence>
            {expandedSections.orientation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <ChipGroup
                  options={orientationOptions}
                  selected={filters.orientation}
                  onToggle={toggleOrientation}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <SectionHeader title="房龄" icon={Calendar} section="buildingAge" />
          <AnimatePresence>
            {expandedSections.buildingAge && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-2"
              >
                <RangeSlider
                  min={0}
                  max={50}
                  value={filters.buildingAge}
                  onChange={handleAgeChange}
                  unit="年"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
