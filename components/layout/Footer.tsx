import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  Github,
  Twitter,
  Linkedin,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Users,
} from "lucide-react";

export function Footer() {
  const footerLinks = {
    产品: [
      { label: "职位搜索", href: "/jobs" },
      { label: "AI简历解析", href: "/resume/ai" },
      { label: "视频面试", href: "/interviews" },
      { label: "直播招聘", href: "/live" },
      { label: "招聘会", href: "/job-fairs" },
    ],
    企业服务: [
      { label: "企业版", href: "/enterprise" },
      { label: "雇主品牌", href: "/employer-brand" },
      { label: "薪酬报告", href: "/salary-report" },
      { label: "招聘系统", href: "/ats" },
      { label: "价格方案", href: "/pricing" },
    ],
    帮助: [
      { label: "帮助中心", href: "/help" },
      { label: "新手指南", href: "/guide" },
      { label: "常见问题", href: "/faq" },
      { label: "联系客服", href: "/contact" },
      { label: "意见反馈", href: "/feedback" },
    ],
    关于: [
      { label: "关于我们", href: "/about" },
      { label: "加入我们", href: "/careers" },
      { label: "新闻动态", href: "/news" },
      { label: "合作伙伴", href: "/partners" },
      { label: "隐私政策", href: "/privacy" },
    ],
  };

  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                智聘OS
              </span>
            </Link>
            <p className="text-sm text-slate-600 mb-4 max-w-xs">
              融合直播、视频面试与雇主品牌可视化的新一代智能招聘操作系统，让每个人找到理想的工作。
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} 智聘OS. 保留所有权利.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>安全认证</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              <span>极速响应</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>千万用户</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
