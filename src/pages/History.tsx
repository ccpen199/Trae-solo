import { useState, useEffect } from 'react';
import { FileText, Clock, Eye } from 'lucide-react';
import { api } from '@/lib/api';

export default function HistoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.getCalculationHistory();
      setRecords(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordDetail = async (id: number) => {
    try {
      const data = await api.getCalculation(id);
      setSelectedRecord(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return `${value.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">计算历史</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">目的国</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">完税价格</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">总税费</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">计算时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">加载中...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">暂无记录</td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => loadRecordDetail(record.id)}>
                      <td className="py-3 px-4 font-medium">{record.order_id}</td>
                      <td className="py-3 px-4 text-sm">{record.country_code}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(record.total_customs_value, record.currency)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-red-600">{formatCurrency(record.total_tax, record.currency)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{new Date(record.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          onClick={(e) => { e.stopPropagation(); loadRecordDetail(record.id); }}>
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1">
          {selectedRecord ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                计算详情
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">订单号</div>
                    <div className="font-medium">{selectedRecord.order_id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">目的国</div>
                    <div className="font-medium">{selectedRecord.country_code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">货币</div>
                    <div className="font-medium">{selectedRecord.currency}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">汇率</div>
                    <div className="font-medium">{selectedRecord.exchange_rate}</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium mb-3">费用明细</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">商品小计</span>
                      <span>{formatCurrency(selectedRecord.subtotal, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">折扣</span>
                      <span className="text-green-600">-{formatCurrency(selectedRecord.discount, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">运费</span>
                      <span>{formatCurrency(selectedRecord.shipping_fee, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">保险费</span>
                      <span>{formatCurrency(selectedRecord.insurance_fee, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-500">完税价格</span>
                      <span className="font-medium">{formatCurrency(selectedRecord.total_customs_value, selectedRecord.currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium mb-3">税费明细</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">关税</span>
                      <span className="text-orange-600">{formatCurrency(selectedRecord.duty_amount, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">增值税</span>
                      <span className="text-blue-600">{formatCurrency(selectedRecord.vat_amount, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">消费税</span>
                      <span>{formatCurrency(selectedRecord.excise_amount || 0, selectedRecord.currency)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-medium">总税费</span>
                      <span className="font-bold text-red-600">{formatCurrency(selectedRecord.total_tax, selectedRecord.currency)}</span>
                    </div>
                  </div>
                </div>

                {selectedRecord.items && selectedRecord.items.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-3">商品明细</h3>
                    <div className="space-y-2 text-sm">
                      {selectedRecord.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            HS: {item.hs_code} | 数量: {item.quantity} | 单价: {item.unit_price}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={16} />
                  计算时间: {new Date(selectedRecord.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              <FileText className="mx-auto mb-4 text-gray-300" size={48} />
              <p>点击左侧记录查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
