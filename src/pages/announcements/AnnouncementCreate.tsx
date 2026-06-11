import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Send } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const buildings = ['1号楼', '2号楼', '3号楼', '5号楼', '7号楼']
const units = ['1单元', '2单元', '3单元']
const roles = ['业主', '租户', '物业人员', '访客']

export default function AnnouncementCreate() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('normal')
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [preview, setPreview] = useState(false)

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  const handleSubmit = (_action?: 'draft' | 'publish') => {
    navigate('/announcements')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="发布公告" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">公告标题 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入公告标题"
                className="w-full h-10 px-4 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">公告内容 <span className="text-red-500">*</span></label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入公告内容"
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
              <div className="flex gap-2">
                {[
                  { value: 'normal', label: '普通' },
                  { value: 'important', label: '重要' },
                  { value: 'urgent', label: '紧急' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      priority === opt.value
                        ? opt.value === 'urgent' ? 'bg-red-50 border-red-300 text-red-700' :
                          opt.value === 'important' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                          'bg-slate-50 border-slate-300 text-slate-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">推送范围</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">楼栋</label>
                <div className="flex flex-wrap gap-2">
                  {buildings.map((b) => (
                    <button
                      key={b}
                      onClick={() => toggleItem(selectedBuildings, b, setSelectedBuildings)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedBuildings.includes(b)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">单元</label>
                <div className="flex flex-wrap gap-2">
                  {units.map((u) => (
                    <button
                      key={u}
                      onClick={() => toggleItem(selectedUnits, u, setSelectedUnits)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedUnits.includes(u)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">角色</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleItem(selectedRoles, r, setSelectedRoles)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedRoles.includes(r)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className="h-10 px-4 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Eye size={16} />{preview ? '关闭预览' : '预览'}
            </button>
            <button
              onClick={() => handleSubmit('draft')}
              className="h-10 px-4 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              存为草稿
            </button>
            <button
              onClick={() => handleSubmit('publish')}
              disabled={!title || !content}
              className="h-10 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />发布
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
