import React, { useState, useEffect } from 'react'
import {
  PlusIcon,
  UsersIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { enterpriseAPI } from '../../api/client'

const statusConfig = {
  active: { label: '在职', color: 'bg-green-100 text-green-700' },
  inactive: { label: '离职', color: 'bg-gray-100 text-gray-500' },
  suspended: { label: '停缴', color: 'bg-red-100 text-red-700' },
}

const riskConfig = {
  high: { label: '高风险', color: 'bg-red-100 text-red-700' },
  medium: { label: '中风险', color: 'bg-orange-100 text-orange-700' },
  low: { label: '低风险', color: 'bg-green-100 text-green-700' },
}

const ssConfig = {
  normal: { label: '正常', color: 'bg-green-100 text-green-700' },
  stopped: { label: '停缴', color: 'bg-red-100 text-red-700' },
  pending: { label: '待办理', color: 'bg-yellow-100 text-yellow-700' },
}

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', position: '', baseSalary: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [pagination.page])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await enterpriseAPI.getEmployees({ page: pagination.page, limit: pagination.limit })
      setEmployees(res.data?.employees || res.data?.items || res.data || [])
      if (res.data?.total !== undefined) {
        setPagination((prev) => ({ ...prev, total: res.data.total }))
      }
    } catch (err) {
      setError('获取员工列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await enterpriseAPI.createEmployee({ ...form, secondFactorCode: '123456' })
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', department: '', position: '', baseSalary: '' })
      fetchEmployees()
    } catch (err) {
      setError(err.response?.data?.message || '添加员工失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await enterpriseAPI.updateEmployee(id, { status })
      fetchEmployees()
    } catch (err) {
      setError('更新状态失败')
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">员工管理</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          添加员工
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">姓名</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">邮箱</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">部门</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">社保状态</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">风险等级</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const status = statusConfig[emp.status] || statusConfig.active
              const risk = riskConfig[emp.riskLevel] || riskConfig.low
              const ss = ssConfig[emp.socialSecurityStatus] || ssConfig.normal
              return (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-800 font-medium">{emp.name}</td>
                  <td className="px-5 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-5 py-3 text-gray-600">{emp.department || '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ss.color}`}>{ss.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${risk.color}`}>{risk.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    {emp.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(emp.id, 'suspended')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        停缴社保
                      </button>
                    ) : emp.status === 'suspended' ? (
                      <button
                        onClick={() => handleStatusChange(emp.id, 'active')}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        恢复社保
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">添加员工</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="姓名"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="邮箱"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="手机号"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <input
                name="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="部门"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <input
                name="position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="职位"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <input
                name="baseSalary"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                placeholder="基本工资"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
              >
                {submitting ? '提交中...' : '添加'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
