import { useState } from 'react'
import { Download, Users, FileText, Settings, Shield, Edit2, Trash2, Plus, Search } from 'lucide-react'
import { UserRole, roleLabels, useAppStore } from '@/store/useAppStore'

interface SystemUser {
  id: number
  name: string
  role: UserRole
  department: string
  status: 'active' | 'inactive'
  lastLogin: string
}

interface SystemLog {
  id: number
  user: string
  action: string
  target: string
  time: string
  ip: string
}

const mockUsers: SystemUser[] = [
  { id: 1, name: '李医生', role: 'doctor', department: '临床内科', status: 'active', lastLogin: '2024-05-20 09:30:00' },
  { id: 2, name: '王药师', role: 'pharmacist', department: '药剂科', status: 'active', lastLogin: '2024-05-20 08:15:00' },
  { id: 3, name: '赵分析师', role: 'qa', department: '药物警戒部', status: 'active', lastLogin: '2024-05-19 14:20:00' },
  { id: 4, name: '钱监管', role: 'regulator', department: '监管局', status: 'active', lastLogin: '2024-05-18 10:00:00' },
  { id: 5, name: '张医生', role: 'doctor', department: '外科', status: 'inactive', lastLogin: '2024-05-10 16:30:00' },
]

const mockLogs: SystemLog[] = [
  { id: 1, user: '李医生', action: '创建报告', target: 'ADR202405001', time: '2024-05-20 10:30:00', ip: '192.168.1.101' },
  { id: 2, user: '赵分析师', action: '审核报告', target: 'ADR202405001', time: '2024-05-20 11:15:00', ip: '192.168.1.102' },
  { id: 3, user: '王药师', action: '更新药品', target: '阿莫西林胶囊', time: '2024-05-20 09:45:00', ip: '192.168.1.103' },
  { id: 4, user: '李医生', action: '提交报告', target: 'ADR202405002', time: '2024-05-19 16:20:00', ip: '192.168.1.101' },
  { id: 5, user: '钱监管', action: '导出数据', target: '月度报表', time: '2024-05-19 15:00:00', ip: '192.168.1.104' },
  { id: 6, user: '赵分析师', action: '评估报告', target: 'ADR202405001', time: '2024-05-19 14:30:00', ip: '192.168.1.102' },
]

const tabs = [
  { key: 'users', label: '用户角色管理', icon: Users },
  { key: 'logs', label: '系统日志', icon: FileText },
  { key: 'export', label: '数据导出', icon: Download },
  { key: 'settings', label: '系统设置', icon: Settings },
]

export default function AdminView() {
  const [activeTab, setActiveTab] = useState('users')
  const [users] = useState<SystemUser[]>(mockUsers)
  const [logs] = useState<SystemLog[]>(mockLogs)
  const [searchText, setSearchText] = useState('')
  const { permissions } = useAppStore()

  const filteredUsers = users.filter(
    (u) => u.name.includes(searchText) || u.department.includes(searchText)
  )

  const handleExport = (type: string) => {
    alert(`正在导出${type}数据...`)
  }

  const renderUserTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户姓名或部门..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10"
          />
        </div>
        {permissions.canManageUsers && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增用户
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户姓名</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">角色</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部门</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">最后登录</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-sm">{user.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="badge bg-primary-100 text-primary-600">
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{user.department}</td>
                <td className="py-3 px-4">
                  <span className={`badge ${
                    user.status === 'active' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.status === 'active' ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{user.lastLogin}</td>
                <td className="py-3 px-4">
                  {permissions.canManageUsers && (
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-blue-50 rounded-lg text-primary-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-red-50 rounded-lg text-danger-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="btn-secondary px-3 py-1.5 text-sm">上一页</button>
        <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white">1</button>
        <button className="btn-secondary px-3 py-1.5 text-sm">下一页</button>
      </div>
    </div>
  )

  const renderLogsTab = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作人</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作类型</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作对象</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作时间</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">IP地址</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm font-medium text-gray-800">{log.user}</td>
              <td className="py-3 px-4">
                <span className="badge bg-blue-100 text-blue-600">{log.action}</span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">{log.target}</td>
              <td className="py-3 px-4 text-sm text-gray-500">{log.time}</td>
              <td className="py-3 px-4 text-sm text-gray-400 font-mono">{log.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderExportTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: '上报数据导出', desc: '导出所有上报记录为Excel', type: '上报数据' },
        { title: '药品数据导出', desc: '导出药品库信息', type: '药品数据' },
        { title: '评估数据导出', desc: '导出关联性评估结果', type: '评估数据' },
        { title: '月度统计报表', desc: '导出月度统计分析报表', type: '月度报表' },
        { title: '季度分析报告', desc: '导出季度数据分析报告', type: '季度报告' },
        { title: '年度汇总报告', desc: '导出年度数据汇总', type: '年度报告' },
      ].map((item, index) => (
        <div key={index} className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
          <button
            onClick={() => handleExport(item.type)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
            disabled={!permissions.canExportData}
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      ))}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="card p-5">
        <h3 className="font-semibold mb-4">系统设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">系统名称</label>
            <input type="text" defaultValue="药品不良反应上报系统" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上报时效提醒（小时）</label>
            <input type="number" defaultValue={24} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="notify" defaultChecked className="w-4 h-4" />
            <label htmlFor="notify" className="text-sm text-gray-700">启用邮件通知</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sms" className="w-4 h-4" />
            <label htmlFor="sms" className="text-sm text-gray-700">启用短信通知（严重病例）</label>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <button className="btn-primary">保存设置</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUserTab()
      case 'logs':
        return renderLogsTab()
      case 'export':
        return renderExportTab()
      case 'settings':
        return renderSettingsTab()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">运营管理</h1>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-500" />
          <span className="text-sm text-gray-500">管理员功能</span>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-100">
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
