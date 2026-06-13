import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Bluetooth,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Bell,
  Plus,
  Minus,
  ChevronRight,
  Link2,
  Shield,
  History,
  RefreshCw,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

export default function Recharge() {
  const location = useLocation();
  const {
    etcCard,
    rechargeMethods,
    rechargeOrders,
    rechargeBalance,
    autoPayConfig,
    updateAutoPayConfig,
    authorizePayChannel,
    triggerAutoPayForPending,
  } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(
    rechargeMethods.find((method) => method.available)?.id || null
  );
  const [amount, setAmount] = useState(200);
  const [payChannel, setPayChannel] = useState<'wechat' | 'alipay' | 'bank'>(autoPayConfig.payChannel);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [autoPayThreshold, setAutoPayThreshold] = useState(autoPayConfig.threshold);
  const [autoPayAmount, setAutoPayAmount] = useState(autoPayConfig.rechargeAmount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastRechargeAmount, setLastRechargeAmount] = useState<number | null>(null);
  const [autoPaySaving, setAutoPaySaving] = useState(false);
  const [autoPayStatusMessage, setAutoPayStatusMessage] = useState('');
  const [authResultMessage, setAuthResultMessage] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const state = location.state as { openAutoPay?: boolean; payChannel?: string } | null;
    if (state?.openAutoPay) {
      if (state.payChannel) {
        setPayChannel(state.payChannel as 'wechat' | 'alipay' | 'bank');
      }
      setShowAutoPayModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleRecharge = async () => {
    if (!selectedMethod) return;
    setLastRechargeAmount(null);
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    rechargeBalance(amount);
    setIsProcessing(false);
    setLastRechargeAmount(amount);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAutoPaySave = async () => {
    setAutoPaySaving(true);
    const channelAuthorizedBefore = isChannelAuthorized(payChannel);
    if (!channelAuthorizedBefore) {
      await authorizePayChannel(payChannel);
    }
    updateAutoPayConfig({
      enabled: true,
      threshold: autoPayThreshold,
      rechargeAmount: autoPayAmount,
      payChannel,
    });
    const channelName = payChannel === 'wechat' ? '微信' : payChannel === 'alipay' ? '支付宝' : '银行卡';
    setAuthResultMessage({
      success: true,
      message: `${channelName}代扣授权已恢复，签约状态正常`,
    });
    setTimeout(() => setAuthResultMessage(null), 5000);
    const autoPayTriggered = await triggerAutoPayForPending();
    const pendingBefore = useStore.getState().trafficRecords.filter(
      (r) => r.status === '待扣费' && !r.isHolidayFree
    ).length;
    if (autoPayTriggered) {
      setAutoPayStatusMessage(
        pendingBefore > 0
          ? `代扣设置已保存，成功补缴 ${pendingBefore} 笔待扣费记录`
          : '代扣设置已保存，当前暂无待扣费记录'
      );
    } else {
      const records = useStore.getState().trafficRecords.filter(
        (r) => r.status === '待扣费' && !r.isHolidayFree
      );
      const hasFail = records.some((r) => r.autoPayResult === 'failed');
      setAutoPayStatusMessage(
        hasFail
          ? '代扣设置已保存，但仍有待扣费记录，请到通行记录页面手动补缴'
          : '代扣设置已保存，支付渠道授权状态已更新'
      );
    }
    setAutoPaySaving(false);
    setShowAutoPayModal(false);
    setTimeout(() => setAutoPayStatusMessage(''), 6000);
  };

  const handleTriggerAutoPay = async () => {
    setAutoPaySaving(true);
    const success = await triggerAutoPayForPending();
    const remaining = useStore.getState().trafficRecords.filter(
      (r) => r.status === '待扣费' && !r.isHolidayFree
    ).length;
    if (success) {
      setAutoPayStatusMessage(remaining === 0 ? '代扣执行成功，所有待扣费记录已完成补缴' : `代扣执行成功，剩余 ${remaining} 笔待处理`);
    } else {
      setAutoPayStatusMessage('代扣执行失败，请检查支付渠道授权状态');
    }
    setAutoPaySaving(false);
    setTimeout(() => setAutoPayStatusMessage(''), 5000);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'nfc':
        return Smartphone;
      case 'bluetooth':
        return Bluetooth;
      default:
        return CreditCard;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'text-success';
      case '支付中':
        return 'text-warning';
      case '已失败':
        return 'text-danger';
      default:
        return 'text-dark-500';
    }
  };

  const payChannels = [
    { id: 'wechat' as const, name: '微信支付', color: '#07C160', icon: '💚' },
    { id: 'alipay' as const, name: '支付宝', color: '#1677FF', icon: '💙' },
    { id: 'bank' as const, name: '银行卡', color: '#0F52BA', icon: '💳' },
  ];

  const isChannelAuthorized = (channel: 'wechat' | 'alipay' | 'bank') => {
    if (channel === 'wechat') return autoPayConfig.wechatAuthorized;
    if (channel === 'alipay') return autoPayConfig.alipayAuthorized;
    return autoPayConfig.bankAuthorized;
  };

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">充值中心 · 提交订单</h1>
          <p className="text-dark-500">为您的粤通卡账户购买充值服务，支持多种充值方式</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gradient-hero rounded-2xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/70 text-sm mb-1">当前余额</p>
                    <p className="text-5xl font-bold font-mono animate-number">
                      ¥{etcCard.balance.toFixed(2)}
                    </p>
                  </div>
                  {etcCard.balance < 100 && etcCard.type === '储值卡' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-accent-500/20 rounded-lg animate-pulse-slow">
                      <Bell className="w-5 h-5 text-accent-300" />
                      <span className="text-accent-200">余额不足</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    {etcCard.cardNo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {etcCard.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    有效期至 {etcCard.expiryDate}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary-500" />
                选择充值方式
              </h3>
              <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                已默认选择可用的在线充值方式，充值金额和支付渠道确认后可直接提交订单。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rechargeMethods.map((method) => {
                  const Icon = getMethodIcon(method.type);
                  return (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={!method.available}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-50 shadow-lg'
                          : 'border-dark-200 bg-white hover:border-primary-300'
                      } ${!method.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        selectedMethod === method.id ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-600'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-dark-800 mb-1">{method.name}</h4>
                      <p className="text-sm text-dark-500">{method.description}</p>
                      {!method.available && (
                        <p className="text-xs text-danger mt-2 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          暂不可用
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence>
              {selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold text-dark-800 mb-4">充值金额</h3>
                  
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {quickAmounts.map((val) => (
                      <motion.button
                        key={val}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setAmount(val)}
                        className={`py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                          amount === val
                            ? 'bg-primary-500 text-white shadow-lg'
                            : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                        }`}
                      >
                        ¥{val}
                      </motion.button>
                    ))}
                    <div className="flex items-center justify-center gap-2 py-4 px-3 rounded-xl bg-dark-100">
                      <button
                        onClick={() => setAmount(Math.max(50, amount - 50))}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-dark-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Math.max(50, Number(e.target.value)))}
                        className="w-20 text-center bg-transparent font-semibold text-dark-800 focus:outline-none"
                      />
                      <button
                        onClick={() => setAmount(amount + 50)}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-dark-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-medium text-dark-700 mb-3">选择支付方式</p>
                    <div className="grid grid-cols-3 gap-3">
                      {payChannels.map((channel) => (
                        <motion.button
                          key={channel.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPayChannel(channel.id)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            payChannel === channel.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-dark-200 hover:border-dark-300'
                          }`}
                        >
                          <p className="text-2xl mb-1">{channel.icon}</p>
                          <p className="text-sm font-medium text-dark-800">{channel.name}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl mb-6">
                    <div>
                      <p className="text-dark-500">充值金额</p>
                      <p className="text-3xl font-bold text-accent-500 font-mono">¥{amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-dark-500 text-sm">
                        {etcCard.type === '储值卡' ? '储值卡95折优惠' : ''}
                      </p>
                      <p className="text-success text-sm">
                        {etcCard.type === '储值卡' ? `预计可省 ¥${(amount * 0.05).toFixed(2)}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRecharge}
                    disabled={isProcessing || amount < 50}
                    className="w-full btn-primary text-lg py-4"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        充值处理中...
                      </span>
                    ) : (
                      `提交订单 ¥${amount.toFixed(2)}`
                    )}
                  </button>

                  {lastRechargeAmount !== null && !isProcessing && (
                    <div className="mt-4 rounded-xl border border-success/30 bg-green-50 p-4 text-success">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-none" />
                        <div>
                          <p className="font-semibold">充值成功</p>
                          <p className="mt-1 text-sm text-dark-600">
                            订单已完成，¥{lastRechargeAmount.toFixed(2)} 已到账，充值记录已同步更新。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary-500" />
                  自动代扣管理
                </h3>
                <button
                  onClick={() => setShowAutoPayModal(true)}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  设置代扣
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className={`p-4 rounded-xl ${
                autoPayConfig.enabled ? 'bg-primary-50' : 'bg-dark-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className={`w-5 h-5 ${
                    autoPayConfig.enabled ? 'text-primary-500' : 'text-dark-400'
                  }`} />
                  <span className={`font-medium ${
                    autoPayConfig.enabled ? 'text-primary-800' : 'text-dark-600'
                  }`}>
                    {autoPayConfig.enabled ? '智能代扣已开启' : '智能代扣未开启'}
                  </span>
                  {autoPayConfig.enabled && (
                    <span className="badge badge-success text-[10px] px-2 py-0.5">运行中</span>
                  )}
                </div>
                {autoPayConfig.enabled ? (
                  <>
                    <p className="text-sm text-primary-600">
                      当余额低于 ¥{autoPayConfig.threshold} 时，自动充值 ¥{autoPayConfig.rechargeAmount}
                    </p>
                    <p className="text-xs text-primary-500 mt-2">
                      绑定支付方式：{payChannels.find((c) => c.id === autoPayConfig.payChannel)?.name}
                      <span className="ml-1 text-success">
                        ({isChannelAuthorized(autoPayConfig.payChannel) ? '已授权' : '未授权'})
                      </span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-primary-200 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-primary-500">累计自动充值</p>
                        <p className="text-lg font-bold font-mono text-primary-700">
                          {autoPayConfig.totalAutoRechargeCount} 次
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-primary-500">累计充值金额</p>
                        <p className="text-lg font-bold font-mono text-primary-700">
                          ¥{autoPayConfig.totalAutoRechargeAmount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    {autoPayConfig.lastTriggeredAt && (
                      <p className="text-xs text-primary-400 mt-3 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        最近触发：{dayjs(autoPayConfig.lastTriggeredAt).format('MM-DD HH:mm')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-dark-500">
                    开通后，余额不足时自动充值，通行记录自动扣费
                  </p>
                )}
              </div>
              {autoPayConfig.enabled && (
                <button
                  onClick={handleTriggerAutoPay}
                  disabled={autoPaySaving}
                  className="w-full mt-4 btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${autoPaySaving ? 'animate-spin' : ''}`} />
                  {autoPaySaving ? '执行中...' : '立即执行代扣'}
                </button>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card p-6 sticky top-24"
            >
              <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary-500" />
                充值记录
              </h3>
              <div className="space-y-4">
                {rechargeOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
                    className="p-4 bg-dark-50 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-dark-800">{order.method}</p>
                        <p className="text-xs text-dark-500">
                          {dayjs(order.createdAt).format('MM-DD HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-dark-800 font-mono">+¥{order.amount.toFixed(2)}</p>
                        <p className={`text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dark-500">
                        {payChannels.find((c) => c.id === order.payChannel)?.icon}
                      </span>
                      <span className="text-xs text-dark-500">
                        {payChannels.find((c) => c.id === order.payChannel)?.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 right-8 z-50 p-6 bg-success text-white rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <CheckCircle className="w-8 h-8" />
              <div>
                <p className="font-semibold text-lg">充值成功</p>
                <p className="text-sm text-white/80">¥{amount.toFixed(2)} 已到账</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {authResultMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-20 left-8 z-50 max-w-md rounded-2xl p-5 text-white shadow-2xl ${
                authResultMessage.success ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              <div className="flex items-center gap-3">
                {authResultMessage.success ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {authResultMessage.success ? '授权恢复成功' : '授权失败'}
                  </p>
                  <p className="text-sm text-white/80">{authResultMessage.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {autoPayStatusMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 left-8 z-50 max-w-md rounded-2xl bg-primary-600 p-5 text-white shadow-2xl"
            >
              <p className="font-semibold">自动代扣已更新</p>
              <p className="text-sm text-white/80">{autoPayStatusMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAutoPayModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm"
              onClick={() => setShowAutoPayModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-dark-800 mb-6">自动代扣设置</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      余额预警阈值
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="50"
                        value={autoPayThreshold}
                        onChange={(e) => setAutoPayThreshold(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="font-bold text-primary-500 font-mono w-20 text-right">
                        ¥{autoPayThreshold}
                      </span>
                    </div>
                    <p className="text-xs text-dark-500 mt-1">
                      当余额低于此值时，自动触发充值
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      自动充值金额
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 200, 300, 500].map((val) => (
                        <button
                          key={val}
                          onClick={() => setAutoPayAmount(val)}
                          className={`py-3 rounded-lg font-semibold transition-all duration-200 ${
                            autoPayAmount === val
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                          }`}
                        >
                          ¥{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-3">
                      代扣支付方式
                    </label>
                    <div className="space-y-2">
                      {payChannels.map((channel) => {
                        const authorized = isChannelAuthorized(channel.id);
                        const isSelected = payChannel === channel.id;
                        return (
                          <button
                            key={channel.id}
                            onClick={() => setPayChannel(channel.id)}
                            className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-dark-200 hover:border-dark-300'
                            }`}
                          >
                            <span className="text-2xl">{channel.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-dark-800">{channel.name}</p>
                              <p className={`text-xs ${authorized ? 'text-success' : 'text-warning'} flex items-center gap-1`}>
                                {authorized ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    已授权
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3" />
                                    待授权（保存时自动完成）
                                  </>
                                )}
                              </p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-dark-300'
                            }`}>
                              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 rounded-lg border border-primary-100 bg-primary-50 p-3 text-xs text-primary-700">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        授权说明
                      </p>
                      <ul className="space-y-1 ml-4 list-disc">
                        <li>保存后将完成所选支付渠道的授权签约</li>
                        <li>余额低于阈值时自动充值，无需手动操作</li>
                        <li>通行记录中的待扣费将自动从账户扣除</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowAutoPayModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAutoPaySave}
                    disabled={autoPaySaving}
                    className="flex-1 btn-primary"
                  >
                    {autoPaySaving ? '保存并授权中...' : '保存设置'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
