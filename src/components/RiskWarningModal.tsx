import React from 'react'
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react'
import { Modal } from './Modal'

interface RiskWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const RiskWarningModal: React.FC<RiskWarningModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="风险提示">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">警惕预收费陷阱</h4>
            <p className="text-sm text-red-700 mt-1">
              部分不良商家可能会以"定金"、"上门费"、"检测费"等名义提前收费，
              请务必注意防范！
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">建议在服务完成并验收合格后再支付费用</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">如需预付款，请与师傅确认金额并留存支付凭证</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">本平台不抽佣金，交易由双方自主协商完成</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input type="checkbox" id="risk-acknowledge" className="rounded" />
              我已阅读并知晓以上风险提示
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">
            取消
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1"
          >
            我已知晓，继续发布
          </button>
        </div>
      </div>
    </Modal>
  )
}
