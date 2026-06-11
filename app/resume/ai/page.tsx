"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  File,
  FileUp,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { parseResumeText, type ResumeParseResult } from "@/lib/ai";
import { cn } from "@/lib/utils";

export default function AIResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "parsing" | "result" | "editing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ResumeParseResult | null>(null);
  const [parseProgress, setParseProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basic");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const validateFile = (f: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const validExtensions = [".pdf", ".doc", ".docx", ".txt"];
    const hasValidType = validTypes.includes(f.type);
    const hasValidExt = validExtensions.some((ext) => f.name.toLowerCase().endsWith(ext));
    return hasValidType || hasValidExt;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const simulateParsing = async () => {
    if (!file) return;

    setStep("parsing");
    setParseProgress(0);

    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string || sampleResumeText;

      for (let i = 0; i <= 100; i += Math.random() * 15 + 5) {
        setParseProgress(Math.min(100, i));
        await new Promise((r) => setTimeout(r, 200));
      }

      const result = parseResumeText(text);
      setParseResult(result);
      setParseProgress(100);
      setStep("result");
    };

    if (file.type === "text/plain") {
      reader.readAsText(file);
    } else {
      setTimeout(() => {
        const result = parseResumeText(sampleResumeText);
        setParseResult(result);
        setParseProgress(100);
        setStep("result");
      }, 2500);
    }
  };

  const handleSave = async () => {
    if (!parseResult) return;
    setSaving(true);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: parseResult }),
      });

      if (res.ok) {
        router.push("/resume");
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "basic", label: "基本信息", icon: <FileText className="h-4 w-4" /> },
    { id: "education", label: "教育背景", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "work", label: "工作经历", icon: <Briefcase className="h-4 w-4" /> },
    { id: "skills", label: "技能特长", icon: <Code2 className="h-4 w-4" /> },
    { id: "certificates", label: "证书资质", icon: <Award className="h-4 w-4" /> },
    { id: "projects", label: "项目经验", icon: <File className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="jobseeker" user={{ name: "张三", role: "JOB_SEEKER" }} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Badge variant="gradient" size="lg" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> AI智能解析
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900">AI简历解析</h1>
          <p className="mt-2 text-slate-600">上传简历，AI自动提取信息，一键生成完整简历</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            {[
              { step: "upload", label: "上传简历", icon: <Upload className="h-4 w-4" /> },
              { step: "parsing", label: "AI解析", icon: <Sparkles className="h-4 w-4" /> },
              { step: "result", label: "确认保存", icon: <CheckCircle2 className="h-4 w-4" /> },
            ].map((s, index) => (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      step === s.step
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : ["upload", "parsing", "result"].indexOf(step) >
                          ["upload", "parsing", "result"].indexOf(s.step)
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {s.icon}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      step === s.step ? "text-blue-600" : "text-slate-500"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      "w-20 h-0.5 mx-2 mb-6",
                      ["upload", "parsing", "result"].indexOf(step) > index
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === "upload" && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                      <FileUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="font-medium text-slate-900 mb-1">{file.name}</p>
                    <p className="text-sm text-slate-500 mb-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" /> 重新选择
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-900 mb-1">
                      拖拽文件到这里，或点击上传
                    </p>
                    <p className="text-sm text-slate-500">
                      支持 PDF、Word、TXT 格式，文件大小不超过 10MB
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">AI解析提示</p>
                  <p className="text-blue-600 mt-0.5">
                    建议上传 PDF 格式简历，解析准确率更高。AI 会自动提取教育背景、工作经历、技能证书等信息。
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setParseResult(parseResumeText(sampleResumeText));
                    setStep("result");
                  }}
                >
                  使用示例预览
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  fullWidth
                  disabled={!file}
                  onClick={simulateParsing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  开始智能解析
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "parsing" && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <svg
                  className="absolute inset-0 -rotate-90"
                  viewBox="0 0 80 80"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${parseProgress * 2.26} 226`}
                    className="transition-all duration-300"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                AI正在解析您的简历...
              </h3>
              <p className="text-slate-500 mb-6">
                已完成 {Math.round(parseProgress)}%，正在提取关键信息
              </p>

              <div className="space-y-3 max-w-sm mx-auto text-left">
                {[
                  { label: "解析基本信息", done: parseProgress >= 20 },
                  { label: "提取教育背景", done: parseProgress >= 40 },
                  { label: "分析工作经历", done: parseProgress >= 60 },
                  { label: "识别技能证书", done: parseProgress >= 80 },
                  { label: "生成简历报告", done: parseProgress >= 100 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        item.done ? "text-slate-700" : "text-slate-500"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === "result" && parseResult && (
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                          activeSection === section.id
                            ? "bg-blue-50 text-blue-600"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {section.icon}
                        {section.label}
                      </button>
                    ))}
                  </nav>

                  <div className="mt-6 pt-6 border-t space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">解析置信度</span>
                      <Badge
                        variant={
                          parseResult.confidence >= 80
                            ? "success"
                            : parseResult.confidence >= 60
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {parseResult.confidence}%
                      </Badge>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          parseResult.confidence >= 80
                            ? "bg-emerald-500"
                            : parseResult.confidence >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${parseResult.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Button
                      variant="gradient"
                      size="lg"
                      fullWidth
                      loading={saving}
                      onClick={handleSave}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      确认保存
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      fullWidth
                      onClick={() => setStep("upload")}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重新上传
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">基本信息</CardTitle>
                      <CardDescription>AI自动提取的个人信息</CardDescription>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> 已识别
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-slate-500">姓名</label>
                      <p className="mt-1 font-medium text-slate-900">
                        {parseResult.fullName || "未识别"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">邮箱</label>
                      <p className="mt-1 text-slate-900">
                        {parseResult.email || "未识别"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">手机号</label>
                      <p className="mt-1 text-slate-900">
                        {parseResult.phone || "未识别"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">所在城市</label>
                      <p className="mt-1 text-slate-900">
                        {parseResult.location || "未识别"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500">工作年限</label>
                      <p className="mt-1 text-slate-900">
                        {parseResult.yearsExperience ? `${parseResult.yearsExperience}年` : "未识别"}
                      </p>
                    </div>
                  </div>
                  {parseResult.summary && (
                    <div className="mt-4">
                      <label className="text-xs font-medium text-slate-500">个人简介</label>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {parseResult.summary}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">教育背景</CardTitle>
                      <CardDescription>
                        识别到 {parseResult.educations.length} 段教育经历
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={parseResult.educations.length > 0 ? "success" : "warning"}
                    size="sm"
                  >
                    {parseResult.educations.length > 0 ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> 已识别
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" /> 待补充
                      </>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {parseResult.educations.length > 0 ? (
                    <div className="space-y-4">
                      {parseResult.educations.map((edu, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900">
                                {edu.school || "未知学校"}
                              </h4>
                              <p className="text-sm text-slate-600 mt-0.5">
                                {edu.degree} {edu.major}
                              </p>
                            </div>
                            <span className="text-sm text-slate-500">
                              {edu.startDate?.slice(0, 7)} -{" "}
                              {edu.endDate?.slice(0, 7) || "至今"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <GraduationCap className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">未识别到教育背景</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">工作经历</CardTitle>
                      <CardDescription>
                        识别到 {parseResult.workExperiences.length} 段工作经历
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={parseResult.workExperiences.length > 0 ? "success" : "warning"}
                    size="sm"
                  >
                    {parseResult.workExperiences.length > 0 ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> 已识别
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" /> 待补充
                      </>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {parseResult.workExperiences.length > 0 ? (
                    <div className="space-y-4">
                      {parseResult.workExperiences.slice(0, 3).map((exp, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-slate-900">{exp.company}</h4>
                              <p className="text-sm text-blue-600 font-medium">{exp.position}</p>
                            </div>
                            <span className="text-sm text-slate-500">
                              {exp.startDate?.slice(0, 7)} -{" "}
                              {exp.isCurrent ? "至今" : exp.endDate?.slice(0, 7)}
                            </span>
                          </div>
                          {exp.achievements && exp.achievements.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {exp.achievements.slice(0, 3).map((ach, i) => (
                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{ach}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {exp.skillsUsed.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" size="sm">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Briefcase className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">未识别到工作经历</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Code2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">技能特长</CardTitle>
                      <CardDescription>
                        识别到 {parseResult.skills.length} 项技能
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={parseResult.skills.length > 0 ? "success" : "warning"}
                    size="sm"
                  >
                    {parseResult.skills.length > 0 ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> 已识别
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" /> 待补充
                      </>
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {parseResult.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parseResult.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" size="lg">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Code2 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">未识别到技能</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">证书资质</CardTitle>
                      <CardDescription>
                        识别到 {parseResult.certificates.length} 个证书
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={parseResult.certificates.length > 0 ? "success" : "secondary"}
                    size="sm"
                  >
                    {parseResult.certificates.length > 0 ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> 已识别
                      </>
                    ) : (
                      "待补充"
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {parseResult.certificates.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {parseResult.certificates.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200"
                        >
                          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Award className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{cert.name}</p>
                            {cert.issuer && (
                              <p className="text-xs text-slate-500">{cert.issuer}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Award className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">未识别到证书</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const sampleResumeText = `
张明
高级前端工程师

联系方式
电话：13812345678
邮箱：zhangming@example.com
城市：北京市

个人简介
5年互联网大厂前端开发经验，精通React、Vue、TypeScript等主流技术栈。
主导过多个大型项目的前端架构设计和团队管理，具有丰富的性能优化和工程化实践经验。

工作经历
字节跳动 高级前端工程师  2021.03 - 至今
- 负责抖音电商直播业务前端架构设计与开发，支持千万级日活用户
- 主导前端性能优化项目，页面首屏加载时间从3.2s降低到1.5s，提升53%
- 搭建微前端架构，实现多业务线独立部署和协同开发，提升团队效率30%
- 带领5人小组完成多个重点项目交付，获得年度最佳团队奖

阿里巴巴 前端开发工程师  2019.07 - 2021.02
- 参与淘宝商家后台系统开发，负责订单管理、商品管理等核心模块
- 使用React + TypeScript重构遗留代码，代码可维护性大幅提升
- 搭建前端监控体系，线上问题发现率提升80%，平均修复时间缩短50%
- 参与集团前端技术分享，累计发表技术文章10+篇

教育背景
北京大学 计算机科学与技术 本科  2015.09 - 2019.06
- GPA: 3.8/4.0，专业排名前10%
- 获得国家奖学金、三好学生等荣誉
- 主修课程：数据结构、算法设计、操作系统、计算机网络、软件工程

技能证书
- PMP项目管理专业人士资格认证（2023）
- AWS Certified Solutions Architect（2022）
- 全国计算机等级考试三级 - 数据库技术

项目经验
直播带货平台重构
- 角色：前端技术负责人
- 时间：2022.06 - 2023.01
- 描述：负责抖音电商直播带货平台的前端架构重构
- 技术栈：React、TypeScript、WebRTC、Canvas、Webpack
- 成果：直播间打开速度提升60%，同时在线观看人数突破200万

商家数据中台
- 角色：核心开发
- 时间：2020.03 - 2020.12
- 描述：搭建商家数据可视化分析平台
- 技术栈：Vue3、ECharts、Node.js、MySQL
- 成果：支持100+数据指标可视化，日活商家用户10万+

技能清单
前端：JavaScript, TypeScript, React, Vue, Next.js, Nuxt.js, TailwindCSS, Sass, Less
工程化：Webpack, Vite, Rollup, Jest, Cypress, ESLint, Babel
后端：Node.js, Express, Koa, MySQL, MongoDB, Redis
其他：Docker, Kubernetes, AWS, 微服务, Git, 敏捷开发
`;
