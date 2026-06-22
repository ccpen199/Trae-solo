import { CheckCircle } from "lucide-react";

export default function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium badge-verified">
      <CheckCircle size={12} />
      已验证
    </span>
  );
}
