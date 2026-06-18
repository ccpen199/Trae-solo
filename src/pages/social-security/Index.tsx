import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';

const entries = [
  {
    path: '/social-security/query',
    label: '参保状态查询',
    desc: '查询五险参保状态及基本信息',
    icon: Search,
    accent: 'bg-primary-100 text-primary-700',
  },
  {
    path: '/social-security/payment',
    label: '缴费记录查询',
    desc: '查询历年社保缴费明细',
    icon: FileText,
    accent: 'bg-accent-100 text-accent-600',
  },
];

export default function SocialSecurityIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">社保服务</h1>
      <div className="grid grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.path}
            onClick={() => navigate(entry.path)}
            className="bg-white border border-neutral-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-12 h-12 rounded-lg ${entry.accent} flex items-center justify-center mb-4`}>
              <entry.icon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 mb-1">
              {entry.label}
            </h3>
            <p className="text-sm text-neutral-500">{entry.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
