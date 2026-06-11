import { CheckCircle, Download, FileCheck } from 'lucide-react';

export default function StepResult() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gov-text mb-1">审批通过</h3>
        <p className="text-sm text-gov-text-secondary">您的申请已审批通过，相关证照已生成</p>
      </div>

      <div className="gov-card p-6 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gov-text">电子证照</p>
            <p className="text-xs text-gov-text-secondary">签发日期：2026-06-09</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">证照类型</span>
            <span className="text-gov-text font-medium">办理凭证</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">证照编号</span>
            <span className="text-gov-text font-medium">KS202606090001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gov-text-secondary">有效期至</span>
            <span className="text-gov-text font-medium">2031-06-09</span>
          </div>
        </div>
      </div>

      <button className="gov-btn-primary inline-flex items-center gap-2">
        <Download className="w-4 h-4" />
        下载证照
      </button>
    </div>
  );
}
