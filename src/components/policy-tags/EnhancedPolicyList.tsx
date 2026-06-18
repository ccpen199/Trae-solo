import { Search, Eye, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface ClauseTag {
  clause: string
  tag: string
}

export interface Policy {
  id: number
  title: string
  docNumber: string
  department: string
  date: string
  status: '有效' | '废止' | '草案'
  tags: string[]
  content: string
  clauseTags: ClauseTag[]
  targetCrowds: string[]
}

export const mockPolicies: Policy[] = [
  {
    id: 1,
    title: '关于2026年调整退休人员基本养老金的通知',
    docNumber: '人社部发〔2026〕1号',
    department: '人力资源和社会保障部',
    date: '2026-01-15',
    status: '有效',
    tags: ['退休人员', '养老保险', '养老待遇'],
    content: '各省、自治区、直辖市人民政府，国务院各部委、各直属机构：经党中央、国务院批准，从2026年1月1日起调整企业和机关事业单位退休人员基本养老金水平。现就有关事项通知如下：一、调整范围。2025年12月31日前已按规定办理退休手续并按月领取基本养老金的退休人员。二、调整水平。全国调整比例按照2025年退休人员月人均基本养老金的3.5%确定。各省以全国调整比例为高限，确定本省调整比例和水平。三、调整办法。采取定额调整、挂钩调整与适当倾斜相结合的办法，并实现企业和机关事业单位退休人员调整办法统一。定额调整要体现公平原则；挂钩调整要体现多缴多得、长缴多得的激励机制。四、资金来源。调整基本养老金所需资金，参加企业职工基本养老保险的从企业职工基本养老保险基金中列支，参加机关事业单位工作人员基本养老保险的从机关事业单位基本养老保险基金中列支。',
    clauseTags: [
      { clause: '第一条', tag: '调整范围' },
      { clause: '第二条', tag: '调整水平' },
      { clause: '第三条', tag: '调整办法' },
      { clause: '第四条', tag: '资金来源' },
    ],
    targetCrowds: ['退休人员', '企业职工', '机关事业单位'],
  },
  {
    id: 2,
    title: '关于完善灵活就业人员养老保险政策的通知',
    docNumber: '人社部发〔2026〕2号',
    department: '人力资源和社会保障部',
    date: '2026-02-10',
    status: '有效',
    tags: ['灵活就业人员', '养老保险'],
    content: '各省、自治区、直辖市人力资源社会保障厅（局）：为进一步完善灵活就业人员养老保险政策，保障灵活就业人员养老保险权益，现就有关事项通知如下：一、参保范围。年满16周岁以上，未达到法定退休年龄，在城镇灵活就业的人员，可以自愿参加企业职工基本养老保险。二、缴费标准。灵活就业人员参加企业职工基本养老保险的缴费基数，可在本省全口径城镇单位就业人员平均工资的60%至300%之间自主选择，缴费比例为20%。三、缴费方式。灵活就业人员可按月、按季、按半年或按年缴纳养老保险费。四、待遇计发。灵活就业人员达到法定退休年龄，累计缴费满15年的，按规定办理退休手续后，按月领取基本养老金。',
    clauseTags: [
      { clause: '第一条', tag: '参保范围' },
      { clause: '第二条', tag: '缴费标准' },
      { clause: '第三条', tag: '缴费方式' },
      { clause: '第四条', tag: '待遇计发' },
    ],
    targetCrowds: ['灵活就业', '个体工商户', '自由职业者'],
  },
  {
    id: 3,
    title: '关于做好2026年城乡居民基本医疗保险工作的通知',
    docNumber: '人社部发〔2026〕3号',
    department: '人力资源和社会保障部、国家医疗保障局',
    date: '2026-03-05',
    status: '有效',
    tags: ['城乡居民', '医疗保险'],
    content: '各省、自治区、直辖市人民政府：为做好2026年城乡居民基本医疗保险工作，现就有关事项通知如下：一、筹资标准。2026年城乡居民基本医疗保险人均财政补助标准提高30元，达到每人每年610元；个人缴费标准同步提高30元，达到每人每年350元。二、保障范围。城乡居民基本医疗保险参保人员，享受住院医疗费用报销、门诊统筹待遇、大病保险待遇。三、待遇支付。住院费用政策范围内报销比例稳定在70%左右，门诊统筹覆盖全体参保居民。四、参保缴费。2026年度城乡居民医保参保缴费期为2025年9月至12月，实行年度参保缴费制度。',
    clauseTags: [
      { clause: '第一条', tag: '筹资标准' },
      { clause: '第二条', tag: '保障范围' },
      { clause: '第三条', tag: '待遇支付' },
      { clause: '第四条', tag: '参保缴费' },
    ],
    targetCrowds: ['城乡居民', '未成年人', '老年人'],
  },
  {
    id: 4,
    title: '关于失业保险金标准调整的通知',
    docNumber: '人社部发〔2026〕4号',
    department: '人力资源和社会保障部',
    date: '2026-04-12',
    status: '有效',
    tags: ['失业保险', '失业待遇'],
    content: '各省、自治区、直辖市人力资源社会保障厅（局）：为保障失业人员基本生活，根据《失业保险条例》规定，经研究决定，现就调整失业保险金标准有关事项通知如下：一、调整对象。符合领取失业保险金条件的失业人员。二、调整标准。失业保险金标准按照低于当地最低工资标准、高于城市居民最低生活保障标准的原则，由省、自治区、直辖市人民政府确定。三、领取期限。失业人员失业前所在单位和本人按照规定累计缴费时间满1年不足5年的，领取失业保险金的期限最长为12个月。四、其他待遇。失业人员在领取失业保险金期间，可享受职业培训补贴、职业介绍补贴、基本医疗保险待遇等。',
    clauseTags: [
      { clause: '第一条', tag: '调整对象' },
      { clause: '第二条', tag: '调整标准' },
      { clause: '第三条', tag: '领取期限' },
      { clause: '第四条', tag: '其他待遇' },
    ],
    targetCrowds: ['失业人员', '企业职工'],
  },
  {
    id: 5,
    title: '关于工伤保险费率调整的指导意见',
    docNumber: '人社部发〔2026〕5号',
    department: '人力资源和社会保障部',
    date: '2026-05-08',
    status: '草案',
    tags: ['工伤保险'],
    content: '各省、自治区、直辖市人力资源社会保障厅（局）：为完善工伤保险费率形成机制，促进工伤预防，现就工伤保险费率调整提出以下指导意见：一、基准费率。根据不同行业的工伤风险程度，将行业划分为八个类别，基准费率分别控制在该行业用人单位职工工资总额的0.2%至1.9%之间。二、费率浮动。实行行业基准费率基础上的浮动费率机制，根据用人单位工伤保险费使用、工伤发生率等因素，每1至2年浮动一次。三、工伤预防。加强工伤预防工作，按规定从工伤保险基金中提取工伤预防费用，用于开展工伤预防宣传、培训等工作。四、基金管理。加强工伤保险基金预算管理，确保基金收支平衡和可持续运行。',
    clauseTags: [
      { clause: '第一条', tag: '基准费率' },
      { clause: '第二条', tag: '费率浮动' },
      { clause: '第三条', tag: '工伤预防' },
      { clause: '第四条', tag: '基金管理' },
    ],
    targetCrowds: ['工伤人员', '企业职工', '高危行业'],
  },
  {
    id: 6,
    title: '关于社保关系转移接续的补充规定',
    docNumber: '人社部发〔2025〕12号',
    department: '人力资源和社会保障部',
    date: '2025-11-20',
    status: '废止',
    tags: ['社保转移'],
    content: '（已废止）为做好城镇职工基本养老保险关系转移接续工作，现就有关问题补充规定如下：...',
    clauseTags: [
      { clause: '第一条', tag: '适用范围' },
      { clause: '第二条', tag: '转移条件' },
    ],
    targetCrowds: ['企业职工', '灵活就业'],
  },
]

const statusStyles: Record<string, string> = {
  '有效': 'bg-green-50 text-green-600 border border-green-200',
  '废止': 'bg-red-50 text-red-600 border border-red-200',
  '草案': 'bg-gray-50 text-gray-600 border border-gray-200',
}

const tagColors = [
  'bg-blue-50 text-blue-600',
  'bg-purple-50 text-purple-600',
  'bg-amber-50 text-amber-600',
  'bg-teal-50 text-teal-600',
  'bg-rose-50 text-rose-600',
]

const crowdBadgeStyles: Record<string, string> = {
  '退休人员': 'bg-orange-50 text-orange-600 border border-orange-200',
  '企业职工': 'bg-blue-50 text-blue-600 border border-blue-200',
  '机关事业单位': 'bg-purple-50 text-purple-600 border border-purple-200',
  '灵活就业': 'bg-teal-50 text-teal-600 border border-teal-200',
  '个体工商户': 'bg-amber-50 text-amber-600 border border-amber-200',
  '自由职业者': 'bg-pink-50 text-pink-600 border border-pink-200',
  '城乡居民': 'bg-green-50 text-green-600 border border-green-200',
  '未成年人': 'bg-cyan-50 text-cyan-600 border border-cyan-200',
  '老年人': 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  '失业人员': 'bg-red-50 text-red-600 border border-red-200',
  '工伤人员': 'bg-indigo-50 text-indigo-600 border border-indigo-200',
  '高危行业': 'bg-gray-100 text-gray-700 border border-gray-300',
}

interface PolicyFileListProps {
  onTagClick: (policy: Policy) => void
  onViewDetail: (policy: Policy) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  tagFilter: string
  onTagFilterChange: (v: string) => void
}

export default function EnhancedPolicyList({ onTagClick, onViewDetail, statusFilter, onStatusFilterChange, tagFilter, onTagFilterChange }: PolicyFileListProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const allTags = Array.from(new Set(mockPolicies.flatMap((p) => p.tags)))

  const filtered = mockPolicies.filter((p) => {
    if (statusFilter !== '全部' && p.status !== statusFilter) return false
    if (tagFilter && !p.tags.includes(tagFilter)) return false
    if (search && !p.title.includes(search) && !p.docNumber.includes(search)) return false
    return true
  })

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索政策文件..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5">
          <Plus size={16} />
          新增政策
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">状态：</span>
          {['全部', '有效', '废止', '草案'].map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={`px-3 py-1 rounded-full transition-colors ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">全部标签</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((policy) => {
          const isExpanded = expandedId === policy.id
          return (
            <div key={policy.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : policy.id)}>
                    {policy.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{policy.docNumber}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyles[policy.status]}`}>
                  {policy.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <span>{policy.department}</span>
                <span>·</span>
                <span>{policy.date}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {policy.targetCrowds.map((crowd) => (
                  <span
                    key={crowd}
                    className={`text-xs px-2 py-0.5 rounded-full border ${crowdBadgeStyles[crowd] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                  >
                    {crowd}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {policy.clauseTags.map((ct, idx) => (
                  <span
                    key={`${ct.clause}-${ct.tag}-${idx}`}
                    className={`text-xs px-2 py-0.5 rounded ${tagColors[idx % tagColors.length]}`}
                  >
                    [{ct.clause}]{ct.tag}
                  </span>
                ))}
              </div>

              {isExpanded && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {policy.content.length > 200 ? (
                      <>
                        {policy.content.slice(0, 200)}...
                        <button
                          onClick={() => onViewDetail(policy)}
                          className="text-primary hover:text-primary-dark ml-1"
                        >
                          展开全文
                        </button>
                      </>
                    ) : (
                      policy.content
                    )}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {policy.tags.map((tag, i) => (
                    <span key={tag} className={`text-xs px-2 py-0.5 rounded ${tagColors[i % tagColors.length]}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : policy.id)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                    title={isExpanded ? '收起' : '展开'}
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    onClick={() => onViewDetail(policy)}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors"
                    title="查看全文"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onTagClick(policy)}
                    className="px-2 py-1 text-xs rounded hover:bg-blue-50 text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                    title="AI打标签"
                  >
                    <Sparkles size={13} />
                    AI打标签
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">暂无匹配的政策文件</div>
        )}
      </div>
    </div>
  )
}
