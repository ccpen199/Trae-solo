import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  Filter,
  ChevronDown,
  X,
  Check,
  Tag,
} from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/admin/DataTable";

interface Product {
  id: number;
  brand: string;
  model: string;
  series: string;
  category: string;
  launchPrice: number;
  basePrice: number;
  status: "active" | "inactive";
  updatedAt: string;
}

const mockProducts: Product[] = [
  { id: 1, brand: "Hermès", model: "Birkin 30 Epsom", series: "Birkin系列", category: "箱包", launchPrice: 158000, basePrice: 98000, status: "active", updatedAt: "2026-06-15" },
  { id: 2, brand: "Hermès", model: "Kelly 28 Togo", series: "Kelly系列", category: "箱包", launchPrice: 128000, basePrice: 78000, status: "active", updatedAt: "2026-06-14" },
  { id: 3, brand: "Rolex", model: "Submariner Date 126610LN", series: "潜航者系列", category: "腕表", launchPrice: 98500, basePrice: 62000, status: "active", updatedAt: "2026-06-13" },
  { id: 4, brand: "Rolex", model: "Daytona 116500LN", series: "迪通拿系列", category: "腕表", launchPrice: 268000, basePrice: 198000, status: "active", updatedAt: "2026-06-12" },
  { id: 5, brand: "Chanel", model: "Classic Flap Medium", series: "Classic系列", category: "箱包", launchPrice: 88000, basePrice: 52000, status: "active", updatedAt: "2026-06-11" },
  { id: 6, brand: "Chanel", model: "Boy Bag Medium", series: "Boy系列", category: "箱包", launchPrice: 58000, basePrice: 32000, status: "active", updatedAt: "2026-06-10" },
  { id: 7, brand: "Louis Vuitton", model: "Neverfull MM", series: "经典系列", category: "箱包", launchPrice: 18500, basePrice: 8800, status: "active", updatedAt: "2026-06-09" },
  { id: 8, brand: "Patek Philippe", model: "Nautilus 5711/1A", series: "鹦鹉螺系列", category: "腕表", launchPrice: 688000, basePrice: 520000, status: "inactive", updatedAt: "2026-06-08" },
  { id: 9, brand: "Cartier", model: "LOVE Ring 18K", series: "LOVE系列", category: "珠宝", launchPrice: 16800, basePrice: 8800, status: "active", updatedAt: "2026-06-07" },
  { id: 10, brand: "Dior", model: "Lady Dior Medium", series: "Lady系列", category: "箱包", launchPrice: 52000, basePrice: 28000, status: "active", updatedAt: "2026-06-06" },
  { id: 11, brand: "Gucci", model: "Dionysus Medium", series: "酒神系列", category: "箱包", launchPrice: 28800, basePrice: 12800, status: "active", updatedAt: "2026-06-05" },
  { id: 12, brand: "Bulgari", model: "B.Zero1 Ring", series: "B.Zero1系列", category: "珠宝", launchPrice: 12800, basePrice: 5800, status: "inactive", updatedAt: "2026-06-04" },
];

const categories = ["全部品类", "箱包", "腕表", "珠宝", "配饰", "鞋履"];
const brands = ["全部品牌", "Hermès", "Rolex", "Chanel", "Louis Vuitton", "Cartier", "Dior", "Gucci", "Patek Philippe", "Bulgari"];

export default function AdminProductsPage() {
  const [category, setCategory] = useState("全部品类");
  const [brand, setBrand] = useState("全部品牌");
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const filteredData = mockProducts.filter((p) => {
    const matchCat = category === "全部品类" || p.category === category;
    const matchBrand = brand === "全部品牌" || p.brand === brand;
    const matchKw =
      !keyword ||
      p.model.toLowerCase().includes(keyword.toLowerCase()) ||
      p.brand.toLowerCase().includes(keyword.toLowerCase());
    return matchCat && matchBrand && matchKw;
  });

  const openModal = (p?: Product) => {
    setEditing(p ?? null);
    setModalOpen(true);
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "brand",
      title: "品牌",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 ring-1 ring-gold-500/20">
            <Tag className="h-4 w-4 text-gold-500" />
          </div>
          <span className="text-xs font-bold text-gold-500 tracking-wider">{row.brand}</span>
        </div>
      ),
    },
    {
      key: "model",
      title: "型号",
      render: (row) => (
        <div>
          <p className="font-medium text-ink-100">{row.model}</p>
          <p className="mt-0.5 text-[10px] text-ink-500">{row.series}</p>
        </div>
      ),
    },
    { key: "category", title: "品类", align: "center", render: (row) => (
      <span className="inline-flex rounded-md bg-forest-500/10 px-2 py-0.5 text-[11px] font-medium text-forest-400 ring-1 ring-forest-500/30">
        {row.category}
      </span>
    )},
    {
      key: "launchPrice",
      title: "首发价",
      align: "right",
      render: (row) => <span className="font-medium text-ink-300">¥{row.launchPrice.toLocaleString()}</span>,
    },
    {
      key: "basePrice",
      title: "回收基价",
      align: "right",
      render: (row) => <span className="font-display font-bold gold-text">¥{row.basePrice.toLocaleString()}</span>,
    },
    {
      key: "status",
      title: "状态",
      align: "center",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            row.status === "active"
              ? "bg-jade-500/15 text-jade-400 ring-1 ring-jade-500/30"
              : "bg-ink-600/40 text-ink-300 ring-1 ring-ink-500/40"
          }`}
        >
          {row.status === "active" ? "在售" : "停用"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      align: "right",
      width: "140px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openModal(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-gold-500/10 hover:text-gold-400"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-coral-500/10 hover:text-coral-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-ink-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 pr-8 text-sm text-ink-100 outline-none focus:border-gold-500/40 cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386869B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
              >
                {categories.map((c) => <option key={c} value={c} className="bg-ink-900">{c}</option>)}
              </select>
            </div>

            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 pr-8 text-sm text-ink-100 outline-none focus:border-gold-500/40 cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386869B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              {brands.map((b) => <option key={b} value={b} className="bg-ink-900">{b}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-850 px-3 py-2 w-full lg:w-72">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索品牌/型号..."
                className="flex-1 bg-transparent text-sm text-ink-100 placeholder-ink-500 outline-none"
              />
              <ChevronDown className="h-4 w-4 text-ink-500" />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-bold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              新增型号
            </motion.button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ink-400">快速筛选：</span>
          {["高价值(>10万)", "腕表专场", "箱包专场", "本月新品"].map((tag, i) => (
            <button
              key={tag}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                i === 0
                  ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30"
                  : "bg-ink-850 text-ink-400 ring-1 ring-white/[0.06] hover:text-gold-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-100">
              <Package className="h-5 w-5 text-gold-500" />
              商品型号数据库
            </h2>
            <p className="mt-1 text-xs text-ink-400">
              共 <span className="font-semibold text-gold-400">{filteredData.length}</span> 条型号记录
            </p>
          </div>
        </div>
        <DataTable columns={columns} data={filteredData} rowKey="id" selectable emptyText="暂无匹配型号" />
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl border border-gold-500/20 bg-ink-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-ink-100">
                  {editing ? "编辑商品型号" : "新增商品型号"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "品牌名称", placeholder: "如 Hermès", value: editing?.brand, full: false },
                  { label: "型号系列", placeholder: "如 Birkin系列", value: editing?.series, full: false },
                  { label: "完整型号", placeholder: "如 Birkin 30 Epsom Etoupe", value: editing?.model, full: true },
                  { label: "商品品类", placeholder: "箱包/腕表/珠宝", value: editing?.category, full: false },
                  { label: "首发公价 (元)", placeholder: "158000", value: editing?.launchPrice, full: false },
                  { label: "回收基价 (元)", placeholder: "98000", value: editing?.basePrice, full: false },
                ].map((f, i) => (
                  <div key={i} className={f.full ? "sm:col-span-2" : ""}>
                    <label className="mb-1.5 block text-xs font-medium text-ink-300">{f.label}</label>
                    <input
                      defaultValue={f.value}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-white/[0.08] bg-ink-850 px-4 py-2.5 text-sm text-ink-100 placeholder-ink-500 outline-none focus:border-gold-500/40"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/[0.08] bg-ink-850 py-2.5 text-sm font-medium text-ink-200 hover:border-gold-500/30 hover:text-gold-500 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 py-2.5 text-sm font-bold text-ink-950 shadow-gold-sm hover:from-gold-400 hover:to-gold-500 transition-all"
                >
                  <Check className="h-4 w-4" />
                  确认保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
