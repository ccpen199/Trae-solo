import { useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, AlignLeft, Users, Calendar,
  Paperclip, Upload, Eye, Send, X, AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, generateId, formatDate } from "@/utils";
import type { Motion, Attachment } from "@/types";

interface FormData {
  title: string;
  content: string;
  voteType: "anonymous" | "realname";
  publicityDays: string;
  voteStart: string;
  voteEnd: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function NewMotion() {
  const navigate = useNavigate();
  const { addMotion, currentUser } = useAppStore();
  const [showPreview, setShowPreview] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    title: "", content: "", voteType: "realname",
    publicityDays: "3", voteStart: "", voteEnd: "",
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.title.trim()) e.title = "请输入议案标题";
    if (!formData.content.trim()) e.content = "请输入议案内容";
    if (!formData.publicityDays) e.publicityDays = "请设置公示期";
    if (!formData.voteStart) e.voteStart = "请选择投票开始时间";
    if (!formData.voteEnd) e.voteEnd = "请选择投票结束时间";
    if (formData.voteStart && formData.voteEnd && new Date(formData.voteStart) >= new Date(formData.voteEnd)) {
      e.voteEnd = "投票结束时间必须晚于开始时间";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = Array.from(files).map((file) => ({
      id: generateId(), name: file.name, url: "#", size: file.size,
      type: file.name.split(".").pop() || "file",
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newMotion: Motion = {
      id: generateId(),
      title: formData.title,
      content: formData.content,
      attachments,
      status: "publicity",
      voteType: formData.voteType,
      publicityStart: new Date().toISOString(),
      voteStart: new Date(formData.voteStart).toISOString(),
      voteEnd: new Date(formData.voteEnd).toISOString(),
      initiator: currentUser.id,
      initiatorName: currentUser.name,
      voteStats: { totalVoters: 1200, votedCount: 0, agreeCount: 0, disagreeCount: 0, abstainCount: 0 },
    };
    addMotion(newMotion);
    navigate("/council");
  };

  const inputClass = (hasError: boolean) => cn(
    "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
    hasError ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"
  );

  const FormField = ({
    label, icon: Icon, required, error, children,
  }: {
    label: string; icon: typeof FileText; required?: boolean; error?: string; children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
        <Icon className="w-4 h-4 text-primary-500" />
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 mt-1 text-sm text-rose-500">
          <AlertCircle className="w-4 h-4" /> {error}
        </m.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <m.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/council")}
          className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 返回列表
        </m.button>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-card p-8 mb-6"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2">发起新议案</h1>
          <p className="text-slate-500 mb-8">提交议案前请仔细核对内容，确保信息准确完整</p>

          <FormField label="议案标题" icon={FileText} required error={errors.title}>
            <input
              type="text" placeholder="请输入议案标题" value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={inputClass(!!errors.title)} maxLength={100}
            />
            <p className="text-right text-xs text-slate-400 mt-1">{formData.title.length}/100</p>
          </FormField>

          <FormField label="议案内容" icon={AlignLeft} required error={errors.content}>
            <textarea
              rows={6} placeholder="请详细描述议案内容..." value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              className={cn(inputClass(!!errors.content), "resize-none")} maxLength={5000}
            />
            <p className="text-right text-xs text-slate-400 mt-1">{formData.content.length}/5000</p>
          </FormField>

          <FormField label="投票类型" icon={Users} required>
            <div className="flex gap-4">
              {[{ value: "realname", label: "实名投票" }, { value: "anonymous", label: "匿名投票" }].map((type) => (
                <m.label
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-xl cursor-pointer transition-all",
                    formData.voteType === type.value
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio" name="voteType" value={type.value}
                    checked={formData.voteType === type.value}
                    onChange={(e) => handleChange("voteType", e.target.value as "anonymous" | "realname")}
                    className="hidden"
                  />
                  {type.label}
                </m.label>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="公示期（天）" icon={Calendar} required error={errors.publicityDays}>
              <input
                type="number" min="1" max="30" placeholder="3"
                value={formData.publicityDays}
                onChange={(e) => handleChange("publicityDays", e.target.value)}
                className={inputClass(!!errors.publicityDays)}
              />
            </FormField>
            <div />
            <FormField label="投票开始时间" icon={Calendar} required error={errors.voteStart}>
              <input
                type="datetime-local" value={formData.voteStart}
                onChange={(e) => handleChange("voteStart", e.target.value)}
                className={inputClass(!!errors.voteStart)}
              />
            </FormField>
            <FormField label="投票结束时间" icon={Calendar} required error={errors.voteEnd}>
              <input
                type="datetime-local" value={formData.voteEnd}
                onChange={(e) => handleChange("voteEnd", e.target.value)}
                className={inputClass(!!errors.voteEnd)}
              />
            </FormField>
          </div>

          <FormField label="附件上传" icon={Paperclip}>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">点击或拖拽文件到此处上传</p>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((att) => (
                  <m.div
                    key={att.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{att.name}</p>
                        <p className="text-xs text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </m.div>
                ))}
              </div>
            )}
          </FormField>

          <div className="flex gap-4 pt-4">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Eye className="w-5 h-5" /> 预览
            </m.button>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-md"
            >
              <Send className="w-5 h-5" /> 提交议案
            </m.button>
          </div>
        </m.div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
            <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-modal p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">议案预览</h2>
                <button onClick={() => setShowPreview(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><h3 className="text-xs text-slate-400">议案标题</h3><p className="font-semibold text-slate-800">{formData.title || "（未填写）"}</p></div>
                <div><h3 className="text-xs text-slate-400">投票类型</h3><p className="text-slate-700">{formData.voteType === "anonymous" ? "匿名投票" : "实名投票"}</p></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><h3 className="text-xs text-slate-400">公示期</h3><p className="text-slate-700">{formData.publicityDays}天</p></div>
                  <div><h3 className="text-xs text-slate-400">开始</h3><p className="text-slate-700 text-sm">{formData.voteStart ? formatDate(formData.voteStart, "MM-DD") : "（未设置）"}</p></div>
                  <div><h3 className="text-xs text-slate-400">结束</h3><p className="text-slate-700 text-sm">{formData.voteEnd ? formatDate(formData.voteEnd, "MM-DD") : "（未设置）"}</p></div>
                </div>
                <div><h3 className="text-xs text-slate-400 mb-1">议案内容</h3><div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 max-h-32 overflow-y-auto">{formData.content || "（未填写）"}</div></div>
                {attachments.length > 0 && (
                  <div>
                    <h3 className="text-xs text-slate-400 mb-1">附件 ({attachments.length})</h3>
                    <div className="space-y-1">
                      {attachments.slice(0, 3).map((att) => (
                        <div key={att.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                          <FileText className="w-4 h-4 text-primary-500" />
                          <span className="text-slate-700 truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <m.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                <Send className="w-4 h-4" /> 确认提交
              </m.button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
