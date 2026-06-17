import { useMemo } from "react";
import { motion as m } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { cn, formatCurrency, formatDate } from "@/utils";

const severityConfig = {
  high: { label: "高", color: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700" },
  medium: { label: "中", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  low: { label: "低", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
};

const recommendationIcons = [Lightbulb, CheckCircle2, AlertCircle, Info];

export default function AuditReport() {
  const { auditReport } = useAppStore();

  const sortedAnomalies = useMemo(() => {
    const order = { high: 0, medium: 1, low: 2 };
    return [...auditReport.anomalies].sort(
      (a, b) => order[a.severity] - order[b.severity]
    );
  }, [auditReport]);

  const chartOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { data: ["预算", "实际"], top: 0 },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: {
        type: "category",
        data: ["收入类", "支出类"],
      },
      yAxis: { type: "value", name: "金额(元)" },
      series: [
        {
          name: "预算",
          type: "bar",
          data: [2000000, 1600000],
          itemStyle: { color: "#94A3B8" },
          barWidth: "35%",
        },
        {
          name: "实际",
          type: "bar",
          data: [auditReport.totalIncome, auditReport.totalExpense],
          itemStyle: { color: "#2563EB" },
          barWidth: "35%",
        },
      ],
    }),
    [auditReport]
  );

  const getSeverityIcon = (severity: "high" | "medium" | "low") => {
    if (severity === "high") return <AlertTriangle className="w-5 h-5" />;
    if (severity === "medium") return <AlertCircle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
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
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              导出报告
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                <span>审计期间</span>
              </div>
              <div className="font-semibold">
                {formatDate(auditReport.startDate, "MM-DD")} ~ {formatDate(auditReport.endDate, "MM-DD")}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>总收入</span>
              </div>
              <div className="font-semibold">{formatCurrency(auditReport.totalIncome)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>总支出</span>
              </div>
              <div className="font-semibold">{formatCurrency(auditReport.totalExpense)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Wallet className="w-4 h-4" />
                <span>结余</span>
              </div>
              <div className="font-semibold">{formatCurrency(auditReport.balance)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                <span>审计机构</span>
              </div>
              <div className="font-semibold text-sm">{auditReport.auditor}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-primary-200 text-sm mb-1">
                <Clock className="w-4 h-4" />
                <span>生成时间</span>
              </div>
              <div className="font-semibold text-sm">
                {formatDate(auditReport.generatedAt)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              异常项 ({sortedAnomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedAnomalies.map((anomaly, idx) => {
              const config = severityConfig[anomaly.severity];
              const Icon = getSeverityIcon(anomaly.severity);
              return (
                <m.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className={cn("p-4 rounded-xl", config.bg)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", config.color, "text-white")}>
                      {Icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">
                          {anomaly.type}
                        </span>
                        <Badge
                          variant={
                            anomaly.severity === "high"
                              ? "danger"
                              : anomaly.severity === "medium"
                              ? "warning"
                              : "info"
                          }
                          size="sm"
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{anomaly.description}</p>
                      {anomaly.relatedInvoiceId && (
                        <p className="text-xs text-slate-500 mt-1">
                          关联票据：{anomaly.relatedInvoiceId}
                        </p>
                      )}
                    </div>
                  </div>
                </m.div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              收支对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={chartOption} style={{ height: "300px" }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            审计建议
          </CardTitle>
        </CardHeader>
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
                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                </m.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
