import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Check,
  X,
  Eye,
  Clock,
  User,
  FileText,
  Video,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ContentItem {
  id: number;
  type: "recipe" | "article" | "video";
  title: string;
  submitter: string;
  submitTime: string;
  preview: string;
  content: string;
  ageLevel: "A" | "B" | "C";
  status: "pending" | "approved" | "rejected";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Record<number, "A" | "B" | "C">>({});

  const [contentList, setContentList] = useState<ContentItem[]>([
    {
      id: 1,
      type: "recipe",
      title: "降压养生粥制作方法",
      submitter: "李医生",
      submitTime: "2026-06-11 09:30",
      preview:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=healthy%20rice%20porridge%20with%20vegetables%20chinese%20style&image_size=square",
      content:
        "这款降压养生粥采用芹菜、洋葱、燕麦等食材，有助于降低血压，适合高血压患者日常食用。做法简单，营养丰富...",
      ageLevel: "B",
      status: "pending",
    },
    {
      id: 2,
      type: "article",
      title: "中老年人夏季养生指南",
      submitter: "王编辑",
      submitTime: "2026-06-11 10:15",
      preview:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20people%20exercising%20in%20summer%20park&image_size=square",
      content:
        "夏季养生要注意防暑降温，饮食宜清淡，多吃瓜果蔬菜，适当运动，保证充足睡眠...",
      ageLevel: "A",
      status: "pending",
    },
    {
      id: 3,
      type: "video",
      title: "简化版太极拳教学",
      submitter: "张教练",
      submitTime: "2026-06-10 14:20",
      preview:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20people%20practicing%20taiji%20in%20park&image_size=square",
      content:
        "本视频专为中老年人设计，简化了太极拳的复杂动作，适合初学者学习。每个动作都有详细讲解...",
      ageLevel: "B",
      status: "pending",
    },
    {
      id: 4,
      type: "recipe",
      title: "糖尿病患者的甜品替代方案",
      submitter: "刘营养师",
      submitTime: "2026-06-10 11:00",
      preview:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=healthy%20sugar%20free%20desserts%20for%20diabetics&image_size=square",
      content:
        "使用天然甜味剂替代精制糖，制作美味又健康的甜品，适合糖尿病患者解馋...",
      ageLevel: "C",
      status: "approved",
    },
    {
      id: 5,
      type: "article",
      title: "保健品选择误区",
      submitter: "陈教授",
      submitTime: "2026-06-09 16:45",
      preview:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=various%20health%20supplements%20bottles&image_size=square",
      content:
        "很多老年人在选择保健品时存在误区，本文详细介绍如何科学选择保健品，避免上当受骗...",
      ageLevel: "A",
      status: "rejected",
    },
  ]);

  const filteredList = contentList.filter(
    (item) => filter === "all" || item.status === filter
  );

  const handleApprove = (id: number) => {
    const level = selectedLevel[id] || "B";
    setContentList(
      contentList.map((item) =>
        item.id === id
          ? { ...item, status: "approved", ageLevel: level }
          : item
      )
    );
    setExpandedId(null);
  };

  const handleReject = (id: number) => {
    setContentList(
      contentList.map((item) =>
        item.id === id ? { ...item, status: "rejected" } : item
      )
    );
    setExpandedId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "recipe":
        return <FileText size={24} className="text-orange-500" />;
      case "article":
        return <FileText size={24} className="text-blue-500" />;
      case "video":
        return <Video size={24} className="text-purple-500" />;
      default:
        return <FileText size={24} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "recipe":
        return "食谱";
      case "article":
        return "文章";
      case "video":
        return "视频";
      default:
        return "内容";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-[18px] font-bold">
            待审核
          </span>
        );
      case "approved":
        return (
          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[18px] font-bold">
            已通过
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-[18px] font-bold">
            已驳回
          </span>
        );
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-yellow-500";
      case "C":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "A":
        return "A级 - 非常适合";
      case "B":
        return "B级 - 一般适合";
      case "C":
        return "C级 - 谨慎使用";
      default:
        return "未评级";
    }
  };

  const stats = {
    total: contentList.length,
    pending: contentList.filter((i) => i.status === "pending").length,
    approved: contentList.filter((i) => i.status === "approved").length,
    rejected: contentList.filter((i) => i.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[36px] font-bold text-gray-900">
            内容审核工作台
          </h1>
          <button
            onClick={() => navigate("/admin-login")}
            className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl text-[20px] font-bold active:scale-95 transition-transform"
          >
            <LogOut size={24} />
            退出登录
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6">
            <p className="text-[20px] text-gray-500 mb-2">全部内容</p>
            <p className="text-[40px] font-bold text-gray-900">
              {stats.total}
            </p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6">
            <p className="text-[20px] text-yellow-700 mb-2">待审核</p>
            <p className="text-[40px] font-bold text-yellow-600">
              {stats.pending}
            </p>
          </div>
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6">
            <p className="text-[20px] text-green-700 mb-2">已通过</p>
            <p className="text-[40px] font-bold text-green-600">
              {stats.approved}
            </p>
          </div>
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6">
            <p className="text-[20px] text-red-700 mb-2">已驳回</p>
            <p className="text-[40px] font-bold text-red-600">
              {stats.rejected}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-8 py-4 rounded-xl text-[22px] font-bold transition-all ${
                  filter === f
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {f === "all"
                  ? "全部"
                  : f === "pending"
                  ? "待审核"
                  : f === "approved"
                  ? "已通过"
                  : "已驳回"}
              </button>
            )
          )}
        </div>

        <div className="space-y-4">
          {filteredList.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden">
              <button
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.preview}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(item.type)}
                      <span className="text-[18px] text-gray-500">
                        {getTypeLabel(item.type)}
                      </span>
                      {getStatusBadge(item.status)}
                      <div
                        className={`flex items-center gap-2 ${getLevelColor(
                          item.ageLevel
                        )} text-white px-4 py-2 rounded-xl`}
                      >
                        <Star size={20} fill="currentColor" />
                        <span className="text-[18px] font-bold">
                          {item.ageLevel}级
                        </span>
                      </div>
                    </div>
                    <h3 className="text-[26px] font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-6 mt-2 text-[18px] text-gray-500">
                      <span className="flex items-center gap-2">
                        <User size={20} />
                        {item.submitter}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={20} />
                        {item.submitTime}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedId === item.id ? (
                  <ChevronUp size={36} className="text-gray-400" />
                ) : (
                  <ChevronDown size={36} className="text-gray-400" />
                )}
              </button>

              {expandedId === item.id && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                  <div className="flex gap-6 mb-6">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.preview}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[22px] font-bold text-gray-700 mb-3">
                        内容预览
                      </h4>
                      <p className="text-[20px] text-gray-600 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  {item.status === "pending" && (
                    <div className="bg-blue-50 rounded-2xl p-6">
                      <h4 className="text-[24px] font-bold text-gray-800 mb-4">
                        适老化等级评定
                      </h4>
                      <div className="flex gap-4 mb-6">
                        {(["A", "B", "C"] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() =>
                              setSelectedLevel({
                                ...selectedLevel,
                                [item.id]: level,
                              })
                            }
                            className={`flex-1 py-5 rounded-xl text-[22px] font-bold border-4 transition-all ${
                              (selectedLevel[item.id] || "B") === level
                                ? `${getLevelColor(level)} text-white border-transparent`
                                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Star
                                size={28}
                                fill={
                                  (selectedLevel[item.id] || "B") === level
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                              {getLevelText(level)}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex-1 bg-red-500 text-white py-5 rounded-xl text-[24px] font-bold flex items-center justify-center gap-3 active:scale-98 transition-transform"
                        >
                          <X size={32} />
                          驳回
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex-1 bg-green-500 text-white py-5 rounded-xl text-[24px] font-bold flex items-center justify-center gap-3 active:scale-98 transition-transform"
                        >
                          <Check size={32} />
                          通过
                        </button>
                      </div>
                    </div>
                  )}

                  {item.status !== "pending" && (
                    <div className="flex justify-end">
                      <button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl text-[20px] font-bold">
                        <Eye size={24} />
                        查看详情
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredList.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center">
            <p className="text-[32px] text-gray-400 mb-4">暂无内容</p>
            <p className="text-[20px] text-gray-400">当前筛选条件下没有内容</p>
          </div>
        )}
      </div>
    </div>
  );
}
