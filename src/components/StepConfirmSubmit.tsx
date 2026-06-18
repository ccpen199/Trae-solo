import { useState } from 'react'
import { CheckSquare, Square, FileText } from 'lucide-react'

const COMMITMENT_TEXT = `根据《中华人民共和国社会保险法》及有关规定，本人郑重承诺：

一、本人所提供的申领材料及信息真实、准确、完整，不存在虚假记载、误导性陈述或重大遗漏。

二、本人符合失业保险金申领条件，已按规定参加失业保险，所在单位和本人已按照规定履行缴费义务满一年。

三、本人已依法办理失业登记，并有求职要求。

四、本人承诺在规定期限内补交所缺材料，如逾期未补交，自愿承担相应法律后果。

五、如发现本人提供虚假材料或隐瞒真实情况，自愿承担由此产生的一切法律责任，并退还已领取的失业保险金。

承诺人（签字）：____________
日期：____________`

interface StepConfirmProps {
  idNumber: string
  cardNumber: string
  bankName: string
  reason: string
  unemploymentDate: string
  deficientMaterials: string[]
  onSubmit: () => void
}

const MATERIAL_LABELS: Record<string, string> = {
  labor_proof: '解除劳动关系证明',
  id_card: '身份证正反面',
  hukou: '户口本',
}

export default function StepConfirmSubmit({
  idNumber,
  cardNumber,
  bankName,
  reason,
  unemploymentDate,
  deficientMaterials,
  onSubmit,
}: StepConfirmProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>身份信息</h3>
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ backgroundColor: '#F7F8FA' }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: '#86909C' }}>身份证号</span>
            <span style={{ color: '#1D2129' }}>{idNumber}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>银行卡信息</h3>
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ backgroundColor: '#F7F8FA' }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: '#86909C' }}>银行卡号</span>
            <span style={{ color: '#1D2129' }}>{cardNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#86909C' }}>开户行</span>
            <span style={{ color: '#1D2129' }}>{bankName}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>申领信息</h3>
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{ backgroundColor: '#F7F8FA' }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: '#86909C' }}>失业原因</span>
            <span style={{ color: '#1D2129' }}>{reason}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#86909C' }}>失业日期</span>
            <span style={{ color: '#1D2129' }}>{unemploymentDate}</span>
          </div>
        </div>
      </div>

      {deficientMaterials.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>容缺材料</h3>
          <div
            className="rounded-lg p-3 space-y-1.5"
            style={{ backgroundColor: '#FFFBE8' }}
          >
            {deficientMaterials.map((id) => (
              <div key={id} className="flex items-center gap-1.5 text-sm" style={{ color: '#FF7D00' }}>
                <FileText size={14} />
                {MATERIAL_LABELS[id] || id}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-medium text-sm" style={{ color: '#1D2129' }}>电子承诺书</h3>
        <div
          className="rounded-lg p-4 h-40 overflow-y-auto text-xs leading-relaxed"
          style={{ backgroundColor: '#F7F8FA', color: '#4E5969' }}
        >
          {COMMITMENT_TEXT}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span onClick={() => setAgreed(!agreed)}>
            {agreed ? (
              <CheckSquare size={18} style={{ color: '#165DFF' }} />
            ) : (
              <Square size={18} style={{ color: '#86909C' }} />
            )}
          </span>
          <span className="text-sm" style={{ color: '#4E5969' }}>我已阅读并同意上述承诺</span>
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={!agreed}
        className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#165DFF' }}
      >
        提交申领
      </button>
    </div>
  )
}
