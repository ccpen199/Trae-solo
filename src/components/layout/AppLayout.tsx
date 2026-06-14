import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import Toast from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export default function AppLayout({
  children,
  className,
  showBottomNav = true,
  showHeader = true,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {showHeader && <AppHeader />}

      <main
        className={cn(
          "flex-1 container mx-auto px-4 py-4 md:py-6",
          showBottomNav && "pb-24 md:pb-6",
          className
        )}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav />}

      <Toast />
    </div>
  );
}
