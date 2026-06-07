import React, { useState } from 'react';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import type { Fee } from '@/types';

const mockFees: Fee[] = [
  { id: 1, type: '物业费', amount: 258.00, dueDate: '2024-01-31', status: 'unpaid', description: '2024年1月份物业管理费' },
  { id: 2, type: '物业费', amount: 258.00, dueDate: '2023-12-31', paidDate: '2023-12-28', status: 'paid', description: '2023年12月份物业管理费' },
  { id: 3, type: '物业费', amount: 258.00, dueDate: '2023-11-30', paidDate: '2023-11-25', status: 'paid', description: '2023年11月份物业管理费' },
  { id: 4, type: '停车费', amount: 150.00, dueDate: '2024-01-15', paidDate: '2024-01-10', status: 'paid', description: '2024年1月份地面停车费' },
  { id: 5, type: '停车费', amount: 300.00, dueDate: '2024-02-01', status: 'unpaid', description: '2024年2月份地下车库停车费' },
  { id: 6, type: '水费', amount: 45.80, dueDate: '2024-01-20', status: 'unpaid', description: '2023年12月水费' },
  { id: 7, type: '电费', amount: 128.50, dueDate: '2024-01-20', status: 'overdue', description: '2023年12月电费' },
  { id: 8, type: '燃气费', amount: 68.20, dueDate: '2023-12-25', paidDate: '2023-12-20', status: 'paid', description: '2023年12月燃气费' },
];

const statusConfig = {
  unpaid: { label: '待缴费', icon: Clock, bg: 'bg-accent-yellow-100', text: 'text-accent-yellow-700' },
  paid: { label: '已缴费', icon: CheckCircle, bg: 'bg-accent-green-100', text: 'text-accent-green-700' },
  overdue: { label: '已逾期', icon: AlertTriangle, bg: 'bg-red-100', text: 'text-red-700' },
};

const FeeCenter: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredFees = mockFees.filter((fee) => filter === 'all' || fee.status === filter);
  const unpaidFees = mockFees.filter((f) => f.status === 'unpaid' || f.status === 'overdue');
  const totalUnpaid = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0);

  const handlePay = (fee: Fee) => {
    setPayingFee(fee);
    setShowPayModal(true);
  };

  const confirmPay = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert('缴费成功！');
    setProcessing(false);
    setShowPayModal(false);
    setPayingFee(null);
  };

  const handleBatchPay = () => {
    setShowPayModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">费用中心</h1>
          <p className="text-gray-500 mt-1">查看和缴纳各项费用</p>
        </div>
        <button className="btn-outline flex items-center gap-2">
          <Download className="w-5 h-5" />
          下载账单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center gradient-primary text-white">
          <CreditCard className="w-8 h-8 mx-auto mb-2" />
          <p className="text-3xl font-bold">¥{totalUnpaid.toFixed(2)}</p>
          <p className="text-sm text-white/80">待缴金额</p>
          {unpaidFees.length > 0 && (
            <button
              onClick={handleBatchPay}
              className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              一键缴费
            </button>
          )}
        </div>
        <div className="card text-center">
          <Receipt className="w-8 h-8 text-accent-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{unpaidFees.filter((f) => f.status === 'unpaid').length}</p>
          <p className="text-sm text-gray-500">待缴费</p>
        </div>
        <div className="card text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{unpaidFees.filter((f) => f.status === 'overdue').length}</p>
          <p className="text-sm text-gray-500">已逾期</p>
        </div>
        <div className="card text-center">
          <CheckCircle className="w-8 h-8 text-accent-green-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900">{mockFees.filter((f) => f.status === 'paid').length}</p>
          <p className="text-sm text-gray-500">已完成</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 font-serif">账单列表</h3>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'unpaid', label: '待缴费' },
              { value: 'paid', label: '已缴费' },
              { value: 'overdue', label: '已逾期' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.value
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">费用类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">描述</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">截止日期</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.map((fee) => {
                const status = statusConfig[fee.status];
                return (
                  <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">{fee.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{fee.description}</td>
                    <td className="py-4 px-4">
                      <span className="text-lg font-semibold text-gray-900">¥{fee.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {fee.dueDate}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${status.bg} ${status.text} flex items-center gap-1 w-fit`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {fee.status !== 'paid' && (
                        <button
                          onClick={() => handlePay(fee)}
                          className="btn-primary text-sm flex items-center gap-1 ml-auto"
                        >
                          立即缴费
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                      {fee.status === 'paid' && (
                        <button className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto">
                          <Download className="w-4 h-4" />
                          收据
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredFees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无符合条件的账单
          </div>
        )}
      </div>

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 font-serif">确认缴费</h3>
            </div>
            <div className="p-6">
              {payingFee ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">费用类型</span>
                    <span className="font-medium">{payingFee.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">费用描述</span>
                    <span className="font-medium">{payingFee.description}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-gray-100 pt-4">
                    <span className="font-medium">应缴金额</span>
                    <span className="font-bold text-primary-600">¥{payingFee.amount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">您有 {unpaidFees.length} 笔待缴费用</p>
                  <div className="space-y-2">
                    {unpaidFees.map((fee) => (
                      <div key={fee.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">{fee.type}</span>
                        <span>¥{fee.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-lg border-t border-gray-100 pt-4">
                    <span className="font-medium">合计金额</span>
                    <span className="font-bold text-primary-600">¥{totalUnpaid.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={confirmPay}
                  disabled={processing}
                  className="flex-1 btn-primary py-2.5 disabled:opacity-50"
                >
                  {processing ? '处理中...' : '确认支付'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCenter;
