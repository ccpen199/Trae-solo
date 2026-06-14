import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "default" | "list" | "grid";
  count?: number;
  className?: string;
}

function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("skeleton", className)} />;
}

function DefaultSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="card p-4 flex items-center gap-3">
      <SkeletonBlock className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
      <SkeletonBlock className="w-16 h-6 rounded-full" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <SkeletonBlock className="w-full aspect-[4/3] rounded-xl" />
      <SkeletonBlock className="h-4 w-3/4" />
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export default function SkeletonCard({
  variant = "default",
  count = 1,
  className,
}: SkeletonCardProps) {
  const renderVariant = () => {
    switch (variant) {
      case "list":
        return <ListSkeleton />;
      case "grid":
        return <GridSkeleton />;
      default:
        return <DefaultSkeleton />;
    }
  };

  return (
    <div className={cn("space-y-3 animate-pulse-soft", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderVariant()}</div>
      ))}
    </div>
  );
}
