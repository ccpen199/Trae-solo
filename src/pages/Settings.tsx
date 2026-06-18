import { Bell, Shield, Globe, Moon } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showContact: false,
    allowTrack: true,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">通知设置</h3>
            <p className="text-sm text-gray-500">管理您接收通知的方式</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'email', label: '邮件通知', desc: '接收重要消息的邮件提醒' },
            { key: 'push', label: '推送通知', desc: '接收浏览器或APP推送' },
            { key: 'sms', label: '短信通知', desc: '接收重要告警的短信提醒' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">隐私设置</h3>
            <p className="text-sm text-gray-500">管理您的隐私和数据安全</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { key: 'showProfile', label: '公开个人资料', desc: '允许其他用户查看您的个人资料' },
            { key: 'showContact', label: '公开联系方式', desc: '允许其他用户查看您的联系方式' },
            { key: 'allowTrack', label: '允许位置追踪', desc: '用于地理围栏和展业轨迹记录' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy[item.key as keyof typeof privacy]}
                  onChange={(e) => setPrivacy({ ...privacy, [item.key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">语言与地区</h3>
            <p className="text-sm text-gray-500">设置您的语言和地区偏好</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">语言</p>
              <p className="text-sm text-gray-500">选择界面显示语言</p>
            </div>
            <select className="input w-40">
              <option>简体中文</option>
              <option>繁體中文</option>
              <option>English</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">时区</p>
              <p className="text-sm text-gray-500">选择您所在的时区</p>
            </div>
            <select className="input w-40">
              <option>UTC+8 北京时间</option>
              <option>UTC+9 东京时间</option>
              <option>UTC+0 伦敦时间</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">显示设置</h3>
            <p className="text-sm text-gray-500">自定义界面显示效果</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">主题模式</p>
              <p className="text-sm text-gray-500">选择亮色或暗色主题</p>
            </div>
            <select className="input w-40">
              <option>跟随系统</option>
              <option>亮色模式</option>
              <option>暗色模式</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">紧凑模式</p>
              <p className="text-sm text-gray-500">减少界面间距，显示更多内容</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
