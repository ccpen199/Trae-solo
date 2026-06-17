import { motion } from "framer-motion";
import {
  Inbox,
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  PackageX,
} from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/utils";

type EmptyVariant =
  | "default"
  | "search"
  | "no-data"
  | "error"
  | "success"
  | "empty";

interface EmptyProps {
  variant?: EmptyVariant;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig: Record<
  EmptyVariant,
  { icon: React.ReactNode; iconColor: string }
> = {
  default: {
    icon: <Inbox className="w-16 h-16" />,
    iconColor: "text-slate-400",
  },
  search: {
    icon: <Search className="w-16 h-16" />,
    iconColor: "text-slate-400",
  },
  "no-data": {
    icon: <FileText className="w-16 h-16" />,
    iconColor: "text-slate-400",
  },
  error: {
    icon: <AlertCircle className="w-16 h-16" />,
    iconColor: "text-rose-500",
  },
  success: {
    icon: <CheckCircle2 className="w-16 h-16" />,
    iconColor: "text-emerald-500",
  },
  empty: {
    icon: <PackageX className="w-16 h-16" />,
    iconColor: "text-slate-400",
  },
};

export function Empty({
  variant = "default",
  title,
  description,
  icon,
  action,
  className,
}: EmptyProps) {
  const config = variantConfig[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 p-4 rounded-full bg-slate-50",
          config.iconColor
        )}
      >
        {icon || config.icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
