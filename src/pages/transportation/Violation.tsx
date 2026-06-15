import { useState, useEffect } from 'react';
import { Camera, Clock, MapPin, AlertTriangle, CheckCircle, Search, Car, CreditCard, FileText } from 'lucide-react';
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

  useEffect(() => {
    loadViolations();
  }, [plateNumber]);

  const loadViolations = async () => {
    setLoading(true);
    try {
      const data = await api.transportation.getViolations(plateNumber);
      setViolations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load violations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (violation: TrafficViolation) => {
    setPaying(true);
    try {
      await api.transportation.payViolation(violation.id);
      loadViolations();
      setSelectedViolation(null);
    } catch (e) {
      console.error('Payment failed:', e);
    } finally {
      setPaying(false);
    }
  };

  const handlePayAll = async () => {
    const unpaid = violations.filter(v => v.status === 'unpaid');
    for (const v of unpaid) {
      await handlePay(v);
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">违章查询处理</h1>
          <p className="text-gray-500 mt-1">查询交通违章记录，在线处理缴费</p>
        </div>
      </div>

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
            <Search className="w-4 h-4" />
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
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">正在查询违章记录...</p>
            </div>
          ) : filteredViolations.length > 0 ? (
            filteredViolations.map((violation, index) => (
              <div
                key={violation.id}
                className={cn(
                  'p-6 hover:bg-gray-50 transition-colors',
                  selectedViolation?.id === violation.id && 'bg-primary-50'
                )}
                onClick={() => setSelectedViolation(violation)}
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
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium',
                          violation.status === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-eco-100 text-eco-600'
                        )}>
                          {violation.status === 'unpaid' ? '待处理' : violation.status === 'paid' ? '已缴费' : '申诉中'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
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
            ))
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
                className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all disabled:opacity-50"
              >
                {paying ? '处理中...' : '一键处理全部'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
