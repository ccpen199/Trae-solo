import { useState, useMemo } from 'react';
import {
  User,
  Mail,
  Pencil,
  Heart,
  HeartOff,
  Languages,
  Calendar,
  RefreshCw,
  Newspaper,
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
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { mockProjects, mockNews } from '@/data/mock';
import BilingualText from '@/components/BilingualText';
import type { ProjectCategory, TranslationHistoryItem } from '@/types';

type ProfileTab = 'favorites' | 'history' | 'subscription';

type NewsletterFreq = 'daily' | 'weekly' | 'off';
type NotifyMethod = 'inapp' | 'email' | 'both';

const categoryLabels: Record<ProjectCategory | 'general', { zh: string; it: string; className: string }> = {
  economic: { zh: '经贸', it: 'Economico', className: 'tag-cn' },
  education: { zh: '教育', it: 'Educazione', className: 'tag-it' },
  tourism: { zh: '文旅', it: 'Turismo', className: 'tag-gold' },
  technology: { zh: '科技', it: 'Tecnologia', className: 'tag-cn' },
  general: { zh: '综合', it: 'Generale', className: 'tag-gold' },
};

const mockTranslationHistory: TranslationHistoryItem[] = [
  {
    id: 'th001',
    sourceText: '我们诚挚地邀请您参加将于下月在上海举行的中意经贸合作论坛。',
    targetText: 'La invitiamo cordialmente a partecipare al Forum di Cooperazione Economica Cina-Italia che si terrà a Shanghai il prossimo mese.',
    source: 'zh',
    target: 'it',
    scene: 'general',
    timestamp: '2026-06-20 15:42',
  },
  {
    id: 'th002',
    sourceText: 'Il Politecnico di Milano è una delle università tecniche più prestigiose d\'Europa.',
    targetText: '米兰理工大学是欧洲最负盛名的技术类大学之一。',
    source: 'it',
    target: 'zh',
    scene: 'education',
    timestamp: '2026-06-19 10:15',
  },
  {
    id: 'th003',
    sourceText: '根据合同条款，双方应在不可抗力事件发生后48小时内通知对方。',
    targetText: 'Secondo i termini del contratto, le parti devono notificarsi reciprocamente entro 48 ore dal verificarsi di un evento di forza maggiore.',
    source: 'zh',
    target: 'it',
    scene: 'legal',
    timestamp: '2026-06-18 16:30',
  },
  {
    id: 'th004',
    sourceText: 'Il paziente presenta sintomi di ipertensione arteriosa e necessita di un controllo periodico.',
    targetText: '患者出现高血压症状，需要定期检查。',
    source: 'it',
    target: 'zh',
    scene: 'medical',
    timestamp: '2026-06-17 09:08',
  },
  {
    id: 'th005',
    sourceText: '请问从火车站到威尼斯圣马可广场应该乘坐哪条线路？',
    targetText: 'Scusi, quale linea devo prendere dalla stazione ferroviaria per arrivare a Piazza San Marco a Venezia?',
    source: 'zh',
    target: 'it',
    scene: 'general',
    timestamp: '2026-06-15 14:20',
  },
];

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

function formatDate(dateStr: string, lang: 'zh' | 'it') {
  return dateStr;
}

export default function Profile() {
  const { lang, user, favorites, toggleFavorite, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('favorites');
  const [newsletterFreq, setNewsletterFreq] = useState<NewsletterFreq>('weekly');
  const [selectedTopics, setSelectedTopics] = useState<(ProjectCategory | 'general')[]>(['economic', 'technology']);
  const [notifyMethod, setNotifyMethod] = useState<NotifyMethod>('both');
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    nameZh: user?.nameZh || '',
    nameIt: user?.nameIt || '',
    email: user?.email || '',
  });

  const t = (zh: string, it: string) => (lang === 'zh' ? zh : it);

  const displayUser = user || {
    id: 'demo-user',
    email: 'marco.rossi@example.com',
    nameZh: '马可·罗西',
    nameIt: 'Marco Rossi',
    role: '高级用户',
    avatar: '',
  };

  const favoriteItems = useMemo(() => {
    const favProjects = mockProjects.filter(p => favorites.includes(p.id)).map(p => ({
      type: 'project' as const,
      id: p.id,
      titleZh: p.titleZh,
      titleIt: p.titleIt,
      descZh: p.descriptionZh,
      descIt: p.descriptionIt,
      category: p.category,
      updatedAt: p.updatedAt,
    }));
    const favNews = mockNews.filter(n => favorites.includes(n.id)).map(n => ({
      type: 'news' as const,
      id: n.id,
      titleZh: n.titleZh,
      titleIt: n.titleIt,
      descZh: n.summaryZh,
      descIt: n.summaryIt,
      category: n.category,
      updatedAt: n.publishedAt,
    }));
    return [...favProjects, ...favNews].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [favorites]);

  const toggleTopic = (key: ProjectCategory | 'general') => {
    setSelectedTopics(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  };

  const handleSaveProfile = () => {
    if (user) {
      setUser({
        ...user,
        nameZh: editForm.nameZh,
        nameIt: editForm.nameIt,
        email: editForm.email,
      });
    }
    setEditingProfile(false);
  };

  const tabs: { key: ProfileTab; icon: typeof Heart; zh: string; it: string }[] = [
    { key: 'favorites', icon: Heart, zh: '我的收藏', it: 'Preferiti' },
    { key: 'history', icon: BookOpen, zh: '翻译历史', it: 'Cronologia' },
    { key: 'subscription', icon: Settings, zh: '订阅设置', it: 'Impostazioni' },
  ];

  return (
    <div className="min-h-screen bg-ivory-50">
      <div className="container mx-auto px-4 py-8">
        <div className="card relative overflow-hidden mb-8 p-8">
          <div className="absolute inset-0 bg-pattern opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-cnit rounded-full blur-3xl opacity-10 -translate-y-1/3 translate-x-1/3" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-cnit shadow-gold flex items-center justify-center text-white text-3xl font-bold">
                {(lang === 'zh' ? displayUser.nameZh : displayUser.nameIt).charAt(0)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-white shadow-elegant flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-warm-gold-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display-zh font-semibold text-charcoal-600 mb-1">
                {displayUser.nameZh}
              </h1>
              <p className="text-lg font-display-it text-it-green-600 mb-2">
                {displayUser.nameIt}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-charcoal-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-warm-gold-600" />
                  {t(displayUser.role, 'Utente Premium')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-warm-gold-600" />
                  {displayUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditForm({
                  nameZh: displayUser.nameZh,
                  nameIt: displayUser.nameIt,
                  email: displayUser.email,
                });
                setEditingProfile(true);
              }}
              className="btn-secondary"
            >
              <Pencil className="w-4 h-4" />
              {t('编辑资料', 'Modifica Profilo')}
            </button>
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
                    {t(tab.zh, tab.it)}
                    {tab.key === 'favorites' && favorites.length > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-xs',
                        active ? 'bg-cn-red-50 text-cn-red-500' : 'bg-charcoal-100 text-charcoal-400'
                      )}>
                        {favorites.length}
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
            {activeTab === 'favorites' && (
              <div>
                {favoriteItems.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ivory-100 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-charcoal-200" />
                    </div>
                    <p className="text-charcoal-500 mb-1">{t('还没有收藏任何内容', 'Nessun preferito ancora')}</p>
                    <p className="text-sm text-charcoal-400">
                      {t('前往项目库或资讯中心，发现感兴趣的内容', 'Esplora i progetti e le notizie per scoprire contenuti interessanti')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteItems.map((item) => {
                      const cat = categoryLabels[item.category];
                      const Icon = item.type === 'project' ? Briefcase : Newspaper;
                      return (
                        <div key={`${item.type}-${item.id}`} className="card card-hover group relative p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className={cat.className}>{t(cat.zh, cat.it)}</span>
                              <span className="text-xs text-charcoal-300 flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {item.type === 'project' ? t('项目', 'Progetto') : t('资讯', 'Notizia')}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="p-1.5 rounded-lg text-cn-red-500 hover:bg-cn-red-50 transition-colors"
                              title={t('取消收藏', 'Rimuovi preferito')}
                            >
                              <HeartOff className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="font-semibold text-charcoal-600 mb-1.5 line-clamp-1 group-hover:text-cn-red-500 transition-colors">
                            {lang === 'zh' ? item.titleZh : item.titleIt}
                          </h3>
                          <p className="text-sm font-sans-it text-charcoal-300 mb-3 line-clamp-1">
                            {lang === 'zh' ? item.titleIt : item.titleZh}
                          </p>
                          <p className="text-sm text-charcoal-400 leading-relaxed line-clamp-2 mb-4">
                            {lang === 'zh' ? item.descZh : item.descIt}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-charcoal-50">
                            <span className="text-xs text-charcoal-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.updatedAt, lang)}
                            </span>
                            <span className="text-xs text-warm-gold-600 flex items-center gap-1 font-medium">
                              {t('查看详情', 'Dettagli')}
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {mockTranslationHistory.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ivory-100 flex items-center justify-center">
                      <Languages className="w-8 h-8 text-charcoal-200" />
                    </div>
                    <p className="text-charcoal-500">{t('暂无翻译记录', 'Nessuna cronologia di traduzione')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockTranslationHistory.map((item) => (
                      <div key={item.id} className="card p-5 hover:shadow-hover transition-all group">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={cn(
                                'tag text-xs',
                                item.source === 'zh' ? 'tag-cn' : 'tag-it'
                              )}>
                                {item.source === 'zh' ? '中文' : 'Italiano'}
                              </span>
                              <ChevronRight className="w-3 h-3 text-warm-gold-500" />
                              <span className={cn(
                                'tag text-xs',
                                item.target === 'zh' ? 'tag-cn' : 'tag-it'
                              )}>
                                {item.target === 'zh' ? '中文' : 'Italiano'}
                              </span>
                              {item.scene && (
                                <span className="tag-gold text-xs">
                                  {item.scene === 'visa' && t('签证', 'Visto')}
                                  {item.scene === 'medical' && t('医疗', 'Medico')}
                                  {item.scene === 'legal' && t('法律', 'Legale')}
                                  {item.scene === 'general' && t('通用', 'Generale')}
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
                                  {item.source === 'zh' ? t('原文', 'Originale') : t('原文', 'Originale')}
                                </p>
                                <p className="text-sm text-charcoal-600 line-clamp-2 leading-relaxed">
                                  {item.sourceText}
                                </p>
                              </div>
                              <div className="rounded-lg bg-it-green-50/50 p-3">
                                <p className="text-xs text-it-green-600 mb-1">
                                  {t('译文', 'Traduzione')}
                                </p>
                                <p className="text-sm text-charcoal-600 line-clamp-2 leading-relaxed">
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

                <div className="pt-4">
                  <button className="btn-primary">
                    <Sparkles className="w-4 h-4" />
                    {t('保存设置', 'Salva Impostazioni')}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, nameZh: e.target.value }))}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, nameIt: e.target.value }))}
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
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
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
    </div>
  );
}
