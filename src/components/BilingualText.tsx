import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

interface BilingualTextProps {
  zh: string;
  it: string;
  className?: string;
}

export default function BilingualText({ zh, it, className }: BilingualTextProps) {
  const lang = useAppStore((state) => state.lang);

  return (
    <span className={cn(className)}>
      {lang === "zh" ? zh : it}
    </span>
  );
}
