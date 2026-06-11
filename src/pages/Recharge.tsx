import { useState } from 'react';
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
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

export default function Recharge() {
  const { etcCard, rechargeMethods, rechargeOrders, rechargeBalance } = useStore();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState(200);
  const [payChannel, setPayChannel] = useState<'wechat' | 'alipay' | 'bank'>('wechat');
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);
  const [autoPayThreshold, setAutoPayThreshold] = useState(100);
  const [autoPayAmount, setAutoPayAmount] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleRecharge = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    rechargeBalance(amount);
    setIsProcessing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAutoPaySave = () => {
    console.log('自动代扣设置:', { autoPayThreshold, autoPayAmount, payChannel });
    setShowAutoPayModal(false);
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

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">充值中心</h1>
          <p className="text-dark-500">为您的粤通卡账户充值，支持多种充值方式</p>
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
                      `确认充值 ¥${amount.toFixed(2)}`
                    )}
                  </button>
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
              <div className="p-4 bg-primary-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span className="font-medium text-primary-800">智能代扣已开启</span>
                </div>
                <p className="text-sm text-primary-600">
                  当余额低于 ¥{autoPayThreshold} 时，自动充值 ¥{autoPayAmount}
                </p>
                <p className="text-xs text-primary-500 mt-2">
                  绑定支付方式：{payChannels.find((c) => c.id === payChannel)?.name}
                </p>
              </div>
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
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      代扣支付方式
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {payChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => setPayChannel(channel.id)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            payChannel === channel.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-dark-200'
                          }`}
                        >
                          <p className="text-xl mb-1">{channel.icon}</p>
                          <p className="text-xs font-medium text-dark-800">{channel.name}</p>
                        </button>
                      ))}
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
                    className="flex-1 btn-primary"
                  >
                    保存设置
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
