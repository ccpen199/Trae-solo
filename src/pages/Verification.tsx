import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, XCircle, User, Tag, Clock, AlertTriangle, Store, Users, History, Zap, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: '未使用',
    partial: '部分使用',
    used: '已用完',
    refunded: '已退款',
    expired: '已过期',
  };
  return labels[status] || status;
}

function getStatusBadgeStyle(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    used: 'bg-gray-100 text-gray-700',
    refunded: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-700';
}

export default function Verification() {
  const [code, setCode] = useState('');
  const [storeId, setStoreId] = useState('1');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [packageDetail, setPackageDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [testCodes, setTestCodes] = useState<{ code: string; label: string }[]>([]);
  const freshCodeFetched = useRef(false);

  useEffect(() => {
    api.coupons.getStores().then(res => setStores(res.data));
    api.coupons.getServices().then(res => setServices(res.data));

    const initialCodes = [
      { code: 'CPN000012', label: '已退款' },
      { code: 'CPN000001', label: '已用完' },
    ];
    setTestCodes(initialCodes);

    if (!freshCodeFetched.current) {
      freshCodeFetched.current = true;
      api.coupons.getPackages().then(pkgRes => {
        const pkgs = pkgRes.data;
        if (pkgs.length > 0) {
          api.coupons.purchase({ package_id: pkgs[0].id, user_id: 1 }).then(purchaseRes => {
            const newCode = purchaseRes.data.code;
            setTestCodes([...initialCodes, { code: newCode, label: '可核销' }]);
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (storeId) {
      api.appointments.getStaff(parseInt(storeId)).then(res => setStaff(res.data));
    }
  }, [storeId]);

  async function handleSearch() {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setCoupon(null);
    setPackageDetail(null);
    setVerifyResult(null);

    try {
      const res = await api.coupons.getCoupon(code.trim());
      setCoupon(res.data);
      if (res.data.package_id) {
        try {
          const pkgRes = await api.coupons.getPackage(String(res.data.package_id));
          setPackageDetail(pkgRes.data);
        } catch {
          setPackageDetail(null);
        }
      }
    } catch (err: any) {
      setError(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestCodeClick(testCode: string) {
    setCode(testCode);
    setLoading(true);
    setError('');
    setCoupon(null);
    setPackageDetail(null);
    setVerifyResult(null);

    try {
      const res = await api.coupons.getCoupon(testCode);
      setCoupon(res.data);
      if (res.data.package_id) {
        try {
          const pkgRes = await api.coupons.getPackage(String(res.data.package_id));
          setPackageDetail(pkgRes.data);
        } catch {
          setPackageDetail(null);
        }
      }
    } catch (err: any) {
      setError(err.message || '查询失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!coupon || !coupon.can_verify) return;
    setLoading(true);

    try {
      const res = await api.verifications.verify({
        code: coupon.code,
        store_id: parseInt(storeId),
        service_id: serviceId ? parseInt(serviceId) : undefined,
        staff_id: staffId ? parseInt(staffId) : undefined,
      });
      setVerifyResult(res.data);
      const newRemaining = res.data.remaining_count;
      setCoupon({
        ...coupon,
        remaining_count: newRemaining,
        used_uses: coupon.total_count - newRemaining,
        status: newRemaining <= 0 ? 'used' : 'partial',
        can_verify: newRemaining > 0,
      });
      handleSearch();
    } catch (err: any) {
      setError(err.message || '核销失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">核销台</h1>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择门店</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务人员</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">消费项目</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择</option>
              {services
                .filter((s) => s.store_id === parseInt(storeId))
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - ¥{s.price}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">输入券码</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="请输入或扫描券码"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                <Search className="w-4 h-4" />
                查询券码
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {verifyResult && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            核销成功！剩余 {verifyResult.remaining_count}/{verifyResult.total_count} 次
            {verifyResult.is_completed && ' - 券已全部使用完毕'}
          </div>
        )}

        {coupon && (
          <div className="border rounded-lg overflow-hidden">
            <div className={`p-4 ${coupon.can_verify ? 'bg-green-50' : 'bg-red-50'} border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {coupon.can_verify ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${coupon.can_verify ? 'text-green-700' : 'text-red-700'}`}>
                    {coupon.can_verify ? '可以核销' : '不可核销'}
                  </span>
                </div>
                <Tag className="w-5 h-5 text-gray-500" />
              </div>
              {!coupon.can_verify && coupon.cannot_verify_reasons && (
                <div className="mt-2 space-y-1">
                  {coupon.cannot_verify_reasons.map((reason: string, i: number) => (
                    <div key={i} className="flex items-center gap-1 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      {reason}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">用户</p>
                    <p className="font-medium">{coupon.user_name}</p>
                    <p className="text-sm text-gray-500">{coupon.user_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">券码</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium">{coupon.code}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeStyle(coupon.status)}`}>
                        {getStatusLabel(coupon.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{coupon.package_name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">使用次数</p>
                    <p className="font-medium">
                      剩余 <span className="text-blue-600">{coupon.remaining_count}</span> / {coupon.total_count} 次
                    </p>
                    <p className="text-sm text-gray-500">有效期至 {new Date(coupon.expire_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Store className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">适用门店</p>
                    <p className="font-medium">
                      {coupon.applicable_stores?.map((s: any) => s.name).join('、') || '通用'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">服务内容: {coupon.service_content || '全部服务'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">成本价</p>
                    <p className="font-medium">¥{coupon.cost_price || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">结算规则</p>
                    <p className="font-medium">{packageDetail?.settlement_rule || coupon.settlement_rule || '未设置'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-500 mb-2">适用项目</p>
                <div className="flex flex-wrap gap-2">
                  {coupon.applicable_services?.filter((s: any) => s.store_id === parseInt(storeId)).map((s: any) => (
                    <span key={s.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {s.name} ¥{s.price}
                    </span>
                  ))}
                </div>
              </div>

              {coupon.verification_history?.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">核销历史</p>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {coupon.verification_history.map((h: any) => (
                      <div key={h.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium">{h.store_name}</span>
                            {h.service_name && (
                              <span className="text-blue-600">{h.service_name}</span>
                            )}
                            {h.staff_name && (
                              <span className="text-gray-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {h.staff_name}
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500">{new Date(h.verification_time).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {h.status === 'success' ? '核销成功' : h.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {coupon.can_verify && (
                <div className="pt-4 border-t space-y-2">
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>核销后将自动生成结算记录，门店可在结算管理中查看</span>
                    </div>
                  </div>
                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {loading ? '核销中...' : '确认核销'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!coupon && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-700 mb-2">请输入券码</p>
            <p className="text-sm text-gray-500 mb-6">输入或扫描团购券码，查询用户信息和券详情</p>
            <div className="flex flex-wrap justify-center gap-3">
              {testCodes.map((tc) => (
                <button
                  key={tc.code}
                  onClick={() => handleTestCodeClick(tc.code)}
                  className="px-4 py-2 border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-mono text-sm hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {tc.code}
                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                    tc.label === '可核销' ? 'bg-green-100 text-green-700' :
                    tc.label === '已退款' ? 'bg-red-100 text-red-700' :
                    tc.label === '已用完' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {tc.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <Link
            to="/merchant?tab=verifications"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
          >
            <History className="w-4 h-4" />
            核销记录
          </Link>
        </div>
      </div>
    </div>
  );
}
