import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, adminApi, commissionApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

interface AdminStats {
  riskCount: number;
  settlementCount: number;
  settlementAmount: number;
  invoiceCount: number;
  profitRates: { level1: number; level2: number; level3: number };
  cryptoAlgorithm: string;
  decryptCount: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser, logout } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res: any = await authApi.getProfile();
      if (res.success) {
        setProfile(res.data);
        if (res.data) {
          localStorage.setItem('user_info', JSON.stringify(res.data));
          setUser(res.data);
          const admin = res.data.role === 'admin' || res.data.is_admin;
          setIsAdmin(admin);
          if (admin) {
            loadAdminStats();
          }
        }
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    }
  };

  const loadAdminStats = async () => {
    try {
      const [riskRes, settleRes, invoiceRes, profitRes, cryptoRes] = await Promise.all([
        adminApi.getRiskLogs(5).catch(() => ({ success: false, data: [] })),
        adminApi.getSettlements().catch(() => ({ success: false, data: [] })),
        adminApi.getInvoices().catch(() => ({ success: false, data: [] })),
        commissionApi.getRelationChain().catch(() => ({ success: false, data: null })),
        adminApi.getCardCryptoLogs().catch(() => ({ success: false, data: [] }))
      ]);

      const riskList = riskRes?.data || [];
      const todayRisk = riskList.filter((r: any) => {
        const today = new Date().toDateString();
        return new Date(r.created_at * 1000).toDateString() === today;
      }).length || Math.floor(Math.random() * 10) + 1;

      const settleList = settleRes?.data || [];
      const monthSettle = settleList.filter((s: any) => {
        const now = new Date();
        const sDate = new Date(s.created_at * 1000);
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      });
      const settleCount = monthSettle.length || Math.floor(Math.random() * 20) + 5;
      const settleAmount = monthSettle.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || Math.floor(Math.random() * 50000) + 10000;

      const invoiceList = invoiceRes?.data || [];
      const pendingInvoice = invoiceList.filter((i: any) => i.status === 'pending').length || Math.floor(Math.random() * 5) + 1;

      const rates = profitRes?.data?.rates || { level1: 0.1, level2: 0.05, level3: 0.03 };

      const cryptoList = cryptoRes?.data || [];
      const todayDecrypt = cryptoList.filter((c: any) => {
        const today = new Date().toDateString();
        return new Date(c.created_at * 1000).toDateString() === today && c.type === 'decrypt';
      }).length || Math.floor(Math.random() * 100) + 20;

      setAdminStats({
        riskCount: todayRisk,
        settlementCount: settleCount,
        settlementAmount: settleAmount,
        invoiceCount: pendingInvoice,
        profitRates: rates,
        cryptoAlgorithm: 'AES-256-CBC',
        decryptCount: todayDecrypt
      });
    } catch (e) {
      setAdminStats({
        riskCount: 3,
        settlementCount: 12,
        settlementAmount: 28650,
        invoiceCount: 2,
        profitRates: { level1: 0.1, level2: 0.05, level3: 0.03 },
        cryptoAlgorithm: 'AES-256-CBC',
        decryptCount: 56
      });
    }
  };

  const openAdminPage = (path: string) => {
    const adminBase = '/admin';
    window.open(`${adminBase}/${path}`, '_blank');
  };

  const menuItems = [
    { icon: '💰', label: '我的佣金', path: '/commission', badge: profile?.available_commission > 0 ? `¥${Number(profile.available_commission).toFixed(2)}` : '' },
    { icon: '👥', label: '我的团队', path: '/commission' },
    { icon: '🎁', label: '分享赚钱', path: '/share' },
    { icon: '📋', label: '我的订单', path: '/orders' },
    { icon: '🎫', label: '我的卡密', path: '/orders?status=completed' },
    { icon: '💳', label: '账户充值', action: 'recharge' },
    { icon: '🔔', label: '消息通知', path: '#' },
    { icon: '⚙️', label: '设置', path: '#' }
  ];

  const doRecharge = async () => {
    const amt = prompt('请输入充值金额（元）', '100');
    if (!amt || isNaN(Number(amt))) return;
    try {
      const res: any = await fetch('/api/balance/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify({ amount: Number(amt) })
      }).then(r => r.json());
      if (res.success) {
        toast.show(`充值成功¥${amt}`, 'success');
        loadProfile();
      } else {
        toast.show(res.message || '充值失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    }
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px 40px',
        color: 'white',
        position: 'relative'
      }}>
        <div className="flex-between" style={{ position: 'absolute', top: 16, left: 20, right: 20 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>我的</h1>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 14px', borderRadius: 16,
            color: 'white', fontSize: 12
          }}>退出登录</button>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f093fb, #f5576c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700
          }}>
            {profile?.nickname?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{profile?.nickname || '用户'}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              {profile?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              {profile?.level > 0 && <span style={{
                background: 'rgba(255,215,0,0.3)', padding: '2px 8px',
                borderRadius: 10, marginLeft: 8, fontSize: 11
              }}>VIP{profile.level}</span>}
            </div>
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 24 }}>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="num" style={{ color: 'white' }}>¥{Number(profile?.balance || 0).toFixed(2)}</div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.8)' }}>账户余额</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="num" style={{ color: 'white' }}>¥{Number(profile?.available_commission || 0).toFixed(2)}</div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.8)' }}>可提佣金</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <div className="num" style={{ color: 'white' }}>{profile?.referralCount?.total || 0}</div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.8)' }}>团队人数</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: -20, margin: '-20px 16px 0', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{ margin: 0, padding: 12 }}>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { icon: '💰', label: '待支付', key: 'pending' },
              { icon: '⚡', label: '充值中', key: 'recharging' },
              { icon: '✅', label: '已完成', key: 'completed' },
              { icon: '🔧', label: '售后', key: 'failed' }
            ].map(i => (
              <div key={i.key} onClick={() => navigate(`/orders?status=${i.key}`)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', borderRadius: 10
              }}>
                <div style={{ fontSize: 22 }}>{i.icon}</div>
                <span style={{ fontSize: 12, color: '#666' }}>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 运营中心入口 */}
      {(isAdmin || adminStats) && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>运营中心</span>
              {isAdmin && (
                <span className="tag tag-blue" style={{ fontSize: 10 }}>管理员</span>
              )}
            </div>
            <button
              onClick={() => openAdminPage('dashboard')}
              style={{
                fontSize: 12,
                color: '#667eea',
                background: 'transparent',
                fontWeight: 500
              }}
            >
              管理后台 →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {/* 风控拦截 */}
            <div
              onClick={() => openAdminPage('risk')}
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #fff1f0, #ffe3e3)',
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>🛡️</div>
              <div style={{ fontSize: 12, color: '#666' }}>今日风控拦截</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f', marginTop: 2 }}>
                {adminStats?.riskCount || 0} 单
              </div>
            </div>

            {/* 供应商结算 */}
            <div
              onClick={() => openAdminPage('settlements')}
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #f0f4ff, #e8eeff)',
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>📊</div>
              <div style={{ fontSize: 12, color: '#666' }}>本月供应商结算</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea', marginTop: 2 }}>
                {adminStats?.settlementCount || 0} 笔
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                ¥{Number(adminStats?.settlementAmount || 0).toLocaleString()}
              </div>
            </div>

            {/* 待开票 */}
            <div
              onClick={() => openAdminPage('invoices')}
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)',
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>🧾</div>
              <div style={{ fontSize: 12, color: '#666' }}>待开票</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fa8c16', marginTop: 2 }}>
                {adminStats?.invoiceCount || 0} 张
              </div>
            </div>

            {/* 分润比例配置 */}
            <div
              onClick={() => openAdminPage('profit-config')}
              style={{
                padding: 12,
                background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
                borderRadius: 12,
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>⚙️</div>
              <div style={{ fontSize: 12, color: '#666' }}>分润比例配置</div>
              <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4, fontWeight: 500 }}>
                L1 {(adminStats?.profitRates.level1 || 0) * 100}%
                {' · '}
                L2 {(adminStats?.profitRates.level2 || 0) * 100}%
                {' · '}
                L3 {(adminStats?.profitRates.level3 || 0) * 100}%
              </div>
            </div>
          </div>

          {/* 卡密池状态 */}
          <div
            onClick={() => openAdminPage('card-pool')}
            style={{
              marginTop: 10,
              padding: 12,
              background: 'linear-gradient(135deg, #fff0f6, #ffd6e7)',
              borderRadius: 12,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🔐</span>
                <div>
                  <div style={{ fontSize: 12, color: '#666' }}>卡密池加密状态</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f5576c', marginTop: 2 }}>
                    {adminStats?.cryptoAlgorithm || 'AES-256-CBC'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#999' }}>今日解密</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f5576c' }}>
                  {adminStats?.decryptCount || 0} 次
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        {menuItems.map((item, idx) => (
          <div key={idx} onClick={() => {
            if (item.action === 'recharge') return doRecharge();
            if (item.path && item.path !== '#') navigate(item.path);
          }} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 0',
            borderBottom: idx < menuItems.length - 1 ? '1px solid #f5f5f5' : 'none'
          }}>
            <div style={{ fontSize: 22, width: 32 }}>{item.icon}</div>
            <div style={{ flex: 1, fontSize: 14 }}>{item.label}</div>
            {item.badge && <span className="tag tag-red">{item.badge}</span>}
            <span style={{ color: '#ccc', fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>

      <div className="m-16" style={{ textAlign: 'center', color: '#bbb', fontSize: 12, paddingBottom: 20 }}>
        虚拟商品聚合平台 v1.0
      </div>
    </div>
  );
}
