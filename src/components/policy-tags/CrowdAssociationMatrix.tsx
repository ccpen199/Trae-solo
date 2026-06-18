import { Check, Minus, HelpCircle, Wand2, Save } from 'lucide-react'
import { useState } from 'react'

type ApplicableStatus = 'yes' | 'no' | 'conditional'

interface MatrixRow {
  clause: string
  shortName: string
  status: ApplicableStatus[]
}

const crowds = ['企业职工', '灵活就业', '城乡居民', '退休人员', '失业人员', '工伤人员']

const initialRows: MatrixRow[] = [
  {
    clause: '关于2026年调整退休人员基本养老金的通知·第一条',
    shortName: '养老金调整·范围',
    status: ['no', 'no', 'no', 'yes', 'no', 'no'],
  },
  {
    clause: '关于完善灵活就业人员养老保险政策的通知·第二条',
    shortName: '灵活就业·缴费',
    status: ['no', 'yes', 'conditional', 'no', 'no', 'no'],
  },
  {
    clause: '关于做好2026年城乡居民基本医疗保险工作的通知·第三条',
    shortName: '居民医保·待遇',
    status: ['no', 'no', 'yes', 'conditional', 'no', 'no'],
  },
  {
    clause: '关于失业保险金标准调整的通知·第三条',
    shortName: '失业保险·期限',
    status: ['yes', 'conditional', 'no', 'no', 'yes', 'no'],
  },
  {
    clause: '关于工伤保险费率调整的指导意见·第二条',
    shortName: '工伤保险·费率',
    status: ['yes', 'conditional', 'no', 'no', 'no', 'yes'],
  },
]

const statusStyles: Record<ApplicableStatus, { bg: string; icon: JSX.Element; text: string }> = {
  yes: {
    bg: 'bg-green-50 text-green-600 hover:bg-green-100',
    icon: <Check size={14} />,
    text: '适用',
  },
  no: {
    bg: 'bg-gray-50 text-gray-400 hover:bg-gray-100',
    icon: <Minus size={14} />,
    text: '不适用',
  },
  conditional: {
    bg: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    icon: <HelpCircle size={14} />,
    text: '有条件适用',
  },
}

export default function CrowdAssociationMatrix() {
  const [rows, setRows] = useState(initialRows)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())

  const cycleStatus = (current: ApplicableStatus): ApplicableStatus => {
    if (current === 'yes') return 'no'
    if (current === 'no') return 'conditional'
    return 'yes'
  }

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    setRows((prev) =>
      prev.map((r, ri) => {
        if (ri !== rowIdx) return r
        const newStatus = [...r.status]
        newStatus[colIdx] = cycleStatus(newStatus[colIdx])
        return { ...r, status: newStatus }
      })
    )
  }

  const toggleCellSelect = (rowIdx: number, colIdx: number) => {
    const key = `${rowIdx}-${colIdx}`
    setSelectedCells((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const runSmartMatch = () => {
    const optimized: MatrixRow[] = rows.map((row) => {
      if (row.shortName.includes('养老金')) {
        return { ...row, status: ['no', 'no', 'no', 'yes', 'no', 'no'] }
      }
      if (row.shortName.includes('灵活就业')) {
        return { ...row, status: ['no', 'yes', 'conditional', 'no', 'no', 'no'] }
      }
      if (row.shortName.includes('医保')) {
        return { ...row, status: ['no', 'conditional', 'yes', 'conditional', 'conditional', 'no'] }
      }
      if (row.shortName.includes('失业')) {
        return { ...row, status: ['yes', 'yes', 'no', 'no', 'yes', 'no'] }
      }
      if (row.shortName.includes('工伤')) {
        return { ...row, status: ['yes', 'conditional', 'no', 'no', 'no', 'yes'] }
      }
      return row
    })
    setRows(optimized)
  }

  const yesCount = rows.reduce((sum, r) => sum + r.status.filter((s) => s === 'yes').length, 0)
  const conditionalCount = rows.reduce((sum, r) => sum + r.status.filter((s) => s === 'conditional').length, 0)

  return (
    <div className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">政策条款 × 适用人群 关联矩阵</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            已匹配 {yesCount} 项 · 条件性 {conditionalCount} 项 · 总计 {rows.length * crowds.length} 项
          </p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 bg-gray-50 sticky left-0 z-10 font-medium text-gray-600 border-b border-gray-100 min-w-[140px]">
                政策条款
              </th>
              {crowds.map((c) => (
                <th
                  key={c}
                  className="text-center py-2 px-2 bg-gray-50 font-medium text-gray-600 border-b border-gray-100"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-50 last:border-0">
                <td
                  className="py-2 px-2 bg-white sticky left-0 z-10"
                  title={row.clause}
                >
                  <span className="text-gray-700">{row.shortName}</span>
                </td>
                {row.status.map((s, ci) => {
                  const key = `${ri}-${ci}`
                  const isSelected = selectedCells.has(key)
                  const style = statusStyles[s]
                  return (
                    <td key={ci} className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleCellClick(ri, ci)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          toggleCellSelect(ri, ci)
                        }}
                        className={`w-full h-8 rounded flex items-center justify-center transition-all ${style.bg} ${
                          isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        title={`${crowds[ci]} ${style.text} · 点击切换 · 右键选中`}
                      >
                        {style.icon}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {Object.entries(statusStyles).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1 text-xs text-gray-500">
            <span className={`w-5 h-5 rounded flex items-center justify-center ${v.bg}`}>
              {v.icon}
            </span>
            {v.text}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          全选当前视图
        </button>
        <button
          onClick={runSmartMatch}
          className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
        >
          <Wand2 size={12} />
          智能匹配
        </button>
        <div className="flex-1" />
        <button className="px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1">
          <Save size={12} />
          批量应用
        </button>
      </div>
    </div>
  )
}
