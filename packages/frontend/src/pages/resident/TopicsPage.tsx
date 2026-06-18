import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Heart,
  MessageSquare,
  MapPin,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Eye,
  AlertTriangle,
  Shield,
  Sparkles,
  Navigation,
  Filter,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { TOPIC_CATEGORIES } from '@neighborhood/shared';
import type { TopicCategory } from '@neighborhood/shared';

const categoryTabs: { label: string; value: TopicCategory | 'all' }[] = [
  { label: '全部', value: 'all' },
  ...TOPIC_CATEGORIES,
];

const radiusOptions = [
  { label: '500米', value: 500 },
  { label: '1公里', value: 1000 },
  { label: '3公里', value: 3000 },
  { label: '全社区', value: 0 },
];

const sensitiveStatusMap: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  normal: { label: '正常', color: 'text-emerald-600 bg-emerald-50', icon: Shield },
  filtered: { label: '已过滤敏感词', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
  pending: { label: '待审核', color: 'text-orange-600 bg-orange-50', icon: Clock },
  removed: { label: '已移除', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
};

const mockTopics = [
  {
    id: 'TY-29841',
    title: '求帮忙：3号楼电梯今早坏了，有没有物业的人回复下？',
    content: '早上8点1号楼和3号楼电梯都停了，上班高峰期好多人在等，打物业电话占线，有没有邻居知道什么时候能修好？孩子上学迟到了…',
    author: { name: '陈明', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: true, building: '3号楼' },
    category: '投诉建议' as TopicCategory,
    location: '3号楼单元门厅',
    distance: 50,
    likes: 86,
    comments: 32,
    views: 1248,
    time: '25分钟前',
    sensitiveStatus: 'normal',
    hasImages: false,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29836',
    title: '出九成新 iPad 9 64G 带原装充电器，自提面交',
    content: '去年京东买的 iPad 第9代 64G 银色，9成新，无划痕无维修，原装充电器数据线都在。给孩子上网课用的，现在换了 Pro 所以出。价格 1850 可小刀，仅限小区内当面验货交易走担保。',
    author: { name: '李建国', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: true, building: '5号楼' },
    category: '二手置换' as TopicCategory,
    location: '5号楼楼下花园',
    distance: 180,
    likes: 24,
    comments: 11,
    views: 432,
    time: '1小时前',
    sensitiveStatus: 'normal',
    hasImages: true,
    imageCount: 4,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29821',
    title: '西门口捡到儿童电话手表一支，请失主联系认领',
    content: '今天傍晚6点半在小区西门口长椅上捡到一支米兔儿童电话手表，蓝色的，还能开机有密码。失主请私信我，提供购买凭证或手表背后SN码后四位认领。',
    author: { name: '王阿姨', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: true, building: '2号楼' },
    category: '失物招领' as TopicCategory,
    location: '西大门岗亭',
    distance: 320,
    likes: 156,
    comments: 28,
    views: 2180,
    time: '2小时前',
    sensitiveStatus: 'normal',
    hasImages: false,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29807',
    title: '【海淀花园】周末社区亲子跳蚤市场招募摊主啦！',
    content: '海淀花园本周末（6月21日）下午2-5点在中心花园举办第一届亲子跳蚤市场！家里闲置的玩具、书籍、文具都可以拿来交换或低价出售。摊主报名请在评论区留言孩子年龄+物品类型，限40个摊位先到先得～ 朝阳家园的邻居们也欢迎来逛！',
    author: { name: '张老师', avatar: '', community: '海淀花园', subdomain: 'haidian', verified: true, building: '7号楼' },
    category: '社区活动' as TopicCategory,
    location: '海淀花园·中心花园',
    distance: 2800,
    likes: 324,
    comments: 86,
    views: 5642,
    time: '3小时前',
    sensitiveStatus: 'normal',
    hasImages: true,
    imageCount: 3,
    isCross: true,
    crossReason: '跨社区推荐·亲子活动相似兴趣匹配度 94%',
    matchScore: 94,
  },
  {
    id: 'TY-29798',
    title: '⚠️ 注意：B1车库保洁三天没清扫了，到处都是垃圾',
    content: 'B1 层 3 号楼电梯口那块儿，垃圾已经堆了三天了！昨天找过物业，说已经派单但到现在也没人来。天气越来越热味道很大，还有蟑螂出没。物业能不能重视下？再不处理我就打 12345 投诉了。',
    author: { name: '匿名业主', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: false, building: '3号楼' },
    category: '投诉建议' as TopicCategory,
    location: 'B1车库 3号电梯厅',
    distance: 120,
    likes: 67,
    comments: 23,
    views: 980,
    time: '4小时前',
    sensitiveStatus: 'filtered',
    filteredKeywords: ['12345', '蟑螂'],
    hasImages: false,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29786',
    title: '互助：明天上午去中日友好医院，可以帮忙代开药',
    content: '明天上午9点要去中日友好医院心内科复诊，住得近的邻居如果有需要代取药的可以私信我。只接慢性病常规药，需要提供处方照片和就诊卡。不收费，邻里互助～ 限朝阳家园本小区住户。',
    author: { name: '刘医生', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: true, building: '8号楼' },
    category: '邻里互助' as TopicCategory,
    location: '8号楼1单元',
    distance: 260,
    likes: 212,
    comments: 17,
    views: 1560,
    time: '5小时前',
    sensitiveStatus: 'pending',
    hasImages: false,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29772',
    title: '【东城景苑】有人知道附近哪有修自行车的吗？',
    content: '刚搬到东城景苑不久，自行车胎破了，想找个修车摊或者共享单车维修点都没看见。邻居们有推荐吗？最好是师傅手艺好点的，别太贵。',
    author: { name: '新住户小周', avatar: '', community: '东城景苑', subdomain: 'dongcheng', verified: true, building: '4号楼' },
    category: '生活咨询' as TopicCategory,
    location: '东城景苑·东门',
    distance: 4200,
    likes: 18,
    comments: 9,
    views: 342,
    time: '6小时前',
    sensitiveStatus: 'normal',
    hasImages: false,
    isCross: true,
    crossReason: '跨社区推荐·生活咨询 匹配度 78%',
    matchScore: 78,
  },
  {
    id: 'TY-29765',
    title: '分享一下小区团购的山东大樱桃，真的绝了！',
    content: '上周跟团买的山东烟台美早大樱桃，今天早上刚收到冷链送的，太新鲜了！28mm 以上大果，脆甜爆汁，比超市便宜一半。团长说还有最后5箱，邻居们要的抓紧～ 直接物业代收点自提。',
    author: { name: '美食家小陈', avatar: '', community: '朝阳家园', subdomain: 'chaoyang', verified: true, building: '6号楼' },
    category: '生活分享' as TopicCategory,
    location: '6号楼物业代收点',
    distance: 200,
    likes: 145,
    comments: 56,
    views: 2340,
    time: '7小时前',
    sensitiveStatus: 'normal',
    hasImages: true,
    imageCount: 6,
    isCross: false,
    crossReason: '',
  },
  {
    id: 'TY-29754',
    title: '【公告】6月20日上午9-11点全小区停水检修，请提前储水',
    content: '接自来水公司通知，因市政管网升级改造，6月20日（本周四）上午9:00-11:00全小区将暂停供水。请各位邻居提前做好储水准备，特别是饮用水和生活用水。恢复供水后可能短暂出现黄水，放几分钟即可。给您带来的不便敬请谅解。',
    author: { name: '物业通知', avatar: '', community: '朝阳家园物业', subdomain: 'chaoyang', verified: true, building: '物业服务中心', isProperty: true },
    category: '通知公告' as TopicCategory,
    location: '全小区范围',
    distance: 0,
    likes: 12,
    comments: 8,
    views: 8960,
    time: '昨天',
    sensitiveStatus: 'normal',
    hasImages: false,
    isCross: false,
    crossReason: '',
    isOfficial: true,
  },
  {
    id: 'TY-29741',
    title: '【望京新城】出一台二手跑步机 亿健A5 九成新',
    content: '搬家出一台亿健A5跑步机，买了两年多实际跑的次数不多，成色很新，功能全部正常。带心率监测、多档坡度调节、静音电机。原价3299，现在1200出，自提不包邮。望京新城的邻居可以上门看货。',
    author: { name: '健身达人老王', avatar: '', community: '望京新城', subdomain: 'wangjing', verified: true, building: '12号楼' },
    category: '二手置换' as TopicCategory,
    location: '望京新城·12号楼地下车库',
    distance: 6500,
    likes: 38,
    comments: 14,
    views: 624,
    time: '昨天',
    sensitiveStatus: 'normal',
    hasImages: true,
    imageCount: 5,
    isCross: true,
    crossReason: '跨社区推荐·二手品类相似 匹配度 82%',
    matchScore: 82,
  },
];

export default function TopicsPage() {
  const [activeCategory, setActiveCategory] = useState<TopicCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [crossCommunity, setCrossCommunity] = useState(false);
  const [radius, setRadius] = useState(0);
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest');

  const filteredTopics = mockTopics.filter((t) => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (!crossCommunity && t.isCross) return false;
    if (searchQuery && !t.title.includes(searchQuery) && !t.content.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索话题、邻居、地点..."
              className="input-field pl-9"
            />
          </div>
          <button
            onClick={() => setCrossCommunity(!crossCommunity)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium transition-colors ${
              crossCommunity
                ? 'bg-primary-50 text-primary-600 border border-primary-200'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {crossCommunity ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            跨社区
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1 text-xs text-gray-400 mr-1 flex-shrink-0">
            <Navigation className="w-3 h-3" /> 半径
          </div>
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRadius(opt.value)}
              className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                radius === opt.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-200 mx-1 flex-shrink-0" />
          <button
            onClick={() => setSortBy('latest')}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
              sortBy === 'latest'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-3 h-3" /> 最新
          </button>
          <button
            onClick={() => setSortBy('hot')}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
              sortBy === 'hot'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> 热门
          </button>
          <div className="flex-1" />
          <button className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700">
            <Filter className="w-3 h-3" /> 筛选
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === tab.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {crossCommunity && (
        <div className="bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-100 rounded-xl p-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">跨社区推荐已开启</p>
            <p className="text-xs text-gray-500 mt-0.5">
              基于您的兴趣标签和地理位置，智能推荐周边社区的优质话题，每条会标注匹配依据与相似度
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredTopics.map((topic) => {
          const status = sensitiveStatusMap[topic.sensitiveStatus];
          const StatusIcon = status.icon;
          return (
            <div
              key={topic.id}
              className={`card block hover:shadow-md transition-shadow ${topic.isCross ? 'border-primary-200 bg-gradient-to-br from-white to-primary-50/30' : ''} ${topic.isOfficial ? 'border-blue-200 bg-blue-50/30' : ''}`}
            >
              {topic.isCross && topic.crossReason && (
                <div className="flex items-center gap-1.5 mb-3 -mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-[11px] font-medium text-primary-600">{topic.crossReason}</span>
                  <span className="text-[10px] font-bold text-primary-500 bg-primary-100 px-1.5 py-0.5 rounded-full">
                    匹配 {topic.matchScore}%
                  </span>
                </div>
              )}

              {topic.isOfficial && (
                <div className="flex items-center gap-1.5 mb-3 -mt-1">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-medium text-blue-600">官方公告 · 朝阳家园物业发布</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {topic.author.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-900">{topic.author.name}</span>
                    {topic.author.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                        <UserCheck className="w-3 h-3" /> 实名
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 font-mono">
                      {topic.author.community}·{topic.author.building}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>

                  <Link to={`/topics/${topic.id}`}>
                    <h4 className="mt-1.5 text-base font-bold text-gray-900 leading-snug hover:text-primary-600 transition-colors">
                      {topic.title}
                    </h4>
                  </Link>
                  <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {topic.content}
                  </p>

                  {topic.sensitiveStatus === 'filtered' && topic.filteredKeywords && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        内容安全系统自动命中敏感词：
                        <span className="font-semibold ml-1">{topic.filteredKeywords.join('、')}</span>
                        <span className="text-amber-500 ml-2">（已自动遮蔽待人工审核）</span>
                      </div>
                    </div>
                  )}

                  {topic.hasImages && topic.imageCount && (
                    <div className="mt-3 flex gap-2">
                      {Array.from({ length: Math.min(topic.imageCount, 4) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-xs"
                        >
                          图片{i + 1}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {topic.location}
                      </span>
                      {topic.distance > 0 && (
                        <span className="text-gray-400">约 {topic.distance > 1000 ? (topic.distance / 1000).toFixed(1) + 'km' : topic.distance + 'm'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {topic.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {topic.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {topic.views >= 1000 ? (topic.views / 1000).toFixed(1) + 'k' : topic.views}
                      </span>
                      <span>{topic.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/topics/create"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
