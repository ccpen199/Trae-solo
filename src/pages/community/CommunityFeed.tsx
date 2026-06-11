import { useState } from 'react'
import { Heart, MessageCircle, Plus, Image as ImageIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const mockPosts = [
  { id: '1', author: '王建国', content: '今天小区花园的月季开得真漂亮，分享一下给大家！', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20roses%20in%20community%20garden%20spring&image_size=landscape_4_3'], likes: 24, comments: 8, time: '2小时前' },
  { id: '2', author: '李美华', content: '提醒大家注意，明天上午8点到10点停水维修，请提前储水。', images: [], likes: 15, comments: 3, time: '3小时前' },
  { id: '3', author: '张志远', content: '有没有邻居想一起组织周末晨跑活动？每天早上6:30在小区门口集合，欢迎加入！', images: [], likes: 32, comments: 12, time: '5小时前' },
  { id: '4', author: '赵晓燕', content: '今天在地下车库捡到一把车钥匙，丢失的邻居请联系物业认领。', images: [], likes: 8, comments: 2, time: '昨天' },
  { id: '5', author: '孙大明', content: '建议在儿童游乐区增加一些遮阳设施，夏天太晒了，孩子们玩不了多久。', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20playground%20with%20shade%20structure&image_size=landscape_4_3'], likes: 45, comments: 18, time: '昨天' },
  { id: '6', author: '周静', content: '分享一个家庭收纳小技巧，鞋柜空间不够的可以试试这个方法。', images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organized%20shoe%20cabinet%20storage%20tips&image_size=landscape_4_3'], likes: 19, comments: 6, time: '2天前' },
]

export default function CommunityFeed() {
  const [posts, setPosts] = useState(mockPosts)
  const [showCreate, setShowCreate] = useState(false)
  const [newContent, setNewContent] = useState('')

  const handleLike = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p))
  }

  const handlePost = () => {
    if (!newContent.trim()) return
    const post = {
      id: Date.now().toString(),
      author: '管理员',
      content: newContent,
      images: [],
      likes: 0,
      comments: 0,
      time: '刚刚',
    }
    setPosts((prev) => [post, ...prev])
    setNewContent('')
    setShowCreate(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="社区动态"
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} />发布动态
          </button>
        }
      />

      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="分享社区新鲜事..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-500 transition-colors">
              <ImageIcon size={18} />添加图片
            </button>
            <button
              onClick={handlePost}
              disabled={!newContent.trim()}
              className="h-8 px-5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 transition-colors"
            >
              发布
            </button>
          </div>
        </div>
      )}

      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="break-inside-avoid bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            {post.images.length > 0 && (
              <img src={post.images[0]} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-medium">
                    {post.author[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{post.author}</span>
                  <span className="text-xs text-slate-400">{post.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Heart size={14} />{post.likes}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageCircle size={14} />{post.comments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
