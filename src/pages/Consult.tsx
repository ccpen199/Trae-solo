import { useState, useRef, useEffect } from "react"
import { Bot, Send, Headphones, X, CircleDot } from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"

const quickQuestions = [
  "如何办理户籍证明？",
  "无犯罪记录证明怎么开？",
  "护照办理需要什么材料？",
  "交通违法如何申诉？",
  "居住证申办流程",
]

const aiResponses: Record<string, string> = {
  "如何办理户籍证明？":
    "根据公安知识库查询，办理户籍证明需要以下材料：1. 身份证原件；2. 户口簿原件；3. 填写《户籍证明申请表》。办理流程为：携带材料前往户籍所在地派出所 → 窗口提交申请 → 审核通过后现场出具证明。办理时限为3个工作日，费用免费。您也可以通过本平台在线申办，无需跑腿。",
  "无犯罪记录证明怎么开？":
    "根据公安知识库查询，开具无犯罪记录证明需要：1. 身份证原件；2. 填写申请表；3. 1寸照片2张。办理方式有两种：① 线下办理：前往户籍所在地派出所申请，5个工作日内出具；② 线上办理：通过本平台在线提交申请，审核通过后可下载电子证明。该证明免费办理，有效期一般为6个月。",
  "护照办理需要什么材料？":
    "根据公安知识库查询，护照办理所需材料如下：1. 身份证原件；2. 户口簿原件；3. 照片回执（须在指定照相馆拍摄）；4. 填写《中国公民出入境证件申请表》。办理流程：在线预约 → 携带材料前往出入境管理大厅 → 现场采集指纹和照片 → 缴费120元 → 10个工作日内邮寄或自取。未满16周岁需监护人陪同并提交出生证明。",
  "交通违法如何申诉？":
    "根据公安知识库查询，交通违法申诉流程如下：1. 收到违法通知后，如对处罚有异议，可在60日内向作出处罚决定的公安交管部门提出申诉；2. 申诉材料包括：身份证、行驶证、申诉书及相关证据（如行车记录仪视频等）；3. 也可通过「交管12123」APP在线提交申诉；4. 交管部门将在15个工作日内作出复核决定。温馨提示：申诉期间不影响正常处理，建议先处理违法再申诉退款。",
  "居住证申办流程":
    "根据公安知识库查询，居住证申办流程为：1. 准备材料：身份证原件、居住证明（租赁合同或房产证）、就业证明或就读证明、填写申请表；2. 前往居住地派出所或社区服务中心提交申请；3. 公安机关审核（7个工作日）；4. 审核通过后领取居住证。居住证免费办理，有效期为1年，到期前30日内需办理签注延期。您也可以通过本平台在线申办。",
}

function getAIResponse(question: string): string {
  return (
    aiResponses[question] ||
    "根据公安知识库查询，您咨询的问题涉及公安业务办理，建议您携带相关证件前往就近派出所或政务大厅咨询办理。如需进一步帮助，可拨打12345政务服务热线或点击右上角「转人工客服」获取一对一服务。"
  )
}

export default function Consult() {
  const { chatMessages, addChatMessage } = useAppStore()
  const [inputValue, setInputValue] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: "", phone: "", summary: "" })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg = {
      id: `chat_${Date.now()}_user`,
      role: "user" as const,
      content: text.trim(),
      timestamp: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(/\//g, "-"),
    }
    addChatMessage(userMsg)
    setInputValue("")

    setTimeout(() => {
      const aiMsg = {
        id: `chat_${Date.now()}_ai`,
        role: "assistant" as const,
        content: getAIResponse(text.trim()),
        timestamp: new Date().toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).replace(/\//g, "-"),
      }
      addChatMessage(aiMsg)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleQuickQuestion = (question: string) => {
    sendMessage(question)
  }

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => {
      setShowModal(false)
      setFormSubmitted(false)
      setFormData({ name: "", phone: "", summary: "" })
    }, 1500)
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="card flex items-center justify-between px-5 py-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gov-blue rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-primary text-lg leading-tight">智能咨询助手</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CircleDot className="w-3 h-3 text-status-success fill-status-success" />
              <span className="text-xs text-status-success">在线</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Headphones className="w-4 h-4" />
          转人工客服
        </button>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 pb-4 space-y-4"
      >
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] ${
                msg.role === "user"
                  ? "bg-gov-blue text-white rounded-2xl rounded-br-sm"
                  : "bg-white border border-neutral-border text-primary rounded-2xl rounded-bl-sm"
              } px-4 py-3 shadow-sm`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-[11px] mt-1.5 ${
                  msg.role === "user" ? "text-white/60" : "text-neutral-slate/50"
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-3 border-t border-neutral-border bg-white">
        <div className="flex flex-wrap gap-2 px-1 pb-3">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-full border border-gov-blue/20 text-gov-blue bg-gov-blue/5 hover:bg-gov-blue/10 transition-colors duration-200"
            >
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="请输入您的问题..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md mx-4 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title text-lg">转人工客服</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setFormSubmitted(false)
                  setFormData({ name: "", phone: "", summary: "" })
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-bg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-neutral-slate" />
              </button>
            </div>

            {formSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CircleDot className="w-8 h-8 text-status-success fill-status-success" />
                </div>
                <p className="text-primary font-semibold mb-1">提交成功</p>
                <p className="text-sm text-neutral-slate">客服人员将在30分钟内与您联系，请保持电话畅通</p>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">姓名</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入您的姓名"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">联系电话</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入您的联系电话"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">问题摘要</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="请简要描述您的问题"
                    className="input-field resize-none"
                  />
                </div>
                <button type="submit" className="btn-primary w-full py-2.5">
                  提交
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
