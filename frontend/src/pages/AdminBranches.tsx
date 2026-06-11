import { useState, useEffect } from 'react';
import { Building2, MapPin, User, X, Edit3 } from 'lucide-react';
import api from '../services/api';
import { Branch, BRAND_MAP } from '../types';

const BRAND_TAG_COLORS: Record<string, string> = {
  sf: 'bg-red-100 text-red-700',
  zt: 'bg-blue-100 text-blue-700',
  yt: 'bg-orange-100 text-orange-700',
  yd: 'bg-purple-100 text-purple-700',
  jt: 'bg-green-100 text-green-700',
};

const MOCK_BRANCHES: Branch[] = [
  {
    id: 1,
    name: '朝阳中心站',
    code: 'CY-001',
    address: '北京市朝阳区建国路88号',
    manager_id: 1,
    brand_partners: ['sf', 'zt', 'yt'],
    status: 'active',
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 2,
    name: '海淀科技园站',
    code: 'HD-002',
    address: '北京市海淀区中关村大街66号',
    manager_id: 2,
    brand_partners: ['yd', 'jt'],
    status: 'active',
    created_at: '2025-03-20T10:00:00Z',
  },
];

const ALL_BRANDS = Object.keys(BRAND_MAP);

const MANAGER_NAMES: Record<number, string> = {
  1: '张建国',
  2: '李明辉',
};

export default function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editBrands, setEditBrands] = useState<string[]>([]);

  useEffect(() => {
    api.get<any, { data: Branch[] }>('/branches')
      .then((res) => setBranches(res.data))
      .catch(() => setBranches(MOCK_BRANCHES))
      .finally(() => setLoading(false));
  }, []);

  const openEditModal = (branch: Branch) => {
    setEditBranch(branch);
    setEditBrands([...branch.brand_partners]);
  };

  const toggleBrand = (brand: string) => {
    setEditBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const saveBrands = async () => {
    if (!editBranch) return;
    try {
      await api.put(`/branches/${editBranch.id}`, { brand_partners: editBrands });
      setBranches((prev) =>
        prev.map((b) => (b.id === editBranch.id ? { ...b, brand_partners: editBrands } : b))
      );
    } catch {
      setBranches((prev) =>
        prev.map((b) => (b.id === editBranch.id ? { ...b, brand_partners: editBrands } : b))
      );
    }
    setEditBranch(null);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">网点管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <div key={branch.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{branch.name}</h3>
                  <span className="text-xs text-gray-400 font-mono">{branch.code}</span>
                </div>
              </div>
              <button
                onClick={() => openEditModal(branch)}
                className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <Edit3 size={14} />
                编辑品牌
              </button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                {branch.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} className="text-gray-400 shrink-0" />
                {MANAGER_NAMES[branch.manager_id] || `管理员#${branch.manager_id}`}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">合作品牌：</span>
              {branch.brand_partners.map((brand) => (
                <span
                  key={brand}
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${BRAND_TAG_COLORS[brand] || 'bg-gray-100 text-gray-600'}`}
                >
                  {BRAND_MAP[brand] || brand}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无网点数据</div>
      )}

      {editBranch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">编辑合作品牌 - {editBranch.name}</h3>
              <button onClick={() => setEditBranch(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {ALL_BRANDS.map((brand) => (
                <label key={brand} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/30"
                  />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${BRAND_TAG_COLORS[brand] || 'bg-gray-100 text-gray-600'}`}>
                    {BRAND_MAP[brand]}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setEditBranch(null)} className="btn-outline px-4 py-2 text-sm">
                取消
              </button>
              <button onClick={saveBrands} className="btn-primary px-4 py-2 text-sm">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
