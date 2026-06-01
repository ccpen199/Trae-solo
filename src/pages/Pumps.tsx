import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Zap } from 'lucide-react'
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
import { pumpApi, canalApi } from '@/services/api'
import type { Pump, Canal } from '@/types'

const Pumps = () => {
  const [loading, setLoading] = useState(true)
  const [pumps, setPumps] = useState<Pump[]>([])
  const [canals, setCanals] = useState<Canal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Pump | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [formData, setFormData] = useState<Partial<Pump>>({
    name: '',
    code: '',
    canal_id: 0,
    flow_rate: 0,
    power: 0,
    status: 'stopped',
    description: '',
  })

  useEffect(() => {
    fetchData()
    fetchCanals()
  }, [page, keyword, status])

  const fetchCanals = async () => {
    try {
      const res = await canalApi.getList({ pageSize: 100 })
      setCanals(res.data.list)
    } catch (err) {
      console.error('获取渠道列表失败:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await pumpApi.getList({ keyword, status, page, pageSize })
      setPumps(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await pumpApi.update(editingItem.id, { ...formData, user_name: '管理员' })
      } else {
        await pumpApi.create({ ...formData, user_name: '管理员' })
      }
      setModalOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await pumpApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleEdit = (item: Pump) => {
    setEditingItem(item)
    setFormData(item)
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      code: '',
      canal_id: 0,
      flow_rate: 0,
      power: 0,
      status: 'stopped',
      description: '',
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              泵站管理
            </CardTitle>
            <Button onClick={() => { resetForm(); setModalOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              新增泵站
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索泵站名称或编码..."
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
              <option value="running">运行中</option>
              <option value="stopped">已停止</option>
              <option value="fault">故障</option>
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
                    <TableHead>所属渠道</TableHead>
                    <TableHead>流量 (m³/h)</TableHead>
                    <TableHead>功率 (kW)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pumps.map((pump) => (
                    <TableRow key={pump.id}>
                      <TableCell className="font-mono">{pump.code}</TableCell>
                      <TableCell className="font-medium">{pump.name}</TableCell>
                      <TableCell>{pump.canal_name || '-'}</TableCell>
                      <TableCell>{pump.flow_rate}</TableCell>
                      <TableCell>{pump.power}</TableCell>
                      <TableCell>
                        <StatusBadge status={pump.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(pump)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, id: pump.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pumps.length === 0 && (
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
        title={editingItem ? '编辑泵站' : '新增泵站'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingItem ? '保存' : '创建'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">泵站编码 *</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入泵站编码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">泵站名称 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入泵站名称"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所属渠道 *</label>
            <select
              value={formData.canal_id || 0}
              onChange={(e) => setFormData({ ...formData, canal_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>请选择渠道</option>
              {canals.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">流量 (m³/h) *</label>
              <input
                type="number"
                value={formData.flow_rate || 0}
                onChange={(e) => setFormData({ ...formData, flow_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">功率 (kW) *</label>
              <input
                type="number"
                value={formData.power || 0}
                onChange={(e) => setFormData({ ...formData, power: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status || 'stopped'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="running">运行中</option>
              <option value="stopped">已停止</option>
              <option value="fault">故障</option>
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
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, id: null })}>取消</Button>
            <Button variant="danger" onClick={handleDelete}>删除</Button>
          </>
        }
      >
        <p className="text-gray-600">确定要删除该泵站吗？此操作不可恢复。</p>
      </Modal>
    </div>
  )
}

export default Pumps
