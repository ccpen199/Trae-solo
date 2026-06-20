import React, { useState } from 'react';
import * as Switch from '@radix-ui/react-switch';
import {
  User,
  Bell,
  Palette,
  Shield,
  Lock,
  Camera,
  Mail,
  Phone,
  Smartphone,
  Eye,
  EyeOff,
  Search,
  Globe,
  Key,
  Smartphone as SmartphoneIcon,
  Github,
  Chrome,
  Check,
  ChevronRight,
  Save,
  Upload,
  Sun,
  Moon,
  Type,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/useAuthStore';

type AccentColor = 'rose' | 'sapphire' | 'emerald' | 'amber' | 'purple' | 'cyan';
type FontSize = 'small' | 'medium' | 'large';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const Settings: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, updateProfile, isLoading } = useAuthStore();

  const [name, setName] = useState(user?.email?.split('@')[0] || '用户');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [accentColor, setAccentColor] = useState<AccentColor>('rose');
  const [fontSize, setFontSize] = useState<FontSize>('medium');

  const [profileVisible, setProfileVisible] = useState(true);
  const [searchIndexing, setSearchIndexing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'casting_matches',
      label: '试镜匹配通知',
      description: '当有符合你条件的新试镜时通知',
      email: true,
      push: true,
      sms: false,
    },
    {
      id: 'application_updates',
      label: '申请状态更新',
      description: '当你的试镜申请状态改变时通知',
      email: true,
      push: true,
      sms: true,
    },
    {
      id: 'profile_views',
      label: '资料被查看',
      description: '当有人查看你的个人资料时通知',
      email: false,
      push: true,
      sms: false,
    },
    {
      id: 'messages',
      label: '新消息',
      description: '当你收到新私信时通知',
      email: true,
      push: true,
      sms: false,
    },
    {
      id: 'security_alerts',
      label: '安全提醒',
      description: '账户安全相关的重要通知',
      email: true,
      push: true,
      sms: true,
    },
    {
      id: 'marketing',
      label: '营销与推广',
      description: '平台活动、优惠信息和行业资讯',
      email: false,
      push: false,
      sms: false,
    },
  ]);

  const accentColors: { value: AccentColor; bg: string; label: string }[] = [
    { value: 'rose', bg: 'bg-rose-500', label: '玫瑰红' },
    { value: 'sapphire', bg: 'bg-sapphire-500', label: '宝石蓝' },
    { value: 'emerald', bg: 'bg-emerald-500', label: '翡翠绿' },
    { value: 'amber', bg: 'bg-amber-500', label: '琥珀金' },
    { value: 'purple', bg: 'bg-purple-500', label: '紫水晶' },
    { value: 'cyan', bg: 'bg-cyan-500', label: '青碧色' },
  ];

  const fontSizes: { value: FontSize; label: string; sizeClass: string }[] = [
    { value: 'small', label: '小', sizeClass: 'text-sm' },
    { value: 'medium', label: '中', sizeClass: 'text-base' },
    { value: 'large', label: '大', sizeClass: 'text-lg' },
  ];

  const toggleNotification = (id: string, channel: 'email' | 'push' | 'sms') => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, [channel]: !n[channel] } : n
      )
    );
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    await updateProfile({ email, phone });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const SwitchRow: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ label, description, checked, onCheckedChange, disabled }) => (
    <div className="flex items-center justify-between py-4 border-b border-midnight-700/50 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-midnight-400 mt-0.5">{description}</p>}
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
          checked ? 'bg-gradient-primary' : 'bg-midnight-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Switch.Thumb
          className={cn(
            'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </Switch.Root>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in-down">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-500" />
            账户设置
          </h1>
          <p className="text-midnight-300">
            管理你的个人资料、通知、外观和安全设置
          </p>
        </div>

        <Tabs defaultValue="profile" className="animate-fade-in-up">
          <TabsList className="grid grid-cols-5 w-full mb-8">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">个人资料</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">通知</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">外观</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">隐私</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">账户</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="animate-fade-in">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-rose-500" />
                  个人资料设置
                </CardTitle>
                <CardDescription>更新你的基本信息和头像</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center overflow-hidden shadow-lg">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">头像</h3>
                    <p className="text-sm text-midnight-400 mb-2">
                      上传一张清晰的头像照片，建议尺寸 400x400 像素
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        上传新头像
                      </Button>
                      {avatarUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAvatarUrl(null)}
                        >
                          移除
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入你的姓名"
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="邮箱"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                  <Input
                    label="手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号码"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-midnight-700/50 pt-6">
                <Button
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveProfile}
                  loading={isLoading}
                >
                  保存更改
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="animate-fade-in">
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-500" />
                  通知设置
                </CardTitle>
                <CardDescription>选择你希望接收通知的方式和类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-midnight-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-midnight-300">通知类型</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-midnight-300">
                          <div className="flex items-center justify-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            邮件
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-midnight-300">
                          <div className="flex items-center justify-center gap-1.5">
                            <Smartphone className="w-4 h-4" />
                            推送
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-midnight-300">
                          <div className="flex items-center justify-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            短信
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((notification) => (
                        <tr
                          key={notification.id}
                          className="border-b border-midnight-700/50 last:border-0"
                        >
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-white">{notification.label}</p>
                            <p className="text-xs text-midnight-400 mt-0.5">{notification.description}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center">
                              <Switch.Root
                                checked={notification.email}
                                onCheckedChange={() => toggleNotification(notification.id, 'email')}
                                className={cn(
                                  'relative w-11 h-6 rounded-full transition-all duration-300',
                                  notification.email ? 'bg-gradient-primary' : 'bg-midnight-700'
                                )}
                              >
                                <Switch.Thumb
                                  className={cn(
                                    'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300',
                                    notification.email ? 'translate-x-5' : 'translate-x-0.5'
                                  )}
                                />
                              </Switch.Root>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center">
                              <Switch.Root
                                checked={notification.push}
                                onCheckedChange={() => toggleNotification(notification.id, 'push')}
                                className={cn(
                                  'relative w-11 h-6 rounded-full transition-all duration-300',
                                  notification.push ? 'bg-gradient-primary' : 'bg-midnight-700'
                                )}
                              >
                                <Switch.Thumb
                                  className={cn(
                                    'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300',
                                    notification.push ? 'translate-x-5' : 'translate-x-0.5'
                                  )}
                                />
                              </Switch.Root>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center">
                              <Switch.Root
                                checked={notification.sms}
                                onCheckedChange={() => toggleNotification(notification.id, 'sms')}
                                disabled={notification.id === 'marketing'}
                                className={cn(
                                  'relative w-11 h-6 rounded-full transition-all duration-300',
                                  notification.sms ? 'bg-gradient-primary' : 'bg-midnight-700',
                                  notification.id === 'marketing' && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                <Switch.Thumb
                                  className={cn(
                                    'block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300',
                                    notification.sms ? 'translate-x-5' : 'translate-x-0.5'
                                  )}
                                />
                              </Switch.Root>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-midnight-500">
                  注：安全提醒类通知将始终通过邮件和推送发送，无法关闭
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="animate-fade-in">
            <div className="space-y-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-rose-500" />
                    主题设置
                  </CardTitle>
                  <CardDescription>选择你喜欢的界面主题</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => !isDark && toggleTheme()}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-300 text-left',
                        !isDark
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
                      )}
                    >
                      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 mb-3 flex items-center justify-center">
                        <Sun className="w-8 h-8 text-amber-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">浅色模式</span>
                        {!isDark && <Check className="w-5 h-5 text-rose-500" />}
                      </div>
                    </button>
                    <button
                      onClick={() => isDark && toggleTheme()}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-300 text-left',
                        isDark
                          ? 'border-rose-500 bg-rose-500/10'
                          : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
                      )}
                    >
                      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-midnight-900 to-midnight-800 mb-3 flex items-center justify-center">
                        <Moon className="w-8 h-8 text-sapphire-400" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">深色模式</span>
                        {isDark && <Check className="w-5 h-5 text-rose-500" />}
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-sapphire-500" />
                    强调色
                  </CardTitle>
                  <CardDescription>选择界面中使用的强调颜色</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300',
                          accentColor === color.value
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
                        )}
                      >
                        <span className={cn('w-5 h-5 rounded-full', color.bg)} />
                        <span className="text-sm font-medium text-white">{color.label}</span>
                        {accentColor === color.value && <Check className="w-4 h-4 text-rose-500" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-emerald-500" />
                    字体大小
                  </CardTitle>
                  <CardDescription>调整界面文字的显示大小</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {fontSizes.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setFontSize(size.value)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all duration-300 text-center',
                          fontSize === size.value
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-midnight-700 bg-midnight-800/50 hover:border-midnight-600'
                        )}
                      >
                        <p className={cn('text-white font-medium mb-1', size.sizeClass)}>示例文字 Aa</p>
                        <p className="text-xs text-midnight-400">{size.label}</p>
                        {fontSize === size.value && (
                          <Check className="w-4 h-4 text-rose-500 mx-auto mt-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="animate-fade-in">
            <div className="space-y-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-500" />
                    隐私设置
                  </CardTitle>
                  <CardDescription>控制你的个人资料可见性和数据隐私</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-midnight-700/50">
                  <SwitchRow
                    label="个人资料公开可见"
                    description="允许其他用户在平台上搜索和查看你的基本资料"
                    checked={profileVisible}
                    onCheckedChange={setProfileVisible}
                  />
                  <SwitchRow
                    label="允许搜索引擎收录"
                    description="允许搜索引擎（如百度、谷歌）索引你的公开资料页面"
                    checked={searchIndexing}
                    onCheckedChange={setSearchIndexing}
                  />
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-sapphire-500" />
                    资料可见范围
                  </CardTitle>
                  <CardDescription>选择哪些信息对其他用户可见</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-midnight-700/50">
                  <SwitchRow
                    label="显示真实姓名"
                    description="在公开资料中显示你的真实姓名，否则只显示艺名"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                  <SwitchRow
                    label="显示联系方式"
                    description="允许经过认证的经纪公司和品牌查看你的联系方式"
                    checked={false}
                    onCheckedChange={() => {}}
                  />
                  <SwitchRow
                    label="显示位置信息"
                    description="在资料中显示你所在的城市"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                  <SwitchRow
                    label="在线状态可见"
                    description="让其他用户知道你是否在线"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-emerald-500" />
                    搜索发现
                  </CardTitle>
                  <CardDescription>控制其他人如何在平台上找到你</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-midnight-700/50">
                  <SwitchRow
                    label="允许通过手机号搜索"
                    description="其他用户可以通过手机号找到你的账户"
                    checked={false}
                    onCheckedChange={() => {}}
                  />
                  <SwitchRow
                    label="允许通过邮箱搜索"
                    description="其他用户可以通过邮箱地址找到你的账户"
                    checked={false}
                    onCheckedChange={() => {}}
                  />
                  <SwitchRow
                    label="出现在推荐列表中"
                    description="允许平台在「推荐艺人」列表中展示你的资料"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account" className="animate-fade-in">
            <div className="space-y-6">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-rose-500" />
                    修改密码
                  </CardTitle>
                  <CardDescription>定期更换密码以保护账户安全</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      label="当前密码"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="请输入当前密码"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-midnight-400 hover:text-white transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                    />
                  </div>
                  <div className="relative">
                    <Input
                      label="新密码"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="请输入新密码"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-midnight-400 hover:text-white transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                    />
                  </div>
                  <div className="relative">
                    <Input
                      label="确认新密码"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入新密码"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-midnight-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end border-t border-midnight-700/50 pt-6">
                  <Button leftIcon={<Save className="w-4 h-4" />} onClick={handleChangePassword}>
                    更新密码
                  </Button>
                </CardFooter>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SmartphoneIcon className="w-5 h-5 text-sapphire-500" />
                    双因素认证
                  </CardTitle>
                  <CardDescription>为账户增加额外的安全保护层</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-sapphire-500/20 flex items-center justify-center">
                        <SmartphoneIcon className="w-6 h-6 text-sapphire-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">短信验证码</p>
                          {twoFactorEnabled && (
                            <Badge variant="success" size="sm" dot>
                              已启用
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-midnight-400 mt-0.5">
                          每次登录时需要输入手机收到的验证码
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={twoFactorEnabled ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    >
                      {twoFactorEnabled ? '关闭' : '开启'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    关联账户
                  </CardTitle>
                  <CardDescription>使用第三方账户快速登录</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Google', icon: <Chrome className="w-5 h-5" />, color: 'text-red-400', connected: true },
                    { name: 'GitHub', icon: <Github className="w-5 h-5" />, color: 'text-white', connected: false },
                  ].map((account) => (
                    <div
                      key={account.name}
                      className="flex items-center justify-between p-4 rounded-xl bg-midnight-800/50 border border-midnight-700/50 hover:border-midnight-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-xl bg-midnight-700/50 flex items-center justify-center', account.color)}>
                          {account.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">{account.name}</p>
                            {account.connected && (
                              <Badge variant="success" size="sm" dot>
                                已关联
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-midnight-400 mt-0.5">
                            {account.connected ? '可以使用此账户登录' : '点击关联此账户'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={account.connected ? 'ghost' : 'outline'}
                        size="sm"
                        rightIcon={!account.connected && <ChevronRight className="w-4 h-4" />}
                      >
                        {account.connected ? '解除关联' : '关联'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
