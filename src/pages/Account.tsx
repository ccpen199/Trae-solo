import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

export default function Account() {
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [user, setUser] = useState<any>(null);
  const { logout } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountRes, paymentsRes, userRes] = await Promise.all([
        api.accounts.balance(),
        api.accounts.payments({ limit: 10 }),
        api.accounts.security(),
      ]);
      setBalance(accountRes.data.account?.balance || 0);
      setPayments(paymentsRes.data.list || []);
      setUser(userRes.data.user);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('请输入有效的充值金额');
      return;
    }
    try {
      await api.accounts.recharge(parseFloat(rechargeAmount));
      alert('充值成功');
      setRechargeAmount('');
      loadData();
    } catch (err: any) {
      alert(err.message || '充值失败');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('请输入有效的提现金额');
      return;
    }
    if (parseFloat(withdrawAmount) > balance) {
      alert('余额不足');
      return;
    }
    try {
      await api.accounts.withdraw(parseFloat(withdrawAmount));
      alert('提现成功');
      setWithdrawAmount('');
      loadData();
    } catch (err: any) {
      alert(err.message || '提现失败');
    }
  };

  const paymentTypeMap: Record<string, string> = {
    recharge: '充值',
    withdraw: '提现',
    payment: '支付',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">账户中心</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">账户余额</h2>
          <p className="text-4xl font-bold text-blue-600">¥{balance.toLocaleString()}</p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                充值金额
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入金额"
                />
                <button
                  onClick={handleRecharge}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  充值
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提现金额
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入金额"
                />
                <button
                  onClick={handleWithdraw}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  提现
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h2>
          {user && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">用户名</p>
                <p className="font-medium text-gray-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">真实姓名</p>
                <p className="font-medium text-gray-900">{user.real_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">实名认证</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.is_verified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.is_verified ? '已认证' : '未认证'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">注册时间</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">交易记录</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无交易记录</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">交易号</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">类型</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">金额</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{payment.transaction_no || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.type === 'recharge' || payment.type === 'payment'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {paymentTypeMap[payment.type] || payment.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ¥{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
