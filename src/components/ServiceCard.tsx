import { useNavigate } from "react-router-dom";
import { FileText, Users, ClipboardList, Building2, Target, HeartPulse, ShieldCheck, HandCoins, Baby, Plane, Mountain, Route, CreditCard, Languages, Bus, MessageSquareWarning } from "lucide-react";
import { type ServiceItem } from "@/data/mock";
import { clsx } from "clsx";

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  ClipboardList: <ClipboardList className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  HandCoins: <HandCoins className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Plane: <Plane className="w-5 h-5" />,
  Mountain: <Mountain className="w-5 h-5" />,
  Route: <Route className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  Languages: <Languages className="w-5 h-5" />,
  Bus: <Bus className="w-5 h-5" />,
  MessageSquareWarning: <MessageSquareWarning className="w-5 h-5" />,
};

const colorClasses: Record<string, { bg: string; text: string; hoverBg: string }> = {
  primary: { bg: "bg-primary-50", text: "text-primary-700", hoverBg: "hover:bg-primary-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", hoverBg: "hover:bg-emerald-100" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", hoverBg: "hover:bg-gold-100" },
};

interface ServiceCardProps {
  service: ServiceItem;
  compact?: boolean;
}

export default function ServiceCard({ service, compact = false }: ServiceCardProps) {
  const navigate = useNavigate();
  const c = colorClasses[service.color] || colorClasses.primary;

  if (compact) {
    return (
      <button
        onClick={() => navigate(service.link)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl ${c.bg} ${c.hoverBg} transition-all duration-200 hover-lift`}
      >
        <div className={`w-10 h-10 rounded-lg ${c.text} flex items-center justify-center`}>
          {iconMap[service.icon]}
        </div>
        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{service.title}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(service.link)}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover-lift text-left w-full"
    >
      <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center flex-shrink-0`}>
        {iconMap[service.icon]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm">{service.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{service.description}</p>
      </div>
    </button>
  );
}
