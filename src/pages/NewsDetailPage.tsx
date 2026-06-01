import { useParams, Link } from 'react-router-dom';
import { Clock, Eye, MessageCircle, Heart, Share2, ArrowLeft } from 'lucide-react';

const newsData = [
  {
    id: 1,
    title: '曼城夺得英超冠军！',
    summary: '曼城在最后一轮逆转取胜，成功卫冕英超冠军，创造了球队历史三连冠的伟业。哈兰德本赛季打入36球，荣获金靴奖。',
    coverImage: 'https://picsum.photos/1200/600?random=1',
    source: '体育新闻',
    author: '记者李明',
    category: '英超',
    viewCount: 12543,
    createdAt: '2024-05-18 10:30',
    content: `在刚刚结束的英超最后一轮比赛中，曼城队凭借下半场的精彩表现，以3-1的比分战胜对手，成功卫冕英超冠军。

这是曼城队连续第三个赛季获得英超冠军，创造了球队历史三连冠的伟业。本场比赛中，哈兰德梅开二度，德布劳内贡献两次助攻，展现了球队强大的攻击力。

主教练瓜迪奥拉在赛后采访中表示："这是整个团队努力的结果，我们为这个赛季感到骄傲。球员们展现了非凡的意志品质，在关键时刻顶住了压力。"

哈兰德本赛季共打入36球，荣获英超金靴奖，同时也打破了多项联赛纪录。挪威前锋表示："这是我职业生涯中最棒的赛季之一，感谢队友和教练的支持。"

曼城球迷在球场内外疯狂庆祝这一胜利，球队将在下周举行夺冠游行活动。`,
  },
  {
    id: 2,
    title: '梅西再创纪录，职业生涯进球超800',
    summary: '梅西在本场比赛梅开二度，创造新的历史纪录，成为足球史上第一位正式比赛进球超800的球员。',
    coverImage: 'https://picsum.photos/1200/600?random=2',
    source: '足球周刊',
    author: '记者张华',
    category: '国际足球',
    viewCount: 8921,
    createdAt: '2024-05-18 08:15',
    content: `梅西在本场比赛中梅开二度，创造了新的历史纪录，成为足球史上第一位正式比赛进球超过800的球员。

这位阿根廷巨星在比赛中展现了无与伦比的技术和冷静，两粒进球都堪称经典。第一球是一记精彩的任意球直接破门，第二球则是在禁区内连续过掉三名防守球员后的巧射。

赛后梅西表示："能够达到这个里程碑我感到非常自豪，但更重要的是球队取得了胜利。我要感谢所有帮助过我的队友和教练。"

梅西的职业生涯进球数已经达到了801球，这个数字还在继续增长。他的传奇还在继续书写，球迷们期待着他创造更多的纪录。`,
  },
  {
    id: 3,
    title: '中超联赛即将开幕，各队引援动态汇总',
    summary: '新赛季中超联赛将在下周开幕，各支球队积极备战，多支豪门球队在转会市场上投入重金。',
    coverImage: 'https://picsum.photos/1200/600?random=3',
    source: '中超官网',
    author: '中超编辑部',
    category: '中超',
    viewCount: 5632,
    createdAt: '2024-05-17 16:00',
    content: `新赛季中超联赛将在下周正式开幕，各支球队正在紧张备战中。本赛季，多支豪门球队在转会市场上投入重金，引援动作频频。

上海海港引进了多名实力派球员，包括一位巴西国脚级前锋，球队实力得到显著提升。山东泰山则在中场位置进行了补强，引进了多名国内优秀球员。

北京国安和上海申花也都有重要引援，两队都希望在新赛季能够冲击冠军。特别是申花引进了武磊，这一消息引起了广泛关注。

除了豪门球队，一些中游球队也有不错的引援动作，新赛季的竞争将会更加激烈。球迷们期待着精彩纷呈的比赛。`,
  },
  {
    id: 4,
    title: '欧冠决赛前瞻：皇马vs多特蒙德',
    summary: '欧冠决赛即将打响，皇马冲击第15座欧冠奖杯，多特蒙德期待创造奇迹。',
    coverImage: 'https://picsum.photos/1200/600?random=4',
    source: '欧洲足球',
    author: '欧洲站记者',
    category: '欧冠',
    viewCount: 7845,
    createdAt: '2024-05-17 14:30',
    content: `欧冠决赛即将打响，皇马将迎战多特蒙德，两队都希望能够捧起这座欧洲最高荣誉的奖杯。

皇马是欧冠历史上最成功的球队，已经14次夺得冠军，本赛季他们将冲击第15座欧冠奖杯。球队拥有丰富的欧战经验，加上安切洛蒂的执教，皇马是夺冠的热门。

多特蒙德则希望能够创造奇迹，球队上一次夺得欧冠还是在1997年。本赛季黄黑军团表现出色，在淘汰赛中连克强敌，展现了强大的竞争力。

两队都有世界级的球星，皇马的贝林厄姆、维尼修斯，多特蒙德的贝林厄姆（现在在皇马）和阿德耶米都将是比赛的关键人物。这场决赛注定将是一场精彩绝伦的对决。`,
  },
  {
    id: 5,
    title: '武磊回归中超，加盟上海申花',
    summary: '武磊正式结束留洋生涯回归中超，加盟上海申花，将在新赛季身披7号球衣。',
    coverImage: 'https://picsum.photos/1200/600?random=5',
    source: '足球报',
    author: '记者王伟',
    category: '中超',
    viewCount: 9234,
    createdAt: '2024-05-16 12:00',
    content: `武磊正式结束留洋生涯回归中超，加盟上海申花，将在新赛季身披7号球衣。这一消息引起了中国足坛的广泛关注。

武磊在西班牙人效力期间，成为第一位在西甲进球的中国球员，并在欧联杯中也有进球入账。他的留洋经历虽然充满挑战，但也取得了不少成就。

谈到回归中超，武磊表示："感谢西班牙人俱乐部这些年的培养，现在是时候回到国内联赛了。我希望能够帮助申花取得好成绩，同时也为中国足球的发展贡献自己的力量。"

上海申花球迷对武磊的加盟表示热烈欢迎，相信他的到来将大大提升球队的攻击力。新赛季，武磊将和其他队友一起，为申花冲击联赛冠军而努力。`,
  },
];

function NewsDetailPage() {
  const { id } = useParams();
  const news = newsData.find((n) => n.id === Number(id)) || newsData[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <Link
        to="/"
        className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        返回首页
      </Link>

      {/* 文章封面 */}
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <img
          src={news.coverImage}
          alt={news.title}
          className="w-full h-64 md:h-80 object-cover"
        />

        <div className="p-6 md:p-10">
          {/* 分类标签 */}
          <div className="flex items-center mb-4">
            <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {news.category}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 leading-tight">
            {news.title}
          </h1>

          {/* 元信息 */}
          <div className="flex flex-wrap items-center text-gray-500 text-sm mb-8 gap-4 md:gap-6 pb-6 border-b border-gray-100">
            <span>作者：{news.author}</span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {news.createdAt}
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {news.viewCount.toLocaleString()}
            </span>
            <span>来源：{news.source}</span>
          </div>

          {/* 正文内容 */}
          <div className="prose max-w-none">
            {news.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-6 text-lg">
                {paragraph}
              </p>
            ))}
          </div>

          {/* 互动按钮 */}
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full transition-all">
                <Heart className="w-5 h-5" />
                <span className="font-medium">收藏</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition-all">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">分享</span>
              </button>
              <button className="flex items-center gap-2 px-5 py-3 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-full transition-all">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">评论</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* 评论区 */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <h3 className="font-bold text-xl mb-6 flex items-center text-gray-800">
          <MessageCircle className="w-6 h-6 mr-2 text-green-600" />
          评论区
        </h3>

        {/* 评论输入框 */}
        <div className="mb-8">
          <textarea
            placeholder="发表你的看法..."
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium">
              发表评论
            </button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="space-y-6">
          {[
            { avatar: 'https://picsum.photos/40/40?random=100', name: '球迷小王', time: '2小时前', content: '恭喜曼城！实至名归！本赛季的表现太精彩了，哈兰德太强了！' },
            { avatar: 'https://picsum.photos/40/40?random=101', name: '足球爱好者', time: '3小时前', content: '哈兰德这个赛季的表现真的是现象级的，金靴当之无愧！' },
            { avatar: 'https://picsum.photos/40/40?random=102', name: '曼城死忠', time: '5小时前', content: '三连冠！我们是英超之王！伊蒂哈德的天空是蓝色的！💙' },
          ].map((comment, index) => (
            <div key={index} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
              <img
                src={comment.avatar}
                alt={comment.name}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center mb-2 gap-3">
                  <span className="font-medium text-gray-800">{comment.name}</span>
                  <span className="text-gray-400 text-sm">{comment.time}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                  <button className="hover:text-green-600 transition-colors">👍 点赞</button>
                  <button className="hover:text-green-600 transition-colors">💬 回复</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsDetailPage;
