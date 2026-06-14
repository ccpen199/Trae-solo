import { motion } from "framer-motion";
import { Copy, Share2, MessageCircle, Users, Wallet, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store";
import { inviteRelations } from "@/mock";

const stats = [
  { icon: Users, label: "总邀请人数", value: "5" },
  { icon: Wallet, label: "一级返佣", value: "¥2.5" },
  { icon: TrendingUp, label: "二级返佣", value: "¥0.6" },
];

export default function Invite() {
  const { user } = useAppStore();

  const handleCopy = () => {
    navigator.clipboard?.writeText(user.inviteCode);
    window.alert("邀请码已复制");
  };

  return (
    <div className="min-h-screen px-5 pb-8 pt-12">
      <div className="card relative overflow-hidden p-5 mb-5">
        <div className="absolute inset-0 bg-gold-gradient-radial opacity-40" />
        <div className="relative">
          <p className="text-sm text-white/50 mb-2">我的邀请码</p>
          <div className="mb-4 flex items-center gap-3">
            <span className="gold-text font-display text-4xl font-bold tracking-wider">
              {user.inviteCode}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-night-600"
            >
              <Copy className="h-4 w-4 text-gold-400" />
            </motion.button>
          </div>
          <div className="flex gap-3">
            <button className="gold-btn !px-5 !py-2 !text-sm gap-2">
              <Share2 className="h-4 w-4" />
              分享链接
            </button>
            <button className="ghost-btn !px-5 !py-2 !text-sm gap-2">
              <MessageCircle className="h-4 w-4" />
              邀请好友
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card flex flex-col items-center px-2 py-4"
          >
            <s.icon className="mb-2 h-5 w-5 text-gold-400" />
            <span className="gold-text font-display text-xl font-bold">{s.value}</span>
            <span className="mt-1 text-xs text-white/40">{s.label}</span>
          </motion.div>
        ))}
      </div>

      <h2 className="mb-3 text-base font-semibold text-white/80">邀请关系</h2>
      <div className="mb-5 space-y-3">
        {inviteRelations.map((r, i) => (
          <motion.div
            key={r.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`card flex items-center gap-3 p-3.5 ${
              r.level === 1 ? "border-gold-400/20" : ""
            }`}
          >
            <img
              src={r.avatar}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-white/85">
                  {r.nickname}
                </span>
                <span
                  className={`chip text-[10px] ${
                    r.level === 1
                      ? "bg-gold-400/15 text-gold-300"
                      : "bg-white/8 text-white/40"
                  }`}
                >
                  {r.level === 1 ? "一级" : "二级"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/30">完成 {r.completedTasks} 个任务</p>
            </div>
            <span className="gold-text shrink-0 text-sm font-bold">+{r.commission}</span>
          </motion.div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="mb-2 text-sm font-semibold text-white/70">返佣规则</h3>
        <p className="text-xs leading-relaxed text-white/40">
          一级邀请：好友完成任意任务，您可获得其金币奖励的
          10% 作为返佣。二级邀请：好友邀请的用户完成任务，您可获得其金币奖励的 3%
          返佣。返佣金币实时到账，无上限。
        </p>
      </div>
    </div>
  );
}
