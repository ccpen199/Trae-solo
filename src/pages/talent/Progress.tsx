import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, Circle, Clock } from 'lucide-react'
import { declarationList } from '@/mocks/talent'

const ocrStatusLabel: Record<string, { text: string; cls: string }> = {
  success: { text: '识别成功', cls: 'bg-green-100 text-gov-success' },
  pending: { text: '待识别', cls: 'bg-yellow-100 text-gov-warning' },
  failed: { text: '识别失败', cls: 'bg-red-100 text-gov-error' },
}

export default function Progress() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const declaration = declarationList.find((d) => d.id === id)

  if (!declaration) {
    return (
      <div className="min-h-screen bg-gov-bg flex items-center justify-center">
        <p className="text-gov-muted">未找到申报记录</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gov-bg p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/talent')} className="flex items-center gap-1 text-gov-muted hover:text-primary-500 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>

        <div className="gov-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded font-medium">{declaration.category}</span>
            <span className="gov-badge-info">{declaration.statusName}</span>
          </div>
          <h1 className="text-xl font-semibold text-gov-text">
            {declaration.currentTitle} → {declaration.targetTitle}
          </h1>
          <p className="text-gov-muted text-sm mt-1">提交时间：{declaration.submitTime}</p>
        </div>

        <div className="gov-card p-6 mb-6">
          <h2 className="gov-section-title mb-6">申报进度</h2>
          <div className="relative pl-8">
            {declaration.progress.map((node, idx) => (
              <div key={node.step} className={`relative pb-8 last:pb-0 ${idx < declaration.progress.length - 1 ? '' : ''}`}>
                {idx < declaration.progress.length - 1 && (
                  <div className={`absolute left-[-20px] top-[18px] w-0.5 h-[calc(100%-18px)] ${
                    node.status === 'completed' ? 'bg-gov-success' : 'bg-gray-200'
                  }`} />
                )}
                <div className={`absolute left-[-26px] top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center ${
                  node.status === 'completed' ? 'bg-gov-success' :
                  node.status === 'current' ? 'bg-primary-500 animate-pulse' :
                  'bg-gray-200'
                }`}>
                  {node.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  {node.status === 'current' && <Clock className="w-3 h-3 text-white animate-spin" />}
                  {node.status === 'pending' && <Circle className="w-3 h-3 text-gray-400" />}
                </div>
                <div>
                  <p className={`font-medium ${node.status === 'pending' ? 'text-gov-muted' : 'text-gov-text'}`}>
                    {node.step}
                  </p>
                  {node.time && <p className="text-xs text-gov-muted mt-0.5">{node.time}</p>}
                  {node.operator && <p className="text-xs text-gov-muted">办理人：{node.operator}</p>}
                  {node.remark && <p className="text-xs text-primary-600 mt-1">{node.remark}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gov-card p-6">
          <h2 className="gov-section-title mb-4">申报材料</h2>
          <div className="space-y-3">
            {declaration.materials.map((mat) => {
              const ocr = ocrStatusLabel[mat.ocrStatus]
              return (
                <div key={mat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gov-text text-sm">{mat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mat.uploaded ? 'bg-green-100 text-gov-success' : 'bg-gray-100 text-gray-500'}`}>
                      {mat.uploaded ? '已上传' : '未上传'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ocr.cls}`}>{ocr.text}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
