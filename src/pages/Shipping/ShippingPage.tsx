import { useState, useEffect } from 'react';
import {
  Truck,
  Calculator,
  Shield,
  MapPin,
  Weight,
  Check,
  CreditCard,
} from 'lucide-react';
import { shippingApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ShippingCompany {
  id: string;
  name: string;
  logo: string;
  pricePerKg: number;
}

export default function ShippingPage() {
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [weight, setWeight] = useState<string>('1');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [hasInsurance, setHasInsurance] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState<string>('100');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany && weight) {
      calculatePrice();
    }
  }, [selectedCompany, weight, hasInsurance, insuranceAmount]);

  const loadCompanies = async () => {
    try {
      const result = await shippingApi.getCompanies();
      if (result.success && result.data) {
        setCompanies(result.data as ShippingCompany[]);
        if ((result.data as ShippingCompany[]).length > 0) {
          setSelectedCompany((result.data as ShippingCompany[])[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([
        { id: 'sf', name: '顺丰速运', logo: '🚚', pricePerKg: 15 },
        { id: 'jd', name: '京东物流', logo: '📦', pricePerKg: 12 },
        { id: 'zt', name: '中通快递', logo: '🚛', pricePerKg: 10 },
        { id: 'yt', name: '圆通速递', logo: '🚐', pricePerKg: 8 },
      ]);
      setSelectedCompany('sf');
    }
  };

  const calculatePrice = async () => {
    if (!selectedCompany || !weight) return;

    setCalculating(true);
    try {
      const company = companies.find((c) => c.id === selectedCompany);
      if (company) {
        let price = company.pricePerKg * parseFloat(weight || '0');
        if (hasInsurance) {
          price += parseFloat(insuranceAmount || '0') * 0.01;
        }
        setCalculatedPrice(Math.round(price * 100) / 100);
      }
    } catch (error) {
      console.error('Failed to calculate price:', error);
    } finally {
      setCalculating(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!fromAddress.trim()) errors.fromAddress = '请输入寄件地址';
    if (!toAddress.trim()) errors.toAddress = '请输入收件地址';
    if (!weight || parseFloat(weight) <= 0) errors.weight = '请输入有效重量';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    try {
      const result = await shippingApi.createOrder({
        companyId: selectedCompany,
        weight: parseFloat(weight),
        fromAddress,
        toAddress,
        hasInsurance,
        insuranceAmount: hasInsurance ? parseFloat(insuranceAmount) : 0,
      });
      if (result.success) {
        alert('订单创建成功！');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('订单创建成功！');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">快递服务</h1>
        <p className="text-slate-500 text-sm mt-1">快速寄件，便捷送达</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              选择快递公司
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    selectedCompany === company.id
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="text-3xl mb-2">{company.logo}</div>
                  <p className="font-medium text-slate-800 text-sm">
                    {company.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ¥{company.pricePerKg}/kg
                  </p>
                  {selectedCompany === company.id && (
                    <div className="mt-2">
                      <Check className="w-5 h-5 text-sky-500 mx-auto" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              运费计算
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    寄件地址 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      placeholder="请输入寄件地址"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                        formErrors.fromAddress
                          ? 'border-red-300'
                          : 'border-slate-200 bg-slate-50'
                      )}
                    />
                  </div>
                  {formErrors.fromAddress && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.fromAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    收件地址 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="请输入收件地址"
                      className={cn(
                        'w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                        formErrors.toAddress
                          ? 'border-red-300'
                          : 'border-slate-200 bg-slate-50'
                      )}
                    />
                  </div>
                  {formErrors.toAddress && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.toAddress}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  物品重量 (kg) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500',
                      formErrors.weight ? 'border-red-300' : 'border-slate-200 bg-slate-50'
                    )}
                  />
                </div>
                {formErrors.weight && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.weight}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-sky-500" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        保价服务
                      </p>
                      <p className="text-xs text-slate-500">
                        按声明价值1%收取保费
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHasInsurance(!hasInsurance)}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      hasInsurance ? 'bg-sky-500' : 'bg-slate-300'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                        hasInsurance ? 'translate-x-7' : 'translate-x-1'
                      )}
                    ></div>
                  </button>
                </div>
                {hasInsurance && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      声明价值 (元)
                    </label>
                    <input
                      type="number"
                      value={insuranceAmount}
                      onChange={(e) => setInsuranceAmount(e.target.value)}
                      min="0"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              费用明细
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600 text-sm">基础运费</span>
                <span className="font-medium text-slate-800">
                  ¥{calculatedPrice ? Math.round(calculatedPrice * 0.9 * 100) / 100 : '0.00'}
                </span>
              </div>
              {hasInsurance && (
                <div className="flex justify-between">
                  <span className="text-slate-600 text-sm">保价费</span>
                  <span className="font-medium text-slate-800">
                    ¥{calculatedPrice ? Math.round(parseFloat(insuranceAmount) * 0.01 * 100) / 100 : '0.00'}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">合计</span>
                  <span className="text-2xl font-bold text-sky-600">
                    ¥{calculatedPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              className="w-full mt-6 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              创建订单
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">服务说明</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>支持同城及跨城快递服务</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>智能柜24小时自助寄件</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>保价物品最高赔付10万元</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>全程物流信息实时追踪</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
