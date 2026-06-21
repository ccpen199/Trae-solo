import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, X, CheckCircle } from 'lucide-react';
import { CATEGORIES, PROVINCES, type SupplyFilter as SupplyFilterType } from '../../../shared/types';

interface SupplyFilterProps {
  onFilter: (filter: SupplyFilterType) => void;
  onReset: () => void;
}

export const SupplyFilter: React.FC<SupplyFilterProps> = ({ onFilter, onReset }) => {
  const [filters, setFilters] = useState<SupplyFilterType>({
    category: '',
    minTonnage: undefined,
    maxTonnage: undefined,
    minPurity: undefined,
    region: '',
    certified: undefined,
    keyword: '',
  });
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: keyof SupplyFilterType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedFilters: SupplyFilterType = {} as SupplyFilterType;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        (cleanedFilters as any)[key] = value;
      }
    });
    onFilter(cleanedFilters);
  };

  const handleReset = () => {
    setFilters({
      category: '',
      minTonnage: undefined,
      maxTonnage: undefined,
      minPurity: undefined,
      region: '',
      certified: undefined,
      keyword: '',
    });
    onReset();
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="搜索货源描述、供应商名称..."
                  icon={<Search className="w-4 h-4" />}
                  value={filters.keyword || ''}
                  onChange={(e) => handleChange('keyword', e.target.value)}
                />
              </div>
              <Button type="submit">
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpanded(!expanded)}
              >
                <Filter className="w-4 h-4 mr-2" />
                高级筛选
                {activeFiltersCount > 0 && (
                  <Badge variant="danger" size="sm" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {expanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <Select
                  label="废料品类"
                  options={[
                    { value: '', label: '全部品类' },
                    ...CATEGORIES.map(c => ({ value: c.id, label: c.name })),
                  ]}
                  value={filters.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                />

                <Select
                  label="所在地区"
                  options={[
                    { value: '', label: '全部地区' },
                    ...PROVINCES.map(p => ({ value: p.code, label: p.name })),
                  ]}
                  value={filters.region || ''}
                  onChange={(e) => handleChange('region', e.target.value)}
                />

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      label="最小吨位"
                      type="number"
                      placeholder="吨"
                      min="0"
                      value={filters.minTonnage || ''}
                      onChange={(e) => handleChange('minTonnage', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="text-slate-400 pb-2">—</div>
                  <div className="flex-1">
                    <Input
                      label="最大吨位"
                      type="number"
                      placeholder="吨"
                      min="0"
                      value={filters.maxTonnage || ''}
                      onChange={(e) => handleChange('maxTonnage', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>

                <Input
                  label="最低纯度"
                  type="number"
                  placeholder="%"
                  min="0"
                  max="100"
                  value={filters.minPurity || ''}
                  onChange={(e) => handleChange('minPurity', e.target.value ? Number(e.target.value) : undefined)}
                />

                <div className="lg:col-span-4 flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.certified === true}
                        onChange={(e) => handleChange('certified', e.target.checked ? true : undefined)}
                        className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                      />
                      <CheckCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-slate-600">仅显示认证货源</span>
                    </label>
                  </div>
                  <Button type="button" variant="ghost" onClick={handleReset}>
                    <X className="w-4 h-4 mr-1" />
                    重置条件
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
