import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Scale,
  Clock,
  Camera,
  FileText,
  CreditCard,
  Printer,
  QrCode,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Banknote,
  Smartphone,
  Wallet,
} from 'lucide-react';
import type { Order, PaymentMethod } from 'shared/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal, ModalFooter } from '@/components/Modal';
import { StepIndicator } from '@/components/StepIndicator';
import { useTaskStore } from '@/store/task';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { get } from '@/utils/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const timelineSteps = [
  { label: '待指派', key: 'pending' },
  { label: '已指派', key: 'assigned' },
  { label: '已扫码', key: 'scanned' },
  { label: '已称重', key: 'weighed' },
  { label: '已收款', key: 'paid' },
  { label: '已打印', key: 'printed' },
  { label: '已完成', key: 'completed' },
];

const getStepIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    pending: 0,
    assigned: 1,
    picked: 2,
    scanned: 2,
    weighed: 3,
    paid: 4,
    printed: 5,
    in_transit: 5,
    completed: 6,
  };
  return statusMap[status] ?? 0;
};

const mockOrder: Order = {
  id: 'order-001',
  orderNo: 'ORD20240115001',
  sender: {
    name: '张三',
    phone: '13800138001',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    address: '建国路88号SOHO现代城A座1001室',
    fullAddress: '北京市北京市朝阳区建国路88号SOHO现代城A座1001室',
  },
  receiver: {
    name: '李四',
    phone: '13900139002',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    address: '陆家嘴环路1000号恒生银行大厦2001室',
    fullAddress: '上海市上海市浦东新区陆家嘴环路1000号恒生银行大厦2001室',
  },
  itemType: '电子产品',
  estimatedWeight: 2.5,
  actualWeight: 2.8,
  appointmentTime: new Date().toISOString(),
  pickupCode: 'PK882345',
  status: 'assigned',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOperationLogs = [
  { id: '1', action: '任务创建', operator: '系统', time: new Date(Date.now() - 3600000 * 5).toISOString(), remark: '用户下单成功' },
  { id: '2', action: '任务指派', operator: '李管理', time: new Date(Date.now() - 3600000 * 4).toISOString(), remark: '指派给快递员张快递' },
  { id: '3', action: '快递员接单', operator: '张快递', time: new Date(Date.now() - 3600000 * 3).toISOString(), remark: '确认接单' },
  { id: '4', action: '开始揽收', operator: '张快递', time: new Date(Date.now() - 3600000 * 2).toISOString(), remark: '已到达寄件地址' },
];

const paymentMethods: { key: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'wechat', label: '微信支付', icon: <Smartphone className="w-6 h-6" />, color: 'bg-green-500' },
  { key: 'alipay', label: '支付宝', icon: <Wallet className="w-6 h-6" />, color: 'bg-blue-500' },
  { key: 'cash', label: '现金', icon: <Banknote className="w-6 h-6" />, color: 'bg-yellow-500' },
  { key: 'account', label: '账户扣款', icon: <CreditCard className="w-6 h-6" />, color: 'bg-purple-500' },
];

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTask,
    loading,
    error,
    getTaskById,
    scanPickupCode,
    submitWeight,
    submitPayment,
    printWaybill,
    calculateFreight,
    setCurrentTask,
  } = useTaskStore();
  const { addNotification } = useAppStore();
  const { user } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(mockOrder);
  const [operationLogs, setOperationLogs] = useState(mockOperationLogs);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showWeighModal, setShowWeighModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const [freightDetail, setFreightDetail] = useState<{ baseFee: number; weightFee: number; insurance: number; total: number } | null>(null);
  const [scaleReading, setScaleReading] = useState<number | null>(null);
  const [simulatingScale, setSimulatingScale] = useState(false);

  useEffect(() => {
    if (id) {
      getTaskById(id);
      loadOrderDetails();
    }
    return () => {
      setCurrentTask(null);
    };
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      if (id) {
        const orderData = await get<Order>(`/orders/by-task/${id}`);
        setOrder(orderData);
      }
    } catch {
      setOrder(mockOrder);
    }
  };

  const handleScan = async () => {
    if (!pickupCodeInput.trim()) {
      addNotification({
        type: 'warning',
        title: '请输入揽收码',
        message: '请输入或扫描揽收码',
      });
      return;
    }

    try {
      const task = await scanPickupCode(pickupCodeInput);
      if (task) {
        addNotification({
          type: 'success',
          title: '扫码成功',
          message: '揽收码验证通过',
        });
        setShowScanModal(false);
        setPickupCodeInput('');
        setOperationLogs(prev => [
          {
            id: Date.now().toString(),
            action: '扫码核销',
            operator: user?.name || '快递员',
            time: new Date().toISOString(),
            remark: `揽收码: ${pickupCodeInput}`,
          },
          ...prev,
        ]);
      } else {
        addNotification({
          type: 'error',
          title: '扫码失败',
          message: '揽收码无效或不存在',
        });
      }
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '扫码失败',
        message: err.message || '请稍后重试',
      });
    }
  };

  const simulateScaleReading = () => {
    setSimulatingScale(true);
    let count = 0;
    const interval = setInterval(() => {
      setScaleReading(Math.random() * 5 + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalWeight = Math.round((Math.random() * 3 + 1) * 10) / 10;
        setScaleReading(finalWeight);
        setWeightInput(finalWeight.toString());
        setSimulatingScale(false);
        handleCalculateFreight(finalWeight);
      }
    }, 200);
  };

  const handleCalculateFreight = async (weight?: number) => {
    const w = weight ?? parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;

    try {
      const detail = await calculateFreight(w, order?.itemType || '普通物品');
      setFreightDetail(detail);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '运费计算失败',
        message: err.message || '请稍后重试',
      });
    }
  };

  const handleSubmitWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      addNotification({
        type: 'warning',
        title: '请输入有效重量',
        message: '重量必须大于0',
      });
      return;
    }

    if (!currentTask) return;

    try {
      await submitWeight(currentTask.id, weight);
      addNotification({
        type: 'success',
        title: '称重成功',
        message: `实际重量: ${weight} kg`,
      });
      setShowWeighModal(false);
      setOperationLogs(prev => [
        {
          id: Date.now().toString(),
          action: '称重完成',
          operator: user?.name || '快递员',
          time: new Date().toISOString(),
          remark: `实际重量: ${weight} kg`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '称重失败',
        message: err.message || '请稍后重试',
      });
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPaymentMethod || !freightDetail || !currentTask) return;

    try {
      await submitPayment(currentTask.id, selectedPaymentMethod, freightDetail.total);
      addNotification({
        type: 'success',
        title: '收款成功',
        message: `已收款 ¥${freightDetail.total.toFixed(2)}`,
      });
      setShowPaymentModal(false);
      setSelectedPaymentMethod('');
      setOperationLogs(prev => [
        {
          id: Date.now().toString(),
          action: '收款完成',
          operator: user?.name || '快递员',
          time: new Date().toISOString(),
          remark: `收款方式: ${paymentMethods.find(m => m.key === selectedPaymentMethod)?.label}, 金额: ¥${freightDetail.total.toFixed(2)}`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '收款失败',
        message: err.message || '请稍后重试',
      });
    }
  };

  const handlePrint = async () => {
    if (!currentTask) return;

    try {
      await printWaybill(currentTask.id);
      addNotification({
        type: 'success',
        title: '打印成功',
        message: '面单已发送至打印机',
      });
      setShowPrintModal(false);
      setOperationLogs(prev => [
        {
          id: Date.now().toString(),
          action: '面单打印',
          operator: user?.name || '快递员',
          time: new Date().toISOString(),
          remark: '运单已打印',
        },
        ...prev,
      ]);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '打印失败',
        message: err.message || '请稍后重试',
      });
    }
  };

  const handlePhotoUpload = () => {
    addNotification({
      type: 'info',
      title: '拍照功能',
      message: '调用摄像头拍照（模拟）',
    });
  };

  if (loading && !currentTask) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error && !currentTask) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => id && getTaskById(id)}
          className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">任务不存在</p>
        <button
          onClick={() => navigate('/tasks')}
          className="mt-4 px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          返回列表
        </button>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(currentTask.status);
  const canScan = currentTask.status === 'assigned' || currentTask.status === 'pending';
  const canWeigh = currentTask.status === 'picked';
  const canPay = currentTask.actualWeight !== undefined && currentTask.freight === undefined;
  const canPrint = currentTask.freight !== undefined && currentTask.status !== 'completed' && currentTask.status !== 'in_transit';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6 animate-slide-down">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">任务详情</h1>
            <StatusBadge status={currentTask.status} type="task" size="md" />
            {!currentTask.synced && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                待同步
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">任务编号: {currentTask.taskNo}</p>
        </div>
        {canScan && (
          <button
            onClick={() => {
              setPickupCodeInput(currentTask.pickupCode);
              setShowScanModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            扫码核销
          </button>
        )}
        {canWeigh && (
          <button
            onClick={() => setShowWeighModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Scale className="w-4 h-4" />
            称重
          </button>
        )}
        {canPay && (
          <button
            onClick={() => {
              if (currentTask.actualWeight) {
                handleCalculateFreight(currentTask.actualWeight);
              }
              setShowPaymentModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            收款
          </button>
        )}
        {canPrint && (
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
            打印面单
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-up">
        <h3 className="font-semibold text-gray-900 mb-4">任务状态</h3>
        <StepIndicator
          steps={timelineSteps.map(s => ({ label: s.label }))}
          currentStep={currentStepIndex}
          size="sm"
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-auto pb-6">
        <div className="lg:col-span-2 space-y-6">
          {order && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                订单信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium mb-2">寄件人</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">{order.sender.name}</span>
                        <span className="text-gray-500">{order.sender.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-gray-600 text-sm">{order.sender.fullAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-2">收件人</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-gray-900">{order.receiver.name}</span>
                        <span className="text-gray-500">{order.receiver.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-gray-600 text-sm">{order.receiver.fullAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">物品类型</p>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{order.itemType}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">预估重量</p>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{order.estimatedWeight} kg</span>
                  </div>
                </div>
                {currentTask.actualWeight && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">实际重量</p>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-green-600">{currentTask.actualWeight} kg</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">预约时间</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {dayjs(order.appointmentTime).format('MM-DD HH:mm')}
                    </span>
                  </div>
                </div>
                {currentTask.freight !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">运费</p>
                    <span className="text-xl font-bold text-primary">¥{currentTask.freight.toFixed(2)}</span>
                  </div>
                )}
                {currentTask.waybillNo && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">运单号</p>
                    <span className="font-mono font-medium text-gray-900">{currentTask.waybillNo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              照片凭证
            </h3>
            {currentTask.photos && currentTask.photos.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {currentTask.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src={photo} alt={`照片 ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Camera className="w-12 h-12 mb-2 opacity-50" />
                <p>暂无照片</p>
                {canWeigh && (
                  <button
                    onClick={handlePhotoUpload}
                    className="mt-3 px-4 py-2 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    上传照片
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4">操作日志</h3>
            <div className="space-y-4">
              {operationLogs.map((log, index) => (
                <div key={log.id} className="relative pl-8">
                  {index < operationLogs.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className={cn(
                    'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center',
                    index === 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  )}>
                    <Check className="w-3 h-3" />
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-sm text-gray-500">{log.operator}</span>
                      <span className="text-xs text-gray-400">
                        {dayjs(log.time).format('YYYY-MM-DD HH:mm:ss')}
                      </span>
                    </div>
                    {log.remark && (
                      <p className="text-sm text-gray-500 mt-1">{log.remark}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4">任务信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">揽收码</span>
                <span className="font-mono font-semibold text-primary">{currentTask.pickupCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">任务编号</span>
                <span className="font-medium">{currentTask.taskNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">关联订单</span>
                <span className="font-medium">{currentTask.orderNo}</span>
              </div>
              {currentTask.courierName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">快递员</span>
                  <span className="font-medium">{currentTask.courierName}</span>
                </div>
              )}
              {currentTask.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-500">支付方式</span>
                  <span className="font-medium">
                    {paymentMethods.find(m => m.key === currentTask.paymentMethod)?.label}
                  </span>
                </div>
              )}
              {currentTask.printedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">打印时间</span>
                  <span className="font-medium">{dayjs(currentTask.printedAt).format('MM-DD HH:mm')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="font-medium">{dayjs(currentTask.createdAt).format('MM-DD HH:mm')}</span>
              </div>
            </div>
          </div>

          {currentTask.exceptionReason && (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 animate-slide-up">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                异常信息
              </h3>
              <p className="text-red-700 text-sm">{currentTask.exceptionReason}</p>
            </div>
          )}

          {freightDetail && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-slide-up">
              <h3 className="font-semibold text-gray-900 mb-4">运费明细</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">基础运费</span>
                  <span>¥{freightDetail.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">续重费</span>
                  <span>¥{freightDetail.weightFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">保价费</span>
                  <span>¥{freightDetail.insurance.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between">
                  <span className="font-semibold text-gray-900">合计</span>
                  <span className="text-xl font-bold text-primary">¥{freightDetail.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setPickupCodeInput('');
        }}
        title="扫码核销"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-600">请扫描或输入揽收码</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">揽收码</label>
            <input
              type="text"
              value={pickupCodeInput}
              onChange={(e) => setPickupCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="请输入或扫描揽收码"
              className="w-full px-4 py-3 text-lg text-center font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
        <ModalFooter>
          <button
            onClick={() => {
              setShowScanModal(false);
              setPickupCodeInput('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleScan}
            disabled={loading}
            className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            确认核销
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showWeighModal}
        onClose={() => {
          setShowWeighModal(false);
          setWeightInput('');
          setScaleReading(null);
          setFreightDetail(null);
        }}
        title="称重"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-2">模拟称重读数</p>
            <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
              {scaleReading !== null ? (
                <span className={cn(simulatingScale && 'animate-pulse')}>
                  {scaleReading.toFixed(1)} <span className="text-2xl">kg</span>
                </span>
              ) : (
                <span className="text-gray-300">--.-</span>
              )}
            </div>
            <button
              onClick={simulateScaleReading}
              disabled={simulatingScale}
              className="px-4 py-2 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
            >
              {simulatingScale ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  读取中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  读取重量
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手动输入重量 (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightInput}
              onChange={(e) => {
                setWeightInput(e.target.value);
                if (e.target.value) {
                  handleCalculateFreight(parseFloat(e.target.value));
                }
              }}
              placeholder="请输入重量"
              className="w-full px-4 py-3 text-lg font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePhotoUpload}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Camera className="w-4 h-4" />
              拍照
            </button>
          </div>

          {freightDetail && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <h4 className="font-medium text-gray-900 mb-3">运费明细</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">基础运费</span>
                  <span>¥{freightDetail.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">续重费</span>
                  <span>¥{freightDetail.weightFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">保价费</span>
                  <span>¥{freightDetail.insurance.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold">合计</span>
                  <span className="text-xl font-bold text-primary">¥{freightDetail.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <button
            onClick={() => {
              setShowWeighModal(false);
              setWeightInput('');
              setScaleReading(null);
              setFreightDetail(null);
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmitWeight}
            disabled={loading || !weightInput}
            className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            确认称重
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPaymentMethod('');
        }}
        title="收款确认"
        size="lg"
      >
        <div className="space-y-6">
          {freightDetail && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">应收金额</p>
              <p className="text-5xl font-bold text-primary">¥{freightDetail.total.toFixed(2)}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">选择支付方式</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.key}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    selectedPaymentMethod === method.key
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.key}
                    checked={selectedPaymentMethod === method.key}
                    onChange={() => setSelectedPaymentMethod(method.key)}
                    className="sr-only"
                  />
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white', method.color)}>
                    {method.icon}
                  </div>
                  <span className="font-medium text-gray-900">{method.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <ModalFooter>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setSelectedPaymentMethod('');
            }}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmitPayment}
            disabled={loading || !selectedPaymentMethod}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            确认收款
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="打印面单"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">运单预览</h4>
              <p className="text-sm text-gray-500">标准快递面单 100x150mm</p>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">运单号</span>
                <span className="font-mono font-medium">{currentTask.waybillNo || '待生成'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">寄件人</span>
                <span className="font-medium">{order?.sender.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">收件人</span>
                <span className="font-medium">{order?.receiver.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">重量</span>
                <span className="font-medium">{currentTask.actualWeight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">运费</span>
                <span className="font-semibold text-primary">¥{currentTask.freight?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择打印机</label>
            <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="default">默认打印机 (HP LaserJet)</option>
              <option value="mobile">便携蓝牙打印机</option>
              <option value="office">办公室打印机</option>
            </select>
          </div>
        </div>
        <ModalFooter>
          <button
            onClick={() => setShowPrintModal(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            className="px-4 py-2 text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Printer className="w-4 h-4" />
            打印
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default TaskDetail;
