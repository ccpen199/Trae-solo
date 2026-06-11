"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Building2,
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  ArrowUpDown,
  Bookmark,
  Share2,
  DollarSign,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn, formatMoney } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  companySize: string;
  industry: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experienceLevel: string;
  educationLevel: string;
  workType: string;
  tags: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  updatedAt: string;
  viewsCount: number;
  applicationsCount: number;
  urgent?: boolean;
  aiMatchScore?: number;
}

const mockJobs: Job[] = [
  {
    id: "1",
    title: "高级前端工程师",
    company: "字节跳动",
    companyLogo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=80&h=80&fit=crop",
    companySize: "10000人以上",
    industry: "互联网",
    location: "北京",
    salaryMin: 25000,
    salaryMax: 50000,
    experienceLevel: "3-5年",
    educationLevel: "本科",
    workType: "全职",
    tags: ["React", "TypeScript", "微前端", "性能优化"],
    description: "负责抖音电商直播业务前端架构设计与开发，打造千万级用户的直播电商体验。",
    requirements: [
      "本科及以上学历，计算机相关专业优先",
      "3年以上前端开发经验，有大型互联网项目经验",
      "精通React、Vue等至少一种主流框架，深入理解原理",
      "熟悉TypeScript，有大型TypeScript项目经验",
      "有性能优化、工程化、微前端相关经验优先",
    ],
    benefits: ["六险一金", "年终奖金", "股票期权", "免费三餐", "健身房", "弹性工作"],
    updatedAt: "2024-01-15",
    viewsCount: 12580,
    applicationsCount: 326,
    urgent: true,
    aiMatchScore: 92,
  },
  {
    id: "2",
    title: "高级产品经理",
    company: "阿里巴巴",
    companyLogo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=80&h=80&fit=crop",
    companySize: "10000人以上",
    industry: "电子商务",
    location: "杭州",
    salaryMin: 20000,
    salaryMax: 35000,
    experienceLevel: "5-10年",
    educationLevel: "本科",
    workType: "全职",
    tags: ["B端产品", "SaaS", "数据分析", "项目管理"],
    description: "负责商家中台产品规划和设计，服务千万级商家，赋能商家经营效率提升。",
    requirements: [
      "本科及以上学历，5年以上B端产品经验",
      "有SaaS、ERP、CRM等企业服务产品经验优先",
      "具备优秀的数据分析能力和商业敏感度",
      "出色的沟通协调能力和项目推进能力",
    ],
    benefits: ["六险一金", "年终分红", "带薪年假", "节日福利", "定期体检"],
    updatedAt: "2024-01-14",
    viewsCount: 8920,
    applicationsCount: 198,
    aiMatchScore: 85,
  },
  {
    id: "3",
    title: "AI算法工程师",
    company: "腾讯",
    companyLogo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop",
    companySize: "10000人以上",
    industry: "互联网",
    location: "深圳",
    salaryMin: 30000,
    salaryMax: 60000,
    experienceLevel: "3-5年",
    educationLevel: "硕士",
    workType: "全职",
    tags: ["机器学习", "NLP", "深度学习", "Python"],
    description: "负责大语言模型在业务场景的应用和优化，提升产品智能化水平。",
    requirements: [
      "硕士及以上学历，计算机、数学等相关专业",
      "3年以上机器学习/NLP相关工作经验",
      "熟悉Transformer、BERT、GPT等主流模型架构",
      "有大模型微调、Prompt Engineering经验优先",
      "扎实的算法基础和编程能力，精通Python",
    ],
    benefits: ["六险一金", "股票期权", "免费班车", "员工折扣", "培训发展"],
    updatedAt: "2024-01-15",
    viewsCount: 15420,
    applicationsCount: 412,
    urgent: true,
    aiMatchScore: 78,
  },
  {
    id: "4",
    title: "资深Java开发工程师",
    company: "美团",
    companyLogo: "https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=80&h=80&fit=crop",
    companySize: "10000人以上",
    industry: "本地生活",
    location: "上海",
    salaryMin: 22000,
    salaryMax: 45000,
    experienceLevel: "3-5年",
    educationLevel: "本科",
    workType: "全职",
    tags: ["Java", "微服务", "高并发", "Spring Cloud"],
    description: "负责外卖业务核心系统的设计与开发，支撑亿级订单量的高并发系统。",
    requirements: [
      "本科及以上学历，3年以上Java开发经验",
      "精通Java，熟悉Spring、Spring Boot、Spring Cloud",
      "有高并发、分布式系统设计经验",
      "熟悉MySQL、Redis、MQ等中间件",
    ],
    benefits: ["六险一金", "年终奖金", "餐补", "交通补贴", "年假"],
    updatedAt: "2024-01-13",
    viewsCount: 9870,
    applicationsCount: 267,
    aiMatchScore: 88,
  },
  {
    id: "5",
    title: "UI/UX设计师",
    company: "网易",
    companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&h=80&fit=crop",
    companySize: "5000-10000人",
    industry: "互联网",
    location: "杭州",
    salaryMin: 15000,
    salaryMax: 30000,
    experienceLevel: "1-3年",
    educationLevel: "本科",
    workType: "全职",
    tags: ["UI设计", "Figma", "交互设计", "用户研究"],
    description: "负责网易云音乐产品界面设计，打造极致的音乐体验。",
    requirements: [
      "本科及以上学历，设计相关专业",
      "1-3年UI/UX设计经验，有完整产品设计案例",
      "精通Figma、Sketch等设计工具",
      "对音乐、社交产品有热情者优先",
    ],
    benefits: ["六险一金", "年终奖金", "免费健身", "音乐会员", "下午茶"],
    updatedAt: "2024-01-12",
    viewsCount: 6540,
    applicationsCount: 189,
    aiMatchScore: 75,
  },
  {
    id: "6",
    title: "数据分析师",
    company: "京东",
    companyLogo: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=80&h=80&fit=crop",
    companySize: "10000人以上",
    industry: "电子商务",
    location: "北京",
    salaryMin: 18000,
    salaryMax: 35000,
    experienceLevel: "3-5年",
    educationLevel: "本科",
    workType: "全职",
    tags: ["数据分析", "SQL", "Python", "数据可视化"],
    description: "负责零售业务数据分析，为业务决策提供数据支持。",
    requirements: [
      "本科及以上学历，统计学、数学、计算机相关专业",
      "3年以上数据分析经验，有电商行业经验优先",
      "熟练使用SQL、Python进行数据处理和分析",
      "熟悉Tableau、PowerBI等可视化工具",
    ],
    benefits: ["六险一金", "员工折扣", "年终奖金", "带薪年假"],
    updatedAt: "2024-01-14",
    viewsCount: 5430,
    applicationsCount: 145,
  },
];

export default function JobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [showApplySuccess, setShowApplySuccess] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("match");
  const [filters, setFilters] = useState({
    location: "",
    salary: "",
    experience: "",
    education: "",
    workType: "",
  });

  const filteredJobs = useMemo(() => {
    let jobs = [...mockJobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (filters.location) {
      jobs = jobs.filter((j) => j.location === filters.location);
    }

    if (sortBy === "match") {
      jobs.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
    } else if (sortBy === "salary") {
      jobs.sort((a, b) => b.salaryMax - a.salaryMax);
    } else if (sortBy === "newest") {
      jobs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return jobs;
  }, [searchQuery, filters, sortBy]);

  const handleQuickApply = async (job: Job) => {
    setApplying(true);
    setSelectedJob(job);

    await new Promise((r) => setTimeout(r, 1500));

    setApplying(false);
    setShowApplySuccess(true);
    setTimeout(() => setShowApplySuccess(false), 3000);
  };

  const cities = ["北京", "上海", "杭州", "深圳", "广州", "成都", "南京", "武汉"];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="jobseeker" user={{ name: "张三", role: "JOB_SEEKER" }} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <h1 className="text-2xl font-bold mb-2">发现你的理想工作</h1>
          <p className="text-blue-100 mb-6">
            AI智能匹配，每日推荐精选职位，投递更快更准
          </p>
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索职位、公司或技能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {["前端开发", "产品经理", "算法工程师", "Java开发", "UI设计", "数据分析"].map(
              (tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm transition-colors"
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 animate-slide-up">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-5">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">工作城市</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">全部城市</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">薪资范围</label>
                  <select
                    value={filters.salary}
                    onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不限</option>
                    <option value="10k-20k">10K-20K</option>
                    <option value="20k-30k">20K-30K</option>
                    <option value="30k-50k">30K-50K</option>
                    <option value="50k+">50K以上</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">工作经验</label>
                  <select
                    value={filters.experience}
                    onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不限</option>
                    <option value="fresh">应届生</option>
                    <option value="1-3">1-3年</option>
                    <option value="3-5">3-5年</option>
                    <option value="5-10">5-10年</option>
                    <option value="10+">10年以上</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">学历要求</label>
                  <select
                    value={filters.education}
                    onChange={(e) => setFilters({ ...filters, education: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不限</option>
                    <option value="college">大专</option>
                    <option value="bachelor">本科</option>
                    <option value="master">硕士</option>
                    <option value="phd">博士</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">工作类型</label>
                  <select
                    value={filters.workType}
                    onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">不限</option>
                    <option value="fulltime">全职</option>
                    <option value="parttime">兼职</option>
                    <option value="intern">实习</option>
                    <option value="remote">远程</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      location: "",
                      salary: "",
                      experience: "",
                      education: "",
                      workType: "",
                    })
                  }
                >
                  重置筛选
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  应用筛选
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-slate-900">{filteredJobs.length}</span> 个职位
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">排序：</span>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {[
                { value: "match", label: "智能匹配" },
                { value: "newest", label: "最新发布" },
                { value: "salary", label: "薪资最高" },
              ].map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => setSortBy(sort.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md font-medium transition-colors",
                    sortBy === sort.value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  hover
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedJob?.id === job.id && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900 text-lg">
                                {job.title}
                              </h3>
                              {job.urgent && (
                                <Badge variant="destructive" size="sm" dot>
                                  急招
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-red-500">
                              {(job.salaryMin / 1000).toFixed(0)}-
                              {(job.salaryMax / 1000).toFixed(0)}K
                            </p>
                            {job.aiMatchScore && (
                              <Badge variant="success" size="sm" className="mt-1">
                                <Sparkles className="h-3 w-3 mr-1" />
                                匹配 {job.aiMatchScore}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job.experienceLevel}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {job.educationLevel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {job.workType}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{job.viewsCount} 浏览</span>
                            <span>{job.applicationsCount} 投递</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                            >
                              <Bookmark className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickApply(job);
                              }}
                              disabled={applying && selectedJob?.id === job.id}
                              loading={applying && selectedJob?.id === job.id}
                            >
                              一键投递
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-medium text-slate-900 mb-1">未找到匹配的职位</h3>
                  <p className="text-sm text-slate-500">试试调整筛选条件或搜索关键词</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {selectedJob ? (
              <Card className="sticky top-20">
                <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl">
                  <img
                    src={selectedJob.companyLogo}
                    alt={selectedJob.company}
                    className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl border-4 border-white object-cover shadow-lg"
                  />
                </div>
                <CardContent className="pt-12">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedJob.title}
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {selectedJob.company} · {selectedJob.companySize}
                      </p>
                    </div>
                    <Badge variant="gradient" size="lg">
                      {(selectedJob.salaryMin / 1000).toFixed(0)}-
                      {(selectedJob.salaryMax / 1000).toFixed(0)}K
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedJob.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {selectedJob.location}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {selectedJob.experienceLevel}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      {selectedJob.educationLevel}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {selectedJob.workType}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">职位描述</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedJob.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">任职要求</h3>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">公司福利</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((benefit) => (
                        <Badge key={benefit} variant="success" size="sm">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedJob.aiMatchScore && (
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-slate-900">AI匹配分析</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="4"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              fill="none"
                              stroke="url(#matchGradient)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${selectedJob.aiMatchScore * 1.76} 176`}
                            />
                            <defs>
                              <linearGradient
                                id="matchGradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-bold text-slate-900">
                            {selectedJob.aiMatchScore}%
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-600">
                            你的简历与该职位高度匹配，建议投递
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    size="lg"
                    variant="gradient"
                    fullWidth
                    loading={applying}
                    onClick={() => handleQuickApply(selectedJob)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    一键投递
                  </Button>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" fullWidth>
                      <Bookmark className="h-4 w-4 mr-2" />
                      收藏
                    </Button>
                    <Button variant="outline" size="sm" fullWidth>
                      <Share2 className="h-4 w-4 mr-2" />
                      分享
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-20">
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-medium text-slate-900 mb-1">选择职位查看详情</h3>
                  <p className="text-sm text-slate-500">点击左侧职位卡片查看完整信息</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {showApplySuccess && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <Card className="bg-emerald-500 text-white border-0 shadow-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">投递成功！</p>
                <p className="text-sm text-emerald-100">HR会尽快查看你的简历</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
