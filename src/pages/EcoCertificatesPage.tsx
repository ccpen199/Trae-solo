import { motion } from "framer-motion";
import { Leaf, Trees, Download, QrCode, Award, Sparkles, TrendingUp } from "lucide-react";

interface EcoCertificate {
  id: string;
  certificateNo: string;
  productName: string;
  brand: string;
  carbonSaved: number;
  treesEquivalent: number;
  issueDate: string;
  thumbnail: string;
}

const mockCertificates: EcoCertificate[] = [
  {
    id: "1",
    certificateNo: "ECO-2026-0615-8823",
    productName: "Birkin 30 Epsom Etoupe",
    brand: "Hermès",
    carbonSaved: 156.8,
    treesEquivalent: 9,
    issueDate: "2026-06-15",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Hermes%20Birkin%20bag%20luxury%20etoupe%20leather%20product%20photography&image_size=square",
  },
  {
    id: "2",
    certificateNo: "ECO-2026-0528-5421",
    productName: "Classic Flap Medium Lambskin",
    brand: "Chanel",
    carbonSaved: 89.3,
    treesEquivalent: 5,
    issueDate: "2026-05-28",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chanel%20Classic%20Flap%20bag%20black%20lambskin%20gold%20chain%20luxury&image_size=square",
  },
  {
    id: "3",
    certificateNo: "ECO-2026-0518-3287",
    productName: "Submariner Date 126610LN",
    brand: "Rolex",
    carbonSaved: 234.5,
    treesEquivalent: 13,
    issueDate: "2026-05-18",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Rolex%20Submariner%20watch%20ceramic%20bezel%20luxury%20timepiece&image_size=square",
  },
  {
    id: "4",
    certificateNo: "ECO-2026-0420-1089",
    productName: "LOVE Ring Yellow Gold",
    brand: "Cartier",
    carbonSaved: 45.2,
    treesEquivalent: 3,
    issueDate: "2026-04-20",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cartier%20LOVE%20ring%20yellow%20gold%20jewelry%20luxury%20dark%20background&image_size=square",
  },
  {
    id: "5",
    certificateNo: "ECO-2026-0312-6672",
    productName: "Neverfull MM Monogram",
    brand: "Louis Vuitton",
    carbonSaved: 67.8,
    treesEquivalent: 4,
    issueDate: "2026-03-12",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Louis%20Vuitton%20Neverfull%20bag%20monogram%20canvas%20luxury%20tote&image_size=square",
  },
  {
    id: "6",
    certificateNo: "ECO-2026-0205-4451",
    productName: "Classic Check Cashmere Scarf",
    brand: "Burberry",
    carbonSaved: 28.6,
    treesEquivalent: 2,
    issueDate: "2026-02-05",
    thumbnail:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Burberry%20cashmere%20scarf%20check%20pattern%20beige%20luxury%20fashion&image_size=square",
  },
];

const totalCarbon = mockCertificates.reduce((sum, c) => sum + c.carbonSaved, 0);
const totalTrees = mockCertificates.reduce((sum, c) => sum + c.treesEquivalent, 0);

export default function EcoCertificatesPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gold-500/20 bg-gradient-to-br from-forest-900/40 via-ink-900 to-gold-900/20 p-6 overflow-hidden relative"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-forest-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-forest-500/30 bg-forest-500/10 px-3 py-1">
              <Award className="h-4 w-4 text-forest-400" />
              <span className="text-xs font-semibold text-forest-400">环保先行者 Lv.3</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-ink-100">我的环保证书</h1>
            <p className="mt-2 text-sm text-ink-300 max-w-lg">
              每一件回收的奢侈品都在为地球减负。您的环保贡献已转化为可量化的碳减排数据，点击下载您的专属环保证书。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-gold-500/20 bg-ink-900/60 p-4">
              <div className="flex items-center gap-2 text-forest-400">
                <Leaf className="h-4 w-4" />
                <span className="text-xs font-medium">累计减碳</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold gold-text">
                {totalCarbon.toFixed(1)}
                <span className="text-sm font-normal text-gold-400/80"> kg</span>
              </p>
            </div>
            <div className="rounded-xl border border-gold-500/20 bg-ink-900/60 p-4">
              <div className="flex items-center gap-2 text-forest-400">
                <Trees className="h-4 w-4" />
                <span className="text-xs font-medium">等效植树</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-forest-400">
                {totalTrees}
                <span className="text-sm font-normal text-forest-400/80"> 棵</span>
              </p>
            </div>
            <div className="rounded-xl border border-gold-500/20 bg-ink-900/60 p-4 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 text-gold-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">证书数量</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-gold-400">
                {mockCertificates.length}
                <span className="text-sm font-normal text-gold-400/80"> 张</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {mockCertificates.map((cert, i) => (
          <motion.div
            key={cert.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border-2 border-gold-500/25 bg-gradient-to-br from-gold-500/[0.08] via-ink-900 to-forest-900/[0.06] shadow-gold-sm transition-all hover:border-gold-500/50 hover:shadow-gold"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(201,169,98,0.04) 10px, rgba(201,169,98,0.04) 20px), repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(29,126,94,0.04) 10px, rgba(29,126,94,0.04) 20px)",
              }}
            />
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-500/5 blur-2xl group-hover:bg-gold-500/10 transition-colors" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

            <div className="relative p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-forest-500/20 to-forest-700/20 ring-1 ring-forest-500/30">
                    <Leaf className="h-5 w-5 text-forest-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-gold-500">ECO CERTIFICATE</p>
                    <p className="text-[11px] font-medium text-ink-400">{cert.issueDate}</p>
                  </div>
                </div>
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-gold-500/60" />
                </div>
              </div>

              <div className="mb-4 flex gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gold-500/20 bg-ink-800">
                  <img src={cert.thumbnail} alt={cert.productName} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-gold-500 tracking-wider">{cert.brand}</p>
                  <h3 className="mt-0.5 truncate font-display text-base font-bold text-ink-100 leading-tight">
                    {cert.productName}
                  </h3>
                  <p className="mt-2 text-[11px] font-mono text-ink-400 break-all">{cert.certificateNo}</p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-ink-850/70 p-3 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-forest-400">
                    <Leaf className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">节省碳排放</span>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold text-forest-300">
                    {cert.carbonSaved}
                    <span className="text-[10px] font-normal ml-0.5">kg</span>
                  </p>
                </div>
                <div className="rounded-xl bg-ink-850/70 p-3 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-gold-400">
                    <Trees className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium">等效种树</span>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold gold-text">
                    {cert.treesEquivalent}
                    <span className="text-[10px] font-normal ml-0.5">棵</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 border border-gold-500/30">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 5px), repeating-linear-gradient(0deg, #000 0 2px, transparent 2px 5px), radial-gradient(circle at 30% 40%, #000 20%, transparent 21%), radial-gradient(circle at 70% 60%, #000 15%, transparent 16%)",
                      backgroundSize: "auto, auto, 4px 4px, 3px 3px",
                    }}
                  />
                </div>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 px-4 py-2.5 text-sm font-semibold text-gold-400 ring-1 ring-gold-500/30 transition-all hover:from-gold-500 hover:to-gold-600 hover:text-ink-950">
                  <Download className="h-4 w-4" />
                  下载证书
                </button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-ink-500">
                <QrCode className="h-3 w-3" />
                扫码验证证书真伪
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
