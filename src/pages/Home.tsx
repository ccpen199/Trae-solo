import { Link } from "react-router-dom";

export default function Home() {
  const features = [
    { icon: "🎫", title: "顾客取号", desc: "快速取号，实时查看排队进度", path: "/ticket", color: "bg-blue-500" },
    { icon: "📢", title: "叫号台", desc: "呼叫下一位，处理过号和转队列", path: "/call", color: "bg-green-500" },
    { icon: "👔", title: "店长管理", desc: "门店配置、异常处理、投诉管理", path: "/manager", color: "bg-orange-500" },
    { icon: "📊", title: "数据看板", desc: "实时统计、效率分析、高峰时段", path: "/dashboard", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">门店排队叫号系统</h2>
        <p className="text-xl text-gray-600">服务业门店现场运营工具，服务顾客、前台、店长和区域运营</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <Link
            key={f.path}
            to={f.path}
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className={`w-16 h-16 ${f.color} rounded-full flex items-center justify-center text-3xl mb-4`}>
              {f.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 核心功能</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ 多门店多队列管理</li>
            <li>✓ 智能取号防重复</li>
            <li>✓ 实时叫号与过号处理</li>
            <li>✓ 异常情况处理机制</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 数据统计</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ 平均等待时长统计</li>
            <li>✓ 过号率分析</li>
            <li>✓ 窗口服务效率</li>
            <li>✓ 高峰时段识别</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔧 系统特性</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ 所有操作可追溯</li>
            <li>✓ SQLite 本地数据库</li>
            <li>✓ RESTful API 设计</li>
            <li>✓ 响应式 Web 界面</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
