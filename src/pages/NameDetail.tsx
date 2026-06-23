import * as React from 'react'
import {
  Heart,
  GitCompare,
  FileText,
  MessageSquare,
  Users,
  BookOpen,
  Music,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/store'
import type { NameProposal, BaZiResult } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { RadarChart, type RadarDimension } from '@/components/ui/RadarChart'
import { TonePattern } from '@/components/name/TonePattern'
import { AgeDistribution } from '@/components/name/AgeDistribution'
import { cn, type WuXingElement, getWuXingColor, getWuXingName } from '@/lib/utils'

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

const mockName: NameProposal = {
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
      meanings: ['思考、虑念', '思念、怀念', '思想、思绪', '情思、意绪'],
      poetryReferences: [
        { title: '论语', author: '孔子', dynasty: '春秋', sentence: '学而不思则罔，思而不学则殆。', translation: '只读书学习而不思考问题，就会惘然无知；只空想而不读书学习，就会疑惑而不能肯定。', source: '论语·为政' },
      ],
      famousNames: ['王羲之', '李思训'],
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
      meanings: ['深潭、深水', '渊博、深远', '深邃、深沉'],
      poetryReferences: [
        { title: '诗经', author: '佚名', dynasty: '周', sentence: '鹤鸣于九皋，声闻于渊。', translation: '鹤在深泽中鸣叫，声音传到深渊。', source: '诗经·小雅·鹤鸣' },
      ],
      famousNames: ['陶渊明', '李渊'],
    },
  ],
  meaning: '取自"思若涌泉，学贯渊深"，寓意思维敏捷、学识渊博，有深邃的智慧和广阔的胸襟。思属金，渊属水，金水相生，完美补益八字喜用神。',
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
    { title: '劝学', author: '荀子', dynasty: '战国', sentence: '积水成渊，蛟龙生焉。', translation: '水流汇聚成为深渊，蛟龙就会从这里产生。比喻积累学问可以修成大器。', source: '荀子·劝学' },
  ],
  tags: ['诗意风格', '五行补益', '经典'],
}

const famousNamesList = [
  { name: '李思训', era: '唐代', title: '画家', desc: '唐代著名画家，人称"大李将军"，青绿山水画派代表。' },
  { name: '李元渊', era: '现代', title: '学者', desc: '当代著名文史学者，著作等身。' },
]

export default function NameDetail() {
  const { toggleFavorite, isFavorite, baZiResult } = useAppStore()
  const name = mockName
  const bazi = baZiResult || mockBaZi
  const favorited = isFavorite(name.id)

  const radarDimensions: RadarDimension[] = [
    { key: 'metal', label: '金', value: bazi.fiveElementsScore.metal },
    { key: 'wood', label: '木', value: bazi.fiveElementsScore.wood },
    { key: 'water', label: '水', value: bazi.fiveElementsScore.water },
    { key: 'fire', label: '火', value: bazi.fiveElementsScore.fire },
    { key: 'earth', label: '土', value: bazi.fiveElementsScore.earth },
  ]

  const handleBack = () => {
    console.log('Back to list')
  }

  const handleCompare = () => {
    console.log('Add to compare:', name.fullName)
  }

  const handleGeneratePDF = () => {
    console.log('Generate PDF report')
  }

  const handleConsultMaster = () => {
    console.log('Consult master')
  }

  return (
    <div className="min-h-screen bg-ink-50/50 pb-28">
      <div className="container max-w-4xl py-8 space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-ink-500 hover:text-jade-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>

        <Card className="overflow-hidden bg-gradient-to-br from-ink-50 via-jade-50/30 to-ink-50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <button
                    onClick={() => toggleFavorite(name.id)}
                    className={cn(
                      'p-2 rounded-full transition-all hover:scale-110',
                      favorited ? 'text-cinnabar-500' : 'text-ink-300 hover:text-cinnabar-400'
                    )}
                  >
                    <Heart className={cn('w-6 h-6', favorited && 'fill-current')} />
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {name.characters.map((c, i) => (
                      <Badge key={i} variant="wuxing" element={c.wuXing as WuXingElement} dot />
                    ))}
                    {name.tags.map((tag) => (
                      <Badge key={tag} variant="jade">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <h1 className="font-serif text-[88px] leading-none text-ink-900 tracking-widest mb-3">
                  {name.fullName}
                </h1>
                <p className="font-mono text-lg text-ink-500 mb-4">{name.pinyin}</p>
                <p className="text-ink-600 leading-relaxed max-w-xl">{name.meaning}</p>
              </div>
              <div className="flex-shrink-0">
                <ProgressRing value={name.score.overall} size={160} strokeWidth={10} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-jade-700" />
              逐字解析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {name.characters.map((char, index) => (
                <Card key={index} variant="bamboo" className="bamboo-card">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-center flex-shrink-0">
                        <div className="font-serif text-[40px] leading-none text-ink-900 mb-1">
                          {char.char}
                        </div>
                        <p className="font-mono text-sm text-ink-500">{char.pinyin.join('/')}</p>
                        <div className="mt-2">
                          <Badge variant="wuxing" element={char.wuXing as WuXingElement} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span className="text-ink-500">
                            康熙笔画：<span className="text-ink-800 font-mono">{char.kangxiStrokes}</span>
                          </span>
                          <span className="text-ink-500">
                            简体笔画：<span className="text-ink-800 font-mono">{char.simplifiedStrokes}</span>
                          </span>
                          <span className="text-ink-500">
                            部首：<span className="text-ink-800">{char.radical}</span>
                          </span>
                        </div>
                        <p className="text-sm text-ink-500 italic" style={{ fontFamily: '"FangSong", "STFangsong", serif' }}>
                          「说文解字」{char.shuoWen}
                        </p>
                        <div>
                          <div className="text-xs text-ink-400 mb-1">字义</div>
                          <ul className="space-y-1">
                            {char.meanings.map((m, i) => (
                              <li key={i} className="text-sm text-ink-700 flex items-start gap-2">
                                <span className="text-jade-600 mt-1">·</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-jade-700">
                <path d="M12 2L14.5 9.5H22L16 14.5L18.5 22L12 17.5L5.5 22L8 14.5L2 9.5H9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              五行补益
            </CardTitle>
            <CardDescription>八字五行强弱分析与名字补益</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <RadarChart dimensions={radarDimensions} size={260} />
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {(['metal', 'wood', 'water', 'fire', 'earth'] as const).map((el) => (
                    <div key={el} className="space-y-1">
                      <div
                        className="w-10 h-10 rounded-full mx-auto flex items-center justify-center font-serif text-lg font-bold"
                        style={{
                          backgroundColor: `${getWuXingColor(el)}30`,
                          color: getWuXingColor(el),
                        }}
                      >
                        {getWuXingName(el)}
                      </div>
                      <div className="font-mono text-sm text-ink-700">{bazi.fiveElementsScore[el]}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm space-y-2 pt-2 border-t border-ink-100">
                  <p className="text-ink-600">
                    <span className="text-ink-400">日主：</span>
                    <span className="font-serif font-bold text-jade-700">{bazi.dayMaster}</span>
                    <span className="text-ink-400 ml-2">（{bazi.dayMasterStrength === 'strong' ? '偏旺' : bazi.dayMasterStrength === 'weak' ? '偏弱' : '中和'}）</span>
                  </p>
                  <p className="text-ink-600">
                    <span className="text-ink-400">喜用神：</span>
                    {bazi.favorableElements.map((el, i) => (
                      <span key={i} className="inline-flex items-center gap-1 mr-1">
                        <Badge variant="wuxing" element={el as WuXingElement} />
                      </span>
                    ))}
                  </p>
                  <p className="text-ink-600">
                    <span className="text-ink-400">忌神：</span>
                    {bazi.avoidElements.map((el, i) => (
                      <span key={i} className="inline-flex items-center gap-1 mr-1">
                        <Badge variant="cinnabar">{el}</Badge>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
            <Card variant="default" className="bg-jade-50/50 border-jade-200">
              <CardContent className="p-4">
                <div className="text-sm space-y-2">
                  <div className="font-medium text-jade-800">名字补益说明</div>
                  {name.characters.map((c, i) => {
                    const isFavorable = bazi.favorableElements.includes(getWuXingName(c.wuXing as WuXingElement))
                    const isAvoid = bazi.avoidElements.includes(getWuXingName(c.wuXing as WuXingElement))
                    return (
                      <div key={i} className="flex items-start gap-2 text-ink-600">
                        <span className="font-serif text-ink-800">「{c.char}」</span>
                        <span>属</span>
                        <Badge variant="wuxing" element={c.wuXing as WuXingElement} />
                        {isFavorable && <Badge variant="jade">为喜用神 ✓</Badge>}
                        {isAvoid && <Badge variant="cinnabar">为忌神 ✗</Badge>}
                        {!isFavorable && !isAvoid && <span className="text-ink-400">（中性）</span>}
                      </div>
                    )
                  })}
                  <p className="pt-2 text-ink-700 border-t border-jade-200/50">
                    <span className="font-medium">总评：</span>
                    {name.fiveElementsNote}（匹配度 {name.fiveElementsMatch}分）
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-jade-700">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              文化考据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {name.poetryReferences.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-3">诗词典故</h4>
                <div className="space-y-3">
                  {name.poetryReferences.map((ref, i) => (
                    <Card key={i} variant="bamboo" className="bamboo-card">
                      <CardContent className="p-5">
                        <p className="font-serif text-lg text-ink-800 italic mb-3 leading-relaxed">
                          「{ref.sentence}」
                        </p>
                        <p className="text-sm text-ink-600 mb-3">{ref.translation}</p>
                        <p className="text-xs text-ink-400">
                          —— {ref.dynasty}·{ref.author}《{ref.source || ref.title}》
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {famousNamesList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-ink-700 mb-3">同名历史名人</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {famousNamesList.map((p, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-ink-200 bg-ink-50/50"
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-serif text-lg text-ink-800">{p.name}</span>
                        <Badge variant="gold">{p.era}</Badge>
                        <span className="text-sm text-ink-500">{p.title}</span>
                      </div>
                      <p className="text-sm text-ink-500">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-jade-700" />
              音律分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="text-sm text-ink-500 mb-2 text-center">平仄搭配</div>
                <TonePattern tones={name.phoneticAnalysis.tones} />
              </div>
              <div className="flex-1 w-full">
                <div className="text-sm text-ink-500 mb-2">声母韵母</div>
                <div className="overflow-hidden rounded-lg border border-ink-200">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-ink-500 font-medium">字</th>
                        {name.characters.map((c, i) => (
                          <th key={i} className="px-3 py-2 text-center font-serif text-ink-800">
                            {c.char}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-ink-100">
                        <td className="px-3 py-2 text-ink-500">声母</td>
                        {name.phoneticAnalysis.initials.map((s, i) => (
                          <td key={i} className="px-3 py-2 text-center font-mono text-ink-700">
                            {s || '-'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-ink-100">
                        <td className="px-3 py-2 text-ink-500">韵母</td>
                        {name.phoneticAnalysis.finals.map((f, i) => (
                          <td key={i} className="px-3 py-2 text-center font-mono text-ink-700">
                            {f || '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {name.phoneticAnalysis.hasBadHomophone && name.phoneticAnalysis.badHomophoneNotes.length > 0 && (
              <div className="p-4 rounded-lg border-2 border-cinnabar-300 bg-cinnabar-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-cinnabar-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-cinnabar-800 mb-1">谐音警告</div>
                    <ul className="text-sm text-cinnabar-700 space-y-1">
                      {name.phoneticAnalysis.badHomophoneNotes.map((n, i) => (
                        <li key={i}>· {n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-jade-700" />
              重名统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-jade-50 to-ink-50 border border-jade-200">
                <div className="text-sm text-ink-500 mb-1">全国重名人数</div>
                <div className="font-mono text-[48px] leading-none font-bold text-jade-800">
                  {name.duplicateRate.total.toLocaleString()}
                </div>
                <div className="text-xs text-ink-400 mt-2">约每 {Math.round(1400000000 / name.duplicateRate.total).toLocaleString()} 人中有1人</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-gold-50 to-ink-50 border border-gold-200">
                <div className="text-sm text-ink-500 mb-1">本省重名人数</div>
                <div className="font-mono text-[48px] leading-none font-bold text-gold-700">
                  {name.duplicateRate.province.toLocaleString()}
                </div>
                <div className="text-xs text-ink-400 mt-2">
                  独特性评分 {name.score.uniqueness}分
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-ink-500 mb-2">年龄分布</div>
              <AgeDistribution data={name.duplicateRate.ageDistribution} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-ink-50/95 backdrop-blur border-t border-ink-200 shadow-paper">
        <div className="container max-w-4xl py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="md"
            leftIcon={<Heart className={cn('w-4 h-4', favorited && 'fill-current')} />}
            onClick={() => toggleFavorite(name.id)}
            className={favorited ? 'text-cinnabar-600 hover:text-cinnabar-700' : ''}
          >
            {favorited ? '已收藏' : '收藏'}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<GitCompare className="w-4 h-4" />}
              onClick={handleCompare}
            >
              加入对比
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={handleGeneratePDF}
            >
              生成报告
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={handleConsultMaster}
            >
              咨询命名师
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
