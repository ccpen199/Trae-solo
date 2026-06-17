import { useState, useMemo } from "react";
import { motion as m } from "framer-motion";
import { Search, Plus, Coins, User, Filter, SlidersHorizontal } from "lucide-react";
import { useAppStore } from "@/stores";
import { Button, Modal, Badge } from "@/components/ui";
import { cn, getSwapStatusLabel, getConditionLabel, generateId } from "@/utils";
import type { SwapItem } from "@/types";

const categoryFilters = ["全部", "家用电器", "儿童用品", "运动户外", "图书文具", "家居用品"];
const conditionFilters = [
  { value: "all", label: "全部成色" },
  { value: "new", label: "全新" },
  { value: "like_new", label: "九成新" },
  { value: "good", label: "良好" },
  { value: "fair", label: "一般" },
];

export default function SwapMarket() {
  const { swapItems, addSwapItem, updateSwapItem, currentUser, creditScore } = useAppStore();
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SwapItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: "", description: "", category: "家用电器", condition: "good" as const, pricePoints: "" });

  const filteredItems = useMemo(() => {
    return swapItems.filter((item) => {
      const matchCategory = categoryFilter === "全部" || item.category === categoryFilter;
      const matchCondition = conditionFilter === "all" || item.condition === conditionFilter;
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchCondition && matchSearch;
    });
  }, [swapItems, categoryFilter, conditionFilter, searchQuery]);

  const handlePublish = () => {
    if (!publishForm.title || !publishForm.pricePoints) return;
    addSwapItem({
      id: generateId(),
      title: publishForm.title,
      description: publishForm.description,
      images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop"],
      category: publishForm.category,
      condition: publishForm.condition,
      pricePoints: parseInt(publishForm.pricePoints),
      ownerId: currentUser.ownerId || "",
      ownerName: currentUser.name,
      status: "available",
      createdAt: new Date().toISOString(),
    });
    setShowPublishModal(false);
    setPublishForm({ title: "", description: "", category: "家用电器", condition: "good", pricePoints: "" });
  };

  const handleSwap = (item: SwapItem) => {
    if (item.status !== "available" || creditScore.points < item.pricePoints) return;
    updateSwapItem(item.id, { status: "reserved", reservedBy: currentUser.ownerId });
    setShowDetailModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">旧物置换广场</h1>
          <p className="text-slate-500">邻里闲置物品互换，物尽其用，共建节约型社区</p>
        </m.div>

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-slate-400" />
              {categoryFilters.map((f) => (
                <m.button
                  key={f}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCategoryFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    categoryFilter === f ? "bg-orange-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {f}
                </m.button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white appearance-none">
                  {conditionFilters.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
                </select>
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜索物品..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <Button onClick={() => setShowPublishModal(true)} leftIcon={<Plus className="w-4 h-4" />} className="bg-orange-500 hover:bg-orange-600">发布物品</Button>
            </div>
          </div>
        </m.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => {
            const statusInfo = getSwapStatusLabel(item.status);
            return (
              <m.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
                className="bg-white rounded-2xl shadow-card hover:shadow-card-hover cursor-pointer overflow-hidden group"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3"><Badge className={cn(statusInfo.bgColor, statusInfo.color)}>{statusInfo.label}</Badge></div>
                  <div className="absolute top-3 right-3"><Badge className="bg-white/90 text-orange-600">{getConditionLabel(item.condition)}</Badge></div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-orange-500"><Coins className="w-4 h-4" /><span className="font-bold">{item.pricePoints}</span><span className="text-sm">积分</span></div>
                    <div className="flex items-center gap-1 text-sm text-slate-400"><User className="w-3.5 h-3.5" /><span>{item.ownerName}</span></div>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>

        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedItem?.title} size="lg"
          footer={selectedItem?.status === "available" ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 text-orange-500"><Coins className="w-5 h-5" /><span className="text-xl font-bold">{selectedItem?.pricePoints}</span><span className="text-sm">积分</span></div>
              <Button onClick={() => selectedItem && handleSwap(selectedItem)} disabled={creditScore.points < (selectedItem?.pricePoints || 0)} className="bg-orange-500 hover:bg-orange-600">
                {creditScore.points >= (selectedItem?.pricePoints || 0) ? "申请置换" : "积分不足"}
              </Button>
            </div>
          ) : null}
        >
          {selectedItem && (
            <div>
              <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-full h-64 object-cover rounded-xl mb-4" />
              <div className="flex items-center gap-2 mb-4">
                <Badge className={cn(getSwapStatusLabel(selectedItem.status).bgColor, getSwapStatusLabel(selectedItem.status).color)}>{getSwapStatusLabel(selectedItem.status).label}</Badge>
                <Badge variant="secondary">{selectedItem.category}</Badge>
                <Badge variant="info">{getConditionLabel(selectedItem.condition)}</Badge>
              </div>
              <p className="text-slate-600 mb-4">{selectedItem.description}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500"><User className="w-4 h-4" /><span>发布人：{selectedItem.ownerName}</span></div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showPublishModal} onClose={() => setShowPublishModal(false)} title="发布闲置物品" size="md"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowPublishModal(false)}>取消</Button>
              <Button onClick={handlePublish} className="bg-orange-500 hover:bg-orange-600">确认发布</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">物品名称</label>
              <input type="text" value={publishForm.title} onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })} placeholder="请输入物品名称" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">物品描述</label>
              <textarea value={publishForm.description} onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })} placeholder="请输入物品详细描述" rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">物品分类</label>
                <select value={publishForm.category} onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  {categoryFilters.filter((f) => f !== "全部").map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">物品成色</label>
                <select value={publishForm.condition} onChange={(e) => setPublishForm({ ...publishForm, condition: e.target.value as any })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                  {conditionFilters.filter((f) => f.value !== "all").map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">期望积分</label>
              <input type="number" value={publishForm.pricePoints} onChange={(e) => setPublishForm({ ...publishForm, pricePoints: e.target.value })} placeholder="请输入期望兑换的积分数量" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
