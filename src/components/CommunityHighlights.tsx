import { Link } from 'react-router-dom'
import { Heart, MessageCircle, ArrowRight } from 'lucide-react'

const mockPosts = [
  {
    id: 1,
    author: '爱宠达人',
    content: '今天带毛孩子去做了年度体检，一切正常！分享一下体检清单，新手铲屎官们记得收藏～',
    likes: 42,
    comments: 12,
    height: 'h-48',
  },
  {
    id: 2,
    author: '金毛妈妈',
    content: 'Lucky今天3岁啦！给他做了一个狗狗蛋糕，他开心得尾巴都要摇断了 🎂',
    likes: 128,
    comments: 35,
    height: 'h-56',
  },
  {
    id: 3,
    author: '猫奴日记',
    content: '英短蓝猫掉毛严重怎么办？分享我的应对方法：1.定期梳毛 2.添加鱼油 3.保持湿度',
    likes: 67,
    comments: 23,
    height: 'h-44',
  },
  {
    id: 4,
    author: '柯基控',
    content: '短腿的日常：又钻不进狗洞了... 但他依然很开心',
    likes: 89,
    comments: 15,
    height: 'h-40',
  },
]

export default function CommunityHighlights() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-font text-2xl font-bold text-text-primary">社区精选</h2>
        <Link to="/community" className="flex items-center gap-1 text-primary text-sm font-medium hover:gap-2 transition-all">
          更多动态 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {mockPosts.map((post) => (
          <Link
            key={post.id}
            to="/community"
            className="block bg-white rounded-2xl p-5 card-hover shadow-sm break-inside-avoid"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                {post.author[0]}
              </div>
              <span className="text-sm font-medium text-text-primary">{post.author}</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100">
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <Heart className="w-3.5 h-3.5" /> {post.likes}
              </span>
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <MessageCircle className="w-3.5 h-3.5" /> {post.comments}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
