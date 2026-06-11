import { useState } from "react";
import { Heart, MessageCircle, Plus, Hash } from "lucide-react";

const TABS = ["全部", "班级圈", "院系圈", "兴趣圈"];

const TAGS = ["期末复习", "社团活动", "食堂探店", "校园跑步", "图书馆占座", "实习分享", "考研加油", "二手交换"];

const POSTS = [
  { id: 1, author: "林小溪", avatar: "L", time: "5分钟前", content: "今天图书馆三楼终于有空位了！阳光正好，学习效率直接翻倍 ☀️", tags: ["图书馆占座"], likes: 24, comments: 8, circle: "班级圈" },
  { id: 2, author: "张明远", avatar: "Z", time: "15分钟前", content: "求推荐西门外好吃不贵的火锅店，宿舍聚餐求推荐！", tags: ["食堂探店"], likes: 12, comments: 15, circle: "兴趣圈" },
  { id: 3, author: "王思琪", avatar: "W", time: "30分钟前", content: "计算机学院篮球赛决赛今天下午3点，体育馆见！加油信科队！", tags: ["社团活动"], likes: 56, comments: 22, circle: "院系圈" },
  { id: 4, author: "陈雨涵", avatar: "C", time: "1小时前", content: "高数期末复习笔记整理好了，需要的同学私我，免费分享~", tags: ["期末复习"], likes: 89, comments: 34, circle: "班级圈" },
  { id: 5, author: "赵天宇", avatar: "赵", time: "2小时前", content: "今天跑了校园环线5公里，配速5分30秒，坚持打卡第30天！", tags: ["校园跑步"], likes: 33, comments: 11, circle: "兴趣圈" },
  { id: 6, author: "刘芳芳", avatar: "刘", time: "3小时前", content: "字节跳动暑期实习已上岸，面试经验分享给大家，祝大家都能拿到心仪offer！", tags: ["实习分享"], likes: 112, comments: 45, circle: "院系圈" },
  { id: 7, author: "孙浩然", avatar: "孙", time: "4小时前", content: "考研倒计时30天，每天坚持学到晚上11点，加油加油！", tags: ["考研加油", "期末复习"], likes: 67, comments: 19, circle: "班级圈" },
  { id: 8, author: "周小倩", avatar: "周", time: "5小时前", content: "有一本《数据结构与算法》九成新，原价68现价20，需要的联系我", tags: ["二手交换"], likes: 18, comments: 7, circle: "兴趣圈" },
  { id: 9, author: "吴晓峰", avatar: "吴", time: "6小时前", content: "校园歌手大赛初赛今晚7点在大学生活动中心，欢迎来捧场！", tags: ["社团活动"], likes: 45, comments: 16, circle: "院系圈" },
];

const AVATAR_COLORS = ["bg-[#FF6B35]", "bg-[#1B3A5C]", "bg-[#2EC4B6]", "bg-[#E63946]", "bg-[#FFC857]"];

export default function Social() {
  const [activeTab, setActiveTab] = useState("全部");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const filtered = activeTab === "全部" ? POSTS : POSTS.filter((p) => p.circle === activeTab);

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">动态圈</h1>
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex gap-2 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab ? "bg-[#FF6B35] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {filtered.map((post) => (
                <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${AVATAR_COLORS[post.id % 5]}`}>
                      {post.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-[#1B3A5C]">{post.author}</div>
                      <div className="text-xs text-gray-400">{post.time} · {post.circle}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3 leading-relaxed">{post.content}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-full bg-[#FFC857]/20 text-[#1B3A5C]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${likedPosts.has(post.id) ? "text-[#E63946]" : "hover:text-[#E63946]"}`}
                    >
                      <Heart size={16} fill={likedPosts.has(post.id) ? "currentColor" : "none"} />
                      {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[#2EC4B6] transition-colors">
                      <MessageCircle size={16} />
                      {post.comments}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-56 shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 sticky top-6">
              <h3 className="font-semibold text-[#1B3A5C] mb-4 flex items-center gap-2">
                <Hash size={16} className="text-[#FF6B35]" />
                热门标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#FFC857]/30 cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30 flex items-center justify-center hover:bg-[#e55d2b] transition-colors">
        <Plus size={24} />
      </button>
    </div>
  );
}
