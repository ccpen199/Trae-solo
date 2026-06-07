import { useState, useEffect } from 'react'
import { BookOpen, Video, FileQuestion, Award, CheckCircle, XCircle, Loader2, X, Play, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { format } from 'date-fns'

interface Scenario {
  id: number
  title: string
  category: string
  content: string
  difficulty: string
  video_url: string | null
  pass_score: number
  created_at: string
}

interface ScenarioDetail extends Scenario {
  stats: {
    total_attempts: number
    pass_count: number
    pass_rate: number
  }
}

interface TrainingRecord {
  id: number
  rider_id: number
  scenario_id: number
  score: number
  passed: number
  completed_at: string
  rider_name: string
  scenario_title: string
  scenario_category: string
}

interface MockQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'order_simulation', label: '订单模拟' },
  { key: 'exception_sop', label: '异常SOP' },
  { key: 'rule_exam', label: '规则考试' },
]

const categoryLabels: Record<string, string> = {
  order_simulation: '订单模拟',
  exception_sop: '异常SOP',
  rule_exam: '规则考试',
}

const categoryColors: Record<string, string> = {
  order_simulation: 'bg-blue-100 text-blue-800',
  exception_sop: 'bg-orange-100 text-orange-800',
  rule_exam: 'bg-purple-100 text-purple-800',
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function generateMockQuestions(scenario: Scenario): MockQuestion[] {
  const questions: MockQuestion[] = []
  
  if (scenario.category === 'order_simulation') {
    questions.push({
      id: 1,
      question: '到达商家后，正确的取餐流程第一步是什么？',
      options: ['直接拿走餐品', '确认订单号和餐品信息', '联系客户确认', '拍照上传即可'],
      correctAnswer: 1,
    })
    questions.push({
      id: 2,
      question: '如果商家出餐延迟，应该如何处理？',
      options: ['取消订单', '耐心等待，不做任何操作', '及时上报系统并联系客户说明情况', '催促商家快点'],
      correctAnswer: 2,
    })
    questions.push({
      id: 3,
      question: '配送途中遇到交通拥堵，最佳做法是？',
      options: ['超速行驶赶时间', '联系客户说明情况并预计延迟时间', '绕远路避开拥堵', '等待拥堵自行缓解'],
      correctAnswer: 1,
    })
  } else if (scenario.category === 'exception_sop') {
    questions.push({
      id: 1,
      question: '发现餐品撒漏时，第一时间应该做什么？',
      options: ['继续配送', '拍照留证并联系商家和客户', '直接返回商家重做', '当作没发生'],
      correctAnswer: 1,
    })
    questions.push({
      id: 2,
      question: '客户地址无法找到时，正确的处理顺序是？',
      options: ['直接取消订单', '先联系客户确认，再上报系统', '随便放在一个地方', '联系商家处理'],
      correctAnswer: 1,
    })
    questions.push({
      id: 3,
      question: '遇到恶劣天气时，最应该注意的是？',
      options: ['尽快完成配送', '安全第一，减速慢行', '多接几单', '找地方躲雨直到雨停'],
      correctAnswer: 1,
    })
    questions.push({
      id: 4,
      question: '发生交通事故后，首先应该做什么？',
      options: ['继续配送', '确保自身安全并报警', '联系客户道歉', '联系站长'],
      correctAnswer: 1,
    })
  } else {
    questions.push({
      id: 1,
      question: '骑手的标准着装要求不包括以下哪项？',
      options: ['佩戴工牌', '穿着统一工服', '佩戴头盔', '穿拖鞋'],
      correctAnswer: 3,
    })
    questions.push({
      id: 2,
      question: '虚假签到会被扣多少处罚分？',
      options: ['3分', '5分', '8分', '10分'],
      correctAnswer: 2,
    })
    questions.push({
      id: 3,
      question: '新手保护期一般是多长时间？',
      options: ['7天', '15天', '30天', '60天'],
      correctAnswer: 2,
    })
    questions.push({
      id: 4,
      question: '配送箱的清洁频率应该是？',
      options: ['每周一次', '每天一次', '每月一次', '脏了再清洁'],
      correctAnswer: 1,
    })
    questions.push({
      id: 5,
      question: '以下哪种行为属于严重违规？',
      options: ['迟到5分钟', '提前点送达', '联系客户时态度不好', '餐品撒漏'],
      correctAnswer: 1,
    })
  }
  
  return questions
}

export default function Training() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [filteredScenarios, setFilteredScenarios] = useState<Scenario[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDetail | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [examMode, setExamMode] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [mockQuestions, setMockQuestions] = useState<MockQuestion[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [scenariosData, recordsData] = await Promise.all([
          api.getScenarios(),
          api.getTrainingRecords(),
        ])
        setScenarios(scenariosData || [])
        setFilteredScenarios(scenariosData || [])
        setTrainingRecords(recordsData || [])
      } catch (error) {
        console.error('Failed to fetch training data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredScenarios(scenarios)
    } else {
      setFilteredScenarios(scenarios.filter(s => s.category === activeTab))
    }
  }, [activeTab, scenarios])

  const handleViewDetail = async (scenarioId: number) => {
    try {
      setDetailLoading(true)
      setModalOpen(true)
      setExamMode(false)
      setExamResult(null)
      const data = await api.getScenario(scenarioId)
      setSelectedScenario(data)
    } catch (error) {
      console.error('Failed to fetch scenario detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleTakeExam = async (scenario: Scenario) => {
    try {
      setDetailLoading(true)
      setModalOpen(true)
      setExamMode(true)
      setExamResult(null)
      setAnswers({})
      const data = await api.getScenario(scenario.id)
      setSelectedScenario(data)
      const questions = generateMockQuestions(scenario)
      setMockQuestions(questions)
    } catch (error) {
      console.error('Failed to start exam:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmitExam = async () => {
    if (!selectedScenario || Object.keys(answers).length !== mockQuestions.length) {
      alert('请完成所有题目')
      return
    }

    let correctCount = 0
    mockQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / mockQuestions.length) * 100)
    const passed = score >= selectedScenario.pass_score

    try {
      setSubmitting(true)
      await api.createTrainingRecord({
        rider_id: 1,
        scenario_id: selectedScenario.id,
        score,
        passed: passed ? 1 : 0,
      })

      setExamResult({ score, passed })
      
      const recordsData = await api.getTrainingRecords()
      setTrainingRecords(recordsData || [])
    } catch (error) {
      console.error('Failed to submit exam:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const totalScenarios = scenarios.length
  const totalRecords = trainingRecords.length
  const avgPassRate = trainingRecords.length > 0
    ? Math.round((trainingRecords.filter(r => r.passed === 1).length / trainingRecords.length) * 100)
    : 0

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy-MM-dd HH:mm')
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">培训知识库</h1>
        <span className="text-sm text-gray-500">
          最后更新: {new Date().toLocaleString('zh-CN')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              场景库
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总场景数</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalScenarios}</p>
            <p className="text-sm text-gray-500 mt-2">涵盖各类配送培训场景</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FileQuestion className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              培训记录
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总培训记录</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalRecords}</p>
            <p className="text-sm text-gray-500 mt-2">骑手累计培训次数</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-50 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              通过率
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">平均通过率</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{avgPassRate}%</p>
            <p className="text-sm text-gray-500 mt-2">
              {avgPassRate >= 80 ? '整体表现优秀' : avgPassRate >= 60 ? '还有提升空间' : '需要加强培训'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">培训场景</h2>
        </div>

        <div className="flex gap-2 mb-6">
          {categoryTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[scenario.category] || 'bg-gray-100 text-gray-800'}`}>
                    {categoryLabels[scenario.category] || scenario.category}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[scenario.difficulty] || difficultyColors.easy}`}>
                    {difficultyLabels[scenario.difficulty] || scenario.difficulty}
                  </span>
                </div>
                {scenario.video_url && (
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Video className="w-4 h-4 text-red-600" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{scenario.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{scenario.content}</p>

              <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">及格分数</span>
                <span className="text-sm font-bold text-blue-600">{scenario.pass_score}分</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetail(scenario.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  查看详情
                </button>
                <button
                  onClick={() => handleTakeExam(scenario)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  参加考试
                </button>
              </div>
            </div>
          ))}

          {filteredScenarios.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <BookOpen className="w-12 h-12 mb-2" />
              <p className="text-sm">暂无该分类下的培训场景</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">培训记录</h2>
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
            共 {trainingRecords.length} 条记录
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  骑手姓名
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  场景标题
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  分数
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  完成时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trainingRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <XCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">暂无培训记录</p>
                  </td>
                </tr>
              ) : (
                trainingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{record.rider_name}</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {record.scenario_title}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[record.scenario_category] || 'bg-gray-100 text-gray-800'}`}>
                        {categoryLabels[record.scenario_category] || record.scenario_category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-lg font-bold ${record.passed === 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.score}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {record.passed === 1 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          通过
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          未通过
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(record.completed_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : selectedScenario && (
              <>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[selectedScenario.category] || 'bg-gray-100 text-gray-800'}`}>
                        {categoryLabels[selectedScenario.category] || selectedScenario.category}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[selectedScenario.difficulty] || difficultyColors.easy}`}>
                        {difficultyLabels[selectedScenario.difficulty] || selectedScenario.difficulty}
                      </span>
                      {selectedScenario.video_url && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                          <Video className="w-3 h-3" />
                          视频教程
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedScenario.title}</h2>
                  </div>
                  <button
                    onClick={() => {
                      setModalOpen(false)
                      setExamMode(false)
                      setExamResult(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {!examMode ? (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">场景内容</h3>
                        <p className="text-gray-600 leading-relaxed">{selectedScenario.content}</p>
                      </div>

                      {selectedScenario.video_url && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">视频教程</h3>
                          <a
                            href={selectedScenario.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
                          >
                            <div className="p-2 bg-red-100 rounded-lg">
                              <Play className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">点击观看培训视频</p>
                              <p className="text-xs text-gray-500">{selectedScenario.video_url}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      )}

                      <div className="bg-blue-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">学习统计</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-900">{selectedScenario.stats.total_attempts}</p>
                            <p className="text-xs text-blue-700">总尝试次数</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-700">{selectedScenario.stats.pass_count}</p>
                            <p className="text-xs text-blue-700">通过次数</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-900">
                              {Math.round(selectedScenario.stats.pass_rate * 100)}%
                            </p>
                            <p className="text-xs text-blue-700">通过率</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500 mr-auto">
                          及格分数: <span className="font-bold text-blue-600">{selectedScenario.pass_score}分</span>
                        </div>
                        <button
                          onClick={() => handleTakeExam(selectedScenario)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FileQuestion className="w-4 h-4" />
                          开始考试
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {examResult ? (
                        <div className="text-center py-8">
                          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                            examResult.passed ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {examResult.passed ? (
                              <CheckCircle className="w-10 h-10 text-green-600" />
                            ) : (
                              <XCircle className="w-10 h-10 text-red-600" />
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {examResult.passed ? '恭喜通过考试！' : '考试未通过'}
                          </h3>
                          <p className="text-4xl font-bold mb-4">
                            <span className={examResult.passed ? 'text-green-600' : 'text-red-600'}>
                              {examResult.score}
                            </span>
                            <span className="text-xl text-gray-500">/{selectedScenario.pass_score}分</span>
                          </p>
                          <p className="text-gray-500 mb-6">
                            {examResult.passed 
                              ? '您已掌握该场景的相关知识' 
                              : '及格分数为' + selectedScenario.pass_score + '分，请再接再厉'}
                          </p>
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setExamMode(false)
                                setExamResult(null)
                                setAnswers({})
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              返回详情
                            </button>
                            {!examResult.passed && (
                              <button
                                onClick={() => {
                                  setExamResult(null)
                                  setAnswers({})
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                重新考试
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-yellow-800">
                              <span className="font-semibold">考试说明：</span>
                              本次考试共 {mockQuestions.length} 道题目，{selectedScenario.pass_score}分及格。
                              请认真阅读题目后选择正确答案。
                            </p>
                          </div>

                          <div className="space-y-6">
                            {mockQuestions.map((q, index) => (
                              <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                  {index + 1}. {q.question}
                                </p>
                                <div className="space-y-2">
                                  {q.options.map((option, optIndex) => (
                                    <label
                                      key={optIndex}
                                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        answers[q.id] === optIndex
                                          ? 'border-blue-500 bg-blue-50'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`question-${q.id}`}
                                        checked={answers[q.id] === optIndex}
                                        onChange={() => setAnswers({ ...answers, [q.id]: optIndex })}
                                        className="w-4 h-4 text-blue-600"
                                      />
                                      <span className="text-sm text-gray-700">{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500 mr-auto">
                              已完成: <span className="font-bold text-blue-600">
                                {Object.keys(answers).length}/{mockQuestions.length}
                              </span> 题
                            </div>
                            <button
                              onClick={() => {
                                setExamMode(false)
                                setAnswers({})
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleSubmitExam}
                              disabled={submitting || Object.keys(answers).length !== mockQuestions.length}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : null}
                              提交答卷
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
