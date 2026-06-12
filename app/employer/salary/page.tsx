"use client";

import * as React from "react";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Filter,
  Download,
  Share2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatNumber } from "@/lib/utils";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

const salaryData = {
  p10: 18000,
  p25: 22000,
  p50: 28000,
  p75: 35000,
  p90: 45000,
  average: 29500,
  median: 28000,
  sampleSize: 12580,
  updateTime: "2024-01-15",
};

const salaryByCity = [
  { city: "北京", p25: 25000, p50: 32000, p75: 42000, avg: 33000 },
  { city: "上海", p25: 24000, p50: 31000, p75: 40000, avg: 31500 },
  { city: "深圳", p25: 23000, p50: 29000, p75: 38000, avg: 30000 },
  { city: "杭州", p25: 20000, p50: 26000, p75: 34000, avg: 26500 },
  { city: "广州", p25: 19000, p50: 25000, p75: 32000, avg: 25500 },
  { city: "成都", p25: 15000, p50: 20000, p75: 26000, avg: 20500 },
];

const salaryByExperience = [
  { exp: "应届生", p25: 12000, p50: 15000, p75: 18000 },
  { exp: "1-3年", p25: 18000, p50: 22000, p75: 28000 },
  { exp: "3-5年", p25: 25000, p50: 30000, p75: 38000 },
  { exp: "5-10年", p25: 35000, p50: 45000, p75: 55000 },
  { exp: "10年以上", p25: 45000, p50: 55000, p75: 70000 },
];

const salaryByEducation = [
  { edu: "大专", p25: 12000, p50: 16000, p75: 20000 },
  { edu: "本科", p25: 20000, p50: 26000, p75: 33000 },
  { edu: "硕士", p25: 28000, p50: 35000, p75: 45000 },
  { edu: "博士", p25: 40000, p50: 52000, p75: 68000 },
];

const salaryTrend = [
  { month: "2023-08", salary: 27500 },
  { month: "2023-09", salary: 27800 },
  { month: "2023-10", salary: 28200 },
  { month: "2023-11", salary: 28500 },
  { month: "2023-12", salary: 28800 },
  { month: "2024-01", salary: 29500 },
];

const industryCompare = [
  { industry: "互联网", salary: 29500, change: 5.2 },
  { industry: "金融", salary: 28000, change: 3.8 },
  { industry: "咨询", salary: 26500, change: 4.1 },
  { industry: "快消", salary: 22000, change: 2.5 },
  { industry: "制造", salary: 18500, change: 1.8 },
  { industry: "教育", salary: 16000, change: -0.5 },
];

const reportTemplates = [
  { id: "1", name: "年度薪酬白皮书", type: "年度报告", jobs: 56, pages: 120, date: "2024-01-01" },
  { id: "2", name: "Q4技术岗薪酬报告", type: "季度报告", jobs: 28, pages: 68, date: "2024-01-10" },
  { id: "3", name: "应届生起薪报告", type: "专项报告", jobs: 15, pages: 45, date: "2023-12-15" },
];

const percentileDetails = [
  {
    label: "P10",
    value: salaryData.p10,
    description: "市场底部10%分位值",
    color: "text-slate-500",
    bgColor: "bg-slate-100",
  },
  {
    label: "P25",
    value: salaryData.p25,
    description: "市场较低25%分位值",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    label: "P50",
    value: salaryData.p50,
    description: "市场中位值",
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
  },
  {
    label: "P75",
    value: salaryData.p75,
    description: "市场较高75%分位值",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
  },
  {
    label: "P90",
    value: salaryData.p90,
    description: "市场顶部10%分位值",
    color: "text-rose-500",
    bgColor: "bg-rose-100",
  },
];

export default function SalaryReportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "compare" | "reports">("overview");
  const [selectedJob, setSelectedJob] = useState("高级前端工程师");
  const [selectedCity, setSelectedCity] = useState("北京");
  const [selectedExp, setSelectedExp] = useState("3-5年");

  const currentSalary = 32000;
  const yourRank = 58;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <DollarSign className="h-7 w-7" />
                薪酬分位值报告
              </h1>
              <p className="text-white/70 mt-1">
                对接第三方薪资数据库，提供精准的市场薪酬参考
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                导出报告
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                分享
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {percentileDetails.map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.bgColor} ${item.color}`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(item.value, 0)}
                </p>
                <p className="text-xs text-white/60 mt-1">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-300 flex-shrink-0" />
              <p className="text-sm text-white/80">
                数据来源：全国 {salaryData.sampleSize.toLocaleString()} 份样本，更新于{" "}
                {salaryData.updateTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { key: "overview", label: "薪酬概览", icon: <BarChart3 className="h-4 w-4" /> },
              { key: "compare", label: "多维度对比", icon: <TrendingUp className="h-4 w-4" /> },
              { key: "reports", label: "报告中心", icon: <PieChart className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "text-blue-600 border-blue-600"
                    : "text-slate-600 border-transparent hover:text-slate-900"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option>高级前端工程师</option>
              <option>Java开发工程师</option>
              <option>产品经理</option>
              <option>UI设计师</option>
              <option>数据分析师</option>
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
            <MapPin className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option>北京</option>
              <option>上海</option>
              <option>深圳</option>
              <option>杭州</option>
              <option>广州</option>
              <option>成都</option>
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200">
            <Clock className="h-4 w-4 text-slate-400" />
            <select
              value={selectedExp}
              onChange={(e) => setSelectedExp(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              <option>应届生</option>
              <option>1-3年</option>
              <option>3-5年</option>
              <option>5-10年</option>
              <option>10年以上</option>
            </select>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">薪酬分布</CardTitle>
                  <CardDescription>
                    {selectedJob} · {selectedCity} · {selectedExp}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[
                          { range: "10K以下", count: 320 },
                          { range: "10-15K", count: 1250 },
                          { range: "15-20K", count: 2580 },
                          { range: "20-25K", count: 3680 },
                          { range: "25-30K", count: 2850 },
                          { range: "30-40K", count: 2100 },
                          { range: "40-50K", count: 1050 },
                          { range: "50K以上", count: 580 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <ReferenceLine
                          x={currentSalary / 1000 > 25 ? "30-40K" : "25-30K"}
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{ value: "你的薪资", fill: "#f59e0b", fontSize: 11 }}
                        />
                        <Bar dataKey="count" name="人数" radius={[4, 4, 0, 0]}>
                          {[
                            { fill: "#94a3b8" },
                            { fill: "#60a5fa" },
                            { fill: "#3b82f6" },
                            { fill: "#10b981" },
                            { fill: "#8b5cf6" },
                            { fill: "#3b82f6" },
                            { fill: "#60a5fa" },
                            { fill: "#94a3b8" },
                          ].map((entry, index) => (
                            <rect key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">你的薪资水平</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold text-slate-900">
                          {formatNumber(currentSalary, 0)}
                        </span>
                        <span className="text-sm text-slate-500">/月</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">市场排名</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold text-amber-500">Top {yourRank}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">薪酬趋势</CardTitle>
                  <CardDescription>近6个月变化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salaryTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={11} domain={[27000, 30000]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="salary"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="平均薪资"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">
                        半年涨幅 +7.3%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">各城市薪酬对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={salaryByCity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={11} />
                        <YAxis dataKey="city" type="category" stroke="#64748b" fontSize={11} width={50} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="p50" name="中位薪资" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="p75" name="P75分位" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">按工作经验分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salaryByExperience}>
                        <defs>
                          <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="exp" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="p50"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          fill="url(#colorSalary)"
                          name="中位薪资"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">分行业薪酬对比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {industryCompare.map((item) => (
                    <div
                      key={item.industry}
                      className="p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all"
                    >
                      <p className="text-sm text-slate-600 mb-2">{item.industry}</p>
                      <p className="text-xl font-bold text-slate-900 mb-1">
                        {formatNumber(item.salary, 0)}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          item.change >= 0 ? "text-emerald-600" : "text-red-500"
                        )}
                      >
                        {item.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(item.change)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">城市维度对比</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salaryByCity.map((item) => (
                      <div key={item.city} className="p-4 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-slate-900">{item.city}</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            {formatNumber(item.avg, 0)}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-white">
                            <p className="text-xs text-slate-500">P25</p>
                            <p className="font-semibold text-slate-700 text-sm">
                              {formatNumber(item.p25 / 1000, 1)}K
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-emerald-50">
                            <p className="text-xs text-emerald-600">P50</p>
                            <p className="font-semibold text-emerald-700 text-sm">
                              {formatNumber(item.p50 / 1000, 1)}K
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-white">
                            <p className="text-xs text-slate-500">P75</p>
                            <p className="font-semibold text-slate-700 text-sm">
                              {formatNumber(item.p75 / 1000, 1)}K
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">学历维度对比</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {salaryByEducation.map((item) => (
                        <div
                          key={item.edu}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-900">{item.edu}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500">P50: </span>
                            <span className="font-semibold text-slate-900">
                              {formatNumber(item.p50, 0)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">AI薪酬建议</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">
                            智能薪酬建议
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            根据市场数据和岗位要求，建议该岗位薪资范围设置为{" "}
                            <span className="font-semibold text-blue-600">
                              28K - 38K
                            </span>
                            ，中位值{" "}
                            <span className="font-semibold text-emerald-600">32K</span>。
                            此薪资范围在市场上具有竞争力，能够吸引到3-5年经验的优秀人才。
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="p-3 rounded-lg bg-white/60 text-center">
                          <p className="text-xs text-slate-500 mb-1">建议起薪</p>
                          <p className="text-lg font-bold text-blue-600">28K</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/60 text-center">
                          <p className="text-xs text-slate-500 mb-1">建议中位</p>
                          <p className="text-lg font-bold text-emerald-600">32K</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/60 text-center">
                          <p className="text-xs text-slate-500 mb-1">建议上限</p>
                          <p className="text-lg font-bold text-purple-600">38K</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-900">可用报告</h3>
              <Button variant="gradient">
                <Sparkles className="h-4 w-4 mr-2" />
                生成定制报告
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((report) => (
                <Card key={report.id} hover className="cursor-pointer">
                  <CardContent className="p-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white mb-4">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{report.name}</h4>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" size="sm">
                        {report.type}
                      </Badge>
                      <span className="text-xs text-slate-500">{report.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
                      <span>{report.jobs} 个岗位</span>
                      <span>{report.pages} 页</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>数据来源说明</CardTitle>
                <CardDescription>薪酬数据的采集与处理方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">样本量充足</p>
                    <p>
                      本报告基于全国 {salaryData.sampleSize.toLocaleString()} 份有效薪资样本，
                      覆盖互联网、金融、制造等多个行业。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">数据真实可靠</p>
                    <p>
                      所有数据均来自求职者自主提交和企业公开数据，经过多重校验确保真实性。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 mb-1">定期更新</p>
                    <p>
                      数据库每月更新一次，确保数据时效性。最近更新时间：{salaryData.updateTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
