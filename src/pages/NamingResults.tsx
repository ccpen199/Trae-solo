import * as React from 'react'
import { Search, Sparkles, ScrollText } from 'lucide-react'
import { useAppStore } from '@/store'
import type { NameProposal, BaZiResult } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { NameCard } from '@/components/name/NameCard'
import { cn, type WuXingElement } from '@/lib/utils'

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
        poetryReferences: [],
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
        poetryReferences: [],
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

type SortKey = 'overall' | 'auspiciousness' | 'uniqueness' | 'writingEase' | 'phoneticHarmony'
type FilterKey = 'all' | 'double' | 'single' | 'poetic' | 'wuxing'

const sortOptions: SelectOption[] = [
  { value: 'overall', label: '综合排序' },
  { value: 'auspiciousness', label: '吉祥度' },
  { value: 'uniqueness', label: '独特性' },
  { value: 'writingEase', label: '书写便捷' },
  { value: 'phoneticHarmony', label: '音律和谐' },
]

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'double', label: '双字名' },
  { key: 'single', label: '单字名' },
  { key: 'poetic', label: '诗意风格' },
  { key: 'wuxing', label: '五行补益' },
]

function getStrengthLabel(strength: string): string {
  const map: Record<string, string> = { strong: '偏旺', weak: '偏弱', balanced: '中和' }
  return map[strength] || strength
}

function SkeletonCard() {
  return (
    <div className="rounded-lg bg-ink-50 border border-ink-200 p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="h-12 w-40 bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
          <div className="h-4 w-28 bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
            <div className="h-4 w-3/4 bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-12 bg-ink-100 rounded-full animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
            <div className="h-5 w-12 bg-ink-100 rounded-full animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
          </div>
        </div>
        <div className="md:w-56 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
                <div className="h-3 w-6 bg-ink-100 rounded animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
              </div>
              <div className="h-2 w-full bg-ink-100 rounded-full animate-shimmer bg-gradient-to-r from-ink-100 via-ink-200 to-ink-100 bg-[length:800px_100%]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NamingResults() {
  const { baZiResult, nameProposals, isGenerating } = useAppStore()
  const [sortKey, setSortKey] = React.useState<SortKey>('overall')
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const bazi = baZiResult || mockBaZi
  const names = nameProposals.length > 0 ? nameProposals : mockNameProposals

  const filteredNames = React.useMemo(() => {
    let result = [...names]

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (n) =>
          n.fullName.includes(q) ||
          n.pinyin.toLowerCase().includes(q) ||
          n.meaning.includes(q)
      )
    }

    if (activeFilter === 'double') {
      result = result.filter((n) => n.characters.length === 2)
    } else if (activeFilter === 'single') {
      result = result.filter((n) => n.characters.length === 1)
    } else if (activeFilter === 'poetic') {
      result = result.filter((n) => n.tags.includes('诗意风格'))
    } else if (activeFilter === 'wuxing') {
      result = result.filter((n) => n.tags.includes('五行补益'))
    }

    result.sort((a, b) => {
      if (sortKey === 'overall') return b.score.overall - a.score.overall
      return b.score[sortKey] - a.score[sortKey]
    })

    return result
  }, [names, sortKey, activeFilter, searchQuery])

  const handleViewDetail = (id: string) => {
    console.log('View detail:', id)
  }

  const handleCompare = (name: NameProposal) => {
    console.log('Add to compare:', name.fullName)
  }

  return (
    <div className="min-h-screen bg-ink-50/50 py-8">
      <div className="container max-w-5xl space-y-6">
        <Card className="bg-gradient-to-br from-jade-50 to-ink-50 border-jade-200">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-jade-700 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-ink-50" />
                </div>
                <div>
                  <div className="text-sm text-ink-500 mb-0.5">八字排盘</div>
                  <div className="font-serif text-lg text-ink-900 tracking-wider">
                    {bazi.yearGanZhi} · {bazi.monthGanZhi} · {bazi.dayGanZhi} · {bazi.hourGanZhi}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm">
                  <span className="text-ink-500">日主：</span>
                  <span className="font-serif font-bold text-jade-700">{bazi.dayMaster}</span>
                  <span className="ml-2 text-ink-400">（{getStrengthLabel(bazi.dayMasterStrength)}）</span>
                </div>
                <div className="h-4 w-px bg-ink-200" />
                <div className="text-sm">
                  <span className="text-ink-500 mr-2">喜用神：</span>
                  {bazi.favorableElements.map((el, i) => (
                    <Badge key={i} variant="wuxing" element={el as WuXingElement} className="mr-1" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-56">
                <Select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  options={sortOptions}
                  label="排序方式"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="搜索名字、拼音或寓意..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setActiveFilter(opt.key)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border',
                    activeFilter === opt.key
                      ? 'bg-jade-700 text-ink-50 border-jade-700'
                      : 'bg-ink-50 text-ink-600 border-ink-200 hover:border-jade-300 hover:text-jade-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isGenerating ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredNames.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-ink-300" />
              </div>
              <h3 className="font-serif text-lg text-ink-700 mb-2">暂无符合条件的名字</h3>
              <p className="text-sm text-ink-500 max-w-sm">
                试试调整筛选条件，或重新生成更多名字方案
              </p>
              <Button className="mt-4" variant="secondary">
                重新生成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNames.map((name, index) => (
              <NameCard
                key={name.id}
                name={name}
                onViewDetail={handleViewDetail}
                onCompare={handleCompare}
                style={{ animationDelay: `${index * 80}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
