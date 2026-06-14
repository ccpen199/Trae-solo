import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  SlidersHorizontal,
  Check,
  X,
  Search,
  Heart,
  Plus,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { message, Drawer, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { cn } from '@/lib/utils';

const categories = [
  { key: 'floor', label: '地板', count: 328, icon: '🪵' },
  { key: 'tile', label: '瓷砖', count: 456, icon: '🔲' },
  { key: 'paint', label: '墙面涂料', count: 189, icon: '🎨' },
  { key: 'wallpaper', label: '墙纸', count: 156, icon: '📜' },
  { key: 'door', label: '木门', count: 312, icon: '🚪' },
  { key: 'cabinet', label: '橱柜', count: 234, icon: '🗄️' },
  { key: 'bathroom', label: '卫浴', count: 267, icon: '🚿' },
  { key: 'lighting', label: '灯具', count: 421, icon: '💡' },
  { key: 'furniture', label: '家具', count: 389, icon: '🛋️' },
  { key: 'soft', label: '软装', count: 578, icon: '🧸' },
];

const styleOptions = [
  { key: 'all', label: '全部风格' },
  { key: 'nordic', label: '北欧' },
  { key: 'modern', label: '现代简约' },
  { key: 'chinese', label: '中式' },
  { key: 'american', label: '美式' },
  { key: 'japanese', label: '日式' },
  { key: 'luxury', label: '轻奢' },
  { key: 'industrial', label: '工业风' },
];

const brands: Record<string, string[]> = {
  floor: ['圣象', '大自然', '德尔', '菲林格尔', '生活家'],
  tile: ['马可波罗', '东鹏', '诺贝尔', '蒙娜丽莎', '冠珠'],
  paint: ['多乐士', '立邦', '芬琳', '都芳', '三棵树'],
  cabinet: ['欧派', '索菲亚', '尚品宅配', '志邦', '金牌'],
  door: ['TATA', '梦天', '美心', '盼盼', '步阳'],
  bathroom: ['科勒', 'TOTO', '九牧', '箭牌', '恒洁'],
  lighting: ['欧普', '雷士', '飞利浦', '松下', '造作'],
  soft: ['宜家', '无印良品', '造作', '吱音', '梵几'],
};

const priceRanges = [
  { label: '¥200以下', min: 0, max: 200 },
  { label: '¥200-500', min: 200, max: 500 },
  { label: '¥500-1000', min: 500, max: 1000 },
  { label: '¥1000-3000', min: 1000, max: 3000 },
  { label: '¥3000以上', min: 3000, max: Infinity },
];

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  price: number;
  unit: string;
  image: string;
  rating: number;
  style: string[];
  material: string;
  origin: string;
  warranty: string;
  ecoLevel: string;
}

const materialNames: Record<string, string[]> = {
  floor: ['北欧白橡木地板', '深胡桃三层实木', '灰色强化复合', '缅甸柚木原木地板', '亚花梨人字拼', '枫木运动地板', '黑胡桃鱼骨拼', '番龙眼仿古地板'],
  tile: ['爵士白大理石瓷砖', '卡拉拉灰柔光砖', '莫兰迪彩色马卡龙', '水泥砖工业风', '木纹砖仿木地板', '六角砖小花砖', '大板岩板背景墙', '仿古砖地中海'],
  paint: ['莫兰迪灰墙面漆', '象牙白乳胶漆', '雾霾蓝艺术漆', '奶茶色环保漆', '抹茶绿硅藻泥', '珊瑚橙净味漆', '太空灰水泥漆', '暖米白儿童漆'],
  cabinet: ['北欧白橡橱柜', '轻奢岩板橱柜', '工业风水泥橱柜', '新中式实木橱柜', '极简PET肤感', '美式乡村仿古', '现代烤漆亮面', '日式原木橱柜'],
  door: ['极简隐形门', '北欧白橡室内门', '法式拱形门', '长虹玻璃厨卫门', '新中式花格门', '工业风谷仓门', '美式实木套装门', '隔音静音门'],
  bathroom: ['智能一体坐便器', '恒温淋浴花洒套装', '岩板一体浴室柜', '亚克力独立浴缸', '壁挂式智能马桶', '金色轻奢五金', '日式整体浴柜', '仿大理石台面盆'],
  lighting: ['黄铜极简吊灯', '北欧魔豆分子灯', '日式原木吸顶灯', '轻奢水晶客厅灯', '工业风轨道射灯', '新中式禅意茶室灯', '卧室云朵吸顶灯', '餐厅长条吧台灯'],
  soft: ['云朵亚麻三人沙发', '北欧单人休闲椅', '日式原木茶几', '轻奢岩板餐桌', '法式复古梳妆台', '羊毛混纺地毯', '棉麻遮光窗帘', '黄铜落地衣架'],
};

const units: Record<string, string> = {
  floor: '㎡', tile: '㎡', paint: '桶', cabinet: '延米',
  door: '扇', bathroom: '套', lighting: '盏', soft: '件',
};

const specsByCategory: Record<string, string[]> = {
  floor: ['1210×195×15mm', '910×125×18mm', '1200×180×12mm', '600×120×15mm'],
  tile: ['800×800mm', '600×1200mm', '300×600mm', '750×1500mm'],
  paint: ['5L', '18L', '20kg', '1L色彩样罐'],
  cabinet: ['一字型3m', 'L型4m', '高柜600mm', '台面20mm'],
  door: ['2100×900mm', '2200×950mm', '2400×1000mm', '厨卫窄边框'],
  bathroom: ['700mm浴室柜', '305mm坑距', '恒温三出水', '1.5m浴缸'],
  lighting: ['36W', '48W', '三色调光', '轨道磁吸款'],
  soft: ['三人位', '1.8m床配套', '160×230cm', '定制宽幅'],
  wallpaper: ['0.53×10m/卷', '0.7×10m/卷', '墙布2.8m高', '定制壁画'],
  furniture: ['1200×600mm', '1600×800mm', '1800×2000mm', '模块组合'],
};

const materialStyles: Record<string, string[][]> = {
  floor: [['nordic', 'modern', 'japanese'], ['modern', 'industrial'], ['modern', 'minimalist'], ['chinese', 'american'], ['nordic', 'modern'], ['modern', 'industrial'], ['luxury', 'chinese'], ['american', 'chinese']],
  tile: [['luxury', 'modern'], ['modern', 'nordic'], ['nordic', 'modern'], ['industrial', 'modern'], ['nordic', 'japanese'], ['mediterranean', 'nordic'], ['luxury', 'modern'], ['mediterranean', 'american']],
  paint: [['nordic', 'modern'], ['modern', 'minimalist'], ['industrial', 'modern'], ['modern', 'nordic'], ['japanese', 'nordic'], ['modern', 'nordic'], ['industrial', 'modern'], ['modern', 'nordic']],
  cabinet: [['nordic', 'modern'], ['luxury', 'modern'], ['industrial', 'modern'], ['chinese', 'luxury'], ['modern', 'minimalist'], ['american', 'chinese'], ['modern', 'luxury'], ['japanese', 'nordic']],
  door: [['modern', 'minimalist'], ['nordic', 'modern'], ['american', 'french'], ['modern', 'nordic'], ['chinese', 'luxury'], ['industrial', 'modern'], ['american', 'chinese'], ['modern', 'nordic']],
  bathroom: [['modern', 'luxury'], ['modern', 'nordic'], ['modern', 'minimalist'], ['american', 'modern'], ['modern', 'luxury'], ['luxury', 'modern'], ['japanese', 'nordic'], ['modern', 'luxury']],
  lighting: [['modern', 'luxury'], ['nordic', 'modern'], ['japanese', 'nordic'], ['luxury', 'modern'], ['industrial', 'modern'], ['chinese', 'luxury'], ['nordic', 'modern'], ['industrial', 'modern']],
  soft: [['nordic', 'modern'], ['nordic', 'japanese'], ['nordic', 'modern'], ['modern', 'luxury'], ['french', 'american'], ['modern', 'nordic'], ['modern', 'nordic'], ['modern', 'industrial']],
  wallpaper: [['nordic', 'modern'], ['chinese', 'luxury'], ['modern', 'minimalist'], ['nordic', 'japanese'], ['american', 'french'], ['modern', 'luxury'], ['industrial', 'modern'], ['nordic', 'modern']],
  furniture: [['nordic', 'modern'], ['modern', 'luxury'], ['japanese', 'nordic'], ['chinese', 'luxury'], ['modern', 'minimalist'], ['american', 'chinese'], ['nordic', 'modern'], ['industrial', 'modern']],
};

const materialTypes: Record<string, string[]> = {
  floor: ['白橡木', '黑胡桃', '强化复合', '柚木', '亚花梨', '枫木', '黑胡桃', '番龙眼'],
  tile: ['大理石', '陶瓷', '莫兰迪瓷', '水泥砖', '木纹砖', '陶瓷', '岩板', '仿古砖'],
  paint: ['乳胶漆', '乳胶漆', '艺术漆', '环保漆', '硅藻泥', '净味漆', '水泥漆', '儿童漆'],
  cabinet: ['颗粒板', '多层实木板', '密度板', '实木', 'PET板', '实木', '烤漆板', '原木'],
  door: ['实木复合', '白橡木', '密度板', '玻璃+铝合金', '实木', '实木', '实木复合', '实木复合'],
  bathroom: ['陶瓷', '铜+不锈钢', '岩板+实木', '亚克力', '陶瓷', '黄铜', '实木+陶瓷', '陶瓷'],
  lighting: ['黄铜+玻璃', '铁艺+玻璃', '原木+亚克力', '水晶+金属', '铝合金+LED', '实木+羊皮纸', '亚克力+金属', '铁艺+玻璃'],
  soft: ['亚麻+实木', '棉麻+实木', '实木', '岩板+实木', '密度板+油漆', '羊毛+晴纶', '亚麻+涤纶', '黄铜+铁'],
  wallpaper: ['无纺布', 'PVC', '纯纸', '无纺布', '丝绸', '无纺布', 'PVC', '无纺布'],
};

const origins = ['中国广东', '中国浙江', '德国进口', '意大利进口', '日本进口', '中国江苏', '中国福建', '中国山东'];
const warranties = ['1年', '2年', '3年', '5年', '10年', '15年', '20年', '终身质保'];
const ecoLevels = ['E0级', 'ENF级', 'E1级', '国家A级', '欧盟CE认证', 'CARB P2', 'F★★★★', '十环认证'];

function generateMaterials(category: string): MaterialItem[] {
  const names = materialNames[category] || materialNames.floor;
  const brandList = brands[category] || brands.floor;
  const styles = materialStyles[category] || materialStyles.floor;
  const types = materialTypes[category] || materialTypes.floor;
  const specs = specsByCategory[category] || specsByCategory.floor;
  const categoryPrompts: Record<string, string> = {
    floor: 'wood floor texture product shot professional lighting',
    tile: 'ceramic tile marble texture product photography',
    paint: 'paint can color swatch interior wall product',
    cabinet: 'kitchen cabinet door panel product shot',
    door: 'interior door design product photography studio',
    bathroom: 'bathroom fixture product photography white background',
    lighting: 'modern pendant lamp chandelier product shot',
    soft: 'sofa furniture product photography studio lighting',
    wallpaper: 'wallpaper roll pattern texture product photography',
    furniture: 'wooden furniture product photography studio lighting',
  };
  const unit = units[category];

  return names.map((name, i) => {
    const basePrice = [188, 356, 488, 698, 988, 1288, 1880, 2680][i];
    const priceOffset = (i * 37 + category.length * 13) % 100;
    const ratingOffset = ((i * 17 + category.length) % 7) / 10;
    const prompt = `${name}, ${categoryPrompts[category]}, e-commerce product photography, high quality, white or neutral background`;
    return {
      id: `${category}-${i}`,
      name,
      category,
      brand: brandList[i % brandList.length],
      spec: specs[i % specs.length],
      price: basePrice + priceOffset,
      unit,
      image: `/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square&seed=${i + 400}`,
      rating: 4.3 + ratingOffset,
      style: styles[i],
      material: types[i],
      origin: origins[i],
      warranty: warranties[i],
      ecoLevel: ecoLevels[i],
    };
  });
}

export default function MaterialLibrary() {
  const [activeCategory, setActiveCategory] = useState('floor');
  const [activeStyle, setActiveStyle] = useState('all');
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    brand: true,
    price: true,
    spec: false,
    style: true,
  });
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<Set<string>>(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [compareMaterials, setCompareMaterials] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareDrawerVisible, setCompareDrawerVisible] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<MaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const materials = generateMaterials(activeCategory);
  const specOptions = specsByCategory[activeCategory] || specsByCategory.floor;

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 4) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const toggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareMaterials(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        message.success('已移除对比');
      } else {
        if (next.size >= 3) {
          message.warning('最多只能对比3个材质');
          return prev;
        }
        next.add(id);
        message.success('已加入对比');
      }
      return next;
    });
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        message.success('已取消收藏');
      } else {
        next.add(id);
        message.success('已收藏材质');
      }
      return next;
    });
  };

  const addToPlan = (item: MaterialItem, e: React.MouseEvent) => {
    e.stopPropagation();
    message.success(`已将「${item.name}」加入选材方案`);
  };

  const removeSelected = (id: string) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleFilter = (key: string) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecs(prev => {
      const next = new Set(prev);
      if (next.has(spec)) next.delete(spec);
      else next.add(spec);
      return next;
    });
  };

  const resetFilters = () => {
    setActiveStyle('all');
    setSelectedBrands(new Set());
    setSelectedPrice(null);
    setSelectedSpecs(new Set());
    setSearchQuery('');
  };

  const selectedMaterialItems = materials.filter(m => selectedMaterials.has(m.id));
  const compareItems = materials.filter(m => compareMaterials.has(m.id));

  const styleLabelMap: Record<string, string> = {
    nordic: '北欧',
    modern: '现代简约',
    chinese: '中式',
    american: '美式',
    japanese: '日式',
    luxury: '轻奢',
    industrial: '工业风',
    minimalist: '极简',
    minimalism: '极简',
    mediterranean: '地中海',
    french: '法式',
  };

  const filteredMaterials = materials.filter(item => {
    if (activeStyle !== 'all' && !item.style.includes(activeStyle)) return false;
    if (selectedBrands.size > 0 && !selectedBrands.has(item.brand)) return false;
    if (selectedPrice !== null) {
      const priceRange = priceRanges[selectedPrice];
      if (item.price < priceRange.min || item.price > priceRange.max) return false;
    }
    if (selectedSpecs.size > 0 && !selectedSpecs.has(item.spec)) return false;
    if (searchQuery && !item.name.includes(searchQuery) && !item.brand.includes(searchQuery)) return false;
    return true;
  });

  const compareColumns: TableProps<{ key: string }>['columns'] = [
    {
      title: '参数',
      dataIndex: 'param',
      key: 'param',
      width: 120,
      render: (_, __, index) => {
        const params = ['图片', '品牌', '材质', '规格', '价格', '产地', '环保等级', '质保'];
        return params[index];
      },
    },
    ...compareItems.map((item, idx) => ({
      title: (
        <div className="text-center">
          <div className="font-medium truncate">{item.name}</div>
          <button
            onClick={() => {
              const next = new Set(compareMaterials);
              next.delete(item.id);
              setCompareMaterials(next);
            }}
            className="text-xs text-haze-500 hover:text-terracotta-500 mt-1"
          >
            移除
          </button>
        </div>
      ),
      key: item.id,
      render: (_: unknown, __: unknown, index: number) => {
        const paramRows = [
          <img key={idx} src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg mx-auto" />,
          <span key={idx} className="text-wood-600 font-medium">{item.brand}</span>,
          <span key={idx}>{item.material}</span>,
          <span key={idx}>{item.spec}</span>,
          <span key={idx} className="text-terracotta-600 font-semibold">¥{item.price}/{item.unit}</span>,
          <span key={idx}>{item.origin}</span>,
          <Tag key={idx} color="green">{item.ecoLevel}</Tag>,
          <span key={idx}>{item.warranty}</span>,
        ];
        return paramRows[index];
      },
    })),
  ];

  const compareTableData = Array(8).fill(null).map((_, i) => ({ key: String(i) }));

  return (
    <div className="min-h-screen bg-ivory-50 pb-32">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="section-title">材质库</h1>
          <p className="section-subtitle">精选上万款装修主材与软装，支持一键对比选品</p>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-thin pb-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                setSelectedBrands(new Set());
                setSelectedPrice(null);
                setSelectedSpecs(new Set());
                setSearchQuery('');
              }}
              className={cn(
                'flex-shrink-0 px-5 py-2.5 rounded-btn font-medium transition-all duration-200 border',
                activeCategory === cat.key
                  ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-sm shadow-terracotta-500/30'
                  : 'bg-white text-carbon-700 border-ivory-300 hover:border-wood-400 hover:text-wood-700'
              )}
            >
              {cat.label}
              <span className={cn(
                'ml-2 text-xs',
                activeCategory === cat.key ? 'text-white/70' : 'text-ivory-500'
              )}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="sticky top-8 space-y-4">
              <div className="card-base p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-500" />
                  <input
                    type="text"
                    placeholder="搜索材质名称..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-base pl-10 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="card-base overflow-hidden">
                <div className="px-5 py-4 border-b border-ivory-200 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-wood-600" />
                  <span className="font-semibold text-carbon-800">筛选条件</span>
                </div>

                <div className="border-b border-ivory-100">
                  <button
                    onClick={() => toggleFilter('brand')}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-ivory-50 transition-colors"
                  >
                    <span className="font-medium text-carbon-700 text-sm">品牌</span>
                    {expandedFilters.brand ? (
                      <ChevronUp className="w-4 h-4 text-ivory-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ivory-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFilters.brand && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2">
                          {(brands[activeCategory] || []).map(brand => (
                            <label
                              key={brand}
                              className="flex items-center gap-2.5 cursor-pointer group"
                            >
                              <div
                                onClick={() => toggleBrand(brand)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-all',
                                  selectedBrands.has(brand)
                                    ? 'bg-terracotta-500 border-terracotta-500'
                                    : 'border-ivory-300 group-hover:border-wood-400'
                                )}
                              >
                                {selectedBrands.has(brand) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-carbon-600 group-hover:text-carbon-800">{brand}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-b border-ivory-100">
                  <button
                    onClick={() => toggleFilter('price')}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-ivory-50 transition-colors"
                  >
                    <span className="font-medium text-carbon-700 text-sm">价格区间</span>
                    {expandedFilters.price ? (
                      <ChevronUp className="w-4 h-4 text-ivory-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ivory-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFilters.price && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2">
                          {priceRanges.map((range, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedPrice(selectedPrice === i ? null : i)}
                              className={cn(
                                'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                                selectedPrice === i
                                  ? 'bg-terracotta-50 text-terracotta-700 font-medium border border-terracotta-200'
                                  : 'text-carbon-600 hover:bg-ivory-100'
                              )}
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <button
                    onClick={() => toggleFilter('spec')}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-ivory-50 transition-colors"
                  >
                    <span className="font-medium text-carbon-700 text-sm">规格尺寸</span>
                    {expandedFilters.spec ? (
                      <ChevronUp className="w-4 h-4 text-ivory-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ivory-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFilters.spec && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2">
                          {specOptions.map(spec => (
                            <label
                              key={spec}
                              className="flex items-center gap-2.5 cursor-pointer group"
                            >
                              <div
                                onClick={() => toggleSpec(spec)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-all',
                                  selectedSpecs.has(spec)
                                    ? 'bg-terracotta-500 border-terracotta-500'
                                    : 'border-ivory-300 group-hover:border-wood-400'
                                )}
                              >
                                {selectedSpecs.has(spec) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-carbon-600 group-hover:text-carbon-800">{spec}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button onClick={resetFilters} className="btn-ghost w-full text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                重置筛选
              </button>
            </div>
          </div>

          <div className="col-span-9">
            <div className="mb-4 flex items-center justify-between text-sm text-ivory-600">
              <span>已筛选出 {filteredMaterials.length} 款 {categories.find(cat => cat.key === activeCategory)?.label}</span>
              {(selectedBrands.size > 0 || selectedPrice !== null || selectedSpecs.size > 0 || searchQuery || activeStyle !== 'all') && (
                <button onClick={resetFilters} className="text-terracotta-700 hover:text-terracotta-800 font-medium">
                  清除全部条件
                </button>
              )}
            </div>

            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredMaterials.map((mat, idx) => (
                <motion.div
                  key={mat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.4 }}
                  className={cn(
                    'card-hoverable overflow-hidden relative',
                    selectedMaterials.has(mat.id) && 'ring-2 ring-terracotta-500 shadow-lg shadow-terracotta-500/20'
                  )}
                  onClick={() => setActiveMaterial(mat)}
                >
                  <label
                    className="absolute top-3 left-3 z-10 cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    <div
                      onClick={() => toggleMaterial(mat.id)}
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all backdrop-blur-sm',
                        selectedMaterials.has(mat.id)
                          ? 'bg-terracotta-500 border-terracotta-500'
                          : 'bg-white/90 border-ivory-300 hover:border-terracotta-400'
                      )}
                    >
                      {selectedMaterials.has(mat.id) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </label>

                  <div className="aspect-square bg-ivory-100 overflow-hidden">
                    <img
                      src={mat.image}
                      alt={mat.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="badge-wood text-[10px] flex-shrink-0">{mat.brand}</span>
                      <div className="flex items-center gap-0.5 text-xs text-amber-500">
                        <span>★</span>
                        <span className="text-carbon-500">{mat.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-carbon-800 text-sm mb-1 line-clamp-2 h-10">
                      {mat.name}
                    </h4>
                    <p className="text-xs text-ivory-500 mb-3">{mat.spec}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-terracotta-600 font-bold text-lg">¥{mat.price}</span>
                      <span className="text-xs text-ivory-400">/{mat.unit}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => toggleFavorite(mat.id, e)}
                        className={cn(
                          'h-8 w-8 rounded-lg border flex items-center justify-center transition-colors',
                          favorites.has(mat.id)
                            ? 'border-rose-200 bg-rose-50 text-rose-600'
                            : 'border-ivory-300 bg-white text-ivory-600 hover:text-rose-600'
                        )}
                        title="收藏"
                      >
                        <Heart className={cn('w-4 h-4', favorites.has(mat.id) && 'fill-current')} />
                      </button>
                      <button
                        onClick={(e) => toggleCompare(mat.id, e)}
                        className={cn(
                          'h-8 w-8 rounded-lg border flex items-center justify-center transition-colors',
                          compareMaterials.has(mat.id)
                            ? 'border-haze-200 bg-haze-50 text-haze-700'
                            : 'border-ivory-300 bg-white text-ivory-600 hover:text-haze-700'
                        )}
                        title="加入对比"
                      >
                        <Scale className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => addToPlan(mat, e)}
                        className="ml-auto h-8 rounded-lg border border-wood-200 bg-wood-50 px-2.5 text-xs font-medium text-wood-700 hover:bg-wood-100 transition-colors"
                      >
                        <Plus className="inline-block w-3.5 h-3.5 mr-1" />
                        加入方案
                      </button>
                    </div>
                  </div>
                </motion.div>
                ))}
              </div>
            ) : (
              <div className="card-base p-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-ivory-400" />
                <h3 className="font-serif text-xl text-carbon-800 mb-2">没有匹配的材质</h3>
                <p className="text-sm text-ivory-600 mb-5">请调整品牌、价格、规格或搜索关键词后重新筛选。</p>
                <button onClick={resetFilters} className="btn-secondary text-sm">
                  重置筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedMaterialItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-ivory-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_32px_rgba(61,58,53,0.12)]"
          >
            <div className="container py-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-carbon-700 font-medium">已选</span>
                <span className="w-7 h-7 rounded-full bg-terracotta-500 text-white text-sm font-bold flex items-center justify-center">
                  {selectedMaterialItems.length}
                </span>
                <span className="text-carbon-700 font-medium">项</span>
                <span className="text-ivory-400 text-sm">(最多4项)</span>
              </div>

              <div className="flex items-center gap-3 flex-1 overflow-x-auto scrollbar-thin">
                {selectedMaterialItems.map(mat => (
                  <motion.div
                    key={mat.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-ivory-100 rounded-lg group"
                  >
                    <img src={mat.image} alt="" className="w-10 h-10 rounded object-cover" />
                    <div className="max-w-[120px]">
                      <p className="text-xs font-medium text-carbon-700 truncate">{mat.name}</p>
                      <p className="text-[10px] text-terracotta-600">¥{mat.price}/{mat.unit}</p>
                    </div>
                    <button
                      onClick={() => removeSelected(mat.id)}
                      className="w-5 h-5 rounded-full bg-ivory-300 text-carbon-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMaterials(new Set())}
                  className="btn-ghost text-sm"
                >
                  清空
                </button>
                <button
                  disabled={selectedMaterialItems.length < 2}
                  onClick={() => setCompareDrawerVisible(true)}
                  className={cn(
                    'btn-primary',
                    selectedMaterialItems.length < 2 && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                  开始对比
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer
        title={activeMaterial?.name}
        open={Boolean(activeMaterial)}
        onClose={() => setActiveMaterial(null)}
        width={480}
        destroyOnClose
      >
        {activeMaterial && (
          <div className="space-y-5">
            <img
              src={activeMaterial.image}
              alt={activeMaterial.name}
              className="w-full aspect-square object-cover rounded-xl bg-ivory-100"
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="badge-wood mb-2">{activeMaterial.brand}</div>
                <h3 className="font-serif text-xl text-carbon-800">{activeMaterial.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-terracotta-600 font-bold text-2xl">¥{activeMaterial.price}</div>
                <div className="text-xs text-ivory-500">/{activeMaterial.unit}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['材质', activeMaterial.material],
                ['规格', activeMaterial.spec],
                ['产地', activeMaterial.origin],
                ['环保等级', activeMaterial.ecoLevel],
                ['质保', activeMaterial.warranty],
                ['适配风格', activeMaterial.style.map(s => styleLabelMap[s] || s).join(' / ')],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-ivory-200 bg-ivory-50 p-3">
                  <div className="text-xs text-ivory-500 mb-1">{label}</div>
                  <div className="font-medium text-carbon-800">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={(e) => addToPlan(activeMaterial, e)} className="btn-primary flex-1">
                <Plus className="w-4 h-4" />
                加入选材方案
              </button>
              <button onClick={(e) => toggleCompare(activeMaterial.id, e)} className="btn-secondary">
                <Scale className="w-4 h-4" />
                对比
              </button>
              <button onClick={(e) => toggleFavorite(activeMaterial.id, e)} className="btn-ghost">
                <Heart className={cn('w-4 h-4', favorites.has(activeMaterial.id) && 'fill-current text-rose-600')} />
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title="材质参数对比"
        open={compareDrawerVisible}
        onClose={() => setCompareDrawerVisible(false)}
        width={820}
        destroyOnClose
      >
        {compareItems.length >= 2 ? (
          <Table
            columns={compareColumns}
            dataSource={compareTableData}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 640 }}
          />
        ) : (
          <div className="card-base p-10 text-center">
            <Scale className="w-10 h-10 mx-auto mb-3 text-ivory-400" />
            <h3 className="font-serif text-xl text-carbon-800 mb-2">请选择至少两款材质</h3>
            <p className="text-sm text-ivory-600">可在卡片中点击对比按钮，最多同时对比三款材质。</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
