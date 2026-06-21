import { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  Box,
  DollarSign,
  Eye,
  EyeOff,
} from 'lucide-react';
import { products } from '@/data/mockData';
import { cn } from '@/lib/utils';

const categories = ['全部分类', '时长卡', '电竞周边', '赛事门票', '饮品', '零食'];

export default function ProductManagement() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [productList, setProductList] = useState(
    products.map((p) => ({ ...p, isActive: true }))
  );

  const filteredProducts = productList.filter((product) => {
    const matchCategory = selectedCategory === '全部分类' || product.category === selectedCategory;
    const matchSearch = !searchText ||
      product.name.toLowerCase().includes(searchText.toLowerCase());

    return matchCategory && matchSearch;
  });

  const stats = {
    total: productList.length,
    active: productList.filter((p) => p.isActive).length,
    lowStock: productList.filter((p) => p.stock < 20).length,
  };

  const toggleProductStatus = (id: string) => {
    setProductList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">商品管理</h1>
          <p className="text-dark-400 mt-1">管理商城商品与库存</p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 bg-cyber-600 hover:bg-cyber-500 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          添加商品
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Package className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">商品总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <Tag className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">已上架</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.active}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Box className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">低库存</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.lowStock}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-purple/20">
              <DollarSign className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-dark-400 text-sm">总价值</p>
          </div>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            ¥{productList.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索商品..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'h-9 px-4 text-sm whitespace-nowrap rounded-lg transition-colors',
                  selectedCategory === cat
                    ? 'bg-cyber-600 text-white'
                    : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dark-700 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-cyber-600 text-white'
                  : 'bg-dark-900 text-dark-400 hover:text-white'
              )}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-cyber-600 text-white'
                  : 'bg-dark-900 text-dark-400 hover:text-white'
              )}
            >
              卡片
            </button>
          </div>
          <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  商品信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  库存
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-xs text-dark-400 max-w-xs truncate">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-cyber-500/20 text-cyber-400 rounded">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-white">¥{product.price}</p>
                      <p className="text-xs text-dark-400">{product.pointsCost} 积分</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'text-sm font-medium',
                      product.stock < 20 ? 'text-neon-red' : product.stock < 50 ? 'text-neon-orange' : 'text-neon-green'
                    )}>
                      {product.stock} 件
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2.5 py-1 text-xs font-medium rounded-full',
                      product.isActive
                        ? 'bg-neon-green/20 text-neon-green'
                        : 'bg-dark-600 text-dark-300'
                    )}>
                      {product.isActive ? '已上架' : '已下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className="p-1.5 text-dark-400 hover:text-cyber-400 transition-colors"
                        title={product.isActive ? '下架' : '上架'}
                      >
                        {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-dark-400 hover:text-cyber-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-dark-400 hover:text-neon-red transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-500/50"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {!product.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-dark-300 font-medium">已下架</span>
                  </div>
                )}
                {product.stock < 20 && product.isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-neon-red/90 text-white px-2 py-0.5 rounded">
                      仅剩 {product.stock} 件
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <h3 className="text-white text-sm font-medium line-clamp-2 h-10">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-neon-green font-bold font-orbitron">¥{product.price}</span>
                    <span className="text-xs text-dark-500 line-through ml-2">
                      {product.pointsCost}积分
                    </span>
                  </div>
                  <span className="text-xs text-dark-400">库存: {product.stock}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-dark-700">
                  <button className="flex-1 h-8 bg-dark-700 hover:bg-dark-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => toggleProductStatus(product.id)}
                    className={cn(
                      'flex-1 h-8 text-xs rounded-lg transition-colors flex items-center justify-center gap-1',
                      product.isActive
                        ? 'bg-neon-orange/20 hover:bg-neon-orange/30 text-neon-orange'
                        : 'bg-neon-green/20 hover:bg-neon-green/30 text-neon-green'
                    )}
                  >
                    {product.isActive ? '下架' : '上架'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的商品</p>
        </div>
      )}
    </div>
  );
}
