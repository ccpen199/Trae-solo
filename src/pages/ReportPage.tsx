import * as React from 'react'
import { useParams } from 'react-router-dom'
import { Printer, Download, ArrowLeft, BookOpen, Music, Users, Sparkles, Calendar, Baby } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RadarChart, type RadarDimension } from '@/components/ui/RadarChart'
import { ScoreBar } from '@/components/name/ScoreBar'
import { TonePattern } from '@/components/name/TonePattern'
import { AgeDistribution } from '@/components/name/AgeDistribution'
import api from '@/lib/api'
import type { NameProposal, BaZiResult } from '@/types'
import { formatDate, type WuXingElement, getWuXingColor, getWuXingName } from '@/lib/utils'

const mockBaZi: BaZiResult = {
  yearGanZhi: '甲辰',
  monthGanZhi: '庚午',
  dayGanZhi: '壬寅',
  hourGanZhi: '辛亥',
  yearNaYin: '覆灯火',
  monthNaYin: '路旁土',
  dayNaYin: '金箔金',
  hourNaYin: '钗钏金',
  fiveElementsScore: { metal: 65, wood: 82, water: 45, fire: 58, earth: 30 },
  dayMaster: '壬水',
  dayMasterStrength: 'weak',
  favorableElements: ['金', '水'],
  avoidElements: ['木', '火'],
  trueSolarTime: '2024-06-15 14:32:00',
}

const mockNameProposals: NameProposal[] = [
  {
    id: '1',
    fullName: '李思渊',
    pinyin: 'lǐ sī yuān',
    characters: [
      {
        char: '思',
        pinyin: ['sī'],
        tone: [1],
        kangxiStrokes: 9,
        simplifiedStrokes: 9,
        wuXing: 'metal',
        shuoWen: '容也。从心囟声。凡思之属皆从思。',
        radical: '心',
        meanings: ['思考', '思念', '思想', '情思'],
        poetryReferences: [
          { title: '论语', author: '孔子', dynasty: '春秋', sentence: '学而不思则罔，思而不学则殆。', translation: '只读书学习而不思考问题，就会惘然无知；只空想而不读书学习，就会疑惑而不能肯定。', source: '论语·为政' },
        ],
        famousNames: ['王羲之'],
      },
      {
        char: '渊',
        pinyin: ['yuān'],
        tone: [1],
        kangxiStrokes: 12,
        simplifiedStrokes: 11,
        wuXing: 'water',
        shuoWen: '回水也。从水，象形。左右，岸也。中象水皃。',
        radical: '氵',
        meanings: ['深水', '渊博', '深远'],
        poetryReferences: [
          { title: '诗经', author: '佚名', dynasty: '周', sentence: '鹤鸣于九皋，声闻于渊。', translation: '鹤在深泽中鸣叫，声音传到深渊。', source: '诗经·小雅·鹤鸣' },
        ],
        famousNames: ['陶渊明'],
      },
    ],
    meaning: '取自"思若涌泉，学贯渊深"，寓意思维敏捷、学识渊博，有深邃的智慧和广阔的胸襟。',
    score: { overall: 92, auspiciousness: 95, uniqueness: 82, writingEase: 88, phoneticHarmony: 90 },
    fiveElementsMatch: 95,
    fiveElementsNote: '思属金，渊属水，金水相生，完美补益八字喜用神。',
    phoneticAnalysis: {
      tones: [3, 1, 1],
      tonePattern: '仄平平',
      isHarmonious: true,
      initials: ['l', 's', 'y'],
      finals: ['i', 'i', 'uan'],
      hasBadHomophone: false,
      badHomophoneNotes: [],
      overallScore: 90,
    },
    duplicateRate: {
      total: 2856,
      province: 186,
      ageDistribution: { before60: 120, '60-70': 256, '70-80': 389, '80-90': 512, '90-00': 623, '00-10': 580, after10: 376 },
    },
    poetryReferences: [
      { title: '论语', author: '孔子', dynasty: '春秋', sentence: '学而不思则罔，思而不学则殆。', translation: '只读书学习而不思考问题，就会惘然无知而没有收获；只空想而不读书学习，就会疑惑而不能肯定。', source: '论语·为政' },
    ],
    tags: ['诗意风格', '五行补益', '经典'],
  },
  {
    id: '2',
    fullName: '李承泽',
    pinyin: 'lǐ chéng zé',
    characters: [
      {
        char: '承',
        pinyin: ['chéng'],
        tone: [2],
        kangxiStrokes: 8,
        simplifiedStrokes: 8,
        wuXing: 'metal',
        shuoWen: '奉也。受也。从手从卪从𠬞。',
        radical: '乙',
        meanings: ['承担', '继承', '承载', '承蒙'],
        poetryReferences: [],
        famousNames: ['李承乾'],
      },
      {
        char: '泽',
        pinyin: ['zé'],
        tone: [2],
        kangxiStrokes: 17,
        simplifiedStrokes: 8,
        wuXing: 'water',
        shuoWen: '光润也。从水睪声。',
        radical: '氵',
        meanings: ['恩泽', '润泽', '光泽'],
        poetryReferences: [],
        famousNames: ['毛泽东'],
      },
    ],
    meaning: '承天之佑，泽被万物。寓意继承先祖美德，广施恩泽，有容乃大。',
    score: { overall: 89, auspiciousness: 93, uniqueness: 75, writingEase: 92, phoneticHarmony: 88 },
    fiveElementsMatch: 92,
    fiveElementsNote: '承属金，泽属水，金水相生，补益八字。',
    phoneticAnalysis: {
      tones: [3, 2, 2],
      tonePattern: '仄平平',
      isHarmonious: true,
      initials: ['l', 'ch', 'z'],
      finals: ['i', 'eng', 'e'],
      hasBadHomophone: false,
      badHomophoneNotes: [],
      overallScore: 88,
    },
    duplicateRate: {
      total: 5623,
      province: 423,
      ageDistribution: { before60: 89, '60-70': 312, '70-80': 678, '80-90': 923, '90-00': 1256, '00-10': 1456, after10: 909 },
    },
    poetryReferences: [],
    tags: ['五行补益', '大气', '经典'],
  },
  {
    id: '3',
    fullName: '李书珩',
    pinyin: 'lǐ shū héng',
    characters: [
      {
        char: '书',
        pinyin: ['shū'],
        tone: [1],
        kangxiStrokes: 10,
        simplifiedStrokes: 4,
        wuXing: 'metal',
        shuoWen: '箸也。从聿者声。',
        radical: '乙',
        meanings: ['书写', '书籍', '书法', '文书'],
        poetryReferences: [],
        famousNames: ['王羲之'],
      },
      {
        char: '珩',
        pinyin: ['héng'],
        tone: [2],
        kangxiStrokes: 11,
        simplifiedStrokes: 10,
        wuXing: 'water',
        shuoWen: '佩上玉也。从玉行声。',
        radical: '王',
        meanings: ['玉佩', '美玉'],
        poetryReferences: [],
        famousNames: ['王珩'],
      },
    ],
    meaning: '书香门第，珩佩锵鸣。寓意腹有诗书气自华，如美玉般温润而有光华。',
    score: { overall: 90, auspiciousness: 91, uniqueness: 88, writingEase: 78, phoneticHarmony: 92 },
    fiveElementsMatch: 90,
    fiveElementsNote: '书属金，珩属水，金水相生。',
    phoneticAnalysis: {
      tones: [3, 1, 2],
      tonePattern: '仄平平',
      isHarmonious: true,
      initials: ['l', 'sh', 'h'],
      finals: ['i', 'u', 'eng'],
      hasBadHomophone: false,
      badHomophoneNotes: [],
      overallScore: 92,
    },
    duplicateRate: {
      total: 892,
      province: 67,
      ageDistribution: { before60: 23, '60-70': 45, '70-80': 89, '80-90': 156, '90-00': 234, '00-10': 212, after10: 133 },
    },
    poetryReferences: [
      { title: '诗经', author: '佚名', dynasty: '周', sentence: '杂佩以赠之，知子之顺之。', translation: '赠你杂佩表深情，深知你对我情意真。', source: '诗经·郑风·女曰鸡鸣' },
    ],
    tags: ['诗意风格', '独特性', '文人'],
  },
]

const babyInfo = {
  surname: '李',
  gender: '男',
  birthDate: '2024年6月15日',
  birthTime: '14:30',
  birthPlace: '北京市',
}

export default function ReportPage() {
  const { id } = useParams()
  const reportRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)

  const bazi = mockBaZi
  const names = mockNameProposals

  React.useEffect(() => {
    const loadReport = async () => {
      try {
        // 尝试加载真实数据
      } catch {
        // 使用 mock 数据
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [id])

  const radarDimensions: RadarDimension[] = [
    { key: 'metal', label: '金', value: bazi.fiveElementsScore.metal },
    { key: 'wood', label: '木', value: bazi.fiveElementsScore.wood },
    { key: 'water', label: '水', value: bazi.fiveElementsScore.water },
    { key: 'fire', label: '火', value: bazi.fiveElementsScore.fire },
    { key: 'earth', label: '土', value: bazi.fiveElementsScore.earth },
  ]

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return
    try {
      setExporting(true)
      const element = reportRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      pdf.save(`雅名轩起名报告_${names[0]?.fullName || '命名报告'}_${formatDate(new Date(), 'short')}.pdf`)
    } catch (error) {
      console.error('PDF导出失败:', error)
      alert('PDF导出失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-100 py-8">
        <div className="container max-w-4xl animate-pulse">
          <div className="h-16 w-full bg-ink-200 rounded mb-6" />
          <div className="h-[1000px] w-full bg-ink-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-100">
      <div className="sticky top-0 z-50 bg-ink-50/95 backdrop-blur border-b border-ink-200 no-print" data-no-print>
        <div className="container max-w-4xl py-3 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
            返回
          </Button>
          <div className="font-serif text-lg font-bold ink-text-gradient">雅名轩起名报告</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              打印
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportPDF}
              loading={exporting}
            >
              下载PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div
          ref={reportRef}
          className="container max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden"
          style={{ boxShadow: '0 4px 40px rgba(31, 27, 19, 0.12)' }}
        >
          <div className="p-12" style={{ minHeight: '842px' }}>
            <section className="text-center py-16 border-b border-ink-100 pb-20 mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-md bg-cinnabar-600 mb-8 border-2 border-cinnabar-500" style={{ boxShadow: '0 0 0 3px #9b2d2d, 0 4px 20px rgba(155, 45, 45, 0.3)' }}>
                <span className="font-serif text-3xl font-bold text-white" style={{ letterSpacing: '0.1em' }}>雅</span>
              </div>
              <h1 className="font-serif text-5xl font-bold ink-text-gradient mb-6 tracking-wider">雅名轩起名报告</h1>
              <div className="ink-divider w-48 mx-auto mb-8" />
              <div className="space-y-3">
                <div className="font-serif text-4xl font-bold text-ink-900 tracking-[0.3em]">{names[0]?.fullName}</div>
                <div className="font-mono text-lg text-ink-500">{names[0]?.pinyin}</div>
              </div>
              <div className="mt-8 pt-8 space-y-2 text-ink-600">
                <div className="flex items-center justify-center gap-2">
                  <Baby className="w-4 h-4 text-jade-600" />
                  <span>{babyInfo.surname}姓 · {babyInfo.gender}宝</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 text-jade-600" />
                  <span>{babyInfo.birthDate} {babyInfo.birthTime}</span>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-ink-100">
                <div className="text-sm text-ink-400">报告日期</div>
                <div className="font-serif text-lg text-ink-700">{formatDate(new Date())}</div>
              </div>
            </section>

            <section className="mb-12 print-break">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-jade-700 flex items-center justify-center text-white font-serif font-bold text-sm">壹</div>
                <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-jade-700" />
                  八字排盘
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: '年柱', ganZhi: bazi.yearGanZhi, naYin: bazi.yearNaYin },
                  { label: '月柱', ganZhi: bazi.monthGanZhi, naYin: bazi.monthNaYin },
                  { label: '日柱', ganZhi: bazi.dayGanZhi, naYin: bazi.dayNaYin },
                  { label: '时柱', ganZhi: bazi.hourGanZhi, naYin: bazi.hourNaYin },
                ].map((col, i) => (
                  <div key={i} className="text-center p-4 rounded-lg bg-gradient-to-b from-jade-50 to-ink-50 border border-jade-200">
                    <div className="text-xs text-ink-400 mb-1">{col.label}</div>
                    <div className="font-serif text-2xl font-bold text-jade-800 mb-1 tracking-wider">{col.ganZhi}</div>
                    <div className="text-xs text-ink-500">{col.naYin}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2 mb-6">
                {(['metal', 'wood', 'water', 'fire', 'earth'] as const).map((el) => (
                  <div key={el} className="text-center">
                    <div
                      className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-serif text-lg font-bold mb-1"
                      style={{
                        backgroundColor: `${getWuXingColor(el)}30`,
                        color: getWuXingColor(el),
                        border: `2px solid ${getWuXingColor(el)}`,
                      }}
                    >
                      {getWuXingName(el)}
                    </div>
                    <div className="font-mono text-sm font-bold text-ink-700">{bazi.fiveElementsScore[el]}分</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <div className="flex-shrink-0">
                  <RadarChart dimensions={radarDimensions} size={240} />
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-jade-50 border border-jade-200">
                    <span className="text-ink-500">日主：</span>
                    <span className="font-serif font-bold text-jade-700 ml-1">{bazi.dayMaster}</span>
                    <span className="text-ink-400 ml-2">（{bazi.dayMasterStrength === 'strong' ? '偏旺' : bazi.dayMasterStrength === 'weak' ? '偏弱' : '中和'}）</span>
                  </div>
                  <div className="p-3 rounded-lg bg-jade-50 border border-jade-200">
                    <span className="text-ink-500 mr-2">喜用神：</span>
                    {bazi.favorableElements.map((el, i) => (
                      <Badge key={i} variant="wuxing" element={el as WuXingElement} className="mr-1" />
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-cinnabar-50 border border-cinnabar-200">
                    <span className="text-ink-500 mr-2">忌神：</span>
                    {bazi.avoidElements.map((el, i) => (
                      <Badge key={i} variant="cinnabar" className="mr-1">
                        {el}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-ink-50 border border-ink-200">
                <div className="text-sm font-medium text-ink-700 mb-2">喜用神说明</div>
                <p className="text-sm text-ink-600 leading-relaxed">
                  此命局日主{bazi.dayMaster}生于{bazi.monthGanZhi}月，日主{bazi.dayMasterStrength === 'weak' ? '偏弱，喜生扶' : bazi.dayMasterStrength === 'strong' ? '偏旺，喜克泄' : '中和，需调和'}。
                  五行{bazi.favorableElements.join('、')}为喜用神，起名宜用属性为{bazi.favorableElements.join('、')}之字，
                  以补益八字，调和五行，达到命局平衡之效。
                </p>
              </div>
            </section>

            <section className="mb-12 print-break">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-jade-700 flex items-center justify-center text-white font-serif font-bold text-sm">贰</div>
                <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-jade-700" />
                  名字方案
                </h2>
              </div>

              <div className="space-y-8">
                {names.map((name, nameIndex) => (
                  <div key={name.id} className="p-6 rounded-xl border-2 border-ink-200 bg-gradient-to-br from-ink-50 via-white to-jade-50/30">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-ink-100">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-cinnabar-600 text-white font-serif font-bold text-sm">
                            {nameIndex + 1}
                          </span>
                          <span className="font-serif text-4xl font-bold text-ink-900 tracking-wider">{name.fullName}</span>
                          <Badge variant="gold" className="px-2.5 py-1">
                            综合 {name.score.overall}分
                          </Badge>
                        </div>
                        <div className="font-mono text-ink-500 ml-10">{name.pinyin}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white border border-ink-100">
                        <div className="text-sm font-medium text-ink-700 mb-2">名字寓意</div>
                        <p className="text-ink-600 leading-relaxed">{name.meaning}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {name.characters.map((char, charIndex) => (
                          <div key={charIndex} className="p-4 rounded-lg bg-white border border-ink-100">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="text-center flex-shrink-0">
                                <div className="font-serif text-3xl text-ink-900 mb-0.5">{char.char}</div>
                                <div className="font-mono text-xs text-ink-500">{char.pinyin.join('/')}</div>
                                <div className="mt-1">
                                  <Badge variant="wuxing" element={char.wuXing as WuXingElement} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500">
                                  <span>康熙笔画：<span className="font-mono text-ink-700">{char.kangxiStrokes}</span></span>
                                  <span>简体笔画：<span className="font-mono text-ink-700">{char.simplifiedStrokes}</span></span>
                                  <span>部首：<span className="text-ink-700">{char.radical}</span></span>
                                </div>
                                <p className="text-xs text-ink-500 italic" style={{ fontFamily: '"FangSong", "STFangsong", serif' }}>
                                  「说文」{char.shuoWen}
                                </p>
                                <div>
                                  <div className="text-xs text-ink-400 mb-1">字义</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {char.meanings.map((m, i) => (
                                      <Badge key={i} variant="default" className="text-xs">
                                        {m}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-lg bg-white border border-ink-100">
                        <div className="text-sm font-medium text-ink-700 mb-3">各项评分</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <ScoreBar label="吉祥度" value={name.score.auspiciousness} color="jade" />
                          <ScoreBar label="独特性" value={name.score.uniqueness} color="gold" />
                          <ScoreBar label="书写便捷" value={name.score.writingEase} color="cinnabar" />
                          <ScoreBar label="音律和谐" value={name.score.phoneticHarmony} color="ink" />
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-jade-50/50 border border-jade-200">
                        <div className="text-sm font-medium text-jade-800 mb-1.5">五行补益</div>
                        <p className="text-sm text-ink-600">
                          {name.fiveElementsNote}（匹配度 <span className="font-bold text-jade-700">{name.fiveElementsMatch}分</span>）
                        </p>
                      </div>

                      {name.poetryReferences.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-ink-700">诗词典故</div>
                          {name.poetryReferences.map((ref, i) => (
                            <div key={i} className="p-4 rounded-lg bg-gradient-to-r from-ink-50 to-jade-50/30 border border-ink-200">
                              <p className="font-serif text-lg text-ink-800 italic mb-2 leading-relaxed">
                                「{ref.sentence}」
                              </p>
                              <p className="text-sm text-ink-600 mb-1">{ref.translation}</p>
                              <p className="text-xs text-ink-400">—— {ref.dynasty}·{ref.author}《{ref.source || ref.title}》</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12 print-break">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-jade-700 flex items-center justify-center text-white font-serif font-bold text-sm">叁</div>
                <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
                  <Music className="w-5 h-5 text-jade-700" />
                  音律分析
                </h2>
              </div>

              {names.map((name) => (
                <div key={name.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-serif text-xl text-ink-800">{name.fullName}</span>
                    <Badge variant={name.phoneticAnalysis.isHarmonious ? 'jade' : 'default'}>
                      {name.phoneticAnalysis.isHarmonious ? '音律和谐' : '需注意'}
                    </Badge>
                  </div>
                  <div className="p-5 rounded-xl bg-white border border-ink-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="text-xs text-ink-500 mb-2 text-center">平仄搭配：{name.phoneticAnalysis.tonePattern}</div>
                        <TonePattern tones={name.phoneticAnalysis.tones} />
                      </div>
                      <div className="flex-1 w-full">
                        <div className="text-xs text-ink-500 mb-2">声韵母分析</div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-ink-50">
                              <th className="px-3 py-2 text-left text-ink-500 font-medium">字</th>
                              {name.characters.map((c, i) => (
                                <th key={i} className="px-3 py-2 text-center font-serif text-ink-800">{c.char}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-ink-100">
                              <td className="px-3 py-2 text-ink-500">声母</td>
                              {name.phoneticAnalysis.initials.map((s, i) => (
                                <td key={i} className="px-3 py-2 text-center font-mono text-ink-700">{s || '-'}</td>
                              ))}
                            </tr>
                            <tr className="border-t border-ink-100">
                              <td className="px-3 py-2 text-ink-500">韵母</td>
                              {name.phoneticAnalysis.finals.map((f, i) => (
                                <td key={i} className="px-3 py-2 text-center font-mono text-ink-700">{f || '-'}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="mb-8 print-break">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-jade-700 flex items-center justify-center text-white font-serif font-bold text-sm">肆</div>
                <h2 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-jade-700" />
                  重名统计
                </h2>
              </div>

              <div className="space-y-4">
                {names.map((name) => (
                  <div key={name.id} className="p-5 rounded-xl bg-white border border-ink-200">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-serif text-xl text-ink-800">{name.fullName}</span>
                      <Badge variant="gold">独特性 {name.score.uniqueness}分</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-jade-50 to-ink-50 border border-jade-200 text-center">
                        <div className="text-xs text-ink-500 mb-1">全国重名人数</div>
                        <div className="font-mono text-3xl font-bold text-jade-800">
                          {name.duplicateRate.total.toLocaleString()}
                        </div>
                        <div className="text-xs text-ink-400 mt-1">
                          约每 {Math.round(1400000000 / Math.max(name.duplicateRate.total, 1)).toLocaleString()} 人中有1人
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-br from-gold-50 to-ink-50 border border-gold-200 text-center">
                        <div className="text-xs text-ink-500 mb-1">本省重名人数</div>
                        <div className="font-mono text-3xl font-bold text-gold-700">
                          {name.duplicateRate.province.toLocaleString()}
                        </div>
                        <div className="text-xs text-ink-400 mt-1">
                          独特性评分 {name.score.uniqueness}分
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-500 mb-2">年龄分布</div>
                      <AgeDistribution data={name.duplicateRate.ageDistribution} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="pt-8 mt-12 border-t border-ink-200 text-center">
              <div className="ink-divider w-32 mx-auto mb-4" />
              <p className="font-serif text-ink-600 text-lg tracking-wider">雅名轩 · 文化考据 · 拒绝玄学</p>
              <p className="text-xs text-ink-400 mt-2">本报告基于传统文化与现代语言学理论生成，仅供参考</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
