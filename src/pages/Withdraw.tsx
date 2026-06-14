import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, CreditCard, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { get, post } from '../utils/request';
import { useUserStore } from '../stores/userStore';

const demoWithdrawUser = {
  coins: 2680,
  isVerified: true,
  alipayAccount: 'demo@alipay.com',
  wechatAccount: 'demo_wechat',
  bankCard: '6222000000001234',
};

const Withdraw = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, verifyIdentity, updateWithdrawAccount, fetchProfile } = useUserStore();
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('alipay');
  const [todayAmount, setTodayAmount] = useState(0);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [realName, setRealName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [account, setAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const dailyLimit = 200;
  const minWithdraw = 1;
  const maxWithdraw = 200;
  const activeUser = user || demoWithdrawUser;

  useEffect(() => {
    loadTodayLimit();
  }, [isLoggedIn]);

  const loadTodayLimit = async () => {
    try {
      const res: any = await get('/withdraw/today-limit');
      if (res.success) {
        setTodayAmount(res.todayAmount);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const methods = [
    { id: 'alipay', name: '支付宝', icon: '💙', color: 'bg-blue-50 border-blue-200' },
    { id: 'wechat', name: '微信支付', icon: '💚', color: 'bg-green-50 border-green-200' },
    { id: 'bank', name: '银行卡', icon: '💳', color: 'bg-purple-50 border-purple-200' },
  ];

  const quickAmounts = [10, 20, 50, 100];

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount < minWithdraw) {
      alert('请输入正确的提现金额');
      return;
    }

    if (!activeUser.isVerified) {
      setShowVerifyModal(true);
      return;
    }

    const accountMap: Record<string, string | undefined> = {
      alipay: activeUser.alipayAccount,
      wechat: activeUser.wechatAccount,
      bank: activeUser.bankCard,
    };

    if (!accountMap[selectedMethod]) {
      setShowAccountModal(true);
      return;
    }

    if (todayAmount + numAmount > dailyLimit) {
      alert(`今日已提现 ${todayAmount} 金币，单日上限 ${dailyLimit} 金币`);
      return;
    }

    if (numAmount > (activeUser.coins || 0)) {
      alert('金币余额不足');
      return;
    }

    if (!isLoggedIn) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/wallet');
      }, 1500);
      return;
    }

    setWithdrawing(true);
    try {
      const res: any = await post('/withdraw/apply', {
        amount: numAmount,
        method: selectedMethod,
      });
      if (res.success) {
        setShowSuccess(true);
        fetchProfile();
        loadTodayLimit();
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/wallet');
        }, 2000);
      } else {
        alert(res.message || '提现失败');
      }
    } catch (error: any) {
      alert(error.message || '提现失败');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleVerify = async () => {
    if (!realName || !idCard) {
      alert('请填写完整的实名信息');
      return;
    }
    const result = await verifyIdentity(realName, idCard);
    if (result.success) {
      setShowVerifyModal(false);
      alert('实名认证成功');
    } else {
      alert(result.message || '认证失败');
    }
  };

  const handleBindAccount = async () => {
    if (!account) {
      alert('请输入账号');
      return;
    }
    if (selectedMethod === 'bank' && !bankName) {
      alert('请输入银行名称');
      return;
    }
    const result = await updateWithdrawAccount(selectedMethod, account, bankName);
    if (result.success) {
      setShowAccountModal(false);
      setAccount('');
      setBankName('');
      alert('绑定成功');
    } else {
      alert(result.message || '绑定失败');
    }
  };

  const getAccountText = (): string => {
    const current = activeUser;
    const accountMap: Record<string, string | undefined> = {
      alipay: current.alipayAccount,
      wechat: current.wechatAccount,
      bank: current.bankCard,
    };
    const acc = accountMap[selectedMethod];
    if (!acc) return '未绑定';
    if (acc.length <= 4) return acc;
    return `${acc.slice(0, 3)}****${acc.slice(-4)}`;
  };

  const remainingToday = Math.max(0, dailyLimit - todayAmount);

  return (
    <div className="min-h-screen bg-dark-50">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <ArrowLeft size={24} className="text-dark-700" />
          </button>
          <h1 className="flex-1 text-center font-bold text-lg text-dark-800">提现中心</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-gradient-primary rounded-2xl p-5 text-white shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/80">可提现金币</span>
            <div className="flex items-center gap-1">
              <Shield size={16} />
              <span className="text-xs">安全保障</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <Coins size={28} className="text-yellow-300" />
            <span className="text-4xl font-bold">{(activeUser.coins || 0).toFixed(0)}</span>
          </div>
          <p className="text-white/70 text-sm mt-1">≈ {((activeUser.coins || 0) * 0.01).toFixed(2)} 元</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-dark-500">今日剩余可提</span>
            <span className="text-primary-500 font-medium">{remainingToday} / {dailyLimit} 金币</span>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((todayAmount / dailyLimit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-card">
          <label className="text-sm font-medium text-dark-600 mb-3 block">提现金额</label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-dark-800">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入金额"
              className="w-full pl-12 pr-4 py-4 text-3xl font-bold bg-dark-50 rounded-xl text-dark-800 placeholder-dark-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 text-sm">金币</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(String(val))}
                className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  amount === String(val)
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
          <p className="text-xs text-dark-400 mt-3">
            最低提现 {minWithdraw} 金币，单笔最高 {maxWithdraw} 金币
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-card">
          <label className="text-sm font-medium text-dark-600 mb-3 block">提现方式</label>
          <div className="space-y-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-dark-100 hover:border-dark-200'
                }`}
              >
                <div className="text-2xl">{method.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-dark-800">{method.name}</p>
                  <p className="text-xs text-dark-400">{getAccountText()}</p>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle size={22} className="text-primary-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {!activeUser.isVerified && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-700 font-medium">请先完成实名认证</p>
              <p className="text-orange-600 text-sm mt-1">根据监管要求，提现需完成实名认证</p>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="mt-2 text-orange-500 text-sm font-medium"
              >
                立即认证 →
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="w-full py-4 bg-gradient-primary text-white font-bold rounded-xl shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {withdrawing ? '提现中...' : '立即提现'}
        </button>

        <div className="text-center text-xs text-dark-400 mt-2">
          提现申请提交后将在 1-3 个工作日内到账
        </div>
      </div>

      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-dark-800 mb-4 text-center">实名认证</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-600 mb-1 block">真实姓名</label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="请输入真实姓名"
                  className="w-full px-4 py-3 bg-dark-50 rounded-xl border border-dark-200 focus:outline-none focus:border-primary-400"
                />
              </div>
              <div>
                <label className="text-sm text-dark-600 mb-1 block">身份证号</label>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="请输入身份证号码"
                  maxLength={18}
                  className="w-full px-4 py-3 bg-dark-50 rounded-xl border border-dark-200 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 py-3 bg-dark-100 text-dark-600 font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl"
              >
                提交认证
              </button>
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
            <h3 className="text-lg font-bold text-dark-800 mb-4 text-center">
              绑定{methods.find(m => m.id === selectedMethod)?.name}
            </h3>
            <div className="space-y-4">
              {selectedMethod === 'bank' && (
                <div>
                  <label className="text-sm text-dark-600 mb-1 block">银行名称</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="请输入银行名称"
                    className="w-full px-4 py-3 bg-dark-50 rounded-xl border border-dark-200 focus:outline-none focus:border-primary-400"
                  />
                </div>
              )}
              <div>
                <label className="text-sm text-dark-600 mb-1 block">
                  {selectedMethod === 'bank' ? '银行卡号' : '账号'}
                </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder={`请输入${selectedMethod === 'bank' ? '银行卡号' : '账号'}`}
                  className="w-full px-4 py-3 bg-dark-50 rounded-xl border border-dark-200 focus:outline-none focus:border-primary-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAccountModal(false)}
                className="flex-1 py-3 bg-dark-100 text-dark-600 font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleBindAccount}
                className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-xl"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-dark-800 mb-2">提现申请已提交</h3>
            <p className="text-dark-500">预计 1-3 个工作日到账</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
