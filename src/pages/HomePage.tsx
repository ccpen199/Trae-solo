import { Link } from 'react-router-dom';
import { Eye, Clock, ChevronRight, TrendingUp } from 'lucide-react';

const newsData = [
  {
    id: 1,
    title: '曼城夺得英超冠军！',
    summary: '曼城在最后一轮逆转取胜，成功卫冕英超冠军，创造了球队历史三连冠的伟业。哈兰德本赛季打入36球，荣获金靴奖。',
    coverImage: 'https://picsum.photos/800/500?random=1',
    source: '体育新闻',
    category: '英超',
    viewCount: 12543,
    createdAt: '2小时前',
    isHot: true,
  },
  {
    id: 2,
    title: '梅西再创纪录，职业生涯进球超800',
    summary: '梅西在本场比赛梅开二度，创造新的历史纪录，成为足球史上第一位正式比赛进球超800的球员。',
    coverImage: 'https://picsum.photos/400/250?random=2',
    source: '足球周刊',
    category: '国际足球',
    viewCount: 8921,
    createdAt: '5小时前',
    isHot: true,
  },
  {
    id: 3,
    title: '中超联赛即将开幕，各队引援动态汇总',
    summary: '新赛季中超联赛将在下周开幕，各支球队积极备战，多支豪门球队在转会市场上投入重金。',
    coverImage: 'https://picsum.photos/400/250?random=3',
    source: '中超官网',
    category: '中超',
    viewCount: 5632,
    createdAt: '昨天',
    isHot: false,
  },
  {
    id: 4,
    title: '欧冠决赛前瞻：皇马vs多特蒙德',
    summary: '欧冠决赛即将打响，皇马冲击第15座欧冠奖杯，多特蒙德期待创造奇迹。',
    coverImage: 'https://picsum.photos/400/250?random=4',
    source: '欧洲足球',
    category: '欧冠',
    viewCount: 7845,
    createdAt: '昨天',
    isHot: true,
  },
  {
    id: 5,
    title: '武磊回归中超，加盟上海申花',
    summary: '武磊正式结束留洋生涯回归中超，加盟上海申花，将在新赛季身披7号球衣。',
    coverImage: 'https://picsum.photos/400/250?random=5',
    source: '足球报',
    category: '中超',
    viewCount: 9234,
    createdAt: '2天前',
    isHot: false,
  },
];

const categories = ['全部', '英超', '西甲', '中超', '意甲', '德甲', '欧冠'];

function HomePage() {
  return (
    <div>
      {/* 分类导航 */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {categories.map((cat, index) => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all font-medium ${
                index === 0
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 头条新闻 */}
      {newsData.slice(0, 1).map((item) => (
        <Link key={item.id} to={`/news/${item.id}`} className="block mb-8">
          <div className="relative rounded-2xl overflow-hidden group shadow-lg">
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-72 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center mb-3 space-x-2">
                <span className="px-3 py-1 bg-green-600 rounded-full text-sm font-medium">
                  {item.category}
                </span>
                {item.isHot && (
                  <span className="px-3 py-1 bg-red-500 rounded-full text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    热门
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{item.title}</h2>
              <p className="text-gray-200 mb-4 line-clamp-2 text-lg">{item.summary}</p>
              <div className="flex items-center text-sm text-gray-300 space-x-6">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {item.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {item.viewCount.toLocaleString()}
                </span>
                <span>{item.source}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {/* 新闻列表 */}
      <div className="space-y-4">
        {newsData.slice(1).map((item) => (
          <Link
            key={item.id}
            to={`/news/${item.id}`}
            className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-5"
          >
            <div className="flex gap-5">
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-44 h-28 md:w-52 md:h-32 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2 space-x-2">
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                    {item.category}
                  </span>
                  {item.isHot && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full flex items-center font-medium">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      热门
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 text-gray-800 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2 hidden md:block">
                  {item.summary}
                </p>
                <div className="flex items-center text-sm text-gray-400 space-x-4">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {item.createdAt}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {item.viewCount.toLocaleString()}
                  </span>
                  <span>{item.source}</span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-300 self-center flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      {/* 加载更多 */}
      <div className="mt-10 text-center">
        <button className="px-8 py-3 bg-white text-gray-700 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 transition-all font-medium border border-gray-200">
          加载更多新闻
        </button>
      </div>
    </div>
  );
}

export default HomePage;
