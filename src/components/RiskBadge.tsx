import { Shield } from "lucide-react";
import clsx from "clsx";

const levelMap = {
  low: { label: "低风险", className: "badge-risk-low" },
  medium: { label: "中风险", className: "badge-risk-medium" },
  high: { label: "高风险", className: "badge-risk-high" },
};

type RiskLevel = keyof typeof levelMap;

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const config = levelMap[level];

  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
      <Shield size={12} />
      {config.label}
    </span>
  );
}
