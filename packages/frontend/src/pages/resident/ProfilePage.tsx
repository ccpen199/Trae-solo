import { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Home,
  ShieldCheck,
  Key,
  Building,
  FileText,
  CreditCard,
  UserCheck,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Unlink,
  Plus,
  Wifi,
  Bluetooth,
  Nfc,
  Globe,
  Users,
  DoorOpen,
  CheckSquare,
  Clock,
  Monitor,
  Network,
  AlertOctagon,
  ShoppingBag,
  Repeat,
  MessageSquare,
  Gift,
  Repeat2,
  Wrench,
  ChevronRight,
  Copy,
} from 'lucide-react';

type ProfileTab = 'identity' | 'access' | 'subdomain' | 'audit';

type CardType = 'nfc' | 'virtual' | 'ble';
type CardStatus = 'active' | 'lost';

interface AccessCard {
  id: string;
  number: string;
  type: CardType;
  doors: string[];
  lastUsed: string;
  status: CardStatus;
}

interface LoginLog {
  time: string;
  ip: string;
  device: string;
  result: 'success' | 'failed';
}

const tabs: { key: ProfileTab; label: string; icon: typeof User }[] = [
  { key: 'identity', label: '身份信息', icon: UserCheck },
  { key: 'access', label: '门禁绑定', icon: Key },
  { key: 'subdomain', label: '子域与角色', icon: Building },
  { key: 'audit', label: '审计资料', icon: FileText },
];

const accessCards: AccessCard[] = [
  {
    id: '1',
    number: 'CY-ACC-0030101220201',
    type: 'nfc',
    doors: ['3号楼单元门', '园区主入口', 'B1车库'],
    lastUsed: '2024-06-17 19:45',
    status: 'active',
  },
  {
    id: '2',
    number: 'CY-ACC-0030101220202',
    type: 'virtual',
    doors: ['3号楼单元门', '园区主入口'],
    lastUsed: '2024-06-17 08:12',
    status: 'active',
  },
  {
    id: '3',
    number: 'CY-ACC-0030101220199',
    type: 'ble',
    doors: ['3号楼单元门'],
    lastUsed: '2024-06-10 14:30',
    status: 'lost',
  },
];

const loginLogs: LoginLog[] = [
  { time: '2024-06-18 09:23:15', ip: '223.104.12.45', device: 'iPhone 15 Pro / iOS 17.5', result: 'success' },
  { time: '2024-06-17 21:08:42', ip: '223.104.12.45', device: 'iPhone 15 Pro / iOS 17.5', result: 'success' },
  { time: '2024-06-17 08:15:33', ip: '114.247.56.89', device: 'MacBook Pro / macOS 14.5', result: 'success' },
  { time: '2024-06-16 19:42:11', ip: '223.104.12.45', device: 'iPhone 15 Pro / iOS 17.5', result: 'success' },
  { time: '2024-06-15 14:28:07', ip: '36.110.78.23', device: 'Chrome 125 / Windows 11', result: 'success' },
  { time: '2024-06-14 23:11:56', ip: '223.104.12.45', device: 'iPhone 15 Pro / iOS 17.5', result: 'success' },
  { time: '2024-06-13 10:05:21', ip: '114.247.56.89', device: 'MacBook Pro / macOS 14.5', result: 'success' },
  { time: '2024-06-12 16:44:09', ip: '58.132.45.167', device: 'Unknown / Chrome 124', result: 'failed' },
  { time: '2024-06-12 16:43:52', ip: '58.132.45.167', device: 'Unknown / Chrome 124', result: 'failed' },
  { time: '2024-06-11 09:17:38', ip: '223.104.12.45', device: 'iPhone 15 Pro / iOS 17.5', result: 'success' },
];

const operationStats = [
  { label: '发布话题数', value: 42, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
  { label: '优选下单数', value: 128, icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
  { label: '二手交易数', value: 17, icon: Repeat, color: 'bg-purple-50 text-purple-600' },
  { label: '提现记录数', value: 9, icon: Gift, color: 'bg-green-50 text-green-600' },
];

const sensitiveWordHits = [
  { id: 1, content: '出售二手xxx号码 联系电话...', hitWord: 'xxx号码', time: '2024-05-12 14:22', action: '已屏蔽', severity: 'medium' },
  { id: 2, content: '低价转xxx代运营服务 私聊', hitWord: '代运营', time: '2024-04-28 09:50', action: '审核通过', severity: 'low' },
];

const permissionTags = [
  { label: '发帖', icon: MessageSquare },
  { label: '半径优选下单', icon: ShoppingBag },
  { label: '二手担保发布', icon: Repeat2 },
  { label: '小金库任务参与', icon: Gift },
  { label: '合伙人邀请', icon: Users },
  { label: '物业报修工单提交', icon: Wrench },
];

function getCardTypeInfo(type: CardType): { label: string; icon: typeof Nfc; color: string } {
  switch (type) {
    case 'nfc':
      return { label: 'NFC卡', icon: Nfc, color: 'bg-blue-100 text-blue-700' };
    case 'virtual':
      return { label: '虚拟卡', icon: Wifi, color: 'bg-green-100 text-green-700' };
    case 'ble':
      return { label: '蓝牙BLE', icon: Bluetooth, color: 'bg-purple-100 text-purple-700' };
  }
}

export default function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>('identity');
  const [nickname, setNickname] = useState('朝阳老邻居');
  const [height, setHeight] = useState('175');
  const [emergencyContact, setEmergencyContact] = useState('张女士 138****5678');
  const [allergies, setAllergies] = useState('青霉素过敏、花生过敏');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardType, setNewCardType] = useState<CardType>('nfc');
  const [newCardDoor, setNewCardDoor] = useState('3号楼单元门');
  const [cardList, setCardList] = useState(accessCards);

  const handleCardAction = (id: string, action: 'lost' | 'unlock' | 'unbind') => {
    if (action === 'unbind') {
      setCardList(cardList.filter((c) => c.id !== id));
    } else if (action === 'lost') {
      setCardList(cardList.map((c) => (c.id === id ? { ...c, status: 'lost' as CardStatus } : c)));
    } else if (action === 'unlock') {
      setCardList(cardList.map((c) => (c.id === id ? { ...c, status: 'active' as CardStatus } : c)));
    }
  };

  const handleAddCard = () => {
    if (!newCardNumber) return;
    const newCard: AccessCard = {
      id: Date.now().toString(),
      number: newCardNumber,
      type: newCardType,
      doors: [newCardDoor],
      lastUsed: '-',
      status: 'active',
    };
    setCardList([newCard, ...cardList]);
    setNewCardNumber('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-primary-600 via-primary-600 to-emerald-500 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-primary-100 flex items-center justify-center shadow-lg ring-4 ring-white/20">
              <User className="w-10 h-10 text-primary-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-400 rounded-full flex items-center justify-center ring-4 ring-primary-600 shadow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">王建华</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/20">
                <Home className="w-3 h-3" />
                房主
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/90 text-emerald-950 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                实名已通过
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-400/90 text-purple-950">
                <Globe className="w-3 h-3" />
                SAML
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/90 mt-2">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-white/70" />
                139****1001
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-white/70" />
                朝阳家园社区
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-white/70" />
                <code className="bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded text-xs">
                  chaoyang.neighborhood.cn
                </code>
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 min-w-[180px]">
              <p className="text-xs text-white/70 mb-1">当前登录</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" />
                iPhone 15 Pro
              </p>
              <p className="text-[11px] text-white/60 mt-0.5">223.104.12.45 · 北京移动</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'identity' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                实名认证信息
              </h3>
              <span className="badge-green text-xs">已认证</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">证件类型</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">中华人民共和国居民身份证</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">证件号码</p>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800 font-mono">110101********1234</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">认证时间</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">2022-06-18</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">认证机构</p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-800">公安部CTID可信身份认证平台</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                实名认证信息由公安部CTID权威签发，不可修改。如需变更请联系社区物业或拨打客服热线 400-***-****。
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                基础资料
              </h3>
              <span className="text-xs text-gray-400">可编辑</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input-field"
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="input-field"
                  placeholder="请输入身高"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">紧急联系人</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="input-field"
                  placeholder="姓名 + 联系方式"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">过敏史</label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="请描述您的过敏史信息，便于医疗紧急救援..."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-secondary text-sm">取消</button>
              <button className="btn-primary text-sm">保存修改</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'access' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary-500" />
                我的门禁卡
              </h3>
              <span className="text-xs text-gray-400">共 {cardList.length} 张</span>
            </div>
            <div className="space-y-3">
              {cardList.map((card) => {
                const typeInfo = getCardTypeInfo(card.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div
                    key={card.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      card.status === 'active'
                        ? 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            card.status === 'active' ? typeInfo.color : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <code className="text-sm font-semibold text-gray-800 font-mono bg-gray-50 px-2 py-0.5 rounded">
                              {card.number}
                            </code>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {card.status === 'active' ? (
                              <span className="badge-green text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                已激活
                              </span>
                            ) : (
                              <span className="badge-gray text-[11px] flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" />
                                已挂失
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <DoorOpen className="w-3 h-3" />
                              {card.doors.join('、')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              最近使用：{card.lastUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-shrink-0">
                        {card.status === 'active' ? (
                          <button
                            onClick={() => handleCardAction(card.id, 'lost')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                          >
                            <Lock className="w-3 h-3" />
                            挂失
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCardAction(card.id, 'unlock')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <Unlock className="w-3 h-3" />
                            解挂
                          </button>
                        )}
                        <button
                          onClick={() => handleCardAction(card.id, 'unbind')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Unlink className="w-3 h-3" />
                          解绑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-500" />
                添加新门禁卡
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">门禁卡号</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(e.target.value)}
                    className="input-field pr-20 font-mono"
                    placeholder="如 CY-ACC-0030101220XXX"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">卡类型</label>
                <select
                  value={newCardType}
                  onChange={(e) => setNewCardType(e.target.value as CardType)}
                  className="input-field"
                >
                  <option value="nfc">NFC实体卡</option>
                  <option value="virtual">虚拟卡(手机)</option>
                  <option value="ble">蓝牙BLE卡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">绑定门</label>
                <select
                  value={newCardDoor}
                  onChange={(e) => setNewCardDoor(e.target.value)}
                  className="input-field"
                >
                  <option>3号楼单元门</option>
                  <option>园区主入口</option>
                  <option>B1车库入口</option>
                  <option>3号楼+园区主入口</option>
                  <option>全部通行</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                添加后卡片将即时生效，如遇到问题请联系物业管家
              </p>
              <button
                onClick={handleAddCard}
                disabled={!newCardNumber}
                className="btn-primary text-sm disabled:opacity-50"
              >
                激活并绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'subdomain' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary-500" />
                子域信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">当前子域</span>
                  <code className="text-sm font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg font-mono">
                    chaoyang.neighborhood.cn
                  </code>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">租户类型</span>
                  <span className="badge-blue text-xs font-medium">
                    Owner (租户管理员)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">入住时间</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    2022-06-18
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">楼栋门牌</span>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-gray-400" />
                    3号楼1单元2202室
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">物业费状态</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已缴至 2026-12-31
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                已授权权限
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {permissionTags.map((perm) => (
                  <div
                    key={perm.label}
                    className="flex items-center gap-2 p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 hover:border-primary-200 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <perm.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                家庭成员
              </h3>
              <button className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" />
                添加成员
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: '王建华', role: '房主', relation: '本人', avatar: '王' },
                { name: '李淑芬', role: '家庭成员', relation: '配偶', avatar: '李' },
                { name: '王梓涵', role: '家庭成员', relation: '子女', avatar: '梓' },
              ].map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-emerald-400 flex items-center justify-center text-white font-semibold shadow-sm">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.relation} · {member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {operationStats.map((stat) => (
              <div
                key={stat.label}
                className="card p-4"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-500" />
                登录日志 (近10条)
              </h3>
              <button className="text-xs text-primary-600 font-medium hover:underline">导出全部</button>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left font-medium py-2.5 px-4">登录时间</th>
                    <th className="text-left font-medium py-2.5 px-4">IP地址</th>
                    <th className="text-left font-medium py-2.5 px-4">设备信息</th>
                    <th className="text-left font-medium py-2.5 px-4">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLogs.map((log, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {log.time}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                          {log.ip}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Network className="w-3.5 h-3.5 text-gray-400" />
                          {log.device}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.result === 'success' ? (
                          <span className="badge-green text-[11px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            成功
                          </span>
                        ) : (
                          <span className="badge-red text-[11px] flex items-center gap-1 w-fit">
                            <XCircle className="w-2.5 h-2.5" />
                            失败
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                敏感词命中记录
              </h3>
              <span className="text-xs text-gray-400">
                共 {sensitiveWordHits.length} 条记录
              </span>
            </div>
            {sensitiveWordHits.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无敏感词命中记录，账号行为良好</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sensitiveWordHits.map((hit) => (
                  <div
                    key={hit.id}
                    className={`p-4 rounded-xl border ${
                      hit.severity === 'high'
                        ? 'bg-red-50 border-red-100'
                        : hit.severity === 'medium'
                        ? 'bg-amber-50 border-amber-100'
                        : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm text-gray-700">
                          {hit.content.split(hit.hitWord).map((part, i, arr) => (
                            <span key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="bg-red-200 text-red-800 px-1 py-0.5 rounded font-semibold">
                                  {hit.hitWord}
                                </span>
                              )}
                            </span>
                          ))}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          hit.action === '已屏蔽'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {hit.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {hit.time}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
