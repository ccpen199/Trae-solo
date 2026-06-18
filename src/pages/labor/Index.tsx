import { useNavigate } from 'react-router-dom';
import { FileSignature, Siren } from 'lucide-react';

const entries = [
  {
    path: '/labor/contract',
    label: '劳动合同签署',
    desc: '在线签署与管理劳动合同',
    icon: FileSignature,
    accent: 'bg-primary-100 text-primary-700',
  },
  {
    path: '/labor/complaint',
    label: '劳动监察投诉',
    desc: '在线提交劳动监察投诉',
    icon: Siren,
    accent: 'bg-accent-100 text-accent-600',
  },
];

export default function LaborIndex() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">劳动关系</h1>
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
            <h3 className="text-base font-semibold text-neutral-800 mb-1">{entry.label}</h3>
            <p className="text-sm text-neutral-500">{entry.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
