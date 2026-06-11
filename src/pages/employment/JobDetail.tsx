import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobList } from '@/mocks/employment'
import { useAppStore } from '@/store'
import { MapPin, Building2, DollarSign, Briefcase, Clock, CheckCircle, Video, Sparkles } from 'lucide-react'

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addLog = useAppStore((s) => s.addLog)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const job = jobList.find((j) => j.id === id)

  if (!job) {
    return (
      <div className="flex items-center justify-center h-96 text-gov-muted">
        岗位不存在
      </div>
    )
  }

  const handleBook = () => {
    if (selectedSlot === null) return
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    addLog(`预约视频面试：${job.title}（${job.interviewSlots[selectedSlot!]?.date} ${job.interviewSlots[selectedSlot!]?.time}）`, '就业服务')
    navigate(`/employment/interview/${job.id}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/employment')}
        className="text-sm text-primary-500 hover:text-primary-700 transition-colors"
      >
        ← 返回岗位列表
      </button>

      <div className="gov-card p-6">
        <div className="flex items-start gap-4">
          <img
            src={job.companyLogo}
            alt={job.company}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gov-text">{job.title}</h2>
            <p className="text-gov-muted mt-1 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />{job.company}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gov-muted">
              <span className="flex items-center gap-1 text-accent-500 font-bold text-lg">
                <DollarSign className="w-4 h-4" />{job.salary}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />{job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />{job.industry}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />{job.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                    job.matchedSkills.includes(tag)
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : 'bg-primary-50 text-primary-600'
                  }`}
                >
                  {job.matchedSkills.includes(tag) && '✓ '}{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="gov-card p-5 border-l-4 border-primary-400">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gov-text text-sm">智能推荐依据</h3>
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600">
            匹配度 {job.matchScore}%
          </span>
        </div>
        <ul className="space-y-2">
          {job.matchReasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gov-text">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">{idx + 1}</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.matchedSkills.map((skill) => (
            <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
              技能匹配: {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-6">
          <h3 className="gov-section-title text-base">岗位描述</h3>
          <p className="text-sm text-gov-text mt-3 ml-4 leading-relaxed">{job.description}</p>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title text-base">任职要求</h3>
          <ul className="mt-3 ml-4 space-y-2">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gov-text">
                <CheckCircle className="w-4 h-4 text-gov-success flex-shrink-0 mt-0.5" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="gov-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="gov-section-title text-base">预约面试</h3>
          {job.hasVideoInterview && (
            <button
              onClick={() => navigate(`/employment/interview/${job.id}`)}
              className="gov-btn-accent text-sm flex items-center gap-1.5"
            >
              <Video className="w-4 h-4" />
              进入视频面试间
            </button>
          )}
        </div>
        <p className="text-xs text-gov-muted mb-4 ml-4">选择面试时段，确认后可进入视频面试间进行线上面试</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-2 ml-4">
          {job.interviewSlots.map((slot, idx) => (
            <button
              key={idx}
              disabled={!slot.available}
              onClick={() => slot.available && setSelectedSlot(idx)}
              className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                !slot.available
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : selectedSlot === idx
                    ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                    : 'bg-white border-gov-border text-gov-text hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="text-sm font-medium">{slot.date}</div>
              <div className={`text-xs mt-1 ${selectedSlot === idx ? 'text-white/80' : 'text-gov-muted'}`}>
                {slot.time}
              </div>
              {!slot.available && (
                <div className="text-xs mt-1 text-gray-400">已约满</div>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 ml-4 flex items-center gap-4">
          <button
            onClick={handleBook}
            disabled={selectedSlot === null}
            className={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              selectedSlot !== null
                ? 'gov-btn-accent'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            预约面试
          </button>
          {selectedSlot !== null && job.hasVideoInterview && (
            <span className="text-xs text-gov-muted flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-accent-500" />
              预约确认后可直接进入视频面试间
            </span>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-elevated p-6 w-full max-w-md mx-4 animate-fade-in">
            <h3 className="text-lg font-bold text-gov-text">确认预约</h3>
            <p className="text-sm text-gov-muted mt-3">
              您即将预约 <span className="font-medium text-gov-text">{job.title}</span> 的视频面试
            </p>
            <p className="text-sm text-gov-muted mt-1">
              面试时间：<span className="font-medium text-gov-text">
                {job.interviewSlots[selectedSlot!]?.date} {job.interviewSlots[selectedSlot!]?.time}
              </span>
            </p>
            {job.hasVideoInterview && (
              <div className="mt-3 bg-accent-50 border border-accent-200 rounded-lg p-3 text-xs text-accent-700 flex items-center gap-2">
                <Video className="w-4 h-4 flex-shrink-0" />
                确认后将直接进入视频面试间，请确保网络和摄像头正常
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="gov-btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="gov-btn-accent flex-1"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
