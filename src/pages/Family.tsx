import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Phone,
  AlertTriangle,
  Activity,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  MoreVertical,
  X,
  QrCode,
} from "lucide-react";

interface Elderly {
  id: number;
  name: string;
  age: number;
  relation: string;
  phone: string;
  avatar: string;
  lastActive: string;
  activeToday: boolean;
  healthScore: number;
  medicationCompliance: number;
}

interface Alert {
  id: number;
  elderlyId: number;
  elderlyName: string;
  type: string;
  message: string;
  time: string;
  handled: boolean;
}

export default function Family() {
  const navigate = useNavigate();
  const [showBindModal, setShowBindModal] = useState(false);
  const [bindPhone, setBindPhone] = useState("");
  const [bindCode, setBindCode] = useState("");

  const elderlyList: Elderly[] = [
    {
      id: 1,
      name: "张爷爷",
      age: 78,
      relation: "父亲",
      phone: "138****5678",
      avatar: "👴",
      lastActive: "10分钟前",
      activeToday: true,
      healthScore: 85,
      medicationCompliance: 90,
    },
    {
      id: 2,
      name: "李奶奶",
      age: 75,
      relation: "母亲",
      phone: "139****1234",
      avatar: "👵",
      lastActive: "2小时前",
      activeToday: true,
      healthScore: 78,
      medicationCompliance: 75,
    },
  ];

  const alerts: Alert[] = [
    {
      id: 1,
      elderlyId: 1,
      elderlyName: "张爷爷",
      type: "用药异常",
      message: "降压药已逾期2小时未服用",
      time: "10:30",
      handled: false,
    },
    {
      id: 2,
      elderlyId: 2,
      elderlyName: "李奶奶",
      type: "活动异常",
      message: "今日活动量低于日常50%",
      time: "09:00",
      handled: false,
    },
    {
      id: 3,
      elderlyId: 1,
      elderlyName: "张爷爷",
      type: "健康提醒",
      message: "本周血压波动较大，建议就医",
      time: "昨天",
      handled: true,
    },
  ];

  const usageStats = [
    { label: "今日使用次数", value: "12次", icon: Activity, color: "text-blue-500" },
    { label: "本周使用天数", value: "7天", icon: Calendar, color: "text-green-500" },
    { label: "用药完成率", value: "88%", icon: CheckCircle, color: "text-orange-500" },
    { label: "平均使用时长", value: "45分钟", icon: Clock, color: "text-purple-500" },
  ];

  const handleCall = (phone: string) => {
    alert(`正在拨打: ${phone.replace(/\*/g, "0")}`);
  };

  const handleBind = () => {
    if (bindPhone && bindCode) {
      alert("绑定成功！");
      setShowBindModal(false);
      setBindPhone("");
      setBindCode("");
    }
  };

  const handleAlert = (alertId: number) => {
    alert("已处理该预警");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <ArrowLeft size={36} className="text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-[32px] font-bold text-gray-800">
            家属关怀后台
          </h1>
          <div className="w-14" />
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <Users size={32} className="text-white" />
              </div>
              <h2 className="text-[28px] font-bold text-gray-800">
                绑定的老人
              </h2>
            </div>
            <button
              onClick={() => setShowBindModal(true)}
              className="bg-purple-500 text-white text-[22px] font-bold px-6 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
            >
              <UserPlus size={28} />
              添加绑定
            </button>
          </div>

          <div className="space-y-4">
            {elderlyList.map((elderly) => (
              <div
                key={elderly.id}
                className="bg-gray-50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-[64px]">{elderly.avatar}</div>
                    <div>
                      <h3 className="text-[28px] font-bold text-gray-900">
                        {elderly.name}
                        <span className="text-[20px] text-gray-500 ml-2">
                          {elderly.age}岁 · {elderly.relation}
                        </span>
                      </h3>
                      <p className="text-[20px] text-gray-600 mt-1">
                        {elderly.phone}
                      </p>
                      <p
                        className={`text-[18px] mt-1 ${
                          elderly.activeToday
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {elderly.activeToday ? "● 今日活跃" : "○ 今日未活跃"}
                        · 最近活跃 {elderly.lastActive}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCall(elderly.phone)}
                      className="bg-green-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Phone size={36} />
                    </button>
                    <button className="bg-gray-200 text-gray-600 w-12 h-12 rounded-xl flex items-center justify-center">
                      <MoreVertical size={28} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-[18px] text-gray-500 mb-1">健康评分</p>
                    <div className="flex items-end gap-2">
                      <p className="text-[36px] font-bold text-green-500">
                        {elderly.healthScore}
                      </p>
                      <p className="text-[18px] text-gray-500 pb-1">/100</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${elderly.healthScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-[18px] text-gray-500 mb-1">
                      用药依从率
                    </p>
                    <div className="flex items-end gap-2">
                      <p className="text-[36px] font-bold text-blue-500">
                        {elderly.medicationCompliance}
                      </p>
                      <p className="text-[18px] text-gray-500 pb-1">%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{
                          width: `${elderly.medicationCompliance}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8">
          <h2 className="text-[28px] font-bold text-gray-800 mb-6">
            使用记录统计
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {usageStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 text-center"
                >
                  <Icon size={40} className={`mx-auto mb-3 ${stat.color}`} />
                  <p className="text-[32px] font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-[18px] text-gray-500 mt-1">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <h2 className="text-[28px] font-bold text-gray-800">
                异常预警
              </h2>
            </div>
            <span className="bg-red-500 text-white px-4 py-2 rounded-xl text-[20px] font-bold">
              {alerts.filter((a) => !a.handled).length} 条未处理
            </span>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl p-6 border-4 ${
                  alert.handled
                    ? "bg-gray-50 border-gray-300 opacity-60"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-4 py-1 rounded-xl text-[18px] font-bold ${
                          alert.handled
                            ? "bg-gray-200 text-gray-600"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {alert.type}
                      </span>
                      <span className="text-[20px] text-gray-500">
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-[24px] font-bold text-gray-900 mb-1">
                      {alert.elderlyName}
                    </p>
                    <p className="text-[22px] text-gray-700">
                      {alert.message}
                    </p>
                  </div>
                  {!alert.handled && (
                    <button
                      onClick={() => handleAlert(alert.id)}
                      className="bg-red-500 text-white text-[22px] font-bold px-6 py-4 rounded-xl flex items-center gap-2 active:scale-95 transition-transform ml-4"
                    >
                      <Phone size={28} />
                      一键拨打
                    </button>
                  )}
                </div>
                {alert.handled && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <span className="text-[20px] text-green-600 font-bold">
                      ✓ 已处理
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showBindModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[32px] font-bold text-gray-900">
                  绑定老人账号
                </h2>
                <button
                  onClick={() => setShowBindModal(false)}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={32} className="text-gray-600" />
                </button>
              </div>

              <div className="bg-purple-50 rounded-2xl p-6 mb-6 text-center">
                <QrCode size={80} className="mx-auto mb-4 text-purple-500" />
                <p className="text-[22px] text-gray-700">
                  请让老人在App中打开二维码，或输入老人手机号进行绑定
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    老人手机号
                  </label>
                  <input
                    type="tel"
                    value={bindPhone}
                    onChange={(e) => setBindPhone(e.target.value)}
                    placeholder="请输入老人手机号"
                    className="w-full px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[22px] font-bold text-gray-700 mb-2 block">
                    验证码
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={bindCode}
                      onChange={(e) => setBindCode(e.target.value)}
                      placeholder="请输入验证码"
                      className="flex-1 px-6 py-4 text-[22px] border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    <button className="bg-purple-100 text-purple-700 px-6 py-4 rounded-xl text-[20px] font-bold whitespace-nowrap">
                      获取验证码
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowBindModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 text-[24px] font-bold py-5 rounded-xl active:scale-98 transition-transform"
                >
                  取消
                </button>
                <button
                  onClick={handleBind}
                  className="flex-1 bg-purple-500 text-white text-[24px] font-bold py-5 rounded-xl active:scale-98 transition-transform"
                >
                  确认绑定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
