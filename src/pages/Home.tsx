import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { mockAgencies, mockArtists, mockCastings } from '@/data/mockData';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@shared/types';

type DemoEntry = {
  id: string;
  role: UserRole;
  label: string;
  description: string;
  target: string;
  account: string;
  password: string;
  icon: React.ReactNode;
};

const demoEntries: DemoEntry[] = [
  {
    id: 'artist-profile',
    role: 'artist',
    label: '个人中心与档期',
    description: '直接进入艺人档案、我的资料与日程模块。',
    target: '/profile',
    account: 'artist@example.com',
    password: 'password123',
    icon: <UserRound className="w-5 h-5" />,
  },
  {
    id: 'agency-search',
    role: 'agency_admin',
    label: '搜索筛选与详情',
    description: '以经纪公司身份体验人才搜索、筛选和艺人详情。',
    target: '/search',
    account: 'admin@xingyao.com',
    password: 'password123',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'company-casting',
    role: 'company_hr',
    label: '通告详情与内容页',
    description: '进入通告中心并查看完整内容详情页。',
    target: '/castings/casting-1',
    account: 'hr@luxe.com',
    password: 'password123',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: 'admin-console',
    role: 'admin',
    label: '后台管理与日志',
    description: '进入后台视角，查看安全日志和管理相关页面。',
    target: '/security/logs',
    account: 'admin@talenthub.com',
    password: 'admin123',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

const stats = [
  { label: '艺人档案', value: mockArtists.length.toString().padStart(2, '0') },
  { label: '机构账号', value: mockAgencies.length.toString().padStart(2, '0') },
  { label: '通告内容', value: mockCastings.length.toString().padStart(2, '0') },
];

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isLoading, login } = useAuthStore();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const enterDemo = async (entry: DemoEntry) => {
    setActiveEntryId(entry.id);

    const success = await login({
      email: entry.account.includes('@') ? entry.account : '',
      phone: entry.account.includes('@') ? '' : entry.account,
      password: entry.password,
      role: entry.role,
    });

    if (success) {
      toast.success('已进入演示模式', `正在打开「${entry.label}」`);
      navigate(entry.target);
    } else {
      toast.error('演示入口打开失败', '请改用登录页中的测试账号继续体验');
    }

    setActiveEntryId(null);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <Badge variant="secondary" size="sm" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            本地可用体验入口
          </Badge>
          <div>
            <h2 className="text-2xl font-heading font-semibold text-white">无需卡在登录页</h2>
            <p className="mt-2 text-sm text-midnight-300">
              首页现在可以直接进入个人中心、搜索筛选、后台管理和详情内容页。
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {demoEntries.map((entry) => (
            <Card key={entry.id} variant="glass" className="border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                    {entry.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{entry.label}</h3>
                      <Badge variant="primary" size="sm">
                        {entry.role}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-midnight-300">{entry.description}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  loading={isLoading && activeEntryId === entry.id}
                  disabled={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => void enterDemo(entry)}
                >
                  一键进入
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((item) => (
            <Card key={item.label} variant="glass">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-heading font-semibold text-white">{item.value}</div>
                <div className="mt-1 text-xs text-midnight-400">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">首屏可验证业务内容</CardTitle>
            <CardDescription>
              覆盖搜索、分类、详情和我的相关模块，不再只有登录壳页面。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <UserRound className="w-4 h-4 text-rose-300" />
                推荐艺人
              </div>
              {mockArtists.slice(0, 2).map((artist) => (
                <div key={artist.id} className="rounded-xl border border-white/10 bg-midnight-900/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{artist.stageName}</span>
                    <Badge variant="secondary" size="sm">{artist.location}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-midnight-400">
                    {artist.skills.slice(0, 3).join(' / ')}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Calendar className="w-4 h-4 text-sapphire-300" />
                热门通告
              </div>
              {mockCastings.slice(0, 2).map((casting) => (
                <div key={casting.id} className="rounded-xl border border-white/10 bg-midnight-900/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{casting.title}</span>
                    <Badge variant="warning" size="sm">{casting.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-midnight-400">
                    {casting.location} · {casting.budgetMin} - {casting.budgetMax}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/login')}>
            登录页
          </Button>
          <Button type="button" onClick={() => navigate('/register')}>
            注册页
          </Button>
        </div>

        <p className="text-center text-xs text-midnight-500">
          也可以直接去 <Link to="/login" className="text-rose-400 hover:text-rose-300">登录页</Link> 使用测试账号。
        </p>
      </div>
    </AuthLayout>
  );
}
