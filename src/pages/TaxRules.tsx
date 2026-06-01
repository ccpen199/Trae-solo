import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { api, HSCode, TaxRule } from '@/lib/api';

export default function TaxRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    hs_code_id: 0,
    country_code: 'US',
    duty_rate: 0,
    vat_rate: 0,
    excise_rate: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    version: 1,
  });

  const loadData = async () => {
    try {
      const [rulesData, hsCodesData] = await Promise.all([
        api.getTaxRules(),
        api.getHSCodes(),
      ]);
      setRules(rulesData as any);
      setHsCodes(hsCodesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateTaxRule(editingId, formData);
      } else {
        await api.createTaxRule(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        hs_code_id: 0,
        country_code: 'US',
        duty_rate: 0,
        vat_rate: 0,
        excise_rate: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
        version: 1,
      });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (rule: any) => {
    setEditingId(rule.id);
    setFormData({
      hs_code_id: rule.hs_code_id,
      country_code: rule.country_code,
      duty_rate: rule.duty_rate,
      vat_rate: rule.vat_rate,
      excise_rate: rule.excise_rate || 0,
      valid_from: rule.valid_from,
      valid_to: rule.valid_to || '',
      version: rule.version,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除此税率规则吗？')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await api.deleteTaxRule(id);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">税率规则</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          添加规则
        </button>
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
              {editingId ? '编辑税率规则' : '添加税率规则'}
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
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HS 编码 *</label>
              <select
                required
                value={formData.hs_code_id || ''}
                onChange={(e) => setFormData({ ...formData, hs_code_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {hsCodes.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.hs_code} - {code.category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目的国 *</label>
              <select
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="US">美国 (US)</option>
                <option value="EU">欧盟 (EU)</option>
                <option value="UK">英国 (UK)</option>
                <option value="JP">日本 (JP)</option>
                <option value="AU">澳大利亚 (AU)</option>
              </select>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关税率 (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.duty_rate * 100}
                onChange={(e) => setFormData({ ...formData, duty_rate: parseFloat(e.target.value) / 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：16.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">增值税率 (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.vat_rate * 100}
                onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) / 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">消费税率 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.excise_rate * 100}
                onChange={(e) => setFormData({ ...formData, excise_rate: parseFloat(e.target.value) / 100 || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生效日期 *</label>
              <input
                type="date"
                required
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">失效日期</label>
              <input
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-3 flex justify-end gap-3">
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
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">目的国</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">关税率</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">增值税率</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">消费税率</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">有效期</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">版本</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">暂无数据</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{rule.hs_code}</td>
                  <td className="py-3 px-4 text-sm">{rule.category}</td>
                  <td className="py-3 px-4 text-sm">{rule.country_code}</td>
                  <td className="py-3 px-4 text-sm">{(rule.duty_rate * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{(rule.vat_rate * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{rule.excise_rate ? `${(rule.excise_rate * 100).toFixed(2)}%` : '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {rule.valid_from}
                    {rule.valid_to ? ` ~ ${rule.valid_to}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm">v{rule.version}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={deletingId === rule.id}
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
