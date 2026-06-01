import { useState } from 'react'
import { Edit2, Save, X, ExternalLink } from 'lucide-react'
import type { Scheme } from '@/types'

interface BasicInfoProps {
  scheme: Scheme
  onUpdate: (data: Partial<Scheme>) => Promise<void>
}

export default function BasicInfo({ scheme, onUpdate }: BasicInfoProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: scheme.name,
    business_goal: scheme.business_goal || '',
    user_roles: scheme.user_roles.join(', '),
    key_flows: scheme.key_flows.join(', '),
    prototype_link: scheme.prototype_link || '',
    state_diagram: scheme.state_diagram || '',
    review_scope: scheme.review_scope || '',
  })

  const handleSave = async () => {
    await onUpdate({
      name: formData.name,
      business_goal: formData.business_goal,
      user_roles: formData.user_roles.split(',').map((s) => s.trim()).filter(Boolean),
      key_flows: formData.key_flows.split(',').map((s) => s.trim()).filter(Boolean),
      prototype_link: formData.prototype_link,
      state_diagram: formData.state_diagram,
      review_scope: formData.review_scope,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: scheme.name,
      business_goal: scheme.business_goal || '',
      user_roles: scheme.user_roles.join(', '),
      key_flows: scheme.key_flows.join(', '),
      prototype_link: scheme.prototype_link || '',
      state_diagram: scheme.state_diagram || '',
      review_scope: scheme.review_scope || '',
    })
    setEditing(false)
  }

  const renderField = (label: string, value: string, key: keyof typeof formData, multiline = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            value={formData[key]}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={formData[key]}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        )
      ) : (
        <div className="text-gray-900">{value || '-'}</div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[#e8723a] text-white rounded-lg text-sm font-medium hover:bg-[#d6612a] transition-colors"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {renderField('方案名称', scheme.name, 'name')}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">目标用户</label>
          {editing ? (
            <input
              type="text"
              value={formData.user_roles}
              onChange={(e) => setFormData({ ...formData, user_roles: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
              placeholder="多个角色用逗号分隔"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {scheme.user_roles.length > 0 ? scheme.user_roles.map((role, i) => (
                <span key={i} className="px-2.5 py-1 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
                  {role}
                </span>
              )) : <span className="text-gray-400">-</span>}
            </div>
          )}
        </div>
        {renderField('业务目标', scheme.business_goal || '', 'business_goal', true)}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">关键流程</label>
          {editing ? (
            <textarea
              value={formData.key_flows}
              onChange={(e) => setFormData({ ...formData, key_flows: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
              rows={3}
              placeholder="多个流程用逗号分隔"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {scheme.key_flows.length > 0 ? scheme.key_flows.map((flow, i) => (
                <span key={i} className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {flow}
                </span>
              )) : <span className="text-gray-400">-</span>}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">原型链接</label>
          {editing ? (
            <input
              type="text"
              value={formData.prototype_link}
              onChange={(e) => setFormData({ ...formData, prototype_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
          ) : scheme.prototype_link ? (
            <a href={scheme.prototype_link} target="_blank" rel="noopener noreferrer" className="text-[#1e3a5f] hover:underline flex items-center gap-1">
              {scheme.prototype_link}
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
        {renderField('状态流转图', scheme.state_diagram || '', 'state_diagram')}
        {renderField('评审范围', scheme.review_scope || '', 'review_scope', true)}
      </div>
    </div>
  )
}
