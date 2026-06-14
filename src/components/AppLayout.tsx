import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
  showBack?: boolean;
}

export default function AppLayout({
  children,
  className,
  title,
  showBack = false,
}: AppLayoutProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <main
        className={cn(
          "mx-auto max-w-md min-h-screen bg-white shadow-lg",
          className
        )}
      >
        {title && (
          <header className="sticky top-0 z-20 bg-white border-b border-slate-100">
            <div className="flex items-center px-4 py-3.5">
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 text-slate-600 hover:text-slate-900 active:scale-95 transition-transform mr-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="font-serif text-lg font-semibold text-slate-800">
                {title}
              </h1>
            </div>
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
