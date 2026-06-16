import { useState, useEffect } from 'react';
import {
  Camera,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Search,
  Car,
  CreditCard,
  FileText,
  X,
  Loader2,
  Info,
  DollarSign,
} from 'lucide-react';
import { api } from '@/api/client';
import type { TrafficViolation } from '../../../shared/types';
import { cn } from '@/lib/utils';

export default function Violation() {
  const [violations, setViolations] = useState<TrafficViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [plateNumber, setPlateNumber] = useState('桂A12345');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedViolation, setSelectedViolation] = useState<TrafficViolation | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [payingViolation, setPayingViolation] = useState<TrafficViolation | null>(null);
  const [paySuccess, setPaySuccess] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    loadViolations();
  }, [plateNumber]);

  const loadViolations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.transportation.getViolations(plateNumber);
      setViolations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('Failed to load violations:', e);
      setError(e.message || '加载违章记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (violation: TrafficViolation) => {
    setPayingViolation(violation);
    setShowPayConfirm(true);
  };

  const confirmPay = async () => {
    if (!payingViolation) return;
    setPaying(true);
    try {
      await api.transportation.payViolation(payingViolation.id);
      setShowPayConfirm(false);
      setPaySuccess({ show: true, message: '缴费成功！违章已处理完毕' });
      loadViolations();
      if (selectedViolation?.id === payingViolation.id) {
        setSelectedViolation({ ...payingViolation, status: 'paid' });
      }
      setTimeout(() => setPaySuccess({ show: false, message: '' }), 3000);
    } catch (e: any) {
      console.error('Payment failed:', e);
      setPaySuccess({ show: true, message: e.message || '缴费失败，请稍后重试' });
    } finally {
      setPaying(false);
      setPayingViolation(null);
    }
  };

  const handlePayAll = async () => {
    const unpaid = violations.filter(v => v.status === 'unpaid');
    setPaying(true);
    let successCount = 0;
    let failCount = 0;
    for (const v of unpaid) {
      try {
        await api.transportation.payViolation(v.id);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setPaying(false);
    loadViolations();
    setPaySuccess({
      show: true,
      message: failCount > 0
        ? `处理完成：成功${successCount}项，失败${failCount}项`
        : `全部处理成功！共${successCount}项违章已缴费`
    });
    setTimeout(() => setPaySuccess({ show: false, message: '' }), 3000);
  };

  const openDetail = (violation: TrafficViolation) => {
    setSelectedViolation(violation);
    setShowDetailModal(true);
  };

  const filteredViolations = violations.filter(v => {
    if (filter === 'unpaid') return v.status === 'unpaid';
    if (filter === 'paid') return v.status === 'paid';
    return true;
  });

  const totalUnpaidAmount = violations
    .filter(v => v.status === 'unpaid')
    .reduce((sum, v) => sum + v.fine, 0);

  const totalUnpaidPoints = violations
    .filter(v => v.status === 'unpaid')
    .reduce((sum, v) => sum + v.points, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return { text: '待处理', color: 'bg-red-100 text-red-600' };
      case 'paid':
        return { text: '已缴费', color: 'bg-eco-100 text-eco-600' };
      case 'appealing':
        return { text: '申诉中', color: 'bg-warm-100 text-warm-600' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">违章查询处理</h1>
          <p className="text-gray-500 mt-1">查询交通违章记录，在线处理缴费</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">加载失败</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={loadViolations}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            重试
          </button>
        </div>
      )}

      {paySuccess.show && (
        <div className={cn(
          'rounded-2xl p-4 flex items-start gap-3 transition-all',
          paySuccess.message.includes('成功')
            ? 'bg-eco-50 border border-eco-200'
            : 'bg-warm-50 border border-warm-200'
        )}>
          <CheckCircle className={cn(
            'w-5 h-5 flex-shrink-0 mt-0.5',
            paySuccess.message.includes('成功') ? 'text-eco-500' : 'text-warm-500'
          )} />
          <p className={cn(
            'font-medium',
            paySuccess.message.includes('成功') ? 'text-eco-700' : 'text-warm-700'
          )}>
            {paySuccess.message}
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">车牌号</label>
            <div className="relative">
              <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="请输入车牌号"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-mono"
              />
            </div>
          </div>
          <button
            onClick={loadViolations}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            查询违章
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-red-600">{violations.filter(v => v.status === 'unpaid').length}</span>
          </div>
          <p className="text-gray-800 font-medium">待处理违章</p>
          <p className="text-sm text-gray-500 mt-1">需及时处理</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-warm-600">¥{totalUnpaidAmount}</span>
          </div>
          <p className="text-gray-800 font-medium">待缴罚款</p>
          <p className="text-sm text-gray-500 mt-1">累计金额</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-purple-600">{totalUnpaidPoints}</span>
          </div>
          <p className="text-gray-800 font-medium">待记扣分</p>
          <p className="text-sm text-gray-500 mt-1">累计记分</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">违章记录</h3>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: '全部' },
              { key: 'unpaid', label: '待处理' },
              { key: 'paid', label: '已处理' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-all',
                  filter === tab.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">正在查询违章记录...</p>
            </div>
          ) : filteredViolations.length > 0 ? (
            filteredViolations.map((violation, index) => {
              const statusBadge = getStatusBadge(violation.status);
              return (
                <div
                  key={violation.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openDetail(violation)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        violation.status === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-eco-100 text-eco-600'
                      )}>
                        {violation.status === 'unpaid' ? (
                          <AlertTriangle className="w-6 h-6" />
                        ) : (
                          <CheckCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{violation.violationType}</h4>
                          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusBadge.color)}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {violation.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {violation.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Camera className="w-4 h-4" />
                            {violation.plateNumber}
                          </span>
                        </div>
                        {violation.description && (
                          <p className="text-sm text-gray-400 mt-2 line-clamp-1">{violation.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">¥{violation.fine}</p>
                      <p className="text-sm text-gray-500 mt-1">扣 {violation.points} 分</p>
                      {violation.status === 'unpaid' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePay(violation);
                          }}
                          disabled={paying}
                          className="mt-3 px-4 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {paying ? '处理中...' : '立即处理'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-eco-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无违章记录</h3>
              <p className="text-gray-500">继续保持良好驾驶习惯</p>
            </div>
          )}
        </div>

        {violations.filter(v => v.status === 'unpaid').length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">共 {violations.filter(v => v.status === 'unpaid').length} 项待处理违章</span>
                <span className="text-gray-500 mx-2">·</span>
                <span className="text-gray-600">合计罚款 <span className="text-red-600 font-bold text-xl">¥{totalUnpaidAmount}</span></span>
              </div>
              <button
                onClick={handlePayAll}
                disabled={paying}
                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                {paying ? '处理中...' : '一键处理全部'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && selectedViolation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">违章详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  selectedViolation.status === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-eco-100 text-eco-600'
                )}>
                  {selectedViolation.status === 'unpaid' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <CheckCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{selectedViolation.violationType}</h4>
                  <span className={cn('inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium', getStatusBadge(selectedViolation.status).color)}>
                    {getStatusBadge(selectedViolation.status).text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">罚款金额</p>
                  <p className="text-xl font-bold text-red-600">¥{selectedViolation.fine}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">记分数目</p>
                  <p className="text-xl font-bold text-warm-600">{selectedViolation.points} 分</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">车牌号码</p>
                    <p className="font-medium text-gray-800 font-mono">{selectedViolation.plateNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">违章地点</p>
                    <p className="font-medium text-gray-800">{selectedViolation.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">违章时间</p>
                    <p className="font-medium text-gray-800">{selectedViolation.time}</p>
                  </div>
                </div>
                {selectedViolation.cameraLocation && (
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">采集设备</p>
                      <p className="font-medium text-gray-800">{selectedViolation.cameraLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedViolation.description && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">违章描述</p>
                      <p className="text-sm text-blue-600 mt-1">{selectedViolation.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedViolation.status === 'unpaid' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handlePay(selectedViolation);
                    }}
                    disabled={paying}
                    className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    在线缴费 ¥{selectedViolation.fine}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayConfirm && payingViolation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full animate-fade-in">
            <div className="p-6">
              <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-warm-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">确认缴费</h3>
              <p className="text-gray-500 text-center mb-6">
                您即将缴纳 <span className="text-red-600 font-bold">¥{payingViolation.fine}</span> 罚款
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">违章类型</span>
                  <span className="text-gray-800 font-medium">{payingViolation.violationType}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">车牌号码</span>
                  <span className="text-gray-800 font-mono">{payingViolation.plateNumber}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">违章地点</span>
                  <span className="text-gray-800">{payingViolation.location}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">扣分</span>
                  <span className="text-warm-600 font-medium">{payingViolation.points} 分</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-700 font-medium">应缴金额</span>
                  <span className="text-red-600 font-bold text-lg">¥{payingViolation.fine}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPayConfirm(false);
                    setPayingViolation(null);
                  }}
                  disabled={paying}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={confirmPay}
                  disabled={paying}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paying ? '处理中...' : '确认缴费'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
