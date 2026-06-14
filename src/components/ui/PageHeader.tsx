import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  onBack,
  showBack = true,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        "sticky top-14 md:top-16 z-30 -mx-4 md:-mx-0 bg-slate-50/90 backdrop-blur-xl border-b border-slate-100",
        className
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}
          <h2 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
