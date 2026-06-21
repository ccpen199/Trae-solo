import { useAppStore } from "@/store";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LangSwitcher() {
  const { lang, toggleLang } = useAppStore();

  return (
    <button
      onClick={toggleLang}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2",
        "text-sm font-medium transition-all duration-200",
        "border border-charcoal-500/10 bg-white/60 backdrop-blur",
        "hover:border-warm-gold-500/50 hover:bg-white hover:shadow-elegant",
        "focus:outline-none focus:ring-2 focus:ring-warm-gold-500/30"
      )}
      aria-label="切换语言 / Cambia lingua"
    >
      <Languages className="h-4 w-4 text-warm-gold-600" />
      <span
        className={cn(
          "transition-colors duration-200",
          lang === "zh" ? "text-cn-red-600" : "text-charcoal-400"
        )}
      >
        ZH
      </span>
      <span className="text-charcoal-300">/</span>
      <span
        className={cn(
          "transition-colors duration-200",
          lang === "it" ? "text-it-green-600" : "text-charcoal-400"
        )}
      >
        IT
      </span>
    </button>
  );
}
