import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: {
    festival?: string;
    scene?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

const festivals = ['情人节', '母亲节', '生日', '纪念日', '春节', '圣诞节', '教师节', '全部'];
const scenes = ['表白', '求婚', '婚礼', '探望', '祝福', '感谢', '家居装饰', '全部'];
const priceRanges = [
  { label: '全部', min: undefined, max: undefined },
  { label: '100以下', min: undefined, max: 100 },
  { label: '100-300', min: 100, max: 300 },
  { label: '300-500', min: 300, max: 500 },
  { label: '500-1000', min: 500, max: 1000 },
  { label: '1000以上', min: 1000, max: undefined },
];

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFestival, setActiveFestival] = useState<string>('全部');
  const [activeScene, setActiveScene] = useState<string>('全部');
  const [activePriceRange, setActivePriceRange] = useState<number>(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleFestivalChange = (festival: string) => {
    setActiveFestival(festival);
    const priceRange = priceRanges[activePriceRange];
    onFilterChange({
      festival: festival === '全部' ? undefined : festival,
      scene: activeScene === '全部' ? undefined : activeScene,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handleSceneChange = (scene: string) => {
    setActiveScene(scene);
    const priceRange = priceRanges[activePriceRange];
    onFilterChange({
      festival: activeFestival === '全部' ? undefined : activeFestival,
      scene: scene === '全部' ? undefined : scene,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handlePriceChange = (index: number) => {
    setActivePriceRange(index);
    const priceRange = priceRanges[index];
    onFilterChange({
      festival: activeFestival === '全部' ? undefined : activeFestival,
      scene: activeScene === '全部' ? undefined : activeScene,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const clearFilters = () => {
    setActiveFestival('全部');
    setActiveScene('全部');
    setActivePriceRange(0);
    onFilterChange({});
  };

  const hasActiveFilters = activeFestival !== '全部' || activeScene !== '全部' || activePriceRange !== 0;

  const FilterSection = ({
    title,
    options,
    activeOption,
    onChange,
  }: {
    title: string;
    options: string[];
    activeOption: string;
    onChange: (value: string) => void;
  }) => (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 text-sm rounded-btn transition-all duration-200 ${
              activeOption === option
                ? 'bg-rose text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-card shadow-sm border border-gray-100 p-4 md:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-rose" />
          <h2 className="font-serif text-lg font-semibold text-gray-800">筛选</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose transition-colors"
          >
            <X className="h-4 w-4" />
            清除筛选
          </button>
        )}
      </div>

      <div className="hidden md:block space-y-4">
        <FilterSection
          title="节日"
          options={festivals}
          activeOption={activeFestival}
          onChange={handleFestivalChange}
        />
        <FilterSection
          title="场景"
          options={scenes}
          activeOption={activeScene}
          onChange={handleSceneChange}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">价格区间</span>
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((range, index) => (
              <button
                key={range.label}
                onClick={() => handlePriceChange(index)}
                className={`px-3 py-1.5 text-sm rounded-btn transition-all duration-200 ${
                  activePriceRange === index
                    ? 'bg-rose text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-between py-2 text-gray-700"
        >
          <span className="text-sm">
            {hasActiveFilters ? '已选筛选条件' : '展开筛选'}
          </span>
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {hasActiveFilters && !showMobileFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeFestival !== '全部' && (
              <span className="px-2 py-1 text-xs bg-rose-50 text-rose rounded-btn flex items-center gap-1">
                {activeFestival}
                <button onClick={() => handleFestivalChange('全部')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeScene !== '全部' && (
              <span className="px-2 py-1 text-xs bg-sprout-50 text-sprout rounded-btn flex items-center gap-1">
                {activeScene}
                <button onClick={() => handleSceneChange('全部')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activePriceRange !== 0 && (
              <span className="px-2 py-1 text-xs bg-warmgold-50 text-warmgold rounded-btn flex items-center gap-1">
                ¥{priceRanges[activePriceRange].label}
                <button onClick={() => handlePriceChange(0)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showMobileFilters && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 animate-fade-in-up">
            <FilterSection
              title="节日"
              options={festivals}
              activeOption={activeFestival}
              onChange={handleFestivalChange}
            />
            <FilterSection
              title="场景"
              options={scenes}
              activeOption={activeScene}
              onChange={handleSceneChange}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">价格区间</span>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range, index) => (
                  <button
                    key={range.label}
                    onClick={() => handlePriceChange(index)}
                    className={`px-3 py-1.5 text-sm rounded-btn transition-all duration-200 ${
                      activePriceRange === index
                        ? 'bg-rose text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
