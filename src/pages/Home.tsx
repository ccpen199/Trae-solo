import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Package, Calendar, RefreshCw, BarChart3, Ticket, ShoppingCart, ArrowRight, AlertTriangle, FileText, Scissors, Users, Clock, CheckCircle, XCircle, Search, Store, ChevronRight, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

function formatRefundType(type: string) {
  const map: Record<string, string> = {
    unused: '未使用全额退款',
    partial: '部分使用按比例退款',
    expired: '过期50%退款',
    platform: '平台补偿全额退款',
    full: '未使用全额退款',
    platform_compensation: '平台补偿全额退款',
  };
  return map[type] || type;
}

function formatSettlementRule(rule: string) {
  if (!rule) return '未设置';
  if (rule.includes('%') || rule.includes('：') || rule.includes('，')) return rule;
  const map: Record<string, string> = {
    daily: '按日结算',
    weekly: '按周结算',
    monthly: '按月结算',
  };
  return map[rule] || rule;
}

function parseCommissionRate(rule: string) {
  if (!rule) return null;
  const match = rule.match(/(\d+)%/);
  if (match) return parseInt(match[1]);
  if (rule.includes('平台10%')) return 10;
  if (rule.includes('平台15%')) return 15;
  if (rule.includes('平台20%')) return 20;
  return null;
}

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [refundsMap, setRefundsMap] = useState<Record<number, any>>({});
  const [settlementsMap, setSettlementsMap] = useState<Record<number, any[]>>({});
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);

  const [storeId, setStoreId] = useState<string>('1');
  const [code, setCode] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [couponDetail, setCouponDetail] = useState<any>(null);
  const [queryError, setQueryError] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [testCoupons, setTestCoupons] = useState<any[]>([]);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (storeId) {
      api.appointments.getStaff(parseInt(storeId)).then(res => setStaff(res.data || [])).catch(() => {});
    }
  }, [storeId]);

  async function loadAllData() {
    try {
      const [dashboard, myCoupons, pkgRes, refundRes, storeRes, svcRes, verifyRes, settleRes] = await Promise.all([
        api.merchant.getDashboard(),
        api.coupons.getMyCoupons(1),
        api.coupons.getPackages(),
        api.refunds.list(),
        api.coupons.getStores(),
        api.coupons.getServices(),
        api.merchant.getVerifications({ limit: 5 }),
        api.merchant.getSettlements({ limit: 10 }),
      ]);
      setStats(dashboard.data);
      setStores(storeRes.data || []);
      setServices(svcRes.data || []);

      const activeCoupons = (myCoupons.data || []).filter((c: any) => c.status === 'active').slice(0, 3);
      const usedCoupons = (myCoupons.data || []).filter((c: any) => c.status !== 'active').slice(0, 2);
      setTestCoupons([...activeCoupons, ...usedCoupons]);

      const rMap: Record<number, any> = {};
      if (refundRes.data) {
        refundRes.data.forEach((r: any) => {
          rMap[r.coupon_id] = r;
        });
      }
      setRefundsMap(rMap);

      const sMap: Record<number, any[]> = {};
      if (settleRes.data?.list) {
        settleRes.data.list.forEach((s: any) => {
          if (!sMap[s.coupon_id]) sMap[s.coupon_id] = [];
          sMap[s.coupon_id].push(s);
        });
      }
      setSettlementsMap(sMap);

      const allCoupons = [...(myCoupons.data || [])];
      allCoupons.forEach((c: any) => {
        if (sMap[c.id]) {
          c.settlements = sMap[c.id];
          c.total_settled = sMap[c.id].reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
        }
      });
      setCoupons(allCoupons.slice(0, 8));

      const packagesData = (pkgRes.data || []).map((p: any) => ({
        ...p,
        applicable_stores_formatted: p.applicable_stores?.map((s: any) => s.name || s).join('、') || '',
        settlement_rule_formatted: formatSettlementRule(p.settlement_rule),
        commission_rate: parseCommissionRate(p.settlement_rule),
      }));
      setPackages(packagesData);

      setRecentVerifications(verifyRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function handleQuery() {
    if (!code.trim()) {
      setQueryError('请输入券码');
      return;
    }
    setQueryLoading(true);
    setQueryError('');
    setCouponDetail(null);
    setVerifyResult(null);
    try {
      const res = await api.coupons.getCoupon(code.trim());
      setCouponDetail(res.data);
      if (res.data.applicable_services) {
        const svcIds = res.data.applicable_services.map((s: any) => s.id);
        setSelectedService(svcIds[0]?.toString() || '');
      }
    } catch (err: any) {
      setQueryError(err.message || '查询失败');
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleVerify() {
    if (!couponDetail || !selectedService || !selectedStaff) {
      alert('请选择服务项目和服务人员');
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await api.verifications.verify({
        code: couponDetail.code,
        store_id: parseInt(storeId),
        staff_id: parseInt(selectedStaff),
        service_id: parseInt(selectedService),
      });
      setVerifyResult(res.data);
      const freshDetail = await api.coupons.getCoupon(code);
      setCouponDetail(freshDetail.data);
      loadAllData();
    } catch (err: any) {
      alert(err.message || '核销失败');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handlePurchase(packageId: number) {
    setPurchaseLoading(packageId);
    try {
      await api.coupons.purchase({ package_id: packageId, user_id: 1 });
      loadAllData();
    } catch (err: any) {
      alert(err.message || '购买失败');
    } finally {
      setPurchaseLoading(null);
    }
  }

  function fillAndQuery(c: string) {
    setCode(c);
    setTimeout(() => handleQuery(), 50);
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    used: 'bg-gray-100 text-gray-700',
    refunded: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
  };

  const statusLabels: Record<string, string> = {
    active: '未使用',
    partial: '部分使用',
    used: '已用完',
    refunded: '已退款',
    expired: '已过期',
  };

  const quickActions = [
    { path: '/verification', label: '券码核销', icon: QrCode, color: 'bg-green-500' },
    { path: '/packages', label: '券包管理', icon: Package, color: 'bg-blue-500' },
    { path: '/appointments', label: '预约管理', icon: Calendar, color: 'bg-purple-500' },
    { path: '/refunds', label: '退款处理', icon: RefreshCw, color: 'bg-orange-500' },
    { path: '/merchant', label: '商家后台', icon: BarChart3, color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">快捷操作</h2>
        <div className="grid grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="flex flex-col items-center p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className={`${action.color} p-3 rounded-full text-white mb-2`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-blue-600" />
            快速核销台
          </h2>
          <Link to="/verification" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            进入完整核销台 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {testCoupons.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-2 font-medium">测试券码（点击自动查询）：</p>
            <div className="flex flex-wrap gap-2">
              {testCoupons.map((c) => (
                <button
                  key={c.code}
                  onClick={() => fillAndQuery(c.code)}
                  className={`text-xs px-2.5 py-1 rounded-full font-mono border ${
                    statusColors[c.status] || 'bg-gray-100 text-gray-700'
                  } hover:opacity-80 transition-opacity`}
                >
                  {c.code} · {statusLabels[c.status] || c.status}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择门店</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setSelectedStaff('');
                }}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">券码</label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="请输入券码，如 CPN000018"
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">服务项目</label>
            <div className="relative">
              <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择服务</option>
                {services
                  .filter((s: any) => s.store_id === parseInt(storeId))
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} · ¥{s.price}</option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">服务人员</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择人员</option>
                {staff.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleQuery}
            disabled={queryLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            <Search className="w-4 h-4" />
            {queryLoading ? '查询中...' : '查询券码'}
          </button>
          {couponDetail && couponDetail.can_verify && (
            <button
              onClick={handleVerify}
              disabled={verifyLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              {verifyLoading ? '核销中...' : '确认核销'}
            </button>
          )}
          {queryError && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              {queryError}
            </div>
          )}
          {verifyResult && (
            <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              核销成功！剩余 {verifyResult.remaining_count}/{verifyResult.total_count} 次
            </div>
          )}
        </div>

        {couponDetail && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ticket className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 font-mono">{couponDetail.code}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[couponDetail.status] || ''}`}>
                        {statusLabels[couponDetail.status] || couponDetail.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{couponDetail.package_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {couponDetail.remaining_count}/{couponDetail.total_count}
                    <span className="text-sm text-gray-500 ml-1">次</span>
                  </p>
                  <p className="text-xs text-gray-500">剩余次数</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 p-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">用户</p>
                <p className="font-medium text-gray-900">{couponDetail.user_name}</p>
                <p className="text-sm text-gray-500 font-mono">{couponDetail.user_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">有效期</p>
                <p className="font-medium text-gray-900">{new Date(couponDetail.expire_at).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500">售价 ¥{couponDetail.price || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">服务内容</p>
                <p className="font-medium text-gray-900 text-sm">{couponDetail.service_content || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">预约要求</p>
                <p className="font-medium text-gray-900">
                  {couponDetail.requires_appointment ? '需预约' : '免预约'}
                </p>
                {couponDetail.price > 0 && couponDetail.total_count > 0 && (
                  <p className="text-sm text-gray-500">单次 ¥{(couponDetail.price / couponDetail.total_count).toFixed(2)}</p>
                )}
              </div>
            </div>

            {(!couponDetail.can_verify || couponDetail.cannot_verify_reasons?.length > 0) && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-700 mb-1.5 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  不可核销原因
                </p>
                <ul className="text-sm text-red-600 space-y-0.5">
                  {couponDetail.cannot_verify_reasons?.length > 0 ? (
                    couponDetail.cannot_verify_reasons.map((r: string, i: number) => (
                      <li key={i}>· {r}</li>
                    ))
                  ) : (
                    <li>· {couponDetail.cannot_verify_reason || '未知原因'}</li>
                  )}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 px-6 pb-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">适用门店</p>
                <div className="flex flex-wrap gap-1.5">
                  {couponDetail.applicable_stores?.length > 0 ? (
                    couponDetail.applicable_stores.map((s: any) => (
                      <span key={s.id} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">全部门店</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">适用项目</p>
                <div className="flex flex-wrap gap-1.5">
                  {couponDetail.applicable_services?.slice(0, 6).map((s: any) => (
                    <span key={s.id} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      {s.name}
                    </span>
                  ))}
                  {couponDetail.applicable_services?.length > 6 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      +{couponDetail.applicable_services.length - 6}项
                    </span>
                  )}
                </div>
              </div>
            </div>

            {couponDetail.verification_history?.length > 0 && (
              <div className="border-t px-6 py-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  核销历史
                </p>
                <div className="space-y-2">
                  {couponDetail.verification_history.slice(0, 3).map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-white p-2.5 rounded border">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-500">{v.verification_time}</span>
                        <span className="text-gray-700">{v.store_name}</span>
                        <span className="text-gray-700">{v.service_name}</span>
                        <span className="text-gray-500">{v.staff_name || '-'}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.settlement_status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {v.settlement_status === 'settled' ? '已结算' : '待结算'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-4">
            <Link to="/merchant?tab=verifications" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
              <p className="text-sm text-gray-500">今日核销</p>
              <p className="text-3xl font-bold text-gray-900">{stats.today_verifications || 0}</p>
              <p className="text-sm text-green-600 mt-1">营收 ¥{(stats.today_revenue || 0).toFixed(2)}</p>
            </Link>
            <Link to="/merchant?tab=settlements" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
              <p className="text-sm text-gray-500">待结算</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending_settlements_count || 0}</p>
              <p className="text-sm text-orange-600 mt-1">金额 ¥{(stats.pending_settlements_amount || 0).toFixed(2)}</p>
            </Link>
            <Link to="/merchant?tab=verifications" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
              <p className="text-sm text-gray-500">总核销数</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_verifications || 0}</p>
              <p className="text-sm text-blue-600 mt-1">查看明细 →</p>
            </Link>
            <Link to="/refunds" className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block">
              <p className="text-sm text-gray-500">待处理退款</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending_refunds_count || 0}</p>
              <p className="text-sm text-red-600 mt-1">金额 ¥{(stats.pending_refunds_amount || 0).toFixed(2)}</p>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/merchant?tab=verifications"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              查看核销明细
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/merchant?tab=anomalies"
              className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              <AlertTriangle className="w-4 h-4" />
              异常券复查
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/refunds"
              className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              退款处理
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              to="/merchant?tab=settlements"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              <DollarSign className="w-4 h-4" />
              财务对账
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {recentVerifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              最近核销记录
            </h2>
            <Link to="/merchant?tab=verifications" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部 →
            </Link>
          </div>
          <div className="space-y-2">
            {recentVerifications.slice(0, 5).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {v.package_name || v.coupon_code}
                      <span className="text-sm text-gray-500 font-mono ml-2">{v.coupon_code}</span>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" />
                        {v.store_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3.5 h-3.5" />
                        {v.service_name || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {v.staff_name || '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {v.verification_time}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">¥{(v.settlement_amount || v.amount || 0).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    v.settlement_status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {v.settlement_status === 'settled' ? '已结算' : '待结算'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">购买券包</h2>
            <Link to="/packages" className="text-sm text-blue-600 hover:text-blue-700">管理券包 →</Link>
          </div>
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{pkg.name}</span>
                    <span className="text-xs text-gray-500">{pkg.total_count || pkg.total_uses}次</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      pkg.appointment_required ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {pkg.appointment_required ? '需预约' : '免预约'}
                    </span>
                  </div>
                  {pkg.service_content && (
                    <p className="text-xs text-gray-500 mt-1 ml-6">{pkg.service_content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>售价 ¥{pkg.price || 0}</span>
                    <span>成本 ¥{pkg.cost_price || 0}</span>
                    <span>有效期至 {pkg.valid_to}</span>
                    <span>限购{pkg.purchase_limit || 1}份</span>
                    <span>{pkg.applicable_stores_formatted || pkg.store_count + '家门店'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>结算: {pkg.settlement_rule_formatted}</span>
                    {pkg.commission_rate && <span>佣金 {pkg.commission_rate}%</span>}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchaseLoading === pkg.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {purchaseLoading === pkg.id ? '购买中...' : '购买'}
                </button>
              </div>
            ))}
            {packages.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无可购券包</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">我的券包</h2>
            <span className="text-xs text-gray-500">共 {coupons.length} 张</span>
          </div>
          {coupons.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{coupon.package_name}</span>
                      <span className="text-xs text-gray-500">{coupon.total_count}次</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[coupon.status] || ''}`}>
                      {statusLabels[coupon.status] || coupon.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">券码: <span className="font-mono">{coupon.code}</span></p>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      剩余 <span className="text-blue-600 font-medium">{coupon.remaining_count}</span>/{coupon.total_count} 次
                    </span>
                    <span className="text-gray-500">有效期至 {new Date(coupon.expire_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <span>售价 ¥{coupon.price || 0}</span>
                    {coupon.total_settled > 0 && (
                      <span className="text-green-600">已结算 ¥{coupon.total_settled.toFixed(2)}</span>
                    )}
                  </div>
                  {coupon.service_content && (
                    <p className="text-xs text-gray-400 mt-1">服务内容: {coupon.service_content}</p>
                  )}
                  {coupon.status === 'refunded' && refundsMap[coupon.id] && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs space-y-1">
                      <p className="text-red-600">
                        <span className="font-medium">退款类型:</span> {formatRefundType(refundsMap[coupon.id].type || refundsMap[coupon.id].refund_type)}
                      </p>
                      <p className="text-red-600">
                        <span className="font-medium">退款金额:</span> ¥{refundsMap[coupon.id].amount || refundsMap[coupon.id].refund_amount || 0}
                      </p>
                      <p className="text-red-600">
                        <span className="font-medium">退款原因:</span> {refundsMap[coupon.id].reason || '未填写'}
                      </p>
                      {refundsMap[coupon.id].status === 'rejected' && (
                        <p className="text-red-600">
                          <span className="font-medium">拒绝原因:</span> {refundsMap[coupon.id].reject_reason || '未填写'}
                        </p>
                      )}
                      {refundsMap[coupon.id].operator_name && (
                        <p className="text-red-500">
                          <span className="font-medium">操作员:</span> {refundsMap[coupon.id].operator_name}
                        </p>
                      )}
                    </div>
                  )}
                  {coupon.settlements?.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs space-y-1">
                      <p className="text-green-700 font-medium">结算记录:</p>
                      {coupon.settlements.slice(0, 2).map((s: any, i: number) => (
                        <p key={i} className="text-green-600">
                          · {s.settlement_date || '今日'} ¥{(s.amount || 0).toFixed(2)}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                            s.status === 'settled' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {s.status === 'settled' ? '已结算' : '待结算'}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无券包，请先购买</p>
          )}
        </div>
      </div>
    </div>
  );
}
