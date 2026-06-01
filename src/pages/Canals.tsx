import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, History, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TablePagination,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { canalApi, logApi } from '@/services/api'
import type { Canal, Log } from '@/types'

const Canals = () => {
  const [loading, setLoading] = useState(true)
  const [canals, setCanals] = useState<Canal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Canal | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [formData, setFormData] = useState<Partial<Canal>>({
    name: '',
    code: '',
    length: 0,
    capacity: 0,
    status: 'active',
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [logs, setLogs] = useState<Log[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    fetchCanals()
  }, [page, keyword, status])

  const fetchCanals = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await canalApi.getList({ keyword, status, page, pageSize })
      setCanals(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.name?.trim()) errors.name = '请输入渠道名称'
    if (!formData.code?.trim()) errors.code = '请输入渠道编码'
    if (!formData.length || formData.length <= 0) errors.length = '请输入有效的渠道长度'
    if (!formData.capacity || formData.capacity <= 0) errors.capacity = '请输入有效的设计流量'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    try {
      if (editingItem) {
        await canalApi.update(editingItem.id, { ...formData, user_name: '管理员' })
        setSuccessMessage('渠道更新成功')
      } else {
        await canalApi.create({ ...formData, user_name: '管理员' })
        setSuccessMessage('渠道创建成功')
      }
      setModalOpen(false)
      resetForm()
      fetchCanals()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const fetchLogs = async () => {
    try {
      setLogsLoading(true)
      const res = await logApi.getList({ module: '灌区档案', pageSize: 20 })
      setLogs(res.data.list)
    } catch (err) {
      console.error('获取操作日志失败:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  const openLogsModal = () => {
    setLogsModalOpen(true)
    fetchLogs()
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await canalApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchCanals()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleEdit = (item: Canal) => {
    setEditingItem(item)
    setFormData(item)
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormErrors({})
    setFormData({
      name: '',
      code: '',
      length: 0,
      capacity: 0,
      status: 'active',
      description: '',
    })
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>渠道管理</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={openLogsModal}>
                <History className="h-4 w-4 mr-2" />
                操作日志
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                新增渠道
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索渠道名称或编码..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="active">启用</option>
              <option value="inactive">停用</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>编码</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>长度 (km)</TableHead>
                    <TableHead>流量 (m³/s)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canals.map((canal) => (
                    <TableRow key={canal.id}>
                      <TableCell className="font-mono">{canal.code}</TableCell>
                      <TableCell className="font-medium">{canal.name}</TableCell>
                      <TableCell>{canal.length}</TableCell>
                      <TableCell>{canal.capacity}</TableCell>
                      <TableCell>
                        <StatusBadge status={canal.status} />
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{canal.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(canal)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, id: canal.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {canals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑渠道' : '新增渠道'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingItem ? '保存' : '创建'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              渠道编码 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.code ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入渠道编码"
            />
            {formErrors.code && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.code}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              渠道名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入渠道名称"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {formErrors.name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                长度 (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.length || 0}
                onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.length ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入渠道长度"
              />
              {formErrors.length && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.length}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                流量 (m³/s) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.capacity || 0}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入设计流量"
              />
              {formErrors.capacity && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {formErrors.capacity}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入描述信息"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        title="确认删除"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, id: null })}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              删除
            </Button>
          </>
        }
      >
        <p className="text-gray-600">确定要删除该渠道吗？此操作不可恢复。</p>
      </Modal>

      <Modal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        title="操作日志"
        size="lg"
      >
        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
            <span className="text-gray-500">加载中...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无操作记录</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">操作人</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">模块</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">操作</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">详情</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">时间</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2">{log.user_name || '-'}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{log.details || '-'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {log.created_at ? log.created_at.substring(0, 16) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Canals
