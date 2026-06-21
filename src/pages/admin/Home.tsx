import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { formatMoney, formatVolume } from '@/utils/format';
import { LayoutDashboard, Users, Cpu, Coins, Activity, Shield, Settings } from 'lucide-react';

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalRevenue: 0,
    onlineDevices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 12580,
        totalDevices: 328,
        totalRevenue: 856430.5,
        onlineDevices: 306,
      });
      setLoading(false);
    }, 500);
  }, []);

  const statCards = [
    { label: '注册学生数', value: stats.totalUsers.toLocaleString(), icon: <Users size={24} />, gradient: 'from-deep-blue-500 to-deep-blue-700', suffix: '人' },
    { label: '接入设备数', value: stats.totalDevices, icon: <Cpu size={24} />, gradient: 'from-aqua-500 to-aqua-700', suffix: '台' },
    { label: '设备在线率', value: stats.totalDevices > 0 ? Number(((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)) : 0, icon: <Activity size={24} />, gradient: 'from-green-500 to-green-700', suffix: '%' },
    { label: '平台累计营收', value: formatMoney(stats.totalRevenue), icon: <Coins size={24} />, gradient: 'from-vibrant-orange-500 to-vibrant-orange-600', suffix: '' },
  ];

  if (loading) {
    return <AppLayout role="admin"><div className="flex items-center justify-center h-64"><div className="animate-pulse text-deep-blue-700">加载中...</div></div></AppLayout>;
  }

  return (
    <AppLayout role="admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800">系统管理概览</h2>
          <p className="text-sm text-graphite-500 mt-1">平台全局数据监控与系统管理</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => (
            <div key={idx} className="glass-card p-5 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-lg mb-3`}>
                {card.icon}
              </div>
              <p className="text-sm text-graphite-500 mb-1">{card.label}</p>
              <p className="text-2xl font-display font-bold text-graphite-800">
                {typeof card.value === 'number' ? card.value : card.value}{card.suffix}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Users size={28} />, title: '用户与角色管理', desc: '管理学生、投资商、管理员账户，分配角色权限', path: '/admin/users', color: 'from-deep-blue-600 to-aqua-500' },
            { icon: <Cpu size={28} />, title: '设备审核接入', desc: '审核设备入网申请，分配归属投资商', path: '#', color: 'from-aqua-600 to-aqua-700' },
            { icon: <Shield size={28} />, title: '账单审计中心', desc: '校验区块链账单哈希链，确保数据不可篡改', path: '#', color: 'from-green-500 to-green-700' },
            { icon: <Coins size={28} />, title: '结算管理', desc: '审批投资商提现申请，管理平台资金', path: '#', color: 'from-vibrant-orange-500 to-vibrant-orange-600' },
            { icon: <Settings size={28} />, title: '系统参数配置', desc: '水价、分成比例、告警阈值等参数设置', path: '#', color: 'from-graphite-500 to-graphite-700' },
            { icon: <LayoutDashboard size={28} />, title: '操作日志审计', desc: '查看所有管理员操作记录，确保合规', path: '#', color: 'from-deep-blue-700 to-deep-blue-900' },
          ].map((item, i) => (
            <button
              key={i}
              className="glass-card p-6 text-left hover:shadow-xl hover:-translate-y-1 hover:border-aqua-300 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-graphite-800 mb-1.5 group-hover:text-deep-blue-800">{item.title}</h3>
              <p className="text-sm text-graphite-500 leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2"><Shield size={18} className="text-deep-blue-600" />平台安全说明</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-graphite-600">
            <div className="p-4 rounded-xl bg-deep-blue-50 border border-deep-blue-100">
              <p className="font-semibold text-deep-blue-800 mb-1.5">🔐 账单不可篡改</p>
              <p>所有用水交易采用 SHA-256 哈希链存储，每笔交易包含上一区块哈希，确保数据无法被篡改</p>
            </div>
            <div className="p-4 rounded-xl bg-aqua-50 border border-aqua-100">
              <p className="font-semibold text-aqua-800 mb-1.5">🔄 一卡通实时同步</p>
              <p>交易流水实时同步至校园一卡通系统，保证双系统数据一致性</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="font-semibold text-green-800 mb-1.5">📱 三模安全接入</p>
              <p>NFC/蓝牙/二维码均采用端到端加密通信，防止设备被仿冒</p>
            </div>
            <div className="p-4 rounded-xl bg-vibrant-orange-50 border border-vibrant-orange-100">
              <p className="font-semibold text-vibrant-orange-800 mb-1.5">💰 分账自动计算</p>
              <p>收益分成按预设比例自动计算，结算流程全透明可审计</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
