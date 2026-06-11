import { useState } from "react"
import {
  Lightbulb,
  Clock,
  Send,
  Eye,
  EyeOff,
  Tag,
  CheckCircle,
  MessageSquare,
} from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"
import type { Suggestion } from "@/lib/mockData"

const categories = [
  "交通管理",
  "社区安全",
  "便民服务",
  "户籍管理",
  "出入境管理",
  "其他",
]

const availableTags = [
  "红绿灯",
  "交通设施",
  "监控",
  "治安",
  "线上办理",
  "效率",
  "户口迁移",
  "流程简化",
  "信号灯",
  "路灯",
  "巡逻",
  "办证",
  "签证",
  "窗口服务",
  "网上预约",
]

const commitmentMap: Record<string, string> = {
  交通管理: "15个工作日",
  社区安全: "10个工作日",
  便民服务: "20个工作日",
  户籍管理: "15个工作日",
}

const categoryBadgeMap: Record<string, string> = {
  交通管理: "badge-info",
  社区安全: "badge-warning",
  便民服务: "badge-success",
  户籍管理: "badge-info",
  出入境管理: "badge-error",
  其他: "badge-warning",
}

export default function Suggestion() {
  const { suggestions, addSuggestion } = useAppStore()
  const [category, setCategory] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    if (!category || !content.trim()) return

    const now = new Date()
    const deadlineDate = new Date(now)
    const days = commitmentMap[category]
      ? parseInt(commitmentMap[category])
      : 15
    deadlineDate.setDate(deadlineDate.getDate() + Math.ceil(days * 1.4))

    const newSuggestion: Suggestion = {
      id: `sug${Date.now()}`,
      userId: "u_current",
      userName: "当前用户",
      category,
      tags: selectedTags,
      content: content.trim(),
      status: "submitted",
      deadline: deadlineDate.toISOString().split("T")[0],
      assignee: "待分配",
      isPublic,
      createdAt: now.toISOString().replace("T", " ").slice(0, 19),
    }

    addSuggestion(newSuggestion)
    setCategory("")
    setSelectedTags([])
    setContent("")
    setIsPublic(true)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const publicCompleted = suggestions.filter(
    (s) => s.isPublic && s.status === "completed"
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h2 className="section-title">建言献策</h2>
        <p className="text-neutral-slate mt-2 ml-3">
          为公安工作建言献策，共建平安和谐社会
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-5 h-5 text-gov-gold" />
          <h3 className="text-lg font-serif font-semibold text-primary">
            提交建言
          </h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              建言类别
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">请选择类别</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                标签选择
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-gov-blue text-white shadow-sm"
                      : "bg-gray-100 text-neutral-slate hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              建言内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="请详细描述您的建议或意见..."
              className="input-field resize-y"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary">
                是否公开
              </span>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? "bg-gov-blue" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="flex items-center gap-1 text-sm text-neutral-slate">
                {isPublic ? (
                  <Eye className="w-4 h-4 text-gov-blue" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                {isPublic ? "公开可见" : "仅自己可见"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!category || !content.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              提交建言
            </button>
            {submitted && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                提交成功！
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gov-blue" />
          <h3 className="text-lg font-serif font-semibold text-primary">
            办理时限承诺
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(commitmentMap).map(([cat, time]) => (
            <div
              key={cat}
              className="card p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-gov-blue" />
              </div>
              <span className="text-sm font-semibold text-primary">{cat}</span>
              <span className="text-lg font-bold text-gov-red">{time}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5 text-gov-blue" />
          <h3 className="text-lg font-serif font-semibold text-primary">
            公开建言结果
          </h3>
        </div>

        {publicCompleted.length === 0 ? (
          <div className="card p-8 text-center text-neutral-slate">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无公开的已办结建言</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicCompleted.map((sug) => (
              <div key={sug.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-primary">
                        {sug.content.length > 30
                          ? sug.content.slice(0, 30) + "..."
                          : sug.content}
                      </h4>
                      <span
                        className={
                          categoryBadgeMap[sug.category] || "badge-info"
                        }
                      >
                        {sug.category}
                      </span>
                    </div>

                    {sug.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {sug.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-neutral-slate"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {sug.response && (
                      <div className="bg-gov-blue/5 rounded-lg p-3 border border-gov-blue/10">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            官方回复
                          </span>
                        </div>
                        <p className="text-sm text-primary leading-relaxed">
                          {sug.response}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-neutral-slate">
                      <span>建言人：{sug.userName}</span>
                      <span>
                        办结时间：
                        {sug.completedAt
                          ? sug.completedAt.split(" ")[0]
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-green-600 shrink-0">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">已办结</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
