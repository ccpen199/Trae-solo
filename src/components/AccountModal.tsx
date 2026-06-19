import { useState } from 'react'
import Modal from './Modal'
import RoleSwitcher from './RoleSwitcher'
import { useBusinessStore } from '@/store/business'
import { useAuthStore, UserRole } from '@/store/auth'
import {
  User,
  Shield,
  Lock,
  FileCheck,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building2,
  Check,
  LockKeyhole,
  Smartphone,
  MessageCircle,
  LogIn,
  Eye,
  EyeOff,
  Save,
  Edit3,
  Users,
  TrendingUp,
  Clock,
  Globe,
  Monitor,
  LogOut,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
} from 'lucide-react'

type TabKey = 'profile' | 'security' | 'permissions' | 'audit'

const roleLabels: Record<UserRole, { title: string; description: string; gradient: string }> = {
  direct_seller: {
    title: '直销员',
    description: '个人展业，负责客户管理、产品分享和业绩追踪，专注于个人销售业务的拓展与维护',
    gradient: 'from-emerald-500 to-teal-600',
  },
  store_owner: {
    title: '生活馆店主',
    description: '门店运营管理，负责门店预约、服务记录、团队协作，管理线下体验店整体运营',
    gradient: 'from-amber-500 to-orange-600',
  },
  hq_admin: {
    title: '总部运营',
    description: '全局管控与数据运营，负责合规风控、内容审核、门店审批等总部级管理权限',
    gradient: 'from-sky-500 to-blue-600',
  },
}

const permissionConfig = [
  { key: 'customer', label: '客户管理', icon: Users, roles: ['direct_seller', 'store_owner', 'hq_admin'] as UserRole[] },
  { key: 'share', label: '产品分享', icon: TrendingUp, roles: ['direct_seller', 'store_owner', 'hq_admin'] as UserRole[] },
  { key: 'appointment', label: '预约服务', icon: Calendar, roles: ['direct_seller', 'store_owner', 'hq_admin'] as UserRole[] },
  { key: 'team', label: '团队管理', icon: Users, roles: ['direct_seller', 'store_owner', 'hq_admin'] as UserRole[] },
  { key: 'finance', label: '财务结算', icon: DollarSign, roles: ['direct_seller', 'store_owner', 'hq_admin'] as UserRole[] },
  { key: 'store_approval', label: '门店审批', icon: Building2, roles: ['store_owner', 'hq_admin'] as UserRole[] },
  { key: 'content_review', label: '内容审核', icon: FileCheck, roles: ['hq_admin'] as UserRole[] },
  { key: 'compliance', label: '合规风控', icon: Shield, roles: ['hq_admin'] as UserRole[] },
]

export default function AccountModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const { addToast } = useBusinessStore()
  const [tab, setTab] = useState<TabKey>('profile')
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false)

  const [profileForm, setProfileForm] = useState({
    address: '上海市浦东新区张江高科技园区博云路 2 号',
    wechat: 'liming_888',
    emergencyContact: '李华 · 139****1234',
    bio: '从事健康产业 5 年，专注免疫调节与心脑血管养护领域，服务 200+ 家庭客户',
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const devices = [
    { id: 1, name: 'iPhone 15 Pro', location: '上海市浦东新区', time: '2026-06-19 09:12', current: true },
    { id: 2, name: 'MacBook Pro', location: '上海市浦东新区', time: '2026-06-18 20:45' },
    { id: 3, name: 'iPad Air', location: '上海市徐汇区', time: '2026-06-15 14:30' },
  ]

  const loginRecords = [
    { time: '2026-06-19 09:12:33', location: '上海市浦东新区', device: 'iPhone 15 Pro', ip: '116.228.88.***', success: true },
    { time: '2026-06-18 20:45:12', location: '上海市浦东新区', device: 'MacBook Pro', ip: '116.228.88.***', success: true },
    { time: '2026-06-18 10:22:08', location: '上海市徐汇区', device: 'iPad Air', ip: '116.231.55.***', success: true },
    { time: '2026-06-17 22:15:44', location: '北京市朝阳区', device: '未知设备', ip: '223.104.12.***', success: false },
    { time: '2026-06-17 08:30:01', location: '上海市浦东新区', device: 'iPhone 15 Pro', ip: '116.228.88.***', success: true },
  ]

  const auditOperations = [
    { time: '2026-06-19 10:32', action: '客户陈雅婷备注已保存', type: 'info' },
    { time: '2026-06-19 09:45', action: '发布分享到微信朋友圈', type: 'info' },
    { time: '2026-06-18 16:20', action: '完成预约 AP003 服务', type: 'success' },
    { time: '2026-06-18 14:08', action: '新增客户王俊杰', type: 'success' },
    { time: '2026-06-18 11:30', action: '更新产品库存盘点 3 件', type: 'info' },
    { time: '2026-06-17 19:42', action: '佣金提现申请提交', type: 'success' },
    { time: '2026-06-17 15:15', action: '客户刘志强跟进记录', type: 'info' },
    { time: '2026-06-17 10:00', action: '登录密码修改成功', type: 'success' },
    { time: '2026-06-16 18:30', action: '预约 AP002 确认', type: 'info' },
    { time: '2026-06-16 11:22', action: '分享产品「松花粉升级版', type: 'info' },
  ]

  const complianceRecords = [
    { time: '2026-06-18', content: '话术审核通过 —— 客户沟通话术合规性审核通过', status: 'passed' },
    { time: '2026-06-17', content: '佣金提现合规 —— ¥15,320 已完成合规审查', status: 'passed' },
    { time: '2026-06-15', content: '展业区域合规 —— 地理围栏验证通过', status: 'passed' },
    { time: '2026-06-12', content: '客户资料合规 —— 客户隐私数据脱敏检查通过', status: 'passed' },
  ]

  const handleSaveProfile = () => {
    addToast({ type: 'success', title: '资料已保存', description: '您的个人资料已同步更新' })
  }

  const handleChangePassword = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      addToast({ type: 'error', title: '请填写完整', description: '请填写所有密码字段' })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ type: 'error', title: '密码不一致', description: '两次输入的新密码不匹配' })
      return
    }
    addToast({ type: 'success', title: '密码修改成功', description: '请使用新密码重新登录' })
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleModifyPhone = () => {
    addToast({ type: 'info', title: '修改手机号', description: '请联系客服完成手机号变更验证' })
  }

  const handleUnbindWechat = () => {
    addToast({ type: 'warning', title: '确认解绑', description: '解绑后将无法使用微信快捷登录' })
  }

  const handleLogoutDevice = (_deviceId: number) => {
    addToast({ type: 'success', title: '设备已下线', description: '该设备已被强制退出登录' })
  }

  const currentRole = user?.role || 'direct_seller'
  const roleInfo = roleLabels[currentRole]

  const tabs = [
    { key: 'profile' as TabKey, label: '个人资料', icon: User },
    { key: 'security' as TabKey, label: '安全设置', icon: Shield },
    { key: 'permissions' as TabKey, label: '角色权限', icon: Lock },
    { key: 'audit' as TabKey, label: '账号审计', icon: FileText },
  ]

  if (showRoleSwitcher) {
    return (
      <Modal open onClose={onClose} title="切换角色" subtitle="切换工作台视角，体验不同角色的业务流程" size="md">
        <RoleSwitcher onClose={() => { setShowRoleSwitcher(false); onClose() }} />
      </Modal>
    )
  }

  return (
    <Modal open onClose={onClose} title="账号设置" subtitle={`${user?.name || '用户'} · 账号与安全中心`} size="lg">
      <div>
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                  tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'profile' && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-sky-50 to-violet-50 rounded-xl border border-sky-100">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.avatar || user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-800">{user?.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-violet-500" />
                    编号：{user?.id}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {user?.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    {user?.region}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    {user?.level || '高级经销商'}
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  入职日期：2024-03-15
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-500" /> 联系地址
                </label>
                <div className="relative">
                  <input
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
                  />
                  <Edit3 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> 微信号
                </label>
                <div className="relative">
                  <input
                    value={profileForm.wechat}
                    onChange={(e) => setProfileForm({ ...profileForm, wechat: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
                  />
                  <Edit3 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <Users className="w-4 h-4 text-rose-500" /> 紧急联系人
                </label>
                <div className="relative">
                  <input
                    value={profileForm.emergencyContact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
                  />
                  <Edit3 className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-violet-500" /> 个人简介
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full py-3 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" /> 保存资料
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <LockKeyhole className="w-4 h-4 text-violet-500" /> 修改登录密码
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showOldPwd ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="请输入原密码"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                  />
                  <button
                    onClick={() => setShowOldPwd(!showOldPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="请输入新密码"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                  />
                  <button
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="请再次输入新密码"
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
                  />
                  <button
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:shadow-md transition"
                >
                  保存密码
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-800 text-sm">绑定手机</div>
                  <div className="text-xs text-slate-500 mt-0.5">已绑定：{user?.phone}</div>
                </div>
              </div>
              <button
                onClick={handleModifyPhone}
                className="px-3 py-1.5 text-xs font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
              >
                修改
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-800 text-sm">绑定微信</div>
                  <div className="text-xs text-slate-500 mt-0.5">已绑定微信账号</div>
                </div>
              </div>
              <button
                onClick={handleUnbindWechat}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
              >
                解绑
              </button>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-sky-500" /> 登录设备管理
              </div>
              <div className="space-y-2">
                {devices.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          {d.name}
                          {d.current && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full">当前</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <Globe className="w-3 h-3" /> {d.location}
                          <Clock className="w-3 h-3" /> {d.time}
                        </div>
                      </div>
                    </div>
                    {!d.current && (
                      <button
                        onClick={() => handleLogoutDevice(d.id)}
                        className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" /> 下线
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'permissions' && (
          <div className="space-y-5">
            <div className={`p-5 rounded-2xl bg-gradient-to-br ${roleInfo.gradient} text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-white/80 text-sm">当前角色</div>
                  <div className="text-xl font-bold">{roleInfo.title}</div>
                </div>
              </div>
              <p className="text-sm text-white/90 mt-3 leading-relaxed">{roleInfo.description}</p>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 mb-3">权限列表</div>
              <div className="grid grid-cols-2 gap-2">
                {permissionConfig.map((p) => {
                  const Icon = p.icon
                  const hasPermission = p.roles.includes(currentRole)
                  return (
                    <div
                      key={p.key}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${
                        hasPermission
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          hasPermission
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${hasPermission ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${hasPermission ? 'text-slate-800' : 'text-slate-500'}`}>
                          {p.label}
                        </div>
                      </div>
                      {hasPermission ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <LockKeyhole className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="w-full py-3 text-sm font-medium bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4" /> 切换角色
            </button>
          </div>
        )}

        {tab === 'audit' && (
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <LogIn className="w-4 h-4 text-emerald-500" /> 登录记录
              </div>
              <div className="space-y-2">
                {loginRecords.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        r.success ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}
                    >
                      {r.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{r.device}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                            r.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {r.success ? '成功' : '失败'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {r.location}
                        </span>
                        <span className="font-mono">{r.ip}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-violet-500" /> 操作审计
              </div>
              <div className="space-y-1.5">
                {auditOperations.map((op, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700">{op.action}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{op.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-sky-500" /> 合规复查记录
              </div>
              <div className="space-y-2">
                {complianceRecords.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800">{r.content}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.time}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
                      已通过
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
