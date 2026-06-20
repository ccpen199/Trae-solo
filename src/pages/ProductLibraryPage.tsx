import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Camera, Watch, Briefcase, Gem, Laptop,
  Search, Filter, ChevronRight, Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import type { Brand, Model, Category } from '@/types';

const categories: (Category & { Icon: React.ComponentType<{ className?: string }> })[] = [
  { id: '1', name: '全部', icon: 'all', avgPrice: '', Icon: Grid3X3 },
  { id: '2', name: '手机', icon: 'phone', avgPrice: '', Icon: Smartphone },
  { id: '3', name: '相机', icon: 'camera', avgPrice: '', Icon: Camera },
  { id: '4', name: '名表', icon: 'watch', avgPrice: '', Icon: Watch },
  { id: '5', name: '包包', icon: 'bag', avgPrice: '', Icon: Briefcase },
  { id: '6', name: '珠宝', icon: 'jewelry', avgPrice: '', Icon: Gem },
  { id: '7', name: '笔记本', icon: 'laptop', avgPrice: '', Icon: Laptop },
];

const brandsList: Brand[] = [
  { id: 'b1', name: 'Rolex', categoryId: '4' },
  { id: 'b2', name: 'Apple', categoryId: '2' },
  { id: 'b3', name: 'Hermès', categoryId: '5' },
  { id: 'b4', name: 'Chanel', categoryId: '5' },
  { id: 'b5', name: 'Sony', categoryId: '3' },
  { id: 'b6', name: 'Omega', categoryId: '4' },
  { id: 'b7', name: 'Cartier', categoryId: '6' },
  { id: 'b8', name: 'LV', categoryId: '5' },
  { id: 'b9', name: 'Canon', categoryId: '3' },
  { id: 'b10', name: '华为', categoryId: '2' },
  { id: 'b11', name: 'Patek', categoryId: '4' },
  { id: 'b12', name: 'Leica', categoryId: '3' },
  { id: 'b13', name: 'Dior', categoryId: '5' },
  { id: 'b14', name: 'VCA', categoryId: '6' },
  { id: 'b15', name: 'MacBook', categoryId: '7' },
  { id: 'b16', name: 'Gucci', categoryId: '5' },
];

const brandModels: Record<string, Model[]> = {
  default: [
    { id: 'md1', name: '经典款 25mm 黑色', brandId: 'default', startPrice: 8500, sGradeAvgPrice: 12800 },
    { id: 'md2', name: '专业版 X 银灰色', brandId: 'default', startPrice: 15800, sGradeAvgPrice: 21500 },
    { id: 'md3', name: '旗舰款 Pro Max 金色', brandId: 'default', startPrice: 25000, sGradeAvgPrice: 32800 },
    { id: 'md4', name: '限量版 50周年纪念款', brandId: 'default', startPrice: 45000, sGradeAvgPrice: 68000 },
    { id: 'md5', name: '入门款 基础版 白色', brandId: 'default', startPrice: 4200, sGradeAvgPrice: 5800 },
    { id: 'md6', name: '运动版 钛金属款', brandId: 'default', startPrice: 32000, sGradeAvgPrice: 42500 },
    { id: 'md7', name: '复古款 手卷上链', brandId: 'default', startPrice: 18500, sGradeAvgPrice: 25600 },
    { id: 'md8', name: '时尚款 小牛皮表带', brandId: 'default', startPrice: 12000, sGradeAvgPrice: 16800 },
  ],
};

const gradients = [
  'from-emerald-600/40 via-green-700/30 to-transparent',
  'from-blue-600/40 via-indigo-700/30 to-transparent',
  'from-amber-600/40 via-orange-700/30 to-transparent',
  'from-rose-600/40 via-pink-700/30 to-transparent',
  'from-purple-600/40 via-violet-700/30 to-transparent',
  'from-cyan-600/40 via-teal-700/30 to-transparent',
];

const ProductLibraryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = React.useState('1');
  const [activeBrand, setActiveBrand] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState('');

  const filteredBrands = brandsList;
  const models = brandModels.default;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-3"
        >
          <Badge variant="gold">商品库</Badge>
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 tracking-tight">
            探索<span className="gold-text">50,000+</span>款奢侈品型号
          </h1>
          <p className="text-ink-300">精准查询每款型号的回收价格、成色标准和真伪鉴别要点</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-2 rounded-3xl border border-white/[0.06] bg-ink-850/60 backdrop-blur-xl flex items-center gap-2"
        >
          <div className="flex-1 flex items-center h-12 px-5 rounded-2xl bg-ink-800/60">
            <Search className="w-5 h-5 text-ink-400 shrink-0" />
            <input
              type="text"
              placeholder="搜索品牌、型号、关键词..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-full bg-transparent ml-3 text-base text-ink-100 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
          <Button variant="primary" size="md" className="hidden sm:inline-flex">
            <Filter className="w-4 h-4" />
            高级筛选
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <Tabs
            variant="pills"
            tabs={categories.map((c) => ({
              id: c.id,
              label: c.name,
              icon: <c.Icon className="w-4 h-4" />,
            }))}
            activeTab={activeCategory}
            onChange={setActiveCategory}
          />
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-50">品牌列表</h3>
              <Badge variant="info">{filteredBrands.length}</Badge>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredBrands.map((brand) => {
                const isActive = activeBrand === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => setActiveBrand(brand.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 text-left ${
                      isActive
                        ? 'bg-gold-soft gold-border shadow-gold-sm'
                        : 'bg-ink-800/40 border-white/[0.06] hover:border-gold-500/30 hover:bg-ink-800/70'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        isActive ? 'bg-gold-gradient text-ink-950' : 'bg-ink-700 text-ink-300'
                      }`}
                    >
                      {brand.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isActive ? 'text-gold-400' : 'text-ink-100'}`}>
                        {brand.name}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {brandModels.default.length} 款型号
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-400' : 'text-ink-500'}`}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-9 space-y-5"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-ink-50 text-lg">
                  {activeBrand ? `${filteredBrands.find((b) => b.id === activeBrand)?.name} 型号` : '全部热门型号'}
                </h3>
                <Badge variant="success">{models.length} 款</Badge>
              </div>
              <div className="text-sm text-ink-400">按热度排序</div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {models.map((model, i) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="p-0 overflow-hidden h-full cursor-pointer group hover:shadow-gold-sm hover:gold-border transition-all duration-400">
                    <div className={`relative aspect-[4/3] bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display text-6xl font-bold text-white/20 tracking-tighter">
                          {model.name[0]}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge variant="gold">S级</Badge>
                      </div>
                    </div>
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h4 className="font-semibold text-ink-50 group-hover:text-gold-400 transition-colors truncate">
                          {model.name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
                        <div>
                          <p className="text-xs text-ink-400">起售价</p>
                          <p className="text-sm font-semibold text-ink-200">¥{model.startPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-400">S级均价</p>
                          <p className="text-sm font-bold gold-text">¥{model.sGradeAvgPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full">
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export { ProductLibraryPage };
export default ProductLibraryPage;
