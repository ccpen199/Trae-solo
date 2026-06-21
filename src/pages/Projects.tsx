import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Users, ChevronDown, Filter } from "lucide-react";
import { mockProjects } from "@/data/mock";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory, ProjectStage } from "@/types";

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

const sortOptions = [
  { value: "updatedAt", zh: "最近更新", it: "Recenti" },
  { value: "budget", zh: "预算金额", it: "Budget" },
  { value: "title", zh: "项目名称", it: "Nome Progetto" },
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Projects() {
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);

  const [selectedCategories, setSelectedCategories] = useState<ProjectCategory[]>([]);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOpen, setSortOpen] = useState(false);

  const t = (zh: string, it: string) => (lang === "zh" ? zh : it);

  const filteredProjects = useMemo(() => {
    let result = [...mockProjects];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedStage) {
      result = result.filter((p) => p.stage === selectedStage);
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
  }, [selectedCategories, selectedStage, searchQuery, sortBy, lang]);

  const toggleCategory = (cat: ProjectCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-display-zh text-charcoal-600 mb-2">
            {t("项目库", "Progetti")}
          </h1>
          <p className="text-charcoal-400 font-sans-it">
            {t(
              "中意合作项目全景展示",
              "Panoramica dei progetti di cooperazione Cina-Italia"
            )}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧筛选侧边栏 */}
          <aside className="w-full lg:w-72 lg:flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-elegant p-6 sticky top-24 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-5 h-5 text-cn-red-500" />
                <h2 className="text-lg font-semibold text-charcoal-600">
                  {t("筛选条件", "Filtri")}
                </h2>
              </div>

              {/* 搜索框 */}
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

              {/* 分类筛选（多选） */}
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

              {/* 阶段筛选（单选） */}
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

              {/* 合作方类型（简化展示） */}
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-3">
                  {t("合作方类型", "Tipo Partner")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { zh: "政府机构", it: "Istituzioni" },
                    { zh: "高等院校", it: "Università" },
                    { zh: "商业企业", it: "Imprese" },
                    { zh: "文化机构", it: "Cultura" },
                  ].map((type) => (
                    <span
                      key={type.zh}
                      className="px-3 py-1.5 text-xs rounded-full bg-warm-gold-50 text-warm-gold-600 border border-warm-gold-200 cursor-pointer hover:bg-warm-gold-100 transition-colors"
                    >
                      {t(type.zh, type.it)}
                    </span>
                  ))}
                </div>
              </div>

              {/* 重置按钮 */}
              {(selectedCategories.length > 0 || selectedStage || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedStage(null);
                    setSearchQuery("");
                  }}
                  className="w-full py-2.5 text-sm text-charcoal-400 hover:text-cn-red-500 transition-colors border-t border-charcoal-100 pt-4"
                >
                  {t("重置筛选条件", "Reimposta filtri")}
                </button>
              )}
            </div>
          </aside>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0">
            {/* 顶部工具栏 */}
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

            {/* 项目卡片网格 */}
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
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group bg-white rounded-2xl shadow-elegant p-6 cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-warm-gold-200"
                    >
                      {/* 顶部标签 */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 text-xs rounded-full bg-gradient-cnit text-white font-medium">
                          {t(
                            categoryLabels[project.category].zh,
                            categoryLabels[project.category].it
                          )}
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
                      </div>

                      {/* 标题 */}
                      <h3 className="text-xl font-semibold text-charcoal-600 mb-2 group-hover:text-cn-red-500 transition-colors line-clamp-2">
                        {lang === "zh" ? project.titleZh : project.titleIt}
                      </h3>
                      <p className="text-sm text-charcoal-300 font-sans-it line-clamp-2 mb-4">
                        {lang === "zh" ? project.titleIt : project.titleZh}
                      </p>

                      {/* 进度条 */}
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

                      {/* 合作方列表 */}
                      {project.partners.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-charcoal-300" />
                          <div className="flex -space-x-2">
                            {project.partners.slice(0, 3).map((p) => (
                              <div
                                key={p.id}
                                className="w-7 h-7 rounded-full bg-gradient-cnit flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                title={p.organization}
                              >
                                {(lang === "zh" ? p.nameZh : p.nameIt).charAt(0)}
                              </div>
                            ))}
                            {project.partners.length > 3 && (
                              <div className="w-7 h-7 rounded-full bg-charcoal-100 flex items-center justify-center text-charcoal-500 text-xs font-medium border-2 border-white">
                                +{project.partners.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-charcoal-400 ml-1">
                            {project.partners.length}{" "}
                            {t("个合作方", "partner")}
                          </span>
                        </div>
                      )}

                      {/* 底部：更新时间 */}
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-300 pt-3 border-t border-charcoal-50">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {t("更新于", "Aggiornato il")} {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
