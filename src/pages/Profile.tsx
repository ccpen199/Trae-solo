import { useState, useMemo, useEffect } from 'react';
import {
  User,
  Mail,
  Pencil,
  Heart,
  HeartOff,
  Languages,
  Calendar,
  RefreshCw,
  Briefcase,
  Bell,
  Mail as MailIcon,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Settings,
  BookOpen,
  FileText,
  X,
  LogIn,
  Shield,
  Building2,
  Users,
  FileCheck,
  FileSignature,
  Building,
  Megaphone,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Palette,
  Image as ImageIcon,
  Handshake,
  UserPlus,
  Plane,
  Stethoscope,
  Scale,
  MapPin,
  UserCog,
  ClipboardList,
  CheckCircle2,
  Clock,
  DollarSign,
  BookMarked,
  Send,
  Radio,
  MessageCircle,
  Smartphone,
  Check,
  AlertCircle,
  LogOut,
  Award,
  BadgeCheck,
} from 'lucide-react';
import { useAppStore, ROLE_LABELS, DEMO_ACCOUNTS } from '@/store';
import { cn } from '@/lib/utils';
import { mockProjects, mockNews } from '@/data/mock';
import BilingualText from '@/components/BilingualText';
import type { ProjectCategory, TranslationHistoryItem, UserRole } from '@/types';

type ProfileTab = 'dashboard' | 'history' | 'subscription';
type DashboardKey = 'government' | 'culture' | 'public' | 'translator';

type NewsletterFreq = 'daily' | 'weekly' | 'off';
type NotifyMethod = 'inapp' | 'email' | 'both';

const categoryLabels: Record<ProjectCategory | 'general', { zh: string; it: string; className: string }> = {
  economic: { zh: '经贸', it: 'Economico', className: 'tag-cn' },
  education: { zh: '教育', it: 'Educazione', className: 'tag-it' },
  tourism: { zh: '文旅', it: 'Turismo', className: 'tag-gold' },
  technology: { zh: '科技', it: 'Tecnologia', className: 'tag-cn' },
  general: { zh: '综合', it: 'Generale', className: 'tag-gold' },
};

const topicOptions: { key: ProjectCategory | 'general'; zh: string; it: string }[] = [
  { key: 'economic', zh: '经贸', it: 'Economico' },
  { key: 'education', zh: '教育', it: 'Educazione' },
  { key: 'tourism', zh: '文旅', it: 'Turismo' },
  { key: 'technology', zh: '科技', it: 'Tecnologia' },
  { key: 'general', zh: '综合', it: 'Generale' },
];

const freqOptions: { key: NewsletterFreq; zh: string; it: string; descZh: string; descIt: string }[] = [
  { key: 'daily', zh: '每日', it: 'Quotidiana', descZh: '每天推送精选资讯', descIt: 'Notizie selezionate ogni giorno' },
  { key: 'weekly', zh: '每周', it: 'Settimanale', descZh: '每周汇总深度内容', descIt: 'Riepilogo settimanale di contenuti approfonditi' },
  { key: 'off', zh: '关闭', it: 'Disattivata', descZh: '不接收简报推送', descIt: 'Non ricevere la newsletter' },
];

const notifyOptions: { key: NotifyMethod; zh: string; it: string; icon: typeof Bell }[] = [
  { key: 'inapp', zh: '站内通知', it: 'Notifiche in-app', icon: Bell },
  { key: 'email', zh: '邮件通知', it: 'Email', icon: MailIcon },
  { key: 'both', zh: '两者都接收', it: 'Entrambe', icon: MessageSquare },
];

const channelOptions: {
  key: 'email' | 'wechat' | 'telegram' | 'push';
  zh: string;
  it: string;
  icon: typeof Mail;
  descZh: string;
  descIt: string;
}[] = [
  { key: 'email', zh: '邮件推送', it: 'Push Email', icon: Mail, descZh: '通过邮箱接收通知', descIt: 'Ricevi notifiche via email' },
  { key: 'wechat', zh: '微信通知', it: 'WeChat', icon: MessageCircle, descZh: '绑定微信公众号接收', descIt: 'Ricevi via account ufficiale WeChat' },
  { key: 'telegram', zh: 'Telegram', it: 'Telegram', icon: Send, descZh: '通过 Telegram 频道推送', descIt: 'Push tramite canale Telegram' },
  { key: 'push', zh: 'APP推送', it: 'Notifiche App', icon: Smartphone, descZh: '移动应用实时推送', descIt: 'Push in tempo reale sull\'app mobile' },
];

const sceneLabels: Record<string, { zh: string; it: string }> = {
  visa: { zh: '签证', it: 'Visto' },
  medical: { zh: '医疗', it: 'Medico' },
  legal: { zh: '法律', it: 'Legale' },
  general: { zh: '通用', it: 'Generale' },
  education: { zh: '教育', it: 'Educazione' },
};

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  messageZh: string;
  messageIt: string;
}

function showToastFn(
  setToast: React.Dispatch<React.SetStateAction<ToastState>>,
  toast: ToastState,
  type: ToastState['type'],
  messageZh: string,
  messageIt: string
) {
  setToast({ show: true, type, messageZh, messageIt });
  setTimeout(() => setToast({ ...toast, show: false }), 3000);
}

export default function Profile() {
  const {
    lang,
    user,
    favorites,
    toggleFavorite,
    setUser,
    setLoginModalOpen,
    translateHistory,
    subscription,
    updateSubscription,
    logout,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('dashboard');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    nameZh: user?.nameZh || '',
    nameIt: user?.nameIt || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [newsletterFreq, setNewsletterFreq] = useState<NewsletterFreq>(subscription.newsletterFreq);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(subscription.topics);
  const [notifyMethod, setNotifyMethod] = useState<NotifyMethod>(subscription.notifyMethod);
  const [channels, setChannels] = useState(subscription.channels);
  const [emailAddress, setEmailAddress] = useState(subscription.emailAddress || user?.email || '');

  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'success',
    messageZh: '',
    messageIt: '',
  });

  useEffect(() => {
    setNewsletterFreq(subscription.newsletterFreq);
    setSelectedTopics(subscription.topics);
    setNotifyMethod(subscription.notifyMethod);
    setChannels(subscription.channels);
    setEmailAddress(subscription.emailAddress || user?.email || '');
  }, [subscription, user?.email]);

  const t = (zh: string, it: string) => (lang === 'zh' ? zh : it);

  const showToast = (type: ToastState['type'], messageZh: string, messageIt: string) => {
    showToastFn(setToast, toast, type, messageZh, messageIt);
  };

  const userRole: UserRole | null = user?.role || null;
  const dashboardKey: DashboardKey | null =
    userRole === 'government' || userRole === 'culture' || userRole === 'public' || userRole === 'translator'
      ? userRole
      : null;

  const favoriteItems = useMemo(() => {
    const favProjects = mockProjects.filter((p) => favorites.includes(p.id)).map((p) => ({
      type: 'project' as const,
      id: p.id,
      titleZh: p.titleZh,
      titleIt: p.titleIt,
      descZh: p.descriptionZh,
      descIt: p.descriptionIt,
      category: p.category,
      updatedAt: p.updatedAt,
    }));
    const favNews = mockNews.filter((n) => favorites.includes(n.id)).map((n) => ({
      type: 'news' as const,
      id: n.id,
      titleZh: n.titleZh,
      titleIt: n.titleIt,
      descZh: n.summaryZh,
      descIt: n.summaryIt,
      category: n.category,
      updatedAt: n.publishedAt,
    }));
    return [...favProjects, ...favNews].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [favorites]);

  const toggleTopic = (key: string) => {
    setSelectedTopics((prev) =>
      prev.includes(key) ? prev.filter((topic) => topic !== key) : [...prev, key]
    );
  };

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = () => {
    if (user) {
      setUser({
        ...user,
        nameZh: editForm.nameZh,
        nameIt: editForm.nameIt,
        email: editForm.email,
        phone: editForm.phone,
      });
      showToast('success', '个人资料已更新', 'Profilo aggiornato');
    }
    setEditingProfile(false);
  };

  const handleSaveSubscription = () => {
    updateSubscription({
      newsletterFreq,
      topics: selectedTopics,
      notifyMethod,
      channels,
      emailAddress: emailAddress || undefined,
    });
    showToast('success', '订阅设置已保存', 'Impostazioni di sottoscrizione salvate');
  };

  const handleLogout = () => {
    logout();
    showToast('info', '已退出登录', 'Disconnessione effettuata');
  };

  const tabs: { key: ProfileTab; icon: typeof Heart; zh: string; it: string; badge?: number }[] = [
    {
      key: 'dashboard',
      icon: Briefcase,
      zh: t('工作台', 'Dashboard'),
      it: 'Dashboard',
    },
    {
      key: 'history',
      icon: BookOpen,
      zh: t('翻译历史', 'Cronologia'),
      it: 'Cronologia',
      badge: translateHistory.length,
    },
    {
      key: 'subscription',
      icon: Settings,
      zh: t('订阅设置', 'Impostazioni'),
      it: 'Impostazioni',
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-ivory-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="card relative overflow-hidden p-10 text-center">
            <div className="absolute inset-0 bg-pattern opacity-30" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-cnit rounded-full blur-3xl opacity-10 -translate-y-1/3 -translate-x-1/3" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-it-green-500 rounded-full blur-3xl opacity-10 translate-y-1/3 translate-x-1/3" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-cnit shadow-gold flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-display-zh font-semibold text-charcoal-600 mb-2">
                <BilingualText zh="欢迎来到中意桥个人中心" it="Benvenuto nel Profilo Ponte Cina-Italia" />
              </h1>
              <p className="text-charcoal-400 mb-8 max-w-lg mx-auto">
                <BilingualText
                  zh="登录后即可访问专属工作台、查看翻译历史、管理订阅偏好与个性化设置"
                  it="Accedi per utilizzare la dashboard personalizzata, visualizzare la cronologia delle traduzioni e gestire le preferenze di sottoscrizione"
                />
              </p>

              <button
                onClick={() => setLoginModalOpen(true)}
                className="btn-primary text-base px-8 py-3 mb-8"
              >
                <LogIn className="w-5 h-5" />
                <BilingualText zh="立即登录" it="Accedi Ora" />
              </button>

              <div className="pt-8 border-t border-charcoal-100">
                <p className="text-sm text-charcoal-400 mb-4">
                  <BilingualText zh="演示账号快速体验（对应角色）" it="Account demo per una prova rapida" />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {DEMO_ACCOUNTS.filter((a) => a.role === 'government' || a.role === 'culture' || a.role === 'public' || a.role === 'translator').map(
                    (acc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-ivory-50/70 border border-charcoal-50 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <BadgeCheck
                            className={cn(
                              'w-4 h-4',
                              acc.role === 'government' && 'text-cn-red-500',
                              acc.role === 'culture' && 'text-purple-500',
                              acc.role === 'public' && 'text-blue-500',
                              acc.role === 'translator' && 'text-emerald-500'
                            )}
                          />
                          <span className="font-medium text-charcoal-600">
                            {lang === 'zh' ? acc.labelZh : acc.labelIt}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-charcoal-400">
                          {acc.email} / {acc.password}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast.show && <Toast toast={toast} t={t} onClose={() => setToast({ ...toast, show: false })} />}
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[user.role];

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container mx-auto px-4 py-8">
        <div className="card relative overflow-hidden mb-8 p-8">
          <div className="absolute inset-0 bg-pattern opacity-50" />
          <div className={cn(
            'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -translate-y-1/3 translate-x-1/3 bg-gradient-to-br',
            roleLabel?.color || 'from-red-500 to-green-500'
          )} />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-full shadow-gold flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br',
                roleLabel?.color || 'bg-gradient-cnit'
              )}>
                {(lang === 'zh' ? user.nameZh : user.nameIt).charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-white shadow-elegant flex items-center justify-center">
                <Award className="w-4 h-4 text-warm-gold-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display-zh font-semibold text-charcoal-600 mb-1">
                {user.nameZh}
              </h1>
              <p className="text-lg font-display-it text-it-green-600 mb-2">
                {user.nameIt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-warm-gold-600" />
                  {t(roleLabel?.zh || '用户', roleLabel?.it || 'Utente')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-warm-gold-600" />
                  {user.email}
                </span>
                {user.organizationZh && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-warm-gold-600" />
                    {lang === 'zh' ? user.organizationZh : user.organizationIt}
                  </span>
                )}
                {user.verifiedAt && (
                  <span className="flex items-center gap-1.5 text-it-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('已认证', 'Verificato')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditForm({
                    nameZh: user.nameZh,
                    nameIt: user.nameIt,
                    email: user.email,
                    phone: user.phone || '',
                  });
                  setEditingProfile(true);
                }}
                className="btn-secondary"
              >
                <Pencil className="w-4 h-4" />
                {t('编辑资料', 'Modifica Profilo')}
              </button>
              <button
                onClick={handleLogout}
                className="btn-ghost text-cn-red-500"
              >
                <LogOut className="w-4 h-4" />
                {t('退出', 'Esci')}
              </button>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-charcoal-100 px-2">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors',
                      active ? 'text-cn-red-500' : 'text-charcoal-400 hover:text-charcoal-500'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.zh}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-xs',
                        active ? 'bg-cn-red-50 text-cn-red-500' : 'bg-charcoal-100 text-charcoal-400'
                      )}>
                        {tab.badge}
                      </span>
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-cnit rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div>
                {dashboardKey === 'government' && <GovernmentDashboard t={t} />}
                {dashboardKey === 'culture' && <CultureDashboard t={t} />}
                {dashboardKey === 'public' && <PublicDashboard t={t} />}
                {dashboardKey === 'translator' && <TranslatorDashboard t={t} />}
                {(dashboardKey === null) && (
                  <div className="text-center py-16">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-charcoal-200" />
                    <p className="text-charcoal-500 mb-2">{t('您的角色暂无专属工作台', 'Nessuna dashboard disponibile per il tuo ruolo')}</p>
                    <p className="text-sm text-charcoal-400">
                      {t('您可以使用翻译和收藏功能', 'Puoi utilizzare le funzionalità di traduzione e preferiti')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {translateHistory.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ivory-100 flex items-center justify-center">
                      <Languages className="w-8 h-8 text-charcoal-200" />
                    </div>
                    <p className="text-charcoal-500">{t('暂无翻译记录', 'Nessuna cronologia di traduzione')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {translateHistory.map((item) => (
                      <TranslationHistoryCard key={item.id} item={item} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="max-w-2xl space-y-8">
                <div>
                  <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-warm-gold-600" />
                    {t('简报频率', 'Frequenza Newsletter')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {freqOptions.map((opt) => {
                      const active = newsletterFreq === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setNewsletterFreq(opt.key)}
                          className={cn(
                            'p-4 rounded-xl border-2 text-left transition-all',
                            active
                              ? 'border-warm-gold-500 bg-warm-gold-50/50'
                              : 'border-charcoal-100 bg-white hover:border-charcoal-200'
                          )}
                        >
                          <p className={cn(
                            'font-semibold mb-1',
                            active ? 'text-cn-red-500' : 'text-charcoal-600'
                          )}>
                            {t(opt.zh, opt.it)}
                          </p>
                          <p className="text-xs text-charcoal-400 leading-relaxed">
                            {t(opt.descZh, opt.descIt)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-warm-gold-600" />
                    {t('主题偏好', 'Preferenze Tematiche')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topicOptions.map((topic) => {
                      const active = selectedTopics.includes(topic.key);
                      return (
                        <button
                          key={topic.key}
                          onClick={() => toggleTopic(topic.key)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all border-2',
                            active
                              ? 'bg-gradient-cnit text-white border-transparent shadow-gold'
                              : 'bg-white text-charcoal-500 border-charcoal-100 hover:border-charcoal-200'
                          )}
                        >
                          {t(topic.zh, topic.it)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-charcoal-400 mt-3">
                    {t('已选择', 'Selezionati')}: {selectedTopics.length} / {topicOptions.length}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-warm-gold-600" />
                    {t('通知方式', 'Metodo di Notifica')}
                  </h3>
                  <div className="space-y-2">
                    {notifyOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = notifyMethod === opt.key;
                      return (
                        <label
                          key={opt.key}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                            active
                              ? 'border-it-green-500 bg-it-green-50/30'
                              : 'border-charcoal-100 bg-white hover:border-charcoal-200'
                          )}
                        >
                          <span className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                            active ? 'border-it-green-500' : 'border-charcoal-200'
                          )}>
                            {active && <span className="w-2.5 h-2.5 rounded-full bg-it-green-500" />}
                          </span>
                          <Icon className={cn(
                            'w-5 h-5',
                            active ? 'text-it-green-500' : 'text-charcoal-300'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            active ? 'text-charcoal-600' : 'text-charcoal-500'
                          )}>
                            {t(opt.zh, opt.it)}
                          </span>
                          <input
                            type="radio"
                            name="notifyMethod"
                            value={opt.key}
                            checked={active}
                            onChange={() => setNotifyMethod(opt.key)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-warm-gold-600" />
                    {t('推送渠道', 'Canali di Push')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {channelOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = channels[opt.key];
                      return (
                        <label
                          key={opt.key}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                            active
                              ? 'border-warm-gold-500 bg-warm-gold-50/30'
                              : 'border-charcoal-100 bg-white hover:border-charcoal-200'
                          )}
                        >
                          <span className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                            active ? 'border-warm-gold-500 bg-warm-gold-500' : 'border-charcoal-200'
                          )}>
                            {active && <Check className="w-3.5 h-3.5 text-white" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Icon className={cn(
                                'w-4 h-4',
                                active ? 'text-warm-gold-600' : 'text-charcoal-300'
                              )} />
                              <span className={cn(
                                'text-sm font-medium',
                                active ? 'text-charcoal-600' : 'text-charcoal-500'
                              )}>
                                {t(opt.zh, opt.it)}
                              </span>
                            </div>
                            <p className="text-xs text-charcoal-400 leading-relaxed">
                              {t(opt.descZh, opt.descIt)}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleChannel(opt.key)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {channels.email && (
                  <div>
                    <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                      <MailIcon className="w-4 h-4 text-warm-gold-600" />
                      {t('邮箱地址', 'Indirizzo Email')}
                    </h3>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder={t('请输入接收通知的邮箱', 'Inserisci email per le notifiche')}
                      className="input-field"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button onClick={handleSaveSubscription} className="btn-primary">
                    <Sparkles className="w-4 h-4" />
                    {t('保存设置', 'Salva Impostazioni')}
                  </button>
                  <button
                    onClick={() => {
                      setNewsletterFreq(subscription.newsletterFreq);
                      setSelectedTopics(subscription.topics);
                      setNotifyMethod(subscription.notifyMethod);
                      setChannels(subscription.channels);
                      setEmailAddress(subscription.emailAddress || user?.email || '');
                      showToast('info', '已重置为当前设置', 'Ripristinate impostazioni correnti');
                    }}
                    className="btn-ghost"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('重置', 'Ripristina')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-charcoal-500/50 backdrop-blur-sm" onClick={() => setEditingProfile(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-hover overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100">
              <h2 className="font-semibold text-charcoal-600">
                {t('编辑资料', 'Modifica Profilo')}
              </h2>
              <button
                onClick={() => setEditingProfile(false)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:bg-charcoal-50 hover:text-charcoal-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-1.5">
                  {t('中文姓名', 'Nome Cinese')}
                </label>
                <input
                  type="text"
                  value={editForm.nameZh}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nameZh: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-1.5">
                  {t('意大利姓名', 'Nome Italiano')}
                </label>
                <input
                  type="text"
                  value={editForm.nameIt}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nameIt: e.target.value }))}
                  className="input-field font-sans-it"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-1.5">
                  {t('邮箱地址', 'Email')}
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-500 mb-1.5">
                  {t('联系电话', 'Telefono')}
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder={t('可选', 'Opzionale')}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-charcoal-100">
              <button onClick={() => setEditingProfile(false)} className="btn-ghost">
                {t('取消', 'Annulla')}
              </button>
              <button onClick={handleSaveProfile} className="btn-primary">
                {t('保存', 'Salva')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast toast={toast} t={t} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}

function GovernmentDashboard({ t }: { t: (zh: string, it: string) => string }) {
  const stats = [
    { key: 'projects', zh: '待审项目', it: 'Progetti in attesa', value: 12, trend: '+3', up: true, icon: FileCheck, color: 'from-cn-red-500 to-orange-500' },
    { key: 'signed', zh: '本月签发文件', it: 'Documenti firmati', value: 48, trend: '+12%', up: true, icon: FileSignature, color: 'from-warm-gold-500 to-amber-500' },
    { key: 'partners', zh: '合作机构', it: 'Istituzioni partner', value: 86, trend: '+5', up: true, icon: Building2, color: 'from-purple-500 to-pink-500' },
    { key: 'announcements', zh: '已发公告', it: 'Annunci pubblicati', value: 23, trend: '-2', up: false, icon: Megaphone, color: 'from-blue-500 to-cyan-500' },
  ];

  const menuItems = [
    { icon: FileCheck, zh: '项目审批', it: 'Approvazione Progetti', descZh: '审核双边合作项目立项与推进', descIt: 'Approva progetti di cooperazione bilaterale', color: 'text-cn-red-500 bg-cn-red-50' },
    { icon: FileSignature, zh: '文件签发', it: 'Firma Documenti', descZh: '签发官方函件、合作协议、备忘录', descIt: 'Firma lettere ufficiali, accordi, memorandum', color: 'text-warm-gold-600 bg-warm-gold-50' },
    { icon: Building2, zh: '合作机构管理', it: 'Gestione Partner', descZh: '维护意中双边合作机构名录', descIt: 'Gestisci l\'elenco delle istituzioni partner', color: 'text-purple-600 bg-purple-50' },
    { icon: Megaphone, zh: '对外公告发布', it: 'Pubblicazione Annunci', descZh: '发布官方公告、政策通知与新闻稿', descIt: 'Pubblica annunci ufficiali e comunicati stampa', color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-600 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cn-red-500" />
            {t('政府工作台', 'Dashboard Istituzionale')}
          </h2>
          <p className="text-sm text-charcoal-400 mt-1">
            {t('双边合作项目管理与政务事务处理中心', 'Centro di gestione progetti e affari istituzionali')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="card p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-elegant', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  s.up ? 'text-emerald-600' : 'text-charcoal-400'
                )}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-charcoal-600 mb-1">{s.value}</p>
              <p className="text-sm text-charcoal-400">{t(s.zh, s.it)}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-warm-gold-600" />
          {t('数据概览', 'Panoramica Dati')}
        </h3>
        <div className="card p-5 bg-gradient-to-br from-warm-ivory-50/50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-charcoal-400 mb-2">{t('项目状态分布', 'Stato Progetti')}</p>
              <div className="space-y-2">
                {[
                  { zh: '规划中', it: 'Pianificazione', val: 28, color: 'bg-blue-500' },
                  { zh: '磋商中', it: 'Negoziazione', val: 35, color: 'bg-warm-gold-500' },
                  { zh: '执行中', it: 'Implementazione', val: 52, color: 'bg-emerald-500' },
                  { zh: '已完成', it: 'Completati', val: 18, color: 'bg-charcoal-400' },
                ].map((p) => (
                  <div key={p.zh}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-charcoal-500">{t(p.zh, p.it)}</span>
                      <span className="font-medium text-charcoal-600">{p.val}</span>
                    </div>
                    <div className="w-full h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', p.color)} style={{ width: `${p.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-2">{t('合作领域占比', 'Settori di Cooperazione')}</p>
              <div className="space-y-2">
                {[
                  { zh: '经贸合作', it: 'Economico', val: 38, color: 'bg-cn-red-500' },
                  { zh: '文化教育', it: 'Culturale', val: 27, color: 'bg-purple-500' },
                  { zh: '科技创新', it: 'Tecnologico', val: 22, color: 'bg-it-green-500' },
                  { zh: '旅游环保', it: 'Turistico', val: 13, color: 'bg-warm-gold-500' },
                ].map((p) => (
                  <div key={p.zh}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-charcoal-500">{t(p.zh, p.it)}</span>
                      <span className="font-medium text-charcoal-600">{p.val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', p.color)} style={{ width: `${p.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-charcoal-400 mb-2">{t('近7日签发量', 'Firme ultimi 7 giorni')}</p>
              <div className="flex items-end gap-1 h-24">
                {[4, 7, 5, 9, 6, 8, 12].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-warm-gold-500 to-warm-gold-400 rounded-t transition-all hover:from-warm-gold-600"
                      style={{ height: `${(h / 12) * 100}%` }}
                    />
                    <span className="text-[10px] text-charcoal-300">D{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-warm-gold-600" />
          {t('快捷入口', 'Accesso Rapido')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.zh} className="card p-5 card-hover text-left group">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', item.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-charcoal-600 mb-1 group-hover:text-cn-red-500 transition-colors">
                  {t(item.zh, item.it)}
                </h4>
                <p className="text-xs text-charcoal-400 leading-relaxed mb-3">
                  {t(item.descZh, item.descIt)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-warm-gold-600 font-medium">
                  {t('进入', 'Vai')}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CultureDashboard({ t }: { t: (zh: string, it: string) => string }) {
  const stats = [
    { key: 'events', zh: '策划中活动', it: 'Eventi in programma', value: 8, trend: '+2', up: true, icon: CalendarCheck, color: 'from-purple-500 to-pink-500' },
    { key: 'exhibitions', zh: '在线展览', it: 'Mostre attive', value: 15, trend: '+1', up: true, icon: ImageIcon, color: 'from-rose-500 to-orange-500' },
    { key: 'applications', zh: '交流申请', it: 'Richieste scambio', value: 27, trend: '+18%', up: true, icon: Handshake, color: 'from-blue-500 to-cyan-500' },
    { key: 'artists', zh: '入驻艺术家', it: 'Artisti iscritti', value: 64, trend: '+8', up: true, icon: Palette, color: 'from-it-green-500 to-emerald-500' },
  ];

  const menuItems = [
    { icon: CalendarCheck, zh: '活动策划', it: 'Pianificazione Eventi', descZh: '策划中意文化交流活动、艺术演出', descIt: 'Programma eventi culturali e spettacoli', color: 'text-purple-600 bg-purple-50' },
    { icon: ImageIcon, zh: '展览管理', it: 'Gestione Mostre', descZh: '维护线上虚拟展厅与实体展览信息', descIt: 'Gestisci mostre virtuali ed eventi espositivi', color: 'text-rose-600 bg-rose-50' },
    { icon: Handshake, zh: '文化交流申请', it: 'Richieste Scambio', descZh: '审核艺术家驻留、机构交流申请', descIt: 'Valuta richieste di residenza artistica', color: 'text-blue-600 bg-blue-50' },
    { icon: UserPlus, zh: '艺术家入驻', it: 'Iscrizione Artisti', descZh: '邀请和管理入驻平台的艺术家档案', descIt: 'Invita e gestisci profili di artisti', color: 'text-it-green-600 bg-it-green-50' },
  ];

  const upcomingEvents = [
    { zh: '2026中意文化年开幕式', it: 'Cerimonia Anno della Cultura 2026', date: '2026-09-15', location: { zh: '北京国家大剧院', it: 'Teatro Nazionale di Pechino' }, status: 'preparing' },
    { zh: '当代艺术双年展预热展', it: 'Pre-mostra Biennale Arte Contemporanea', date: '2026-08-20', location: { zh: '上海当代艺术博物馆', it: 'MoCA Shanghai' }, status: 'reviewing' },
    { zh: '意大利歌剧进校园巡演', it: 'Tour Lirico nelle Università', date: '2026-10-05', location: { zh: '全国多所高校', it: 'Università Nazionali' }, status: 'planning' },
  ];

  const statusLabels: Record<string, { zh: string; it: string; className: string }> = {
    preparing: { zh: '筹备中', it: 'In preparazione', className: 'tag-gold' },
    reviewing: { zh: '审核中', it: 'In revisione', className: 'tag-cn' },
    planning: { zh: '规划中', it: 'In pianificazione', className: 'tag-it' },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-600 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            {t('文化组织工作台', 'Dashboard Organizzazioni Culturali')}
          </h2>
          <p className="text-sm text-charcoal-400 mt-1">
            {t('文化艺术活动管理、展览运营与艺术家资源中心', 'Gestione attività culturali, mostre e artisti')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="card p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-elegant', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  s.up ? 'text-emerald-600' : 'text-charcoal-400'
                )}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-charcoal-600 mb-1">{s.value}</p>
              <p className="text-sm text-charcoal-400">{t(s.zh, s.it)}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-warm-gold-600" />
          {t('近期活动', 'Prossimi Eventi')}
        </h3>
        <div className="space-y-3">
          {upcomingEvents.map((ev, idx) => {
            const status = statusLabels[ev.status];
            return (
              <div key={idx} className="card p-5 card-hover flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-7 h-7 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-charcoal-600">{t(ev.zh, ev.it)}</h4>
                    <span className={status.className}>{t(status.zh, status.it)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t(ev.location.zh, ev.location.it)}
                    </span>
                  </div>
                </div>
                <button className="btn-ghost shrink-0">
                  {t('查看详情', 'Dettagli')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-warm-gold-600" />
          {t('快捷入口', 'Accesso Rapido')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.zh} className="card p-5 card-hover text-left group">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', item.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-charcoal-600 mb-1 group-hover:text-purple-600 transition-colors">
                  {t(item.zh, item.it)}
                </h4>
                <p className="text-xs text-charcoal-400 leading-relaxed mb-3">
                  {t(item.descZh, item.descIt)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-warm-gold-600 font-medium">
                  {t('进入', 'Vai')}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PublicDashboard({ t }: { t: (zh: string, it: string) => string }) {
  const menuItems = [
    { icon: Plane, zh: '签证办理指引', it: 'Guida Visti', descZh: '意中双向签证申请流程、材料清单', descIt: 'Guida visti Cina-Italia, documenti richiesti', color: 'text-blue-600 bg-blue-50' },
    { icon: Stethoscope, zh: '医疗预约翻译', it: 'Traduzione Appuntamenti Medici', descZh: '协助预约医院并翻译就诊资料', descIt: 'Prenota visite mediche con servizio traduzione', color: 'text-rose-600 bg-rose-50' },
    { icon: Scale, zh: '法律咨询', it: 'Consulenza Legale', descZh: '双边法律事务咨询、合同翻译', descIt: 'Consulenza legale bilaterale e traduzioni contrattuali', color: 'text-amber-600 bg-amber-50' },
    { icon: MapPin, zh: '旅游指南', it: 'Guida Turistica', descZh: '意大利深度游路线、景点介绍', descIt: 'Itinerari turistici e attrazioni in Italia', color: 'text-it-green-600 bg-it-green-50' },
    { icon: UserCog, zh: '个人资料', it: 'Profilo Personale', descZh: '编辑个人信息、偏好设置', descIt: 'Modifica dati personali e preferenze', color: 'text-purple-600 bg-purple-50' },
  ];

  const services = [
    { zh: '商务签证最快5个工作日出签', it: 'Visto d\'affari in 5 giorni lavorativi', icon: Plane, tag: { zh: '热门', it: 'Popolare' } },
    { zh: '米兰权威医院专家号预约通道', it: 'Prenotazioni specialistiche a Milano', icon: Stethoscope, tag: { zh: '推荐', it: 'Consigliato' } },
    { zh: '罗马假日经典9日深度游', it: 'Tour classico 9 giorni "Vacanze Romane"', icon: MapPin, tag: { zh: '新品', it: 'Nuovo' } },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-600 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {t('个人工作台', 'Dashboard Personale')}
          </h2>
          <p className="text-sm text-charcoal-400 mt-1">
            {t('中意生活服务一站式入口，翻译、签证、医疗、旅游全搞定', 'Servizi integrati: traduzioni, visti, salute, viaggi')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-warm-gold-600" />
              {t('生活服务入口', 'Servizi per la Vita Quotidiana')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.zh} className="card p-5 card-hover text-left group">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', item.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-charcoal-600 mb-1 group-hover:text-blue-600 transition-colors">
                      {t(item.zh, item.it)}
                    </h4>
                    <p className="text-xs text-charcoal-400 leading-relaxed mb-3">
                      {t(item.descZh, item.descIt)}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-warm-gold-600 font-medium">
                      {t('立即办理', 'Vai al servizio')}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 bg-gradient-to-br from-warm-gold-50/50 to-white">
            <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warm-gold-600" />
              {t('翻译使用概况', 'Le Tue Traduzioni')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-charcoal-600">128</p>
                  <p className="text-xs text-charcoal-400">{t('累计翻译次数', 'Traduzioni totali')}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cn-red-500 to-warm-gold-500 flex items-center justify-center text-white shadow-elegant">
                  <Languages className="w-6 h-6" />
                </div>
              </div>
              <div className="divider-gold" />
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-white/60">
                  <p className="text-lg font-bold text-cn-red-600">76%</p>
                  <p className="text-xs text-charcoal-400">{t('中译意', 'ZH → IT')}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/60">
                  <p className="text-lg font-bold text-it-green-600">24%</p>
                  <p className="text-xs text-charcoal-400">{t('意译中', 'IT → ZH')}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-charcoal-400 mb-2">{t('常用场景', 'Scenari frequenti')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {['签证', '医疗', '旅游', '法律'].map((s) => (
                    <span key={s} className="tag-gold text-xs">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-warm-gold-600" />
              {t('精选服务推荐', 'Servizi Consigliati')}
            </h3>
            <div className="space-y-3">
              {services.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="card p-4 card-hover flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warm-gold-100 to-warm-gold-50 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-warm-gold-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-600 line-clamp-1">{t(s.zh, s.it)}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-cn-red-50 text-cn-red-600 font-medium">
                        {t(s.tag.zh, s.tag.it)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranslatorDashboard({ t }: { t: (zh: string, it: string) => string }) {
  const stats = [
    { key: 'pending', zh: '待接订单', it: 'Ordini in attesa', value: 6, trend: '+2', up: true, icon: ClipboardList, color: 'from-cn-red-500 to-orange-500' },
    { key: 'completed', zh: '本月完成', it: 'Completati nel mese', value: 42, trend: '+15%', up: true, icon: CheckCircle2, color: 'from-it-green-500 to-emerald-500' },
    { key: 'polishing', zh: '润色队列', it: 'Coda Revisione', value: 9, trend: '+1', up: true, icon: Sparkles, color: 'from-warm-gold-500 to-amber-500' },
    { key: 'income', zh: '本月收入(€)', it: 'Reddito Mese(€)', value: '3,860', trend: '+22%', up: true, icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
  ];

  const menuItems = [
    { icon: ClipboardList, zh: '待接翻译订单', it: 'Ordini da Accettare', descZh: '查看和接单待分配翻译任务', descIt: 'Visualizza e accetta ordini di traduzione', color: 'text-cn-red-600 bg-cn-red-50' },
    { icon: CheckCircle2, zh: '已完成翻译', it: 'Traduzioni Completate', descZh: '查阅历史完成的翻译订单', descIt: 'Consulta ordini di traduzione completati', color: 'text-it-green-600 bg-it-green-50' },
    { icon: Sparkles, zh: '人工润色队列', it: 'Coda di Revisione', descZh: '处理需要润色的翻译稿件', descIt: 'Gestisci le traduzioni da revisionare', color: 'text-warm-gold-600 bg-warm-gold-50' },
    { icon: DollarSign, zh: '收入统计', it: 'Statistiche Reddito', descZh: '查看翻译收入、结算记录', descIt: 'Visualizza redditi e storico pagamenti', color: 'text-blue-600 bg-blue-50' },
    { icon: BookMarked, zh: '术语库维护', it: 'Manutenzione Terminologia', descZh: '管理个人/共享专业术语库', descIt: 'Gestisci il glossario professionale', color: 'text-purple-600 bg-purple-50' },
  ];

  const pendingOrders = [
    { id: 'ORD-20260621-001', zh: '经贸合作协议翻译', it: 'Traduzione Accordo Cooperazione', words: 3800, deadline: '2026-06-22', urgency: 'urgent', price: '€190' },
    { id: 'ORD-20260621-002', zh: '博物馆展览解说词', it: 'Testi Mostra Museale', words: 2100, deadline: '2026-06-23', urgency: 'normal', price: '€105' },
    { id: 'ORD-20260620-008', zh: '大学招生简章意译中', it: 'Bando Ammissione Università', words: 5200, deadline: '2026-06-24', urgency: 'normal', price: '€260' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-charcoal-600 flex items-center gap-2">
            <Languages className="w-5 h-5 text-emerald-500" />
            {t('译员工作台', 'Dashboard Traduttore')}
          </h2>
          <p className="text-sm text-charcoal-400 mt-1">
            {t('翻译订单管理、润色工作流与收入统计中心', 'Gestione ordini, flussi di revisione e statistiche reddito')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="card p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-elegant', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  s.up ? 'text-emerald-600' : 'text-charcoal-400'
                )}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-charcoal-600 mb-1">{s.value}</p>
              <p className="text-sm text-charcoal-400">{t(s.zh, s.it)}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-warm-gold-600" />
          {t('待接订单列表', 'Ordini in Attesa')}
        </h3>
        <div className="space-y-3">
          {pendingOrders.map((order) => (
            <div key={order.id} className="card p-5 card-hover flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-charcoal-400">{order.id}</span>
                  {order.urgency === 'urgent' && (
                    <span className="tag-cn text-xs">{t('加急', 'Urgente')}</span>
                  )}
                </div>
                <h4 className="font-semibold text-charcoal-600 mb-1">{t(order.zh, order.it)}</h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {order.words} {t('词', 'parole')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t('截止', 'Scadenza')}: {order.deadline}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold text-cn-red-600">{order.price}</p>
                  <p className="text-[10px] text-charcoal-400">{t('翻译报酬', 'Compenso')}</p>
                </div>
                <button className="btn-primary px-4 py-2 text-sm">
                  <Check className="w-4 h-4" />
                  {t('接单', 'Accetta')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-warm-gold-600" />
          {t('快捷入口', 'Accesso Rapido')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.zh} className="card p-5 card-hover text-left group">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110', item.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-charcoal-600 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {t(item.zh, item.it)}
                </h4>
                <p className="text-xs text-charcoal-400 leading-relaxed mb-3 line-clamp-2">
                  {t(item.descZh, item.descIt)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-warm-gold-600 font-medium">
                  {t('进入', 'Vai')}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TranslationHistoryCard({ item, t }: { item: TranslationHistoryItem; t: (zh: string, it: string) => string }) {
  const scene = item.scene ? sceneLabels[item.scene] : null;
  return (
    <div className="card p-5 hover:shadow-hover transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cn(
              'tag text-xs',
              item.source === 'zh' ? 'tag-cn' : 'tag-it'
            )}>
              {item.source === 'zh' ? t('中文', 'Cinese') : 'Italiano'}
            </span>
            <ChevronRight className="w-3 h-3 text-warm-gold-500" />
            <span className={cn(
              'tag text-xs',
              item.target === 'zh' ? 'tag-cn' : 'tag-it'
            )}>
              {item.target === 'zh' ? t('中文', 'Cinese') : 'Italiano'}
            </span>
            {scene && (
              <span className="tag-gold text-xs">
                {t(scene.zh, scene.it)}
              </span>
            )}
            <span className="text-xs text-charcoal-300 flex items-center gap-1 ml-auto sm:ml-0">
              <Calendar className="w-3 h-3" />
              {item.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-ivory-50/70 p-3">
              <p className="text-xs text-charcoal-400 mb-1">
                {t('原文', 'Originale')}
              </p>
              <p className="text-sm text-charcoal-600 line-clamp-3 leading-relaxed">
                {item.sourceText}
              </p>
            </div>
            <div className="rounded-lg bg-it-green-50/50 p-3">
              <p className="text-xs text-it-green-600 mb-1">
                {t('译文', 'Traduzione')}
              </p>
              <p className="text-sm text-charcoal-600 line-clamp-3 leading-relaxed">
                {item.targetText}
              </p>
            </div>
          </div>
        </div>

        <button className="btn-ghost shrink-0 self-start sm:self-center">
          <RefreshCw className="w-4 h-4" />
          {t('再次翻译', 'Traduci di nuovo')}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast, t, onClose }: { toast: ToastState; t: (zh: string, it: string) => string; onClose: () => void }) {
  const config: Record<ToastState['type'], { icon: typeof Check; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    error: { icon: AlertCircle, color: 'text-cn-red-600', bg: 'bg-cn-red-50 border-cn-red-200' },
    info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  };
  const conf = config[toast.type];
  const Icon = conf.icon;
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={cn('card px-5 py-4 flex items-center gap-3 min-w-[280px] shadow-hover border-2', conf.bg)}>
        <Icon className={cn('w-5 h-5 shrink-0', conf.color)} />
        <p className={cn('text-sm font-medium', conf.color)}>
          {t(toast.messageZh, toast.messageIt)}
        </p>
        <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-white/60 transition-colors">
          <X className="w-4 h-4 text-charcoal-400" />
        </button>
      </div>
    </div>
  );
}