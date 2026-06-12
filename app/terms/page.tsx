import Link from "next/link";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">服务条款</h1>
            <p className="mt-1 text-sm text-slate-500">智聘OS 本地演示条款</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>本项目用于展示职位发布、简历筛选、视频面试、直播招聘和招聘会管理等业务流程。</p>
          <p>演示账号与业务数据不代表真实招聘承诺，职位薪资、候选人资料和企业信息均可作为本地测试数据处理。</p>
          <p>在生产部署前，应补充真实身份认证、权限隔离、支付合规、消息通知和安全审计策略。</p>
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
