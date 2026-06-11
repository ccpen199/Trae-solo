import { useNavigate } from "react-router-dom";
import { Sun, CalendarDays, Heart, Users } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: "weather",
      title: "天气",
      subtitle: "查看今日天气",
      icon: Sun,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
    },
    {
      id: "calendar",
      title: "黄历",
      subtitle: "今日宜忌查询",
      icon: CalendarDays,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
    },
    {
      id: "health",
      title: "健康",
      subtitle: "养生食谱运动",
      icon: Heart,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      hoverBg: "hover:bg-green-100",
    },
    {
      id: "family",
      title: "家属",
      subtitle: "家人关怀管理",
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
    },
  ];

  const handleClick = (id: string) => {
    navigate(`/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-[36px] font-bold text-gray-900 text-center mb-8">
          银发数字生活工作台
        </h1>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mb-8">
          <p className="text-[24px] font-bold text-yellow-800 text-center">
            ⚠️ 今日有小雨，出门请带伞！
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`${item.bgColor} ${item.hoverBg} rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 border-2 border-transparent hover:border-gray-300`}
              >
                <div className={`${item.color} p-6 rounded-2xl mb-6`}>
                  <Icon size={64} className="text-white" />
                </div>
                <h2 className="text-[32px] font-bold text-gray-900 mb-2">
                  {item.title}
                </h2>
                <p className="text-[20px] text-gray-600">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/admin-login")}
            className="text-[20px] text-gray-500 underline"
          >
            审核员登录入口
          </button>
        </div>
      </div>
    </div>
  );
}
