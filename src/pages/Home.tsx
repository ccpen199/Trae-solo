import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, Scissors, Baby, HeartPulse, Siren, Pill, Scan, Microscope, MapPin, Building2, Users, ArrowRight, TrendingUp, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

const hotDepartments = [
  { id: '1', name: '内科', icon: Heart, count: 128 },
  { id: '2', name: '外科', icon: Scissors, count: 96 },
  { id: '3', name: '儿科', icon: Baby, count: 72 },
  { id: '4', name: '妇产科', icon: HeartPulse, count: 64 },
  { id: '5', name: '急诊科', icon: Siren, count: 85 },
  { id: '6', name: '药学', icon: Pill, count: 53 },
  { id: '7', name: '影像科', icon: Scan, count: 41 },
  { id: '8', name: '检验科', icon: Microscope, count: 37 },
]

interface JobItem {
  id: string
  title: string
  department: string
  institution_name: string
  location: string
  salary_min: number
  salary_max: number
  required_title: string
}

interface PostItem {
  id: string
  title: string
  category: string
  likes: number
  comments: number
}

interface OverviewStats {
  totalJobs?: number
  totalInstitutions?: number
  totalTalents?: number
  [key: string]: any
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

const categoryMap: Record<string, string> = {
  policy: '政策解读',
  education: '继续教育',
  news: '行业动态',
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [latestJobs, setLatestJobs] = useState<JobItem[]>([])
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([])
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [jobsRes, postsRes, dashRes] = await Promise.allSettled([
          apiFetch('/jobs?page=1&pageSize=6'),
          apiFetch('/community/posts?page=1&pageSize=3'),
          apiFetch('/admin/dashboard'),
        ])
        if (jobsRes.status === 'fulfilled' && jobsRes.value.success) {
          setLatestJobs(jobsRes.value.data.items || [])
        }
        if (postsRes.status === 'fulfilled' && postsRes.value.success) {
          setCommunityPosts(postsRes.value.data.items || [])
        }
        if (dashRes.status === 'fulfilled' && dashRes.value.success) {
          setOverview(dashRes.value.data.overview || {})
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = () => {
    navigate(`/jobs?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl font-bold mb-4">医疗人才 · 精准匹配</h1>
          <p className="text-teal-100 text-lg mb-8">连接优质医疗机构与持证医疗人才，让招聘更专业</p>
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索职位、科室、机构..."
              className="w-full h-14 pl-5 pr-14 rounded-xl text-stone-800 text-lg focus:ring-4 focus:ring-teal-300/50"
            />
            <button onClick={handleSearch} className="absolute right-2 top-2 h-10 w-10 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {['内科', '外科', '北京', '上海'].map((tag) => (
              <button key={tag} onClick={() => navigate(`/jobs?q=${tag}`)} className="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-sm transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold mb-6">热门科室</h2>
        <div className="grid grid-cols-4 gap-4">
          {hotDepartments.map((dept) => {
            const Icon = dept.icon
            return (
              <Link
                key={dept.id}
                to={`/jobs?department=${dept.name}`}
                className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <div className="font-medium text-stone-800">{dept.name}</div>
                  <div className="text-sm text-stone-500">{dept.count}个在招</div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">最新职位</h2>
            <Link to="/jobs" className="text-teal-700 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center text-stone-500 py-8">加载中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {latestJobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-stone-800">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{job.department}</span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded">{job.required_title}</span>
                      </div>
                    </div>
                    <span className="text-amber-600 font-bold text-lg whitespace-nowrap">{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalJobs || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" /> 在招岗位
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalInstitutions || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5" /> 注册机构
              </div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">{overview ? formatNumber(overview.totalTalents || 0) : '—'}</div>
              <div className="text-teal-200 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" /> 医疗人才
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">行业资讯</h2>
          <Link to="/community" className="text-teal-700 hover:text-teal-800 text-sm font-medium flex items-center gap-1">
            更多资讯 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-stone-500 py-8">加载中...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {communityPosts.map((post) => (
              <Link key={post.id} to={`/community/${post.id}`} className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">#{categoryMap[post.category] || post.category}</span>
                <h3 className="font-medium mt-3 text-stone-800 line-clamp-2">{post.title}</h3>
                <div className="flex items-center gap-4 mt-3 text-sm text-stone-400">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.likes}</span>
                  <span>{post.comments} 评论</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
