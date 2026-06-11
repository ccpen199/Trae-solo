import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Scissors,
  UtensilsCrossed,
  Bed,
  Briefcase,
  ShoppingBag,
  Heart,
  Home,
  Leaf,
  CalendarHeart,
  PartyPopper,
  Cake,
} from "lucide-react";

export default function Calendar() {
  const navigate = useNavigate();

  const today = {
    solarDate: "2026年6月11日",
    weekDay: "星期四",
    lunarDate: "农历四月廿六",
    lunarYear: "丙午年",
    lunarMonth: "甲午月",
    lunarDay: "丁酉日",
    zodiac: "马",
    solarTerm: "芒种",
    festival: "",
  };

  const yiItems = [
    { text: "祭祀", icon: Heart },
    { text: "嫁娶", icon: Cake },
    { text: "安床", icon: Bed },
    { text: "出行", icon: Briefcase },
    { text: "开市", icon: ShoppingBag },
    { text: "立券", icon: Home },
  ];

  const jiItems = [
    { text: "动土", icon: Scissors },
    { text: "破土", icon: X },
    { text: "修造", icon: Home },
    { text: "入宅", icon: Home },
    { text: "安门", icon: Scissors },
  ];

  const healthTips = [
    "芒种时节气温升高，注意防暑降温",
    "多吃清热利湿的食物，如绿豆、冬瓜",
    "午间适当休息，保证充足睡眠",
    "适当锻炼，避免大汗淋漓",
  ];

  const anniversaries = [
    { date: "6月15日", event: "老伴儿生日", type: "birthday", daysLeft: 4 },
    { date: "6月20日", event: "结婚45周年", type: "anniversary", daysLeft: 9 },
    { date: "7月1日", event: "孙子放暑假", type: "event", daysLeft: 20 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            今日黄历
          </h1>
          <div className="w-14" />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-lg mb-8 text-center">
          <p className="text-[24px] text-gray-600 mb-4">{today.weekDay}</p>
          <p className="text-[48px] font-bold text-gray-900 mb-4">
            {today.solarDate}
          </p>
          <div className="bg-red-500 text-white rounded-2xl p-4 inline-block mb-6">
            <p className="text-[28px] font-bold">{today.lunarDate}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-[20px]">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500">干支</p>
              <p className="font-bold text-gray-800">{today.lunarYear}</p>
              <p className="font-bold text-gray-800">{today.lunarMonth}</p>
              <p className="font-bold text-gray-800">{today.lunarDay}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500">生肖</p>
              <p className="text-[40px]">{today.zodiac}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-gray-500">节气</p>
              <p className="text-[24px] font-bold text-green-600">
                {today.solarTerm}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center">
                <Check size={32} className="text-white" />
              </div>
              <h2 className="text-[32px] font-bold text-green-600">宜</h2>
            </div>
            <div className="space-y-4">
              {yiItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-green-50 rounded-xl p-4"
                  >
                    <div className="bg-green-200 w-12 h-12 rounded-xl flex items-center justify-center">
                      <Icon size={28} className="text-green-700" />
                    </div>
                    <p className="text-[24px] font-bold text-green-800">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center">
                <X size={32} className="text-white" />
              </div>
              <h2 className="text-[32px] font-bold text-red-600">忌</h2>
            </div>
            <div className="space-y-4">
              {jiItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-red-50 rounded-xl p-4"
                  >
                    <div className="bg-red-200 w-12 h-12 rounded-xl flex items-center justify-center">
                      <Icon size={28} className="text-red-700" />
                    </div>
                    <p className="text-[24px] font-bold text-red-800">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <Leaf size={32} className="text-white" />
            </div>
            <h2 className="text-[28px] font-bold text-gray-800">节气养生</h2>
          </div>
          <div className="space-y-4">
            {healthTips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-green-50 rounded-xl p-4"
              >
                <span className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-[20px] font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-[22px] text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/health")}
            className="w-full mt-6 bg-green-500 text-white text-[24px] font-bold py-5 rounded-2xl active:scale-98 transition-transform"
          >
            查看更多养生食谱
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-500 w-12 h-12 rounded-xl flex items-center justify-center">
              <CalendarHeart size={32} className="text-white" />
            </div>
            <h2 className="text-[28px] font-bold text-gray-800">重要纪念日</h2>
          </div>
          <div className="space-y-4">
            {anniversaries.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-pink-50 rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-pink-200 w-12 h-12 rounded-xl flex items-center justify-center">
                    {item.type === "birthday" ? (
                      <Cake size={28} className="text-pink-700" />
                    ) : item.type === "anniversary" ? (
                      <Heart size={28} className="text-pink-700" />
                    ) : (
                      <PartyPopper size={28} className="text-pink-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-[22px] font-bold text-gray-800">
                      {item.event}
                    </p>
                    <p className="text-[18px] text-gray-500">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[24px] font-bold text-pink-600">
                    {item.daysLeft}天
                  </p>
                  <p className="text-[18px] text-gray-500">后</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
