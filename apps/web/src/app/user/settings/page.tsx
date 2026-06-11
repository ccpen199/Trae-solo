'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Lock,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  Moon,
  Globe,
  Trash2,
} from 'lucide-react';

const settingSections = [
  {
    title: '账号设置',
    items: [
      { icon: User, label: '个人信息', href: '#', value: '' },
      { icon: Phone, label: '手机号', href: '#', value: '138****8888' },
      { icon: Mail, label: '邮箱', href: '#', value: '未绑定' },
      { icon: Lock, label: '修改密码', href: '#', value: '' },
    ],
  },
  {
    title: '通用设置',
    items: [
      { icon: Bell, label: '通知设置', href: '#', value: '' },
      { icon: Moon, label: '深色模式', href: '#', value: '跟随系统', toggle: true },
      { icon: Globe, label: '语言', href: '#', value: '简体中文' },
    ],
  },
  {
    title: '其他',
    items: [
      { icon: Shield, label: '隐私政策', href: '#' },
      { icon: HelpCircle, label: '帮助与反馈', href: '#' },
      { icon: Trash2, label: '清除缓存', href: '#', value: '12.5MB' },
    ],
  },
];

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/user" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">设置</h1>
        </div>

        <div className="space-y-6">
          {settingSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{section.title}</h2>
              <div className="rounded-xl border bg-card overflow-hidden">
                {section.items.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      i < section.items.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm text-foreground">{item.label}</span>
                    {item.toggle ? (
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          darkMode ? 'bg-pet-orange' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <>
                        {item.value && (
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4">
            <button className="w-full rounded-xl border border-destructive/30 bg-card py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-4">
            Pet World v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
