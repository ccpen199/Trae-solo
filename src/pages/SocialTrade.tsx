import { useState } from "react";
import { Search, Plus, Shield, BookOpen, User, X } from "lucide-react";

const CONDITIONS = ["全部", "全新", "良好", "一般"];
const STATUS_STEPS = ["已发布", "已下单", "担保中", "已完成"];

const BOOKS = [
  { id: 1, title: "高等数学（第七版）上册", course: "高等数学A", condition: "良好", originalPrice: 46, price: 18, seller: "林小溪", guaranteed: true, status: 2 },
  { id: 2, title: "大学物理（第五版）", course: "大学物理B", condition: "全新", originalPrice: 58, price: 35, seller: "张明远", guaranteed: true, status: 1 },
  { id: 3, title: "数据结构与算法分析", course: "数据结构", condition: "一般", originalPrice: 69, price: 15, seller: "王思琪", guaranteed: false, status: 0 },
  { id: 4, title: "线性代数及其应用", course: "线性代数", condition: "良好", originalPrice: 52, price: 22, seller: "陈雨涵", guaranteed: true, status: 3 },
  { id: 5, title: "计算机网络（第八版）", course: "计算机网络", condition: "全新", originalPrice: 59, price: 40, seller: "赵天宇", guaranteed: true, status: 0 },
  { id: 6, title: "概率论与数理统计", course: "概率论", condition: "一般", originalPrice: 45, price: 12, seller: "刘芳芳", guaranteed: false, status: 1 },
];

const CONDITION_COLORS: Record<string, string> = {
  "全新": "bg-[#2EC4B6] text-white",
  "良好": "bg-[#FFC857] text-[#1B3A5C]",
  "一般": "bg-gray-200 text-gray-600",
};

export default function SocialTrade() {
  const [condition, setCondition] = useState("全部");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null);

  const filtered = BOOKS.filter((b) => {
    const matchCond = condition === "全部" || b.condition === condition;
    const matchSearch = !search || b.title.includes(search) || b.course.includes(search);
    return matchCond && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">二手教材交易</h1>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索教材名称或课程名..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#FF6B35] text-sm"
            />
          </div>
          <div className="flex gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  condition === c ? "bg-[#FF6B35] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#FF6B35]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142a44] transition-colors">
            <Plus size={16} />
            发布教材
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => (
            <div key={book.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gradient-to-br from-[#1B3A5C] to-[#2EC4B6] flex items-center justify-center">
                <BookOpen size={48} className="text-white/60" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#1B3A5C] text-sm leading-tight flex-1">{book.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${CONDITION_COLORS[book.condition]}`}>
                    {book.condition}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{book.course}</p>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-lg font-bold text-[#E63946]">¥{book.price}</span>
                  <span className="text-xs text-gray-400 line-through">¥{book.originalPrice}</span>
                  <span className="text-xs text-[#FF6B35] font-medium">{Math.round((1 - book.price / book.originalPrice) * 100)}%OFF</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User size={12} />
                    {book.seller}
                    {book.guaranteed && (
                      <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-[#2EC4B6]/10 text-[#2EC4B6]">
                        <Shield size={10} />
                        担保支付
                      </span>
                    )}
                  </div>
                  <button onClick={() => setSelectedBook(book)} className="text-xs px-3 py-1.5 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55d2b] transition-colors">
                    查看进度
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selectedBook && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
            <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C]">交易进度</h3>
                <button onClick={() => setSelectedBook(null)}><X size={18} className="text-gray-400" /></button>
              </div>
              <p className="text-sm text-gray-600 mb-4">{selectedBook.title}</p>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= selectedBook.status ? "bg-[#2EC4B6] text-white" : "bg-gray-200 text-gray-400"}`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs mt-1 ${i <= selectedBook.status ? "text-[#2EC4B6]" : "text-gray-400"}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C]">发布教材</h3>
                <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input placeholder="教材名称" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <input placeholder="课程名称" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]">
                  <option>选择成色</option>
                  <option>全新</option>
                  <option>良好</option>
                  <option>一般</option>
                </select>
                <div className="flex gap-3">
                  <input placeholder="原价" type="number" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                  <input placeholder="售价" type="number" className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <button className="w-full py-2.5 rounded-lg bg-[#FF6B35] text-white font-medium text-sm hover:bg-[#e55d2b] transition-colors">确认发布</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
