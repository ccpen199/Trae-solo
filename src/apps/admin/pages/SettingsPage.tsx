import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Save,
  ChevronRight,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [alertNotifications, setAlertNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield },
    { id: 'appearance', label: '外观设置', icon: Palette },
    { id: 'system', label: '系统设置', icon: Database },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold font-rajdhani text-white">系统设置</h1>
        <p className="text-cyber-muted text-sm mt-1">管理您的账户和系统偏好设置</p>
      </div>

      <div className="flex gap-6">
        {/* 左侧导航 */}
        <div className="w-56 shrink-0">
          <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-2 backdrop-blur">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-cyber-accent/10 text-cyber-accent'
                      : 'text-gray-300 hover:bg-cyber-light/20 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 space-y-6">
          {activeSection === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-6 backdrop-blur"
            >
              <h2 className="text-lg font-bold font-rajdhani text-white mb-6">
                个人资料
              </h2>
              <div className="space-y-5">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyber-accent to-cyan-600 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">管理员</h3>
                    <p className="text-sm text-cyber-muted">admin@example.com</p>
                    <button className="mt-2 text-sm text-cyber-accent hover:underline">
                      更换头像
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm text-cyber-muted mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      defaultValue="admin"
                      className="w-full h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyber-muted mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      defaultValue="admin@example.com"
                      className="w-full h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyber-muted mb-2">
                      手机号
                    </label>
                    <input
                      type="tel"
                      defaultValue="138****8888"
                      className="w-full h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyber-muted mb-2">
                      角色
                    </label>
                    <input
                      type="text"
                      defaultValue="系统管理员"
                      disabled
                      className="w-full h-10 px-4 bg-cyber-darker/30 border border-cyber-border rounded-lg text-sm text-cyber-muted cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存修改
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-6 backdrop-blur"
            >
              <h2 className="text-lg font-bold font-rajdhani text-white mb-6">
                通知设置
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: '告警通知',
                    desc: '当有新的告警产生时，推送通知到您的设备',
                    value: alertNotifications,
                    onChange: setAlertNotifications,
                  },
                  {
                    title: '邮件通知',
                    desc: '接收重要系统通知和报告到您的邮箱',
                    value: emailNotifications,
                    onChange: setEmailNotifications,
                  },
                  {
                    title: '声音提醒',
                    desc: '接收通知时播放提示音效',
                    value: soundEnabled,
                    onChange: setSoundEnabled,
                    icon: soundEnabled ? Volume2 : VolumeX,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-cyber-darker/30 rounded-lg"
                  >
                    <div>
                      <h3 className="text-white font-medium">{item.title}</h3>
                      <p className="text-xs text-cyber-muted mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.onChange(!item.value)}
                      className={`w-12 h-7 rounded-full relative transition-colors ${
                        item.value ? 'bg-cyber-accent' : 'bg-cyber-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all shadow ${
                          item.value ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {[
                {
                  title: '修改密码',
                  desc: '定期更换密码以保护账户安全',
                  icon: Shield,
                },
                {
                  title: '两步验证',
                  desc: '启用两步验证增强账户安全性',
                  icon: Shield,
                },
                {
                  title: '登录设备',
                  desc: '查看和管理所有登录设备',
                  icon: Globe,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur flex items-center justify-between hover:border-cyber-accent/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyber-accent/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-cyber-accent" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{item.title}</h3>
                        <p className="text-xs text-cyber-muted mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-cyber-muted" />
                  </div>
                )
              })}
            </motion.div>
          )}

          {activeSection === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-6 backdrop-blur"
            >
              <h2 className="text-lg font-bold font-rajdhani text-white mb-6">
                外观设置
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm text-cyber-muted mb-3">主题模式</h3>
                  <div className="flex gap-3">
                    {[
                      {
                        mode: 'dark',
                        label: '深色模式',
                        icon: Moon,
                        active: darkMode,
                      },
                      {
                        mode: 'light',
                        label: '浅色模式',
                        icon: Sun,
                        active: !darkMode,
                      },
                    ].map((theme) => {
                      const Icon = theme.icon
                      return (
                        <button
                          key={theme.mode}
                          onClick={() => setDarkMode(theme.mode === 'dark')}
                          className={`flex-1 p-4 rounded-lg border transition-all ${
                            theme.active
                              ? 'border-cyber-accent bg-cyber-accent/10'
                              : 'border-cyber-border bg-cyber-darker/30 hover:border-cyber-accent/50'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 mb-2 mx-auto ${
                              theme.active ? 'text-cyber-accent' : 'text-cyber-muted'
                            }`}
                          />
                          <p
                            className={`text-sm ${
                              theme.active ? 'text-cyber-accent' : 'text-gray-300'
                            }`}
                          >
                            {theme.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-cyber-muted mb-3">主题色</h3>
                  <div className="flex gap-3">
                    {[
                      '#00E5FF',
                      '#8B5CF6',
                      '#10B981',
                      '#F59E0B',
                      '#EF4444',
                    ].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-white/30 transition-all"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="px-6 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    保存设置
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'system' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-6 backdrop-blur">
                <h2 className="text-lg font-bold font-rajdhani text-white mb-4">
                  系统信息
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-cyber-muted">系统版本</span>
                    <p className="text-white mt-1">v1.0.0</p>
                  </div>
                  <div>
                    <span className="text-cyber-muted">构建时间</span>
                    <p className="text-white mt-1">2024-01-15</p>
                  </div>
                  <div>
                    <span className="text-cyber-muted">API 地址</span>
                    <p className="text-white mt-1 font-mono text-xs">
                      api.example.com
                    </p>
                  </div>
                  <div>
                    <span className="text-cyber-muted">数据刷新间隔</span>
                    <p className="text-white mt-1">30 秒</p>
                  </div>
                </div>
              </div>

              <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-6 backdrop-blur">
                <h2 className="text-lg font-bold font-rajdhani text-white mb-4">
                  数据管理
                </h2>
                <div className="space-y-3">
                  {[
                    { title: '清空缓存数据', desc: '清除本地缓存的配置和数据', type: 'normal' },
                    { title: '导出配置', desc: '导出当前系统配置为JSON文件', type: 'normal' },
                    { title: '重置所有设置', desc: '将所有设置恢复为默认值', type: 'danger' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-cyber-darker/30 rounded-lg"
                    >
                      <div>
                        <h3
                          className={`font-medium ${
                            item.type === 'danger' ? 'text-cyber-danger' : 'text-white'
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-cyber-muted mt-1">{item.desc}</p>
                      </div>
                      <button
                        className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                          item.type === 'danger'
                            ? 'bg-cyber-danger/10 border border-cyber-danger/50 text-cyber-danger hover:bg-cyber-danger/20'
                            : 'bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent hover:bg-cyber-accent/20'
                        }`}
                      >
                        执行
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
