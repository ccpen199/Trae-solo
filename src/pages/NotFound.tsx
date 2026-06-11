import { useNavigate } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 p-6 flex items-center justify-center">
      <div className="max-w-lg w-full text-center">
        <div className="text-[120px] font-bold text-blue-500 mb-4">404</div>
        <div className="mb-8">
          <Search size={80} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-[36px] font-bold text-gray-800 mb-4">
            页面走丢了
          </h1>
          <p className="text-[24px] text-gray-600">
            您访问的页面不存在或已被移除
          </p>
          <p className="text-[20px] text-gray-500 mt-2">
            别担心，让我们带您回到首页
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-500 text-white text-[28px] font-bold py-8 rounded-2xl flex items-center justify-center gap-4 active:scale-98 transition-transform shadow-lg"
          >
            <Home size={48} />
            返回首页
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/weather")}
              className="bg-orange-100 text-orange-700 text-[22px] font-bold py-5 rounded-xl active:scale-95 transition-transform"
            >
              查看天气
            </button>
            <button
              onClick={() => navigate("/calendar")}
              className="bg-red-100 text-red-700 text-[22px] font-bold py-5 rounded-xl active:scale-95 transition-transform"
            >
              查看黄历
            </button>
            <button
              onClick={() => navigate("/health")}
              className="bg-green-100 text-green-700 text-[22px] font-bold py-5 rounded-xl active:scale-95 transition-transform"
            >
              健康知识
            </button>
            <button
              onClick={() => navigate("/family")}
              className="bg-purple-100 text-purple-700 text-[22px] font-bold py-5 rounded-xl active:scale-95 transition-transform"
            >
              家属后台
            </button>
          </div>
        </div>

        <p className="text-[18px] text-gray-400 mt-8">
          银发数字生活工作台 · 让数字生活更简单
        </p>
      </div>
    </div>
  );
}
