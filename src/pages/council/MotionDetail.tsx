import { useState, useEffect, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ArrowLeft, User, Calendar, Paperclip, Download,
  CheckCircle2, XCircle, MinusCircle, Hash, Blocks,
  Clock, FileText,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { cn, formatDate, getMotionStatusLabel, formatPercent, formatFileSize, generateId } from "@/utils";

type VoteType = "agree" | "disagree" | "abstain";

const voteConfig: Record<VoteType, { label: string; icon: typeof CheckCircle2; bg: string; text: string; border: string; buttonBg: string; iconColor: string }> = {
  agree: { label: "同意", icon: CheckCircle2, bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-300", buttonBg: "bg-emerald-500 hover:bg-emerald-600", iconColor: "text-emerald-500" },
  disagree: { label: "反对", icon: XCircle, bg: "bg-rose-50 hover:bg-rose-100", text: "text-rose-600", border: "border-rose-200 hover:border-rose-300", buttonBg: "bg-rose-500 hover:bg-rose-600", iconColor: "text-rose-500" },
  abstain: { label: "弃权", icon: MinusCircle, bg: "bg-slate-50 hover:bg-slate-100", text: "text-slate-600", border: "border-slate-200 hover:border-slate-300", buttonBg: "bg-slate-500 hover:bg-slate-600", iconColor: "text-slate-500" },
};

export default function MotionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { motions, castVote } = useAppStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [showBlockchain, setShowBlockchain] = useState(false);
  const [hashDisplay, setHashDisplay] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  const currentMotion = useMemo(() => motions.find((item) => item.id === id), [motions, id]);

  useEffect(() => {
    if (showBlockchain) {
      const hash = currentMotion?.blockchainHash || generateId() + generateId();
      let i = 0;
      const timer = setInterval(() => {
        if (i < hash.length) { setHashDisplay(hash.slice(0, i + 1)); i++; }
        else clearInterval(timer);
      }, 30);
      return () => clearInterval(timer);
    }
  }, [showBlockchain, currentMotion]);

  if (!currentMotion) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 flex items-center justify-center">
      <div className="text-center">
        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">议案不存在</h3>
        <button onClick={() => navigate("/council")} className="text-primary-600 hover:underline">返回列表</button>
      </div>
    </div>
  );

  const statusInfo = getMotionStatusLabel(currentMotion.status);
  const votedCount = currentMotion.voteStats.votedCount || 1;

  const pieOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c}票 ({d}%)" },
    legend: { orient: "vertical", right: "5%", top: "center", formatter: (name: string) => {
      const data: Record<string, number> = { 同意: currentMotion.voteStats.agreeCount, 反对: currentMotion.voteStats.disagreeCount, 弃权: currentMotion.voteStats.abstainCount };
      return `${name}: ${data[name]}票 (${((data[name] / votedCount) * 100).toFixed(1)}%)`;
    }},
    series: [{ type: "pie", radius: ["50%", "75%"], center: ["35%", "50%"], itemStyle: { borderRadius: 8, borderColor: "#fff", borderWidth: 2 }, label: { show: false },
      data: [
        { value: currentMotion.voteStats.agreeCount, name: "同意", itemStyle: { color: "#10B981" } },
        { value: currentMotion.voteStats.disagreeCount, name: "反对", itemStyle: { color: "#EF4444" } },
        { value: currentMotion.voteStats.abstainCount, name: "弃权", itemStyle: { color: "#94A3B8" } },
      ],
    }],
  };

  const handleVote = (vote: VoteType) => { setSelectedVote(vote); setShowConfirm(true); };

  const handleConfirm = () => {
    if (selectedVote && currentMotion) {
      setShowConfirm(false);
      setShowBlockchain(true);
      castVote(currentMotion.id, selectedVote);
      setTimeout(() => { setShowBlockchain(false); setHasVoted(true); }, 3000);
    }
  };

  const Section = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }} className="bg-white rounded-2xl shadow-card p-8 mb-6">
      {children}
    </m.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-5xl mx-auto">
        <m.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/council")} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 返回列表
        </m.button>

        <Section>
          <div className="flex items-start justify-between mb-6">
            <span className={cn("px-4 py-1.5 rounded-full text-sm font-medium", statusInfo.bgColor, statusInfo.color)}>{statusInfo.label}</span>
            <span className={cn("px-4 py-1.5 rounded-full text-sm font-medium", currentMotion.voteType === "anonymous" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
              {currentMotion.voteType === "anonymous" ? "匿名投票" : "实名投票"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">{currentMotion.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>发起人：{currentMotion.initiatorName}</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>发起时间：{formatDate(currentMotion.publicityStart || currentMotion.voteStart, "YYYY-MM-DD HH:mm")}</span></div>
          </div>
        </Section>

        <Section delay={0.1}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">议案内容</h2>
          {currentMotion.content.split("\n").map((p, i) => <p key={i} className="text-slate-600 leading-relaxed mb-4">{p}</p>)}
        </Section>

        {currentMotion.attachments.length > 0 && (
          <Section delay={0.2}>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Paperclip className="w-5 h-5" /> 附件列表</h2>
            <div className="space-y-3">
              {currentMotion.attachments.map((att) => (
                <m.div key={att.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary-500" />
                    <div><p className="font-medium text-slate-700">{att.name}</p><p className="text-sm text-slate-400">{formatFileSize(att.size)}</p></div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Download className="w-5 h-5" /></button>
                </m.div>
              ))}
            </div>
          </Section>
        )}

        <Section delay={0.3}>
          <h2 className="text-lg font-semibold text-slate-800 mb-6">投票进度</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64"><ReactECharts option={pieOption} style={{ height: "100%" }} /></div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {(["agree", "disagree", "abstain"] as VoteType[]).map((v) => {
                  const { label, bg, text } = voteConfig[v];
                  const count = v === "agree" ? currentMotion.voteStats.agreeCount : v === "disagree" ? currentMotion.voteStats.disagreeCount : currentMotion.voteStats.abstainCount;
                  return (
                    <div key={v} className={cn("rounded-xl p-4", bg)}>
                      <div className={cn("text-3xl font-bold", text)}>{count}</div>
                      <div className={cn("text-sm mt-1", text)}>{formatPercent((count / votedCount) * 100)}</div>
                      <div className="text-xs text-slate-400 mt-1">{label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center text-slate-500 text-sm">
                已投票 {currentMotion.voteStats.votedCount} / {currentMotion.voteStats.totalVoters} 人
                <span className="text-primary-600 font-medium ml-2">({formatPercent((currentMotion.voteStats.votedCount / currentMotion.voteStats.totalVoters) * 100)} 参与率)</span>
              </div>
            </div>
          </div>
        </Section>

        {currentMotion.status === "voting" && !hasVoted && (
          <Section delay={0.4}>
            <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">请投出您宝贵的一票</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {(Object.keys(voteConfig) as VoteType[]).map((v) => {
                const { label, icon: Icon, bg, text, border } = voteConfig[v];
                return (
                  <m.button key={v} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleVote(v)} className={cn("flex items-center gap-3 px-8 py-4 rounded-xl font-medium border-2 transition-all", bg, text, border)}>
                    <Icon className="w-6 h-6" /><span className="text-lg">{label}</span>
                  </m.button>
                );
              })}
            </div>
          </Section>
        )}

        {hasVoted && (
          <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 rounded-2xl p-8 mb-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-emerald-700 mb-2">投票成功</h3>
            <p className="text-emerald-600">感谢您参与小区公共事务决策</p>
          </m.div>
        )}

        {(currentMotion.status === "passed" || currentMotion.status === "rejected") && currentMotion.blockchainHash && (
          <Section delay={0.5}>
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2"><Blocks className="w-5 h-5 text-primary-600" /> 链上存证信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Hash className="w-4 h-4" /> 区块哈希</div>
                <p className="text-sm font-mono text-slate-600 break-all">{currentMotion.blockchainHash}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Blocks className="w-4 h-4" /> 区块高度</div>
                <p className="text-lg font-semibold text-slate-700">#1,234,567</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2"><Clock className="w-4 h-4" /> 上链时间</div>
                <p className="text-sm text-slate-600">{formatDate(currentMotion.voteEnd, "YYYY-MM-DD HH:mm:ss")}</p>
              </div>
            </div>
          </Section>
        )}
      </div>

      <AnimatePresence>
        {showConfirm && selectedVote && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
            <m.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-modal p-8 max-w-md w-full">
              <div className="text-center mb-6">
                {(() => { const { icon: Icon, iconColor } = voteConfig[selectedVote]; return <Icon className={cn("w-16 h-16 mx-auto mb-4", iconColor)} />; })()}
                <h3 className="text-xl font-bold text-slate-800 mb-2">确认投{voteConfig[selectedVote].label}票？</h3>
                <p className="text-slate-500">投票一经提交将无法修改，请谨慎操作</p>
              </div>
              <div className="flex gap-4">
                <m.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowConfirm(false)} className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors">取消</m.button>
                <m.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConfirm} className={cn("flex-1 px-6 py-3 rounded-xl font-medium text-white transition-colors", voteConfig[selectedVote].buttonBg)}>确认投票</m.button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockchain && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/95 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-8">
                {[...Array(12)].map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  return (
                    <m.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="absolute w-4 h-4 bg-primary-400 rounded-full"
                      style={{ left: Math.cos(angle) * 80 + 128, top: Math.sin(angle) * 80 + 128 }} />
                  );
                })}
                <m.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="absolute inset-0 flex items-center justify-center">
                  <Blocks className="w-16 h-16 text-primary-400" />
                </m.div>
              </div>
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="text-white">
                <h3 className="text-xl font-semibold mb-4">正在上链存证...</h3>
                <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm text-primary-400 max-w-md mx-auto break-all">
                  {hashDisplay}
                  <m.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-2 h-4 bg-primary-400 ml-1" />
                </div>
              </m.div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
