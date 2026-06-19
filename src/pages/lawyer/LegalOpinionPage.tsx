import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ArrowLeft,
  Scale,
  AlertTriangle,
  Lightbulb,
  Gavel,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Paperclip,
  Download,
  User,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { useConsultationStore } from '@/stores/consultation.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import { useAuthStore } from '@/stores/auth.store';
import { getCategoryLabel, formatFileSize, formatDate } from '@/utils/format';
import type { Lawyer, EvidenceFile } from '@/types';
import { mockUsers } from '@/mock/data';
import { cn } from '@/lib/utils';

export default function LegalOpinionPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { getConsultationById } = useConsultationStore();
  const { lawyers, getLawyerById } = useLawyerStore();
  const { currentUser, role } = useAuthStore();

  const consultation = useMemo(() => getConsultationById(id), [id, getConsultationById]);

  const currentLawyer = useMemo(() => {
    if (role === 'lawyer' && currentUser) {
      return getLawyerById((currentUser as Lawyer).id) || (currentUser as Lawyer);
    }
    return lawyers.find((l) => l.verifyStatus === 'approved') || null;
  }, [currentUser, role, getLawyerById, lawyers]);

  const user = useMemo(
    () => (consultation ? mockUsers.find((u) => u.id === consultation.userId) : undefined),
    [consultation]
  );

  const [caseSummary, setCaseSummary] = useState('');
  const [legalAnalysis, setLegalAnalysis] = useState('');
  const [relatedLaws, setRelatedLaws] = useState<string[]>(['']);
  const [suggestions, setSuggestions] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (consultation) {
      const categoryLabel = getCategoryLabel(consultation.category);
      setCaseSummary(
        `一、案件基本情况\n\n` +
          `本案为${categoryLabel}纠纷案件。\n\n` +
          `当事人（咨询人）于${formatDate(consultation.createdAt, 'YYYY年MM月DD日')}就以下问题提出咨询：\n\n` +
          `${consultation.title}\n\n` +
          `二、事实陈述\n\n` +
          `根据咨询人陈述：${consultation.description}\n\n` +
          `三、证据材料\n\n` +
          `${consultation.evidenceFiles.length > 0
            ? consultation.evidenceFiles.map((f, i) => `${i + 1}. ${f.originalName}`).join('\n')
            : '目前暂无相关证据材料，建议进一步收集补充。'
          }`
      );

      setLegalAnalysis(
        `一、法律关系分析\n\n` +
          `根据上述事实，本案涉及的主要法律关系为${categoryLabel}法律关系。\n\n` +
          `二、争议焦点\n\n` +
          `1. 案件核心事实的认定问题\n` +
          `2. 相关法律条款的适用问题\n` +
          `3. 责任划分与赔偿计算问题\n\n` +
          `三、法律适用\n\n` +
          `结合本案事实，应适用《民法典》及相关司法解释的规定，具体法律条文见"相关法律条文"部分。`
      );

      setRelatedLaws([
        '《中华人民共和国民法典》第一百七十六条',
        '《中华人民共和国民法典》第五百零九条',
      ]);

      setSuggestions(
        `一、协商解决方案\n\n` +
          `建议优先尝试与对方进行友好协商，争取达成和解协议，以节约时间和诉讼成本。\n\n` +
          `二、证据收集建议\n\n` +
          `1. 收集和整理与案件相关的所有书面证据\n` +
          `2. 如有证人，提前联系并获取证人证言\n` +
          `3. 对电子证据进行公证固化\n\n` +
          `三、法律途径建议\n\n` +
          `如协商不成，可考虑以下法律途径：\n` +
          `1. 向人民调解委员会申请调解\n` +
          `2. 向有管辖权的人民法院提起诉讼\n` +
          `3. 如涉及仲裁条款，可申请仲裁`
      );

      setRiskAssessment(
        `一、诉讼风险提示\n\n` +
          `1. 证据不足风险：如关键证据缺失，可能导致主张不被法院采纳\n` +
          `2. 时效风险：请注意诉讼时效期间，避免因超过时效而丧失胜诉权\n` +
          `3. 执行风险：即使胜诉，如对方无财产可供执行，可能面临执行困难\n\n` +
          `二、成本提示\n\n` +
          `1. 诉讼费用：根据诉讼标的金额计算\n` +
          `2. 律师费用：可与律师协商确定收费方式和金额\n` +
          `3. 时间成本：诉讼程序通常需要3-6个月，复杂案件可能更长\n\n` +
          `三、其他注意事项\n\n` +
          `建议在采取法律行动前，充分评估案件的利弊和可能结果，做出理性决策。`
      );
    }
  }, [consultation]);

  const addLawInput = () => {
    setRelatedLaws([...relatedLaws, '']);
  };

  const removeLawInput = (index: number) => {
    if (relatedLaws.length > 1) {
      setRelatedLaws(relatedLaws.filter((_, i) => i !== index));
    }
  };

  const updateLaw = (index: number, value: string) => {
    const newLaws = [...relatedLaws];
    newLaws[index] = value;
    setRelatedLaws(newLaws);
  };

  const handleSaveDraft = () => {
    toast.success('草稿已保存');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    const validLaws = relatedLaws.filter((l) => l.trim());
    if (!caseSummary.trim() || !legalAnalysis.trim() || validLaws.length === 0 || !suggestions.trim()) {
      toast.warning('请填写完整的法律意见内容');
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitSuccess(true);
    toast.success('法律意见已提交归档');

    setTimeout(() => {
      navigate('/lawyer/cases');
    }, 2000);
  };

  const FormSection = ({
    icon: Icon,
    title,
    subtitle,
    required,
    children,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle?: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
          <Icon className="h-4 w-4 text-primary-700" />
        </div>
        <div>
          <h3 className="font-serif text-base font-semibold text-primary-900 flex items-center gap-1.5">
            {title}
            {required && <span className="text-red-500">*</span>}
          </h3>
          {subtitle && <p className="text-xs text-primary-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  const TextareaField = ({
    value,
    onChange,
    placeholder,
    rows = 6,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-primary-100 bg-primary-50/30 px-4 py-3 text-sm text-primary-800 placeholder:text-primary-400 focus:border-accent-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all resize-none leading-relaxed"
    />
  );

  if (!consultation) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-16 w-16 text-primary-300 mb-4" />
          <h2 className="font-serif text-xl font-semibold text-primary-700 mb-2">案件不存在</h2>
          <p className="text-sm text-primary-500 mb-4">未找到对应的咨询案件</p>
          <Button variant="primary" onClick={() => navigate('/lawyer/cases')}>
            返回案件列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ToastContainer />

      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="flex flex-col items-center rounded-2xl bg-white px-12 py-10 shadow-2xl"
            >
              <div className="relative mb-5">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-emerald-400/30"
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary-900 mb-1.5">提交成功</h3>
              <p className="text-sm text-primary-500">法律意见已归档，即将返回案件列表...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/50 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-primary-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-700" />
                  <h3 className="font-serif text-lg font-semibold text-primary-900">预览法律意见</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  关闭
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8 pb-6 border-b-2 border-accent-gold/30">
                    <h1 className="font-serif text-2xl font-bold text-primary-900 mb-2">法律意见摘要</h1>
                    <p className="text-sm text-primary-500">
                      {currentLawyer?.firmName || ''} · {currentLawyer ? `执业${currentLawyer.practiceYears}年` : ''}
                    </p>
                  </div>

                  <div className="space-y-6 text-primary-800">
                    <section>
                      <h2 className="font-serif text-base font-semibold text-primary-900 mb-2 pb-1 border-b border-primary-100">
                        一、案件摘要
                      </h2>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-700">
                        {caseSummary || '（未填写）'}
                      </div>
                    </section>

                    <section>
                      <h2 className="font-serif text-base font-semibold text-primary-900 mb-2 pb-1 border-b border-primary-100">
                        二、法律分析
                      </h2>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-700">
                        {legalAnalysis || '（未填写）'}
                      </div>
                    </section>

                    <section>
                      <h2 className="font-serif text-base font-semibold text-primary-900 mb-2 pb-1 border-b border-primary-100">
                        三、相关法律条文
                      </h2>
                      <div className="text-sm leading-relaxed text-primary-700">
                        {relatedLaws.filter((l) => l.trim()).length > 0 ? (
                          <ol className="list-decimal pl-5 space-y-1">
                            {relatedLaws
                              .filter((l) => l.trim())
                              .map((law, i) => (
                                <li key={i}>{law}</li>
                              ))}
                          </ol>
                        ) : (
                          '（未填写）'
                        )}
                      </div>
                    </section>

                    <section>
                      <h2 className="font-serif text-base font-semibold text-primary-900 mb-2 pb-1 border-b border-primary-100">
                        四、处理建议
                      </h2>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-700">
                        {suggestions || '（未填写）'}
                      </div>
                    </section>

                    <section>
                      <h2 className="font-serif text-base font-semibold text-primary-900 mb-2 pb-1 border-b border-primary-100">
                        五、风险提示
                      </h2>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap text-primary-700">
                        {riskAssessment || '（未填写）'}
                      </div>
                    </section>
                  </div>

                  <div className="mt-10 pt-6 border-t border-primary-100 text-right">
                    <p className="text-sm text-primary-600 font-medium">
                      {currentLawyer?.firmName || ''}
                    </p>
                    <p className="text-sm text-primary-500 mt-1">
                      出具日期：{formatDate(new Date().toISOString(), 'YYYY年MM月DD日')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-primary-100 px-6 py-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  继续编辑
                </Button>
                <Button
                  variant="gold"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => toast.success('PDF 生成中...')}
                >
                  下载 PDF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/lawyer/cases')}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-serif text-2xl font-bold text-primary-900">《法律意见摘要》</h1>
              <p className="text-sm text-primary-500">基于案件事实提供专业法律分析与建议</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{getCategoryLabel(consultation.category)}</Badge>
            <Badge variant="warning">草稿</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <Card shadow={true} bordered={true}>
              <CardHeader className="pb-3">
                <h2 className="font-serif text-base font-semibold text-primary-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary-600" />
                  案件基本信息
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-primary-400 mb-1">咨询标题</p>
                  <p className="text-sm font-medium text-primary-800 leading-relaxed">
                    {consultation.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-primary-400 mb-1">案由分类</p>
                  <p className="text-sm text-primary-700">{getCategoryLabel(consultation.category)}</p>
                </div>

                <div>
                  <p className="text-xs text-primary-400 mb-1">当事人</p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100">
                      <User className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                    <span className="text-sm text-primary-700">
                      {user?.nickname || user?.realName || '匿名用户'}
                    </span>
                  </div>
                </div>

                {consultation.region && (
                  <div>
                    <p className="text-xs text-primary-400 mb-1">所属地区</p>
                    <div className="flex items-center gap-1.5 text-sm text-primary-700">
                      <MapPin className="h-3.5 w-3.5 text-primary-400" />
                      {consultation.region}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-primary-400 mb-1">咨询时间</p>
                  <div className="flex items-center gap-1.5 text-sm text-primary-700">
                    <Calendar className="h-3.5 w-3.5 text-primary-400" />
                    {formatDate(consultation.createdAt, 'YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card shadow={true} bordered={true}>
              <CardHeader className="pb-3">
                <h2 className="font-serif text-base font-semibold text-primary-900 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary-600" />
                  用户描述
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-primary-600 whitespace-pre-wrap">
                  {consultation.description}
                </p>
              </CardContent>
            </Card>

            <Card shadow={true} bordered={true}>
              <CardHeader className="pb-3">
                <h2 className="font-serif text-base font-semibold text-primary-900 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary-600" />
                  证据材料
                  <span className="ml-auto text-xs text-primary-400 font-normal">
                    {consultation.evidenceFiles.length} 份
                  </span>
                </h2>
              </CardHeader>
              <CardContent>
                {consultation.evidenceFiles.length === 0 ? (
                  <p className="text-sm text-primary-400 text-center py-4">暂无证据材料</p>
                ) : (
                  <div className="space-y-2">
                    {consultation.evidenceFiles.map((file: EvidenceFile) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50/40 p-3 hover:border-accent-gold/40 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                          {file.fileType === 'image' ? (
                            <svg className="h-4 w-4 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          ) : (
                            <FileText className="h-4 w-4 text-primary-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary-800 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-primary-400">{formatFileSize(file.fileSize)}</p>
                        </div>
                        <button className="shrink-0 rounded-md p-1.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card shadow={true} bordered={true}>
              <CardContent className="p-6">
                <div className="mb-6 rounded-lg bg-gradient-to-r from-accent-gold/10 to-transparent border border-accent-gold/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-gold/20">
                      <Sparkles className="h-4 w-4 text-accent-gold-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-800">
                        AI 智能辅助
                      </p>
                      <p className="text-xs text-primary-500 mt-0.5">
                        已根据案件信息预填充法律意见模板，请仔细核对并修改后提交
                      </p>
                    </div>
                  </div>
                </div>

                <FormSection
                  icon={FileText}
                  title="案件摘要"
                  subtitle="简要概述案件事实、当事人及争议焦点"
                  required
                >
                  <TextareaField
                    value={caseSummary}
                    onChange={setCaseSummary}
                    placeholder="请输入案件摘要，包括当事人信息、案件事实、争议焦点等..."
                    rows={8}
                  />
                </FormSection>

                <FormSection
                  icon={Gavel}
                  title="法律分析"
                  subtitle="对案件涉及的法律关系、争议焦点进行专业分析"
                  required
                >
                  <TextareaField
                    value={legalAnalysis}
                    onChange={setLegalAnalysis}
                    placeholder="请输入法律分析，包括法律关系认定、争议焦点分析、法律适用等..."
                    rows={8}
                  />
                </FormSection>

                <FormSection
                  icon={Scale}
                  title="相关法律条文"
                  subtitle="列明本案适用的法律法规及司法解释"
                  required
                >
                  <div className="space-y-2">
                    <AnimatePresence>
                      {relatedLaws.map((law, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-semibold text-primary-600">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={law}
                            onChange={(e) => updateLaw(index, e.target.value)}
                            placeholder="例如：《中华人民共和国民法典》第一百七十六条"
                            className="flex-1 rounded-lg border border-primary-100 bg-primary-50/30 px-4 py-2.5 text-sm text-primary-800 placeholder:text-primary-400 focus:border-accent-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all"
                          />
                          <button
                            onClick={() => removeLawInput(index)}
                            disabled={relatedLaws.length <= 1}
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                              relatedLaws.length <= 1
                                ? 'text-primary-300 cursor-not-allowed'
                                : 'text-primary-400 hover:bg-red-50 hover:text-red-500'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <button
                      onClick={addLawInput}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary-200 px-4 py-2.5 text-sm text-primary-500 hover:border-accent-gold hover:text-accent-gold-dark hover:bg-accent-gold/5 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      添加法律条文
                    </button>
                  </div>
                </FormSection>

                <FormSection
                  icon={Lightbulb}
                  title="处理建议"
                  subtitle="提供切实可行的解决方案与操作建议"
                  required
                >
                  <TextareaField
                    value={suggestions}
                    onChange={setSuggestions}
                    placeholder="请输入处理建议，包括协商、调解、诉讼等多种解决方案..."
                    rows={8}
                  />
                </FormSection>

                <FormSection
                  icon={AlertTriangle}
                  title="风险提示"
                  subtitle="提示可能的法律风险及注意事项"
                >
                  <TextareaField
                    value={riskAssessment}
                    onChange={setRiskAssessment}
                    placeholder="请输入风险提示，包括诉讼风险、执行风险、时效风险等..."
                    rows={6}
                  />
                </FormSection>

                <div className="mt-8 pt-6 border-t border-primary-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <p className="text-xs text-primary-400">
                    提交后将自动归档，用户可在案件详情中查看
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      leftIcon={<Eye className="h-4 w-4" />}
                      onClick={handlePreview}
                    >
                      预览 PDF
                    </Button>
                    <Button
                      variant="ghost"
                      leftIcon={<Save className="h-4 w-4" />}
                      onClick={handleSaveDraft}
                    >
                      保存草稿
                    </Button>
                    <Button
                      variant="gold"
                      leftIcon={<Send className="h-4 w-4" />}
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '提交中...' : '提交归档'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
