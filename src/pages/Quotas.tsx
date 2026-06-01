import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
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
import { quotaApi, zoneApi, cropApi } from '@/services/api'
import type { Quota, Zone, Crop } from '@/types'

const SEASON_OPTIONS = [
  { value: '春季', label: '春季' },
  { value: '夏季', label: '夏季' },
  { value: '秋季', label: '秋季' },
  { value: '冬季', label: '冬季' },
  { value: '全年', label: '全年' },
]

const Quotas = () => {
  const [loading, setLoading] = useState(true)
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filterZoneId, setFilterZoneId] = useState<number | ''>('')
  const [filterCropTypeId, setFilterCropTypeId] = useState<number | ''>('')
  const [filterSeason, setFilterSeason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [zones, setZones] = useState<Zone[]>([])
  const [crops, setCrops] = useState<Crop[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Quota | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [formData, setFormData] = useState({
    zone_id: 0,
    crop_type_id: 0,
    season: '',
    total_quota: 0,
    year: new Date().getFullYear(),
    unit: 'm³',
    description: '',
  })

  useEffect(() => {
    fetchDropdowns()
  }, [])

  useEffect(() => {
    fetchQuotas()
  }, [page, filterZoneId, filterCropTypeId, filterSeason])

  const fetchDropdowns = async () => {
    try {
      const [zonesRes, cropsRes] = await Promise.all([
        zoneApi.getList({ pageSize: 1000 }),
        cropApi.getList({ pageSize: 1000 }),
      ])
      setZones(zonesRes.data.list)
      setCrops(cropsRes.data.list)
    } catch {
      // ignore dropdown load failure
    }
  }

  const fetchQuotas = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, unknown> = { page, pageSize }
      if (filterZoneId) params.zone_id = filterZoneId
      if (filterCropTypeId) params.crop_type_id = filterCropTypeId
      if (filterSeason) params.season = filterSeason
      const res = await quotaApi.getList(params as Parameters<typeof quotaApi.getList>[0])
      setQuotas(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = { ...formData, user_name: '管理员' } as Partial<Quota> & {
        user_name?: string
        description?: string
      }
      if (editingItem) {
        await quotaApi.update(editingItem.id, payload)
      } else {
        await quotaApi.create(payload)
      }
      setModalOpen(false)
      resetForm()
      fetchQuotas()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await quotaApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchQuotas()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleEdit = (item: Quota) => {
    setEditingItem(item)
    setFormData({
      zone_id: item.zone_id,
      crop_type_id: item.crop_type_id,
      season: item.season,
      total_quota: item.total_quota,
      year: item.year,
      unit: item.unit || 'm³',
      description: '',
    })
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      zone_id: 0,
      crop_type_id: 0,
      season: '',
      total_quota: 0,
      year: new Date().getFullYear(),
      unit: 'm³',
      description: '',
    })
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const getZoneName = (id: number) => zones.find((z) => z.id === id)?.name || '-'
  const getCropName = (id: number) => crops.find((c) => c.id === id)?.name || '-'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>用水定额</CardTitle>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              新增定额
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterZoneId}
                onChange={(e) => {
                  setFilterZoneId(e.target.value ? Number(e.target.value) : '')
                  setPage(1)
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部灌区</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterCropTypeId}
              onChange={(e) => {
                setFilterCropTypeId(e.target.value ? Number(e.target.value) : '')
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部作物</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterSeason}
              onChange={(e) => {
                setFilterSeason(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部季节</option>
              {SEASON_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
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
                    <TableHead>灌区名称</TableHead>
                    <TableHead>作物名称</TableHead>
                    <TableHead>季节</TableHead>
                    <TableHead>亩均定额(m³)</TableHead>
                    <TableHead>生效日期</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.id}>
                      <TableCell className="font-medium">
                        {quota.zone_name || getZoneName(quota.zone_id)}
                      </TableCell>
                      <TableCell>
                        {quota.crop_name || getCropName(quota.crop_type_id)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={quota.season} />
                      </TableCell>
                      <TableCell>{quota.total_quota}</TableCell>
                      <TableCell>{quota.year}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        -
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(quota)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteConfirm({ open: true, id: quota.id })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quotas.length === 0 && (
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
        title={editingItem ? '编辑定额' : '新增定额'}
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
              灌区 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.zone_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, zone_id: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择灌区</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作物 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.crop_type_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  crop_type_id: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择作物</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              季节 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.season}
              onChange={(e) =>
                setFormData({ ...formData, season: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择季节</option>
              {SEASON_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                亩均定额(m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.total_quota || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_quota: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入亩均定额"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生效年份 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入生效年份"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm({ open: false, id: null })}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              删除
            </Button>
          </>
        }
      >
        <p className="text-gray-600">确定要删除该用水定额吗？此操作不可恢复。</p>
      </Modal>
    </div>
  )
}

export default Quotas
