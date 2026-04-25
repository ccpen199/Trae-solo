import { useState, useEffect } from 'react';
import { productsAPI, competitorsAPI } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function Products() {
  const [products, setProducts] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [compareProductName, setCompareProductName] = useState('');
  const [comparedProducts, setComparedProducts] = useState([]);
  const [formData, setFormData] = useState({
    competitor_id: '',
    product_name: '',
    product_url: '',
    current_price: '',
    original_price: '',
    currency: 'USD',
    stock_status: 'In Stock'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, competitorsRes] = await Promise.all([
        productsAPI.getAll(),
        competitorsAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setCompetitors(competitorsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      const data = {
        ...formData,
        current_price: parseFloat(formData.current_price) || 0,
        original_price: parseFloat(formData.original_price) || parseFloat(formData.current_price) || 0,
        competitor_id: parseInt(formData.competitor_id)
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
      } else {
        await productsAPI.create(data);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        competitor_id: '',
        product_name: '',
        product_url: '',
        current_price: '',
        original_price: '',
        currency: 'USD',
        stock_status: 'In Stock'
      });
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('保存失败，请检查输入');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      competitor_id: product.competitor_id.toString(),
      product_name: product.product_name,
      product_url: product.product_url || '',
      current_price: product.current_price.toString(),
      original_price: product.original_price.toString(),
      currency: product.currency,
      stock_status: product.stock_status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个产品吗？')) {
      try {
        await productsAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('删除失败');
      }
    }
  };

  const handleViewDetail = async (product) => {
    try {
      const response = await productsAPI.getById(product.id);
      setSelectedProduct(response.data);
    } catch (error) {
      console.error('Failed to load product detail:', error);
    }
  };

  const handleCompare = async () => {
    if (!compareProductName.trim()) {
      alert('请输入产品名称进行对比');
      return;
    }
    try {
      const response = await productsAPI.compare(compareProductName);
      setComparedProducts(response.data);
    } catch (error) {
      console.error('Failed to compare products:', error);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      competitor_id: competitors.length > 0 ? competitors[0].id.toString() : '',
      product_name: '',
      product_url: '',
      current_price: '',
      original_price: '',
      currency: 'USD',
      stock_status: 'In Stock'
    });
    setShowModal(true);
  };

  const getPriceHistoryChartData = () => {
    if (!selectedProduct || !selectedProduct.priceHistory) return null;

    const history = selectedProduct.priceHistory.slice().reverse();
    const labels = history.map(h => new Date(h.recorded_at).toLocaleDateString('zh-CN'));
    const data = history.map(h => h.price);

    return {
      labels: [...labels, new Date(selectedProduct.recorded_at).toLocaleDateString('zh-CN')],
      datasets: [
        {
          label: '价格趋势',
          data: [...data, selectedProduct.current_price],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
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
        <h1 className="text-2xl font-bold text-gray-800">📦 产品监控</h1>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          添加产品
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 产品价格对比</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={compareProductName}
            onChange={(e) => setCompareProductName(e.target.value)}
            placeholder="输入产品名称进行对比，例如：iPhone 15"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleCompare()}
          />
          <button
            onClick={handleCompare}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            对比价格
          </button>
        </div>

        {comparedProducts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-700 mb-3">
              找到 {comparedProducts.length} 个竞品的同款产品
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm text-gray-500">{product.competitor_name}</span>
                      {index === 0 && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                          最低价
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    ${product.current_price?.toFixed(2)}
                  </div>
                  {product.original_price > product.current_price && (
                    <div className="text-sm text-red-500">
                      原价 ${product.original_price?.toFixed(2)}
                      <span className="ml-2">
                        省 ${(product.original_price - product.current_price).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-400">
                    库存: {product.stock_status === 'In Stock' ? '有货' : 
                           product.stock_status === 'Limited Stock' ? '库存紧张' : '缺货'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 监控产品列表</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  产品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  竞品平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  原价
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  库存
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                    {product.product_url && (
                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        查看原链接 →
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.competitor_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-600">
                      ${product.current_price?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${
                      product.original_price > product.current_price ? 'line-through text-gray-400' : 'text-gray-600'
                    }`}>
                      ${product.original_price?.toFixed(2)}
                    </span>
                    {product.original_price > product.current_price && (
                      <span className="ml-2 text-xs text-red-500 font-medium">
                        -{((product.original_price - product.current_price) / product.original_price * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock_status === 'In Stock' 
                        ? 'bg-green-100 text-green-800'
                        : product.stock_status === 'Limited Stock'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock_status === 'In Stock' ? '有库存' : 
                       product.stock_status === 'Limited Stock' ? '库存紧张' : '缺货'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetail(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        📊 详情
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        ✏️ 编辑
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">暂无监控产品</h3>
              <p className="text-gray-500">添加产品开始监控价格变化</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingProduct ? '✏️ 编辑产品' : '➕ 添加产品'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属竞品 <span className="text-red-500">*</span>
                </label>
                <select
                  name="competitor_id"
                  value={formData.competitor_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择竞品</option>
                  {competitors.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：iPhone 15 Pro Max"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品链接
                </label>
                <input
                  type="url"
                  name="product_url"
                  value={formData.product_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前价格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="current_price"
                    value={formData.current_price}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1199.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    原价
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_price"
                    value={formData.original_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1299.99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    货币
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    库存状态
                  </label>
                  <select
                    name="stock_status"
                    value={formData.stock_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="In Stock">有库存</option>
                    <option value="Limited Stock">库存紧张</option>
                    <option value="Out of Stock">缺货</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingProduct ? '保存修改' : '添加产品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-800">📊 产品详情</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">产品名称</p>
                <p className="text-lg font-semibold text-gray-800">{selectedProduct.product_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">竞品平台</p>
                <p className="text-lg font-semibold text-gray-800">{selectedProduct.competitor_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">当前价格</p>
                <p className="text-2xl font-bold text-green-600">${selectedProduct.current_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">原价</p>
                <p className={`text-lg ${
                  selectedProduct.original_price > selectedProduct.current_price 
                    ? 'line-through text-gray-400' 
                    : 'text-gray-800'
                }`}>
                  ${selectedProduct.original_price?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">库存状态</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedProduct.stock_status === 'In Stock' 
                    ? 'bg-green-100 text-green-800'
                    : selectedProduct.stock_status === 'Limited Stock'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedProduct.stock_status === 'In Stock' ? '有库存' : 
                   selectedProduct.stock_status === 'Limited Stock' ? '库存紧张' : '缺货'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">最后更新</p>
                <p className="text-gray-800">
                  {new Date(selectedProduct.recorded_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>

            {selectedProduct.priceHistory && selectedProduct.priceHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 价格历史趋势</h3>
                <div className="h-64">
                  <Line
                    data={getPriceHistoryChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">历史价格记录</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-500">时间</th>
                          <th className="px-4 py-2 text-left text-gray-500">价格</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-green-50">
                          <td className="px-4 py-2">
                            {new Date(selectedProduct.recorded_at).toLocaleString('zh-CN')}
                            <span className="ml-2 text-xs text-green-600">(当前)</span>
                          </td>
                          <td className="px-4 py-2 font-bold text-green-600">
                            ${selectedProduct.current_price?.toFixed(2)}
                          </td>
                        </tr>
                        {selectedProduct.priceHistory.map((record, index) => (
                          <tr key={record.id}>
                            <td className="px-4 py-2 text-gray-600">
                              {new Date(record.recorded_at).toLocaleString('zh-CN')}
                            </td>
                            <td className="px-4 py-2 text-gray-800">
                              ${record.price?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
