import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit3, MapPin, Scan, Trash2 } from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import Modal from '@/components/ui/Modal';
import type { ScenicArea } from '@/types';

export default function ScenicList() {
  const navigate = useNavigate();
  const { scenicAreas, loadScenicAreas } = useScenicStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' as 'active' | 'inactive' });

  useEffect(() => {
    loadScenicAreas();
  }, [loadScenicAreas]);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    setShowCreate(false);
    setForm({ name: '', description: '', status: 'active' });
  };

  const handleDelete = (_id: string) => {};

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">景区管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-amber-500"
        >
          <Plus size={18} />
          新建景区
        </button>
      </div>

      <div className="grid gap-5">
        {scenicAreas.map((scenic, i) => (
          <ScenicCard
            key={scenic.id}
            scenic={scenic}
            index={i}
            onEdit={() => {}}
            onPOI={() => navigate(`/admin/scenic/${scenic.id}/poi`)}
            onAR={() => navigate(`/admin/scenic/${scenic.id}/ar-editor`)}
            onDelete={() => handleDelete(scenic.id)}
          />
        ))}
      </div>

      {scenicAreas.length === 0 && (
        <div className="py-24 text-center text-[var(--text-muted)]">暂无景区数据，请点击上方按钮新建</div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="新建景区">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">景区名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">景区描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">状态</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-amber-600"
            >
              <option value="active">运营中</option>
              <option value="inactive">已停运</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="w-full rounded-xl bg-amber-600 py-2.5 font-medium text-white transition-colors hover:bg-amber-500"
          >
            确认创建
          </button>
        </div>
      </Modal>
    </div>
  );
}

interface ScenicCardProps {
  scenic: ScenicArea;
  index: number;
  onEdit: () => void;
  onPOI: () => void;
  onAR: () => void;
  onDelete: () => void;
}

function ScenicCard({ scenic, index, onEdit, onPOI, onAR, onDelete }: ScenicCardProps) {
  return (
    <motion.div
      className="flex overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <img
        src={`https://picsum.photos/seed/${scenic.id}/400/300`}
        alt={scenic.name}
        className="h-48 w-56 shrink-0 object-cover"
      />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="font-serif text-xl font-bold text-[var(--text-primary)]">{scenic.name}</h3>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                scenic.status === 'active'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-gray-500/15 text-gray-400'
              }`}
            >
              {scenic.status === 'active' ? '运营中' : '已停运'}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{scenic.description}</p>
        </div>
        <div>
          <div className="mt-3 flex gap-6 text-sm text-[var(--text-muted)]">
            <span>游客数：{scenic.visitorCount ?? 0}</span>
            <span>AR启动数：{scenic.arLaunchCount ?? 0}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <ActionBtn icon={<Edit3 size={15} />} label="编辑" onClick={onEdit} />
            <ActionBtn icon={<MapPin size={15} />} label="POI管理" onClick={onPOI} />
            <ActionBtn icon={<Scan size={15} />} label="AR编辑" onClick={onAR} />
            <ActionBtn icon={<Trash2 size={15} />} label="删除" onClick={onDelete} danger />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        danger
          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
