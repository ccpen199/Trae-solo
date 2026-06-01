import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Car, Wallet, LogOut, CreditCard, History, Settings, Plus, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { setCurrentPage, logout, getUser, setUser } from '../lib/appState';
import api from '../lib/api';
import dayjs from 'dayjs';

export default function Profile() {
  const [user, setUserState] = useState<any>(getUser());
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [showReservations, setShowReservations] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [vehicleInfo, setVehicleInfo] = useState(user?.vehicle_info || '');

  useEffect(() => {
    const handleUserChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUserState(customEvent.detail);
      setNickname(customEvent.detail.nickname);
      setVehicleInfo(customEvent.detail.vehicle_info || '');
    };
    window.addEventListener('userchange', handleUserChange);
    return () => window.removeEventListener('userchange', handleUserChange);
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.charging.transactions();
      setTransactions(data.transactions);
      setShowTransactions(true);
    } catch (err) {
      console.error('Load transactions failed:', err);
    }
  };

  const loadReservations = async () => {
    try {
      const data = await api.charging.reservations();
      setReservations(data.reservations);
      setShowReservations(true);
    } catch (err) {
      console.error('Load reservations failed:', err);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) return;
    
    setLoading(true);
    try {
      const data = await api.auth.recharge(rechargeAmount);
      if (user) {
        const updatedUser = { ...user, balance: data.balance };
        setUser(updatedUser);
        setUserState(updatedUser);
      }
      setShowRecharge(false);
      alert(`充值成功！¥${rechargeAmount} 已到账`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const result = await api.auth.updateProfile({ nickname, vehicle_info: vehicleInfo });
      setUser(result.user);
      setUserState(result.user);
      setEditMode(false);
      alert('个人信息已更新');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请先登录</p>
          <button onClick={() => setCurrentPage('login')} className="px-6 py-2 bg-green-500 text-white rounded-xl">去登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-800 text-lg">个人中心</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.nickname}</h2>
                <p className="text-green-100 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-white/20 rounded-xl text-sm hover:bg-white/30 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {editMode ? (
            <div className="space-y-3 bg-white/10 rounded-xl p-4">
              <div>
                <label className="text-sm text-green-100 mb-1 block">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 rounded-lg text-white placeholder-green-200 outline-none"
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <label className="text-sm text-green-100 mb-1 block">车辆信息</label>
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 rounded-lg text-white placeholder-green-200 outline-none"
                  placeholder="例：京A12345 特斯拉Model 3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2 bg-white text-green-600 rounded-lg font-medium"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setNickname(user.nickname);
                    setVehicleInfo(user.vehicle_info || '');
                  }}
                  className="flex-1 py-2 bg-white/20 rounded-lg font-medium"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-100 mb-2">
                <Car className="w-4 h-4" />
                <span className="text-sm">车辆信息</span>
              </div>
              <p className="font-medium">{user.vehicle_info || '未设置'}</p>
            </div>
          )}

          <div className="mt-4 bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm mb-1">账户余额</div>
                <div className="text-3xl font-bold">¥{user.balance.toFixed(2)}</div>
              </div>
              <button
                onClick={() => setShowRecharge(true)}
                className="px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                充值
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => setCurrentPage('orders')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-800">充电订单</span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={loadReservations}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-800">预约记录</span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </button>
          <div className="border-t border-gray-100" />
          <button
            onClick={loadTransactions}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-800">交易记录</span>
            </div>
            <ArrowUpRight className="w-5 h-5 text-gray-400" />
          </button>
          {['operator', 'admin'].includes(user.role) && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => setCurrentPage('admin-dashboard')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-800">运营管理后台</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white rounded-2xl text-red-500 font-medium flex items-center justify-center gap-2 shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>

      {showRecharge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">账户充值</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[50, 100, 200, 500, 1000, 2000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setRechargeAmount(amount)}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${
                    rechargeAmount === amount
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ¥{amount}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-sm text-gray-500 mb-2 block">自定义金额</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-green-300 outline-none"
                min="1"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecharge(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRecharge}
                disabled={loading || rechargeAmount <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '充值中...' : `确认充值 ¥${rechargeAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">交易记录</h3>
              <button
                onClick={() => setShowTransactions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'recharge' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'recharge' ? (
                        <Plus className={`w-5 h-5 ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <ArrowUpRight className={`w-5 h-5 ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {tx.type === 'recharge' ? '账户充值' : tx.type === 'payment' ? '充电支付' : '退款'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {dayjs(tx.created_at).format('YYYY-MM-DD HH:mm')} · {tx.transaction_no}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'recharge' ? '+' : '-'}¥{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showReservations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">预约记录</h3>
              <button
                onClick={() => setShowReservations(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {reservations.map((r: any) => (
                <div key={r.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{r.station_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'active' ? 'bg-green-100 text-green-700' :
                      r.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.status === 'active' ? '进行中' :
                       r.status === 'completed' ? '已使用' :
                       r.status === 'cancelled' ? '已取消' : '已过期'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>{r.station_address}</p>
                    <p className="mt-1">枪号：{r.gun_no} · {r.vehicle_plate}</p>
                    <p className="mt-1">预约时间：{dayjs(r.reserve_time).format('YYYY-MM-DD HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
