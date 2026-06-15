import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  IdCard,
  MapPin,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Edit3,
  CheckCircle,
  Star,
  FileText,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'notifications' | 'help'>('info');
  const [editing, setEditing] = useState(false);

  const menuGroups = [
    {
      title: '账户设置',
      items: [
        { key: 'info', label: '基本信息', icon: User },
        { key: 'security', label: '安全设置', icon: Shield },
        { key: 'notifications', label: '消息通知', icon: Bell },
      ],
    },
    {
      title: '服务记录',
      items: [
        { key: 'appointments', label: '我的预约', icon: Clock },
        { key: 'tickets', label: '我的工单', icon: FileText },
        { key: 'ratings', label: '我的评价', icon: Star },
      ],
    },
    {
      title: '帮助与支持',
      items: [
        { key: 'help', label: '帮助中心', icon: HelpCircle },
        { key: 'about', label: '关于我们', icon: FileText },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>
          <p className="text-gray-500 mt-1">管理您的账户信息和服务偏好</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                  {user?.name?.charAt(0) || '用'}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">{user?.name || '用户'}</h2>
              <p className="text-white/70 text-sm mt-1">{user?.phone}</p>
              <div className="flex items-center gap-2 mt-3">
                {user?.realNameVerified && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    已实名认证
                  </span>
                )}
                {user?.faceVerified && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    人脸认证
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={groupIndex > 0 ? 'border-t border-gray-100' : ''}>
                <p className="px-4 pt-4 pb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {group.title}
                </p>
                <div className="pb-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key as any)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors',
                          activeTab === item.key && 'bg-primary-50 text-primary-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">基本信息</h3>
                <button
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  {editing ? '取消' : '编辑'}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">姓名</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        defaultValue={user?.name}
                        disabled={!editing}
                        className="flex-1 bg-transparent text-gray-800 font-medium focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">手机号码</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        defaultValue={user?.phone}
                        disabled={!editing}
                        className="flex-1 bg-transparent text-gray-800 font-medium focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">电子邮箱</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        defaultValue={user?.email || '未设置'}
                        disabled={!editing}
                        className="flex-1 bg-transparent text-gray-800 font-medium focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">身份证号</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <IdCard className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800 font-medium font-mono">
                        {user?.idCard ? user.idCard.slice(0, 6) + '********' + user.idCard.slice(-4) : '未认证'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">居住地址</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        defaultValue="南宁市青秀区"
                        disabled={!editing}
                        className="flex-1 bg-transparent text-gray-800 font-medium focus:outline-none disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">用户角色</label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800 font-medium">
                        {user?.role === 'admin' ? '城市管理员' : user?.role === 'clerk' ? '部门办事员' : '市民用户'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {editing && (
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
                  >
                    保存修改
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">安全设置</h3>
                <div className="space-y-4">
                  {[
                    { title: '登录密码', desc: '建议定期更换密码，确保账户安全', action: '修改密码' },
                    { title: '支付密码', desc: '用于服务缴费时的身份验证', action: '设置支付密码' },
                    { title: '人脸认证', desc: '已完成人脸录入，可用于刷脸登录', action: '重新录入', enabled: true },
                    { title: '指纹认证', desc: '支持指纹快速登录', action: '设置指纹', enabled: false },
                    { title: '登录设备管理', desc: '管理已登录的设备', action: '查看' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.enabled !== undefined && (
                          <span className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-full',
                            item.enabled ? 'bg-eco-100 text-eco-600' : 'bg-gray-200 text-gray-500'
                          )}>
                            {item.enabled ? '已启用' : '未启用'}
                          </span>
                        )}
                        <button className="px-4 py-2 bg-white text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors">
                          {item.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">消息通知设置</h3>
              <div className="space-y-4">
                {[
                  { title: '服务进度通知', desc: '预约、工单、办件进度实时推送', enabled: true },
                  { title: '政策推送', desc: '相关政策更新和解读推送', enabled: true },
                  { title: '活动通知', desc: '城市活动和惠民信息推送', enabled: false },
                  { title: '账单提醒', desc: '水电燃气、医疗账单提醒', enabled: true },
                  { title: '违章提醒', desc: '交通违章、车辆年检提醒', enabled: true },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h4 className="font-medium text-gray-800">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        item.enabled ? 'bg-primary-500' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          item.enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">常见问题</h3>
                <div className="space-y-4">
                  {[
                    { q: '如何进行实名认证？', a: '进入个人中心 - 基本信息，点击身份证认证，按提示上传身份证照片并完成人脸识别。' },
                    { q: '电子证照有法律效力吗？', a: '南宁市电子证照与实体证照具有同等法律效力，可用于办理各类政务服务事项。' },
                    { q: '如何修改登录密码？', a: '进入个人中心 - 安全设置 - 登录密码，点击修改密码，按提示操作即可。' },
                    { q: '12345诉求处理时效是多久？', a: '一般诉求将在3个工作日内分派至责任部门，7个工作日内反馈处理结果。' },
                  ].map((faq, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-medium text-gray-800 mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                  <Phone className="w-8 h-8 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">服务热线</h4>
                  <p className="text-white/80 text-2xl font-bold">12345</p>
                  <p className="text-white/60 text-sm mt-2">7×24小时服务</p>
                </div>
                <div className="bg-gradient-to-br from-eco-500 to-eco-600 rounded-2xl p-6 text-white">
                  <Mail className="w-8 h-8 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">意见反馈</h4>
                  <p className="text-white/80">service@nanning.gov.cn</p>
                  <p className="text-white/60 text-sm mt-2">我们会尽快回复</p>
                </div>
                <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-6 text-white">
                  <HelpCircle className="w-8 h-8 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">在线客服</h4>
                  <p className="text-white/80">智能客服24小时在线</p>
                  <p className="text-white/60 text-sm mt-2">人工客服 8:00-20:00</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
