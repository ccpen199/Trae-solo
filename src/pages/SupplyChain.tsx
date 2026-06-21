import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, Package, Truck, MapPin, X, CheckCircle2, FileText } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import type { MaterialProduct } from '@/types';

const categoryOptions = ['全部分类', '地砖', '木地板', '洁具', '墙砖', '室内门', '橱柜'];

const logisticsIcons: Record<string, React.ReactNode> = {
  '已出库': <Package className="w-5 h-5" />,
  '运输中': <Truck className="w-5 h-5" />,
  '已到达': <MapPin className="w-5 h-5" />,
  '已入库': <Package className="w-5 h-5" />,
  '配送中': <Truck className="w-5 h-5" />,
  '已签收': <CheckCircle2 className="w-5 h-5" />,
  '待配送': <MapPin className="w-5 h-5" />,
};

export default function SupplyChain() {
  const { products } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部分类');
  const [selectedProduct, setSelectedProduct] = useState<MaterialProduct | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.includes(searchQuery) ||
        product.brand.includes(searchQuery) ||
        product.traceCode.includes(searchQuery);
      const matchesCategory = selectedCategory === '全部分类' ||
        product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const closeDrawer = () => setSelectedProduct(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-8 py-6"
      >
        <h1 className="text-3xl font-bold text-gray-900">主材供应链溯源</h1>
        <p className="text-gray-500 mt-1">品牌授权·质检·物流全链路可追溯</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b border-gray-200 px-8 py-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索产品名称、品牌或溯源码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex">
                  <div className="w-40 h-40 flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {product.category}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        溯源码: {product.traceCode}
                      </span>
                      {product.brandAuthorization.verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-success-100 text-success-700 text-xs rounded">
                          <ShieldCheck className="w-3 h-3" />
                          品牌已验证
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xl font-bold text-amber-600">
                        {formatCurrency(product.price)}/{product.category === '地砖' || product.category === '木地板' ? '㎡' : '件'}
                      </span>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        查看溯源详情
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[500px] bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-gray-900">溯源详情</h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedProduct.brand}</p>
                    <p className="text-lg font-bold text-amber-600 mt-2">
                      {formatCurrency(selectedProduct.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {selectedProduct.traceCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-success-50 rounded-xl p-4 border border-success-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-success-600" />
                    <div>
                      <p className="font-medium text-success-900">品牌授权已验证</p>
                      <p className="text-sm text-success-700">{selectedProduct.brandAuthorization.issuer}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-success-200">
                    <div className="flex items-center justify-center">
                      <div className="w-32 h-32 rounded-lg bg-white border-2 border-dashed border-success-300 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="w-10 h-10 text-success-400 mx-auto" />
                          <p className="text-xs text-success-600 mt-1">电子印章</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-success-600 mt-2">
                      有效期：{formatDate(selectedProduct.brandAuthorization.validFrom)} ~ {formatDate(selectedProduct.brandAuthorization.validTo)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">质检报告</h4>
                  {selectedProduct.qualityReports.map((report) => (
                    <div key={report.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">批次：{report.batchNumber}</p>
                          <p className="text-xs text-gray-500">检测日期：{formatDate(report.testDate)}</p>
                        </div>
                        <span className="flex items-center gap-1 text-success-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          合格
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {report.testItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-900 font-medium">{item.result}</span>
                              <span className="text-xs text-gray-400">标准：{item.standard}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">物流轨迹</h4>
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {selectedProduct.logistics.map((log, index) => {
                        const Icon = logisticsIcons[log.status] || <Package className="w-5 h-5" />;
                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-14"
                          >
                            <div className="absolute left-4 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-4 border-gray-100 flex items-center justify-center z-10 text-amber-500">
                              {Icon}
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-gray-100">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{log.status}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{log.location}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    操作员：{log.operator}
                                  </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {formatDateTime(log.timestamp)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
