import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileCheck,
  Shield,
  Building2,
  Wallet,
  FileSignature,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Users,
  MessageCircle,
  Database,
  FileText,
  CreditCard,
  Home as HomeIcon,
  ChevronRight,
} from 'lucide-react';
import api, { ApiResponse, PurchaseOrder, Property } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

const steps = [
  {
    key: 'eligibility_pending',
    label: '限购资格核验',
    icon: Shield,
    description: '提交资料进行购房资格前置审核',
    detail: '需提供身份证、户口本、婚姻证明、社保/个税缴纳记录等材料，系统自动对接住建委限购查询接口，1个工作日内出结果。',
    action: '提交核验申请',
  },
  {
    key: 'eligibility_pass',
    label: '核验通过',
    icon: CheckCircle2,
    description: '符合购房条件，可进行房源认购',
    detail: '核验通过后，资格有效期为6个月。在此期间内可办理房源认购手续。',
    action: '选择房源认购',
  },
  {
    key: 'subscribed',
    label: '电子认购',
    icon: FileCheck,
    description: '支付定金，在线锁定房源',
    detail: '在线支付定金（通常为总房款的1%-5%），签署电子认购书，房源锁定时间为7天，需在此期间完成正式签约。',
    action: '支付定金并认购',
  },
  {
    key: 'signed',
    label: '线上签约',
    icon: FileSignature,
    description: 'CA数字认证+区块链存证',
    detail: '使用CA数字证书进行电子签名，购房合同实时上链存证，不可篡改，永久可查。',
    action: '签署购房合同',
  },
  {
    key: 'fund_supervised',
    label: '资金监管',
    icon: Wallet,
    description: '第三方资金监管账户对接',
    detail: '购房款存入银行监管账户，资金划转与房屋确权进度挂钩，确保交易资金安全。',
    action: '办理资金监管',
  },
  {
    key: 'loan_pending',
    label: '贷款预审',
    icon: Building2,
    description: '银行贷款预审接口对接',
    detail: '对接多家银行信贷系统，在线提交贷款申请，银行自动审批，最快3个工作日出具贷款批复。',
    action: '提交贷款申请',
  },
  {
    key: 'completed',
    label: '交易完成',
    icon: CheckCircle2,
    description: '所有流程完成，办理不动产登记',
    detail: '贷款放款、资金划转完成后，办理不动产转移登记，领取不动产权证书，交易完成。',
    action: null,
  },
];

const quickActions = [
  { icon: HomeIcon, label: '浏览房源', link: '/properties', desc: '选择心仪房源' },
  { icon: Shield, label: '限购核验', link: '/purchase', desc: '提前核验购房资格' },
  { icon: MessageCircle, label: '咨询顾问', link: '/im', desc: '一对一专业解答' },
  { icon: CreditCard, label: '贷款计算', link: '/purchase', desc: '测算月供金额' },
];

export default function PurchaseFlow() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedOrder) {
      loadPropertyInfo(selectedOrder.propertyId);
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    try {
      const res = await api.get<ApiResponse<PurchaseOrder[]>>('/purchase/orders');
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setOrders(result.data || []);
        if (result.data?.length > 0) {
          setSelectedOrder(result.data[0]);
        }
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyInfo = async (propertyId: number) => {
    try {
      const res = await api.get<ApiResponse<Property>>(`/properties/${propertyId}`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setPropertyInfo(result.data);
      }
    } catch (error) {
      console.error('加载房源信息失败:', error);
    }
  };

  const handleVerifyEligibility = async () => {
    if (!selectedOrder) return;
    setVerifying(true);
    try {
      const res = await api.post<ApiResponse<PurchaseOrder>>(`/purchase/verify-eligibility/${selectedOrder.id}`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setOrders(prev => prev.map(o => o.id === result.data.id ? result.data : o));
        setSelectedOrder(result.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '核验失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.post<ApiResponse<PurchaseOrder>>(`/purchase/subscribe/${selectedOrder.id}`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setOrders(prev => prev.map(o => o.id === result.data.id ? result.data : o));
        setSelectedOrder(result.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '认购失败，请重试');
    }
  };

  const handleSignContract = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.post<ApiResponse<PurchaseOrder>>(`/purchase/sign/${selectedOrder.id}`);
      const result = res?.code !== undefined ? res : res?.data;
      if (result?.code === 200) {
        setOrders(prev => prev.map(o => o.id === result.data.id ? result.data : o));
        setSelectedOrder(result.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '签约失败，请重试');
    }
  };

  const getCurrentStepIndex = (status: string) => {
    return steps.findIndex(s => s.key === status);
  };

  const getStepStatus = (index: number, currentIndex: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  const currentOrder = selectedOrder || orders[0];
  const currentStepIndex = currentOrder ? getCurrentStepIndex(currentOrder.status) : -1;
  const progressPercent = currentOrder ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">购房全流程</h1>
          <p className="text-gray-500 mt-1">从限购核验到不动产登记，全程电子化办理，透明可追溯</p>
        </div>
        <Link to="/im" className="btn-outline flex items-center gap-2">
          <Users className="w-4 h-4" />
          咨询专属顾问
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              to={action.link}
              className="card p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 flex items-center gap-1">
                    {action.label}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </h4>
                  <p className="text-xs text-gray-500">{action.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {currentOrder && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">购房总体进度</h3>
            <span className="text-2xl font-bold text-primary-600">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已完成 {currentStepIndex + 1} 步</span>
            <span>共 {steps.length} 步</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-3">我的订单</h2>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无购房订单</p>
              <p className="text-sm text-gray-400 mt-1">选择房源后可发起认购流程</p>
            </div>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-gray-100 bg-white hover:border-primary-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-gray-500">{order.orderNo}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'eligibility_pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {steps.find(s => s.key === order.status)?.label}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(order.amount)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  下单时间：{new Date(order.createdAt).toLocaleDateString('zh-CN')}
                </p>
                {order.blockchainHash && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3" />
                    区块链存证：{order.blockchainHash.slice(0, 16)}...
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-600 to-primary-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">购房进度追踪</h2>
                    <p className="text-primary-200 mt-1">订单号：{selectedOrder.orderNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{formatPrice(selectedOrder.amount)}</p>
                    {selectedOrder.caVerified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-sm text-white mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        CA认证已通过
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {propertyInfo && (
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    房源信息
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">楼盘名称</p>
                      <p className="font-medium text-gray-900">{propertyInfo.projectName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">坐落位置</p>
                      <p className="font-medium text-gray-900">{propertyInfo.city} {propertyInfo.district}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">户型</p>
                      <p className="font-medium text-gray-900">{propertyInfo.bedrooms}室{propertyInfo.bathrooms}卫</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">面积</p>
                      <p className="font-medium text-gray-900">{propertyInfo.area}㎡</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200" />
                  <div className="space-y-8">
                    {steps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(selectedOrder.status);
                      const status = getStepStatus(index, currentIndex);
                      const StepIcon = step.icon;

                      return (
                        <div key={step.key} className="relative flex gap-4">
                          <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            status === 'completed' ? 'bg-green-500 text-white' :
                            status === 'current' ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            {status === 'completed' ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : status === 'current' ? (
                              <Clock className="w-6 h-6 animate-pulse" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-semibold ${
                                status === 'completed' || status === 'current' ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </h4>
                              {status === 'completed' && (
                                <span className="text-sm text-green-600">已完成</span>
                              )}
                              {status === 'current' && (
                                <span className="text-sm text-primary-600">进行中</span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${
                              status === 'completed' || status === 'current' ? 'text-gray-500' : 'text-gray-300'
                            }`}>
                              {step.description}
                            </p>

                            <p className={`text-sm mt-2 ${
                              status === 'completed' || status === 'current' ? 'text-gray-500' : 'text-gray-300'
                            }`}>
                              {step.detail}
                            </p>

                            {status === 'current' && (
                              <div className="mt-4 space-y-4">
                                {step.key === 'eligibility_pending' && (
                                  <div>
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-600" />
                                        所需材料
                                      </h5>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• 身份证原件扫描件</li>
                                        <li>• 户口本（首页、本人页、配偶页）</li>
                                        <li>• 婚姻证明（结婚证/离婚证）</li>
                                        <li>• 社保/个税缴纳记录（连续60个月）</li>
                                      </ul>
                                    </div>
                                    <button
                                      onClick={handleVerifyEligibility}
                                      disabled={verifying}
                                      className="btn-primary flex items-center gap-2 w-full justify-center"
                                    >
                                      {verifying ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Shield className="w-4 h-4" />
                                      )}
                                      {verifying ? '核验中...' : '提交购房资格核验申请'}
                                    </button>
                                  </div>
                                )}
                                {step.key === 'eligibility_pass' && (
                                  <div>
                                    <div className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                      <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        核验结果
                                      </h5>
                                      <p className="text-sm text-green-700">
                                        您已通过购房资格核验，资格有效期至 {new Date(Date.now() + 180 * 86400000).toLocaleDateString('zh-CN')}
                                      </p>
                                    </div>
                                    <Link to="/properties" className="btn-primary flex items-center gap-2 w-full justify-center">
                                      <HomeIcon className="w-4 h-4" />
                                      选择房源进行认购
                                    </Link>
                                  </div>
                                )}
                                {step.key === 'subscribed' && (
                                  <div>
                                    <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                      <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        认购须知
                                      </h5>
                                      <ul className="text-sm text-amber-700 space-y-1">
                                        <li>• 定金金额：¥20,000（总房款的2%）</li>
                                        <li>• 房源锁定：7天</li>
                                        <li>• 需在锁定期间完成正式签约</li>
                                        <li>• 定金签约后自动转为房款</li>
                                      </ul>
                                    </div>
                                    <button
                                      onClick={handleSubscribe}
                                      className="btn-primary flex items-center gap-2 w-full justify-center"
                                    >
                                      <FileCheck className="w-4 h-4" />
                                      支付定金并在线认购
                                    </button>
                                  </div>
                                )}
                                {step.key === 'signed' && (
                                  <div>
                                    <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                      <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-purple-600" />
                                        签约说明
                                      </h5>
                                      <ul className="text-sm text-purple-700 space-y-1">
                                        <li>• 使用CA数字证书进行电子签名</li>
                                        <li>• 合同实时上链存证，不可篡改</li>
                                        <li>• 支持多人在线协同签署</li>
                                        <li>• 签署完成后自动生成区块链存证哈希</li>
                                      </ul>
                                    </div>
                                    <button
                                      onClick={handleSignContract}
                                      className="btn-primary flex items-center gap-2 w-full justify-center"
                                    >
                                      <FileSignature className="w-4 h-4" />
                                      开始线上签约
                                    </button>
                                  </div>
                                )}
                                {step.key === 'fund_supervised' && (
                                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-start gap-3">
                                      <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-blue-900">资金监管办理中</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                          正在为您开设第三方资金监管账户，请准备好身份证和银行卡。
                                          监管银行：中国工商银行 · 监管账户尾号：****8829
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                          <Wallet className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm text-blue-600 font-medium">预计1-2个工作日完成</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {step.key === 'loan_pending' && (
                                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-start gap-3">
                                      <Clock className="w-5 h-5 text-indigo-600 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-indigo-900">贷款预审中</p>
                                        <p className="text-sm text-indigo-700 mt-1">
                                          您的贷款申请已提交至中国建设银行，正在进行资质审核。
                                          贷款金额：¥5,950,000 · 贷款期限：30年 · 利率：LPR-20BP
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                          <CreditCard className="w-4 h-4 text-indigo-600" />
                                          <span className="text-sm text-indigo-600 font-medium">预计3-5个工作日出批复</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {status === 'completed' && (
                              <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {step.key === 'eligibility_pending' && `核验通过，有效期至 ${new Date(Date.now() + 180 * 86400000).toLocaleDateString('zh-CN')}`}
                                {step.key === 'subscribed' && `定金¥20,000已支付，房源已锁定`}
                                {step.key === 'signed' && `合同已上链存证，区块高度: #${Math.floor(Math.random() * 1000000)}`}
                                {step.key === 'fund_supervised' && `资金已存入监管账户，安全有保障`}
                                {step.key === 'loan_pending' && `贷款已放款，利率: 4.1%`}
                                {step.key === 'completed' && `交易完成，不动产权证已办理`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">请选择订单查看详情</h3>
              <p className="text-sm text-gray-400 mt-1">从左侧列表选择一个购房订单</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
