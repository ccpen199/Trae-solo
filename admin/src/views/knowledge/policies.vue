<template>
  <div class="page-container">
    <div class="policies-header">
      <div>
        <h2>政策管理</h2>
        <p class="header-sub">郑州市政策文件全生命周期管理 · 知识图谱政策节点维护</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus">新增政策</el-button>
        <el-button :icon="Upload">批量导入</el-button>
        <el-button :icon="Download" @click="handleExport">导出报表</el-button>
      </div>
    </div>

    <div class="form-filter-bar">
      <el-form :inline="true" :model="filterForm" size="default">
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="政策编号/标题" clearable style="width: 200px;" :prefix-icon="Search" />
        </el-form-item>
        <el-form-item label="政策类别">
          <el-select v-model="filterForm.category" placeholder="全部类别" clearable style="width: 150px;">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布部门">
          <el-select v-model="filterForm.department" placeholder="全部部门" clearable style="width: 150px;">
            <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="生效状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 130px;">
            <el-option label="生效" value="生效" />
            <el-option label="即将生效" value="即将生效" />
            <el-option label="已失效" value="已失效" />
            <el-option label="草稿" value="草稿" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="doSearch">查询</el-button>
          <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Document /></div>
          <div class="stat-label">政策总数</div>
          <div class="stat-value">{{ filteredData.length }}</div>
          <div class="stat-sub"><TrendCharts class="up" />全库共 {{ allPolicies.length }} 条</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><CirclePlus /></div>
          <div class="stat-label">今日新增</div>
          <div class="stat-value">3</div>
          <div class="stat-sub"><TrendCharts class="up" />较昨日 +1</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><User /></div>
          <div class="stat-label">适用人次</div>
          <div class="stat-value">{{ formatNum(2847650) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />月增 +12.3%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><DataAnalysis /></div>
          <div class="stat-label">匹配覆盖率</div>
          <div class="stat-value">87.6<span style="font-size:14px">%</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上月 +2.1%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">各部门发布政策数量对比</div>
            <el-radio-group v-model="chartMode" size="small">
              <el-radio-button label="category">按类别</el-radio-button>
              <el-radio-button label="status">按状态</el-radio-button>
            </el-radio-group>
          </div>
          <v-chart :option="stackedBarOption" style="height: 420px;" autoresize />
        </div>
      </el-col>
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">政策列表</div>
            <el-tag type="info" round>共 {{ filteredData.length }} 条</el-tag>
          </div>
          <el-table :data="pagedData" stripe row-key="id" size="default" @row-click="handleRowClick">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-panel">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="政策摘要" :span="2">{{ row.summary }}</el-descriptions-item>
                    <el-descriptions-item label="关联服务">
                      <el-tag v-for="s in row.relatedServices" :key="s" size="small" style="margin:2px 4px;" effect="plain">{{ s }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="关联问答">
                      <el-tag v-for="q in row.relatedQA" :key="q" type="info" size="small" style="margin:2px 4px;" effect="plain">{{ q }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="匹配人群标签" :span="2">
                      <el-tag v-for="t in row.matchTags" :key="t" :type="tagType(t)" size="small" round style="margin:2px 4px;">{{ t }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="版本历史" :span="2">
                      <el-timeline>
                        <el-timeline-item v-for="v in row.versions" :key="v.ver" :timestamp="v.date" placement="top" :hollow="v.ver !== row.versions.length">
                          <div style="font-size:13px;">v{{ v.ver }} - {{ v.desc }}</div>
                        </el-timeline-item>
                      </el-timeline>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="政策编号" width="140" />
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="category" label="类别" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="categoryTagType(row.category)" size="small" effect="plain">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="发布部门" width="100" show-overflow-tooltip />
            <el-table-column prop="publishDate" label="发布日期" width="110" />
            <el-table-column prop="effectDate" label="生效日期" width="110" />
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small" round effect="dark">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="标签" width="140">
              <template #default="{ row }">
                <el-tag v-for="t in row.tags.slice(0, 2)" :key="t" size="small" style="margin:2px;" effect="plain">{{ t }}</el-tag>
                <el-tag v-if="row.tags.length > 2" size="small" type="info" effect="plain">+{{ row.tags.length - 2 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="serviceCount" label="关联服务" width="80" align="center" />
            <el-table-column prop="views" label="查看量" width="90" align="center">
              <template #default="{ row }">{{ formatNum(row.views) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default>
                <el-button type="primary" link size="small">查看</el-button>
                <el-button type="warning" link size="small">编辑</el-button>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-bar">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" :total="filteredData.length" layout="total, sizes, prev, pager, next, jumper" background />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Search, RefreshRight, Plus, Upload, Download, Document, CirclePlus, User, DataAnalysis, TrendCharts } from '@element-plus/icons-vue'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const categoryOptions = ['户籍', '社保', '医保', '教育', '公积金', '住房', '税务', '就业']
const departmentOptions = ['公安局', '人社局', '医保局', '教育局', '公积金中心', '住建局', '税务局', '发改委', '民政局', '卫健委', '自然资源局', '司法局']

const filterForm = reactive({
  keyword: '',
  category: '',
  department: '',
  dateRange: null as string[] | null,
  status: ''
})

const chartMode = ref<'category' | 'status'>('category')
const currentPage = ref(1)
const pageSize = ref(10)

const categoryTagType = (c: string) => {
  const map: Record<string, string> = { '户籍': 'danger', '社保': 'primary', '医保': 'success', '教育': 'warning', '公积金': 'info', '住房': '', '税务': 'danger', '就业': 'success' }
  return map[c] || ''
}

const statusTagType = (s: string) => {
  const map: Record<string, string> = { '生效': 'success', '即将生效': 'warning', '已失效': 'info', '草稿': '' }
  return map[s] || ''
}

const tagType = (_: string) => {
  const types = ['primary', 'success', 'warning', 'info', 'danger']
  let hash = 0
  for (let i = 0; i < _.length; i++) hash = _.charCodeAt(i) + ((hash << 5) - hash)
  return types[Math.abs(hash) % types.length]
}

interface Policy {
  id: string
  title: string
  category: string
  department: string
  publishDate: string
  effectDate: string
  status: string
  tags: string[]
  serviceCount: number
  views: number
  summary: string
  relatedServices: string[]
  relatedQA: string[]
  matchTags: string[]
  versions: { ver: number; date: string; desc: string }[]
}

const allPolicies = ref<Policy[]>([
  {
    id: 'ZZ-HJ-2026-001', title: '郑州市户口登记管理实施细则', category: '户籍', department: '公安局', publishDate: '2026-01-15', effectDate: '2026-03-01', status: '生效', tags: ['落户', '户口迁移'], serviceCount: 5, views: 34280,
    summary: '规范郑州市户口登记、迁移、注销等业务流程，明确各类落户条件及所需材料清单，简化审批流程，推进户籍业务全程网办。',
    relatedServices: ['户口迁移', '新生儿落户', '居住证办理'], relatedQA: ['落户需要哪些材料？', '多久可以办完？'], matchTags: ['人才引进落户', '新生儿家庭', '购房落户者'],
    versions: [{ ver: 1, date: '2026-01-15', desc: '初始发布' }, { ver: 2, date: '2026-03-10', desc: '新增人才落户条款' }]
  },
  {
    id: 'ZZ-HJ-2026-002', title: '郑州市居住证申领管理办法', category: '户籍', department: '公安局', publishDate: '2026-02-10', effectDate: '2026-04-01', status: '生效', tags: ['居住证', '流动人口'], serviceCount: 3, views: 21560,
    summary: '明确居住证申领条件、办理流程及持证享有的公共服务权益，推动居住证电子化应用。',
    relatedServices: ['居住证申领', '居住证签注', '电子居住证'], relatedQA: ['居住证如何申领？', '居住证有什么用？'], matchTags: ['流动人口', '异地就业人员', '新市民'],
    versions: [{ ver: 1, date: '2026-02-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-HJ-2025-008', title: '郑州市人才引进落户实施办法', category: '户籍', department: '公安局', publishDate: '2025-06-20', effectDate: '2025-08-01', status: '生效', tags: ['人才', '落户优惠'], serviceCount: 4, views: 56780,
    summary: '对全日制本科及以上学历、中级及以上职称人才实行"零门槛"落户，提供一站式服务通道。',
    relatedServices: ['人才落户', '学历认证', '职称认定'], relatedQA: ['本科可以落户吗？', '需要社保记录吗？'], matchTags: ['人才引进落户', '高校毕业生', '高层次人才'],
    versions: [{ ver: 1, date: '2025-06-20', desc: '初始发布' }, { ver: 2, date: '2025-11-15', desc: '扩大人才认定范围' }]
  },
  {
    id: 'ZZ-HJ-2024-012', title: '郑州市新生儿户口登记指南', category: '户籍', department: '公安局', publishDate: '2024-09-05', effectDate: '2024-10-01', status: '已失效', tags: ['新生儿', '出生登记'], serviceCount: 2, views: 18930,
    summary: '规范新生儿户口登记流程，推动与出生医学证明、医保参保的联合办理。',
    relatedServices: ['新生儿落户', '出生证明办理'], relatedQA: ['新生儿多久内需落户？'], matchTags: ['新生儿家庭', '孕产妇'],
    versions: [{ ver: 1, date: '2024-09-05', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SB-2026-001', title: '郑州市城镇职工基本养老保险管理办法', category: '社保', department: '人社局', publishDate: '2026-01-08', effectDate: '2026-02-01', status: '生效', tags: ['养老保险', '职工'], serviceCount: 6, views: 45670,
    summary: '规范城镇职工基本养老保险参保、缴费、转移、待遇领取等全流程管理，推进社保业务跨省通办。',
    relatedServices: ['社保参保证明', '养老保险缴费查询', '社保关系转移', '退休待遇计算'], relatedQA: ['养老保险怎么转移？', '退休金怎么算？'], matchTags: ['即将退休', '在职职工', '跨省就业人员'],
    versions: [{ ver: 1, date: '2026-01-08', desc: '初始发布' }, { ver: 2, date: '2026-04-20', desc: '调整缴费基数下限' }]
  },
  {
    id: 'ZZ-SB-2026-002', title: '郑州市灵活就业人员社会保险参保办法', category: '社保', department: '人社局', publishDate: '2026-03-12', effectDate: '2026-05-01', status: '生效', tags: ['灵活就业', '参保'], serviceCount: 4, views: 38920,
    summary: '放开灵活就业人员参保户籍限制，支持新业态从业人员参加基本养老和医疗保险。',
    relatedServices: ['灵活就业参保', '社保补缴', '缴费基数申报'], relatedQA: ['灵活就业怎么交社保？', '可以补缴吗？'], matchTags: ['灵活就业人员', '个体工商户', '新业态从业者'],
    versions: [{ ver: 1, date: '2026-03-12', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SB-2026-003', title: '郑州市失业保险金申领办法', category: '社保', department: '人社局', publishDate: '2026-02-20', effectDate: '2026-04-01', status: '生效', tags: ['失业保险', '申领'], serviceCount: 3, views: 27450,
    summary: '明确失业保险金申领条件、标准及期限，简化申领流程，推进线上办理。',
    relatedServices: ['失业保险申领', '就业登记', '职业培训补贴'], relatedQA: ['失业金怎么领？', '能领多久？'], matchTags: ['失业人员', '待业青年'],
    versions: [{ ver: 1, date: '2026-02-20', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SB-2025-010', title: '郑州市工伤保险认定管理办法', category: '社保', department: '人社局', publishDate: '2025-07-18', effectDate: '2025-09-01', status: '生效', tags: ['工伤保险', '认定'], serviceCount: 3, views: 15320,
    summary: '规范工伤认定申请、调查、认定全流程，保障职工合法权益。',
    relatedServices: ['工伤认定申请', '劳动能力鉴定', '工伤待遇申领'], relatedQA: ['工伤怎么认定？'], matchTags: ['在职职工', '高风险行业人员'],
    versions: [{ ver: 1, date: '2025-07-18', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SB-2025-015', title: '郑州市社保卡申领及使用规范', category: '社保', department: '人社局', publishDate: '2025-11-05', effectDate: '2025-12-01', status: '生效', tags: ['社保卡', '电子社保卡'], serviceCount: 5, views: 42100,
    summary: '推进社保卡"一卡通"应用，扩展交通、文化、旅游等领域应用场景，加快电子社保卡普及。',
    relatedServices: ['社保卡申领', '电子社保卡', '社保卡挂失补办'], relatedQA: ['电子社保卡怎么领？'], matchTags: ['在职职工', '退休人员', '灵活就业人员'],
    versions: [{ ver: 1, date: '2025-11-05', desc: '初始发布' }, { ver: 2, date: '2026-02-01', desc: '新增交通一卡通功能' }]
  },
  {
    id: 'ZZ-YB-2026-001', title: '郑州市城乡居民基本医疗保险实施办法', category: '医保', department: '医保局', publishDate: '2026-01-20', effectDate: '2026-03-01', status: '生效', tags: ['居民医保', '参保缴费'], serviceCount: 5, views: 52340,
    summary: '明确城乡居民基本医疗保险参保范围、缴费标准、待遇享受及异地就医结算规则。',
    relatedServices: ['居民医保参保', '医保缴费', '异地就医备案', '医保报销'], relatedQA: ['居民医保多少钱？', '异地怎么报销？'], matchTags: ['城乡居民', '老年人', '未成年子女'],
    versions: [{ ver: 1, date: '2026-01-20', desc: '初始发布' }, { ver: 2, date: '2026-05-15', desc: '调整缴费标准' }]
  },
  {
    id: 'ZZ-YB-2026-002', title: '郑州市职工基本医疗保险门诊共济保障机制', category: '医保', department: '医保局', publishDate: '2026-04-08', effectDate: '2026-06-01', status: '即将生效', tags: ['门诊共济', '个人账户'], serviceCount: 4, views: 31200,
    summary: '建立职工医保门诊共济保障机制，改进个人账户计入办法，扩大门诊费用统筹基金支付范围。',
    relatedServices: ['医保个人账户查询', '门诊报销', '家庭共济绑定'], relatedQA: ['个人账户怎么变？', '门诊能报销多少？'], matchTags: ['在职职工', '退休人员', '慢性病患者'],
    versions: [{ ver: 1, date: '2026-04-08', desc: '初始发布' }]
  },
  {
    id: 'ZZ-YB-2026-003', title: '郑州市异地就医直接结算管理办法', category: '医保', department: '医保局', publishDate: '2026-02-28', effectDate: '2026-04-01', status: '生效', tags: ['异地就医', '直接结算'], serviceCount: 3, views: 28760,
    summary: '优化异地就医备案流程，扩大直接结算覆盖范围，实现跨省住院和门诊费用直接结算。',
    relatedServices: ['异地就医备案', '跨省结算查询', '转诊转院申请'], relatedQA: ['异地就医怎么备案？'], matchTags: ['异地就医需求', '随迁老人', '跨省就业人员'],
    versions: [{ ver: 1, date: '2026-02-28', desc: '初始发布' }]
  },
  {
    id: 'ZZ-YB-2025-009', title: '郑州市长期护理保险试点实施方案', category: '医保', department: '医保局', publishDate: '2025-08-22', effectDate: '2025-10-01', status: '生效', tags: ['长护险', '失能老人'], serviceCount: 3, views: 19680,
    summary: '开展长期护理保险制度试点，为重度失能人员提供基本护理保障，减轻家庭照护负担。',
    relatedServices: ['长护险申请', '失能评估', '护理机构查询'], relatedQA: ['长护险怎么申请？'], matchTags: ['失能老人家庭', '照护人员', '高龄老人'],
    versions: [{ ver: 1, date: '2025-08-22', desc: '初始发布' }]
  },
  {
    id: 'ZZ-YB-2024-015', title: '郑州市医保电子凭证推广应用方案', category: '医保', department: '医保局', publishDate: '2024-05-10', effectDate: '2024-06-01', status: '已失效', tags: ['医保电子凭证', '扫码就医'], serviceCount: 2, views: 42100,
    summary: '推进医保电子凭证激活应用，实现扫码就医购药，逐步替代实体医保卡。',
    relatedServices: ['医保电子凭证激活', '医保码扫码'], relatedQA: ['怎么激活医保电子凭证？'], matchTags: ['参保人员', '老年人'],
    versions: [{ ver: 1, date: '2024-05-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2026-001', title: '郑州市义务教育阶段入学管理办法', category: '教育', department: '教育局', publishDate: '2026-03-01', effectDate: '2026-05-01', status: '生效', tags: ['义务教育', '入学报名'], serviceCount: 4, views: 68920,
    summary: '规范义务教育阶段入学报名流程，推进网上报名、均衡派位，保障适龄儿童平等受教育权。',
    relatedServices: ['义务教育入学报名', '学区查询', '随迁子女入学'], relatedQA: ['什么时候报名？', '需要哪些材料？'], matchTags: ['学龄前儿童家长', '随迁子女家庭', '学区房业主'],
    versions: [{ ver: 1, date: '2026-03-01', desc: '初始发布' }, { ver: 2, date: '2026-05-10', desc: '优化线上报名流程' }]
  },
  {
    id: 'ZZ-JY-2026-002', title: '郑州市学前教育普惠发展实施方案', category: '教育', department: '教育局', publishDate: '2026-04-15', effectDate: '2026-06-01', status: '即将生效', tags: ['幼儿园', '普惠园'], serviceCount: 3, views: 35200,
    summary: '推进学前教育普惠性发展，扩大公办及普惠性民办幼儿园供给，降低家庭学前教育支出。',
    relatedServices: ['幼儿园报名', '普惠园查询', '幼教补贴申请'], relatedQA: ['普惠园怎么报名？'], matchTags: ['学龄前儿童家长', '二孩家庭', '三孩家庭'],
    versions: [{ ver: 1, date: '2026-04-15', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2025-008', title: '郑州市中高考加分政策管理办法', category: '教育', department: '教育局', publishDate: '2025-12-10', effectDate: '2026-01-01', status: '生效', tags: ['中高考', '加分'], serviceCount: 2, views: 47800,
    summary: '规范中高考加分项目及审核流程，逐步取消不合理加分项目，保留烈士子女等特殊加分。',
    relatedServices: ['加分资格审核', '成绩查询'], relatedQA: ['哪些情况可以加分？'], matchTags: ['中考学生家长', '高考生家长'],
    versions: [{ ver: 1, date: '2025-12-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2025-012', title: '郑州市学生资助政策体系实施办法', category: '教育', department: '教育局', publishDate: '2025-09-01', effectDate: '2025-09-01', status: '生效', tags: ['学生资助', '助学金'], serviceCount: 4, views: 21500,
    summary: '完善从学前教育到高等教育全覆盖的学生资助体系，确保家庭经济困难学生应助尽助。',
    relatedServices: ['助学金申请', '助学贷款', '困难认定'], relatedQA: ['助学金怎么申请？'], matchTags: ['困难家庭', '在校大学生', '高中生'],
    versions: [{ ver: 1, date: '2025-09-01', desc: '初始发布' }]
  },
  {
    id: 'ZZ-GJJ-2026-001', title: '郑州市住房公积金缴存管理办法', category: '公积金', department: '公积金中心', publishDate: '2026-01-10', effectDate: '2026-02-01', status: '生效', tags: ['公积金缴存', '缴存基数'], serviceCount: 5, views: 39800,
    summary: '规范住房公积金缴存基数、比例及汇缴流程，扩大灵活就业人员公积金制度覆盖面。',
    relatedServices: ['公积金开户', '缴存基数调整', '公积金补缴', '灵活就业公积金'], relatedQA: ['公积金缴存比例是多少？'], matchTags: ['在职职工', '灵活就业人员', '新入职人员'],
    versions: [{ ver: 1, date: '2026-01-10', desc: '初始发布' }, { ver: 2, date: '2026-04-01', desc: '调整缴存基数上下限' }]
  },
  {
    id: 'ZZ-GJJ-2026-002', title: '郑州市住房公积金提取管理办法', category: '公积金', department: '公积金中心', publishDate: '2026-02-15', effectDate: '2026-04-01', status: '生效', tags: ['公积金提取', '租房提取'], serviceCount: 6, views: 52100,
    summary: '优化住房公积金提取业务流程，放宽租房提取条件，提高提取额度，推进线上提取"秒到账"。',
    relatedServices: ['购房提取', '租房提取', '退休提取', '还贷提取'], relatedQA: ['租房能提多少公积金？'], matchTags: ['租房提取公积金', '首套房购买者', '退休人员'],
    versions: [{ ver: 1, date: '2026-02-15', desc: '初始发布' }]
  },
  {
    id: 'ZZ-GJJ-2026-003', title: '郑州市住房公积金个人住房贷款管理办法', category: '公积金', department: '公积金中心', publishDate: '2026-03-20', effectDate: '2026-05-01', status: '生效', tags: ['公积金贷款', '住房贷款'], serviceCount: 4, views: 44500,
    summary: '明确公积金贷款条件、额度、利率及办理流程，支持刚需和改善型住房需求。',
    relatedServices: ['公积金贷款申请', '贷款额度计算', '提前还贷'], relatedQA: ['公积金贷款额度怎么算？'], matchTags: ['首套房购买者', '改善型购房', '公积金缴存人'],
    versions: [{ ver: 1, date: '2026-03-20', desc: '初始发布' }]
  },
  {
    id: 'ZZ-GJJ-2025-011', title: '郑州市灵活就业人员住房公积金参与办法', category: '公积金', department: '公积金中心', publishDate: '2025-10-18', effectDate: '2025-12-01', status: '生效', tags: ['灵活就业', '公积金开户'], serviceCount: 3, views: 18900,
    summary: '允许灵活就业人员自愿缴存住房公积金，享有与在职职工同等提取和贷款权益。',
    relatedServices: ['灵活就业公积金开户', '灵活缴存', '灵活就业提取'], relatedQA: ['灵活就业能交公积金吗？'], matchTags: ['灵活就业人员', '个体工商户', '自由职业者'],
    versions: [{ ver: 1, date: '2025-10-18', desc: '初始发布' }]
  },
  {
    id: 'ZZ-ZF-2026-001', title: '郑州市公共租赁住房管理办法', category: '住房', department: '住建局', publishDate: '2026-01-25', effectDate: '2026-03-01', status: '生效', tags: ['公租房', '保障房'], serviceCount: 4, views: 36700,
    summary: '规范公共租赁住房申请、审核、配租及退出机制，保障住房困难家庭基本居住需求。',
    relatedServices: ['公租房申请', '保障房资格审核', '租金缴纳'], relatedQA: ['公租房怎么申请？', '租金多少？'], matchTags: ['低收入家庭', '新市民', '住房困难户'],
    versions: [{ ver: 1, date: '2026-01-25', desc: '初始发布' }]
  },
  {
    id: 'ZZ-ZF-2026-002', title: '郑州市保障性租赁住房发展实施方案', category: '住房', department: '住建局', publishDate: '2026-04-05', effectDate: '2026-06-01', status: '即将生效', tags: ['保障性租赁', '青年公寓'], serviceCount: 3, views: 28400,
    summary: '加快发展保障性租赁住房，重点解决新市民、青年人住房困难问题，推动租购并举。',
    relatedServices: ['保障性租赁申请', '青年公寓', '人才公寓'], relatedQA: ['保障性租赁住房条件？'], matchTags: ['新市民', '高校毕业生', '青年租房群体'],
    versions: [{ ver: 1, date: '2026-04-05', desc: '初始发布' }]
  },
  {
    id: 'ZZ-ZF-2025-009', title: '郑州市房屋交易合同网签备案办法', category: '住房', department: '住建局', publishDate: '2025-08-10', effectDate: '2025-10-01', status: '生效', tags: ['网签', '合同备案'], serviceCount: 3, views: 19200,
    summary: '推行房屋交易合同网签备案制度，规范二手房交易流程，防范一房多卖风险。',
    relatedServices: ['网签备案', '二手房交易', '合同查询'], relatedQA: ['网签怎么办理？'], matchTags: ['二手房买家', '卖房业主', '中介人员'],
    versions: [{ ver: 1, date: '2025-08-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-ZF-2024-020', title: '郑州市物业管理条例实施细则', category: '住房', department: '住建局', publishDate: '2024-12-01', effectDate: '2025-01-01', status: '已失效', tags: ['物业', '业主委员会'], serviceCount: 2, views: 15800,
    summary: '细化物业管理条例执行标准，明确业主委员会组建流程及物业服务企业监管要求。',
    relatedServices: ['业主委员会组建', '物业投诉'], relatedQA: ['怎么成立业委会？'], matchTags: ['业主', '物业投诉人'],
    versions: [{ ver: 1, date: '2024-12-01', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SW-2026-001', title: '郑州市个人所得税扣除标准操作指引', category: '税务', department: '税务局', publishDate: '2026-02-01', effectDate: '2026-03-01', status: '生效', tags: ['个税', '专项扣除'], serviceCount: 4, views: 58300,
    summary: '明确个人所得税专项附加扣除标准及申报操作流程，覆盖子女教育、继续教育、大病医疗、住房贷款利息、住房租金、赡养老人六项扣除。',
    relatedServices: ['个税申报', '专项附加扣除', '纳税记录开具', '汇算清缴'], relatedQA: ['专项扣除怎么申报？', '住房租金能扣多少？'], matchTags: ['在职职工', '房贷家庭', '有子女家庭'],
    versions: [{ ver: 1, date: '2026-02-01', desc: '初始发布' }, { ver: 2, date: '2026-05-01', desc: '调整赡养老人扣除标准' }]
  },
  {
    id: 'ZZ-SW-2026-002', title: '郑州市小微企业税收优惠政策汇编', category: '税务', department: '税务局', publishDate: '2026-03-15', effectDate: '2026-04-01', status: '生效', tags: ['小微企业', '减税降费'], serviceCount: 3, views: 23400,
    summary: '梳理现行小微企业增值税、所得税优惠政策，明确减免条件及申报流程。',
    relatedServices: ['税收优惠备案', '小微企业认定', '税费申报'], relatedQA: ['小微企业能减免哪些税？'], matchTags: ['小微企业主', '个体工商户', '创业者'],
    versions: [{ ver: 1, date: '2026-03-15', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SW-2025-010', title: '郑州市房产税征收管理办法', category: '税务', department: '税务局', publishDate: '2025-11-20', effectDate: '2026-01-01', status: '生效', tags: ['房产税', '征收'], serviceCount: 2, views: 14200,
    summary: '明确房产税征收范围、计税依据及纳税义务发生时间，规范免征及减征情形。',
    relatedServices: ['房产税申报', '税费计算'], relatedQA: ['哪些房产免税？'], matchTags: ['企业房产所有人', '多套房业主'],
    versions: [{ ver: 1, date: '2025-11-20', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SW-2025-014', title: '郑州市增值税留抵退税操作办法', category: '税务', department: '税务局', publishDate: '2025-06-08', effectDate: '2025-07-01', status: '已失效', tags: ['增值税', '留抵退税'], serviceCount: 2, views: 11800,
    summary: '规范增值税留抵退税申请条件及审核流程，加快退税到账速度，支持企业发展。',
    relatedServices: ['留抵退税申请', '退税进度查询'], relatedQA: ['留抵退税怎么申请？'], matchTags: ['企业纳税人', '制造业企业'],
    versions: [{ ver: 1, date: '2025-06-08', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2026-004', title: '郑州市就业困难人员认定及帮扶办法', category: '就业', department: '人社局', publishDate: '2026-02-22', effectDate: '2026-04-01', status: '生效', tags: ['就业困难', '帮扶'], serviceCount: 4, views: 18900,
    summary: '明确就业困难人员认定标准及帮扶措施，提供岗位推荐、技能培训、社保补贴等综合援助。',
    relatedServices: ['就业困难认定', '岗位推荐', '技能培训报名', '社保补贴申请'], relatedQA: ['怎么认定就业困难？'], matchTags: ['失业人员', '残疾人', '大龄就业者'],
    versions: [{ ver: 1, date: '2026-02-22', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2026-005', title: '郑州市创业担保贷款实施办法', category: '就业', department: '人社局', publishDate: '2026-03-28', effectDate: '2026-05-01', status: '生效', tags: ['创业贷款', '担保'], serviceCount: 3, views: 25600,
    summary: '为符合条件的创业者提供最高30万元创业担保贷款，给予财政贴息支持。',
    relatedServices: ['创业贷款申请', '贴息申报', '创业培训'], relatedQA: ['创业贷款最多贷多少？'], matchTags: ['创业者', '大学生创业者', '返乡创业人员'],
    versions: [{ ver: 1, date: '2026-03-28', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2026-006', title: '郑州市职业技能培训补贴管理办法', category: '就业', department: '人社局', publishDate: '2026-04-18', effectDate: '2026-06-01', status: '即将生效', tags: ['技能培训', '补贴'], serviceCount: 3, views: 16800,
    summary: '对参加职业技能培训并取得证书的人员给予培训补贴和技能提升补贴，促进高质量就业。',
    relatedServices: ['培训补贴申请', '技能等级认定', '证书查询'], relatedQA: ['培训补贴怎么领？'], matchTags: ['在职职工', '农民工', '转岗人员'],
    versions: [{ ver: 1, date: '2026-04-18', desc: '初始发布' }]
  },
  {
    id: 'ZZ-JY-2025-013', title: '郑州市高校毕业生就业创业扶持政策', category: '就业', department: '人社局', publishDate: '2025-06-15', effectDate: '2025-07-01', status: '生效', tags: ['毕业生', '就业扶持'], serviceCount: 5, views: 63200,
    summary: '为高校毕业生提供求职创业补贴、社保补贴、租房补贴及见习岗位，促进留郑就业创业。',
    relatedServices: ['求职创业补贴', '就业见习', '社保补贴', '租房补贴', '档案托管'], relatedQA: ['毕业生有哪些补贴？'], matchTags: ['高校毕业生', '应届毕业生', '留学生'],
    versions: [{ ver: 1, date: '2025-06-15', desc: '初始发布' }, { ver: 2, date: '2025-12-01', desc: '提高租房补贴标准' }]
  },
  {
    id: 'ZZ-FG-2026-001', title: '郑州市优化营商环境条例配套政策', category: '就业', department: '发改委', publishDate: '2026-01-30', effectDate: '2026-03-01', status: '生效', tags: ['营商环境', '企业服务'], serviceCount: 6, views: 31400,
    summary: '出台优化营商环境系列配套措施，简化企业开办流程，降低制度性交易成本。',
    relatedServices: ['企业开办', '经营许可办理', '信用修复'], relatedQA: ['开企业需要什么？'], matchTags: ['创业者', '企业经营者', '个体工商户'],
    versions: [{ ver: 1, date: '2026-01-30', desc: '初始发布' }]
  },
  {
    id: 'ZZ-MZ-2026-001', title: '郑州市最低生活保障审核确认办法', category: '社保', department: '民政局', publishDate: '2026-02-28', effectDate: '2026-04-01', status: '生效', tags: ['低保', '社会救助'], serviceCount: 3, views: 22300,
    summary: '规范最低生活保障申请、审核、确认流程，推进社会救助精准化、信息化。',
    relatedServices: ['低保申请', '救助金查询', '困难认定'], relatedQA: ['低保怎么申请？', '标准是多少？'], matchTags: ['低收入家庭', '困难群众', '残疾人'],
    versions: [{ ver: 1, date: '2026-02-28', desc: '初始发布' }]
  },
  {
    id: 'ZZ-MZ-2026-002', title: '郑州市高龄津贴发放管理办法', category: '社保', department: '民政局', publishDate: '2026-03-10', effectDate: '2026-05-01', status: '生效', tags: ['高龄津贴', '老年人'], serviceCount: 2, views: 27600,
    summary: '为80周岁以上老年人发放高龄津贴，实行免申即享，自动精准发放。',
    relatedServices: ['高龄津贴申领', '资格认证'], relatedQA: ['高龄津贴多少钱？'], matchTags: ['高龄老人', '80岁以上老人'],
    versions: [{ ver: 1, date: '2026-03-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-WJW-2026-001', title: '郑州市婚前医学检查及产前筛查免费项目方案', category: '医保', department: '卫健委', publishDate: '2026-03-05', effectDate: '2026-04-01', status: '生效', tags: ['婚检', '产筛'], serviceCount: 3, views: 24100,
    summary: '为符合条件的育龄夫妇提供免费婚前医学检查及产前筛查服务，降低出生缺陷发生率。',
    relatedServices: ['免费婚检预约', '产前筛查', '出生证明办理'], relatedQA: ['免费婚检怎么预约？'], matchTags: ['备孕夫妇', '孕产妇', '新婚夫妇'],
    versions: [{ ver: 1, date: '2026-03-05', desc: '初始发布' }]
  },
  {
    id: 'ZZ-ZR-2026-001', title: '郑州市不动产登记电子证照应用管理办法', category: '住房', department: '自然资源局', publishDate: '2026-04-10', effectDate: '2026-06-01', status: '即将生效', tags: ['不动产', '电子证照'], serviceCount: 3, views: 15800,
    summary: '推进不动产登记电子证照应用，实现与银行、税务等部门信息共享，减少群众跑动次数。',
    relatedServices: ['不动产登记查询', '电子证照申领', '抵押登记'], relatedQA: ['电子证照怎么领？'], matchTags: ['购房者', '不动产权利人', '抵押贷款人'],
    versions: [{ ver: 1, date: '2026-04-10', desc: '初始发布' }]
  },
  {
    id: 'ZZ-SF-2026-001', title: '郑州市法律援助申请办理指引', category: '就业', department: '司法局', publishDate: '2026-05-01', effectDate: '2026-06-01', status: '草稿', tags: ['法律援助', '维权'], serviceCount: 2, views: 8600,
    summary: '明确法律援助申请条件、范围及办理流程，为经济困难公民提供免费法律服务。',
    relatedServices: ['法律援助申请', '公益律师咨询'], relatedQA: ['什么情况可以申请法律援助？'], matchTags: ['困难群众', '农民工', '劳动者'],
    versions: [{ ver: 1, date: '2026-05-01', desc: '草案公示' }]
  },
  {
    id: 'ZZ-SB-2026-004', title: '郑州市企业职工退休审批管理办法', category: '社保', department: '人社局', publishDate: '2026-04-22', effectDate: '2026-06-01', status: '即将生效', tags: ['退休', '审批'], serviceCount: 3, views: 31200,
    summary: '规范企业职工正常退休、提前退休审批流程，推进退休"一件事"联办。',
    relatedServices: ['退休申请', '养老金测算', '退休证办理'], relatedQA: ['退休需要什么材料？'], matchTags: ['即将退休', '特殊工种人员', '病退人员'],
    versions: [{ ver: 1, date: '2026-04-22', desc: '初始发布' }]
  },
  {
    id: 'ZZ-HJ-2026-003', title: '郑州市户籍业务全程网办操作指引', category: '户籍', department: '公安局', publishDate: '2026-05-08', effectDate: '2026-06-15', status: '草稿', tags: ['户籍网办', '一网通办'], serviceCount: 3, views: 7200,
    summary: '推动户口迁移、信息变更等户籍业务全程网上办理，实现"零跑腿"办结。',
    relatedServices: ['户口迁移网办', '信息变更申请', '户籍证明开具'], relatedQA: ['哪些业务可以网办？'], matchTags: ['人才引进落户', '购房落户者', '市内迁移人员'],
    versions: [{ ver: 1, date: '2026-05-08', desc: '草案公示' }]
  }
])

const filteredData = computed(() => {
  return allPolicies.value.filter(p => {
    if (filterForm.keyword && !p.id.includes(filterForm.keyword) && !p.title.includes(filterForm.keyword)) return false
    if (filterForm.category && p.category !== filterForm.category) return false
    if (filterForm.department && p.department !== filterForm.department) return false
    if (filterForm.status && p.status !== filterForm.status) return false
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      if (p.publishDate < filterForm.dateRange[0] || p.publishDate > filterForm.dateRange[1]) return false
    }
    return true
  })
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const departmentStats = computed(() => {
  const map: Record<string, Record<string, number>> = {}
  allPolicies.value.forEach(p => {
    if (!map[p.department]) map[p.department] = {}
    if (!map[p.department][p.category]) map[p.department][p.category] = 0
    map[p.department][p.category]++
  })
  return map
})

const departmentStatusStats = computed(() => {
  const map: Record<string, Record<string, number>> = {}
  allPolicies.value.forEach(p => {
    if (!map[p.department]) map[p.department] = {}
    if (!map[p.department][p.status]) map[p.department][p.status] = 0
    map[p.department][p.status]++
  })
  return map
})

const stackedBarOption = computed(() => {
  const departments = Object.keys(chartMode.value === 'category' ? departmentStats.value : departmentStatusStats.value)
  const categories = chartMode.value === 'category' ? categoryOptions : ['生效', '即将生效', '已失效', '草稿']
  const dataSource = chartMode.value === 'category' ? departmentStats.value : departmentStatusStats.value
  const colorMap: Record<string, string> = chartMode.value === 'category'
    ? { '户籍': '#E74C3C', '社保': '#1E4FA5', '医保': '#27AE60', '教育': '#F39C12', '公积金': '#8E44AD', '住房': '#2980B9', '税务': '#16A085', '就业': '#E67E22' }
    : { '生效': '#27AE60', '即将生效': '#F39C12', '已失效': '#95A5A6', '草稿': '#1E4FA5' }

  const series = categories.filter(c => departments.some(d => dataSource[d]?.[c])).map(c => ({
    name: c,
    type: 'bar' as const,
    stack: 'total',
    barWidth: 28,
    emphasis: { focus: 'series' as const },
    itemStyle: { color: colorMap[c] },
    data: departments.map(d => dataSource[d]?.[c] || 0)
  }))

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { fontSize: 11 } },
    grid: { left: 100, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    yAxis: { type: 'category', data: departments, axisLabel: { fontSize: 11 } },
    series
  }
})

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

const doSearch = () => { currentPage.value = 1 }

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.category = ''
  filterForm.department = ''
  filterForm.dateRange = null
  filterForm.status = ''
  currentPage.value = 1
}

const handleRowClick = (_row: Policy) => {}

const handleExport = () => {}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.policies-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px 0 20px;

  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.stat-row { margin-bottom: 20px; }

.expand-panel {
  padding: 16px 20px;
  background: $border-extra-light;
  border-radius: $radius-md;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;
}
</style>
