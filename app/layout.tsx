import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智聘OS - 智能招聘操作系统",
  description:
    "融合直播、视频面试与雇主品牌可视化的新一代智能招聘平台",
  keywords: ["招聘", "直播招聘", "视频面试", "AI简历", "雇主品牌"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
