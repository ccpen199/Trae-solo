import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, GitBranch } from 'lucide-react'
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
import { gateApi, canalApi, zoneApi } from '@/services/api'
import type { Gate, Canal, Zone } from '@/types'

const Gates = () => {
  const [loading, setLoading] = useState(true)
  const [gates, setGates] = useState<Gate[]>([])
  const [canals, setCanals] = useState<Canal[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Gate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [formData, setFormData] = useState<Partial<Gate>>({
    name: '',
    code: '',
    canal_id: 0,
    zone_id: 0,
    max_opening: 0,
    status: 'closed',
    description: '',
  })

  useEffect(() => {
    fetchData()
    fetchCanals()
    fetchZones()
  }, [page, keyword, status])

  const fetchCanals = async () => {
    try {
      const res = await canalApi.getList({ pageSize: 100 })
      setCanals(res.data.list)
    } catch (err) {
      console.error('获取渠道列表失败:', err)
    }
  }

  const fetchZones = async () => {
    try {
      const res = await zoneApi.getList({ pageSize: 100 })
      setZones(res.data.list)
    } catch (err) {
      console.error('获取灌区列表失败:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await gateApi.getList({ keyword, status, page, pageSize })
      setGates(res.data.list)
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
        await gateApi.update(editingItem.id, { ...formData, user_name: '管理员' })
      } else {
        await gateApi.create({ ...formData, user_name: '管理员' })
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
      await gateApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleEdit = (item: Gate) => {
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
      zone_id: 0,
      max_opening: 0,
      status: 'closed',
      description: '',
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <GitBranch className="h-5 w-5 mr-2 text-green-500" />
              闸门管理
            </CardTitle>
            <Button onClick={() => { resetForm(); setModalOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              新增闸门
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索闸门名称或编码..."
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
              <option value="open">开启</option>
              <option value="closed">关闭</option>
              <option value="partial">部分开启</option>
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
                    <TableHead>所属灌区</TableHead>
                    <TableHead>最大开度</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gates.map((gate) => (
                    <TableRow key={gate.id}>
                      <TableCell className="font-mono">{gate.code}</TableCell>
                      <TableCell className="font-medium">{gate.name}</TableCell>
                      <TableCell>{gate.canal_name || '-'}</TableCell>
                      <TableCell>{gate.zone_name || '-'}</TableCell>
                      <TableCell>{gate.max_opening}%</TableCell>
                      <TableCell>
                        <StatusBadge status={gate.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(gate)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, id: gate.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {gates.length === 0 && (
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
        title={editingItem ? '编辑闸门' : '新增闸门'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">闸门编码 *</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入闸门编码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">闸门名称 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入闸门名称"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属灌区</label>
              <select
                value={formData.zone_id || 0}
                onChange={(e) => setFormData({ ...formData, zone_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>请选择灌区</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大开度 (%) *</label>
            <input
              type="number"
              value={formData.max_opening || 0}
              onChange={(e) => setFormData({ ...formData, max_opening: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入最大开度"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status || 'closed'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">开启</option>
              <option value="closed">关闭</option>
              <option value="partial">部分开启</option>
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
        <p className="text-gray-600">确定要删除该闸门吗？此操作不可恢复。</p>
      </Modal>
    </div>
  )
}

export default Gates
