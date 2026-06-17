import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  variant?: "line" | "pills";
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  variant = "line",
  className,
  children,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.key
  );
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (key: string) => {
    if (!isControlled) {
      setInternalActiveTab(key);
    }
    onChange?.(key);
  };

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex",
          variant === "line"
            ? "border-b border-slate-200"
            : "gap-2 p-1 bg-slate-100 rounded-lg"
        )}
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && handleTabClick(tab.key)}
            disabled={tab.disabled}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-all duration-200",
              variant === "line"
                ? "border-b-2 border-transparent -mb-px"
                : "rounded-md",
              activeTab === tab.key
                ? variant === "line"
                  ? "text-primary-600 border-primary-600"
                  : "bg-white text-primary-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
            </div>
            {variant === "line" && activeTab === tab.key && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

interface TabPanelProps {
  tabKey: string;
  activeKey: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({
  tabKey,
  activeKey,
  children,
  className,
}: TabPanelProps) {
  if (tabKey !== activeKey) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
      role="tabpanel"
    >
      {children}
    </motion.div>
  );
}
