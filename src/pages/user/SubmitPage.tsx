import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Upload,
  X,
  FileImage,
  FileText,
  ChevronDown,
  AlertCircle,
  Check,
  Sparkles,
  Save,
  Send,
  MapPin,
  Tag,
  FileEdit,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConsultationStore } from "../../stores/consultation.store";
import { useAuthStore } from "../../stores/auth.store";
import { toast } from "../../components/ui/Toast";
import type { CaseCategory, UrgencyLevel, EvidenceFile, ConsultationDraft } from "../../types";

const categoryOptions = [
  { value: "marriage", label: "婚姻家庭" },
  { value: "labor", label: "劳动纠纷" },
  { value: "debt", label: "债务债权" },
  { value: "traffic", label: "交通事故" },
  { value: "contract", label: "合同纠纷" },
  { value: "criminal", label: "刑事辩护" },
  { value: "admin", label: "行政诉讼" },
  { value: "ip", label: "知识产权" },
  { value: "other", label: "其他" },
];

const provinceOptions = [
  { value: "beijing", label: "北京市" },
  { value: "shanghai", label: "上海市" },
  { value: "guangdong", label: "广东省" },
  { value: "zhejiang", label: "浙江省" },
  { value: "jiangsu", label: "江苏省" },
  { value: "sichuan", label: "四川省" },
  { value: "hubei", label: "湖北省" },
  { value: "shandong", label: "山东省" },
];

const cityOptions: Record<string, { value: string; label: string }[]> = {
  beijing: [
    { value: "dongcheng", label: "东城区" },
    { value: "xicheng", label: "西城区" },
    { value: "chaoyang", label: "朝阳区" },
    { value: "haidian", label: "海淀区" },
  ],
  shanghai: [
    { value: "huangpu", label: "黄浦区" },
    { value: "xuhui", label: "徐汇区" },
    { value: "jingan", label: "静安区" },
    { value: "pudong", label: "浦东新区" },
  ],
  guangdong: [
    { value: "guangzhou", label: "广州市" },
    { value: "shenzhen", label: "深圳市" },
    { value: "dongguan", label: "东莞市" },
  ],
  zhejiang: [
    { value: "hangzhou", label: "杭州市" },
    { value: "ningbo", label: "宁波市" },
    { value: "wenzhou", label: "温州市" },
  ],
  jiangsu: [
    { value: "nanjing", label: "南京市" },
    { value: "suzhou", label: "苏州市" },
    { value: "wuxi", label: "无锡市" },
  ],
  sichuan: [
    { value: "chengdu", label: "成都市" },
    { value: "mianyang", label: "绵阳市" },
  ],
  hubei: [
    { value: "wuhan", label: "武汉市" },
    { value: "yichang", label: "宜昌市" },
  ],
  shandong: [
    { value: "jinan", label: "济南市" },
    { value: "qingdao", label: "青岛市" },
  ],
};

const urgencyLevels = [
  { value: 1, label: "低", color: "bg-green-500", textColor: "text-green-600", bgColor: "bg-green-50" },
  { value: 2, label: "中", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50" },
  { value: 3, label: "高", color: "bg-red-500", textColor: "text-red-600", bgColor: "bg-red-50" },
];

interface UploadedFile {
  id: string;
  name: string;
  type: "image" | "document";
  size: string;
  preview?: string;
}

interface FormErrors {
  content?: string;
  category?: string;
  province?: string;
  city?: string;
}

const urgencyToLevel = (val: number): UrgencyLevel => {
  if (val === 1) return 'low';
  if (val === 3) return 'high';
  return 'medium';
};

const urgencyFromLevel = (level: UrgencyLevel | undefined): number => {
  if (level === 'low') return 1;
  if (level === 'high') return 3;
  return 2;
};

const urgencyReverseMap: Record<UrgencyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export default function SubmitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createDraft, updateDraft, getDraftById, createConsultation } = useConsultationStore();
  const { getCurrentUserId } = useAuthStore();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [province, setProvince] = useState("");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [city, setCity] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [urgency, setUrgency] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentDraftNo, setCurrentDraftNo] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const maxLength = 2000;

  useEffect(() => {
    const draftId = searchParams.get("draftId");
    if (draftId && !isDraftLoaded) {
      const draft = getDraftById(draftId);
      if (draft) {
        setContent(draft.description);
        setCategory(draft.category);
        if (draft.region) {
          const parts = draft.region.split("-");
          setProvince(parts[0]);
          if (parts[1]) setCity(parts[1]);
        }
        setUrgency(urgencyReverseMap[draft.urgency] || 1);
        const files: UploadedFile[] = draft.evidenceFiles.map((f) => ({
          id: f.id,
          name: f.originalName,
          type: f.fileType === "image" ? "image" : "document",
          size: f.fileSize.toString(),
          preview: f.fileUrl || undefined,
        }));
        setUploadedFiles(files);
        setCurrentDraftId(draftId);
        setCurrentDraftNo(draft.draftNumber);
        toast.success(`已恢复草稿：${draft.draftNumber}`);
      }
      setIsDraftLoaded(true);
    }
  }, [searchParams, getDraftById, isDraftLoaded]);

  const validateDraftSave = (): boolean => {
    const hasEnoughContent = content.trim().length >= 10;
    const hasCategory = !!category;
    const hasProvince = !!province;
    const hasFiles = uploadedFiles.length > 0;
    return hasEnoughContent || hasCategory || hasProvince || hasFiles;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${Date.now()}-${index}`,
        name: file.name,
        type: isImage ? "image" : "document",
        size: formatFileSize(file.size),
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingTime(0);
      setContent((prev) => prev + (prev ? "\n" : "") + "[语音转文字内容示例：我遇到了一个劳动纠纷问题...]");
    } else {
      setIsRecording(true);
      const interval = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 60) {
            clearInterval(interval);
            setIsRecording(false);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!content.trim()) {
      newErrors.content = "请描述您的法律问题";
    } else if (content.trim().length < 10) {
      newErrors.content = "问题描述至少需要10个字";
    }
    if (!category) {
      newErrors.category = "请选择案由分类";
    }
    if (!province) {
      newErrors.province = "请选择所在省份";
    }
    if (!city) {
      newErrors.city = "请选择所在城市";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error("请完整填写必填项后提交");
      return;
    }
    const userId = getCurrentUserId();
    const evidenceFiles: EvidenceFile[] = uploadedFiles.map((f, i) => ({
      id: `evidence-${Date.now()}-${i}`,
      consultationId: '',
      uploaderId: userId,
      fileName: f.name,
      originalName: f.name,
      fileType: f.type === 'image' ? 'image' : 'document',
      fileSize: parseInt(f.size) || 0,
      fileUrl: f.preview || '',
      watermarkEnabled: true,
      uploadedAt: new Date().toISOString(),
    }));

    createConsultation({
      userId,
      title: content.slice(0, 30),
      description: content,
      category: category as CaseCategory,
      province,
      city,
      region: province && city ? `${province}-${city}` : undefined,
      urgency: urgencyToLevel(urgency),
      evidenceFiles,
    });

    if (currentDraftId) {
      const { deleteDraft } = useConsultationStore.getState();
      deleteDraft(currentDraftId);
    }

    setShowSuccess(true);
    toast.success("提交成功！正在为您匹配律师...");
    setTimeout(() => {
      navigate("/consultations");
    }, 1500);
  };

  const handleSaveDraft = () => {
    if (!validateDraftSave()) {
      toast.warning("请至少填写一项内容后再保存草稿");
      return;
    }
    const userId = getCurrentUserId();
    const evidenceFiles: EvidenceFile[] = uploadedFiles.map((f, i) => ({
      id: `evidence-${Date.now()}-${i}`,
      consultationId: '',
      uploaderId: userId,
      fileName: f.name,
      originalName: f.name,
      fileType: f.type === 'image' ? 'image' : 'document',
      fileSize: parseInt(f.size) || 0,
      fileUrl: f.preview || '',
      watermarkEnabled: true,
      uploadedAt: new Date().toISOString(),
    }));

    let saved: ConsultationDraft;
    if (currentDraftId) {
      updateDraft(currentDraftId, {
        description: content,
        category: (category as CaseCategory) || undefined,
        province,
        city,
        region: province && city ? `${province}-${city}` : undefined,
        urgency: urgencyToLevel(urgency),
        evidenceFiles,
      });
      const updated = getDraftById(currentDraftId);
      saved = updated!;
    } else {
      saved = createDraft({
        userId,
        title: content.slice(0, 30) || undefined,
        description: content,
        category: (category as CaseCategory) || undefined,
        province,
        city,
        region: province && city ? `${province}-${city}` : undefined,
        urgency: urgencyToLevel(urgency),
        evidenceFiles,
      });
    }
    setCurrentDraftId(saved.id);
    setCurrentDraftNo(saved.draftNumber);
    toast.success(`草稿已保存，编号：${saved.draftNumber}`);
  };

  return (
    <div className="min-h-screen bg-neutral-warm py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary-800">
                提交法律咨询
              </h1>
              {currentDraftNo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-sm font-medium shadow-md"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  {currentDraftNo}
                </motion.div>
              )}
            </div>
            <p className="text-primary-500">
              请详细描述您遇到的法律问题，我们将为您匹配最合适的公益律师
            </p>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl bg-green-500 text-white shadow-lg"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">提交成功！</p>
                  <p className="text-sm text-white/80">正在为您匹配律师...</p>
                </div>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <motion.div
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-primary-800">
                  问题描述 <span className="text-red-500">*</span>
                </h2>
              </div>

              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value.slice(0, maxLength));
                    if (errors.content) setErrors({ ...errors, content: undefined });
                  }}
                  placeholder="请详细描述您遇到的法律问题..."
                  className={`input-base min-h-[200px] resize-y pr-16 ${
                    errors.content ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                  }`}
                />
                <motion.button
                  type="button"
                  onClick={toggleRecording}
                  className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {isRecording ? (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <MicOff className="w-5 h-5 relative z-10" />
                    </>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      录音中 {formatRecordingTime(recordingTime)}
                    </span>
                  ) : (
                    <span className="text-sm text-primary-400">点击麦克风可语音输入</span>
                  )}
                  {errors.content && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.content}
                    </span>
                  )}
                </div>
                <span className={`text-sm ${content.length >= maxLength ? "text-red-500" : "text-primary-400"}`}>
                  {content.length}/{maxLength}
                </span>
              </div>
            </motion.div>

            <motion.div
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent-gold/20 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-accent-gold" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-primary-800">
                  分类与地区
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    案由分类 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryOpen(!categoryOpen);
                      setProvinceOpen(false);
                      setCityOpen(false);
                    }}
                    className={`input-base text-left flex items-center justify-between ${
                      errors.category ? "border-red-400" : ""
                    }`}
                  >
                    <span className={category ? "text-primary-900" : "text-primary-400"}>
                      {category ? categoryOptions.find((c) => c.value === category)?.label : "请选择分类"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {categoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-20 w-full mt-1 bg-white rounded-lg border border-primary-100 shadow-card-hover overflow-hidden max-h-60 overflow-y-auto scrollbar-thin"
                      >
                        {categoryOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setCategory(opt.value);
                              setCategoryOpen(false);
                              if (errors.category) setErrors({ ...errors, category: undefined });
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50 transition-colors flex items-center justify-between ${
                              category === opt.value ? "bg-primary-50 text-accent-gold-dark font-medium" : "text-primary-700"
                            }`}
                          >
                            {opt.label}
                            {category === opt.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    所在省份 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setProvinceOpen(!provinceOpen);
                      setCategoryOpen(false);
                      setCityOpen(false);
                    }}
                    className={`input-base text-left flex items-center justify-between ${
                      errors.province ? "border-red-400" : ""
                    }`}
                  >
                    <span className={province ? "text-primary-900" : "text-primary-400"}>
                      {province ? provinceOptions.find((p) => p.value === province)?.label : "请选择省份"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${provinceOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {provinceOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-20 w-full mt-1 bg-white rounded-lg border border-primary-100 shadow-card-hover overflow-hidden max-h-60 overflow-y-auto scrollbar-thin"
                      >
                        {provinceOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setProvince(opt.value);
                              setCity("");
                              setProvinceOpen(false);
                              if (errors.province) setErrors({ ...errors, province: undefined });
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50 transition-colors flex items-center justify-between ${
                              province === opt.value ? "bg-primary-50 text-accent-gold-dark font-medium" : "text-primary-700"
                            }`}
                          >
                            {opt.label}
                            {province === opt.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.province && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.province}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    所在城市 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (province) {
                        setCityOpen(!cityOpen);
                        setCategoryOpen(false);
                        setProvinceOpen(false);
                      }
                    }}
                    className={`input-base text-left flex items-center justify-between ${
                      !province ? "opacity-50 cursor-not-allowed" : ""
                    } ${errors.city ? "border-red-400" : ""}`}
                    disabled={!province}
                  >
                    <span className={city ? "text-primary-900" : "text-primary-400"}>
                      {city
                        ? cityOptions[province]?.find((c) => c.value === city)?.label
                        : province
                        ? "请选择城市"
                        : "请先选择省份"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {cityOpen && province && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-20 w-full mt-1 bg-white rounded-lg border border-primary-100 shadow-card-hover overflow-hidden max-h-60 overflow-y-auto scrollbar-thin"
                      >
                        {cityOptions[province]?.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setCity(opt.value);
                              setCityOpen(false);
                              if (errors.city) setErrors({ ...errors, city: undefined });
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary-50 transition-colors flex items-center justify-between ${
                              city === opt.value ? "bg-primary-50 text-accent-gold-dark font-medium" : "text-primary-700"
                            }`}
                          >
                            {opt.label}
                            {city === opt.value && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-primary-700 mb-3">
                  紧急程度
                </label>
                <div className="flex items-center gap-2">
                  {urgencyLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setUrgency(level.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                        urgency === level.value
                          ? `${level.bgColor} border-transparent shadow-sm`
                          : "bg-white border-primary-100 hover:border-primary-200"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${level.color}`} />
                      <span className={`text-sm font-medium ${urgency === level.value ? level.textColor : "text-primary-600"}`}>
                        {level.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 relative h-2 bg-primary-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute left-0 top-0 h-full rounded-full ${urgencyLevels[urgency - 1].color}`}
                    initial={false}
                    animate={{ width: `${(urgency / 3) * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    value={urgency}
                    onChange={(e) => setUrgency(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-green-600" />
                </div>
                <h2 className="font-serif text-lg font-semibold text-primary-800">
                  证据上传
                </h2>
                <span className="text-xs text-primary-400">（可选，支持图片和文档）</span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-accent-gold bg-accent-gold/5"
                    : "border-primary-200 hover:border-primary-300 hover:bg-primary-50/50"
                }`}
              >
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                    isDragging ? "bg-accent-gold/20" : "bg-primary-100"
                  }`}>
                    <Upload className={`w-7 h-7 ${isDragging ? "text-accent-gold" : "text-primary-400"}`} />
                  </div>
                  <p className="text-sm font-medium text-primary-700 mb-1">
                    拖拽文件到此处，或点击选择文件
                  </p>
                  <p className="text-xs text-primary-400">
                    支持 JPG、PNG、PDF、DOC、DOCX 格式，单个文件不超过 10MB
                  </p>
                </motion.div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                  className="hidden"
                />
              </div>

              <AnimatePresence>
                {uploadedFiles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
                  >
                    {uploadedFiles.map((file) => (
                      <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative group card p-3 overflow-hidden"
                      >
                        <div className="watermark-overlay" />
                        <div className="relative z-10">
                          {file.type === "image" && file.preview ? (
                            <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-primary-50">
                              <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg bg-primary-50 flex items-center justify-center mb-2">
                              <FileText className="w-10 h-10 text-primary-300" />
                            </div>
                          )}
                          <p className="text-xs text-primary-700 font-medium truncate">{file.name}</p>
                          <p className="text-xs text-primary-400">{file.size}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {file.type === "image" ? (
                              <FileImage className="w-3 h-3 text-primary-400" />
                            ) : (
                              <FileText className="w-3 h-3 text-primary-400" />
                            )}
                            <span className="text-[10px] text-accent-gold-dark bg-accent-gold/10 px-1.5 py-0.5 rounded">
                              证据水印
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-end pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                type="button"
                onClick={handleSaveDraft}
                className="btn-outline px-6 py-3 relative overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {currentDraftId ? "更新草稿" : "保存草稿"}
                  {currentDraftId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-white">
                      {currentDraftId}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-gold px-8 py-3"
              >
                <Send className="w-4 h-4 mr-2" />
                提交咨询
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
