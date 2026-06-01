import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Bell,
  Users,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';

const tabs = [
  { id: 'system', label: '系统配置', icon: Server },
  { id: 'security', label: '安全策略', icon: Shield },
  { id: 'notification', label: '通知配置', icon: Bell },
  { id: 'users', label: '用户管理', icon: Users },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [showConfirm, setShowConfirm] = useState(false);
  const { success, info } = useToast();

  const [systemConfig, setSystemConfig] = useState({
    frontendPort: '43391',
    backendPort: '53391',
    apiTimeout: '30',
    maxUploadSize: '10',
    sessionTimeout: '120',
  });

  const [securityConfig, setSecurityConfig] = useState({
    passwordMinLength: '8',
    passwordRequireNumber: true,
    passwordRequireSpecial: true,
    maxLoginAttempts: '5',
    lockoutDuration: '30',
    enableTwoFactor: false,
  });

  const [notificationConfig, setNotificationConfig] = useState({
    enableEmail: true,
    enableSms: false,
    alertSeverity: 'high',
    scanComplete: true,
    changeApproval: true,
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
  });

  const handleSaveSystem = () => {
    success('系统配置已保存');
  };

  const handleSaveSecurity = () => {
    success('安全策略已保存');
  };

  const handleSaveNotification = () => {
    success('通知配置已保存');
  };

  const handleTestConnection = () => {
    info('测试连接已发送，请检查邮箱');
  };

  const handleClearCache = () => {
    setShowConfirm(true);
  };

  const confirmClearCache = () => {
    success('缓存已清除');
    setShowConfirm(false);
  };

  const renderSystemTab = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">前端端口</label>
          <input
            type="text"
            value={systemConfig.frontendPort}
            onChange={(e) =>
              setSystemConfig({ ...systemConfig, frontendPort: e.target.value })
            }
            className="input"
          />
        </div>
        <div>
          <label className="label">后端端口</label>
          <input
            type="text"
            value={systemConfig.backendPort}
            onChange={(e) =>
              setSystemConfig({ ...systemConfig, backendPort: e.target.value })
            }
            className="input"
          />
        </div>
        <div>
          <label className="label">API 超时时间 (秒)</label>
          <input
            type="number"
            value={systemConfig.apiTimeout}
            onChange={(e) =>
              setSystemConfig({ ...systemConfig, apiTimeout: e.target.value })
            }
            className="input"
          />
        </div>
        <div>
          <label className="label">最大上传大小 (MB)</label>
          <input
            type="number"
            value={systemConfig.maxUploadSize}
            onChange={(e) =>
              setSystemConfig({ ...systemConfig, maxUploadSize: e.target.value })
            }
            className="input"
          />
        </div>
        <div>
          <label className="label">会话超时 (分钟)</label>
          <input
            type="number"
            value={systemConfig.sessionTimeout}
            onChange={(e) =>
              setSystemConfig({ ...systemConfig, sessionTimeout: e.target.value })
            }
            className="input"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSaveSystem} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          保存配置
        </button>
        <button onClick={handleClearCache} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          清除缓存
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-4">
        <h4 className="font-medium mb-4">密码策略</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">最小密码长度</label>
              <input
                type="number"
                value={securityConfig.passwordMinLength}
                onChange={(e) =>
                  setSecurityConfig({
                    ...securityConfig,
                    passwordMinLength: e.target.value,
                  })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">最大登录尝试次数</label>
              <input
                type="number"
                value={securityConfig.maxLoginAttempts}
                onChange={(e) =>
                  setSecurityConfig({
                    ...securityConfig,
                    maxLoginAttempts: e.target.value,
                  })
                }
                className="input"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={securityConfig.passwordRequireNumber}
                onChange={(e) =>
                  setSecurityConfig({
                    ...securityConfig,
                    passwordRequireNumber: e.target.checked,
                  })
                }
                className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
              />
              <span className="text-sm">要求包含数字</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={securityConfig.passwordRequireSpecial}
                onChange={(e) =>
                  setSecurityConfig({
                    ...securityConfig,
                    passwordRequireSpecial: e.target.checked,
                  })
                }
                className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
              />
              <span className="text-sm">要求包含特殊字符</span>
            </label>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <h4 className="font-medium mb-4">登录安全</h4>
        <div className="space-y-4">
          <div>
            <label className="label">账户锁定时长 (分钟)</label>
            <input
              type="number"
              value={securityConfig.lockoutDuration}
              onChange={(e) =>
                setSecurityConfig({
                  ...securityConfig,
                  lockoutDuration: e.target.value,
                })
              }
              className="input w-48"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={securityConfig.enableTwoFactor}
              onChange={(e) =>
                setSecurityConfig({
                  ...securityConfig,
                  enableTwoFactor: e.target.checked,
                })
              }
              className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
            />
            <span className="text-sm">启用双因素认证</span>
          </label>
        </div>
      </div>
      <button onClick={handleSaveSecurity} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" />
        保存配置
      </button>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-4">
        <h4 className="font-medium mb-4">通知渠道</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationConfig.enableEmail}
              onChange={(e) =>
                setNotificationConfig({
                  ...notificationConfig,
                  enableEmail: e.target.checked,
                })
              }
              className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
            />
            <span className="text-sm">启用邮件通知</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationConfig.enableSms}
              onChange={(e) =>
                setNotificationConfig({
                  ...notificationConfig,
                  enableSms: e.target.checked,
                })
              }
              className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
            />
            <span className="text-sm">启用短信通知</span>
          </label>
        </div>
      </div>
      <div className="card p-4">
        <h4 className="font-medium mb-4">通知触发条件</h4>
        <div className="space-y-4">
          <div>
            <label className="label">告警严重程度阈值</label>
            <select
              value={notificationConfig.alertSeverity}
              onChange={(e) =>
                setNotificationConfig({
                  ...notificationConfig,
                  alertSeverity: e.target.value,
                })
              }
              className="input w-48"
            >
              <option value="critical">仅严重</option>
              <option value="high">严重及高危</option>
              <option value="medium">中危及以上</option>
              <option value="low">全部</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationConfig.scanComplete}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    scanComplete: e.target.checked,
                  })
                }
                className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
              />
              <span className="text-sm">扫描完成通知</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationConfig.changeApproval}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    changeApproval: e.target.checked,
                  })
                }
                className="w-4 h-4 text-navy-900 border-gray-300 rounded focus:ring-navy-500"
              />
              <span className="text-sm">变更审批通知</span>
            </label>
          </div>
        </div>
      </div>
      {notificationConfig.enableEmail && (
        <div className="card p-4">
          <h4 className="font-medium mb-4">SMTP 配置</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SMTP 服务器</label>
              <input
                type="text"
                value={notificationConfig.smtpHost}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    smtpHost: e.target.value,
                  })
                }
                className="input"
                placeholder="smtp.example.com"
              />
            </div>
            <div>
              <label className="label">端口</label>
              <input
                type="text"
                value={notificationConfig.smtpPort}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    smtpPort: e.target.value,
                  })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={notificationConfig.smtpUser}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    smtpUser: e.target.value,
                  })
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">密码</label>
              <input
                type="password"
                value={notificationConfig.smtpPassword}
                onChange={(e) =>
                  setNotificationConfig({
                    ...notificationConfig,
                    smtpPassword: e.target.value,
                  })
                }
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleTestConnection} className="btn-secondary">
              测试连接
            </button>
          </div>
        </div>
      )}
      <button onClick={handleSaveNotification} className="btn-primary flex items-center gap-2">
        <Save className="w-4 h-4" />
        保存配置
      </button>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">用户列表</h3>
        <button className="btn-primary flex items-center gap-2">
          <Users className="w-4 h-4" />
          新增用户
        </button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">角色</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: 1, username: 'admin', role: 'platform_engineer', status: 'active', createdAt: '2024-01-01' },
              { id: 2, username: 'ops_user', role: 'ops', status: 'active', createdAt: '2024-01-02' },
              { id: 3, username: 'dev_user', role: 'developer', status: 'active', createdAt: '2024-01-03' },
              { id: 4, username: 'owner_user', role: 'app_owner', status: 'active', createdAt: '2024-01-04' },
              { id: 5, username: 'security_user', role: 'security_admin', status: 'active', createdAt: '2024-01-05' },
            ].map((user) => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-navy-100 text-navy-700 border border-navy-200">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    启用
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.createdAt}</td>
                <td className="px-4 py-3">
                  <button className="text-navy-900 hover:text-navy-700 text-sm">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'system':
        return renderSystemTab();
      case 'security':
        return renderSecurityTab();
      case 'notification':
        return renderNotificationTab();
      case 'users':
        return renderUsersTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SettingsIcon className="w-8 h-8 text-navy-900" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">配置中心</h1>
          <p className="text-gray-500 mt-1">系统配置与管理</p>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">{renderTabContent()}</div>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="确认清除缓存"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={confirmClearCache} className="btn-danger">
              确认清除
            </button>
          </>
        }
      >
        <p className="text-gray-700">确定要清除系统缓存吗？这将清除所有临时数据。</p>
      </Modal>
    </div>
  );
}
