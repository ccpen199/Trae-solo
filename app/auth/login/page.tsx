"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
  role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = (searchParams.get("role") as string) || "jobseeker";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"jobseeker" | "employer">(
    roleFromUrl === "employer" ? "employer" : "jobseeker"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: activeTab === "employer" ? "EMPLOYER" : "JOB_SEEKER",
    },
  });

  React.useEffect(() => {
    setValue("role", activeTab === "employer" ? "EMPLOYER" : "JOB_SEEKER");
  }, [activeTab, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "登录失败");
      }

      if (data.role === "EMPLOYER") {
        router.push("/employer/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              智聘OS
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p className="mt-2 text-slate-600">登录你的账号，继续你的招聘之旅</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("jobseeker")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "jobseeker"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User className="h-4 w-4" />
                求职者
              </button>
              <button
                onClick={() => setActiveTab("employer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "employer"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Building2 className="h-4 w-4" />
                企业HR
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="密码"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register("password")}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  记住我
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  忘记密码？
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                variant="gradient"
                fullWidth
                loading={loading}
              >
                登 录
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                还没有账号？{" "}
                <Link
                  href={`/auth/register?role=${activeTab}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  立即注册
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-slate-500">其他登录方式</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <button className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600">微信</span>
                </button>
                <button className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600">支付宝</span>
                </button>
                <button className="flex items-center justify-center py-2.5 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600">手机</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500">
          登录即表示同意{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            服务条款
          </Link>{" "}
          和{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            隐私政策
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <div className="text-sm text-slate-500">加载中...</div>
        </div>
      }
    >
      <LoginPageContent />
    </React.Suspense>
  );
}
