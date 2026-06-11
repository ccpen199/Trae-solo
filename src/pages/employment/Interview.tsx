import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobList } from '@/mocks/employment'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Clock, User } from 'lucide-react'

export default function Interview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const job = jobList.find((j) => j.id === id)

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [score1, setScore1] = useState(5)
  const [score2, setScore2] = useState(5)
  const [score3, setScore3] = useState(5)
  const [comment, setComment] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  const handleEnd = () => {
    navigate('/employment')
  }

  return (
    <div className="animate-fade-in -m-6 h-[calc(100vh-4rem)] flex">
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-1 flex items-center justify-center relative">
          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="w-16 h-16 text-gray-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-600 text-lg font-medium mt-28">视频面试间</span>
          </div>
        </div>

        <div className="bg-gray-800/80 backdrop-blur px-4 py-2.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-300">
            <span className="font-medium">{job?.title ?? '岗位面试'}</span>
            <span className="text-gray-500">|</span>
            <span>{job?.interviewSlots[0]?.date} {job?.interviewSlots[0]?.time}</span>
            <span className="text-gray-500">|</span>
            <span>面试官：{job?.company} HR</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-base">{mm}:{ss}</span>
          </div>
        </div>

        <div className="bg-gray-800 px-6 py-3 flex items-center justify-center gap-4">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              micOn ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'
            }`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setCamOn(!camOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              camOn ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-red-500/80 hover:bg-red-500 text-white'
            }`}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-all">
            <Monitor className="w-5 h-5" />
          </button>
          <button
            onClick={handleEnd}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gov-border flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gov-border">
          <h3 className="gov-section-title text-sm">面试评价</h3>
        </div>

        <div className="p-4 space-y-4 flex-1">
          <div>
            <label className="text-sm font-medium text-gov-text block mb-1.5">专业能力</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={score1}
                onChange={(e) => setScore1(Number(e.target.value))}
                className="flex-1 accent-primary-500"
              />
              <span className="w-8 text-center text-sm font-bold text-primary-500">{score1}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gov-text block mb-1.5">沟通表达</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={score2}
                onChange={(e) => setScore2(Number(e.target.value))}
                className="flex-1 accent-primary-500"
              />
              <span className="w-8 text-center text-sm font-bold text-primary-500">{score2}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gov-text block mb-1.5">综合素质</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={score3}
                onChange={(e) => setScore3(Number(e.target.value))}
                className="flex-1 accent-primary-500"
              />
              <span className="w-8 text-center text-sm font-bold text-primary-500">{score3}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gov-text block mb-1.5">总体评价</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="请输入总体评价..."
              className="gov-input resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gov-border">
          <div className="bg-primary-50 rounded-lg p-3 mb-3">
            <div className="text-xs text-gov-muted">综合评分</div>
            <div className="text-2xl font-bold text-primary-500">
              {((score1 + score2 + score3) / 3).toFixed(1)}
            </div>
          </div>
          <button onClick={handleEnd} className="gov-btn-primary w-full">
            提交评价并结束
          </button>
        </div>
      </div>
    </div>
  )
}
