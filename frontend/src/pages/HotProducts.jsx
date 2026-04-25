import { useState, useEffect } from 'react';
import { hotProductsAPI, competitorsAPI } from '../services/api';

function HotProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingProduct, setImportingProduct] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 16
  });
  const [importForm, setImportForm] = useState({
    competitor_id: '',
    current_price: '',
    product_url: '',
    stock_status: 'In Stock'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, sortBy, pagination.currentPage]);

  const loadInitialData = async () => {
    try {
      const [categoriesRes, statsRes, competitorsRes] = await Promise.all([
        hotProductsAPI.getCategories(),
        hotProductsAPI.getStats(),
        competitorsAPI.getAll()
      ]);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      setCompetitors(competitorsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      };
      
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (sortBy === 'price_low') params.sort = 'price_low';
      else if (sortBy === 'price_high') params.sort = 'price_high';
      
      const response = await hotProductsAPI.getAll(params);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSelectedProducts(new Set());
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = products.map(p => p.id);
    const newSelected = new Set(selectedProducts);
    visibleIds.forEach(id => newSelected.add(id));
    setSelectedProducts(newSelected);
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const openImportModal = (product = null) => {
    setImportingProduct(product);
    if (product) {
      const avgPrice = (product.avg_price_min + product.avg_price_max) / 2;
      setImportForm({
        competitor_id: competitors.length > 0 ? competitors[0].id.toString() : '',
        current_price: avgPrice.toFixed(2),
        product_url: '',
        stock_status: 'In Stock'
      });
    } else {
      setImportForm({
        competitor_id: competitors.length > 0 ? competitors[0].id.toString() : '',
        current_price: '',
        product_url: '',
        stock_status: 'In Stock'
      });
    }
    setShowImportModal(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    try {
      if (importingProduct) {
        await hotProductsAPI.import({
          hotProductId: importingProduct.id,
          competitor_id: parseInt(importForm.competitor_id),
          current_price: parseFloat(importForm.current_price),
          product_url: importForm.product_url,
          stock_status: importForm.stock_status
        });
      } else {
        await hotProductsAPI.importBatch({
          productIds: Array.from(selectedProducts),
          competitor_id: parseInt(importForm.competitor_id),
          default_stock: importForm.stock_status
        });
      }
      setShowImportModal(false);
      setSelectedProducts(new Set());
      loadProducts();
      alert(importingProduct ? '产品导入成功！' : '批量导入成功！');
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败：' + (error.response?.data?.error || '未知错误'));
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Electronics': return '📱';
      case 'Beauty': return '💄';
      case 'Fashion': return '👟';
      case 'Home': return '🏠';
      case 'Toys': return '🧸';
      default: return '📦';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Electronics': return '电子产品';
      case 'Beauty': return '美妆护肤';
      case 'Fashion': return '时尚服饰';
      case 'Home': return '家居生活';
      case 'Toys': return '玩具礼品';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🔥 爆款商品前100</h1>
          <p className="text-gray-500 mt-1">快速导入跨境购物热门商品到您的监控列表</p>
        </div>
        {selectedProducts.size > 0 && (
          <button
            onClick={() => openImportModal(null)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <span className="mr-2">📥</span>
            批量导入 ({selectedProducts.size})
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-2xl font-bold">{stats.overview.total_products}</div>
            <div className="text-sm text-blue-100">全部爆款商品</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="text-3xl mb-1">✅</div>
            <div className="text-2xl font-bold">{stats.overview.imported_products}</div>
            <div className="text-sm text-green-100">已导入监控</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="text-3xl mb-1">📂</div>
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-purple-100">商品分类</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-2xl font-bold">${stats.overview.avg_price?.toFixed(2)}</div>
            <div className="text-sm text-orange-100">平均价格</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔥 全部热门
            </button>
            {categories.map(cat => (
              <button
                key={cat.category}
                onClick={() => handleCategoryChange(cat.category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryIcon(cat.category)} {getCategoryLabel(cat.category)} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索商品名称、品牌或标签..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔍 搜索
            </button>
          </form>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">🔥 热度最高</option>
              <option value="price_low">💰 价格从低到高</option>
              <option value="price_high">💰 价格从高到低</option>
            </select>

            <button
              onClick={selectAllVisible}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              全选当前页
            </button>

            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消选择
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-xl text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                    selectedProducts.has(product.id)
                      ? 'border-blue-500 bg-blue-50'
                      : product.is_imported
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-2xl">{getCategoryIcon(product.category)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {product.is_imported && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          已导入
                        </span>
                      )}
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-500">⭐</span>
                        <span className="ml-1 font-medium text-gray-700">{product.popularity_score}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="text-sm text-gray-500 mb-2">
                    {product.brand && <span className="font-medium text-gray-600">{product.brand}</span>}
                    {product.sub_category && <span className="ml-2">· {product.sub_category}</span>}
                  </div>

                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-green-600">
                        ${product.avg_price_min?.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {' '}- ${product.avg_price_max?.toFixed(2)}
                      </span>
                    </div>
                    {product.tags && (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.split(',').slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {!product.is_imported && (
                    <button
                      onClick={() => openImportModal(product)}
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      📥 导入监控
                    </button>
                  )}
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">未找到匹配商品</h3>
                <p className="text-gray-500">请尝试其他搜索关键词或分类</p>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                <span className="text-gray-600">
                  第 {pagination.currentPage} 页 / 共 {pagination.totalPages} 页
                  ({pagination.totalItems} 件商品)
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {stats && stats.byCategory && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 各分类热门商品分布</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.byCategory.map((cat) => (
              <div key={cat.category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getCategoryIcon(cat.category)}</span>
                  <span className="font-semibold text-gray-800">{getCategoryLabel(cat.category)}</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{cat.count}</div>
                <div className="text-xs text-gray-500">
                  价格范围: ${cat.min_price?.toFixed(2)} - ${cat.max_price?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {importingProduct ? '📥 导入商品到监控' : '📦 批量导入商品'}
            </h2>

            {!importingProduct && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  已选择 <strong>{selectedProducts.size}</strong> 件商品准备导入
                </p>
              </div>
            )}

            {importingProduct && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{importingProduct.name}</p>
                <p className="text-sm text-gray-500">
                  参考价格: ${importingProduct.avg_price_min?.toFixed(2)} - ${importingProduct.avg_price_max?.toFixed(2)}
                </p>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择竞品平台 <span className="text-red-500">*</span>
                </label>
                <select
                  value={importForm.competitor_id}
                  onChange={(e) => setImportForm(prev => ({ ...prev, competitor_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择竞品平台</option>
                  {competitors.map(comp => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.platform || comp.category})
                    </option>
                  ))}
                </select>
              </div>

              {importingProduct && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      当前价格
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={importForm.current_price}
                      onChange={(e) => setImportForm(prev => ({ ...prev, current_price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入价格"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      产品链接
                    </label>
                    <input
                      type="url"
                      value={importForm.product_url}
                      onChange={(e) => setImportForm(prev => ({ ...prev, product_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  库存状态
                </label>
                <select
                  value={importForm.stock_status}
                  onChange={(e) => setImportForm(prev => ({ ...prev, stock_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="In Stock">有库存</option>
                  <option value="Limited Stock">库存紧张</option>
                  <option value="Out of Stock">缺货</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {importingProduct ? '确认导入' : '确认批量导入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotProducts;
