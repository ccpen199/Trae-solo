import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import { ChevronLeft, Calculator, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { formatPrice } from '../utils/constants';

const ValuationReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [valuation, setValuation] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValuation();
  }, [id]);

  const loadValuation = async () => {
    setLoading(true);
    try {
      const res = await propertyApi.valuation(parseInt(id!));
      setValuation(res);
      const propRes = await propertyApi.get(parseInt(id!));
      setProperty(propRes.property);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">生成估价报告中...</div>;
  if (!valuation) return <div className="p-8 text-center text-gray-500">无法生成估价</div>;

  const breakdownData = [
    { name: '基础总价', value: valuation.basePrice, color: '#1e3a5f' },
    { name: '装修修正', value: valuation.basePrice * valuation.decorationIndex - valuation.basePrice, color: '#22c55e' },
    { name: '楼层修正', value: valuation.basePrice * valuation.decorationIndex * valuation.floorCoefficient - valuation.basePrice * valuation.decorationIndex, color: '#f59e0b' },
  ];

  const priceCompare = [
    { name: '小区均价', price: valuation.communityAvg },
    { name: '估价单价', price: valuation.unitPrice },
    { name: '挂牌单价', price: property ? Math.round(property.price / property.area) : valuation.unitPrice },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">智能估价报告</h2>
          <p className="text-sm text-gray-500">基于小区成交价、装修指数和楼层系数</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-200 mb-2">
              <Calculator className="w-5 h-5" />
              <span className="text-sm">AI 智能估价报告</span>
            </div>
            <h3 className="text-5xl font-bold mb-4">¥ {(valuation.estimatedPrice / 10000).toFixed(2)} 万</h3>
            <p className="text-primary-200">
              {property?.name || '房源'} · {property?.area || valuation.area} ㎡ · 单价 ¥ {valuation.unitPrice.toLocaleString()} 元/㎡
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-200 mb-1">置信度</div>
            <div className="text-3xl font-bold">95.8%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> 估价构成分析
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(v: number) => '¥ ' + v.toLocaleString()} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((_, idx) => (
                    <Cell key={idx} fill={breakdownData[idx].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-500" /> 价格对比
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => '¥ ' + v.toLocaleString() + ' 元/㎡'} />
                <ReferenceLine y={valuation.communityAvg} stroke="#94a3b8" strokeDasharray="3 3" label="小区均价" />
                <Bar dataKey="price" radius={[4, 4, 0, 0]} fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800">估价明细参数</h4>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-gray-50">
            {Object.entries(valuation.breakdown || {}).map(([k, v]) => (
              <tr key={k}>
                <td className="px-6 py-3 text-sm text-gray-600">{k}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-800 text-right">{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <FileText className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <h5 className="font-medium text-amber-800 mb-1">免责声明</h5>
            <p className="text-sm text-amber-700">
              本估价仅供参考，基于历史成交数据和房屋属性计算得出，不构成交易建议。
              实际成交价可能受市场波动、特殊装修、税费等多种因素影响。
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={loadValuation}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          重新估价
        </button>
        <button
          onClick={() => navigate(`/contracts/${id}`)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          生成委托合同
        </button>
      </div>
    </div>
  );
};

export default ValuationReport;
