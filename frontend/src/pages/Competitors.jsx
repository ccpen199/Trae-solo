import { useState, useEffect } from 'react';
import { competitorsAPI } from '../services/api';

function Competitors() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: '',
    platform: ''
  });

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    try {
      const response = await competitorsAPI.getAll();
      setCompetitors(response.data);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompetitor) {
        await competitorsAPI.update(editingCompetitor.id, formData);
      } else {
        await competitorsAPI.create(formData);
      }
      setShowModal(false);
      setEditingCompetitor(null);
      setFormData({ name: '', url: '', category: '', platform: '' });
      loadCompetitors();
    } catch (error) {
      console.error('Failed to save competitor:', error);
      alert('保存失败，请检查输入');
    }
  };

  const handleEdit = (competitor) => {
    setEditingCompetitor(competitor);
    setFormData({
      name: competitor.name,
      url: competitor.url,
      category: competitor.category || '',
      platform: competitor.platform || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个竞品吗？相关的产品和告警也会被删除。')) {
      try {
        await competitorsAPI.delete(id);
        loadCompetitors();
      } catch (error) {
        console.error('Failed to delete competitor:', error);
        alert('删除失败');
      }
    }
  };

  const handleAddNew = () => {
    setEditingCompetitor(null);
    setFormData({ name: '', url: '', category: '', platform: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">🏪 竞品管理</h1>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          添加竞品
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map((competitor) => (
          <div key={competitor.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{competitor.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{competitor.platform || '未指定平台'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(competitor)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(competitor.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">🔗</span>
                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                  {competitor.url}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📂</span>
                <span>{competitor.category || '未分类'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  监控产品: <span className="font-semibold text-gray-800">{competitor.product_count || 0}</span>
                </div>
                {competitor.min_price && (
                  <div className="text-sm text-gray-500">
                    价格范围: <span className="font-semibold text-green-600">
                      ${competitor.min_price?.toFixed(2)} - ${competitor.max_price?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              添加时间: {new Date(competitor.created_at).toLocaleDateString('zh-CN')}
            </div>
          </div>
        ))}

        {competitors.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无监控竞品</h3>
              <p className="text-gray-500 mb-6">添加您想要监控的竞品平台，开始价格追踪</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                ➕ 添加第一个竞品
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingCompetitor ? '✏️ 编辑竞品' : '➕ 添加竞品'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  竞品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Amazon US"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  网站URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：https://www.amazon.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Electronics, Fashion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  平台
                </label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择平台</option>
                  <option value="Amazon">Amazon</option>
                  <option value="eBay">eBay</option>
                  <option value="AliExpress">AliExpress</option>
                  <option value="Walmart">Walmart</option>
                  <option value="Target">Target</option>
                  <option value="BestBuy">BestBuy</option>
                  <option value="Other">其他</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCompetitor(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingCompetitor ? '保存修改' : '添加竞品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Competitors;
