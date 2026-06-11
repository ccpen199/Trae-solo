import {
  Activity,
  AlertTriangle,
  Bell,
  Compass,
  Database,
  FileText,
  HeartPulse,
  Moon,
  Shield,
  Watch,
} from "lucide-react";
import Card from "../components/ui/Card";

const categories = [
  { title: "设备发现", desc: "手环、手表、血氧仪与通用 BLE 设备", icon: Watch, count: 12 },
  { title: "运动分类", desc: "跑步、骑行、游泳、徒步等运动健康数据", icon: Activity, count: 8 },
  { title: "睡眠分类", desc: "深睡、浅睡、REM、鼾声与环境噪声", icon: Moon, count: 6 },
  { title: "生理监测", desc: "心率、HRV、血氧、压力指数与异常趋势", icon: HeartPulse, count: 10 },
  { title: "预警规则", desc: "个性化阈值、复核、转诊和处置流程", icon: AlertTriangle, count: 5 },
  { title: "健康档案", desc: "档案导出、HIS 预约、数据授权与标准格式", icon: FileText, count: 7 },
];

const featured = [
  { name: "慢病人群监护", tag: "重点人群", icon: Shield },
  { name: "家庭成员共享", tag: "亲情看护", icon: Bell },
  { name: "医疗数据授权", tag: "合规流转", icon: Database },
];

export function Discover() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">发现分类</h1>
        <p className="text-deep-sea-200/60 mt-1">按健康场景、设备能力和数据服务分类发现功能。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-5 hover:border-vital-green-500/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-vital-green-500/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-vital-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-deep-sea-100">{item.title}</h2>
                    <span className="text-xs text-vital-green-400 bg-vital-green-500/10 rounded-full px-2 py-1">
                      {item.count} 项
                    </span>
                  </div>
                  <p className="text-sm text-deep-sea-200/60 mt-2">{item.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-vital-green-400" />
          <h2 className="text-lg font-semibold text-deep-sea-100">推荐发现</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="rounded-xl border border-vital-green-500/10 bg-deep-sea-600/30 p-4">
                <Icon className="w-6 h-6 text-vital-green-400 mb-3" />
                <p className="font-medium text-deep-sea-100">{item.name}</p>
                <p className="text-xs text-deep-sea-200/50 mt-1">{item.tag}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
