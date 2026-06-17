import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useAppStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CountUp,
  DataTable,
  ProgressBar,
  Badge,
} from "@/components/ui";
import { cn, formatCurrency, formatPercent } from "@/utils";
import type { FinanceAccount } from "@/types";

const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const incomeData = [150000, 160000, 155000, 170000, 165000, 180000, 0, 0, 0, 0, 0, 0];
const expenseData = [120000, 130000, 125000, 140000, 135000, 150000, 0, 0, 0, 0, 0, 0];

export default function FinanceOverview() {
  const { financeAccounts, invoices } = useAppStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["acc001", "acc006"]));

  const totalIncome = useMemo(
    () => invoices.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const totalExpense = useMemo(
    () => invoices.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const balance = totalIncome - totalExpense;

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const flattenAccounts = (accounts: FinanceAccount[]): FinanceAccount[] => {
    const result: FinanceAccount[] = [];
    const traverse = (nodes: FinanceAccount[]) =>
      nodes.forEach((node) => {
        result.push(node);
        if (node.children) traverse(node.children);
      });
    traverse(accounts);
    return result;
  };

  const trendOption = useMemo(
    () => ({
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: { data: ["收入", "支出"], top: 0 },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "category", data: months },
      yAxis: [
        { type: "value", name: "收入(元)", position: "left" },
        { type: "value", name: "支出(元)", position: "right" },
      ],
      series: [
        {
          name: "收入",
          type: "line",
          yAxisIndex: 0,
          smooth: true,
          data: incomeData,
          itemStyle: { color: "#10B981" },
          areaStyle: { color: "rgba(16, 185, 129, 0.1)" },
        },
        {
          name: "支出",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: expenseData,
          itemStyle: { color: "#2563EB" },
          areaStyle: { color: "rgba(37, 99, 235, 0.1)" },
        },
      ],
    }),
    []
  );

  const getStatusBadge = (rate: number) => {
    if (rate > 100) return <Badge variant="danger">超支</Badge>;
    if (rate >= 80) return <Badge variant="warning">预警</Badge>;
    return <Badge variant="success">正常</Badge>;
  };

  const columns = [
    { key: "name", title: "科目名称", dataIndex: "name" as const, sortable: true },
    { key: "budget", title: "预算", dataIndex: "budget" as const, align: "right" as const, sortable: true, render: (v: number) => formatCurrency(v) },
    { key: "actual", title: "实际", dataIndex: "actual" as const, align: "right" as const, sortable: true, render: (v: number) => formatCurrency(v) },
    { key: "rate", title: "执行率", dataIndex: "budget" as const, align: "right" as const, sortable: true, render: (_: number, r: FinanceAccount) => formatPercent(r.budget > 0 ? (r.actual / r.budget) * 100 : 0) },
    { key: "status", title: "状态", dataIndex: "budget" as const, align: "center" as const, render: (_: number, r: FinanceAccount) => getStatusBadge(r.budget > 0 ? (r.actual / r.budget) * 100 : 0) },
  ];

  const tableData = useMemo(
    () => flattenAccounts(financeAccounts).filter((a) => !a.children),
    [financeAccounts]
  );

  const TreeNode = ({ node, level = 0 }: { node: FinanceAccount; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const rate = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
    const isOverBudget = rate > 100;

    return (
      <m.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
        <div
          className={cn("flex items-center py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-50", level === 0 && "font-semibold")}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            <m.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="mr-1">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </m.div>
          ) : <span className="w-5" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn("text-sm truncate", node.type === "income" ? "text-emerald-700" : "text-primary-700")}>
                {node.name}
              </span>
              <span className="text-xs text-slate-500 ml-2">{formatPercent(rate)}</span>
            </div>
            <ProgressBar value={Math.min(rate, 100)} variant={isOverBudget ? "danger" : "primary"} size="sm" showAnimation={false} className="mt-1" />
          </div>
        </div>
        {hasChildren && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            {node.children!.map((child) => <TreeNode key={child.id} node={child} level={level + 1} />)}
          </m.div>
        )}
      </m.div>
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <Card hoverable>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <CountUp end={value} format="currency" className={cn("text-3xl mt-2", color)} />
          </div>
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", color.replace("text-", "bg-").replace("600", "100"))}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="年度总收入" value={totalIncome} icon={TrendingUp} color="text-emerald-600" />
        <StatCard title="年度总支出" value={totalExpense} icon={TrendingDown} color="text-primary-600" />
        <StatCard title="年度结余" value={balance} icon={Wallet} color={balance >= 0 ? "text-emerald-600" : "text-rose-600"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">科目导航</CardTitle></CardHeader>
          <CardContent className="p-3 space-y-1 max-h-[600px] overflow-y-auto">
            {financeAccounts.map((node) => <TreeNode key={node.id} node={node} />)}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">月度收支趋势</CardTitle></CardHeader>
            <CardContent><ReactECharts option={trendOption} style={{ height: "300px" }} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">科目执行情况</CardTitle></CardHeader>
            <CardContent>
              <DataTable<FinanceAccount> columns={columns} data={tableData} rowKey="id" pagination={{ current: 1, pageSize: 10, total: tableData.length, onChange: () => {} }} />
            </CardContent>
          </Card>
        </div>
      </div>
    </m.div>
  );
}
