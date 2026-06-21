import { useState } from 'react';
import { Search, Plus, Trash2, AlertTriangle, Building2, User, MoreVertical, Filter } from 'lucide-react';
import { mockBlacklist } from '@/mock/data';
import type { BlacklistEntry, BlacklistType, BlacklistReason } from '@/types';

export default function Blacklist() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<BlacklistType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [entries, setEntries] = useState<BlacklistEntry[]>(mockBlacklist);

  const typeLabel: Record<BlacklistType, string> = {
    enterprise: '企业',
    individual: '个人',
  };

  const typeIcon: Record<BlacklistType, typeof Building2> = {
    enterprise: Building2,
    individual: User,
  };

  const reasonLabel: Record<BlacklistReason, string> = {
    black_agency: '黑中介',
    fraud: '欺诈行为',
    other: '其他',
  };

  const reasonBadge: Record<BlacklistReason, string> = {
    black_agency: 'bg-terracotta-100 text-terracotta-700',
    fraud: 'bg-terracotta-100 text-terracotta-700',
    other: 'bg-sand-100 text-sand-700',
  };

  const filtered = entries.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = [
    { label: '黑名单总数', value: entries.length, color: 'text-terracotta-600' },
    { label: '企业', value: entries.filter((e) => e.type === 'enterprise').length, color: 'text-ash-600' },
    { label: '个人', value: entries.filter((e) => e.type === 'individual').length, color: 'text-ash-600' },
    { label: '黑中介', value: entries.filter((e) => e.reason === 'black_agency').length, color: 'text-terracotta-600' },
  ];

  const handleRemove = (id: string) => {
    if (confirm('确定要将该条目移出黑名单吗？')) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-sm text-ash-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 font-serif ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名称或描述..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BlacklistType | 'all')}
          className="input-field w-36"
        >
          <option value="all">全部类型</option>
          <option value="enterprise">企业</option>
          <option value="individual">个人</option>
        </select>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={16} />
          更多筛选
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          添加黑名单
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-ash-50">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">类型</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">名称</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">原因</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">描述</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-ash-600">加入时间</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-ash-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ash-100">
            {filtered.map((entry) => {
              const TypeIcon = typeIcon[entry.type];
              return (
                <tr key={entry.id} className="hover:bg-ash-50/50">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ash-100 rounded-lg text-sm text-ash-600">
                      <TypeIcon size={14} />
                      {typeLabel[entry.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-ash-700">{entry.name}</p>
                      {entry.phone && (
                        <p className="text-sm text-ash-500">{entry.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${reasonBadge[entry.reason]}`}>
                      {reasonLabel[entry.reason]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-ash-600 max-w-xs truncate">{entry.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-ash-500">{entry.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-ash-100 rounded-lg text-ash-500">
                        <MoreVertical size={16} />
                      </button>
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="p-2 hover:bg-terracotta-50 rounded-lg text-ash-500 hover:text-terracotta-600"
                        title="移出黑名单"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-slide-up">
            <h3 className="font-serif text-xl font-bold text-ash-700 mb-6">添加黑名单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['enterprise', 'individual'] as BlacklistType[]).map((t) => {
                    const Icon = typeIcon[t];
                    return (
                      <button
                        key={t}
                        className="p-3 rounded-xl border-2 border-ash-100 hover:border-ash-200 text-center"
                      >
                        <Icon size={20} className="mx-auto text-ash-500" />
                        <p className="text-sm text-ash-700 mt-1">{typeLabel[t]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">名称</label>
                <input type="text" className="input-field" placeholder="请输入企业或个人名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">原因</label>
                <select className="input-field">
                  <option value="">请选择原因</option>
                  <option value="black_agency">黑中介</option>
                  <option value="fraud">欺诈行为</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">详细描述</label>
                <textarea
                  rows={4}
                  className="input-field resize-none"
                  placeholder="请详细描述违规行为..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  alert('已添加到黑名单');
                  setShowAddModal(false);
                }}
                className="btn-primary flex-1"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
