import { useMemo, useState } from "react";
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
} from "lucide-react";
import { mockProjects } from "@/data/mock";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory, ProjectStage, ProjectPartner } from "@/types";

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
  { zh: "政府机构", it: "Istituzioni", keywords: ["Confindustria", "Trade", "Board", "促进会", "政府"] },
  { zh: "高等院校", it: "Università", keywords: ["Politecnico", "Università", "Accademia"] },
  { zh: "商业企业", it: "Imprese", keywords: ["Ospedale", "San Raffaele", "Istituto", "Cucina"] },
  { zh: "文化机构", it: "Cultura", keywords: ["Tourism", "Arti", "Belle Arti"] },
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

export default function Projects() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

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
  const [contactProject, setContactProject] = useState<Project | null>(null);

  const t = (zh: string, it: string) => (lang === "zh" ? zh : it);

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

  const toggleCategory = (cat: ProjectCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const advanceStage = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const idx = stageOrder.indexOf(p.stage);
        if (idx >= stageOrder.length - 1) return p;
        return { ...p, stage: stageOrder[idx + 1], updatedAt: new Date().toISOString() };
      })
    );
    setConfirmStageProjectId(null);
  };

  const handleNewProject = () => {
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
      authorId: "current",
    };

    setProjects((prev) => [newProject, ...prev]);
    setShowNewProject(false);
    setNewForm(initialForm);
  };

  const hasFilters = selectedCategories.length > 0 || selectedStage || selectedPartnerType !== null || searchQuery;

  return (
    <div className="min-h-screen bg-ivory-50">
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
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-cnit text-white rounded-xl shadow-hover hover:shadow-elegant transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("提交新项目", "Nuovo Progetto")}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-elegant p-6 sticky top-24 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-cn-red-500" />
                <h2 className="text-lg font-semibold text-charcoal-600">
                  {t("筛选条件", "Filtri")}
                </h2>
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
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                          active
                            ? "bg-gradient-cnit text-white shadow-gold"
                            : "bg-ivory-50 text-charcoal-500 hover:bg-ivory-100"
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                            active ? "border-white" : "border-charcoal-200"
                          )}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                        <span>{t(categoryLabels[cat].zh, categoryLabels[cat].it)}</span>
                      </button>
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
                            active ? "border-it-green-500" : "border-charcoal-200"
                          )}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-it-green-500" />}
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
                            ? "bg-warm-gold-500 text-white border border-warm-gold-500"
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
                        {attachmentCount > 0 && (
                          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-cn-red-50 text-cn-red-500 font-medium">
                            <Paperclip className="w-3 h-3" />
                            {attachmentCount} {t("份附件", "allegati")}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-charcoal-600 mb-2 group-hover:text-cn-red-500 transition-colors line-clamp-2">
                        {lang === "zh" ? project.titleZh : project.titleIt}
                      </h3>
                      <p className="text-sm text-charcoal-300 font-sans-it line-clamp-2 mb-4">
                        {lang === "zh" ? project.titleIt : project.titleZh}
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

                      {firstPartner && (
                        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-ivory-50">
                          <div className="w-8 h-8 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {(lang === "zh" ? firstPartner.nameZh : firstPartner.nameIt).charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-charcoal-600 truncate">
                              {lang === "zh" ? firstPartner.nameZh : firstPartner.nameIt}
                            </div>
                            <div className="text-xs text-charcoal-400 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {firstPartner.email}
                            </div>
                          </div>
                        </div>
                      )}

                      {project.partners.length > 1 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-charcoal-300" />
                          <div className="flex -space-x-2">
                            {project.partners.slice(1, 4).map((p) => (
                              <div
                                key={p.id}
                                className="w-6 h-6 rounded-full bg-ivory-100 flex items-center justify-center text-charcoal-500 text-xs font-medium border-2 border-white"
                                title={p.organization}
                              >
                                {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                              </div>
                            ))}
                            {project.partners.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-charcoal-100 flex items-center justify-center text-charcoal-500 text-xs font-medium border-2 border-white">
                                +{project.partners.length - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-charcoal-400">
                            {project.partners.length - 1} {t("位其他合作方", "altri partner")}
                          </span>
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
                        {firstPartner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContactProject(project);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-it-green-50 text-it-green-600 hover:bg-it-green-100 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {t("联系项目方", "Contatta")}
                          </button>
                        )}
                        {canAdvance && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmStageProjectId(project.id);
                            }}
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

      {confirmStageProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal-600 mb-2">
              {t("确认推进阶段", "Conferma avanzamento fase")}
            </h3>
            <p className="text-sm text-charcoal-400 mb-6">
              {t(
                "确定要将该项目推进至下一阶段吗？此操作将更新项目阶段标签。",
                "Confermi di voler avanzare il progetto alla fase successiva? Questa azione aggiornerà l'etichetta della fase del progetto."
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmStageProjectId(null)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-charcoal-600">
                {t("联系项目方", "Contatta il partner")}
              </h3>
              <button onClick={() => setContactProject(null)} className="text-charcoal-300 hover:text-charcoal-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            {contactProject.partners.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-ivory-50 mb-3 last:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-sm font-medium">
                    {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-charcoal-600">
                      {lang === "zh" ? p.nameZh : p.nameIt}
                    </div>
                    <div className="text-xs text-charcoal-400">{p.organization}</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-charcoal-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-charcoal-300" />
                    {p.email}
                  </div>
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-charcoal-300" />
                      {p.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => setContactProject(null)}
              className="w-full mt-4 px-5 py-2.5 text-sm rounded-xl bg-ivory-50 text-charcoal-500 hover:bg-ivory-100 transition-colors"
            >
              {t("关闭", "Chiudi")}
            </button>
          </div>
        </div>
      )}

      {showNewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-hover p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                <div className="flex gap-2">
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
