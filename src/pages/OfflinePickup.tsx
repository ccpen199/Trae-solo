import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Scale,
  Calculator,
  CreditCard,
  Printer,
  ArrowLeft,
  Check,
  X,
  Camera,
  RefreshCw,
  Wifi,
  WifiOff,
  Smartphone,
  Wallet,
  Banknote,
  Loader2,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import type { PickupTask, PaymentMethod } from 'shared/types';
import { StepIndicator } from '@/components/StepIndicator';
import { useTaskStore } from '@/store/task';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const steps = [
  { label: '扫码核销', icon: QrCode },
  { label: '称重拍照', icon: Scale },
  { label: '运费计算', icon: Calculator },
  { label: '收款确认', icon: CreditCard },
  { label: '面单打印', icon: Printer },
];

const paymentMethods: { key: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'wechat', label: '微信支付', icon: <Smartphone className="w-8 h-8" />, color: 'bg-green-500' },
  { key: 'alipay', label: '支付宝', icon: <Wallet className="w-8 h-8" />, color: 'bg-blue-500' },
  { key: 'cash', label: '现金', icon: <Banknote className="w-8 h-8" />, color: 'bg-yellow-500' },
  { key: 'account', label: '账户扣款', icon: <CreditCard className="w-8 h-8" />, color: 'bg-purple-500' },
];

const mockTask: PickupTask = {
  id: 'task-offline-001',
  taskNo: 'TASK20240115001',
  orderId: 'order-001',
  orderNo: 'ORD20240115001',
  courierId: '1',
  courierName: '张快递',
  outletId: '1',
  pickupCode: 'PK882345',
  senderAddress: '北京市朝阳区建国路88号SOHO现代城A座1001室',
  senderPhone: '13800138001',
  itemType: '电子产品',
  estimatedWeight: 2.5,
  appointmentTime: new Date().toISOString(),
  status: 'assigned',
  weightCheckRule: 'tolerance',
  weightTolerance: 0.2,
  createdAt: new Date().toISOString(),
  synced: false,
};

const OfflinePickup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');

  const {
    loading,
    getTaskById,
    scanPickupCode,
    submitWeight,
    submitPayment,
    printWaybill,
    calculateFreight,
    getPendingSyncCount,
    setCurrentTask,
  } = useTaskStore();

  const { addNotification, setOfflineMode } = useAppStore();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [manualWeight, setManualWeight] = useState('');
  const [scaleReading, setScaleReading] = useState<number | null>(null);
  const [simulatingScale, setSimulatingScale] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [freightDetail, setFreightDetail] = useState<{ baseFee: number; weightFee: number; insurance: number; total: number } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [printing, setPrinting] = useState(false);
  const [printComplete, setPrintComplete] = useState(false);
  const [task, setTask] = useState<PickupTask | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setOfflineMode(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineMode]);

  useEffect(() => {
    loadTask();
    return () => {
      setCurrentTask(null);
    };
  }, [taskId]);

  const loadTask = async () => {
    if (taskId) {
      try {
        const loadedTask = await getTaskById(taskId);
        setTask(loadedTask || mockTask);
        if (loadedTask) {
          setPickupCodeInput(loadedTask.pickupCode);
        }
      } catch {
        setTask(mockTask);
        setPickupCodeInput(mockTask.pickupCode);
      }
    } else {
      setTask(mockTask);
    }
  };

  const pendingSyncCount = getPendingSyncCount();

  const handleScan = useCallback(async () => {
    if (!pickupCodeInput.trim()) {
      addNotification({
        type: 'warning',
        title: '请输入揽收码',
        message: '请输入或扫描揽收码',
      });
      return;
    }

    try {
      const result = await scanPickupCode(pickupCodeInput);
      if (result) {
        setScanResult('success');
        setTask(result);
        addNotification({
          type: 'success',
          title: '扫码成功',
          message: '揽收码验证通过',
        });
        setTimeout(() => {
          setCurrentStep(1);
          setScanResult(null);
        }, 1500);
      } else {
        setScanResult('error');
        addNotification({
          type: 'error',
          title: '扫码失败',
          message: '揽收码无效或不存在',
        });
        setTimeout(() => setScanResult(null), 2000);
      }
    } catch (err: any) {
      setScanResult('error');
      addNotification({
        type: 'error',
        title: '扫码失败',
        message: err.message || '请稍后重试',
      });
      setTimeout(() => setScanResult(null), 2000);
    }
  }, [pickupCodeInput, scanPickupCode, addNotification]);

  const simulateScaleReading = useCallback(() => {
    setSimulatingScale(true);
    setScaleReading(null);
    let count = 0;
    const interval = setInterval(() => {
      setScaleReading(Math.round((Math.random() * 5 + 1) * 10) / 10);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalWeight = Math.round((Math.random() * 3 + 1) * 10) / 10;
        setScaleReading(finalWeight);
        setWeight(finalWeight);
        setManualWeight(finalWeight.toString());
        setSimulatingScale(false);
        handleCalculateFreight(finalWeight);
      }
    }, 150);
  }, []);

  const handleCalculateFreight = useCallback(async (w?: number) => {
    const weightValue = w ?? weight ?? parseFloat(manualWeight);
    if (isNaN(weightValue) || weightValue <= 0) return;

    try {
      const detail = await calculateFreight(weightValue, task?.itemType || '普通物品');
      setFreightDetail(detail);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '运费计算失败',
        message: err.message || '请稍后重试',
      });
    }
  }, [weight, manualWeight, task?.itemType, calculateFreight, addNotification]);

  const handleWeightConfirm = useCallback(async () => {
    const weightValue = parseFloat(manualWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      addNotification({
        type: 'warning',
        title: '请输入有效重量',
        message: '重量必须大于0',
      });
      return;
    }

    if (!task) return;

    try {
      await submitWeight(task.id, weightValue, photos);
      setWeight(weightValue);
      addNotification({
        type: 'success',
        title: '称重成功',
        message: `实际重量: ${weightValue} kg`,
      });
      setCurrentStep(2);
      setTimeout(() => handleCalculateFreight(weightValue), 500);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '称重失败',
        message: err.message || '请稍后重试',
      });
    }
  }, [manualWeight, task, photos, submitWeight, handleCalculateFreight, addNotification]);

  const handlePhotoUpload = useCallback(() => {
    const newPhoto = `https://picsum.photos/seed/${Date.now()}/300/300`;
    setPhotos(prev => [...prev, newPhoto]);
    addNotification({
      type: 'success',
      title: '拍照成功',
      message: '照片已保存',
    });
  }, [addNotification]);

  const handlePaymentConfirm = useCallback(async () => {
    if (!selectedPaymentMethod || !freightDetail || !task) return;

    try {
      await submitPayment(task.id, selectedPaymentMethod, freightDetail.total);
      addNotification({
        type: 'success',
        title: '收款成功',
        message: `已收款 ¥${freightDetail.total.toFixed(2)}`,
      });
      setCurrentStep(4);
    } catch (err: any) {
      addNotification({
        type: 'error',
        title: '收款失败',
        message: err.message || '请稍后重试',
      });
    }
  }, [selectedPaymentMethod, freightDetail, task, submitPayment, addNotification]);

  const handlePrint = useCallback(async () => {
    if (!task) return;

    setPrinting(true);
    try {
      await printWaybill(task.id);
      setPrinting(false);
      setPrintComplete(true);
      addNotification({
        type: 'success',
        title: '打印成功',
        message: '面单已发送至打印机',
      });
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    } catch (err: any) {
      setPrinting(false);
      addNotification({
        type: 'error',
        title: '打印失败',
        message: err.message || '请稍后重试',
      });
    }
  }, [task, printWaybill, navigate, addNotification]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/tasks');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className={cn(
              'w-48 h-48 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500',
              scanResult === 'success' ? 'bg-green-500/20' :
              scanResult === 'error' ? 'bg-red-500/20' :
              'bg-white/10'
            )}>
              {scanResult === 'success' ? (
                <Check className="w-24 h-24 text-green-400 animate-bounce-slow" />
              ) : scanResult === 'error' ? (
                <X className="w-24 h-24 text-red-400 animate-shake" />
              ) : (
                <QrCode className="w-24 h-24 text-white/60" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">扫描揽收码</h2>
            <p className="text-white/60 mb-8 text-center">
              使用扫描枪扫描或手动输入揽收码
            </p>

            <div className="w-full max-w-md space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  placeholder="请输入或扫描揽收码"
                  className="w-full px-6 py-4 text-2xl text-center font-mono bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  autoFocus
                />
              </div>

              <button
                onClick={handleScan}
                disabled={loading || scanResult !== null}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-2xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <QrCode className="w-6 h-6" />
                    确认核销
                  </>
                )}
              </button>
            </div>

            {task && scanResult === null && (
              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 max-w-md w-full">
                <h3 className="text-white font-medium mb-2">当前任务信息</h3>
                <div className="space-y-2 text-sm text-white/60">
                  <p>任务编号: {task.taskNo}</p>
                  <p>寄件地址: {task.senderAddress}</p>
                  <p>物品类型: {task.itemType}</p>
                  <p>预估重量: {task.estimatedWeight} kg</p>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center py-8 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-white/60 text-sm mb-4">称重读数</p>
                <div className="text-7xl font-mono font-bold text-white mb-4">
                  {scaleReading !== null ? (
                    <span className={cn(simulatingScale && 'animate-pulse')}>
                      {scaleReading.toFixed(1)} <span className="text-3xl text-white/60">kg</span>
                    </span>
                  ) : (
                    <span className="text-white/30">--.-</span>
                  )}
                </div>
                <button
                  onClick={simulateScaleReading}
                  disabled={simulatingScale}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-all flex items-center gap-2 mx-auto"
                >
                  {simulatingScale ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      读取中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      读取重量
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">手动输入重量 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={manualWeight}
                  onChange={(e) => {
                    setManualWeight(e.target.value);
                    if (e.target.value) {
                      setWeight(parseFloat(e.target.value));
                    }
                  }}
                  placeholder="请输入重量"
                  className="w-full px-6 py-4 text-xl font-mono bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors text-center"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">照片凭证 ({photos.length}/3)</label>
                <div className="flex gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <button
                      onClick={handlePhotoUpload}
                      className="w-20 h-20 bg-white/10 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center text-white/60 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-xs">拍照</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleWeightConfirm}
                disabled={!weight && !manualWeight}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-semibold rounded-2xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                <Scale className="w-6 h-6" />
                确认称重
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Calculator className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">运费计算</h2>
                <p className="text-white/60">系统自动计算运费明细</p>
              </div>

              {weight && (
                <div className="text-center py-4">
                  <p className="text-white/60 text-sm mb-1">计费重量</p>
                  <p className="text-4xl font-bold text-white">{weight.toFixed(1)} <span className="text-xl text-white/60">kg</span></p>
                </div>
              )}

              {freightDetail ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex justify-between text-white/80">
                      <span>基础运费</span>
                      <span>¥{freightDetail.baseFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>续重费</span>
                      <span>¥{freightDetail.weightFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>保价费</span>
                      <span>¥{freightDetail.insurance.toFixed(2)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between">
                      <span className="text-white font-medium">应收金额</span>
                      <span className="text-4xl font-bold text-cyan-400">¥{freightDetail.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-white/70">
                        <p className="font-medium text-cyan-400 mb-1">计费说明</p>
                        <p>基础运费 ¥12.00 (1kg以内)，续重 ¥3.00/kg，保价费根据物品类型计算。</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(3)}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-2xl hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center gap-3"
                  >
                    <CreditCard className="w-6 h-6" />
                    去收款
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <p className="text-white/60">正在计算运费...</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">收款确认</h2>
                <p className="text-white/60">请选择支付方式</p>
              </div>

              {freightDetail && (
                <div className="text-center py-4">
                  <p className="text-white/60 text-sm mb-1">应收金额</p>
                  <p className="text-5xl font-bold text-cyan-400">¥{freightDetail.total.toFixed(2)}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <label
                    key={method.key}
                    className={cn(
                      'flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all',
                      selectedPaymentMethod === method.key
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
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
                    <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white', method.color)}>
                      {method.icon}
                    </div>
                    <span className="font-medium text-white">{method.label}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handlePaymentConfirm}
                disabled={!selectedPaymentMethod || loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg font-semibold rounded-2xl hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    确认收款
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <div className={cn(
                  'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4',
                  printComplete ? 'bg-green-500/20' : 'bg-white/10'
                )}>
                  {printComplete ? (
                    <Check className="w-10 h-10 text-green-400 animate-bounce-slow" />
                  ) : (
                    <Printer className="w-10 h-10 text-purple-400" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {printComplete ? '打印完成' : '面单打印'}
                </h2>
                <p className="text-white/60">
                  {printComplete ? '即将返回任务列表' : '准备打印快递面单'}
                </p>
              </div>

              {!printComplete && (
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-32 h-48 bg-white/10 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-white/30">
                      <FileText className="w-12 h-12 text-white/40 mb-2" />
                      <span className="text-xs text-white/40">面单预览</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/80">
                      <span>运单号</span>
                      <span className="font-mono">{task?.waybillNo || '待生成'}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>重量</span>
                      <span>{weight?.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>运费</span>
                      <span className="text-cyan-400 font-semibold">¥{freightDetail?.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <label className="block text-white/60 text-sm mb-2">选择打印机</label>
                    <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-400">
                      <option value="default">便携蓝牙打印机</option>
                      <option value="office">办公室打印机</option>
                    </select>
                  </div>
                </div>
              )}

              {!printComplete && (
                <button
                  onClick={handlePrint}
                  disabled={printing}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                  {printing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      打印中...
                    </>
                  ) : (
                    <>
                      <Printer className="w-6 h-6" />
                      打印面单
                    </>
                  )}
                </button>
              )}

              {printComplete && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                  <p className="text-green-400 font-medium">✓ 揽收作业完成</p>
                  <p className="text-white/60 text-sm mt-1">数据将在网络恢复后自动同步</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="flex items-center gap-4">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
            isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                在线
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                离线模式
              </>
            )}
          </div>

          {pendingSyncCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {pendingSyncCount} 条待同步
            </div>
          )}
        </div>

        <div className="w-10" />
      </div>

      <div className="px-6 py-4">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          size="sm"
          className="max-w-2xl mx-auto"
        />
      </div>

      {renderStepContent()}

      <div className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-white/40 max-w-md mx-auto">
          <span>快递员: {user?.name || '张快递'}</span>
          <span>网点: {user?.outletName || '朝阳区网点'}</span>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default OfflinePickup;
