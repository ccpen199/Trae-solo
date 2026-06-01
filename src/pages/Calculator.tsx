import { useState } from 'react';
import { Plus, Trash2, Calculator as CalcIcon, Download, FileText } from 'lucide-react';
import { api, CalculationInput, CalculationResult } from '@/lib/api';

interface OrderItem {
  lineNumber: number;
  productName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export default function CalculatorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState('');

  const [orderId, setOrderId] = useState(`ORD-${Date.now()}`);
  const [countryCode, setCountryCode] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [shippingFee, setShippingFee] = useState(0);
  const [insuranceFee, setInsuranceFee] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([
    { lineNumber: 1, productName: '', hsCode: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const addItem = () => {
    setItems([...items, {
      lineNumber: items.length + 1,
      productName: '',
      hsCode: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems.map((item, i) => ({ ...item, lineNumber: i + 1 })));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    try {
      const input: CalculationInput = {
        orderId,
        countryCode,
        currency,
        exchangeRate,
        shippingFee,
        insuranceFee,
        items: items.map(item => ({
          lineNumber: item.lineNumber,
          productName: item.productName,
          hsCode: item.hsCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      };
      const data = await api.calculate(input);
      setResult(data as any);
    } catch (err: any) {
      setError(err.message || '计算失败');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/batch/template';
    link.download = 'tax_calculation_template.xlsx';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">税费计算</h1>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download size={18} />
          下载模板
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">订单信息</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">订单号</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目的国</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="US">美国 (US)</option>
              <option value="EU">欧盟 (EU)</option>
              <option value="UK">英国 (UK)</option>
              <option value="JP">日本 (JP)</option>
              <option value="AU">澳大利亚 (AU)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">货币</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">美元 (USD)</option>
              <option value="EUR">欧元 (EUR)</option>
              <option value="GBP">英镑 (GBP)</option>
              <option value="JPY">日元 (JPY)</option>
              <option value="CNY">人民币 (CNY)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">汇率</label>
            <input
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">运费</label>
            <input
              type="number"
              step="0.01"
              value={shippingFee}
              onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">保险费</label>
            <input
              type="number"
              step="0.01"
              value={insuranceFee}
              onChange={(e) => setInsuranceFee(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">商品明细</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            添加商品
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-14">行号</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 min-w-[150px]">商品名称</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-32">HS编码</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-24">数量</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-28">单价</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-28">折扣</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-gray-600 w-16">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-sm text-gray-900">{item.lineNumber}</td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(index, 'productName', e.target.value)}
                      className="w-full min-w-[120px] px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="商品名称"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={item.hsCode}
                      onChange={(e) => updateItem(index, 'hsCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="HS编码"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
      >
        <CalcIcon size={20} />
        {loading ? '计算中...' : '开始计算'}
      </button>

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">计算结果</h2>
          
          {result.warnings && result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              {result.warnings.map((warning, i) => (
              <div key={i}>• {warning}</div>
            ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">完税价格</div>
              <div className="text-2xl font-bold text-gray-900">
                {result.totalCustomsValue.toFixed(2)} {result.currency}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">关税</div>
              <div className="text-2xl font-bold text-orange-600">
                {result.dutyAmount.toFixed(2)} {result.currency}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">增值税</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.vatAmount.toFixed(2)} {result.currency}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">总税费</div>
              <div className="text-2xl font-bold text-red-600">
                {result.totalTax.toFixed(2)} {result.currency}
              </div>
            </div>
          </div>

          <h3 className="font-medium mb-3">商品税费明细</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3">商品</th>
                  <th className="text-left py-2 px-3">HS编码</th>
                  <th className="text-right py-2 px-3">完税价格</th>
                  <th className="text-right py-2 px-3">关税率</th>
                  <th className="text-right py-2 px-3">关税</th>
                  <th className="text-right py-2 px-3">增值税率</th>
                  <th className="text-right py-2 px-3">增值税</th>
                  <th className="text-left py-2 px-3">计算依据</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-3">{item.productName}</td>
                    <td className="py-2 px-3 font-mono">{item.hsCode}</td>
                    <td className="py-2 px-3 text-right">{item.customsValue.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">{(item.dutyRate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right">{item.dutyAmount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">{(item.vatRate * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right">{item.vatAmount.toFixed(2)}</td>
                    <td className="py-2 px-3 text-xs text-gray-500 max-w-xs truncate" title={item.calculationDetails}>
                      {item.calculationDetails}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <FileText size={18} />
              计算审计记录
            </h3>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
              {result.calculationDetails}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
