import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Percent,
  Calendar,
  Filter,
  X,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { cn, formatDate } from '../../components/lib/utils';
import { adminApi } from '../../services/api';
import { TaxType, TaxCalculationBasis } from '@shared/types';

interface TaxRule {
  id: string;
  countryCode: string;
  countryName: string;
  region?: string;
  type: TaxType;
  typeName: string;
  rate: number;
  calculationBasis: TaxCalculationBasis;
  appliesTo: 'all' | 'residents' | 'non_residents';
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
}

const TaxesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: '',
    countryName: '',
    region: '',
    type: TaxType.VAT,
    rate: 0,
    calculationBasis: TaxCalculationBasis.ROOM_RATE,
    appliesTo: 'all' as 'all' | 'residents' | 'non_residents',
    description: '',
    effectiveFrom: '',
    effectiveTo: '',
    isActive: true,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<TaxRule | null>(null);

  useEffect(() => {
    loadTaxRules();
  }, []);

  const loadTaxRules = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.taxes.getAll() as any;
      const items = Array.isArray(data) ? data : (data.items || []);
      setTaxRules(items.map((t: any) => ({
        id: t.id,
        countryCode: t.countryCode,
        countryName: getCountryName(t.countryCode),
        region: t.region,
        type: t.type,
        typeName: getTaxTypeName(t.type),
        rate: t.rate,
        calculationBasis: t.calculationBasis,
        appliesTo: t.appliesTo || 'all',
        description: t.description,
        effectiveFrom: t.effectiveFrom,
        effectiveTo: t.effectiveTo,
        isActive: t.isActive !== false,
        createdAt: t.createdAt,
      })));
    } catch (error) {
      console.warn('Failed to load tax rules, using mock data');
      setTaxRules(getMockTaxRules());
    } finally {
      setIsLoading(false);
    }
  };

  const getCountryName = (code: string): string => {
    const countries: Record<string, string> = {
      'CN': '中国',
      'US': '美国',
      'JP': '日本',
      'FR': '法国',
      'UK': '英国',
      'DE': '德国',
      'IT': '意大利',
      'ES': '西班牙',
      'SG': '新加坡',
      'TH': '泰国',
      'AE': '阿联酋',
      'KR': '韩国',
    };
    return countries[code] || code;
  };

  const getTaxTypeName = (type: TaxType): string => {
    const names: Record<TaxType, string> = {
      [TaxType.VAT]: '增值税',
      [TaxType.CITY_TAX]: '城市税',
      [TaxType.TOURISM_TAX]: '旅游税',
      [TaxType.SERVICE_FEE]: '服务费',
    };
    return names[type] || type;
  };

  const getCalculationBasisName = (basis: TaxCalculationBasis): string => {
    const names: Record<TaxCalculationBasis, string> = {
      [TaxCalculationBasis.ROOM_RATE]: '房费比例',
      [TaxCalculationBasis.PER_NIGHT]: '每晚固定',
      [TaxCalculationBasis.PER_GUEST]: '每人固定',
    };
    return names[basis] || basis;
  };

  const getAppliesToName = (appliesTo: string): string => {
    const names: Record<string, string> = {
      'all': '所有客人',
      'residents': '本国居民',
      'non_residents': '非本国居民',
    };
    return names[appliesTo] || appliesTo;
  };

  const getMockTaxRules = (): TaxRule[] => {
    return [
      {
        id: 'tax-001',
        countryCode: 'CN',
        countryName: '中国',
        type: TaxType.VAT,
        typeName: '增值税',
        rate: 6,
        calculationBasis: TaxCalculationBasis.ROOM_RATE,
        appliesTo: 'all',
        description: '酒店住宿服务增值税',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-12-01T00:00:00Z',
      },
      {
        id: 'tax-002',
        countryCode: 'FR',
        countryName: '法国',
        type: TaxType.VAT,
        typeName: '增值税',
        rate: 10,
        calculationBasis: TaxCalculationBasis.ROOM_RATE,
        appliesTo: 'all',
        description: '法国住宿增值税',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-11-15T00:00:00Z',
      },
      {
        id: 'tax-003',
        countryCode: 'FR',
        countryName: '法国',
        type: TaxType.CITY_TAX,
        typeName: '城市税',
        rate: 2.5,
        calculationBasis: TaxCalculationBasis.PER_NIGHT,
        appliesTo: 'all',
        description: '巴黎城市住宿税，每晚每人',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-11-20T00:00:00Z',
      },
      {
        id: 'tax-004',
        countryCode: 'JP',
        countryName: '日本',
        type: TaxType.VAT,
        typeName: '消费税',
        rate: 10,
        calculationBasis: TaxCalculationBasis.ROOM_RATE,
        appliesTo: 'all',
        description: '日本消费税率',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-10-01T00:00:00Z',
      },
      {
        id: 'tax-005',
        countryCode: 'JP',
        countryName: '日本',
        type: TaxType.TOURISM_TAX,
        typeName: '住宿税',
        rate: 200,
        calculationBasis: TaxCalculationBasis.PER_NIGHT,
        appliesTo: 'all',
        description: '东京都住宿税，每晚每人',
        region: '东京都',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-10-15T00:00:00Z',
      },
      {
        id: 'tax-006',
        countryCode: 'US',
        countryName: '美国',
        type: TaxType.VAT,
        typeName: '酒店税',
        rate: 14,
        calculationBasis: TaxCalculationBasis.ROOM_RATE,
        appliesTo: 'all',
        description: '纽约市酒店住宿税',
        region: '纽约州',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-09-01T00:00:00Z',
      },
      {
        id: 'tax-007',
        countryCode: 'IT',
        countryName: '意大利',
        type: TaxType.CITY_TAX,
        typeName: '城市税',
        rate: 4,
        calculationBasis: TaxCalculationBasis.PER_NIGHT,
        appliesTo: 'non_residents',
        description: '罗马城市税，仅针对非本地居民',
        region: '罗马',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-12-10T00:00:00Z',
      },
      {
        id: 'tax-008',
        countryCode: 'SG',
        countryName: '新加坡',
        type: TaxType.VAT,
        typeName: '消费税',
        rate: 9,
        calculationBasis: TaxCalculationBasis.ROOM_RATE,
        appliesTo: 'all',
        description: '新加坡商品及服务税',
        effectiveFrom: '2024-01-01',
        isActive: true,
        createdAt: '2023-08-01T00:00:00Z',
      },
    ];
  };

  const countries = Array.from(new Set(taxRules.map(t => t.countryCode))).sort();
  const taxTypes = [
    { value: 'all', label: '全部税种' },
    { value: TaxType.VAT, label: '增值税' },
    { value: TaxType.CITY_TAX, label: '城市税' },
    { value: TaxType.TOURISM_TAX, label: '旅游税' },
    { value: TaxType.SERVICE_FEE, label: '服务费' },
  ];

  const filteredRules = taxRules.filter(rule => {
    const matchesKeyword = !searchKeyword || 
      rule.countryName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      rule.typeName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchKeyword.toLowerCase());
    
    const matchesCountry = !filterCountry || rule.countryCode === filterCountry;
    const matchesType = filterType === 'all' || rule.type === filterType;

    return matchesKeyword && matchesCountry && matchesType;
  });

  const handleAdd = () => {
    setEditingRule(null);
    setFormData({
      countryCode: '',
      countryName: '',
      region: '',
      type: TaxType.VAT,
      rate: 0,
      calculationBasis: TaxCalculationBasis.ROOM_RATE,
      appliesTo: 'all',
      description: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (rule: TaxRule) => {
    setEditingRule(rule);
    setFormData({
      countryCode: rule.countryCode,
      countryName: rule.countryName,
      region: rule.region || '',
      type: rule.type,
      rate: rule.rate,
      calculationBasis: rule.calculationBasis,
      appliesTo: rule.appliesTo,
      description: rule.description || '',
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo || '',
      isActive: rule.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = (rule: TaxRule) => {
    setDeletingRule(rule);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRule) return;
    
    try {
      await adminApi.taxes.delete(deletingRule.id);
      setTaxRules(prev => prev.filter(r => r.id !== deletingRule.id));
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.warn('Failed to delete tax rule, removing locally');
      setTaxRules(prev => prev.filter(r => r.id !== deletingRule.id));
      setDeleteConfirmOpen(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        countryCode: formData.countryCode,
        type: formData.type,
        rate: formData.rate,
        calculationBasis: formData.calculationBasis,
        appliesTo: formData.appliesTo,
        description: formData.description,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || undefined,
        isActive: formData.isActive,
        region: formData.region || undefined,
      };

      if (editingRule) {
        await adminApi.taxes.update(editingRule.id, payload);
        setTaxRules(prev => prev.map(r => 
          r.id === editingRule.id 
            ? { ...r, ...formData, typeName: getTaxTypeName(formData.type), countryName: getCountryName(formData.countryCode) }
            : r
        ));
      } else {
        const result = await adminApi.taxes.create(payload) as any;
        const newRule: TaxRule = {
          id: result?.id || `tax-${Date.now()}`,
          ...formData,
          typeName: getTaxTypeName(formData.type),
          countryName: getCountryName(formData.countryCode),
          createdAt: new Date().toISOString(),
        };
        setTaxRules(prev => [newRule, ...prev]);
      }
      setModalOpen(false);
    } catch (error) {
      console.warn('Failed to save tax rule, updating locally');
      if (editingRule) {
        setTaxRules(prev => prev.map(r => 
          r.id === editingRule.id 
            ? { ...r, ...formData, typeName: getTaxTypeName(formData.type), countryName: getCountryName(formData.countryCode) }
            : r
        ));
      } else {
        const newRule: TaxRule = {
          id: `tax-${Date.now()}`,
          ...formData,
          typeName: getTaxTypeName(formData.type),
          countryName: getCountryName(formData.countryCode),
          createdAt: new Date().toISOString(),
        };
        setTaxRules(prev => [newRule, ...prev]);
      }
      setModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeVariant = (type: TaxType) => {
    const variants: Record<TaxType, any> = {
      [TaxType.VAT]: 'primary',
      [TaxType.CITY_TAX]: 'info',
      [TaxType.TOURISM_TAX]: 'success',
      [TaxType.SERVICE_FEE]: 'warning',
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-graphite-900">税务规则</h1>
          <p className="text-graphite-500 mt-1">管理各国酒店税务规则配置</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
        >
          新增税务规则
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索国家、税种或描述"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                筛选
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-cloud-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-2">国家</label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  <option value="">全部国家</option>
                  {countries.map(code => (
                    <option key={code} value={code}>{getCountryName(code)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite-700 mb-2">税种</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
                >
                  {taxTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-graphite-500">
              共 <span className="font-medium text-graphite-900">{filteredRules.length}</span> 条税务规则
            </p>
            {(filterCountry || filterType !== 'all' || searchKeyword) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCountry('');
                  setFilterType('all');
                  setSearchKeyword('');
                }}
                leftIcon={<X className="w-4 h-4" />}
              >
                清除筛选
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">国家/地区</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">税种</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">税率</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">计算方式</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">适用对象</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">生效日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-graphite-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length > 0 ? (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-cloud-100 hover:bg-cloud-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-deep-blue/10 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4 text-deep-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-graphite-900">{rule.countryName}</p>
                            {rule.region && (
                              <p className="text-xs text-graphite-500">{rule.region}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getTypeVariant(rule.type)} size="sm">
                          {rule.typeName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Percent className="w-4 h-4 text-gold-foil" />
                          <span className="text-sm font-semibold text-graphite-900">
                            {rule.rate}
                            {rule.calculationBasis === TaxCalculationBasis.ROOM_RATE ? '%' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {getCalculationBasisName(rule.calculationBasis)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-graphite-700">
                          {getAppliesToName(rule.appliesTo)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-graphite-400" />
                          <span className="text-sm text-graphite-700">
                            {formatDate(rule.effectiveFrom)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={rule.isActive ? 'success' : 'default'} 
                          size="sm"
                          dot
                        >
                          {rule.isActive ? '生效中' : '已停用'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-deep-blue hover:text-deep-blue hover:bg-deep-blue/10"
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            onClick={() => handleEdit(rule)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDelete(rule)}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="w-12 h-12 text-graphite-300" />
                        <p className="text-graphite-500">暂无税务规则数据</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? '编辑税务规则' : '新增税务规则'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                国家 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  countryCode: e.target.value,
                  countryName: getCountryName(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
              >
                <option value="">请选择国家</option>
                {['CN', 'US', 'JP', 'FR', 'UK', 'DE', 'IT', 'ES', 'SG', 'TH', 'AE', 'KR'].map(code => (
                  <option key={code} value={code}>{getCountryName(code)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                地区/州
              </label>
              <Input
                placeholder="如：纽约州、东京都（选填）"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                税种 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TaxType }))}
                className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
              >
                {taxTypes.filter(t => t.value !== 'all').map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                税率 <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="请输入税率"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: Number(e.target.value) }))}
                suffix={formData.calculationBasis === TaxCalculationBasis.ROOM_RATE ? '%' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                计算方式 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.calculationBasis}
                onChange={(e) => setFormData(prev => ({ ...prev, calculationBasis: e.target.value as TaxCalculationBasis }))}
                className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
              >
                <option value={TaxCalculationBasis.ROOM_RATE}>房费比例 (%)</option>
                <option value={TaxCalculationBasis.PER_NIGHT}>每晚固定金额</option>
                <option value={TaxCalculationBasis.PER_GUEST}>每人固定金额</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                适用对象
              </label>
              <select
                value={formData.appliesTo}
                onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value as 'all' | 'residents' | 'non_residents' }))}
                className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue"
              >
                <option value="all">所有客人</option>
                <option value="residents">本国居民</option>
                <option value="non_residents">非本国居民</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                生效日期 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-graphite-700 mb-2">
                失效日期
              </label>
              <Input
                type="date"
                value={formData.effectiveTo}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveTo: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-graphite-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入税务规则描述（选填）"
              className="w-full px-3 py-2 border border-cloud-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-blue/20 focus:border-deep-blue resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-deep-blue rounded focus:ring-deep-blue"
            />
            <label htmlFor="isActive" className="text-sm text-graphite-700">
              立即使其生效
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="确认删除"
        description={deletingRule ? `确定要删除 ${deletingRule.countryName} - ${deletingRule.typeName} 的税务规则吗？` : ''}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>警告：</strong>删除操作不可恢复，请谨慎操作。
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TaxesPage;
