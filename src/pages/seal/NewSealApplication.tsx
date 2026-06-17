import { useState } from "react";
import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Upload,
  X,
  Building2,
  Wallet,
  FileSignature,
  Paperclip,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, generateId } from "@/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SealType, Attachment } from "@/types";

const sealTypeOptions: { value: SealType; label: string; icon: React.ReactNode }[] = [
  { value: "official", label: "公章", icon: <Building2 className="w-6 h-6" /> },
  { value: "finance", label: "财务专用章", icon: <Wallet className="w-6 h-6" /> },
  { value: "contract", label: "合同专用章", icon: <FileSignature className="w-6 h-6" /> },
];

export default function NewSealApplication() {
  const navigate = useNavigate();
  const { addSealApplication, currentUser } = useAppStore();

  const [reason, setReason] = useState("");
  const [sealType, setSealType] = useState<SealType | null>(null);
  const [useDate, setUseDate] = useState("");
  const [useTime, setUseTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!reason.trim()) e.reason = "请填写申请事由";
    else if (reason.trim().length < 10) e.reason = "申请事由至少10个字";
    if (!sealType) e.sealType = "请选择印章类型";
    if (!useDate) e.useDate = "请选择使用日期";
    if (!useTime) e.useTime = "请选择使用时间";
    if (!returnDate) e.returnDate = "请选择归还日期";
    if (!returnTime) e.returnTime = "请选择归还时间";
    if (useDate && returnDate && useDate > returnDate) e.returnDate = "归还日期不能早于使用日期";
    if (useDate === returnDate && useTime >= returnTime) e.returnTime = "归还时间必须晚于使用时间";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      url: "#",
      size: file.size,
      type: file.type.split("/")[1] || file.name.split(".").pop() || "file",
    }));
    setAttachments([...attachments, ...newAtts]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    addSealApplication({
      id: generateId(),
      applicant: currentUser.id,
      applicantName: currentUser.name,
      reason: reason.trim(),
      sealType: sealType!,
      useTime: `${useDate} ${useTime}`,
      expectReturnTime: `${returnDate} ${returnTime}`,
      attachments,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    setIsSubmitting(false);
    navigate("/seal/applications");
  };

  const InputField = ({ label, type, value, onChange, error, icon: Icon }: {
    label: string;
    type: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    icon: React.ElementType;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label} <span className="text-rose-500">*</span></label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setErrors({ ...errors, [label]: "" });
          }}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
            error ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
          )}
        />
      </div>
      {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <button onClick={() => navigate("/seal/applications")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>返回申请列表</span>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">申请用章</h1>
          <p className="text-slate-500">请如实填写用章申请信息</p>
        </m.div>

        <form onSubmit={handleSubmit}>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">申请事由 <span className="text-rose-500">*</span></label>
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (errors.reason) setErrors({ ...errors, reason: "" });
                    }}
                    placeholder="请详细说明用章事由..."
                    rows={4}
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all",
                      errors.reason ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                    )}
                  />
                  {errors.reason && <p className="mt-1 text-sm text-rose-500">{errors.reason}</p>}
                  <p className="mt-1 text-xs text-slate-400">已输入 {reason.length} 字</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">印章类型 <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {sealTypeOptions.map((opt) => (
                      <m.button
                        key={opt.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSealType(opt.value);
                          if (errors.sealType) setErrors({ ...errors, sealType: "" });
                        }}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                          sealType === opt.value
                            ? "border-primary-500 bg-primary-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 bg-white",
                          errors.sealType && "border-rose-500"
                        )}
                      >
                        <div className={cn("p-3 rounded-full", sealType === opt.value ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500")}>
                          {opt.icon}
                        </div>
                        <span className={cn("font-medium", sealType === opt.value ? "text-primary-700" : "text-slate-700")}>{opt.label}</span>
                      </m.button>
                    ))}
                  </div>
                  {errors.sealType && <p className="mt-2 text-sm text-rose-500">{errors.sealType}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="使用日期" type="date" value={useDate} onChange={setUseDate} error={errors.useDate} icon={Calendar} />
                  <InputField label="使用时间" type="time" value={useTime} onChange={setUseTime} error={errors.useTime} icon={Clock} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="预计归还日期" type="date" value={returnDate} onChange={setReturnDate} error={errors.returnDate} icon={Calendar} />
                  <InputField label="预计归还时间" type="time" value={returnTime} onChange={setReturnTime} error={errors.returnTime} icon={Clock} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">附件上传</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium mb-1">点击上传附件</p>
                      <p className="text-sm text-slate-400">支持 PDF、Word、Excel 等格式</p>
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((att) => (
                        <m.div key={att.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><Paperclip className="w-4 h-4 text-slate-400" /></div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{att.name}</p>
                              <p className="text-xs text-slate-400">{att.type.toUpperCase()}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeAttachment(att.id)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </m.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex gap-4 justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate("/seal/applications")} disabled={isSubmitting}>取消</Button>
              <Button type="submit" leftIcon={<FileText className="w-4 h-4" />} isLoading={isSubmitting}>提交申请</Button>
            </m.div>
          </m.div>
        </form>
      </div>
    </div>
  );
}
