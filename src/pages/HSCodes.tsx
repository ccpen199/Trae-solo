import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Edit2, X, Check } from 'lucide-react';
import { api, HSCode } from '@/lib/api';

export default function HSCodesPage() {
  const [codes, setCodes] = useState<HSCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    hs_code: '',
    category: '',
    material: '',
    description: '',
    version: 1,
  });

  const loadCodes = async () => {
    try {
      const data = await api.getHSCodes();
      setCodes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      api.searchHSCodes(searchQuery).then(setCodes);
    } else {
      loadCodes();
    }
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateHSCode(editingId, formData);
      } else {
        await api.createHSCode(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ hs_code: '', category: '', material: '', description: '', version: 1 });
      loadCodes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (code: HSCode) => {
    setEditingId(code.id!);
    setFormData({
      hs_code: code.hs_code,
      category: code.category,
      material: code.material || '',
      description: code.description || '',
      version: code.version,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除此 HS 编码吗？')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await api.deleteHSCode(id);
      await loadCodes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">HS 编码管理</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ hs_code: '', category: '', material: '', description: '', version: 1 });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          添加编码
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="搜索 HS 编码、分类或描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? '编辑 HS 编码' : '添加 HS 编码'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HS 编码 *</label>
              <input
                type="text"
                required
                value={formData.hs_code}
                onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：85171200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：电子产品"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：塑料/金属"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">版本</label>
              <input
                type="number"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="商品描述"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Check size={18} />
                {editingId ? '保存修改' : '添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">HS 编码</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">分类</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">材质</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">描述</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">版本</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              codes.map((code) => (
                <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{code.hs_code}</td>
                  <td className="py-3 px-4 text-sm">{code.category}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{code.material || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{code.description || '-'}</td>
                  <td className="py-3 px-4 text-sm">v{code.version}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(code)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id!)}
                        disabled={deletingId === code.id}
                        className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
