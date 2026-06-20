import React, { useMemo } from 'react';
import {
  Shield,
  Download,
  Trash2,
  Key,
  Users,
  FileText,
  Bell,
  AlertTriangle,
  ChevronRight,
  Lock,
  Eye,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import StatCard from '@/components/dashboard/StatCard';
import PrivacyScoreMeter from '@/components/security/PrivacyScoreMeter';
import ConsentCard, { ConsentData } from '@/components/security/ConsentCard';
import { useNavigate } from 'react-router-dom';

const generateAccessLogData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: format(date, 'MM/dd', { locale: zhCN }),
      views: Math.floor(Math.random() * 20) + 5,
      downloads: Math.floor(Math.random() * 5) + 1,
      exports: Math.floor(Math.random() * 3),
    });
  }
  return data;
};

const mockConsents: ConsentData[] = [
  {
    id: 'basic_profile',
    title: '基本资料使用',
    description: '允许平台使用您的基本资料信息用于匹配和推荐',
    category: 'basic',
    required: true,
    granted: true,
    grantedAt: new Date('2024-01-15'),
    canRevoke: false,
    details: [
      '用于艺人资料展示和搜索匹配',
      '用于试镜申请时的资料展示',
      '仅在您同意授权的范围内对第三方可见',
    ],
  },
  {
    id: 'marketing_emails',
    title: '营销邮件推送',
    description: '接收平台的活动推广、优惠信息和行业资讯',
    category: 'marketing',
    granted: true,
    grantedAt: new Date('2024-02-20'),
    expiresAt: new Date('2025-02-20'),
    details: [
      '每周精选试镜机会推送',
      '平台活动和优惠通知',
      '行业资讯和职业发展建议',
    ],
  },
  {
    id: 'analytics',
    title: '使用数据分析',
    description: '允许平台收集使用数据以改进产品体验',
    category: 'analytics',
    granted: false,
    details: [
      '匿名化的页面访问统计',
      '功能使用偏好分析',
      '错误日志收集用于修复问题',
    ],
  },
  {
    id: 'third_party_share',
    title: '第三方数据共享',
    description: '允许经过认证的合作伙伴在授权范围内访问您的资料',
    category: 'third_party',
    granted: true,
    grantedAt: new Date('2024-03-10'),
    details: [
      '仅对经过实名认证的经纪公司和品牌开放',
      '每次访问均有详细日志记录',
      '您可以随时在授权管理中撤销',
    ],
  },
];

const securityTips = [
  {
    id: '1',
    icon: <Key className="w-5 h-5" />,
    gradient: 'from-rose-500 to-rose-400',
    title: '定期更换密码',
    description: '建议每3个月更新一次密码，使用包含字母、数字和符号的强密码',
  },
  {
    id: '2',
    icon: <Lock className="w-5 h-5" />,
    gradient: 'from-sapphire-500 to-sapphire-400',
    title: '开启双因素认证',
    description: '启用短信或邮箱验证码，为账户增加额外的安全保护层',
  },
  {
    id: '3',
    icon: <Eye className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-emerald-400',
    title: '定期查看访问日志',
    description: '检查谁在什么时间访问了您的资料，及时发现异常活动',
  },
  {
    id: '4',
    icon: <AlertTriangle className="w-5 h-5" />,
    gradient: 'from-amber-500 to-amber-400',
    title: '谨慎授权第三方',
    description: '只授权给您信任的公司，并定期审查和清理不再需要的授权',
  },
];

const SecurityCenter: React.FC = () => {
  const navigate = useNavigate();
  const accessLogData = useMemo(() => generateAccessLogData(), []);

  const privacyScore = 72;
  const activeAuthorizations = 5;
  const suspiciousActivities = 0;

  const privacySuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (privacyScore < 80) suggestions.push('开启双因素认证以提高账户安全性');
    if (!mockConsents.find((c) => c.id === 'analytics')?.granted) {
      suggestions.push('可选择性启用数据分析以获得更好的个性化推荐');
    }
    suggestions.push('定期检查和清理不再需要的第三方授权');
    suggestions.push('每3个月更新一次账户密码');
    return suggestions.slice(0, 3);
  }, [privacyScore]);

  const handleConsentToggle = (consentId: string, granted: boolean) => {
    console.log(`Consent ${consentId} toggled to ${granted}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8 text-rose-500" />
                数据安全与隐私中心
              </h1>
              <p className="text-midnight-300">
                管理您的数据授权、查看访问记录、控制隐私设置
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => navigate('/security/access-log')}
            >
              查看完整审计日志
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              iconGradient="from-emerald-500 to-emerald-400"
              value={privacyScore}
              label="隐私安全评分"
              suffix="分"
              showCircular
              progress={privacyScore}
              progressColor="bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <StatCard
              icon={<Users className="w-5 h-5" />}
              iconGradient="from-sapphire-500 to-sapphire-400"
              value={activeAuthorizations}
              label="有效授权数"
              suffix="个"
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              iconGradient="from-purple-500 to-purple-400"
              value={accessLogData.reduce((sum, d) => sum + d.views + d.downloads + d.exports, 0)}
              label="近7天数据访问"
              suffix="次"
              trend={{ value: 12, isPositive: false }}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <StatCard
              icon={<AlertTriangle className="w-5 h-5" />}
              iconGradient={suspiciousActivities > 0 ? 'from-red-500 to-red-400' : 'from-emerald-500 to-emerald-400'}
              value={suspiciousActivities}
              label="可疑活动"
              suffix="项"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" />
                隐私安全评分
              </CardTitle>
              <CardDescription>综合评估您的账户安全和隐私保护状态</CardDescription>
            </CardHeader>
            <CardContent>
              <PrivacyScoreMeter
                score={privacyScore}
                size="lg"
                suggestions={privacySuggestions}
              />
            </CardContent>
          </Card>

          <Card
            variant="glass"
            className="lg:col-span-2 animate-fade-in-up"
            style={{ animationDelay: '500ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-sapphire-500" />
                  近7天数据访问趋势
                </CardTitle>
                <CardDescription>查看您的资料被访问、下载和导出的情况</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => navigate('/security/access-log')}
              >
                详细日志
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accessLogData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      name="查看"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ fill: '#f43f5e', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="downloads"
                      name="下载"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="exports"
                      name="导出"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-midnight-300">查看</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sapphire-500" />
                  <span className="text-sm text-midnight-300">下载</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-midnight-300">导出</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card
            variant="glass"
            className="lg:col-span-2 animate-fade-in-up"
            style={{ animationDelay: '600ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  数据同意状态
                </CardTitle>
                <CardDescription>管理您对各类数据使用的授权同意</CardDescription>
              </div>
              <Badge variant="success" size="sm">
                {mockConsents.filter((c) => c.granted).length}/{mockConsents.length} 已授权
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockConsents.map((consent) => (
                <ConsentCard
                  key={consent.id}
                  consent={consent}
                  onToggle={handleConsentToggle}
                />
              ))}
            </CardContent>
          </Card>

          <Card variant="glass" className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                快捷操作
              </CardTitle>
              <CardDescription>常用的数据安全管理功能</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => navigate('/security/export-delete')}
              >
                导出我的数据
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                leftIcon={<Users className="w-4 h-4" />}
                onClick={() => navigate('/security/authorizations')}
              >
                管理数据授权
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                leftIcon={<Key className="w-4 h-4" />}
              >
                修改账户密码
              </Button>
              <Button
                variant="danger"
                className="w-full justify-start"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => navigate('/security/export-delete')}
              >
                删除我的账户
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            安全提示
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {securityTips.map((tip, index) => (
              <Card
                key={tip.id}
                variant="glass"
                hoverable
                className="animate-fade-in-up"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                <CardContent>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tip.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}
                  >
                    {tip.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{tip.title}</h3>
                  <p className="text-sm text-midnight-400">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;
