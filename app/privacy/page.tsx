import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">隐私政策</h1>
            <p className="mt-1 text-sm text-slate-500">智聘OS 演示环境隐私说明</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>本地演示环境仅使用项目内 SQLite 数据库和本地模拟接口，不会向外部招聘平台同步个人简历、职位投递或面试记录。</p>
          <p>账号、简历、面试和企业资料仅用于演示智能招聘流程。生产环境接入前应补充正式的数据保留、访问审计、导出删除和用户授权机制。</p>
          <p>如需清理演示数据，可在本地数据库中删除对应用户、简历、投递和面试记录。</p>
        </div>

        <div className="mt-8">
          <Link className="text-sm font-medium text-blue-600 hover:text-blue-700" href="/">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
