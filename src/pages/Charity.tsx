import { useState, useEffect } from 'react';
import { Heart, Award } from 'lucide-react';
import { useCharityStore } from '@/stores/useCharityStore';

const MOCK_PROJECTS = [
  { id: '1', name: '山区儿童图书角', desc: '为偏远山区学校捐建图书角，让知识照亮未来', raised: 3600, target: 5000 },
  { id: '2', name: '绿色校园计划', desc: '推广校园环保教育，培养绿色新生代', raised: 2250, target: 5000 },
  { id: '3', name: '旧衣暖冬行动', desc: '将回收衣物捐赠给高寒地区困难家庭', raised: 4800, target: 6000 },
];

const MOCK_DONATIONS = [
  { id: 'd1', projectName: '山区儿童图书角', amount: 20, date: '2024-01-15', certificate: 'GR-20240115-001' },
  { id: 'd2', projectName: '旧衣暖冬行动', amount: 50, date: '2024-01-10', certificate: 'GR-20240110-003' },
  { id: 'd3', projectName: '绿色校园计划', amount: 30, date: '2023-12-28', certificate: 'GR-20231228-007' },
];

function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-mint-50 via-forest-50 to-mint-100 py-16 text-center">
      <h1 className="text-3xl font-bold text-forest-700">公益捐赠，让爱心循环</h1>
      <p className="mx-auto mt-3 max-w-md text-neutral-muted">每一次回收都是一份爱心，让闲置物品成为温暖的传递</p>
    </div>
  );
}

function ImpactStats() {
  const stats = [
    { value: '¥12,580', label: '累计捐赠' },
    { value: '15', label: '支持项目' },
    { value: '3,200', label: '爱心人次' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-white p-6 shadow-card text-center">
          <p className="text-2xl font-bold text-forest-700">{s.value}</p>
          <p className="mt-1 text-sm text-neutral-muted">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ project, onDonate }: {
  project: typeof MOCK_PROJECTS[0];
  onDonate: (id: string, name: string) => void;
}) {
  const progress = Math.round((project.raised / project.target) * 100);
  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <h4 className="font-semibold text-neutral-text">{project.name}</h4>
      <p className="mt-1 text-sm text-neutral-muted">{project.desc}</p>
      <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-mint-400 to-forest-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-muted">
        <span>已筹 ¥{project.raised.toLocaleString()}</span>
        <span>目标 ¥{project.target.toLocaleString()}</span>
      </div>
      <button onClick={() => onDonate(project.id, project.name)}
        className="mt-4 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark">
        捐赠支持
      </button>
    </div>
  );
}

function DonationItem({ donation, onShowCert }: {
  donation: typeof MOCK_DONATIONS[0];
  onShowCert: (cert: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light/20">
          <Heart className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-text">{donation.projectName}</p>
          <p className="text-xs text-neutral-muted">{donation.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-forest-700">¥{donation.amount}</p>
        <button onClick={() => onShowCert(donation.certificate)} className="text-xs text-mint-500 hover:text-forest-700">
          查看证书
        </button>
      </div>
    </div>
  );
}

function CertificateModal({ code, onClose }: { code: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
          <Award className="h-8 w-8 text-forest-700" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-forest-700">捐赠证书</h3>
        <p className="mt-2 text-sm text-neutral-muted">感谢您的爱心捐赠！</p>
        <div className="mt-4 rounded-xl bg-neutral-bg p-4">
          <p className="text-xs text-neutral-muted">证书编号</p>
          <p className="mt-1 text-lg font-mono font-bold text-forest-700">{code}</p>
        </div>
        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-forest-700 py-2.5 text-sm font-medium text-white hover:bg-forest-800">关闭</button>
      </div>
    </div>
  );
}

function DonateModal({ projectName, onClose, onConfirm }: {
  projectName: string;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(10);
  const presets = [10, 20, 50, 100];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-forest-700">捐赠支持</h3>
        <p className="mt-1 text-sm text-neutral-muted">{projectName}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {presets.map((v) => (
            <button key={v} onClick={() => setAmount(v)}
              className={`rounded-xl py-2 text-sm font-medium transition ${
                amount === v ? 'bg-mint-50 text-forest-700 ring-1 ring-mint-400' : 'bg-gray-50 text-neutral-text hover:bg-gray-100'
              }`}>¥{v}</button>
          ))}
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          min="1" className="mt-3 w-full rounded-xl border border-neutral-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400" />
        <button onClick={() => onConfirm(amount)}
          className="mt-4 w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">确认捐赠 ¥{amount}</button>
      </div>
    </div>
  );
}

export default function Charity() {
  const { fetchProjects, fetchDonations, donate } = useCharityStore();
  const [certCode, setCertCode] = useState('');
  const [donateTarget, setDonateTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchDonations();
  }, [fetchProjects, fetchDonations]);

  const handleDonate = (id: string, name: string) => setDonateTarget({ id, name });

  const handleConfirmDonate = async (amount: number) => {
    if (!donateTarget) return;
    await donate({ projectId: donateTarget.id, amount });
    setDonateTarget(null);
  };

  return (
    <div>
      <HeroSection />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <ImpactStats />
        <section>
          <h2 className="text-2xl font-bold text-forest-700 mb-6">公益项目</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_PROJECTS.map((p) => <ProjectCard key={p.id} project={p} onDonate={handleDonate} />)}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-forest-700 mb-6">我的捐赠</h2>
          <div className="space-y-3">
            {MOCK_DONATIONS.map((d) => <DonationItem key={d.id} donation={d} onShowCert={setCertCode} />)}
          </div>
        </section>
      </div>
      {certCode && <CertificateModal code={certCode} onClose={() => setCertCode('')} />}
      {donateTarget && <DonateModal projectName={donateTarget.name} onClose={() => setDonateTarget(null)} onConfirm={handleConfirmDonate} />}
    </div>
  );
}
