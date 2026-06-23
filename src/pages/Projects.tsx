import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  Users,
  ChevronDown,
  Filter,
  Mail,
  Paperclip,
  ChevronRight,
  Plus,
  X,
  ArrowRight,
  Eye,
  Phone,
  Upload,
  Download,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { mockProjects } from "@/data/mock";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory, ProjectStage, ProjectPartner, ProjectAttachment } from "@/types";

const categoryLabels: Record<ProjectCategory, { zh: string; it: string }> = {
  economic: { zh: "经贸", it: "Economico" },
  education: { zh: "教育", it: "Educazione" },
  tourism: { zh: "文旅", it: "Turismo" },
  technology: { zh: "科技", it: "Tecnologia" },
};

const stageLabels: Record<ProjectStage, { zh: string; it: string }> = {
  planning: { zh: "规划中", it: "In Pianificazione" },
  negotiation: { zh: "洽谈中", it: "In Negoziazione" },
  implementation: { zh: "实施中", it: "In Implementazione" },
  completed: { zh: "已完成", it: "Completato" },
};

const stageOrder: ProjectStage[] = ["planning", "negotiation", "implementation", "completed"];

const sortOptions = [
  { value: "updatedAt", zh: "最近更新", it: "Recenti" },
  { value: "budget", zh: "预算金额", it: "Budget" },
  { value: "title", zh: "项目名称", it: "Nome Progetto" },
];

const partnerTypeFilters = [
  { zh: "政府机构", it: "Istituzioni", keywords: ["Confindustria", "Trade", "Board", "促进会", "政府", "商务部", "Ministry", "经济发展部", "市政府"] },
  { zh: "高等院校", it: "Università", keywords: ["Politecnico", "Università", "Accademia", "大学", "学院", "复旦", "清华"] },
  { zh: "商业企业", it: "Imprese", keywords: ["Ospedale", "San Raffaele", "Istituto", "Cucina", "医院", "携程", "集团", "科技", "Tecnologia"] },
  { zh: "文化机构", it: "Cultura", keywords: ["Tourism", "Arti", "Belle Arti", "旅游局", "美术馆", "博物馆"] },
];

function calculateProgress(project: Project): number {
  if (project.stage === "completed") return 100;
  if (project.stage === "planning") return 15;
  if (project.stage === "negotiation") return 35;

  const start = new Date(project.startDate).getTime();
  const end = project.endDate ? new Date(project.endDate).getTime() : start + 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const pct = Math.min(100, Math.max(36, Math.round((elapsed / total) * 100)));
  return pct;
}

function getProgressGradient(pct: number): string {
  if (pct <= 33) return "from-cn-red-500 to-cn-red-400";
  if (pct <= 66) return "from-cn-red-500 via-warm-gold-500 to-warm-gold-400";
  return "from-cn-red-500 via-warm-gold-500 to-it-green-500";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatTimestamp(ts: string): string {
  return ts;
}

function extractAttachmentsFromRemark(remark: string): string[] {
  const matches = remark.match(/附件[：:]\s*(.+?)(?:\。|$)/);
  if (!matches) return [];
  return matches[1].split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
}

interface NewProjectForm {
  titleZh: string;
  titleIt: string;
  category: ProjectCategory;
  descriptionZh: string;
  descriptionIt: string;
  partnerNameZh: string;
  partnerNameIt: string;
  partnerOrg: string;
  partnerEmail: string;
}

const initialForm: NewProjectForm = {
  titleZh: "",
  titleIt: "",
  category: "economic",
  descriptionZh: "",
  descriptionIt: "",
  partnerNameZh: "",
  partnerNameIt: "",
  partnerOrg: "",
  partnerEmail: "",
};

interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
}

export default function Projects() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const user = useAppStore((s) => s.user);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);
  const stageHistoryFromStore = useAppStore((s) => s.stageHistory);
  const addStageHistory = useAppStore((s) => s.addStageHistory);

  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>([]);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [selectedPartnerType, setSelectedPartnerType] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOpen, setSortOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newForm, setNewForm] = useState<NewProjectForm>(initialForm);

  const [confirmStageProjectId, setConfirmStageProjectId] = useState<string | null>(null);
  const [stageRemark, setStageRemark] = useState("");
  const [contactProject, setContactProject] = useState<Project | null>(null);

  const [historyProject, setHistoryProject] = useState<Project | null>(null);
  const [attachmentsProject, setAttachmentsProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "info" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (zh: string, it: string) => (lang === "zh" ? zh : it);

  const showToast = (message: string, type: ToastState["type"] = "info") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "info" }), 2500);
  };

  const requireLogin = (): boolean => {
    if (!user) {
      setLoginModalOpen(true);
      return false;
    }
    return true;
  };

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedStage) {
      result = result.filter((p) => p.stage === selectedStage);
    }

    if (selectedPartnerType !== null) {
      const filterDef = partnerTypeFilters[selectedPartnerType];
      result = result.filter((p) =>
        p.partners.some((pt) => filterDef.keywords.some((kw) => pt.organization.includes(kw)))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.titleZh.toLowerCase().includes(q) ||
          p.titleIt.toLowerCase().includes(q) ||
          p.descriptionZh.toLowerCase().includes(q) ||
          p.descriptionIt.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "updatedAt") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === "budget") {
        return b.budget - a.budget;
      }
      if (sortBy === "title") {
        return (lang === "zh" ? a.titleZh : a.titleIt).localeCompare(lang === "zh" ? b.titleZh : b.titleIt);
      }
      return 0;
    });

    return result;
  }, [selectedCategories, selectedStage, selectedPartnerType, searchQuery, sortBy, lang, projects]);

  const projectStageHistory = useMemo(() => {
    if (!historyProject) return [];
    return stageHistoryFromStore.filter((r) => r.projectId === historyProject.id);
  }, [historyProject, stageHistoryFromStore]);

  const toggleCategory = (cat: ProjectCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const removeCategory = (cat: ProjectCategory) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  };

  const advanceStage = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const idx = stageOrder.indexOf(project.stage);
    if (idx >= stageOrder.length - 1) return;

    const fromStage = project.stage;
    const toStage = stageOrder[idx + 1];
    const operator = user ? (lang === "zh" ? user.nameZh : user.nameIt) : t("匿名用户", "Utente Anonimo");

    addStageHistory({
      projectId: projectId,
      fromStage: fromStage,
      toStage: toStage,
      operator: operator,
      remark: stageRemark.trim() || t("阶段正常流转", "Avanzamento fase regolare"),
    });

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, stage: toStage, updatedAt: new Date().toISOString() };
      })
    );

    setConfirmStageProjectId(null);
    setStageRemark("");
    showToast(t("项目已推进至下一阶段", "Progetto avanzato alla fase successiva"), "success");
  };

  const handleNewProject = () => {
    if (!requireLogin()) return;

    const newPartner: ProjectPartner = {
      id: `pt_new_${Date.now()}`,
      nameZh: newForm.partnerNameZh,
      nameIt: newForm.partnerNameIt,
      organization: newForm.partnerOrg,
      role: "",
      email: newForm.partnerEmail,
    };

    const newProject: Project = {
      id: `p_new_${Date.now()}`,
      titleZh: newForm.titleZh,
      titleIt: newForm.titleIt,
      category: newForm.category,
      stage: "planning",
      descriptionZh: newForm.descriptionZh,
      descriptionIt: newForm.descriptionIt,
      budget: 0,
      currency: "CNY",
      startDate: new Date().toISOString().split("T")[0],
      locationZh: "",
      locationIt: "",
      partners: newForm.partnerNameZh ? [newPartner] : [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: user?.id || "current",
    };

    addStageHistory({
      projectId: newProject.id,
      fromStage: null,
      toStage: "planning",
      operator: user ? (lang === "zh" ? user.nameZh : user.nameIt) : t("匿名用户", "Utente Anonimo"),
      remark: t("新项目创建完成", "Nuovo progetto creato"),
    });

    setProjects((prev) => [newProject, ...prev]);
    setShowNewProject(false);
    setNewForm(initialForm);
    showToast(t("新项目创建成功", "Nuovo progetto creato con successo"), "success");
  };

  const handleDownloadAttachment = (att: ProjectAttachment) => {
    showToast(t(`正在下载: ${att.name}`, `Scaricando: ${att.name}`), "info");
  };

  const handleUploadClick = () => {
    if (!requireLogin()) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !attachmentsProject) return;

    const file = files[0];
    const fakeExts = ["pdf", "docx", "xlsx", "png", "jpg"];
    const fakeExt = fakeExts[Math.floor(Math.random() * fakeExts.length)];
    const newAtt: ProjectAttachment = {
      id: `att_${Date.now()}`,
      name: file.name || `${t("上传文件", "File caricato")}_${Date.now()}.${fakeExt}`,
      url: `/mock-attachments/${Date.now()}.${fakeExt}`,
      type: file.type || "application/octet-stream",
      size: file.size || Math.floor(Math.random() * 5 * 1024 * 1024),
      uploadedAt: new Date().toISOString(),
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== attachmentsProject.id) return p;
        return { ...p, attachments: [...p.attachments, newAtt], updatedAt: new Date().toISOString() };
      })
    );

    setAttachmentsProject((prev) =>
      prev ? { ...prev, attachments: [...prev.attachments, newAtt] } : null
    );

    showToast(t(`上传成功: ${newAtt.name}`, `Caricamento completato: ${newAtt.name}`), "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMailTo = (email: string, subject?: string) => {
    const mailtoUrl = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
    window.location.href = mailtoUrl;
  };

  const openStageConfirm = (projectId: string) => {
    if (!requireLogin()) return;
    setConfirmStageProjectId(projectId);
    setStageRemark("");
  };

  const openHistory = (project: Project) => {
    setHistoryProject(project);
  };

  const openAttachments = (project: Project) => {
    setAttachmentsProject(project);
  };

  const hasFilters = selectedCategories.length > 0 || selectedStage || selectedPartnerType !== null || searchQuery;

  const currentProjectForStage = confirmStageProjectId ? projects.find((p) => p.id === confirmStageProjectId) : null;
  const nextStage = currentProjectForStage ? stageOrder[stageOrder.indexOf(currentProjectForStage.stage) + 1] : null;

  return (
    <div className="min-h-screen bg-ivory-50 relative">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display-zh text-charcoal-600 mb-2">
              {t("项目库", "Progetti")}
            </h1>
            <p className="text-charcoal-400 font-sans-it">
              {t("中意合作项目全景展示", "Panoramica dei progetti di cooperazione Cina-Italia")}
            </p>
          </div>
          <button
            onClick={() => {
              if (!requireLogin()) return;
              setShowNewProject(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-cnit text-white rounded-xl shadow-hover hover:shadow-elegant transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("提交新项目", "Nuovo Progetto")}
          </button>
        </div>

        {hasFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-charcoal-400 mr-1">{t("当前筛选：", "Filtri attivi:")}</span>

            {selectedCategories.map((cat) => (
              <span
                key={`cat-chip-${cat}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-cn-red-50 text-cn-red-600 border border-cn-red-200"
              >
                {t(categoryLabels[cat].zh, categoryLabels[cat].it)}
                <button
                  onClick={() => removeCategory(cat)}
                  className="hover:bg-cn-red-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedStage && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-it-green-50 text-it-green-600 border border-it-green-200">
                {t("阶段：", "Fase: ")}{t(stageLabels[selectedStage].zh, stageLabels[selectedStage].it)}
                <button
                  onClick={() => setSelectedStage(null)}
                  className="hover:bg-it-green-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedPartnerType !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-warm-gold-50 text-warm-gold-600 border border-warm-gold-200">
                {t("合作方：", "Partner: ")}{t(partnerTypeFilters[selectedPartnerType].zh, partnerTypeFilters[selectedPartnerType].it)}
                <button
                  onClick={() => setSelectedPartnerType(null)}
                  className="hover:bg-warm-gold-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full bg-charcoal-50 text-charcoal-600 border border-charcoal-200">
                {t("关键词：", "Keyword: ")}{searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:bg-charcoal-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setSelectedCategories([]);
                setSelectedStage(null);
                setSelectedPartnerType(null);
                setSearchQuery("");
              }}
              className="ml-2 text-xs text-charcoal-400 hover:text-cn-red-500 underline underline-offset-2 transition-colors"
            >
              {t("清除全部", "Cancella tutti")}
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-elegant p-6 sticky top-24 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-cn-red-500" />
                <h2 className="text-lg font-semibold text-charcoal-600">
                  {t("筛选条件", "Filtri")}
                </h2>
                {!user && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-400">
                    {t("未登录", "Accesso richiesto")}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-2">
                  {t("搜索项目", "Cerca Progetti")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("输入关键词...", "Inserisci parole chiave...")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 focus:border-cn-red-300 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-3">
                  {t("项目分类", "Categoria")}
                </label>
                <div className="space-y-2">
                  {(Object.keys(categoryLabels) as ProjectCategory[]).map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer select-none",
                          active
                            ? "bg-gradient-cnit text-white shadow-gold"
                            : "bg-ivory-50 text-charcoal-500 hover:bg-ivory-100"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            active
                              ? "border-white bg-white"
                              : "border-charcoal-300 bg-white"
                          )}
                        >
                          {active && <CheckCircle2 className="w-3 h-3 text-cn-red-500" />}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={active}
                          onChange={() => toggleCategory(cat)}
                        />
                        <span>{t(categoryLabels[cat].zh, categoryLabels[cat].it)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-3">
                  {t("项目阶段", "Fase")}
                </label>
                <div className="space-y-2">
                  {(Object.keys(stageLabels) as ProjectStage[]).map((stage) => {
                    const active = selectedStage === stage;
                    return (
                      <button
                        key={stage}
                        onClick={() => setSelectedStage(active ? null : stage)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                          active
                            ? "bg-it-green-50 text-it-green-600 border border-it-green-200"
                            : "bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 border border-transparent"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            active ? "border-it-green-500 bg-it-green-500" : "border-charcoal-200"
                          )}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span>{t(stageLabels[stage].zh, stageLabels[stage].it)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-3">
                  {t("合作方类型", "Tipo Partner")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {partnerTypeFilters.map((type, idx) => {
                    const active = selectedPartnerType === idx;
                    return (
                      <button
                        key={type.zh}
                        onClick={() => setSelectedPartnerType(active ? null : idx)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-full transition-all",
                          active
                            ? "bg-warm-gold-500 text-white border border-warm-gold-500 shadow-gold"
                            : "bg-warm-gold-50 text-warm-gold-600 border border-warm-gold-200 hover:bg-warm-gold-100"
                        )}
                      >
                        {t(type.zh, type.it)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedStage(null);
                    setSelectedPartnerType(null);
                    setSearchQuery("");
                  }}
                  className="w-full py-2.5 text-sm text-charcoal-400 hover:text-cn-red-500 transition-colors border-t border-charcoal-100 pt-4"
                >
                  {t("重置筛选条件", "Reimposta filtri")}
                </button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="text-charcoal-500">
                {t("共找到", "Trovati")}{" "}
                <span className="text-2xl font-bold text-cn-red-500">{filteredProjects.length}</span>{" "}
                {t("个项目", "progetti")}
              </div>

              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-charcoal-100 hover:border-cn-red-200 hover:shadow-elegant transition-all text-sm text-charcoal-500"
                >
                  <span>{t("排序：", "Ordina per: ")}</span>
                  <span className="text-charcoal-600 font-medium">
                    {sortOptions.find((o) => o.value === sortBy)?.[lang] ||
                      (lang === "zh" ? "最近更新" : "Recenti")}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", sortOpen && "rotate-180")} />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-hover border border-charcoal-100 py-1 z-10">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors",
                          sortBy === opt.value
                            ? "text-cn-red-500 bg-cn-red-50"
                            : "text-charcoal-500 hover:bg-ivory-50"
                        )}
                      >
                        {opt[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-elegant p-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-charcoal-400 text-lg">
                  {t("没有找到匹配的项目", "Nessun progetto trovato")}
                </p>
                <p className="text-charcoal-300 text-sm mt-2">
                  {t("请尝试调整筛选条件", "Prova a regolare i filtri")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => {
                  const progress = calculateProgress(project);
                  const firstPartner = project.partners[0];
                  const attachmentCount = project.attachments.length;
                  const currentStageIdx = stageOrder.indexOf(project.stage);
                  const canAdvance = currentStageIdx < stageOrder.length - 1;
                  const historyCount = stageHistoryFromStore.filter((r) => r.projectId === project.id).length;

                  return (
                    <div
                      key={project.id}
                      className="group bg-white rounded-2xl shadow-elegant p-6 hover:shadow-hover hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-warm-gold-200"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 text-xs rounded-full bg-gradient-cnit text-white font-medium">
                          {t(categoryLabels[project.category].zh, categoryLabels[project.category].it)}
                        </span>
                        <span
                          className={cn(
                            "px-3 py-1 text-xs rounded-full font-medium",
                            project.stage === "completed"
                              ? "bg-it-green-50 text-it-green-600"
                              : project.stage === "implementation"
                              ? "bg-warm-gold-50 text-warm-gold-600"
                              : project.stage === "negotiation"
                              ? "bg-cn-red-50 text-cn-red-600"
                              : "bg-charcoal-100 text-charcoal-500"
                          )}
                        >
                          {t(stageLabels[project.stage].zh, stageLabels[project.stage].it)}
                        </span>
                        <button
                          onClick={() => openAttachments(project)}
                          className={cn(
                            "ml-auto flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium transition-all",
                            attachmentCount > 0
                              ? "bg-cn-red-50 text-cn-red-500 hover:bg-cn-red-100"
                              : "bg-charcoal-50 text-charcoal-400 hover:bg-charcoal-100"
                          )}
                          title={t("查看附件", "Visualizza allegati")}
                        >
                          <Paperclip className="w-3 h-3" />
                          {attachmentCount}
                        </button>
                        <button
                          onClick={() => openHistory(project)}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 font-medium transition-all"
                          title={t("流转记录", "Cronologia fasi")}
                        >
                          <History className="w-3 h-3" />
                          {historyCount}
                        </button>
                      </div>

                      <h3 className="text-xl font-semibold text-charcoal-600 mb-2 group-hover:text-cn-red-500 transition-colors line-clamp-2">
                        {lang === "zh" ? project.titleZh : project.titleIt}
                      </h3>
                      <p className="text-sm text-charcoal-300 font-sans-it line-clamp-2 mb-4">
                        {lang === "zh" ? project.titleIt : project.titleZh}
                      </p>

                      <p className="text-sm text-charcoal-400 line-clamp-2 mb-4">
                        {lang === "zh" ? project.descriptionZh : project.descriptionIt}
                      </p>

                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-charcoal-400 mb-2">
                          <span>{t("项目进度", "Progresso")}</span>
                          <span className="font-medium text-charcoal-500">{progress}%</span>
                        </div>
                        <div className="h-2.5 bg-ivory-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                              getProgressGradient(progress)
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {project.partners.length > 0 ? (
                        <div className="mb-4">
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {project.partners.slice(0, 3).map((p) => (
                              <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-ivory-50">
                                <div className="w-8 h-8 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                  {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-charcoal-600 truncate">
                                    {lang === "zh" ? p.nameZh : p.nameIt}
                                  </div>
                                  <div className="text-[11px] text-charcoal-400 truncate">
                                    {p.organization}
                                  </div>
                                  <div className="text-[11px] text-charcoal-400 truncate flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                                    {p.email}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleMailTo(p.email, t(`关于项目：${project.titleZh}`, `Riguardo il progetto: ${project.titleIt}`))}
                                  className="flex-shrink-0 p-1.5 rounded-lg bg-it-green-50 text-it-green-600 hover:bg-it-green-100 transition-colors"
                                  title={t("发邮件", "Invia email")}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          {project.partners.length > 3 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Users className="w-4 h-4 text-charcoal-300" />
                              <div className="flex -space-x-2">
                                {project.partners.slice(3, 6).map((p) => (
                                  <div
                                    key={p.id}
                                    className="w-6 h-6 rounded-full bg-ivory-100 flex items-center justify-center text-charcoal-500 text-xs font-medium border-2 border-white"
                                    title={p.organization}
                                  >
                                    {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                                  </div>
                                ))}
                                {project.partners.length > 6 && (
                                  <div className="w-6 h-6 rounded-full bg-charcoal-100 flex items-center justify-center text-charcoal-500 text-xs font-medium border-2 border-white">
                                    +{project.partners.length - 6}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-charcoal-400">
                                {project.partners.length - 3} {t("位其他合作方", "altri partner")}
                              </span>
                              <button
                                onClick={() => setContactProject(project)}
                                className="ml-auto text-xs text-cn-red-500 hover:underline"
                              >
                                {t("查看全部", "Vedi tutti")}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 p-3 rounded-xl bg-charcoal-50 text-xs text-charcoal-400 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {t("暂无合作方信息", "Nessuna informazione partner disponibile")}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-charcoal-300 pt-3 border-t border-charcoal-50 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {t("更新于", "Aggiornato il")} {formatDate(project.updatedAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cn-red-50 text-cn-red-600 hover:bg-cn-red-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t("查看详情", "Dettagli")}
                        </button>
                        <button
                          onClick={() => openHistory(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          {t("流转记录", "Cronologia")}
                        </button>
                        {project.partners.length > 0 && firstPartner && (
                          <button
                            onClick={() => setContactProject(project)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-it-green-50 text-it-green-600 hover:bg-it-green-100 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {t("联系项目方", "Contatta")}
                          </button>
                        )}
                        {canAdvance && (
                          <button
                            onClick={() => openStageConfirm(project.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-warm-gold-50 text-warm-gold-600 hover:bg-warm-gold-100 transition-colors ml-auto"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            {t("推进至下一阶段", "Fase successiva")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-[fadeInDown_0.3s_ease-out]">
          <div className={cn(
            "flex items-center gap-2 px-5 py-3 rounded-xl shadow-hover text-sm font-medium backdrop-blur-sm",
            toast.type === "success" && "bg-it-green-500/95 text-white",
            toast.type === "error" && "bg-cn-red-500/95 text-white",
            toast.type === "info" && "bg-charcoal-600/95 text-white"
          )}>
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
            {toast.type === "info" && <FileText className="w-4 h-4" />}
            {toast.message}
          </div>
        </div>
      )}

      {confirmStageProjectId && currentProjectForStage && nextStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-md w-full animate-[fadeInDown_0.25s_ease-out]">
            <h3 className="text-lg font-semibold text-charcoal-600 mb-2">
              {t("确认推进阶段", "Conferma avanzamento fase")}
            </h3>
            <div className="mb-4 p-3 rounded-xl bg-warm-gold-50 border border-warm-gold-100">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 text-center">
                  <div className="text-xs text-charcoal-400 mb-1">{t("当前阶段", "Fase attuale")}</div>
                  <div className="font-medium text-charcoal-600">
                    {t(stageLabels[currentProjectForStage.stage].zh, stageLabels[currentProjectForStage.stage].it)}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-warm-gold-500" />
                <div className="flex-1 text-center">
                  <div className="text-xs text-charcoal-400 mb-1">{t("下一阶段", "Prossima fase")}</div>
                  <div className="font-medium text-it-green-600">
                    {t(stageLabels[nextStage].zh, stageLabels[nextStage].it)}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-charcoal-400 mb-4">
              {t(
                "请输入阶段变更备注（可选），此操作将记录在流转历史中。",
                "Inserisci una nota per il cambio di fase (opzionale). Questa azione verrà registrata nella cronologia."
              )}
            </p>
            <textarea
              value={stageRemark}
              onChange={(e) => setStageRemark(e.target.value)}
              placeholder={t("请输入变更备注...", "Inserisci una nota per il cambiamento...")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-warm-gold-200 focus:border-warm-gold-300 text-sm resize-none mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmStageProjectId(null);
                  setStageRemark("");
                }}
                className="px-5 py-2 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
              >
                {t("取消", "Annulla")}
              </button>
              <button
                onClick={() => advanceStage(confirmStageProjectId)}
                className="px-5 py-2 text-sm rounded-xl bg-gradient-cnit text-white shadow-gold hover:shadow-hover transition-all"
              >
                {t("确认推进", "Conferma")}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto animate-[fadeInDown_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
              <h3 className="text-lg font-semibold text-charcoal-600">
                {t("项目合作方", "Partner del progetto")}
              </h3>
              <button onClick={() => setContactProject(null)} className="text-charcoal-300 hover:text-charcoal-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            {contactProject.partners.length === 0 ? (
              <div className="py-12 text-center text-charcoal-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                {t("暂无合作方信息", "Nessuna informazione partner disponibile")}
              </div>
            ) : (
              contactProject.partners.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-ivory-50 mb-3 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-base font-medium flex-shrink-0">
                      {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-charcoal-600">
                        {lang === "zh" ? p.nameZh : p.nameIt}
                      </div>
                      {p.role && (
                        <div className="text-xs text-cn-red-500">{p.role}</div>
                      )}
                      <div className="text-xs text-charcoal-400 truncate mt-0.5">{p.organization}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white">
                      <Mail className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                      <span className="text-charcoal-500 flex-1 truncate">{p.email}</span>
                      <button
                        onClick={() => handleMailTo(p.email, t(`关于项目：${contactProject.titleZh}`, `Riguardo il progetto: ${contactProject.titleIt}`))}
                        className="px-3 py-1 text-xs rounded-lg bg-it-green-50 text-it-green-600 hover:bg-it-green-100 transition-colors font-medium flex-shrink-0"
                      >
                        {t("发邮件", "Email")}
                      </button>
                    </div>
                    {p.phone && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white">
                        <Phone className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                        <span className="text-charcoal-500 flex-1 truncate">{p.phone}</span>
                        <a
                          href={`tel:${p.phone}`}
                          className="px-3 py-1 text-xs rounded-lg bg-cn-red-50 text-cn-red-600 hover:bg-cn-red-100 transition-colors font-medium flex-shrink-0"
                        >
                          {t("拨打", "Chiama")}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => setContactProject(null)}
              className="w-full mt-4 px-5 py-2.5 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
            >
              {t("关闭", "Chiudi")}
            </button>
          </div>
        </div>
      )}

      {historyProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto animate-[fadeInDown_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-600">
                  {t("阶段流转记录", "Cronologia delle fasi")}
                </h3>
                <p className="text-xs text-charcoal-400 mt-1 max-w-xs truncate">
                  {lang === "zh" ? historyProject.titleZh : historyProject.titleIt}
                </p>
              </div>
              <button onClick={() => setHistoryProject(null)} className="text-charcoal-300 hover:text-charcoal-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectStageHistory.length === 0 ? (
              <div className="py-16 text-center">
                <History className="w-12 h-12 mx-auto mb-3 text-charcoal-200" />
                <p className="text-charcoal-400">{t("暂无流转记录", "Nessuna cronologia disponibile")}</p>
              </div>
            ) : (
              <div className="relative pl-2">
                <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-cn-red-300 via-warm-gold-300 to-it-green-300 rounded-full" />

                {projectStageHistory
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((record, idx) => {
                    const attachments = extractAttachmentsFromRemark(record.remark);
                    return (
                      <div key={record.id} className="relative pb-8 last:pb-0">
                        <div className={cn(
                          "absolute left-[5px] w-6 h-6 rounded-full border-4 border-white shadow-elegant flex items-center justify-center z-10",
                          record.toStage === "completed"
                            ? "bg-it-green-500"
                            : record.toStage === "implementation"
                            ? "bg-warm-gold-500"
                            : record.toStage === "negotiation"
                            ? "bg-cn-red-500"
                            : "bg-charcoal-400"
                        )}>
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>

                        <div className="ml-10 bg-ivory-50 rounded-xl p-4 border border-charcoal-100">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {record.fromStage && (
                                <>
                                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white border border-charcoal-200 text-charcoal-500">
                                    {t(stageLabels[record.fromStage].zh, stageLabels[record.fromStage].it)}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-charcoal-300" />
                                </>
                              )}
                              <span className={cn(
                                "px-2.5 py-0.5 text-[10px] rounded-full font-medium",
                                record.toStage === "completed"
                                  ? "bg-it-green-100 text-it-green-700"
                                  : record.toStage === "implementation"
                                  ? "bg-warm-gold-100 text-warm-gold-700"
                                  : record.toStage === "negotiation"
                                  ? "bg-cn-red-100 text-cn-red-700"
                                  : "bg-charcoal-100 text-charcoal-600"
                              )}>
                                {record.fromStage === null ? t("创建项目", "Creazione") : t(stageLabels[record.toStage].zh, stageLabels[record.toStage].it)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-charcoal-400 flex-shrink-0 ml-2">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(record.timestamp)}
                            </div>
                          </div>

                          {record.remark && (
                            <p className="text-sm text-charcoal-500 mb-3 leading-relaxed">{record.remark}</p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-charcoal-100">
                            <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                              <User className="w-3.5 h-3.5" />
                              {record.operator}
                            </div>
                            {attachments.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <Paperclip className="w-3.5 h-3.5 text-charcoal-300" />
                                <span className="text-charcoal-400">
                                  {attachments.length} {t("份附件", "allegati")}
                                </span>
                              </div>
                            )}
                          </div>

                          {attachments.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {attachments.map((attName, i) => (
                                <button
                                  key={`${record.id}-att-${i}`}
                                  onClick={() => showToast(t(`正在下载: ${attName}`, `Scaricando: ${attName}`), "info")}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-white/80 border border-charcoal-100 transition-colors text-left group"
                                >
                                  <FileText className="w-3.5 h-3.5 text-cn-red-400 flex-shrink-0" />
                                  <span className="text-xs text-charcoal-500 flex-1 truncate">{attName}</span>
                                  <Download className="w-3.5 h-3.5 text-charcoal-300 group-hover:text-it-green-500 transition-colors" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <button
              onClick={() => setHistoryProject(null)}
              className="w-full mt-6 px-5 py-2.5 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
            >
              {t("关闭", "Chiudi")}
            </button>
          </div>
        </div>
      )}

      {attachmentsProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto animate-[fadeInDown_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-600 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-cn-red-500" />
                  {t("项目附件", "Allegati del progetto")}
                </h3>
                <p className="text-xs text-charcoal-400 mt-1">
                  {lang === "zh" ? attachmentsProject.titleZh : attachmentsProject.titleIt}
                </p>
              </div>
              <button onClick={() => setAttachmentsProject(null)} className="text-charcoal-300 hover:text-charcoal-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <button
                onClick={handleUploadClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-warm-gold-300 bg-warm-gold-50 text-warm-gold-600 hover:bg-warm-gold-100 hover:border-warm-gold-400 transition-all text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {t("上传新附件", "Carica nuovo allegato")}
              </button>
            </div>

            {attachmentsProject.attachments.length === 0 ? (
              <div className="py-16 text-center">
                <Paperclip className="w-12 h-12 mx-auto mb-3 text-charcoal-200" />
                <p className="text-charcoal-400 mb-2">{t("暂无附件", "Nessun allegato disponibile")}</p>
                <p className="text-xs text-charcoal-300">{t("点击上方按钮上传第一个附件", "Clicca il pulsante sopra per caricare il primo allegato")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachmentsProject.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-ivory-50 hover:bg-white border border-transparent hover:border-charcoal-100 transition-all group"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      att.type.includes("pdf")
                        ? "bg-cn-red-50 text-cn-red-500"
                        : att.type.includes("image")
                        ? "bg-it-green-50 text-it-green-500"
                        : att.type.includes("sheet") || att.type.includes("excel")
                        ? "bg-green-50 text-green-600"
                        : "bg-warm-gold-50 text-warm-gold-600"
                    )}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-charcoal-600 truncate">{att.name}</div>
                      <div className="text-xs text-charcoal-400 flex items-center gap-2 mt-0.5">
                        <span>{formatFileSize(att.size)}</span>
                        <span>·</span>
                        <span>{formatDate(att.uploadedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(att)}
                      className="flex-shrink-0 p-2 rounded-lg bg-white text-charcoal-400 hover:text-it-green-600 hover:bg-it-green-50 transition-colors"
                      title={t("下载", "Scarica")}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setAttachmentsProject(null)}
              className="w-full mt-6 px-5 py-2.5 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
            >
              {t("关闭", "Chiudi")}
            </button>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-[fadeInDown_0.25s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-charcoal-600">
                {t("提交新项目", "Nuovo Progetto")}
              </h3>
              <button onClick={() => { setShowNewProject(false); setNewForm(initialForm); }} className="text-charcoal-300 hover:text-charcoal-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal-500 mb-1">
                    {t("项目名称（中文）", "Nome (Cinese)")}
                  </label>
                  <input
                    type="text"
                    value={newForm.titleZh}
                    onChange={(e) => setNewForm((f) => ({ ...f, titleZh: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal-500 mb-1">
                    {t("项目名称（意大利语）", "Nome (Italiano)")}
                  </label>
                  <input
                    type="text"
                    value={newForm.titleIt}
                    onChange={(e) => setNewForm((f) => ({ ...f, titleIt: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1">
                  {t("分类", "Categoria")}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(categoryLabels) as ProjectCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewForm((f) => ({ ...f, category: cat }))}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-full transition-all",
                        newForm.category === cat
                          ? "bg-gradient-cnit text-white"
                          : "bg-ivory-50 text-charcoal-500 border border-charcoal-100"
                      )}
                    >
                      {t(categoryLabels[cat].zh, categoryLabels[cat].it)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1">
                  {t("项目描述（中文）", "Descrizione (Cinese)")}
                </label>
                <textarea
                  value={newForm.descriptionZh}
                  onChange={(e) => setNewForm((f) => ({ ...f, descriptionZh: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal-500 mb-1">
                  {t("项目描述（意大利语）", "Descrizione (Italiano)")}
                </label>
                <textarea
                  value={newForm.descriptionIt}
                  onChange={(e) => setNewForm((f) => ({ ...f, descriptionIt: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm resize-none"
                />
              </div>

              <div className="border-t border-charcoal-100 pt-4">
                <p className="text-xs font-medium text-charcoal-500 mb-3">
                  {t("合作方信息", "Informazioni Partner")}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-charcoal-400 mb-1">
                      {t("姓名（中文）", "Nome (Cinese)")}
                    </label>
                    <input
                      type="text"
                      value={newForm.partnerNameZh}
                      onChange={(e) => setNewForm((f) => ({ ...f, partnerNameZh: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-400 mb-1">
                      {t("姓名（意大利语）", "Nome (Italiano)")}
                    </label>
                    <input
                      type="text"
                      value={newForm.partnerNameIt}
                      onChange={(e) => setNewForm((f) => ({ ...f, partnerNameIt: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-charcoal-400 mb-1">
                      {t("机构", "Organizzazione")}
                    </label>
                    <input
                      type="text"
                      value={newForm.partnerOrg}
                      onChange={(e) => setNewForm((f) => ({ ...f, partnerOrg: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-400 mb-1">
                      {t("邮箱", "Email")}
                    </label>
                    <input
                      type="email"
                      value={newForm.partnerEmail}
                      onChange={(e) => setNewForm((f) => ({ ...f, partnerEmail: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-charcoal-100 bg-ivory-50 focus:outline-none focus:ring-2 focus:ring-cn-red-200 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setShowNewProject(false); setNewForm(initialForm); }}
                className="px-5 py-2.5 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
              >
                {t("取消", "Annulla")}
              </button>
              <button
                onClick={handleNewProject}
                disabled={!newForm.titleZh || !newForm.titleIt}
                className={cn(
                  "px-5 py-2.5 text-sm rounded-xl text-white transition-all",
                  newForm.titleZh && newForm.titleIt
                    ? "bg-gradient-cnit shadow-gold hover:shadow-hover"
                    : "bg-charcoal-200 cursor-not-allowed"
                )}
              >
                {t("提交", "Invia")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
