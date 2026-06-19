import { useEffect, useState } from "react";
import {
  ArrowLeft,
  HeartHandshake,
  Download,
  MapPin,
  Calendar,
  Shirt,
  BookOpen,
  Award,
  Sparkles,
  Users,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const donations = [
  {
    id: "DN20260610001",
    orgName: "云南省红河州希望小学",
    orgDesc: "为山区儿童提供基础教育支持",
    time: "2026-06-10",
    items: [
      { type: "clothes", name: "儿童冬装", amount: "8.5kg" },
      { type: "books", name: "课外读物", amount: "32本" },
    ],
    value: 268.0,
    beneficiaries: 156,
    status: "已送达",
    certificateReady: true,
  },
  {
    id: "DN20260518003",
    orgName: "四川省凉山州乡村振兴基金会",
    orgDesc: "助力乡村可持续发展",
    time: "2026-05-18",
    items: [
      { type: "clothes", name: "成人衣物", amount: "12.3kg" },
    ],
    value: 186.0,
    beneficiaries: 89,
    status: "已送达",
    certificateReady: true,
  },
  {
    id: "DN20260425002",
    orgName: "青海省玉树州儿童福利院",
    orgDesc: "为孤残儿童提供生活物资",
    time: "2026-04-25",
    items: [
      { type: "books", name: "儿童绘本", amount: "56本" },
      { type: "clothes", name: "婴幼儿服装", amount: "5.2kg" },
    ],
    value: 412.5,
    beneficiaries: 42,
    status: "已送达",
    certificateReady: true,
  },
  {
    id: "DN20260615004",
    orgName: "贵州省黔东南州教育帮扶中心",
    orgDesc: "为偏远地区学校捐赠图书",
    time: "2026-06-15",
    items: [
      { type: "books", name: "教辅书籍", amount: "78本" },
    ],
    value: 312.0,
    beneficiaries: 203,
    status: "运输中",
    certificateReady: false,
  },
];

const itemIconMap: Record<string, typeof Shirt> = {
  clothes: Shirt,
  books: BookOpen,
};

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let startTime: number;
    let raf: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased * 100) / 100);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toFixed(1)}</span>;
}

export default function Donation() {
  const navigate = useNavigate();

  const totalAmount = donations.reduce((sum, d) => sum + d.value, 0);
  const totalBeneficiaries = donations.reduce((sum, d) => sum + d.beneficiaries, 0);
  const doneCount = donations.filter((d) => d.status === "已送达").length;

  return (
    <div className="pb-8 animate-fade-in">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-rose-500 via-pink-500 to-eco-500 text-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-2 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">公益追溯</h1>
        </div>
      </div>

      <section className="relative px-4 pt-5 pb-8 bg-gradient-to-br from-rose-500 via-pink-500 to-eco-500 text-white overflow-hidden">
        <div className="absolute -top-10 -right-6 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/85 text-sm">我的公益捐赠</p>
            <p className="text-2xl font-bold mt-0.5">
              ¥<AnimatedNumber value={totalAmount} />
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 relative">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-white/90" />
            <p className="font-bold text-lg">{totalBeneficiaries}</p>
            <p className="text-xs text-white/75">受益人数</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white/90" />
            <p className="font-bold text-lg">{donations.length}</p>
            <p className="text-xs text-white/75">捐赠次数</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
            <Award className="w-5 h-5 mx-auto mb-1 text-white/90" />
            <p className="font-bold text-lg">{doneCount}</p>
            <p className="text-xs text-white/75">已完成</p>
          </div>
        </div>
      </section>

      <div className="px-4 -mt-4 relative z-10">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-800 text-sm">爱心证书</p>
            <p className="text-xs text-neutral-500 mt-0.5">您已累计获得 {doneCount} 张公益捐赠证书</p>
          </div>
          <button className="px-3.5 py-1.5 rounded-lg bg-eco-50 text-eco-600 text-xs font-medium hover:bg-eco-100 transition-colors">
            查看全部
          </button>
        </div>
      </div>

      <div className="px-4 mt-5">
        <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-eco-600" />
          捐赠流向记录
        </h3>
        <div className="space-y-4">
          {donations.map((d, idx) => (
            <div
              key={d.id}
              className="card overflow-hidden animate-slide-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="p-4 bg-gradient-to-r from-eco-50/70 to-transparent border-b border-neutral-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-neutral-800">{d.orgName}</h4>
                      <span
                        className={cn(
                          "badge",
                          d.status === "已送达"
                            ? "bg-eco-100 text-eco-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{d.orgDesc}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {d.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        受益 {d.beneficiaries} 人
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {d.items.map((item, i) => {
                    const ItemIcon = itemIconMap[item.type] || Shirt;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 text-sm text-neutral-600"
                      >
                        <ItemIcon className="w-3.5 h-3.5 text-eco-500" />
                        {item.name} · {item.amount}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-100">
                  <div>
                    <span className="text-xs text-neutral-400">捐赠价值</span>
                    <span className="text-eco-600 text-lg font-bold ml-2">¥{d.value.toFixed(1)}</span>
                  </div>
                  <button
                    disabled={!d.certificateReady}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                      d.certificateReady
                        ? "bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-sm hover:shadow-md"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    {d.certificateReady ? "下载证书" : "待生成"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-eco-50 border border-eco-100 text-center">
          <HeartHandshake className="w-8 h-8 mx-auto text-rose-400 mb-2" />
          <p className="font-semibold text-neutral-800">感谢您的爱心</p>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            每一次回收都是对地球的温柔，每一份捐赠都是对未来的希望。
          </p>
        </div>
      </div>
    </div>
  );
}
