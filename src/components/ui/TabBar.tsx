import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export default function TabBar({
  tabs,
  activeKey,
  onChange,
  variant = "default",
  className,
}: TabBarProps) {
  return (
    <div
      className={cn(
        "flex",
        variant === "default" &&
          "p-1 rounded-xl bg-slate-100 gap-1 overflow-x-auto",
        variant === "pills" && "gap-2 overflow-x-auto",
        variant === "underline" &&
          "border-b border-slate-200 gap-6 overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const Icon = tab.icon;

        if (variant === "underline") {
          return (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && onChange(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "relative flex items-center gap-1.5 px-1 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "text-brand-500"
                  : "text-slate-500 hover:text-slate-700",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          );
        }

        if (variant === "pills") {
          return (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && onChange(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-brand-200 hover:text-brand-600",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        }

        return (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
