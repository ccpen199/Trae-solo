import { useState, useEffect } from 'react';
import { Play, Square, Eye, Download, Search, RefreshCw, Filter, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { shiftsApi, mastersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Shift {
  id: number;
  shift_no: string;
  store_id: number;
  store_name: string;
  cashier_id: number;
  cashier_name: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  expected_cash: number;
  expected_qr: number;
  expected_bank_card: number;
  expected_stored_value: number;
  expected_coupon: number;
  actual_cash: number | null;
  actual_qr: number | null;
  actual_bank_card: number | null;
  actual_stored_value: number | null;
  actual_coupon: number | null;
  difference_cash: number | null;
  difference_qr: number | null;
  difference_bank_card: number | null;
  difference_stored_value: number | null;
  difference_coupon: number | null;
  total_expected: number;
  total_actual: number | null;
  total_difference: number | null;
  order_count: number;
  refund_count: number;
}

const statusMap: Record<string, { label: string; class: string }> = {
  open: { label: '进行中', class: 'bg-green-100 text-green-700' },
  closed: { label: '已结束', class: 'bg-gray-100 text-gray-700' }
};

const channelLabels: Record<string, string> = {
  cash: '现金',
  qr: '扫码支付',
  bank_card: '银行卡',
  stored_value: '储值卡',
  coupon: '优惠券'
};

export default function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const user = useAuthStore(state => state.user);
  const hasRole = useAuthStore(state => state.hasRole);
  const hasPermission = useAuthStore(state => state.hasPermission);

  const [filters, setFilters] = useState({
    store_id: '',
    cashier_id: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  const [closeForm, setCloseForm] = useState({
    actual_cash: '',
    actual_qr: '',
    actual_bank_card: '',
    actual_stored_value: '',
    actual_coupon: ''
  });

  useEffect(() => {
    loadData();
    loadCurrentShift();
    loadOptions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.store_id) params.store_id = filters.store_id;
      if (filters.cashier_id) params.cashier_id = filters.cashier_id;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      
      const res = await shiftsApi.getShifts(params);
      setShifts(res.data.list || res.data || []);
    } catch (error: any) {
      alert('加载交班记录失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentShift = async () => {
    try {
      const res = await shiftsApi.getCurrentShift();
      setCurrentShift(res.data || null);
    } catch (error) {
      setCurrentShift(null);
    }
  };

  const loadOptions = async () => {
    try {
      const [storesRes, cashiersRes] = await Promise.all([
        mastersApi.getStores(),
        mastersApi.getUsers({ role: 'cashier' })
      ]);
      setStores(storesRes.data.list || storesRes.data || []);
      setCashiers(cashiersRes.data.list || cashiersRes.data || []);
    } catch (error) {
      console.error('加载选项失败', error);
    }
  };

  const handleOpenShift = async () => {
    if (!confirm('确定要开始交班吗？')) return;
    try {
      await shiftsApi.openShift();
      alert('交班已开始');
      loadCurrentShift();
      loadData();
    } catch (error: any) {
      alert('开始交班失败: ' + error.message);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    
    const actuals = {
      actual_cash: parseFloat(closeForm.actual_cash) || 0,
      actual_qr: parseFloat(closeForm.actual_qr) || 0,
      actual_bank_card: parseFloat(closeForm.actual_bank_card) || 0,
      actual_stored_value: parseFloat(closeForm.actual_stored_value) || 0,
      actual_coupon: parseFloat(closeForm.actual_coupon) || 0
    };

    const totalActual = Object.values(actuals).reduce((sum, val) => sum + val, 0);
    const totalDiff = totalActual - currentShift.total_expected;

    if (Math.abs(totalDiff) > 0 && !confirm(`本次交班差额为 ${formatCurrency(totalDiff)}，确定要结束交班吗？`)) {
      return;
    }

    try {
      await shiftsApi.closeShift(currentShift.id, actuals);
      alert('交班已结束');
      setCloseModal(false);
      setCloseForm({
        actual_cash: '',
        actual_qr: '',
        actual_bank_card: '',
        actual_stored_value: '',
        actual_coupon: ''
      });
      loadCurrentShift();
      loadData();
    } catch (error: any) {
      alert('结束交班失败: ' + error.message);
    }
  };

  const viewDetail = async (shift: Shift) => {
    try {
      const res = await shiftsApi.getShift(shift.id);
      setSelectedShift(res.data);
      setDetailModal(true);
    } catch (error: any) {
      alert('加载交班详情失败: ' + error.message);
    }
  };

  const exportShift = async (shift: Shift) => {
    try {
      const res = await shiftsApi.exportShift(shift.id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `交班单_${shift.shift_no}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('导出失败: ' + error.message);
    }
  };

  const openCloseModal = () => {
    if (!currentShift) return;
    setCloseForm({
      actual_cash: currentShift.expected_cash.toString(),
      actual_qr: currentShift.expected_qr.toString(),
      actual_bank_card: currentShift.expected_bank_card.toString(),
      actual_stored_value: currentShift.expected_stored_value.toString(),
      actual_coupon: currentShift.expected_coupon.toString()
    });
    setCloseModal(true);
  };

  const calculateDiff = (expected: number, actualStr: string) => {
    const actual = parseFloat(actualStr) || 0;
    return actual - expected;
  };

  const getTotalActual = () => {
    return Object.values(closeForm).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const getTotalDiff = () => {
    if (!currentShift) return 0;
    return getTotalActual() - currentShift.total_expected;
  };

  const getDiffClass = (diff: number) => {
    if (diff === 0) return 'text-green-600';
    if (diff > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">交班管理</h1>
        <div className="flex gap-3">
          {!currentShift && hasPermission('shift:create') && (
            <button
              onClick={handleOpenShift}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              开始交班
            </button>
          )}
          {currentShift && hasPermission('shift:close') && (
            <button
              onClick={openCloseModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              结束交班
            </button>
          )}
        </div>
      </div>

      {currentShift && (
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded-full text-sm">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
                  交班进行中
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">交班号：{currentShift.shift_no}</h3>
              <p className="text-white/80">
                门店：{currentShift.store_name} | 收银员：{currentShift.cashier_name} | 
                开始时间：{formatDateTime(currentShift.opened_at)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(currentShift.total_expected)}</div>
              <p className="text-white/80 mt-1">
                订单 {currentShift.order_count} 笔 | 退款 {currentShift.refund_count} 笔
              </p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 mt-6">
            {(['cash', 'qr', 'bank_card', 'stored_value', 'coupon'] as const).map(channel => (
              <div key={channel} className="bg-white/10 rounded-lg p-3">
                <div className="text-white/70 text-sm">{channelLabels[channel]}</div>
                <div className="text-xl font-bold mt-1">
                  {formatCurrency(currentShift[`expected_${channel}` as keyof Shift] as number)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">门店</label>
            <select
              value={filters.store_id}
              onChange={e => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部门店</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">收银员</label>
            <select
              value={filters.cashier_id}
              onChange={e => setFilters(prev => ({ ...prev, cashier_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>{c.real_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="open">进行中</option>
              <option value="closed">已结束</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              setFilters({ store_id: '', cashier_id: '', status: '', start_date: '', end_date: '' });
              loadData();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            查询
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">交班号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">门店</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">收银员</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">应收总额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">实收总额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">差额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
              ) : shifts.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">暂无交班记录</td></tr>
              ) : (
                shifts.map(shift => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-mono text-gray-900">{shift.shift_no}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{shift.store_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{shift.cashier_name}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(shift.total_expected)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {shift.total_actual !== null ? formatCurrency(shift.total_actual) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      {shift.total_difference !== null ? (
                        <span className={`text-sm font-medium ${getDiffClass(shift.total_difference)}`}>
                          {shift.total_difference > 0 ? '+' : ''}{formatCurrency(shift.total_difference)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[shift.status]?.class}`}>
                        {statusMap[shift.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {shift.closed_at ? formatDateTime(shift.closed_at) : formatDateTime(shift.opened_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetail(shift)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {shift.status === 'closed' && (
                          <button
                            onClick={() => exportShift(shift)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="导出"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailModal && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">交班详情</h3>
              {selectedShift.status === 'closed' && (
                <button
                  onClick={() => exportShift(selectedShift)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">交班号</label>
                  <p className="mt-1 font-mono text-gray-900">{selectedShift.shift_no}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">门店</label>
                  <p className="mt-1 text-gray-900">{selectedShift.store_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">收银员</label>
                  <p className="mt-1 text-gray-900">{selectedShift.cashier_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">状态</label>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${statusMap[selectedShift.status]?.class}`}>
                    {statusMap[selectedShift.status]?.label}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">开始时间</label>
                  <p className="mt-1 text-gray-900">{formatDateTime(selectedShift.opened_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">结束时间</label>
                  <p className="mt-1 text-gray-900">{selectedShift.closed_at ? formatDateTime(selectedShift.closed_at) : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">订单数</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{selectedShift.order_count}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 font-medium">退款数</div>
                  <div className="text-2xl font-bold text-red-700 mt-1">{selectedShift.refund_count}</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">支付方式</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">应收金额</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">实收金额</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">差额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(['cash', 'qr', 'bank_card', 'stored_value', 'coupon'] as const).map(channel => {
                      const expected = selectedShift[`expected_${channel}` as keyof Shift] as number;
                      const actual = selectedShift[`actual_${channel}` as keyof Shift] as number | null;
                      const diff = selectedShift[`difference_${channel}` as keyof Shift] as number | null;
                      return (
                        <tr key={channel}>
                          <td className="px-4 py-3 text-sm text-gray-900">{channelLabels[channel]}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(expected)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {actual !== null ? formatCurrency(actual) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {diff !== null ? (
                              <span className={`font-medium ${getDiffClass(diff)}`}>
                                {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">合计</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(selectedShift.total_expected)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {selectedShift.total_actual !== null ? formatCurrency(selectedShift.total_actual) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {selectedShift.total_difference !== null ? (
                          <span className={`font-medium ${getDiffClass(selectedShift.total_difference)}`}>
                            {selectedShift.total_difference > 0 ? '+' : ''}{formatCurrency(selectedShift.total_difference)}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedShift.total_difference !== null && Math.abs(selectedShift.total_difference) > 0 && (
                <div className={`flex items-start gap-2 p-4 rounded-lg ${
                  selectedShift.total_difference > 0 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {selectedShift.total_difference > 0 ? (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${selectedShift.total_difference > 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      {selectedShift.total_difference > 0 ? '长款' : '短款'}
                    </p>
                    <p className={`text-xs mt-0.5 ${selectedShift.total_difference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      差额：{selectedShift.total_difference > 0 ? '+' : ''}{formatCurrency(selectedShift.total_difference)}，
                      {selectedShift.total_difference > 0 ? '请确认是否多收' : '请查找原因并补足'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setDetailModal(false);
                  setSelectedShift(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {closeModal && currentShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">结束交班</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">请仔细核对实收金额</p>
                  <p className="text-xs text-yellow-700 mt-0.5">请清点实际收到的现金、核对各支付渠道的收款记录，准确录入实收金额</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['cash', 'qr', 'bank_card', 'stored_value', 'coupon'] as const).map(channel => {
                  const expected = currentShift[`expected_${channel}` as keyof Shift] as number;
                  const actualStr = closeForm[`actual_${channel}` as keyof typeof closeForm];
                  const diff = calculateDiff(expected, actualStr);
                  return (
                    <div key={channel} className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-600">
                        {channelLabels[channel]} 应收：<span className="text-gray-900">{formatCurrency(expected)}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={actualStr}
                          onChange={e => setCloseForm(prev => ({ ...prev, [`actual_${channel}`]: e.target.value }))}
                          placeholder={`输入${channelLabels[channel]}实收金额`}
                          className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium ${getDiffClass(diff)}`}>
                          {diff !== 0 ? (diff > 0 ? '+' : '') + formatCurrency(diff) : '平'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-500">应收总额</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(currentShift.total_expected)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">实收总额</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(getTotalActual())}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">差额</div>
                    <div className={`text-xl font-bold mt-1 ${getDiffClass(getTotalDiff())}`}>
                      {getTotalDiff() > 0 ? '+' : ''}{formatCurrency(getTotalDiff())}
                    </div>
                  </div>
                </div>
              </div>

              {Math.abs(getTotalDiff()) > 0 && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  getTotalDiff() > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {getTotalDiff() > 0 ? (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${getTotalDiff() > 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      {getTotalDiff() > 0 ? '长款警告' : '短款警告'}
                    </p>
                    <p className={`text-xs mt-0.5 ${getTotalDiff() > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      本次{getTotalDiff() > 0 ? '多收' : '少收'}：{formatCurrency(Math.abs(getTotalDiff()))}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setCloseModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleCloseShift}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                确认结束交班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
