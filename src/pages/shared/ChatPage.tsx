import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Flame,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image,
  Paperclip,
  Send,
  Trash2,
  Download,
  Check,
  FileText,
  X,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { useConsultationStore } from '@/stores/consultation.store';
import { useLawyerStore } from '@/stores/lawyer.store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import ChatMessageBubble from '@/components/features/ChatMessageBubble';
import EvidencePreview from '@/components/features/EvidencePreview';
import EvaluationStars from '@/components/features/EvaluationStars';
import { getCategoryLabel, getStatusLabel, formatDate } from '@/utils/format';
import type { UserRole, EvidenceFile } from '@/types';

const burnDurationOptions = [
  { label: '10秒', value: 10 },
  { label: '30秒', value: 30 },
  { label: '1分钟', value: 60 },
  { label: '5分钟', value: 300 },
];

type MobileTab = 'chat' | 'evidence';

export default function ChatPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { currentUser, role } = useAuthStore();
  const { messages, burnAfterReadEnabled, burnSeconds, fetchMessages, sendMessage, burnMessage, toggleBurnAfterRead, setBurnSeconds } = useChatStore();
  const { getConsultationById, updateConsultationStatus } = useConsultationStore();
  const { getLawyerById } = useLawyerStore();

  const [evidenceCollapsed, setEvidenceCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [inputText, setInputText] = useState('');
  const [singleMessageBurn, setSingleMessageBurn] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBurnMenu, setShowBurnMenu] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [closeRemark, setCloseRemark] = useState('');
  const [evalRating, setEvalRating] = useState(0);
  const [evalContent, setEvalContent] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');

  const consultation = getConsultationById(id);
  const consultationMessages = messages[id] || [];

  useEffect(() => {
    fetchMessages(id);
  }, [id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consultationMessages.length]);

  const otherParty = (() => {
    if (!consultation) return null;
    if (role === 'user') {
      const lawyer = consultation.lawyerId ? getLawyerById(consultation.lawyerId) : null;
      return {
        name: lawyer ? `律师 ${lawyer.firmName.split('律师')[0]}` : '公益律师',
        avatar: undefined,
        role: 'lawyer' as UserRole,
        roleLabel: '公益律师',
        online: true,
      };
    }
    return {
      name: '咨询用户',
      avatar: undefined,
      role: 'user' as UserRole,
      roleLabel: '咨询用户',
      online: true,
    };
  })();

  const isOwnMessage = (senderId: string) => {
    if (!currentUser) return false;
    if ('userId' in currentUser) {
      return senderId === (currentUser as { userId: string }).userId || senderId === currentUser.id;
    }
    return senderId === currentUser.id;
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !consultation || !currentUser) return;

    const senderId = 'userId' in currentUser
      ? (currentUser as { userId: string }).userId || currentUser.id
      : currentUser.id;

    sendMessage(id, {
      consultationId: id,
      senderId,
      senderRole: role || 'user',
      content: inputText.trim(),
      messageType: 'text',
      isEncrypted: true,
      isRead: false,
      burnAfterReading: singleMessageBurn || burnAfterReadEnabled,
      burnDuration: singleMessageBurn || burnAfterReadEnabled ? burnSeconds : undefined,
    });

    setInputText('');
    setSingleMessageBurn(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUploadEvidence = (type: 'file' | 'image') => {
    if (type === 'file') {
      fileInputRef.current?.click();
    } else {
      imageInputRef.current?.click();
    }
  };

  const handleCloseConsultation = () => {
    updateConsultationStatus(id, 'closed');
    setShowCloseModal(false);
    if (role === 'lawyer') {
      navigate(`/legal-opinion/generate/${id}`);
    }
  };

  const handleSubmitEvaluation = () => {
    if (evalRating === 0) return;
    updateConsultationStatus(id, 'reviewed');
    setShowEvalModal(false);
  };

  useEffect(() => {
    if (consultation?.status === 'closed' && role === 'user') {
      setShowEvalModal(true);
    }
  }, [consultation?.status, role]);

  if (!consultation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-900">
        <p className="text-xl text-white/60">咨询不存在</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-primary-950 text-white">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between border-b border-primary-800/50 bg-primary-900/80 px-4 py-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-primary-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {otherParty && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-gradient text-sm font-semibold text-primary-900">
                  {otherParty.name.charAt(0)}
                </div>
                {otherParty.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-primary-900 bg-emerald-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{otherParty.name}</span>
                  <Badge
                    variant="info"
                    className="bg-primary-700/60 text-primary-200 border-primary-600/50"
                  >
                    {otherParty.roleLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {otherParty.online ? '在线' : '离线'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            端到端加密
          </div>

          <div className="relative">
            <button
              onClick={() => setShowBurnMenu(!showBurnMenu)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                burnAfterReadEnabled
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 bg-white/5 text-white/50'
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              阅后即焚
              {burnAfterReadEnabled && (
                <span className="ml-1 text-[10px] opacity-80">
                  {burnDurationOptions.find((o) => o.value === burnSeconds)?.label}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showBurnMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-primary-700/50 bg-primary-800 shadow-2xl"
                >
                  <div className="border-b border-primary-700/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">开启阅后即焚</span>
                      <button
                        onClick={() => toggleBurnAfterRead(!burnAfterReadEnabled)}
                        className={cn(
                          'relative h-5 w-9 rounded-full transition-colors',
                          burnAfterReadEnabled ? 'bg-orange-500' : 'bg-primary-600'
                        )}
                      >
                        <motion.span
                          animate={{ x: burnAfterReadEnabled ? 18 : 2 }}
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                        />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    {burnDurationOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setBurnSeconds(option.value);
                          if (!burnAfterReadEnabled) toggleBurnAfterRead(true);
                          setShowBurnMenu(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          burnSeconds === option.value && burnAfterReadEnabled
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'text-white/70 hover:bg-primary-700/50'
                        )}
                      >
                        {option.label}
                        {burnSeconds === option.value && burnAfterReadEnabled && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-primary-800 hover:text-white"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-primary-700/50 bg-primary-800 shadow-2xl"
                >
                  <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-primary-700/50">
                    <Trash2 className="h-4 w-4" />
                    清空会话
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-primary-700/50">
                    <Download className="h-4 w-4" />
                    下载证据
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-400">
            <Shield className="h-3 w-3" />
            加密
          </div>
        </div>
      </motion.header>

      <div className="md:hidden border-b border-primary-800/50 bg-primary-900/50">
        <div className="flex">
          <button
            onClick={() => setMobileTab('chat')}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'chat'
                ? 'text-accent-gold border-b-2 border-accent-gold'
                : 'text-white/50'
            )}
          >
            会话
          </button>
          <button
            onClick={() => setMobileTab('evidence')}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'evidence'
                ? 'text-accent-gold border-b-2 border-accent-gold'
                : 'text-white/50'
            )}
          >
            证据材料
            {consultation.evidenceFiles.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-700 px-1.5 py-0.5 text-[10px]">
                {consultation.evidenceFiles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence>
          {(mobileTab === 'evidence' || !evidenceCollapsed) && (
            <motion.aside
              initial={false}
              animate={{
                width: evidenceCollapsed ? 0 : 280,
                opacity: evidenceCollapsed ? 0 : 1,
              }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={cn(
                'shrink-0 overflow-hidden border-r border-primary-800/50 bg-primary-900/30',
                mobileTab === 'evidence' ? 'block w-full md:hidden' : 'hidden md:block'
              )}
            >
              <div className="flex h-full flex-col" style={{ width: 280 }}>
                <div className="flex items-center justify-between border-b border-primary-800/50 px-4 py-3">
                  <h3 className="font-serif text-base font-semibold text-white">证据材料</h3>
                  <span className="text-xs text-white/40">
                    {consultation.evidenceFiles.length} 个文件
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
                  {consultation.evidenceFiles.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-800/50">
                        <FileText className="h-6 w-6 text-white/30" />
                      </div>
                      <p className="text-sm text-white/40">暂无证据材料</p>
                    </div>
                  ) : (
                    consultation.evidenceFiles.map((file) => (
                      <EvidencePreview key={file.id} file={file} />
                    ))
                  )}
                </div>

                <div className="border-t border-primary-800/50 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-primary-700 bg-primary-800/30 text-white/80 hover:border-accent-gold hover:text-accent-gold"
                    leftIcon={<Upload className="h-4 w-4" />}
                    onClick={() => handleUploadEvidence('file')}
                  >
                    上传证据
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {!evidenceCollapsed && (
          <button
            onClick={() => setEvidenceCollapsed(true)}
            className="hidden md:flex h-9 w-5 -ml-2.5 self-center items-center justify-center rounded-r-lg border border-l-0 border-primary-700/50 bg-primary-800/50 text-white/50 transition-colors hover:bg-primary-700 hover:text-white z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {evidenceCollapsed && (
          <button
            onClick={() => setEvidenceCollapsed(false)}
            className="hidden md:flex h-12 w-6 items-center justify-center rounded-r-lg border border-l-0 border-primary-700/50 bg-primary-800/50 text-white/50 transition-colors hover:bg-primary-700 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden',
            mobileTab !== 'chat' && 'hidden md:flex'
          )}
        >
          <div className="flex-1 overflow-y-auto pattern-grid bg-primary-950/50 scrollbar-thin">
            <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400">
                  <Shield className="h-3.5 w-3.5" />
                  本会话已启用端到端加密，消息阅后即焚
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-xs text-white/30"
              >
                {formatDate(consultation.createdAt, 'YYYY年MM月DD日 HH:mm')}
              </motion.div>

              <AnimatePresence initial={false}>
                {consultationMessages.map((message, index) => {
                  if (message.messageType === 'system') {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="text-center text-xs text-white/40"
                      >
                        {message.content}
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                    >
                      <ChatMessageBubble
                        message={message}
                        isOwn={isOwnMessage(message.senderId)}
                        onBurn={(msgId) => burnMessage(id, msgId)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {consultation.status !== 'closed' && consultation.status !== 'reviewed' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="border-t border-primary-800/50 bg-primary-900/80 px-4 py-3 backdrop-blur-md"
            >
              <div className="mx-auto max-w-3xl">
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUploadEvidence('file')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-primary-800 hover:text-white"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleUploadEvidence('image')}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-primary-800 hover:text-white"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSingleMessageBurn(!singleMessageBurn)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                        singleMessageBurn
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'text-white/50 hover:bg-primary-800 hover:text-white'
                      )}
                    >
                      <Flame className={cn('h-5 w-5', singleMessageBurn && 'animate-flame')} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
                      rows={1}
                      className="max-h-32 min-h-[40px] w-full resize-none rounded-xl border border-primary-700/50 bg-primary-800/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent-gold/50 focus:outline-none focus:ring-2 focus:ring-accent-gold/20 scrollbar-thin"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {role === 'lawyer' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden border-primary-700 bg-primary-800/30 text-white/80 hover:border-red-500/50 hover:text-red-400 sm:flex"
                        onClick={() => setShowCloseModal(true)}
                      >
                        结案
                      </Button>
                    )}
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200',
                        inputText.trim()
                          ? 'bg-gold-gradient text-primary-900 shadow-gold hover:scale-105'
                          : 'bg-primary-800 text-white/30'
                      )}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {role === 'lawyer' && (
                  <div className="mt-2 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-primary-700 bg-primary-800/30 text-white/80 hover:border-red-500/50 hover:text-red-400"
                      onClick={() => setShowCloseModal(true)}
                    >
                      结束咨询并生成法律意见
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(consultation.status === 'closed' || consultation.status === 'reviewed') && (
            <div className="border-t border-primary-800/50 bg-primary-900/80 px-4 py-4 text-center backdrop-blur-md">
              <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {getStatusLabel(consultation.status)}
              </Badge>
              {consultation.closedAt && (
                <p className="mt-2 text-xs text-white/40">
                  结案时间：{formatDate(consultation.closedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => e.target.value = ''}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.value = ''}
      />

      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="确认结案"
        width="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowCloseModal(false)}
              className="border-primary-200"
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleCloseConsultation}>
              确认结案
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900">结束本次咨询</h4>
              <p className="mt-1 text-sm text-amber-700">
                结案后将无法继续发送消息，系统将引导您生成法律意见。
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              结案备注（可选）
            </label>
            <textarea
              value={closeRemark}
              onChange={(e) => setCloseRemark(e.target.value)}
              placeholder="请输入本次咨询的结案备注..."
              rows={3}
              className="input-base resize-none"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showEvalModal}
        onClose={() => {}}
        title="服务评价"
        width="max-w-md"
        closable={false}
        maskClosable={false}
        footer={
          <>
            <Button
              variant="primary"
              onClick={handleSubmitEvaluation}
              disabled={evalRating === 0}
              className="w-full"
            >
              提交评价
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-primary-500 mb-3">请为本次公益法律服务打分</p>
            <div className="flex justify-center">
              <EvaluationStars
                rating={evalRating}
                onChange={setEvalRating}
                size="lg"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              评价内容（可选）
            </label>
            <textarea
              value={evalContent}
              onChange={(e) => setEvalContent(e.target.value)}
              placeholder="请分享您的咨询体验，帮助我们改进服务..."
              rows={3}
              className="input-base resize-none"
            />
          </div>

          <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-primary-700">投诉建议</span>
              </div>
              <button
                onClick={() => setIsComplaint(!isComplaint)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors',
                  isComplaint ? 'bg-red-500' : 'bg-primary-200'
                )}
              >
                <motion.span
                  animate={{ x: isComplaint ? 18 : 2 }}
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                />
              </button>
            </div>

            <AnimatePresence>
              {isComplaint && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={complaintReason}
                    onChange={(e) => setComplaintReason(e.target.value)}
                    placeholder="请描述您的投诉原因..."
                    rows={2}
                    className="mt-3 input-base resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Modal>
    </div>
  );
}
