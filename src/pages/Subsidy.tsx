import { useState, useEffect } from 'react';
import {
  Gift,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield,
  Ticket,
  ChevronRight,
  Sparkles,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';
import { operationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Subsidy {
  id: string;
  name: string;
  amount: number;
  type: 'red_packet' | 'coupon' | 'cashback';
  conditions: string;
  validFrom: string;
  validTo: string;
  totalCount: number;
  claimedCount: number;
  usedCount: number;
  minPurchaseAmount: number;
  status: string;
}

interface UserSubsidy {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  subsidyId: string;
  subsidy: Subsidy;
  claimedAt: string;
  used: boolean;
  usedAt: string;
  propertyId: string;
  riskScore: number;
  riskFlags: string[];
  verificationCode: string;
}

interface SubsidyStats {
  totalSubsidies: number;
  activeSubsidies: number;
  totalClaimed: number;
  totalUsed: number;
  totalAmount: number;
  highRiskCount: number;
  blockedCount: number;
  usageRate: number;
}

export default function Subsidy() {
  const [subsidies, setSubsidies] = useState<Subsidy[]>([]);
  const [userSubsidies, setUserSubsidies] = useState<UserSubsidy[]>([]);
  const [stats, setStats] = useState<SubsidyStats | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'my'>('market');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedSubsidy, setSelectedSubsidy] = useState<Subsidy | null>(null);
  const [claimForm, setClaimForm] = useState({ userId: 'user-001', userName: '', phone: '' });
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [subsidyRes, statsRes, userRes] = await Promise.all([
      operationApi.getSubsidies({ status: 'active' }),
      operationApi.getSubsidyStats(),
      operationApi.getUserSubsidies({ userId: 'user-001' }),
    ]);

    if (subsidyRes.success) {
      setSubsidies(subsidyRes.data);
    }
    if (statsRes.success) {
      setStats(statsRes.data);
    }
    if (userRes.success) {
      setUserSubsidies(userRes.data);
    }
  };

  const handleClaim = async (subsidy: Subsidy) => {
    setSelectedSubsidy(subsidy);
    setShowClaimModal(true);
    setClaimResult(null);
  };

  const submitClaim = async () => {
    if (!selectedSubsidy) return;
    setClaimingId(selectedSubsidy.id);

    const res = await operationApi.claimSubsidy(selectedSubsidy.id, claimForm);

    setClaimResult({
      success: res.success,
      message: res.message || res.error || '',
      data: res.data,
    });

    if (res.success) {
      fetchData();
    }

    setClaimingId(null);
  };

  const typeConfig = {
    red_packet: { label: '红包', color: 'from-red-500 to-orange-500', icon: Gift },
    coupon: { label: '优惠券', color: 'from-blue-500 to-cyan-500', icon: Ticket },
    cashback: { label: '现金返还', color: 'from-green-500 to-emerald-500', icon: DollarSign },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">购房补贴中心</h1>
            <p className="text-orange-100">
              领取专属购房红包，享受额外购房优惠，更有多重补贴叠加使用
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Gift className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">活动总数</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSubsidies}</p>
            <p className="text-xs text-green-500 mt-1">进行中 {stats.activeSubsidies} 个</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-gray-500 text-sm">已领取</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClaimed}</p>
            <p className="text-xs text-gray-400 mt-1">使用率 {stats.usageRate}%</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-gray-500 text-sm">已核销</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsed}</p>
            <p className="text-xs text-gray-400 mt-1">发放金额 {stats.totalAmount.toLocaleString()}元</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-gray-500 text-sm">高风险</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.highRiskCount}</p>
            <p className="text-xs text-gray-400 mt-1">风控拦截</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('market')}
            className={cn(
              'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'market'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <Gift className="w-4 h-4" />
            领补贴
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'my'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <Ticket className="w-4 h-4" />
            我的补贴 ({userSubsidies.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'market' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subsidies.map((subsidy) => {
                const config = typeConfig[subsidy.type];
                const Icon = config.icon;
                const progress = (subsidy.claimedCount / subsidy.totalCount) * 100;
                const isClaimed = userSubsidies.some((us) => us.subsidyId === subsidy.id);

                return (
                  <div
                    key={subsidy.id}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className={`h-24 bg-gradient-to-r ${config.color} p-5 text-white relative`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                            {config.label}
                          </span>
                          <h3 className="text-lg font-bold mt-2">{subsidy.name}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-3xl font-bold">
                          ¥{subsidy.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-3">{subsidy.conditions}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <Clock className="w-3 h-3" />
                        <span>有效期：{subsidy.validFrom} 至 {subsidy.validTo}</span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>已领取 {subsidy.claimedCount}/{subsidy.totalCount}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(subsidy)}
                        disabled={isClaimed}
                        className={cn(
                          'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isClaimed
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90',
                        )}
                      >
                        {isClaimed ? '已领取' : '立即领取'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'my' && (
            <div>
              {userSubsidies.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">您还没有领取任何补贴</p>
                  <button
                    onClick={() => setActiveTab('market')}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                  >
                    去领取
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userSubsidies.map((us) => {
                    const config = typeConfig[us.subsidy.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={us.id}
                        className="border border-gray-200 rounded-xl p-4 flex items-center gap-4"
                      >
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{us.subsidy.name}</h3>
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                us.used
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-green-100 text-green-700',
                              )}
                            >
                              {us.used ? '已使用' : '未使用'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            核销码：{us.verificationCode}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            领取时间：{us.claimedAt}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-500">
                            ¥{us.subsidy.amount.toLocaleString()}
                          </p>
                          {us.riskScore > 50 && (
                            <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>风险评估中</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Risk Control Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">安全保障</h3>
            <p className="text-sm text-gray-600 mb-2">
              平台采用多重风控机制，确保补贴发放公平公正，防止刷单行为：
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                实名验证，一人一号
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                设备指纹识别，防止多账号操作
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                IP地址监控，异常行为拦截
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                人工复核，确保真实购房需求
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedSubsidy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className={`p-6 bg-gradient-to-r ${typeConfig[selectedSubsidy.type].color} text-white`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">领取补贴</h2>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">{selectedSubsidy.name}</p>
              <p className="text-4xl font-bold mt-4">¥{selectedSubsidy.amount.toLocaleString()}</p>
            </div>

            <div className="p-6">
              {claimResult ? (
                <div className="text-center py-6">
                  {claimResult.success ? (
                    <>
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">领取成功！</h3>
                      <p className="text-gray-500 mb-4">{claimResult.message}</p>
                      {claimResult.data && (
                        <div className="bg-gray-50 rounded-lg p-4 text-left">
                          <p className="text-sm text-gray-600">
                            核销码：<span className="font-mono font-bold text-blue-600">{claimResult.data.verificationCode}</span>
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => setShowClaimModal(false)}
                        className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
                      >
                        知道了
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">领取失败</h3>
                      <p className="text-gray-500">{claimResult.message}</p>
                      {claimResult.data?.riskFlags && claimResult.data.riskFlags.length > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg text-left">
                          <p className="text-sm text-orange-700 font-medium mb-1">风控提示：</p>
                          <ul className="text-sm text-orange-600 space-y-1">
                            {claimResult.data.riskFlags.map((flag: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1.5 w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={() => setClaimResult(null)}
                        className="mt-6 w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                      >
                        重新领取
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">姓名</label>
                      <input
                        type="text"
                        value={claimForm.userName}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, userName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="请输入真实姓名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">手机号</label>
                      <input
                        type="tel"
                        value={claimForm.phone}
                        onChange={(e) => setClaimForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="请输入手机号"
                      />
                    </div>
                  </div>

                  <div className="mt-6 bg-yellow-50 rounded-lg p-3 flex items-start gap-2">
                    <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">温馨提示</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        为防止恶意刷单，我们将对领取用户进行风控验证。请确保信息真实有效。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowClaimModal(false)}
                      className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={submitClaim}
                      disabled={claimingId !== null}
                      className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {claimingId ? '领取中...' : '立即领取'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
