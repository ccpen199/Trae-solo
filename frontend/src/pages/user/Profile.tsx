import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, Bike, MapPin, Wallet, CreditCard, AlertCircle,
  Trophy, Award, Heart, Bell, Lock, HelpCircle, ChevronRight,
  LogOut, CheckCircle2, Clock, Star,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { RIDER_LEVELS } from '../../constants';
import Card from '../../components/ui/Card';
import Tag from '../../components/ui/Tag';

const medals = [
  { name: '首单达人', icon: '🎯', unlocked: true },
  { name: '百单之星', icon: '💯', unlocked: true },
  { name: '千单王者', icon: '👑', unlocked: false },
  { name: '全勤骑手', icon: '📅', unlocked: true },
  { name: '好评如潮', icon: '⭐', unlocked: true },
  { name: '零投诉', icon: '🛡️', unlocked: false },
  { name: '老骑手', icon: '🏅', unlocked: false },
];

const careActivities = [
  { name: '高温补贴', status: '可报名', date: '6月-9月', tagColor: 'orange' as const },
  { name: '端午节关怀', status: '已核销', date: '6月10日', tagColor: 'green' as const },
  { name: '免费体检', status: '可报名', date: '7月1日-31日', tagColor: 'blue' as const },
  { name: '中秋福利', status: '未开始', date: '9月', tagColor: 'gray' as const },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentLevel = RIDER_LEVELS[1];
  const nextLevel = RIDER_LEVELS[2];
  const progress = nextLevel ? Math.min(100, (35 / nextLevel.minOrders) * 100) : 100;

  const menuSections = [
    {
      title: '身份认证',
      items: [
        { icon: ShieldCheck, label: '实名认证', value: user?.realName ? '已认证' : '未认证', valueColor: user?.realName ? 'text-green-600' : 'text-red-500', iconBg: user?.realName ? 'bg-green-100' : 'bg-red-50', iconColor: user?.realName ? 'text-green-600' : 'text-red-500', onClick: () => {} },
        { icon: Bike, label: '车辆备案', value: '电动车·京A12345', valueColor: 'text-green-600', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', onClick: () => {} },
        { icon: MapPin, label: '服务区域', value: '朝阳区·海淀区', valueColor: 'text-gray-600', iconBg: 'bg-brand-50', iconColor: 'text-brand-600', onClick: () => {} },
      ],
    },
    {
      title: '财务',
      items: [
        { icon: Wallet, label: '我的钱包', value: '¥128.50', valueColor: 'text-brand-600', iconBg: 'bg-brand-50', iconColor: 'text-brand-600', onClick: () => navigate('/wallet') },
        { icon: CreditCard, label: '余额提现', value: '银行卡尾号8888', valueColor: 'text-gray-600', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', onClick: () => navigate('/wallet') },
        { icon: AlertCircle, label: '提现风控', value: '日限额¥2,000', valueColor: 'text-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', onClick: () => {} },
      ],
    },
    {
      title: '成长',
      items: [
        { icon: Trophy, label: '成长等级', value: '青铜骑手', valueColor: 'text-amber-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', onClick: () => navigate('/rider/growth') },
        { icon: Award, label: '我的勋章', value: `${medals.filter((m) => m.unlocked).length}/${medals.length}`, valueColor: 'text-gray-600', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', onClick: () => {} },
        { icon: Heart, label: '平台关怀活动', value: '2个可报名', valueColor: 'text-pink-500', iconBg: 'bg-pink-50', iconColor: 'text-pink-500', onClick: () => {} },
      ],
    },
    {
      title: '设置',
      items: [
        { icon: Bell, label: '通知设置', value: '', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', onClick: () => {} },
        { icon: Lock, label: '隐私与安全', value: '', iconBg: 'bg-gray-100', iconColor: 'text-gray-600', onClick: () => {} },
        { icon: HelpCircle, label: '帮助与客服', value: '', iconBg: 'bg-teal-50', iconColor: 'text-teal-600', onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-4 pt-6 pb-16 -mx-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : (user?.nickname?.[0] || '用')}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.nickname || '用户'}</h2>
            <p className="text-blue-100 text-sm mt-0.5">{user?.phone || '138****0001'}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Tag color="yellow" size="sm">🏅 {currentLevel.name}</Tag>
              {user?.realName ? <Tag color="green" size="sm"><CheckCircle2 className="w-3 h-3 mr-0.5" />已实名</Tag> : <Tag color="red" size="sm">未实名</Tag>}
            </div>
          </div>
          <button onClick={() => navigate('/wallet')} className="text-right">
            <p className="text-blue-100 text-xs">余额</p>
            <p className="text-white text-lg font-bold">¥128.50</p>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 !border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-600" /><span className="font-semibold text-gray-800">成长等级</span><Tag color="yellow" size="sm">{currentLevel.name}</Tag></div>
            <button className="text-xs text-brand-600 flex items-center gap-0.5" onClick={() => navigate('/rider/growth')}>查看权益 <ChevronRight className="w-3 h-3" /></button>
          </div>
          {nextLevel && (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>距 {nextLevel.name} 还需 {Math.max(0, nextLevel.minOrders - 35)} 单</span>
                <span className="font-medium text-amber-600">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${progress}%` }} /></div>
            </>
          )}
        </Card>

        <Card>
          <h3 className="font-medium text-gray-800 mb-3">我的勋章</h3>
          <div className="grid grid-cols-4 gap-3">
            {medals.map((medal) => (
              <div key={medal.name} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${medal.unlocked ? 'bg-amber-50' : 'bg-gray-100 grayscale opacity-50'}`}>{medal.icon}</div>
                <span className={`text-xs font-medium ${medal.unlocked ? 'text-gray-700' : 'text-gray-400'}`}>{medal.name}</span>
                {medal.unlocked && <CheckCircle2 className="w-3 h-3 text-green-500" />}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800 flex items-center gap-1.5"><Heart className="w-4 h-4 text-pink-500" />平台关怀活动</h3>
            <button className="text-xs text-brand-600">全部</button>
          </div>
          <div className="space-y-2.5">
            {careActivities.map((act) => (
              <div key={act.name} className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-gray-800">{act.name}</p><p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{act.date}</p></div>
                <Tag color={act.tagColor} size="sm">{act.status}</Tag>
              </div>
            ))}
          </div>
        </Card>

        {menuSections.map((section) => (
          <Card key={section.title} padded={false}>
            <div className="px-4 pt-4 pb-1"><h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{section.title}</h3></div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.iconBg}`}><Icon className={`w-4.5 h-4.5 ${item.iconColor}`} /></div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-800">{item.label}</span>
                  {item.value && <span className={`text-sm ${item.valueColor}`}>{item.value}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              );
            })}
          </Card>
        ))}

        <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-medium hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4 inline mr-1.5" />退出登录
        </button>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowLogoutConfirm(false)}>
          <div className="w-[300px] bg-white rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">确认退出</h3>
            <p className="text-sm text-gray-500 text-center mb-6">退出后需要重新登录才能使用</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">取消</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600">退出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
