import { useMemo, useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Play,
  Target,
  CheckSquare,
  FileCheck,
  History,
} from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  ProgressBar,
  Modal,
} from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/utils";
import type { AuditConclusion } from "@/types";

const DatabaseIcon = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);

const generateSteps = [
  { key: "data", label: "数据采集", icon: DatabaseIcon },
  { key: "verify", label: "科目核对", icon: CheckSquare },
  { key: "anomaly", label: "异常检测", icon: AlertTriangle },
  { key: "report", label: "报告生成", icon: FileCheck },
  { key: "done", label: "完成", icon: CheckCircle2 },
];

const conclusionConfig: Record<AuditConclusion, { label: string; color: string; bg: string; borderColor: string }> = {
  pass: { label: "审计通过", color: "text-emerald-700", bg: "bg-emerald-50", borderColor: "border-emerald-200" },
  qualified: { label: "有保留意见", color: "text-amber-700", bg: "bg-amber-50", borderColor: "border-amber-200" },
  adverse: { label: "否定意见", color: "text-rose-700", bg: "bg-rose-50", borderColor: "border-rose-200" },
};

const severityConfig = {
  high: { label: "高", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  medium: { label: "中", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  low: { label: "低", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
};

const recommendationIcons = [Lightbulb, CheckCircle2, AlertCircle, Info];

export default function AuditReport() {
  const { auditReport, generateAuditReport, isGeneratingAuditReport, auditGenerateProgress, auditGenerateStep } = useAppStore();
  const [showProgress, setShowProgress] = useState(false);

  const sortedAnomalies = useMemo(() => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...auditReport.anomalies].sort((a, b) => order[a.severity] - order[b.severity]);
  }, [auditReport]);

  const conclusionInfo = conclusionConfig[auditReport.conclusion];

  const handleGenerate = async () => {
    setShowProgress(true);
    await generateAuditReport();
  };

  const getSeverityIcon = (severity: "high" | "medium" | "low") => {
    if (severity === "high") return <AlertTriangle className="w-5 h-5" />;
    if (severity === "medium") return <AlertCircle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">审计报告</h2>
                <p className="text-primary-200 text-sm">{auditReport.period}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} className="bg-white/20 hover:bg-white/30 text-white border-0">下载PDF</Button>
              <Button leftIcon={<Play className="w-4 h-4" />} onClick={handleGenerate} disabled={isGeneratingAuditReport} className="bg-white text-primary-600 hover:bg-primary-50">生成审计报告</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><Calendar className="w-4 h-4" /><span>审计期间</span></div>
              <div className="font-semibold text-sm">{formatDate(auditReport.startDate, "MM-DD")} ~ {formatDate(auditReport.endDate, "MM-DD")}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><TrendingUp className="w-4 h-4" /><span>总收入</span></div>
              <div className="font-semibold">{formatCurrency(auditReport.totalIncome)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><TrendingDown className="w-4 h-4" /><span>总支出</span></div>
              <div className="font-semibold">{formatCurrency(auditReport.totalExpense)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><Wallet className="w-4 h-4" /><span>结余</span></div>
              <div className="font-semibold">{formatCurrency(auditReport.balance)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><Building2 className="w-4 h-4" /><span>审计机构</span></div>
              <div className="font-semibold text-sm">{auditReport.auditAgency}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1"><Clock className="w-4 h-4" /><span>生成时间</span></div>
              <div className="font-semibold text-sm">{formatDate(auditReport.generatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-2", conclusionInfo.borderColor, conclusionInfo.bg)}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />审计结论</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Badge variant={auditReport.conclusion === "pass" ? "success" : auditReport.conclusion === "qualified" ? "warning" : "danger"} className="text-base px-4 py-1">
              {conclusionInfo.label}
            </Badge>
            <div className="flex-1">
              <p className={`text-sm ${conclusionInfo.color} leading-relaxed`}>{auditReport.auditOpinion}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">审计范围：</span><span className="text-slate-700">{auditReport.auditScope}</span></div>
                <div><span className="text-slate-500">审计师：</span><span className="text-slate-700">{auditReport.auditor}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-5 h-5 text-rose-500" />异常项 ({sortedAnomalies.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sortedAnomalies.map((anomaly, idx) => {
              const config = severityConfig[anomaly.severity];
              const Icon = getSeverityIcon(anomaly.severity);
              return (
                <m.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.1 }} className={cn("p-4 rounded-xl", config.bg)}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", config.color, "text-white")}>{Icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">{anomaly.type}</span>
                        <Badge variant={anomaly.severity === "high" ? "danger" : anomaly.severity === "medium" ? "warning" : "info"} size="sm">{config.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{anomaly.description}</p>
                      {anomaly.relatedInvoiceId && <p className="text-xs text-slate-500 mt-1">关联票据：{anomaly.relatedInvoiceId}</p>}
                    </div>
                  </div>
                </m.div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="w-5 h-5 text-primary-500" />历史报告</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditReport.history.map((item, idx) => (
                <m.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="relative pl-6 pb-4 border-l-2 border-primary-200 last:border-l-0 last:pb-0"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary-500 border-2 border-white" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.period}</span>
                    <Badge variant={item.conclusion === "pass" ? "success" : item.conclusion === "qualified" ? "warning" : "danger"} size="sm">{item.conclusionLabel}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.generatedAt)} · {item.auditor}</p>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} className="mt-2 h-7 text-xs">下载</Button>
                </m.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="w-5 h-5 text-amber-500" />审计建议</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditReport.recommendations.map((rec, idx) => {
              const Icon = recommendationIcons[idx % recommendationIcons.length];
              return (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-primary-50 border border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600"><Icon className="w-5 h-5" /></div>
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                </m.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showProgress} onClose={() => !isGeneratingAuditReport && setShowProgress(false)} title="生成审计报告" size="md" closeOnOverlayClick={false}>
        <div className="space-y-6 py-4">
          <ProgressBar value={auditGenerateProgress} size="lg" showAnimation={false} />
          <div className="space-y-3">
            {generateSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx < auditGenerateStep;
              const isCurrent = idx === auditGenerateStep - 1;
              return (
                <m.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className={cn("flex items-center gap-3 p-3 rounded-lg", isActive ? "bg-primary-50" : "bg-slate-50")}
                >
                  <div className={cn("p-2 rounded-lg", isActive ? "bg-primary-500 text-white" : "bg-slate-200 text-slate-400")}><Icon className="w-5 h-5" /></div>
                  <span className={cn("font-medium", isActive ? "text-primary-700" : "text-slate-400")}>{step.label}</span>
                  {isCurrent && isGeneratingAuditReport && (
                    <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-primary-500 ml-auto" />
                  )}
                  {isActive && !isCurrent && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                </m.div>
              );
            })}
          </div>
          {!isGeneratingAuditReport && auditGenerateProgress === 100 && (
            <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center pt-4">
              <Button className="w-full" onClick={() => setShowProgress(false)} leftIcon={<CheckCircle2 className="w-4 h-4" />}>完成</Button>
            </m.div>
          )}
        </div>
      </Modal>
    </m.div>
  );
}
