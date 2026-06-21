import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Building2,
  Mail,
  Phone,
  Download,
  FileText,
  Calendar,
  Users,
  MapPin,
  ExternalLink,
} from "lucide-react";
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

function formatBudget(budget: number, currency: string): string {
  const fmt = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
  return `${currency} ${fmt.format(budget)}`;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = useAppStore((s) => s.lang);
  const { favorites, toggleFavorite } = useAppStore();

  const project = useMemo(() => mockProjects.find((p) => p.id === id), [id]);

  const relatedProjects = useMemo(() => {
    if (!project) return [];
    return mockProjects
      .filter((p) => p.id !== project.id && p.category === project.category)
      .slice(0, 3);
  }, [project]);

  const t = (zh: string, it: string) => (lang === "zh" ? zh : it);

  if (!project) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-charcoal-600 mb-2">
            {t("项目不存在", "Progetto non trovato")}
          </h2>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 px-6 py-2.5 bg-gradient-cnit text-white rounded-xl hover:shadow-hover transition-all"
          >
            {t("返回项目列表", "Torna alla lista")}
          </button>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.includes(project.id);
  const progress = calculateProgress(project);

  return (
    <div className="min-h-screen bg-ivory-50">
      {/* Header */}
      <div className="bg-gradient-cnit text-white">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 rounded-xl backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t("返回列表", "Indietro")}</span>
            </button>
            <button
              onClick={() => toggleFavorite(project.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm transition-all",
                isFavorite
                  ? "bg-warm-gold-400 text-white shadow-gold"
                  : "bg-white/15 hover:bg-white/25"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              <span className="text-sm">
                {isFavorite ? t("已收藏", "Preferito") : t("收藏", "Preferiti")}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs rounded-full bg-white/20 backdrop-blur-sm font-medium">
              {t(categoryLabels[project.category].zh, categoryLabels[project.category].it)}
            </span>
            <span
              className={cn(
                "px-3 py-1 text-xs rounded-full font-medium",
                project.stage === "completed"
                  ? "bg-it-green-500/80"
                  : project.stage === "implementation"
                  ? "bg-warm-gold-400/80"
                  : project.stage === "negotiation"
                  ? "bg-cn-red-400/80"
                  : "bg-white/20"
              )}
            >
              {t(stageLabels[project.stage].zh, stageLabels[project.stage].it)}
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-display-zh mb-3 leading-tight">
            {lang === "zh" ? project.titleZh : project.titleIt}
          </h1>
          <p className="text-white/80 font-sans-it text-lg">
            {lang === "zh" ? project.titleIt : project.titleZh}
          </p>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <div className="bg-white rounded-2xl shadow-elegant p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-charcoal-600 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cn-red-500" />
                {t("基本信息", "Informazioni Generali")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-charcoal-400 mb-1">{t("项目地点", "Luogo")}</div>
                    <div className="text-sm text-charcoal-600">
                      {lang === "zh" ? project.locationZh : project.locationIt}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-charcoal-400 mb-1">{t("项目周期", "Periodo")}</div>
                    <div className="text-sm text-charcoal-600">
                      {formatDate(project.startDate)}
                      {project.endDate ? ` - ${formatDate(project.endDate)}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <FileText className="w-5 h-5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-charcoal-400 mb-1">{t("项目预算", "Budget")}</div>
                    <div className="text-sm text-charcoal-600 font-medium">
                      {formatBudget(project.budget, project.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 进度条可视化 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-charcoal-500">
                    {t("项目进度", "Progresso Progetto")}
                  </span>
                  <span className="text-lg font-bold text-charcoal-600">{progress}%</span>
                </div>
                <div className="h-4 bg-ivory-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
                      getProgressGradient(progress)
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-charcoal-400">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cn-red-500" />
                    {t("规划", "Pianificazione")}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warm-gold-500" />
                    {t("洽谈/实施", "Negoziazione")}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-it-green-500" />
                    {t("完成", "Completato")}
                  </div>
                </div>
              </div>
            </div>

            {/* 项目描述 - 双语双栏 */}
            <div className="bg-white rounded-2xl shadow-elegant p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-charcoal-600 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-warm-gold-500" />
                {t("项目描述", "Descrizione Progetto")}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:border-r lg:border-charcoal-100 lg:pr-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-cn-red-50 flex items-center justify-center text-cn-red-500 text-xs font-bold">
                      中
                    </span>
                    <span className="text-sm text-charcoal-400">中文 / Chinese</span>
                  </div>
                  <p className="text-charcoal-500 leading-relaxed">{project.descriptionZh}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-it-green-50 flex items-center justify-center text-it-green-500 text-xs font-bold">
                      IT
                    </span>
                    <span className="text-sm text-charcoal-400">Italiano / Italian</span>
                  </div>
                  <p className="text-charcoal-500 leading-relaxed font-sans-it">
                    {project.descriptionIt}
                  </p>
                </div>
              </div>
            </div>

            {/* 文档附件区 */}
            <div className="bg-white rounded-2xl shadow-elegant p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-charcoal-600 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-it-green-500" />
                {t("文档附件", "Documenti Allegati")}
              </h2>
              {project.attachments.length === 0 ? (
                <div className="py-12 text-center text-charcoal-300">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t("暂无附件", "Nessun allegato disponibile")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-ivory-50 hover:bg-ivory-100 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-cnit flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-charcoal-600 truncate">{att.name}</div>
                        <div className="text-xs text-charcoal-400 mt-1">
                          {formatFileSize(att.size)} · {formatDate(att.uploadedAt)}
                        </div>
                      </div>
                      <a
                        href={att.url}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-it-green-600 bg-it-green-50 hover:bg-it-green-100 transition-colors flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        {t("下载", "Scarica")}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 联系人信息卡片 */}
            <div className="bg-white rounded-2xl shadow-elegant p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-charcoal-600 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-cn-red-500" />
                {t("项目联系人", "Contatti Progetto")}
              </h2>
              {project.partners.length === 0 ? (
                <div className="py-8 text-center text-charcoal-300">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t("暂无联系人", "Nessun contatto disponibile")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {project.partners.map((partner) => (
                    <div key={partner.id} className="pb-5 border-b border-charcoal-50 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-cnit flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {(lang === "zh" ? partner.nameZh : partner.nameIt).charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-charcoal-600">
                            {lang === "zh" ? partner.nameZh : partner.nameIt}
                          </div>
                          <div className="text-xs text-cn-red-500 mt-0.5">{partner.role}</div>
                        </div>
                      </div>
                      <div className="ml-14 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-charcoal-500">
                          <Building2 className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                          <span className="truncate">{partner.organization}</span>
                        </div>
                        <a
                          href={`mailto:${partner.email}`}
                          className="flex items-center gap-2 text-sm text-charcoal-500 hover:text-cn-red-500 transition-colors"
                        >
                          <Mail className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                          <span className="truncate">{partner.email}</span>
                        </a>
                        {partner.phone && (
                          <a
                            href={`tel:${partner.phone}`}
                            className="flex items-center gap-2 text-sm text-charcoal-500 hover:text-it-green-500 transition-colors"
                          >
                            <Phone className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                            <span>{partner.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 相关项目推荐 */}
            {relatedProjects.length > 0 && (
              <div className="bg-white rounded-2xl shadow-elegant p-6 lg:p-8">
                <h2 className="text-xl font-semibold text-charcoal-600 mb-6 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-warm-gold-500" />
                  {t("相关项目", "Progetti Correlati")}
                </h2>
                <div className="space-y-3">
                  {relatedProjects.map((rp) => {
                    const rpProgress = calculateProgress(rp);
                    return (
                      <div
                        key={rp.id}
                        onClick={() => navigate(`/projects/${rp.id}`)}
                        className="p-4 rounded-xl bg-ivory-50 hover:bg-ivory-100 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-gradient-cnit text-white">
                            {t(
                              categoryLabels[rp.category].zh,
                              categoryLabels[rp.category].it
                            )}
                          </span>
                        </div>
                        <div className="font-medium text-charcoal-600 text-sm group-hover:text-cn-red-500 transition-colors line-clamp-1">
                          {lang === "zh" ? rp.titleZh : rp.titleIt}
                        </div>
                        <div className="h-1.5 bg-charcoal-100 rounded-full mt-3 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r",
                              getProgressGradient(rpProgress)
                            )}
                            style={{ width: `${rpProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
