import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  DollarSign,
  Home,
  Building2,
  Percent,
  Info,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { calculatorApi } from '../../utils/api';
import { formatPrice, formatPercent } from '../../utils/format';
import type { TaxParams, TaxResult, TaxBreakdown } from '@shared/types';

const COLORS = ['#1E40AF', '#3B82F6', '#F97316', '#10B981', '#6366F1'];

export default function TaxCalculator() {
  const [searchParams] = useSearchParams();
  const priceParam = searchParams.get('price');
  const areaParam = searchParams.get('area');

  const [params, setParams] = useState<TaxParams>({
    propertyType: 'secondhand',
    totalPrice: priceParam ? Number(priceParam) : 2000000,
    area: areaParam ? Number(areaParam) : 90,
    isFirstHouse: true,
    isFiveYears: true,
    isOnlyOne: true,
    originalPrice: 1500000,
  });

  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      try {
        const response = await calculatorApi.calculateTax(params);
        if (response.success && response.data) {
          setResult(response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    calculate();
  }, [params]);

  const pieData = result
    ? [
        { name: '契税', value: result.deedTax },
        { name: '个人所得税', value: result.incomeTax },
        { name: '增值税', value: result.valueAddedTax },
        { name: '印花税', value: result.stampDuty },
        { name: '中介费', value: result.agencyFee },
      ].filter((item) => item.value > 0)
    : [];

  const InputRow = ({
    label,
    unit,
    children,
  }: {
    label: string;
    unit?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <label className="w-28 text-gray-600 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-3">
        {children}
        {unit && <span className="text-gray-400 w-12">{unit}</span>}
      </div>
    </div>
  );

  const ToggleButton = ({
    value,
    onChange,
    options,
  }: {
    value: boolean;
    onChange: (value: boolean) => void;
    options: { label: string; value: boolean }[];
  }) => (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            value === option.value
              ? 'bg-primary-50 text-primary-600 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 mb-4">
            <FileText className="w-8 h-8 text-secondary-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">税费估算器</h1>
          <p className="text-gray-500">快速计算购房所需缴纳的各项税费</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-secondary-600" />
                房屋信息
              </h2>

              <div className="space-y-1">
                <InputRow label="房屋类型" unit="">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setParams({ ...params, propertyType: 'secondhand' })}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        params.propertyType === 'secondhand'
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      二手房
                    </button>
                    <button
                      onClick={() => setParams({ ...params, propertyType: 'new' })}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                        params.propertyType === 'new'
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      新房
                    </button>
                  </div>
                </InputRow>

                <InputRow label="房屋总价" unit="万元">
                  <input
                    type="number"
                    value={params.totalPrice / 10000}
                    onChange={(e) =>
                      setParams({ ...params, totalPrice: Number(e.target.value) * 10000 })
                    }
                    className="input-base"
                    min="1"
                    step="1"
                  />
                </InputRow>

                <InputRow label="建筑面积" unit="㎡">
                  <input
                    type="number"
                    value={params.area}
                    onChange={(e) => setParams({ ...params, area: Number(e.target.value) })}
                    className="input-base"
                    min="1"
                    step="0.1"
                  />
                </InputRow>

                {params.propertyType === 'secondhand' && (
                  <InputRow label="原购房价格" unit="万元">
                    <input
                      type="number"
                      value={params.originalPrice ? params.originalPrice / 10000 : ''}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          originalPrice: Number(e.target.value) * 10000,
                        })
                      }
                      className="input-base"
                      min="0"
                      step="1"
                      placeholder="用于计算个税差额"
                    />
                  </InputRow>
                )}

                <InputRow label="是否首套" unit="">
                  <ToggleButton
                    value={params.isFirstHouse}
                    onChange={(v) => setParams({ ...params, isFirstHouse: v })}
                    options={[
                      { label: '是', value: true },
                      { label: '否', value: false },
                    ]}
                  />
                </InputRow>

                {params.propertyType === 'secondhand' && (
                  <>
                    <InputRow label="满五年" unit="">
                      <ToggleButton
                        value={params.isFiveYears}
                        onChange={(v) => setParams({ ...params, isFiveYears: v })}
                        options={[
                          { label: '是', value: true },
                          { label: '否', value: false },
                        ]}
                      />
                    </InputRow>

                    <InputRow label="唯一住房" unit="">
                      <ToggleButton
                        value={params.isOnlyOne}
                        onChange={(v) => setParams({ ...params, isOnlyOne: v })}
                        options={[
                          { label: '是', value: true },
                          { label: '否', value: false },
                        ]}
                      />
                    </InputRow>
                  </>
                )}
              </div>
            </div>

            {/* Tax Tips */}
            <div className="card p-6 mt-6 bg-secondary-50/50">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-secondary-600" />
                税费说明
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                  契税：首套房90㎡以下1%，90㎡以上1.5%；二套房3%
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                  个税：满五唯一免征，否则按1%或差额20%征收
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                  增值税：满2年免征，不满2年按5.3%征收
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                  中介费：通常为房价的1-3%，具体可协商
                </li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Total Amount */}
            <div className="card p-6 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">预计税费总额</h3>
                <DollarSign className="w-8 h-8 text-secondary-200" />
              </div>
              <div className="text-5xl font-bold mb-2">
                {loading ? '--' : formatPrice(result?.total || 0)}
              </div>
              <div className="text-secondary-100">
                房屋总价：{formatPrice(params.totalPrice)}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="card p-4">
                <div className="text-sm text-gray-500 mb-1">契税</div>
                <div className="text-xl font-bold text-primary-600">
                  {loading ? '--' : formatPrice(result?.deedTax || 0)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-500 mb-1">个人所得税</div>
                <div className="text-xl font-bold text-blue-500">
                  {loading ? '--' : formatPrice(result?.incomeTax || 0)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-500 mb-1">增值税</div>
                <div className="text-xl font-bold text-secondary-500">
                  {loading ? '--' : formatPrice(result?.valueAddedTax || 0)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-500 mb-1">印花税</div>
                <div className="text-xl font-bold text-green-500">
                  {loading ? '--' : formatPrice(result?.stampDuty || 0)}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-gray-500 mb-1">中介费</div>
                <div className="text-xl font-bold text-purple-500">
                  {loading ? '--' : formatPrice(result?.agencyFee || 0)}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">税费构成</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${formatPercent(percent * 100, 0)}`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown List */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">费用明细</h3>
                {result && (
                  <div className="space-y-1">
                    {result.breakdown.map((item: TaxBreakdown, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-400">税率：{item.rate}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatPrice(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preferential Policy */}
            {params.propertyType === 'secondhand' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  可享受的优惠政策
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {params.isFiveYears && params.isOnlyOne && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                        <Check className="w-4 h-4" />
                        满五唯一
                      </div>
                      <div className="text-sm text-green-600">
                        免征个人所得税，节省约
                        {formatPrice(params.totalPrice * 0.01)}
                      </div>
                    </div>
                  )}
                  {params.isFiveYears && (
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                        <Check className="w-4 h-4" />
                        满两年
                      </div>
                      <div className="text-sm text-green-600">
                        免征增值税及附加，节省约
                        {formatPrice(params.totalPrice * 0.053)}
                      </div>
                    </div>
                  )}
                  {params.isFirstHouse && params.area <= 90 && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                        <Check className="w-4 h-4" />
                        首套房≤90㎡
                      </div>
                      <div className="text-sm text-blue-600">
                        契税按1%征收，比二套房节省
                        {formatPrice(params.totalPrice * 0.02)}
                      </div>
                    </div>
                  )}
                  {params.isFirstHouse && params.area > 90 && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                        <Check className="w-4 h-4" />
                        首套房&gt;90㎡
                      </div>
                      <div className="text-sm text-blue-600">
                        契税按1.5%征收，比二套房节省
                        {formatPrice(params.totalPrice * 0.015)}
                      </div>
                    </div>
                  )}
                  {!params.isFiveYears && !params.isOnlyOne && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 md:col-span-2">
                      <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                        <Percent className="w-4 h-4" />
                        暂无优惠
                      </div>
                      <div className="text-sm text-yellow-600">
                        建议等待满五唯一后再交易，可节省约
                        {formatPrice(params.totalPrice * 0.063)}的税费
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">购房款项明细</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">房屋总价</span>
                  <span className="font-semibold">{formatPrice(params.totalPrice)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">税费总额</span>
                  <span className="font-semibold text-secondary-600">
                    {formatPrice(result?.total || 0)}
                  </span>
                </div>
                {params.propertyType === 'secondhand' && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">中介费（预估2%）</span>
                    <span className="font-semibold">
                      {formatPrice(params.totalPrice * 0.02)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg">预计总支出</span>
                    <span className="font-bold text-2xl text-primary-600">
                      {formatPrice(
                        params.totalPrice + (result?.total || 0) +
                          (params.propertyType === 'secondhand' ? params.totalPrice * 0.02 : 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
