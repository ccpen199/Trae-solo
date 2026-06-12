import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            智聘OS
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">找回密码</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          输入注册邮箱后，演示环境会显示重置流程入口。生产环境可在这里接入邮件验证码或企业单点登录。
        </p>

        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            邮箱
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="请输入注册邮箱"
            />
          </div>
          <button
            type="button"
            className="h-11 w-full rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:opacity-90"
          >
            发送重置指引
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" href="/auth/login">
            返回登录
          </Link>
        </div>
      </div>
    </main>
  );
}
