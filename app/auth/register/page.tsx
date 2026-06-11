"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const registerSchema = z
  .object({
    name: z.string().min(2, "姓名至少2个字符"),
    email: z.string().email("请输入有效的邮箱地址"),
    phone: z.string().optional(),
    password: z.string().min(6, "密码至少6位"),
    confirmPassword: z.string(),
    role: z.enum(["JOB_SEEKER", "EMPLOYER"]).default("JOB_SEEKER"),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = (searchParams.get("role") as string) || "jobseeker";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: activeTab === "employer" ? "EMPLOYER" : "JOB_SEEKER",
      companyName: "",
    },
  });

  React.useEffect(() => {
    setValue("role", activeTab === "employer" ? "EMPLOYER" : "JOB_SEEKER");
  }, [activeTab, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "注册失败");
      }

      if (data.role === "EMPLOYER") {
        router.push("/employer/onboarding");
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              智聘OS
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">创建新账号</h1>
          <p className="mt-2 text-slate-600">加入智聘，开启智能招聘新时代</p>
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
                我要求职
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
                我要招聘
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
              {activeTab === "employer" && (
                <Input
                  label="公司名称"
                  type="text"
                  placeholder="请输入公司名称"
                  leftIcon={<Building2 className="h-4 w-4" />}
                  error={errors.companyName?.message}
                  {...register("companyName")}
                />
              )}

              <Input
                label="姓名"
                type="text"
                placeholder={activeTab === "employer" ? "请输入HR姓名" : "请输入您的姓名"}
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="手机号"
                type="tel"
                placeholder="请输入手机号码（选填）"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                label="密码"
                type={showPassword ? "text" : "password"}
                placeholder="请设置密码（至少6位）"
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

              <Input
                label="确认密码"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="请再次输入密码"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                size="lg"
                variant="gradient"
                fullWidth
                loading={loading}
              >
                注 册
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                已有账号？{" "}
                <Link
                  href={`/auth/login?role=${activeTab}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500">
          注册即表示同意{" "}
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
