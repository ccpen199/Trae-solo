import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  FileText,
  ClipboardCheck,
  Car as CarIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Image as ImageIcon,
  Gauge,
  Palette,
  CalendarDays,
  Wallet,
  FileSignature,
  ArrowLeftRight,
  History,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getCar } from '@/api/modules/cars';
import type { Car, Appointment, Deposit, Contract, Transfer, InspectionItem } from '@/types';
import { formatPrice, formatDate } from '@/utils';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: TabItem[] = [
  { id: 'basic', label: '基本信息', icon: CarIcon },
  { id: 'inspection', label: '检测报告', icon: ClipboardCheck },
  { id: 'transaction', label: '交易记录', icon: FileText },
  { id: 'history', label: '状态历史', icon: History },
];

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, checkRole } = useAuthStore();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadCarData(Number(id));
    }
  }, [id]);

  const loadCarData = async (carId: number) => {
    try {
      setLoading(true);
      const data = await getCar(carId);
      setCar(data);
    } catch (error) {
      console.error('加载车源详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <Empty message="车源不存在或已被删除" icon={CarIcon} />
      </div>
    );
  }

  const canEdit = () => {
    if (!user) return false;
    return checkRole(['admin']) || (checkRole(['dealer']) && car.dealerId === user.id);
  };

  const canAppointment = () => {
    return checkRole(['buyer', 'sales', 'admin']) && car.status === 'on_sale';
  };

  const canPayDeposit = () => {
    return checkRole(['buyer', 'admin']) && car.status === 'on_sale';
  };

  const canCreateInspection = () => {
    return checkRole(['inspector', 'admin']) && ['pending_inspection', 'inspection_rejected'].includes(car.status);
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'abnormal':
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      default:
        return <Clock className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'normal':
        return '正常';
      case 'abnormal':
        return '异常';
      case 'suspicious':
        return '可疑';
      default:
        return '未检测';
    }
  };

  const isAbnormal = (item: InspectionItem) => {
    return item.result === 'abnormal' || item.result === 'suspicious';
  };

  const mockAppointments: Appointment[] = [
    {
      id: 1,
      carId: car.id,
      buyerId: 3,
      type: 'view',
      appointmentTime: '2025-05-21 14:00:00',
      contactPhone: '13800138000',
      intentionLevel: 'high',
      status: 'confirmed',
      notes: '想试驾一下',
      followUpRecords: [],
      createdAt: '2025-05-19 10:30:00',
    },
  ];

  const mockDeposits: Deposit[] = [
    {
      id: 1,
      carId: car.id,
      buyerId: 3,
      amount: 5000,
      paymentMethod: 'alipay',
      transactionId: 'TXN20250519001',
      paidAt: '2025-05-19 15:30:00',
      status: 'paid',
      createdAt: '2025-05-19 15:00:00',
    },
  ];

  const mockContracts: Contract[] = [
    {
      id: 1,
      carId: car.id,
      buyerId: 3,
      dealerId: car.dealerId,
      totalPrice: car.price,
      paymentMethod: 'full',
      status: 'signed',
      signedByBuyerAt: '2025-05-20 10:00:00',
      signedByDealerAt: '2025-05-20 10:30:00',
      createdAt: '2025-05-20 09:00:00',
    },
  ];

  const mockTransfers: Transfer[] = [
    {
      id: 1,
      contractId: 1,
      carId: car.id,
      documents: [],
      status: 'pending',
      createdAt: '2025-05-20 11:00:00',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/cars')}
            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800">
                {car.brand} {car.model}
              </h1>
              <StatusBadge status={car.status} type="car" />
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              VIN: <span className="font-mono">{car.vin}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit() && (
              <button
                onClick={() => navigate(`/cars/publish?id=${car.id}`)}
                className="btn-secondary"
              >
                编辑信息
              </button>
            )}
            {canCreateInspection() && (
              <button
                onClick={() => navigate(`/inspections/create/${car.id}`)}
                className="btn-secondary"
              >
                发起检测
              </button>
            )}
            {canAppointment() && (
              <button
                onClick={() => navigate(`/appointments/create?carId=${car.id}`)}
                className="btn-secondary"
              >
                预约看车
              </button>
            )}
            {canPayDeposit() && (
              <button
                onClick={() => navigate(`/deposits/create?carId=${car.id}`)}
                className="btn-primary"
              >
                支付订金
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="relative aspect-video bg-neutral-100">
                {car.images && car.images.length > 0 ? (
                  <>
                    <img
                      src={car.images[currentImageIndex]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                    {car.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(i => i === 0 ? car.images!.length - 1 : i - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full text-neutral-700 hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(i => i === car.images!.length - 1 ? 0 : i + 1)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full text-neutral-700 hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                          {car.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
              {car.images && car.images.length > 1 && (
                <div className="p-4 border-t border-neutral-100">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {car.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                          index === currentImageIndex ? 'border-primary-700' : 'border-transparent'
                        }`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <div className="text-3xl font-bold text-primary-700 mb-4">
                {formatPrice(car.price)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">出厂日期</p>
                    <p className="text-sm font-medium text-neutral-700">{car.year}年{car.month}月</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">表显里程</p>
                    <p className="text-sm font-medium text-neutral-700">{(car.mileage / 10000).toFixed(1)}万公里</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">颜色</p>
                    <p className="text-sm font-medium text-neutral-700">{car.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">车商</p>
                    <p className="text-sm font-medium text-neutral-700">{car.dealer?.name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {car.inspection && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-800">检测评分</h3>
                  <Link
                    to={`/inspections/${car.inspection.id}`}
                    className="text-sm text-primary-700 hover:text-primary-800"
                  >
                    查看详情
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary-700 mb-2">
                      {car.inspection.overallScore}
                    </div>
                    <StatusBadge status={car.inspection.status} type="inspection" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-neutral-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-700 text-primary-700'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <CarIcon className="w-5 h-5 text-primary-700" />
                    车辆信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">品牌</p>
                      <p className="font-medium text-neutral-800">{car.brand}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">车型</p>
                      <p className="font-medium text-neutral-800">{car.model}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">VIN码</p>
                      <p className="font-medium text-neutral-800 font-mono">{car.vin}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">出厂年份</p>
                      <p className="font-medium text-neutral-800">{car.year}年</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">出厂月份</p>
                      <p className="font-medium text-neutral-800">{car.month}月</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">表显里程</p>
                      <p className="font-medium text-neutral-800">{(car.mileage / 10000).toFixed(1)}万公里</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">颜色</p>
                      <p className="font-medium text-neutral-800">{car.color}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">售价</p>
                      <p className="font-medium text-primary-700">{formatPrice(car.price)}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">车商</p>
                      <p className="font-medium text-neutral-800">{car.dealer?.name || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-700" />
                    配置描述
                  </h3>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-neutral-700 whitespace-pre-wrap">{car.configuration}</p>
                  </div>
                </div>

                {car.documents && car.documents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-700" />
                      证件资料
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {car.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="p-4 bg-neutral-50 rounded-lg flex items-center gap-3"
                        >
                          <FileText className="w-8 h-8 text-primary-600" />
                          <div>
                            <p className="font-medium text-neutral-800">{doc.name}</p>
                            <p className="text-xs text-neutral-500">
                              {doc.type === 'registration' && '行驶证'}
                              {doc.type === 'insurance' && '保险单'}
                              {doc.type === 'maintenance' && '维保记录'}
                              {doc.type === 'other' && '其他证件'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'inspection' && (
              <div>
                {car.inspection ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-primary-700" />
                        检测报告
                      </h3>
                      <Link
                        to={`/inspections/${car.inspection.id}`}
                        className="text-sm text-primary-700 hover:text-primary-800"
                      >
                        查看完整报告
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${isAbnormal(car.inspection.accident) ? 'border-danger-300 bg-danger-50' : 'border-neutral-200 bg-neutral-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-800">事故检测</h4>
                          {getResultIcon(car.inspection.accident.result)}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">
                          结果：<span className="font-medium">{getResultLabel(car.inspection.accident.result)}</span>
                        </p>
                        <p className="text-sm text-neutral-500">{car.inspection.accident.description}</p>
                      </div>

                      <div className={`p-4 rounded-lg border-2 ${isAbnormal(car.inspection.waterDamage) ? 'border-danger-300 bg-danger-50' : 'border-neutral-200 bg-neutral-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-800">水泡检测</h4>
                          {getResultIcon(car.inspection.waterDamage.result)}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">
                          结果：<span className="font-medium">{getResultLabel(car.inspection.waterDamage.result)}</span>
                        </p>
                        <p className="text-sm text-neutral-500">{car.inspection.waterDamage.description}</p>
                      </div>

                      <div className={`p-4 rounded-lg border-2 ${isAbnormal(car.inspection.fireDamage) ? 'border-danger-300 bg-danger-50' : 'border-neutral-200 bg-neutral-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-800">火烧检测</h4>
                          {getResultIcon(car.inspection.fireDamage.result)}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">
                          结果：<span className="font-medium">{getResultLabel(car.inspection.fireDamage.result)}</span>
                        </p>
                        <p className="text-sm text-neutral-500">{car.inspection.fireDamage.description}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-800 mb-1">综合评分</h4>
                          <p className="text-sm text-neutral-600">{car.inspection.overallComment}</p>
                        </div>
                        <div className="text-4xl font-bold text-primary-700">
                          {car.inspection.overallScore}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Empty message="暂无检测报告" icon={ClipboardCheck} />
                )}
              </div>
            )}

            {activeTab === 'transaction' && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary-700" />
                    预约记录
                  </h3>
                  {mockAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {mockAppointments.map((appointment) => (
                        <div key={appointment.id} className="p-4 bg-neutral-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <CalendarDays className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">
                                {appointment.type === 'view' ? '看车预约' : '试驾预约'}
                              </p>
                              <p className="text-sm text-neutral-500">
                                预约时间：{formatDate(appointment.appointmentTime)}
                              </p>
                              <p className="text-sm text-neutral-500">
                                联系电话：{appointment.contactPhone}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={appointment.status} type="appointment" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message="暂无预约记录" icon={CalendarDays} />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary-700" />
                    订金记录
                  </h3>
                  {mockDeposits.length > 0 ? (
                    <div className="space-y-3">
                      {mockDeposits.map((deposit) => (
                        <div key={deposit.id} className="p-4 bg-neutral-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-success-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">
                                订金支付 - {formatPrice(deposit.amount)}
                              </p>
                              <p className="text-sm text-neutral-500">
                                支付方式：{deposit.paymentMethod === 'alipay' ? '支付宝' : deposit.paymentMethod === 'wechat' ? '微信' : '银行卡'}
                              </p>
                              <p className="text-sm text-neutral-500">
                                交易单号：{deposit.transactionId}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={deposit.status} type="deposit" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message="暂无订金记录" icon={Wallet} />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-primary-700" />
                    合同记录
                  </h3>
                  {mockContracts.length > 0 ? (
                    <div className="space-y-3">
                      {mockContracts.map((contract) => (
                        <div key={contract.id} className="p-4 bg-neutral-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                              <FileSignature className="w-5 h-5 text-secondary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">
                                购车合同 - {formatPrice(contract.totalPrice)}
                              </p>
                              <p className="text-sm text-neutral-500">
                                付款方式：{contract.paymentMethod === 'full' ? '全款' : '分期'}
                              </p>
                              <p className="text-sm text-neutral-500">
                                创建时间：{formatDate(contract.createdAt)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={contract.status} type="contract" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message="暂无合同记录" icon={FileSignature} />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-primary-700" />
                    过户记录
                  </h3>
                  {mockTransfers.length > 0 ? (
                    <div className="space-y-3">
                      {mockTransfers.map((transfer) => (
                        <div key={transfer.id} className="p-4 bg-neutral-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <ArrowLeftRight className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">过户申请</p>
                              <p className="text-sm text-neutral-500">
                                创建时间：{formatDate(transfer.createdAt)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={transfer.status} type="transfer" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message="暂无过户记录" icon={ArrowLeftRight} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="font-semibold text-neutral-800 mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary-700" />
                  状态变更历史
                </h3>
                {car.statusHistory && car.statusHistory.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />
                    <div className="space-y-6">
                      {car.statusHistory.map((history, index) => (
                        <div key={history.id} className="relative flex gap-4">
                          <div className="w-10 h-10 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center z-10">
                            {index === 0 ? (
                              <CarIcon className="w-5 h-5 text-primary-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-neutral-500" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusBadge status={history.fromStatus} type="car" />
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                              <StatusBadge status={history.toStatus} type="car" />
                            </div>
                            <p className="text-sm text-neutral-700 mb-1">{history.reason}</p>
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {history.operator?.name || '系统'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(history.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Empty message="暂无状态变更记录" icon={History} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
