import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '宠趣 - 爱宠生活，从这里开始',
  description: '宠物用品商城、社区、领养、在线问诊一站式平台',
  keywords: ['宠物', '宠物用品', '猫粮', '狗粮', '宠物社区', '宠物领养'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
