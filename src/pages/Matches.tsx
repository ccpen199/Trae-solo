import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { MapPin, Building2, Briefcase, Star } from 'lucide-react'

const mockJobMatches = [
  { id: '1', title: '心内科主治医师', department: '内科', institution: '北京协和医院', location: '北京', salary: '25K-40K', matchScore: 95 },
  { id: '2', title: '内科副主任医师', department: '内科', institution: '上海瑞金医院', location: '上海', salary: '30K-50K', matchScore: 88 },
  { id: '3', title: '急诊科主治医师', department: '急诊科', institution: '深圳人民医院', location: '深圳', salary: '22K-35K', matchScore: 82 },
  { id: '4', title: '全科主治医师', department: '内科', institution: '杭州邵逸夫医院', location: '杭州', salary: '18K-30K', matchScore: 76 },
]

const mockTalentMatches = [
  { id: '1', name: '张医生', department: '内科', title: '主治医师', institution: '北京协和医院', experience: '8年', matchScore: 92 },
  { id: '2', name: '李医生', department: '内科', title: '副主任医师', institution: '上海瑞金医院', experience: '12年', matchScore: 87 },
  { id: '3', name: '王医生', department: '急诊科', title: '主治医师', institution: '广州省人民医院', experience: '6年', matchScore: 79 },
  { id: '4', name: '赵医生', department: '内科', title: '住院医师', institution: '成都华西医院', experience: '3年', matchScore: 71 },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-100 text-green-700' : score >= 80 ? 'bg-teal-100 text-teal-700' : score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'
  return (
    <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${color}`}>
      {score}%匹配
    </div>
  )
}

export default function Matches() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isTalent = user?.role === 'talent'
  const isInstitution = user?.role === 'institution'
  const [activeTab, setActiveTab] = useState<'jobs' | 'talents'>(isTalent ? 'jobs' : 'talents')

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">智能匹配</h1>

      {(isTalent || isInstitution) && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            推荐职位
          </button>
          <button
            onClick={() => setActiveTab('talents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'talents' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            推荐人才
          </button>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="grid grid-cols-2 gap-4">
          {mockJobMatches.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="bg-white border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg text-stone-800">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{job.department}</span>
                  </div>
                </div>
                <ScoreBadge score={job.matchScore} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
              </div>
              <div className="mt-2 text-amber-600 font-bold">{job.salary}</div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'talents' && (
        <div className="grid grid-cols-2 gap-4">
          {mockTalentMatches.map((talent) => (
            <div key={talent.id} className="bg-white border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-stone-800">{talent.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{talent.department}</span>
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded">{talent.title}</span>
                    </div>
                  </div>
                </div>
                <ScoreBadge score={talent.matchScore} />
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{talent.experience}经验</span>
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{talent.institution}</span>
              </div>
              {isInstitution && (
                <button className="mt-3 px-4 py-1.5 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800 transition-colors">
                  发送邀约
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
