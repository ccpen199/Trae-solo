import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gamepad2, ArrowLeftRight, Search, Recycle, Shield, TrendingUp } from "lucide-react";
import { mockTransactions } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const typeColors: Record<string, string> = {
  buy: "text-cyber-cyan",
  sell: "text-cyber-green",
  rent: "text-cyber-purple",
  recycle: "text-cyber-gold",
};

const typeLabels: Record<string, string> = {
  buy: "购买",
  sell: "出售",
  rent: "租号",
  recycle: "回收",
};

const navCards = [
  { label: "租号中心", to: "/rent", icon: Gamepad2, color: "text-cyber-cyan border-cyber-cyan/30 hover:border-cyber-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]" },
  { label: "买卖市场", to: "/trade", icon: ArrowLeftRight, color: "text-cyber-green border-cyber-green/30 hover:border-cyber-green/60 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]" },
  { label: "智能估值", to: "/valuation", icon: Search, color: "text-cyber-purple border-cyber-purple/30 hover:border-cyber-purple/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]" },
  { label: "回收竞价", to: "/recycle", icon: Recycle, color: "text-cyber-gold border-cyber-gold/30 hover:border-cyber-gold/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]" },
  { label: "保险理赔", to: "/insurance", icon: Shield, color: "text-cyber-red border-cyber-red/30 hover:border-cyber-red/60 hover:shadow-[0_0_20px_rgba(255,51,102,0.2)]" },
];

const stats = [
  { label: "总交易额", value: 12856000, prefix: "¥", suffix: "" },
  { label: "在线账号", value: 2847, prefix: "", suffix: "" },
  { label: "安全保障", value: 98652, prefix: "", suffix: "次" },
];

export default function Home() {
  const storeAccounts = useAppStore((s) => s.accounts);
  const hotAccounts = storeAccounts.slice(0, 4);
  const doubledTransactions = [...mockTransactions, ...mockTransactions];

  return (
    <div className="min-h-screen font-noto">
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute top-10 left-[10%] w-72 h-72 bg-cyber-cyan/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-10 right-[15%] w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-red/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 text-center">
          <motion.h1
            className="font-orbitron text-6xl md:text-7xl font-bold neon-text mb-4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            GameVault
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-cyber-muted mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            高安全等级游戏账号全生命周期交易平台
          </motion.p>

          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className="font-orbitron text-2xl md:text-3xl font-bold text-cyber-cyan">
                  <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-cyber-muted text-sm mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {navCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <Link to={card.to}>
                <motion.div
                  className={`glass-panel flex flex-col items-center justify-center gap-3 p-6 border transition-all duration-300 cursor-pointer ${card.color}`}
                  whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ transformPerspective: 800 }}
                >
                  <card.icon className="w-8 h-8" />
                  <span className="text-sm font-medium">{card.label}</span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-12 overflow-hidden">
        <div className="flex items-center gap-2 px-4 max-w-6xl mx-auto mb-3">
          <TrendingUp className="w-5 h-5 text-cyber-cyan" />
          <h2 className="font-orbitron text-lg neon-text">实时交易流</h2>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-cyber-bg to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyber-bg to-transparent z-10" />
          <div className="flex animate-scroll-left whitespace-nowrap">
            {doubledTransactions.map((tx, i) => (
              <div key={`${tx.id}-${i}`} className="glass-panel mx-2 px-4 py-2 inline-flex items-center gap-3 shrink-0">
                <span className="text-white/90 font-medium">{tx.gameName}</span>
                <span className={`text-xs font-bold ${typeColors[tx.type]}`}>{typeLabels[tx.type]}</span>
                <span className="text-cyber-cyan font-orbitron text-sm">¥{tx.amount.toLocaleString()}</span>
                <span className="text-cyber-muted text-xs">{new Date(tx.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-16">
        <h2 className="font-orbitron text-lg neon-text mb-6 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          热门账号
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotAccounts.map((acc, i) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Link to={acc.status === "available" ? `/rent/${acc.id}` : "#"}>
                <div className="card-cyber group">
                  <div className="relative overflow-hidden rounded-md mb-3">
                  <div className="font-medium text-white/90 mb-1">{acc.gameName}</div>
                    <img src={acc.imageUrl} alt={acc.gameName} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                      Lv.{acc.level}
                    </div>
                  </div>
                  <div className="text-cyber-muted text-xs mb-2">{acc.server} · {acc.region}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-cyber-cyan font-orbitron text-lg">¥{acc.price.toLocaleString()}</div>
                      <div className="text-cyber-muted text-xs">售价</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyber-purple font-orbitron text-sm">¥{acc.rentPriceDaily}/天</div>
                      <div className="text-cyber-muted text-xs">租价</div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
