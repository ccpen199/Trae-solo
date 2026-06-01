import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Application, Zone, Crop, Gate } from '@/types'

interface ApplicationModalsProps {
  modalOpen: boolean
  setModalOpen: (open: boolean) => void
  editingItem: Application | null
  formData: Partial<Application>
  setFormData: (data: Partial<Application>) => void
  handleSubmit: () => void
  zones: Zone[]
  crops: Crop[]
  gates: Gate[]
  rejectModalOpen: boolean
  setRejectModalOpen: (open: boolean) => void
  selectedItem: Application | null
  rejectReason: string
  setRejectReason: (reason: string) => void
  handleReject: () => void
  scheduleModalOpen: boolean
  setScheduleModalOpen: (open: boolean) => void
  scheduleData: {
    gate_id: number
    scheduled_date: string
    start_time: string
    end_time: string
    planned_flow: number
    planned_volume: number
    sequence: number
    description: string
  }
  setScheduleData: (data: ApplicationModalsProps['scheduleData']) => void
  handleGenerateSchedule: () => void
  deleteConfirm: { open: boolean; id: number | null }
  setDeleteConfirm: (confirm: { open: boolean; id: number | null }) => void
  handleDelete: () => void
}

const ApplicationModals = ({
  modalOpen, setModalOpen, editingItem, formData, setFormData,
  handleSubmit, zones, crops,
  rejectModalOpen, setRejectModalOpen, selectedItem,
  rejectReason, setRejectReason, handleReject,
  scheduleModalOpen, setScheduleModalOpen, scheduleData,
  setScheduleData, handleGenerateSchedule, gates,
  deleteConfirm, setDeleteConfirm, handleDelete,
}: ApplicationModalsProps) => {
  return (
    <>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? '编辑申请' : '新增申请'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingItem ? '保存' : '提交'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请人 *</label>
              <input
                type="text"
                value={formData.applicant_name || ''}
                onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入申请人名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申请人类型</label>
              <select
                value={formData.applicant_type || 'individual'}
                onChange={(e) => setFormData({ ...formData, applicant_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">个人</option>
                <option value="collective">集体</option>
                <option value="enterprise">企业</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">灌区 *</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">作物 *</label>
              <select
                value={formData.crop_type_id || 0}
                onChange={(e) => setFormData({ ...formData, crop_type_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>请选择作物</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">灌溉面积 (亩) *</label>
              <input
                type="number"
                value={formData.irrigation_area || 0}
                onChange={(e) => setFormData({ ...formData, irrigation_area: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预估水量 (m³) *</label>
              <input
                type="number"
                value={formData.estimated_water || 0}
                onChange={(e) => setFormData({ ...formData, estimated_water: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期 *</label>
              <input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期 *</label>
              <input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级 (1-5，1最高)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.priority || 5}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">申请事由</label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入申请事由"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="驳回申请"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>取消</Button>
            <Button variant="danger" onClick={handleReject}>确认驳回</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要驳回 <span className="font-medium">{selectedItem?.applicant_name}</span> 的用水申请吗？
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因 *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入驳回原因"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="生成用水计划"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleModalOpen(false)}>取消</Button>
            <Button onClick={handleGenerateSchedule}>生成计划</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-700">
              申请人：<span className="font-medium">{selectedItem?.applicant_name}</span>
              <br />
              预估水量：<span className="font-medium">{selectedItem?.estimated_water} m³</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">闸门 *</label>
              <select
                value={scheduleData.gate_id || 0}
                onChange={(e) => setScheduleData({ ...scheduleData, gate_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>请选择闸门</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计划日期 *</label>
              <input
                type="date"
                value={scheduleData.scheduled_date}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间 *</label>
              <input
                type="time"
                value={scheduleData.start_time}
                onChange={(e) => setScheduleData({ ...scheduleData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间 *</label>
              <input
                type="time"
                value={scheduleData.end_time}
                onChange={(e) => setScheduleData({ ...scheduleData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计划流量 (m³/h) *</label>
              <input
                type="number"
                value={scheduleData.planned_flow}
                onChange={(e) => setScheduleData({ ...scheduleData, planned_flow: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计划水量 (m³) *</label>
              <input
                type="number"
                value={scheduleData.planned_volume}
                onChange={(e) => setScheduleData({ ...scheduleData, planned_volume: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">执行顺序</label>
            <input
              type="number"
              value={scheduleData.sequence}
              onChange={(e) => setScheduleData({ ...scheduleData, sequence: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <p className="text-gray-600">确定要删除该申请吗？此操作不可恢复。</p>
      </Modal>
    </>
  )
}

export default ApplicationModals
