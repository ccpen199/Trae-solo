import { useMemo, useState, type ReactNode } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Select,
  type TableProps,
  type TablePaginationConfig,
} from 'antd';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableFilterField {
  key: string;
  label: string;
  type: 'select' | 'input';
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  width?: number;
}

export interface DataTableSearchField {
  key: string;
  label: string;
}

interface DataTableProps<T extends object> extends TableProps<T> {
  searchFields?: DataTableSearchField[];
  filterFields?: DataTableFilterField[];
  showSearch?: boolean;
  showFilter?: boolean;
  showRefresh?: boolean;
  searchPlaceholder?: string;
  onSearch?: (keyword: string, field?: string) => void;
  onFilter?: (filters: Record<string, string | number | undefined>) => void;
  onRefresh?: () => void;
  extraTools?: ReactNode;
  toolbarClassName?: string;
  totalLabel?: string;
}

export default function DataTable<T extends object>({
  searchFields,
  filterFields,
  showSearch = true,
  showFilter = true,
  showRefresh = true,
  searchPlaceholder = '搜索...',
  onSearch,
  onFilter,
  onRefresh,
  extraTools,
  toolbarClassName,
  totalLabel = '共',
  className,
  columns,
  dataSource,
  pagination,
  rowKey = 'id',
  scroll,
  ...restProps
}: DataTableProps<T>) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchField, setSearchField] = useState<string | undefined>(
    searchFields?.[0]?.key
  );
  const [filterValues, setFilterValues] = useState<Record<string, string | number | undefined>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const hasActiveFilters = useMemo(
    () => Object.values(filterValues).some((v) => v !== undefined && v !== ''),
    [filterValues]
  );

  const handleSearch = () => {
    onSearch?.(searchKeyword, searchField);
  };

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
    if (!value) {
      onSearch?.('', searchField);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    onSearch?.('', searchField);
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);
    onFilter?.(newFilters);
  };

  const handleClearFilters = () => {
    const cleared: Record<string, string | number | undefined> = {};
    Object.keys(filterValues).forEach((k) => {
      cleared[k] = undefined;
    });
    setFilterValues(cleared);
    onFilter?.(cleared);
  };

  const paginationConfig: TablePaginationConfig | false = useMemo(() => {
    if (pagination === false) return false;
    return {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => (
        <span className="text-sm text-slate-500">
          {totalLabel} <span className="font-medium text-slate-700">{total}</span> 条
        </span>
      ),
      pageSizeOptions: ['10', '20', '50', '100'],
      ...(typeof pagination === 'object' ? pagination : {}),
    };
  }, [pagination, totalLabel]);

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4',
          toolbarClassName
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {showSearch && (
            <>
              {searchFields && searchFields.length > 1 && (
                <Select
                  value={searchField}
                  onChange={setSearchField}
                  options={searchFields.map((f) => ({
                    label: f.label,
                    value: f.key,
                  }))}
                  style={{ width: 120 }}
                  allowClear={false}
                />
              )}
              <Input
                allowClear
                prefix={<Search className="h-4 w-4 text-slate-400" />}
                placeholder={searchPlaceholder}
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 240 }}
              />
              {searchKeyword && (
                <Button
                  type="text"
                  icon={<X className="h-4 w-4" />}
                  onClick={handleClearSearch}
                  size="small"
                />
              )}
            </>
          )}

          {showFilter && filterFields && filterFields.length > 0 && (
            <Button
              type={showFilterPanel || hasActiveFilters ? 'primary' : 'default'}
              icon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              筛选
              {hasActiveFilters && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-xs">
                  {Object.values(filterValues).filter((v) => v !== undefined && v !== '').length}
                </span>
              )}
            </Button>
          )}

          {showRefresh && (
            <Button
              type="default"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={onRefresh}
            >
              刷新
            </Button>
          )}
        </div>

        <Space>{extraTools}</Space>
      </div>

      {showFilterPanel && filterFields && filterFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/50 p-4">
          {filterFields.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <span className="text-sm text-slate-600">{field.label}:</span>
              {field.type === 'select' ? (
                <Select
                  allowClear
                  placeholder={field.placeholder || '全部'}
                  value={filterValues[field.key]}
                  onChange={(v) => handleFilterChange(field.key, v)}
                  options={field.options}
                  style={{ width: field.width || 160 }}
                />
              ) : (
                <Input
                  allowClear
                  placeholder={field.placeholder || '请输入'}
                  value={filterValues[field.key] as string}
                  onChange={(e) => handleFilterChange(field.key, e.target.value)}
                  style={{ width: field.width || 160 }}
                />
              )}
            </div>
          ))}
          {hasActiveFilters && (
            <Button type="link" onClick={handleClearFilters} size="small">
              清除筛选
            </Button>
          )}
        </div>
      )}

      <Table<T>
        rowKey={rowKey as string}
        columns={columns}
        dataSource={dataSource}
        pagination={paginationConfig}
        scroll={scroll || { x: 'max-content' }}
        {...restProps}
      />
    </div>
  );
}
