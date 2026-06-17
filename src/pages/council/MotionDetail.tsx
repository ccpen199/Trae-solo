import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Calendar, Paperclip, Download, CheckCircle2, XCircle,
  MinusCircle, Hash, Blocks, Clock, FileText, Copy, Share2, FileDown,
  ChevronDown, ChevronUp, Users, Building2, Timer, FileSpreadsheet,
  Image as ImageIcon, File,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from "@/components/ui";
import { cn, formatDate, getMotionStatusLabel, formatPercent, formatFileSize, copyToClipboard, getTimeRemaining } from "@/utils";

type VoteType = "agree" | "disagree" | "abstain";
type VoteViewMode = "realname" | "anonymous";

interface VoteRecordItem { id: string; name: string; building: string; vote: VoteType; }
interface ReviewRecord { id: string; operator: string; time: string; action: string; remark: string; details: string; }

const voteConfig: Record<VoteType, { label: string; icon: typeof CheckCircle2; variant: "success" | "danger" | "warning"; bg: string; text: string; border: string; }> = {
  agree: { label: "赞成", icon: CheckCircle2, variant: "success", bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
  disagree: { label: "反对", icon: XCircle, variant: "danger", bg: "bg-rose-50 hover:bg-rose-100", text: "text-rose-600", border: "border-rose-200" },
  abstain: { label: "弃权", icon: MinusCircle, variant: "warning", bg: "bg-slate-50 hover:bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

const fileIconMap: Record<string, { icon: typeof File; color: string }> = {
  pdf: { icon: FileText, color: "text-rose-500" },
  doc: { icon: FileSpreadsheet, color: "text-blue-500" },
  docx: { icon: FileSpreadsheet, color: "text-blue-500" },
  xls: { icon: FileSpreadsheet, color: "text-emerald-500" },
  xlsx: { icon: FileSpreadsheet, color: "text-emerald-500" },
  jpg: { icon: ImageIcon, color: "text-amber-500" },
  png: { icon: ImageIcon, color: "text-amber-500" },
};

const getFileIcon = (type: string) => fileIconMap[type] || { icon: File, color: "text-slate-500" };

const mockVoteRecords: VoteRecordItem[] = [
  { id: "1", name: "张明华", building: "1号楼2单元301", vote: "agree" },
  { id: "2", name: "李建国", building: "2号楼1单元102", vote: "agree" },
  { id: "3", name: "王淑芬", building: "3号楼3单元503", vote: "disagree" },
  { id: "4", name: "赵志伟", building: "1号楼1单元201", vote: "agree" },
  { id: "5", name: "陈美丽", building: "5号楼2单元402", vote: "abstain" },
  { id: "6", name: "刘强", building: "2号楼3单元303", vote: "agree" },
  { id: "7", name: "周杰", building: "4号楼1单元601", vote: "disagree" },
  { id: "8", name: "吴敏", building: "3号楼2单元202", vote: "agree" },
];

const mockReviewRecords: ReviewRecord[] = [
  { id: "1", operator: "张明华", time: "2025-06-01 09:00", action: "发起投票", remark: "提交议案", details: "业委会主任张明华发起关于更换小区物业公司的议案，提交业委会内部审核。" },
  { id: "2", operator: "业委会", time: "2025-06-03 14:30", action: "开始投票", remark: "公示期结束", details: "7天公示期结束，未收到有效异议，议案正式进入投票阶段。" },
  { id: "3", operator: "系统", time: "2025-06-20 23:59", action: "结果公示", remark: "投票截止", details: "投票期结束，系统自动统计投票结果。共收回有效选票856张，赞成623票，反对156票，弃权77票。" },
  { id: "4", operator: "街道办", time: "2025-06-22 10:00", action: "复查确认", remark: "备案完成", details: "街道办事处对本次业主大会投票结果进行复查，确认程序合法、结果有效，予以备案。" },
];

const Section = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
    {children}
  </m.div>
);

export default function MotionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { motions, castVote } = useAppStore();
  const [voteMode, setVoteMode] = useState<VoteViewMode>("realname");
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [showBlockchain, setShowBlockchain] = useState(false);

  const motion = useMemo(() => motions.find((m) => m.id === id), [motions, id]);

  if (!motion) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">议案不存在</h3>
          <button onClick={() => navigate("/council")} className="text-primary-600 hover:underline">返回列表</button>
        </div>
      </div>
    );
  }

  const statusInfo = getMotionStatusLabel(motion.status);
  const votedCount = motion.voteStats.votedCount || 1;
  const totalVoters = motion.voteStats.totalVoters;
  const participationRate = (votedCount / totalVoters) * 100;
  const timeRemaining = getTimeRemaining(motion.voteEnd);
  const blockchainHash = motion.blockchainHash || "0x7a3f9c2e8b1d4c6a9f8e7b3d2c1a5f8e7b3d2c1a";

  const handleVote = (vote: VoteType) => { setSelectedVote(vote); setShowConfirm(true); };

  const handleConfirmVote = () => {
    if (selectedVote) {
      setShowConfirm(false);
      setShowBlockchain(true);
      castVote(motion.id, selectedVote);
      setTimeout(() => { setShowBlockchain(false); setHasVoted(true); }, 2500);
    }
  };

  const handleCopyHash = async () => {
    if (motion.blockchainHash) {
      await copyToClipboard(motion.blockchainHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <m.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/council")} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 返回议案列表
        </m.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-start gap-3 mb-4">
                    <Badge variant="primary" size="lg">{statusInfo.label}</Badge>
                    <Badge variant={motion.voteType === "anonymous" ? "info" : "secondary"} size="lg">
                      {motion.voteType === "anonymous" ? "匿名投票" : "实名投票"}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-4">{motion.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>发起人：{motion.initiatorName}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>发起时间：{formatDate(motion.publicityStart || motion.voteStart)}</span></div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Section delay={0.1}>
              <Card>
                <CardHeader><CardTitle>议案内容</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-slate-600 leading-relaxed space-y-3">
                    {motion.content.split("\n").map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </CardContent>
              </Card>
            </Section>

            {motion.attachments.length > 0 && (
              <Section delay={0.15}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="w-5 h-5 text-primary-600" /> 附件公示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {motion.attachments.map((att) => {
                        const fileType = att.name.split(".").pop()?.toLowerCase() || "";
                        const { icon: FileIcon, color } = getFileIcon(fileType);
                        return (
                          <m.div key={att.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileIcon className={cn("w-8 h-8", color)} />
                              <div>
                                <p className="font-medium text-slate-700">{att.name}</p>
                                <p className="text-sm text-slate-400">{formatFileSize(att.size)} · 上传于 {formatDate(motion.publicityStart)}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon"><Download className="w-5 h-5" /></Button>
                          </m.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {motion.status === "voting" && !hasVoted && (
              <Section delay={0.2}>
                <Card>
                  <CardHeader><CardTitle>投票表决</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {(Object.keys(voteConfig) as VoteType[]).map((v) => {
                        const { label, icon: Icon, bg, text, border } = voteConfig[v];
                        return (
                          <m.button key={v} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleVote(v)}
                            className={cn("flex items-center gap-3 px-8 py-4 rounded-xl font-medium border-2 transition-all flex-1 justify-center", bg, text, border)}>
                            <Icon className="w-6 h-6" /><span className="text-lg">{label}</span>
                          </m.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            {hasVoted && (
              <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 rounded-xl p-6 text-center border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-emerald-700 mb-1">投票成功</h3>
                <p className="text-emerald-600 text-sm">感谢您参与小区公共事务决策</p>
              </m.div>
            )}

            <Section delay={0.25}>
              <Card>
                <CardHeader><CardTitle>投票结果统计</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <m.circle cx="50" cy="50" r="42" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 264" }} animate={{ strokeDasharray: `${(participationRate / 100) * 264} 264` }}
                          transition={{ duration: 1.5, ease: "easeOut" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-primary-600">{formatPercent(participationRate)}</span>
                        <span className="text-xs text-slate-500">投票率</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      {(["agree", "disagree", "abstain"] as VoteType[]).map((v) => {
                        const { label, variant } = voteConfig[v];
                        const count = v === "agree" ? motion.voteStats.agreeCount : v === "disagree" ? motion.voteStats.disagreeCount : motion.voteStats.abstainCount;
                        return (
                          <div key={v}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">{label}</span>
                              <span className="font-medium text-slate-700">{count}票 ({formatPercent((count / votedCount) * 100)})</span>
                            </div>
                            <ProgressBar value={count} max={votedCount} variant={variant} size="sm" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center text-sm text-slate-500 mb-6">
                    已投票 <span className="font-semibold text-primary-600">{votedCount}</span> / {totalVoters} 人
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex gap-2 mb-4">
                      <Button variant={voteMode === "realname" ? "primary" : "ghost"} size="sm" onClick={() => setVoteMode("realname")}>实名投票</Button>
                      <Button variant={voteMode === "anonymous" ? "primary" : "ghost"} size="sm" onClick={() => setVoteMode("anonymous")}>匿名投票</Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {voteMode === "realname" ? (
                        mockVoteRecords.map((record) => {
                          const { icon: Icon, text } = voteConfig[record.vote];
                          return (
                            <div key={record.id} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-600">{record.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700">{record.name}</p>
                                  <p className="text-xs text-slate-400">{record.building}</p>
                                </div>
                              </div>
                              <div className={cn("flex items-center gap-1 text-sm", text)}><Icon className="w-4 h-4" /><span>{voteConfig[record.vote].label}</span></div>
                            </div>
                          );
                        })
                      ) : (
                        Array.from({ length: Math.min(votedCount, 8) }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>
                              <div><p className="text-sm text-slate-600">匿名业主</p><p className="text-xs text-slate-400">已投票</p></div>
                            </div>
                            <span className="text-sm text-slate-400">已参与</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            {(motion.status === "passed" || motion.status === "rejected") && (
              <Section delay={0.3}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Blocks className="w-5 h-5 text-primary-600" /> 区块链存证</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-6 mb-4">
                      <div className="relative w-48 h-48">
                        {[...Array(8)].map((_, i) => {
                          const angle = (i / 8) * Math.PI * 2;
                          return (
                            <m.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                              className="absolute w-4 h-4 bg-primary-400 rounded-full shadow-lg shadow-primary-200"
                              style={{ left: `calc(50% + ${Math.cos(angle) * 70}px - 8px)`, top: `calc(50% + ${Math.sin(angle) * 70}px - 8px)` }}>
                              <m.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                className="absolute inset-0 bg-primary-400 rounded-full" />
                            </m.div>
                          );
                        })}
                        <m.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Blocks className="w-8 h-8 text-white" />
                          </div>
                        </m.div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Hash className="w-4 h-4" /> 交易哈希</div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono text-slate-600 break-all flex-1">{blockchainHash.slice(0, 20)}...</p>
                          <Button variant="ghost" size="icon" onClick={handleCopyHash}>
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Blocks className="w-4 h-4" /> 区块高度</div>
                        <p className="text-lg font-semibold text-slate-700">#1,234,567</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Clock className="w-4 h-4" /> 上链时间</div>
                        <p className="text-sm text-slate-600">{formatDate(motion.voteEnd, "YYYY-MM-DD HH:mm:ss")}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Building2 className="w-4 h-4" /> 存证机构</div>
                        <p className="text-sm text-slate-600">街道办区块链节点</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => setShowBlockchain(true)}>
                        <Blocks className="w-4 h-4 mr-2" /> 查看链上详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Section>
            )}

            <Section delay={0.35}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary-600" /> 表决复查记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />
                    <div className="space-y-4">
                      {mockReviewRecords.map((record, index) => (
                        <m.div key={record.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }} className="relative pl-10">
                          <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary-500 border-4 border-white shadow" />
                          <div className="bg-slate-50 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setExpandedReview(expandedReview === record.id ? null : record.id)}>
                            <div className="flex items-start justify-between">
                              <div><p className="font-medium text-slate-700">{record.action}</p><p className="text-sm text-slate-500">{record.remark}</p></div>
                              <div className="text-right"><p className="text-sm text-slate-500">{record.time}</p><p className="text-xs text-slate-400">{record.operator}</p></div>
                            </div>
                            <AnimatePresence>
                              {expandedReview === record.id && (
                                <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div className="pt-3 mt-3 border-t border-slate-200"><p className="text-sm text-slate-600">{record.details}</p></div>
                                </m.div>
                              )}
                            </AnimatePresence>
                            <div className="flex justify-end mt-1">
                              {expandedReview === record.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Section>
          </div>

          <div className="space-y-6">
            <Section delay={0.15}>
              <Card>
                <CardHeader><CardTitle>议案信息</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between"><span className="text-slate-500">议案编号</span><span className="font-medium text-slate-700">{motion.id.toUpperCase()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">状态</span><Badge variant="primary" size="sm">{statusInfo.label}</Badge></div>
                  <div className="flex justify-between"><span className="text-slate-500">投票类型</span><span className="text-sm text-slate-700">{motion.voteType === "anonymous" ? "匿名投票" : "实名投票"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">发起人</span><span className="text-sm text-slate-700">{motion.initiatorName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">公示时间</span><span className="text-sm text-slate-700">{formatDate(motion.publicityStart)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">投票开始</span><span className="text-sm text-slate-700">{formatDate(motion.voteStart)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">投票截止</span><span className="text-sm text-slate-700">{formatDate(motion.voteEnd)}</span></div>
                </CardContent>
              </Card>
            </Section>

            {motion.status === "voting" && (
              <Section delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-primary-600" /> 投票倒计时</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-primary-50 rounded-lg p-3"><div className="text-2xl font-bold text-primary-600">{timeRemaining.days}</div><div className="text-xs text-primary-500">天</div></div>
                      <div className="bg-primary-50 rounded-lg p-3"><div className="text-2xl font-bold text-primary-600">{timeRemaining.hours}</div><div className="text-xs text-primary-500">时</div></div>
                      <div className="bg-primary-50 rounded-lg p-3"><div className="text-2xl font-bold text-primary-600">{timeRemaining.minutes}</div><div className="text-xs text-primary-500">分</div></div>
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-4">距离投票结束还有时间</p>
                  </CardContent>
                </Card>
              </Section>
            )}

            <Section delay={0.25}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" /> 发起委员会</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary-600" /></div>
                    <div><p className="font-medium text-slate-700">阳光花园业主委员会</p><p className="text-sm text-slate-500">第3届业委会</p></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                    <div><div className="text-xl font-semibold text-primary-600">7</div><div className="text-xs text-slate-500">委员人数</div></div>
                    <div><div className="text-xl font-semibold text-primary-600">2026</div><div className="text-xs text-slate-500">到期年份</div></div>
                  </div>
                </CardContent>
              </Card>
            </Section>

            <Section delay={0.3}>
              <Card>
                <CardHeader><CardTitle>操作</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full"><Share2 className="w-4 h-4 mr-2" /> 分享议案</Button>
                  <Button variant="outline" className="w-full"><FileDown className="w-4 h-4 mr-2" /> 下载决议</Button>
                </CardContent>
              </Card>
            </Section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && selectedVote && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
            <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
              <div className="text-center mb-6">
                {(() => {
                  const { icon: Icon, variant } = voteConfig[selectedVote];
                  const colorClass = variant === "success" ? "text-emerald-500" : variant === "danger" ? "text-rose-500" : "text-slate-500";
                  return <Icon className={cn("w-16 h-16 mx-auto mb-4", colorClass)} />;
                })()}
                <h3 className="text-xl font-bold text-slate-800 mb-2">确认投{voteConfig[selectedVote].label}票？</h3>
                <p className="text-slate-500">投票一经提交将无法修改，请谨慎操作</p>
              </div>
              <div className="flex gap-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>取消</Button>
                <Button variant="primary" className="flex-1" onClick={handleConfirmVote}>确认投票</Button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockchain && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50" onClick={() => setShowBlockchain(false)}>
            <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="text-center max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-64 h-64 mx-auto mb-8">
                {[...Array(12)].map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  return (
                    <m.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                      className="absolute w-4 h-4 bg-primary-400 rounded-full shadow-lg shadow-primary-500/50"
                      style={{ left: `calc(50% + ${Math.cos(angle) * 90}px - 8px)`, top: `calc(50% + ${Math.sin(angle) * 90}px - 8px)` }} />
                  );
                })}
                <m.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Blocks className="w-10 h-10 text-white" />
                  </div>
                </m.div>
              </div>
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-white">
                <h3 className="text-xl font-semibold mb-3">链上存证中</h3>
                <p className="text-slate-400 text-sm mb-6">您的投票正在写入区块链...</p>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm text-primary-400 break-all">
                  {blockchainHash.slice(0, 32)}
                  <m.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-2 h-4 bg-primary-400 ml-1 align-middle" />
                </div>
              </m.div>
              <m.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={() => setShowBlockchain(false)}
                className="mt-8 text-slate-400 hover:text-white text-sm transition-colors">点击关闭</m.button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
