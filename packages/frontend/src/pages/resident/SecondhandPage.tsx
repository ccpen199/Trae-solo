import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Heart,
  MapPin,
  Truck,
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  Filter,
  ChevronDown,
  UserCheck,
  Eye,
} from 'lucide-react';

const conditions = [
  { label: '全部', value: 'all' },
  { label: '全新', value: 'new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '良好', value: 'good' },
  { label: '一般', value: 'fair' },
];

const categories = ['全部', '数码电子', '家具家居', '服饰鞋包', '图书文具', '母婴用品', '运动户外', '其他'];

const escrowStatusMap: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  held: { label: '担保中', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Shield },
  released: { label: '已释放', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle },
  dispute: { label: '纠纷中', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  pending: { label: '待发货', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  none: { label: '议价中', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: Clock },
};

const mockItems = [
  {
    id: 'ESC-20260618-0842',
    title: '九成新 iPad 9 64G 银色 带原装充电器',
    price: 1850,
    originalPrice: 2599,
    condition: '几乎全新',
    conditionValue: 'like_new',
    category: '数码电子',
    location: '朝阳家园·3号楼1单元2202',
    distance: 80,
    seller: { name: '陈明', verified: true, community: '朝阳家园', rating: 98.7, trades: 23 },
    escrowStatus: 'held',
    delivery: ['self_pickup', 'intra_community'],
    images: 6,
    likes: 42,
    views: 1280,
    postedAt: '2小时前',
    description: '去年京东自营购买，成色95新，无磕碰无维修，电池健康92%。原装充电器数据线包装齐全。孩子上网课用的，现在换了Pro所以出。面交验货或走平台担保都可以。',
    hasEscrow: true,
  },
  {
    id: 'ESC-20260618-0831',
    title: '全新未拆封 小米空气净化器4 Pro 除甲醛',
    price: 1380,
    originalPrice: 1699,
    condition: '全新',
    conditionValue: 'new',
    category: '家居生活',
    location: '朝阳家园·5号楼',
    distance: 160,
    seller: { name: '李女士', verified: true, community: '朝阳家园', rating: 99.2, trades: 18 },
    escrowStatus: 'pending',
    delivery: ['self_pickup', 'property_pickup'],
    images: 3,
    likes: 28,
    views: 860,
    postedAt: '3小时前',
    description: '618活动京东买多了一台，全新未拆封，保修一年。除甲醛除菌除PM2.5，适合28-48平米房间。物业代收点可自提，也可以送到你楼下。',
    hasEscrow: true,
  },
  {
    id: 'ESC-20260617-0756',
    title: '宜家 MALM 双人床1.5米 白色 9成新',
    price: 680,
    originalPrice: 1299,
    condition: '良好',
    conditionValue: 'good',
    category: '家具家居',
    location: '海淀花园·7号楼',
    distance: 2800,
    seller: { name: '张建国', verified: true, community: '海淀花园', rating: 97.5, trades: 12 },
    escrowStatus: 'released',
    delivery: ['meetup'],
    images: 8,
    likes: 16,
    views: 520,
    postedAt: '昨天',
    description: '宜家马尔姆双人床1.5米宽，白色，使用两年，轻微使用痕迹，床板完好。搬家出，需自提，不包搬运。送床笠和2个记忆棉枕头。',
    hasEscrow: true,
    crossCommunity: true,
  },
  {
    id: 'ESC-20260617-0723',
    title: '索尼 WH-1000XM4 头戴式降噪耳机 黑色',
    price: 1580,
    originalPrice: 2299,
    condition: '几乎全新',
    conditionValue: 'like_new',
    category: '数码电子',
    location: '朝阳家园·8号楼',
    distance: 260,
    seller: { name: '王同学', verified: true, community: '朝阳家园', rating: 99.5, trades: 31 },
    escrowStatus: 'held',
    delivery: ['self_pickup'],
    images: 5,
    likes: 68,
    views: 1890,
    postedAt: '昨天',
    description: '索尼旗舰降噪耳机，降噪王者。用了半年左右，成色99新，功能完美。配件齐全，包装在。音质降噪都很棒，通勤办公神器。',
    hasEscrow: true,
  },
  {
    id: 'ESC-20260616-0612',
    title: '戴森 V8 Fluffy 吸尘器 使用一年',
    price: 1280,
    originalPrice: 2990,
    condition: '良好',
    conditionValue: 'good',
    category: '家居生活',
    location: '东城景苑·4号楼',
    distance: 4200,
    seller: { name: '刘女士', verified: true, community: '东城景苑', rating: 98.1, trades: 8 },
    escrowStatus: 'dispute',
    delivery: ['delivery'],
    images: 7,
    likes: 22,
    views: 780,
    postedAt: '2天前',
    description: '戴森V8无线吸尘器，使用一年，吸力强劲，电池续航约35分钟。配有4个吸头，主机+挂架。有使用痕迹但功能全部正常。',
    hasEscrow: true,
    crossCommunity: true,
    disputeReason: '买家反映电池续航不足20分钟，与描述不符',
  },
  {
    id: 'ESC-20260616-0548',
    title: '全新婴儿推车 可坐可躺 轻便折叠 高景观',
    price: 520,
    originalPrice: 899,
    condition: '全新',
    conditionValue: 'new',
    category: '母婴用品',
    location: '朝阳家园·2号楼',
    distance: 320,
    seller: { name: '陈妈妈', verified: true, community: '朝阳家园', rating: 99.8, trades: 15 },
    escrowStatus: 'pending',
    delivery: ['self_pickup'],
    images: 9,
    likes: 45,
    views: 1120,
    postedAt: '2天前',
    description: '朋友送的婴儿推车，家里已经有了，全新未拆封。可坐可躺，轻便折叠，高景观设计，双向推行。适合0-3岁宝宝。',
    hasEscrow: true,
  },
  {
    id: 'ESC-20260615-0432',
    title: 'ThinkPad X1 Carbon Gen 9 i7 16G 512G',
    price: 4800,
    originalPrice: 12999,
    condition: '良好',
    conditionValue: 'good',
    category: '数码电子',
    location: '望京新城·12号楼',
    distance: 6500,
    seller: { name: '赵先生', verified: true, community: '望京新城', rating: 96.3, trades: 5 },
    escrowStatus: 'released',
    delivery: ['delivery'],
    images: 10,
    likes: 86,
    views: 3240,
    postedAt: '3天前',
    description: '公司闲置ThinkPad X1 Carbon 第9代，i7-1165G7/16G/512G，14寸2K屏，超轻薄商务本。使用一年多，外观9成新，电池健康88%。',
    hasEscrow: true,
    crossCommunity: true,
  },
  {
    id: 'ESC-20260615-0398',
    title: '帮宝适一级帮纸尿裤 L码 48片 全新',
    price: 65,
    originalPrice: 108,
    condition: '全新',
    conditionValue: 'new',
    category: '母婴用品',
    location: '朝阳家园·6号楼',
    distance: 200,
    seller: { name: '王妈妈', verified: true, community: '朝阳家园', rating: 100, trades: 9 },
    escrowStatus: 'none',
    delivery: ['self_pickup', 'property_pickup'],
    images: 2,
    likes: 12,
    views: 340,
    postedAt: '3天前',
    description: '宝宝长大换XL码了，剩一包L码全新未拆。一级帮系列，超薄透气。6号楼门口自提，或者放物业代收点。',
    hasEscrow: false,
  },
  {
    id: 'ESC-20260614-0287',
    title: '任天堂 Switch OLED 白色 日版 9成新',
    price: 1950,
    originalPrice: 2599,
    condition: '几乎全新',
    conditionValue: 'like_new',
    category: '数码电子',
    location: '海淀花园·10号楼',
    distance: 3100,
    seller: { name: '游戏达人小杨', verified: true, community: '海淀花园', rating: 98.9, trades: 27 },
    escrowStatus: 'held',
    delivery: ['delivery'],
    images: 8,
    likes: 124,
    views: 4560,
    postedAt: '4天前',
    description: '日版Switch OLED白色，使用半年，屏幕无划痕，摇杆不漂移。配件齐全，送收纳包+2张游戏卡。支持担保交易，验货再付款。',
    hasEscrow: true,
    crossCommunity: true,
  },
  {
    id: 'ESC-20260613-0156',
    title: '华为 MatePad 11 6+128G 曜石灰 带笔',
    price: 1680,
    originalPrice: 2499,
    condition: '良好',
    conditionValue: 'good',
    category: '数码电子',
    location: '朝阳家园·1号楼',
    distance: 420,
    seller: { name: '孙同学', verified: true, community: '朝阳家园', rating: 97.8, trades: 14 },
    escrowStatus: 'pending',
    delivery: ['self_pickup'],
    images: 6,
    likes: 38,
    views: 920,
    postedAt: '5天前',
    description: '华为MatePad 11寸 6+128G 曜石灰，9成新，功能完好。配原装M-Pencil二代笔+键盘。学习上网课非常好用。',
    hasEscrow: true,
  },
  {
    id: 'ESC-20260612-0089',
    title: '宜家 PAX 衣柜 白色 2米高 9成新',
    price: 580,
    originalPrice: 1499,
    condition: '良好',
    conditionValue: 'good',
    category: '家具家居',
    location: '朝阳家园·4号楼',
    distance: 280,
    seller: { name: '搬家人士', verified: false, community: '朝阳家园', rating: 94.2, trades: 3 },
    escrowStatus: 'none',
    delivery: ['meetup'],
    images: 5,
    likes: 9,
    views: 280,
    postedAt: '6天前',
    description: '宜家PAX帕克思衣柜，白色，2米高×1米宽。使用两年，有轻微使用痕迹，功能完好。搬家急出，需自提，不包拆装。',
    hasEscrow: false,
  },
  {
    id: 'ESC-20260611-0032',
    title: '儿童安全座椅 宝得适 Britax 头等舱',
    price: 620,
    originalPrice: 1680,
    condition: '良好',
    conditionValue: 'good',
    category: '母婴用品',
    location: '西城国际·8号楼',
    distance: 5400,
    seller: { name: '周先生', verified: true, community: '西城国际', rating: 99.0, trades: 7 },
    escrowStatus: 'released',
    delivery: ['delivery'],
    images: 7,
    likes: 18,
    views: 480,
    postedAt: '1周前',
    description: '宝得适Britax头等舱儿童安全座椅，0-4岁可用，正反双向安装，带ISOFIX接口。使用两年多，安全带正常，布套可水洗。',
    hasEscrow: true,
    crossCommunity: true,
  },
];

export default function SecondhandPage() {
  const [activeCondition, setActiveCondition] = useState('all');
  const [activeCategory, setActiveCategory] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<'all' | 'delivery' | 'meetup'>('all');
  const [escrowFilter, setEscrowFilter] = useState<'all' | 'escrow' | 'direct'>('all');
  const [crossCommunity, setCrossCommunity] = useState(true);

  const filteredItems = mockItems.filter((item) => {
    if (activeCondition !== 'all' && item.conditionValue !== activeCondition) return false;
    if (activeCategory !== 0 && item.category !== categories[activeCategory]) return false;
    if (escrowFilter === 'escrow' && !item.hasEscrow) return false;
    if (escrowFilter === 'direct' && item.hasEscrow) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-purple-800">🛡️ 二手担保交易保障</p>
          <p className="text-xs text-purple-600 mt-0.5 leading-relaxed">
            买家付款 → 资金托管在平台担保账户 → 卖家发货/面交 → 买家确认收货 → 资金释放给卖家。
            <span className="font-semibold">支持7天无理由，纠纷平台介入。</span>
          </p>
        </div>
        <button className="text-xs font-bold text-purple-600 bg-white/70 px-2 py-1 rounded-lg flex-shrink-0 hover:bg-white transition">
          了解详情
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(idx)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === idx
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {conditions.map((cond) => (
            <button
              key={cond.value}
              onClick={() => setActiveCondition(cond.value)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                activeCondition === cond.value
                  ? 'border-primary-300 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            onClick={() => setEscrowFilter(escrowFilter === 'escrow' ? 'all' : 'escrow')}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              escrowFilter === 'escrow'
                ? 'border-purple-300 bg-purple-50 text-purple-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Shield className="w-3 h-3" /> 仅担保
          </button>
          <button
            onClick={() => setDeliveryMode(deliveryMode === 'delivery' ? 'all' : 'delivery')}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              deliveryMode === 'delivery'
                ? 'border-primary-300 bg-primary-50 text-primary-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Truck className="w-3 h-3" /> 可快递
          </button>
          <button
            onClick={() => setDeliveryMode(deliveryMode === 'meetup' ? 'all' : 'meetup')}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              deliveryMode === 'meetup'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Users className="w-3 h-3" /> 可面交
          </button>
          <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500">
            <Filter className="w-3 h-3" /> 筛选
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>共找到 <span className="font-bold text-gray-700">{filteredItems.length}</span> 件商品</span>
        {crossCommunity && (
          <span className="flex items-center gap-1 text-primary-500">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            含跨社区推荐
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredItems.map((item) => {
          const escrow = escrowStatusMap[item.escrowStatus];
          const EscrowIcon = escrow.icon;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 ${
                item.crossCommunity ? 'border-purple-200' : 'border-gray-100'
              }`}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${escrow.color} border`}>
                    <EscrowIcon className="w-3 h-3 inline -mt-0.5 mr-0.5" />
                    {escrow.label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">
                    {item.condition}
                  </span>
                </div>
                {item.crossCommunity && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/80 text-white">
                    跨社区
                  </span>
                )}
                <button className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:scale-110 transition">
                  <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                  <span className="text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                    {item.images} 图
                  </span>
                </div>
              </div>

              <div className="p-3">
                <Link to={`/secondhand/${item.id}`}>
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-primary-600 transition-colors">
                    {item.title}
                  </h4>
                </Link>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-red-500">¥{item.price}</span>
                  <span className="text-xs text-gray-400 line-through">¥{item.originalPrice}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {item.distance < 1000 ? item.distance + 'm' : (item.distance / 1000).toFixed(1) + 'km'}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="truncate flex-1">{item.location.split('·')[1] || item.location}</span>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {item.seller.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-700 font-medium flex items-center gap-0.5">
                        {item.seller.name}
                        {item.seller.verified && (
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {item.seller.rating}%好评 · {item.seller.trades}笔
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 text-right">
                    <div>{item.postedAt}</div>
                    <div className="flex items-center gap-1 justify-end">
                      <Eye className="w-2.5 h-2.5" />
                      {item.views >= 1000 ? (item.views / 1000).toFixed(1) + 'k' : item.views}浏览
                    </div>
                  </div>
                </div>

                {item.escrowStatus === 'dispute' && item.disputeReason && (
                  <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-[10px] text-red-600 leading-relaxed">
                    <AlertTriangle className="w-3 h-3 inline -mt-0.5 mr-1" />
                    纠纷中：{item.disputeReason.slice(0, 20)}...
                  </div>
                )}

                {item.escrowStatus === 'held' && (
                  <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg p-2 text-[10px] text-purple-600">
                    <Shield className="w-3 h-3 inline -mt-0.5 mr-1" />
                    资金已担保，买家确认后释放
                  </div>
                )}

                <button className="mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 transition-colors">
                  {item.hasEscrow ? '担保交易' : '我想要'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/secondhand/create"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
