import { User, Phone, CreditCard, FileText } from 'lucide-react';

interface StepApplicationProps {
  name: string;
  phone: string;
  idCard: string;
  reason: string;
  errors: Record<string, string>;
  onUpdate: (data: { name?: string; phone?: string; idCard?: string; reason?: string }) => void;
}

export default function StepApplication({ name, phone, idCard, reason, errors, onUpdate }: StepApplicationProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-gov-text mb-1.5 flex items-center gap-1.5">
          <User className="w-4 h-4 text-gov-blue" />
          申请人姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className={`gov-input ${errors.name ? 'border-red-400 focus:ring-red-200' : ''}`}
          placeholder="请输入姓名"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gov-text mb-1.5 flex items-center gap-1.5">
          <Phone className="w-4 h-4 text-gov-blue" />
          联系电话 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className={`gov-input ${errors.phone ? 'border-red-400 focus:ring-red-200' : ''}`}
          placeholder="请输入手机号码"
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gov-text mb-1.5 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-gov-blue" />
          证件号码 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={idCard}
          onChange={(e) => onUpdate({ idCard: e.target.value })}
          className={`gov-input ${errors.idCard ? 'border-red-400 focus:ring-red-200' : ''}`}
          placeholder="请输入身份证号"
        />
        {errors.idCard && <p className="text-xs text-red-500 mt-1">{errors.idCard}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-gov-text mb-1.5 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-gov-blue" />
          办理事由 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => onUpdate({ reason: e.target.value })}
          className={`gov-input min-h-[100px] resize-none ${errors.reason ? 'border-red-400 focus:ring-red-200' : ''}`}
          placeholder="请简要说明办理事由"
        />
        {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
      </div>
    </div>
  );
}
