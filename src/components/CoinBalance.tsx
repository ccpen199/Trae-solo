import { Coins } from "lucide-react";
import { motion } from "framer-motion";

interface CoinBalanceProps {
  balance: number;
  todayEarned: number;
}

export default function CoinBalance({ balance, todayEarned }: CoinBalanceProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Coins size={28} className="text-gold-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
      </motion.div>
      <div className="flex flex-col">
        <span className="gold-text text-2xl font-bold tracking-tight">
          {balance.toLocaleString()}
        </span>
        {todayEarned > 0 && (
          <span className="text-xs font-medium text-emerald">
            今日 +{todayEarned.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
