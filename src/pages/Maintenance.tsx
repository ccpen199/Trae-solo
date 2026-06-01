import { useEffect, useState } from 'react'
import { api, Mold, MaintenanceRecord } from '@/lib/api'
import { Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function Maintenance() {
  const [molds, setMolds] = useState<Mold[]>([])
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [selectedMold, setSelectedMold] = useState<Mold | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
  const [startForm, setStartForm] = useState({ fault_symptom: '', repair_person: '' })
  const [completeForm, setCompleteForm] = useState({ repair_content: '', spare_parts: '', downtime_minutes: 0 })
  const [acceptForm, setAcceptForm] = useState({ acceptance_result: 'pass', acceptance_person: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [moldsRes, recordsRes] = await Promise.all([
        api.getMolds(),
        api.getMaintenanceRecords(),
      ])
      if (moldsRes.success) setMolds(moldsRes.data)
      if (recordsRes.success) setRecords(recordsRes.data)
    } finally {
      setLoading(false)
    }
  }

  function showMessage(type: 'success' | 'error' | 'warning', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMold) return

    const res = await api.startMaintenance({
      mold_id: selectedMold.id,
      ...startForm,
    })

    if (res.success) {
      if (res.warning) showMessage('warning', res.warning)
      else showMessage('success', '维修已开始')
      setShowStartModal(false)
      loadData()
    } else {
      showMessage('error', res.error || '操作失败')
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecord) return

    const res = await api.completeMaintenance({
      id: selectedRecord.id,
      ...completeForm,
    })

    if (res.success) {
      showMessage('success', res.message)
      setShowCompleteModal(false)
      loadData()
    } else {
      showMessage('error', res.error || '操作失败')
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRecord) return

    const res = await api.acceptMaintenance({
      id: selectedRecord.id,
      ...acceptForm,
    })

    if (res.success) {
      showMessage('success', res.message)
      setShowAcceptModal(false)
      loadData()
    } else {
      showMessage('error', res.error || '操作失败')
    }
  }

  const availableMolds = molds.filter((m) => m.status !== 'maintenance')
  const pendingRecords = records.filter((r) => !r.acceptance_result)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">维修保养</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : message.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">发起维修</h3>
          <button
            onClick={() => {
              setSelectedMold(null)
              setStartForm({ fault_symptom: '', repair_person: '' })
              setShowStartModal(true)
            }}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            发起维修
          </button>
        </div>

        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-6">发起维修保养</h3>
              <form onSubmit={handleStart} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">选择模具</label>
                  <select
                    value={selectedMold?.id || ''}
                    onChange={(e) => {
                      const mold = molds.find((m) => m.id === Number(e.target.value))
                      setSelectedMold(mold || null)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    required
                  >
                    <option value="">-- 请选择模具 --</option>
                    {availableMolds.map((mold) => (
                      <option key={mold.id} value={mold.id}>
                        {mold.mold_number} - {mold.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    故障现象 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={startForm.fault_symptom}
                    onChange={(e) => setStartForm({ ...startForm, fault_symptom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    rows={4}
                    placeholder="请详细描述故障现象，如：飞边严重、缺料、气泡等"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    维修人员 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={startForm.repair_person}
                    onChange={(e) => setStartForm({ ...startForm, repair_person: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                    placeholder="请输入维修人员姓名"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStartModal(false)
                      setSelectedMold(null)
                      setStartForm({ fault_symptom: '', repair_person: '' })
                    }}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    开始维修
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">待处理维修</h3>
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : pendingRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无待处理维修</div>
        ) : (
          <div className="space-y-3">
            {pendingRecords.map((record) => (
              <div key={record.id} className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{record.mold_number}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-sm text-gray-600">{record.product_name}</span>
                      {record.is_repeated_fault && (
                        <span className="ml-2 flex items-center text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          重复故障
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">故障现象:</span> {record.fault_symptom}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      维修人员: {record.repair_person} | 开始时间: {record.start_time}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!record.end_time && (
                      <button
                        onClick={() => {
                          setSelectedRecord(record)
                          setCompleteForm({ repair_content: '', spare_parts: '', downtime_minutes: 0 })
                          setShowCompleteModal(true)
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        完成维修
                      </button>
                    )}
                    {record.end_time && !record.acceptance_result && (
                      <button
                        onClick={() => {
                          setSelectedRecord(record)
                          setAcceptForm({ acceptance_result: 'pass', acceptance_person: '' })
                          setShowAcceptModal(true)
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        验收
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCompleteModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-6">完成维修 - {selectedRecord.mold_number}</h3>
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">故障现象:</span> {selectedRecord.fault_symptom}
                </p>
              </div>
              <form onSubmit={handleComplete} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    维修内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={completeForm.repair_content}
                    onChange={(e) => setCompleteForm({ ...completeForm, repair_content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={4}
                    placeholder="请详细描述维修内容和处理过程"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    更换备件
                  </label>
                  <textarea
                    value={completeForm.spare_parts}
                    onChange={(e) => setCompleteForm({ ...completeForm, spare_parts: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={2}
                    placeholder="如：弹簧x2, 密封圈x1, 导柱x1（若无备件更换请填写'无'）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    停机时长（分钟） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={completeForm.downtime_minutes}
                    onChange={(e) => setCompleteForm({ ...completeForm, downtime_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="请输入实际停机分钟数"
                    min="0"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteModal(false)
                      setCompleteForm({ repair_content: '', spare_parts: '', downtime_minutes: 0 })
                    }}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    完成维修
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAcceptModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-6">维修验收 - {selectedRecord.mold_number}</h3>
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-500">故障现象:</span>
                  <p className="text-sm text-gray-800 mt-1">{selectedRecord.fault_symptom}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">维修内容:</span>
                  <p className="text-sm text-gray-800 mt-1">{selectedRecord.repair_content || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">更换备件:</span>
                  <p className="text-sm text-gray-800 mt-1">{selectedRecord.spare_parts || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">停机时长:</span>
                  <p className="text-sm text-gray-800 mt-1">{selectedRecord.downtime_minutes || 0} 分钟</p>
                </div>
              </div>
              <form onSubmit={handleAccept} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    验收结果 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={acceptForm.acceptance_result}
                    onChange={(e) => setAcceptForm({ ...acceptForm, acceptance_result: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                  >
                    <option value="pass">✅ 验收通过</option>
                    <option value="fail">❌ 验收不通过</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    验收人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={acceptForm.acceptance_person}
                    onChange={(e) => setAcceptForm({ ...acceptForm, acceptance_person: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    placeholder="请输入验收人姓名"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAcceptModal(false)
                      setAcceptForm({ acceptance_result: 'pass', acceptance_person: '' })
                    }}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    确认验收
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">维修历史</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">产品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">故障现象</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">维修人员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">停机时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">开始时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.slice(0, 20).map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {record.mold_number}
                    {record.is_repeated_fault && (
                      <AlertTriangle className="w-4 h-4 text-red-500 inline ml-1" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.product_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{record.fault_symptom}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.repair_person}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.downtime_minutes || '-'} 分钟</td>
                  <td className="px-4 py-3">
                    {record.acceptance_result === 'pass' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        验收通过
                      </span>
                    )}
                    {record.acceptance_result === 'fail' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        验收不通过
                      </span>
                    )}
                    {!record.acceptance_result && record.end_time && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        待验收
                      </span>
                    )}
                    {!record.end_time && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                        维修中
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{record.start_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
