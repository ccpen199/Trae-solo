import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User as UserIcon,
  FileText,
  Upload,
  CheckCircle2,
  FileCheck,
  Star,
  X,
  Plus,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { ApplicationCase } from "@/types";

const steps = [
  { id: 1, key: "info", label: "填写信息", icon: UserIcon },
  { id: 2, key: "materials", label: "上传材料", icon: Upload },
  { id: 3, key: "confirm", label: "确认提交", icon: CheckCircle2 },
  { id: 4, key: "done", label: "提交完成", icon: FileCheck },
];

export default function ApplyService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const services = useAppStore((s) => s.services);
  const addCase = useAppStore((s) => s.addCase);
  const currentUser = useAppStore((s) => s.user);
  const certificates = useAppStore((s) => s.certificates);

  const service = services.find((s) => s.id === serviceId);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: currentUser?.realName || "",
    idCard: currentUser?.idCardMasked || "",
    phone: currentUser?.phoneMasked || "",
    address: "",
    reason: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [rating, setRating] = useState(0);

  if (!service) {
    return (
      <div className="container py-16 text-center">
        <p className="text-ink-light">服务不存在</p>
        <Link to="/services" className="btn-primary mt-4">
          返回服务列表
        </Link>
      </div>
    );
  }

  const handleFileUpload = (templateId: string, files: FileList | null) => {
    if (files) {
      setUploadedFiles((prev) => ({
        ...prev,
        [templateId]: [...(prev[templateId] || []), ...Array.from(files)],
      }));
    }
  };

  const removeFile = (templateId: string, index: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [templateId]: prev[templateId].filter((_, i) => i !== index),
    }));
  };

  const allMaterialsUploaded = service.materials
    .filter((m) => m.required)
    .every((m) => uploadedFiles[m.id] && uploadedFiles[m.id].length > 0);

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.name && formData.idCard && formData.phone;
    }
    if (currentStep === 2) {
      return allMaterialsUploaded;
    }
    return true;
  };

  const handleSubmit = () => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const caseNo = `KS${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`;

    const newCase: ApplicationCase = {
      id: `c${Date.now()}`,
      caseNo,
      serviceId: service.id,
      serviceName: service.name,
      applicantId: currentUser?.id || "u001",
      applicantName: formData.name,
      status: "submitted",
      currentNode: "等待受理",
      timeline: [
        { nodeId: "n1", nodeName: "在线申报", status: "completed", handleTime: now, remark: "申请已成功提交" },
        { nodeId: "n2", nodeName: "材料初审", status: "pending" },
        { nodeId: "n3", nodeName: "业务审核", status: "pending" },
        { nodeId: "n4", nodeName: "结果送达", status: "pending" },
      ],
      materials: Object.entries(uploadedFiles).flatMap(([tid, files]) =>
        files.map((f, i) => ({
          id: `um_${tid}_${i}`,
          templateId: tid,
          name: service.materials.find((m) => m.id === tid)?.name || "",
          fileName: f.name,
          uploadTime: now,
          fileSize: f.size,
        }))
      ),
      applyTime: now,
      formData,
    };

    addCase(newCase);
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-ink-light hover:text-gov-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="card p-6 lg:p-8">
          {/* 头部服务信息 */}
          <div className="flex items-center gap-4 pb-6 border-b border-ink-border mb-6">
            <div className="w-14 h-14 rounded-xl gov-gradient flex items-center justify-center shrink-0">
              <FileCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-ink">{service.name}</h1>
              <p className="text-sm text-ink-light">{service.department} · 承诺期限 {service.handlingTime}</p>
            </div>
          </div>

          {/* 步骤条 */}
          <div className="flex items-center justify-between mb-8 px-2">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        isDone && "bg-success-500 text-white shadow-md",
                        isActive && "bg-gov-600 text-white shadow-lg scale-110",
                        !isDone && !isActive && "bg-ink-bg text-ink-light"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium",
                        (isActive || isDone) ? "text-gov-600" : "text-ink-light"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-2 rounded-full mb-5",
                        isDone ? "bg-success-500" : "bg-ink-bg"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 步骤内容 */}
          <div className="animate-fade-in">
            {/* 步骤1：填写信息 */}
            {currentStep === 1 && (
              <div className="max-w-2xl mx-auto">
                <h2 className="font-serif text-lg font-semibold text-ink mb-5">填写申请信息</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">
                      申请人姓名 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="请输入真实姓名"
                    />
                  </div>
                  <div>
                    <label className="label">
                      身份证号 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.idCard}
                      onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                      className="input"
                      placeholder="请输入身份证号"
                    />
                  </div>
                  <div>
                    <label className="label">
                      联系电话 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div>
                    <label className="label">联系地址</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input"
                      placeholder="请输入联系地址"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">申请事由</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="input min-h-[100px] resize-none"
                      placeholder="请简要说明申请事由（选填）"
                    />
                  </div>
                </div>

                {certificates.length > 0 && (
                  <div className="mt-6 p-4 bg-gov-50 rounded-lg border border-gov-100">
                    <h3 className="font-medium text-gov-700 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> 可用电子证照（点击自动填充）
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {certificates.slice(0, 3).map((cert) => (
                        <button
                          key={cert.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gov-200 rounded-md text-sm text-gov-700 hover:bg-gov-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> {cert.type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 步骤2：上传材料 */}
            {currentStep === 2 && (
              <div className="max-w-2xl mx-auto">
                <h2 className="font-serif text-lg font-semibold text-ink mb-5">上传办理材料</h2>
                <div className="space-y-4">
                  {service.materials.map((material) => {
                    const files = uploadedFiles[material.id] || [];
                    return (
                      <div
                        key={material.id}
                        className="p-4 rounded-lg border border-ink-border"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-ink">{material.name}</h4>
                              {material.required ? (
                                <span className="badge-danger">必填</span>
                              ) : (
                                <span className="badge-gray">选填</span>
                              )}
                              <span className="badge-primary">{material.format.toUpperCase()}</span>
                            </div>
                            <p className="text-xs text-ink-light">{material.description}</p>
                          </div>
                        </div>

                        {files.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {files.map((f, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2.5 bg-ink-bg rounded-md"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-gov-600 shrink-0" />
                                  <span className="text-sm text-ink truncate">{f.name}</span>
                                  <span className="text-xs text-ink-light shrink-0">
                                    ({(f.size / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeFile(material.id, idx)}
                                  className="p-1 text-ink-light hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-ink-border rounded-lg cursor-pointer hover:border-gov-400 hover:bg-gov-50/30 transition-all">
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept={material.format === "image" ? "image/*" : ".pdf,.doc,.docx"}
                            onChange={(e) => handleFileUpload(material.id, e.target.files)}
                          />
                          <Plus className="w-5 h-5 text-ink-light" />
                          <span className="text-sm text-ink-light">点击上传或拖拽文件到此处</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 步骤3：确认提交 */}
            {currentStep === 3 && (
              <div className="max-w-2xl mx-auto">
                <h2 className="font-serif text-lg font-semibold text-ink mb-5">确认申请信息</h2>
                <div className="space-y-5">
                  <div className="p-4 rounded-lg border border-ink-border">
                    <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gov-600" /> 申请人信息
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex">
                        <span className="text-ink-light w-20 shrink-0">姓名：</span>
                        <span className="text-ink">{formData.name || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-ink-light w-20 shrink-0">身份证号：</span>
                        <span className="text-ink">{formData.idCard || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-ink-light w-20 shrink-0">联系电话：</span>
                        <span className="text-ink">{formData.phone || "-"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-ink-light w-20 shrink-0">联系地址：</span>
                        <span className="text-ink">{formData.address || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-ink-border">
                    <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-gov-600" /> 已上传材料
                    </h3>
                    <div className="space-y-2">
                      {service.materials.map((m) => {
                        const files = uploadedFiles[m.id] || [];
                        return (
                          <div key={m.id} className="flex items-center gap-2 text-sm">
                            {files.length > 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                            ) : (
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full shrink-0",
                                  m.required ? "bg-danger-400" : "bg-ink-lighter"
                                )}
                              />
                            )}
                            <span className={cn(files.length === 0 && m.required && "text-danger-600", "text-ink")}>
                              {m.name}
                            </span>
                            {files.length > 0 && (
                              <span className="text-xs text-ink-light">（{files.length}个文件）</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-warning-50 rounded-lg border border-warning-100">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 text-gov-600 rounded" />
                      <span className="text-sm text-warning-800">
                        本人承诺所提交的信息和材料真实有效，如有虚假愿意承担相应法律责任。并同意《政务服务个人信息使用协议》。
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤4：提交完成 */}
            {currentStep === 4 && (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center animate-pulse-soft">
                  <CheckCircle2 className="w-14 h-14 text-success-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-ink mb-2">申请提交成功</h2>
                <p className="text-ink-light mb-6">您的办件申请已成功提交，请耐心等待审核</p>

                <div className="p-4 rounded-lg bg-ink-bg text-left mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-light">办件编号：</span>
                    <span className="font-medium text-ink">
                      KS{new Date().toISOString().slice(0, 10).replace(/-/g, "")}00001
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-light">服务事项：</span>
                    <span className="font-medium text-ink">{service.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-light">预计完成：</span>
                    <span className="font-medium text-gov-600">{service.handlingTime}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-ink-light mb-3">请对本次服务体验进行评价（选填）</p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            n <= rating
                              ? "text-warning-500 fill-warning-500"
                              : "text-ink-lighter"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => navigate("/cases")} className="btn-primary flex-1 justify-center">
                    查看办件进度
                  </button>
                  <button onClick={() => navigate("/")} className="btn-secondary flex-1 justify-center">
                    返回首页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-ink-border">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4" /> 上一步
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                  className="btn-primary"
                >
                  下一步 <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!canProceed()} className="btn-primary">
                  <FileCheck className="w-4 h-4" /> 确认提交
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
