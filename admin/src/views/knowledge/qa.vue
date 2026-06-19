<template>
  <div class="qa-container">
    <div class="qa-header">
      <div>
        <h2>政务问答库管理</h2>
        <p class="header-sub">知识运维 · 智能问答数据管理与发布</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增问答</el-button>
        <el-button :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="搜索问题内容..." :prefix-icon="Search" clearable style="width: 240px;" />
      <el-select v-model="filters.category" placeholder="问题类别" clearable style="width: 140px;">
        <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
        <el-option label="已发布" value="已发布" />
        <el-option label="草稿" value="草稿" />
        <el-option label="待审核" value="待审核" />
      </el-select>
      <el-select v-model="filters.policy" placeholder="关联政策" clearable style="width: 160px;">
        <el-option v-for="p in policyOptions" :key="p" :label="p" :value="p" />
      </el-select>
      <el-button type="primary" @click="applyFilter">查询</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><ChatDotRound /></div>
          <div class="stat-label">问答总数</div>
          <div class="stat-value">{{ qaList.length }}</div>
          <div class="stat-sub">较上月 +12</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><CirclePlus /></div>
          <div class="stat-label">今日新增</div>
          <div class="stat-value">{{ todayNew }}</div>
          <div class="stat-sub">较昨日 +3</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><View /></div>
          <div class="stat-label">月均浏览量</div>
          <div class="stat-value">{{ formatNum(monthlyViews) }}</div>
          <div class="stat-sub">较上月 +8.5%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><Cpu /></div>
          <div class="stat-label">智能匹配率</div>
          <div class="stat-value">92.3<span style="font-size:14px;">%</span></div>
          <div class="stat-sub">较上月 +1.2%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">问题类别分布</div></div>
          <v-chart :option="categoryPieOption" style="height: 300px;" autoresize />
        </div>
      </el-col>
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header"><div class="card-title">近7天访问趋势</div></div>
          <v-chart :option="trendLineOption" style="height: 300px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper table-card">
      <el-table :data="pagedData" row-key="id" @expand-change="onExpand" expand-row-keys="expandedRows">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="detail-section">
                    <h4>完整问答内容</h4>
                    <div class="detail-block"><strong>问题：</strong>{{ row.question }}</div>
                    <div class="detail-block"><strong>答案：</strong>{{ row.answer }}</div>
                  </div>
                  <div class="detail-section">
                    <h4>关联政策列表</h4>
                    <el-tag v-for="p in row.relatedPolicies" :key="p" size="small" style="margin: 2px 4px;">{{ p }}</el-tag>
                    <el-empty v-if="!row.relatedPolicies?.length" description="暂无关联政策" :image-size="40" />
                  </div>
                  <div class="detail-section">
                    <h4>相似问题推荐</h4>
                    <div v-for="sq in row.similarQuestions" :key="sq" class="similar-item">{{ sq }}</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="detail-section">
                    <h4>24小时访问热力图</h4>
                    <v-chart :option="getHeatmapOption(row.id)" style="height: 180px;" autoresize />
                  </div>
                  <div class="detail-section">
                    <h4>用户反馈统计</h4>
                    <div class="feedback-grid">
                      <div class="fb-item"><span class="fb-label">有帮助</span><span class="fb-val positive">{{ row.feedbackHelpful }}</span></div>
                      <div class="fb-item"><span class="fb-label">无帮助</span><span class="fb-val negative">{{ row.feedbackUnhelpful }}</span></div>
                      <div class="fb-item"><span class="fb-label">好评率</span><span class="fb-val">{{ ((row.feedbackHelpful / (row.feedbackHelpful + row.feedbackUnhelpful)) * 100).toFixed(1) }}%</span></div>
                      <div class="fb-item"><span class="fb-label">反馈总数</span><span class="fb-val">{{ row.feedbackHelpful + row.feedbackUnhelpful }}</span></div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="问题ID" width="100" />
        <el-table-column label="问题内容" min-width="200">
          <template #default="{ row }">
            <span :title="row.question">{{ truncate(row.question, 28) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="答案摘要" min-width="180">
          <template #default="{ row }">
            <span :title="row.answer">{{ truncate(row.answer, 24) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类别" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="categoryTagType(row.category)">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关键词标签" width="160">
          <template #default="{ row }">
            <el-tag v-for="kw in row.keywords.slice(0, 2)" :key="kw" size="small" effect="plain" style="margin-right:4px;">{{ kw }}</el-tag>
            <el-tag v-if="row.keywords.length > 2" size="small" effect="plain" type="info">+{{ row.keywords.length - 2 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联政策" width="90" align="center">
          <template #default="{ row }">{{ row.relatedPolicies?.length || 0 }}</template>
        </el-table-column>
        <el-table-column prop="views" label="浏览量" width="90" align="center" sortable />
        <el-table-column label="匹配度" width="90" align="center" sortable :sort-method="(a: any, b: any) => a.matchScore - b.matchScore">
          <template #default="{ row }">
            <span :style="{ color: row.matchScore >= 90 ? '#27AE60' : row.matchScore >= 70 ? '#F39C12' : '#E74C3C' }">
              {{ row.matchScore }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === '草稿' || row.status === '待审核'" link type="success" size="small" @click="handlePublish(row)">发布</el-button>
            <el-button v-if="row.status === '已发布'" link type="warning" size="small" @click="handleOffline(row)">下线</el-button>
            <el-button link type="info" size="small" @click="handlePreview(row)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredList.length"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" background />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Plus, Download, Search, ChatDotRound, CirclePlus, View, Cpu } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

use([CanvasRenderer, PieChart, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

const categoryOptions = ['户籍', '社保', '医保', '教育', '公积金', '住房', '税务']
const policyOptions = [
  '郑州市户籍管理条例', '河南省社会保险条例', '郑州市医保支付改革方案',
  '义务教育入学政策', '住房公积金管理办法', '保障性住房申请须知',
  '个人所得税专项扣除', '河南省居住证实施办法', '郑州市人才引进政策',
  '城乡居民基本医疗保险', '灵活就业人员社保补贴', '郑州市新生儿落户指南'
]

const categoryTagType = (c: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = { '户籍': 'danger', '社保': 'success', '医保': 'warning', '教育': 'primary', '公积金': 'info', '住房': 'primary', '税务': 'danger' }
  return map[c]
}
const statusTagType = (s: string): 'success' | 'info' | 'warning' => ({ '已发布': 'success', '草稿': 'info', '待审核': 'warning' } as const)[s] as any || 'info'

const filters = reactive({ keyword: '', category: '', status: '', policy: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const expandedRows = ref<string[]>([])

const qaList = reactive<any[]>(generateMockData())

const filteredList = computed(() => {
  return qaList.filter(item => {
    if (filters.keyword && !item.question.includes(filters.keyword) && !item.answer.includes(filters.keyword)) return false
    if (filters.category && item.category !== filters.category) return false
    if (filters.status && item.status !== filters.status) return false
    if (filters.policy && !item.relatedPolicies?.includes(filters.policy)) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const todayNew = computed(() => qaList.filter(q => q.status === '待审核').length + 3)
const monthlyViews = computed(() => qaList.reduce((s, q) => s + q.views, 0))

const categoryPieOption = computed(() => {
  const map: Record<string, number> = {}
  qaList.forEach(q => { map[q.category] = (map[q.category] || 0) + 1 })
  const colors: Record<string, string> = { '户籍': '#E74C3C', '社保': '#27AE60', '医保': '#F39C12', '教育': '#2980B9', '公积金': '#1E4FA5', '住房': '#8E44AD', '税务': '#16A085' }
  const data = Object.entries(map).map(([name, value]) => ({ name, value, itemStyle: { color: colors[name] || '#95A5A6' } }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}<br/>问答数：{c} ({d}%)' },
    legend: { orient: 'vertical', right: 5, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
      data
    }]
  }
})

const trendLineOption = computed(() => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const pvData = [3280, 2890, 3560, 4120, 3890, 4680, 4350]
  const uvData = [1560, 1320, 1780, 2100, 1890, 2340, 2180]
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['浏览量', '独立访客'], right: 10 },
    grid: { left: 50, right: 30, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: days, boundaryGap: false },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    series: [
      {
        name: '浏览量', type: 'line', smooth: true, data: pvData,
        lineStyle: { color: '#1E4FA5', width: 3 }, itemStyle: { color: '#1E4FA5' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.35)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }] } }
      },
      {
        name: '独立访客', type: 'line', smooth: true, data: uvData,
        lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' }
      }
    ]
  }
})

function getHeatmapOption(id: string) {
  const seed = hashCode(id)
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const values = hours.map((_, h) => {
    const peak = h >= 8 && h <= 21 ? 1 : 0.15
    return Math.floor((pseudoRandom(seed + h) * 400 + 100) * peak)
  })
  const maxVal = Math.max(...values)
  return {
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>访问量：${p[0].value}` },
    grid: { left: 40, right: 10, top: 10, bottom: 25 },
    xAxis: { type: 'category', data: hours, axisLabel: { fontSize: 10, interval: 2 } },
    yAxis: { type: 'value', show: false },
    series: [{
      type: 'bar', data: values, barWidth: 8,
      itemStyle: {
        borderRadius: [2, 2, 0, 0],
        color: (params: any) => {
          const r = params.value / maxVal
          if (r < 0.3) return '#C6E2FF'
          if (r < 0.6) return '#79BBFF'
          if (r < 0.8) return '#337ECC'
          return '#1E4FA5'
        }
      }
    }]
  }
}

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + '...' : str
}

function formatNum(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function applyFilter() { currentPage.value = 1 }
function resetFilter() {
  filters.keyword = ''; filters.category = ''; filters.status = ''; filters.policy = ''
  currentPage.value = 1
}

function onExpand(row: any) {
  const idx = expandedRows.value.indexOf(row.id)
  if (idx > -1) expandedRows.value.splice(idx, 1)
  else expandedRows.value.push(row.id)
}

function handleAdd() { ElMessage.info('新增问答（模拟）') }
function handleEdit(row: any) { ElMessage.info(`编辑：${row.id}`) }
function handlePublish(row: any) {
  ElMessageBox.confirm(`确认发布问题 ${row.id}？`, '发布确认', { type: 'info' }).then(() => {
    row.status = '已发布'; ElMessage.success('发布成功')
  }).catch(() => {})
}
function handleOffline(row: any) {
  ElMessageBox.confirm(`确认下线问题 ${row.id}？`, '下线确认', { type: 'warning' }).then(() => {
    row.status = '草稿'; ElMessage.warning('已下线')
  }).catch(() => {})
}
function handlePreview(row: any) { ElMessage.info(`预览：${row.question}`) }
function handleExport() { ElMessage.success('导出完成（模拟）') }

function generateMockData() {
  const items: any[] = [
    { q: '公积金贷款额度怎么计算？', a: '郑州市公积金贷款额度根据账户余额、缴存年限、还款能力综合确定。最高贷款额度为80万元（双缴存家庭），单缴存家庭最高60万元。计算公式：贷款额度=账户余额×倍数×缴存时间系数。', cat: '公积金', kw: ['公积金', '贷款额度', '缴存'] },
    { q: '新生儿落户需要什么材料？', a: '需提供：1.出生医学证明；2.父母结婚证；3.父母双方户口簿和身份证；4.生育服务证或再生育证。出生后一年内可在线申请，系统自动触发医保参保。', cat: '户籍', kw: ['新生儿', '落户', '出生证明'] },
    { q: '育儿补贴申领条件是什么？', a: '郑州市育儿补贴面向0-3岁婴幼儿家庭，需满足：1.夫妻双方或一方为郑州市户籍；2.已在郑州市进行生育登记；3.二孩家庭每月500元，三孩家庭每月1000元，发放至3周岁。', cat: '社保', kw: ['育儿补贴', '二孩', '三孩'] },
    { q: '医保异地就医如何备案？', a: '通过"郑好办"APP或国家医保服务平台在线备案。需提供：参保地医保凭证、就医地居住证明或转诊证明。备案后可在就医地直接结算，无需垫付。', cat: '医保', kw: ['异地就医', '备案', '直接结算'] },
    { q: '义务教育入学报名流程是什么？', a: '郑州市义务教育招生每年6月启动。流程：1.网上信息采集（郑好办APP）；2.现场资料审核；3.分配录取。需提供户口簿、房产证或租赁合同、预防接种证等。', cat: '教育', kw: ['入学报名', '义务教育', '招生'] },
    { q: '个人所得税专项扣除有哪些？', a: '包括7项：子女教育（每月2000元/孩）、继续教育（每月400元）、大病医疗（据实扣除，上限8万）、住房贷款利息（每月1000元）、住房租金（每月800-1500元）、赡养老人（每月3000元）、3岁以下婴幼儿照护（每月2000元/孩）。', cat: '税务', kw: ['个税', '专项扣除', '子女教育'] },
    { q: '公租房申请条件有哪些？', a: '需同时满足：1.本市户籍满3年或持有居住证满3年；2.家庭人均收入低于上年度城镇人均可支配收入；3.在本市无自有住房或人均住房面积低于15㎡；4.未享受其他住房保障。', cat: '住房', kw: ['公租房', '申请条件', '住房保障'] },
    { q: '社保卡丢失如何补办？', a: '可通过以下方式补办：1.线上：郑好办APP社保卡服务模块申请；2.线下：到社保卡服务网点即时补办。补办费用20元，7个工作日内完成。期间可使用电子社保卡。', cat: '社保', kw: ['社保卡', '补办', '电子社保卡'] },
    { q: '居住证办理需要多长时间？', a: '居住证办理时限为15个工作日。需提供：1.本人身份证；2.居住地住址证明（房产证/租赁合同/借住证明）；3.就业证明或就读证明。可通过郑好办APP线上申领。', cat: '户籍', kw: ['居住证', '办理', '住址证明'] },
    { q: '医保门诊报销比例是多少？', a: '郑州市职工医保门诊报销：一级医院70%、二级60%、三级50%，年度限额2000元。居民医保门诊报销：一级50%、二级40%，年度限额300元。慢性病门诊报销比例更高。', cat: '医保', kw: ['门诊报销', '职工医保', '居民医保'] },
    { q: '灵活就业人员如何缴纳社保？', a: '灵活就业人员可缴纳基本养老保险和基本医疗保险。缴费基数以上年度全省全口径平均工资的60%-300%自行选择。养老缴费比例20%，医疗8.5%。可通过郑好办APP线上缴纳。', cat: '社保', kw: ['灵活就业', '社保缴纳', '缴费基数'] },
    { q: '住房公积金提取条件有哪些？', a: '可提取情形：1.购买/建造/翻建/大修自住住房；2.偿还购房贷款本息；3.无房职工支付房租；4.退休；5.完全丧失劳动能力并与单位终止劳动关系；6.出境定居等。', cat: '公积金', kw: ['公积金提取', '购房', '租房'] },
    { q: '人才引进落户有哪些优惠政策？', a: '郑州市"智汇郑州"政策：1.全日制博士给予15万元购房补贴；2.硕士给予7万元；3.本科3万元；4.青年人才驿站免费住宿7天；5.首次购房不限购；6.配偶就业、子女入学优先安排。', cat: '户籍', kw: ['人才引进', '落户', '购房补贴'] },
    { q: '电动车牌照怎么办理？', a: '需携带：1.车辆所有人身份证；2.购车发票或车辆来历证明；3.车辆合格证。到交警大队或指定上牌点办理，也可通过"郑州交警"微信公众号预约。免费办理，当场领牌。', cat: '户籍', kw: ['电动车', '上牌', '牌照'] },
    { q: '社保缴费基数怎么确定？', a: '社保缴费基数按上年度月平均工资确定，低于全省全口径平均工资60%的按60%缴纳，高于300%的按300%缴纳。2024年度缴费基数下限3570元，上限17850元。', cat: '社保', kw: ['缴费基数', '社保', '工资'] },
    { q: '医保慢性病如何申请？', a: '申请流程：1.在二级及以上医院由专科医生诊断并出具证明；2.通过郑好办APP或医保经办机构提交申请；3.医保部门组织专家评审；4.评审通过后享受慢性病门诊待遇。病种目录包含30种常见慢性病。', cat: '医保', kw: ['慢性病', '医保', '门诊待遇'] },
    { q: '学前教育补贴如何申领？', a: '郑州市学前教育资助：1.普惠性幼儿园在园家庭经济困难儿童、孤儿、残疾儿童可申请；2.资助标准为每生每年1000元；3.每学期初向所在幼儿园提出申请，提交相关证明材料。', cat: '教育', kw: ['学前教育', '资助', '补贴'] },
    { q: '公积金贷款利率是多少？', a: '当前公积金贷款利率：5年以下（含5年）2.35%，5年以上2.85%。二套房贷款利率为同期1.1倍。相比商业贷款，公积金贷款利率优势明显，30万30年可节省利息约15万元。', cat: '公积金', kw: ['公积金利率', '贷款', '利息'] },
    { q: '二手房交易需要缴纳哪些税费？', a: '卖方：增值税（满2年免征）、个人所得税（满5唯一免征）。买方：契税（首套90㎡以下1%、90㎡以上1.5%，二套2%，三套3%）。双方各承担印花税0.025%。', cat: '税务', kw: ['二手房', '契税', '增值税'] },
    { q: '经济适用房申请条件是什么？', a: '需满足：1.本市市区常住户口5年以上；2.家庭人均可支配收入低于上年度60%；3.无住房或人均住房面积低于16㎡；4.未享受过福利分房。申请通过后进入轮候库按序分配。', cat: '住房', kw: ['经济适用房', '申请', '轮候'] },
    { q: '养老金如何计算？', a: '养老金=基础养老金+个人账户养老金。基础养老金=(退休时全省上年度在岗职工月平均工资+本人指数化月平均工资)÷2×缴费年限×1%。个人账户养老金=个人账户储存额÷计发月数。', cat: '社保', kw: ['养老金', '退休', '缴费年限'] },
    { q: '户籍迁移网上能办吗？', a: '可以。省内户籍迁移通过郑好办APP"户口迁移"模块全程网办，无需回原籍。跨省迁移需到迁入地派出所办理，但可在线预约和预审材料，减少跑腿次数。', cat: '户籍', kw: ['户籍迁移', '网上办理', '户口'] },
    { q: '医保报销起付线是多少？', a: '郑州市医保住院起付线：一级医院200元、二级400元、三级800元。一个自然年度内第二次住院起付线减半，第三次及以上免起付线。门诊不设起付线。', cat: '医保', kw: ['起付线', '医保', '住院'] },
    { q: '高考加分政策有哪些？', a: '河南省高考加分项目：1.烈士子女加20分；2.自主就业退役士兵加10分；3.归侨、归侨子女、华侨子女加10分；4.台湾省籍考生加10分；5.少数民族考生加5分（逐步取消中）。', cat: '教育', kw: ['高考加分', '烈士子女', '少数民族'] },
    { q: '公积金租房提取额度是多少？', a: '郑州市公积金租房提取：未婚职工每月1500元，已婚家庭每月2000元。每年可提取一次，提取金额不超过当年实际缴存额。需提供无房证明和租赁合同。', cat: '公积金', kw: ['公积金', '租房提取', '额度'] },
    { q: '房产税如何缴纳？', a: '目前郑州暂未开征个人住房房产税。企业房产税按房产原值一次减除30%后的余值计算，税率1.2%；或按租金收入12%计算。按年申报缴纳，申报期为每年3月1日-6月30日。', cat: '税务', kw: ['房产税', '缴纳', '企业'] },
    { q: '老旧小区改造如何申请？', a: '由小区业主委员会或社区居委会提出申请，需满足：1.建成20年以上；2.2/3以上业主同意；3.未纳入棚改拆迁计划。改造内容包括基础类（水电路气）、完善类（加装电梯）、提升类（养老托育）。', cat: '住房', kw: ['老旧小区', '改造', '业主'] },
    { q: '社保断缴有什么影响？', a: '社保断缴影响：1.医保断缴次月不能享受报销，补缴后3-6个月恢复；2.养老保险断缴影响退休待遇，但可补缴；3.购房资格可能受影响（需连续缴纳）；4.生育保险断缴后无法享受生育津贴。', cat: '社保', kw: ['社保断缴', '医保', '补缴'] },
    { q: '姓名变更如何办理？', a: '未成年人姓名变更由监护人申请，需父母双方到场同意。成年人变更需：1.书面申请；2.户口簿和身份证；3.所在单位或社区证明。到户籍地派出所办理，变更后需重新办理身份证。', cat: '户籍', kw: ['姓名变更', '户口', '身份证'] },
    { q: '大病医保报销上限是多少？', a: '郑州市大病医保在基本医保报销后，个人自付超过1.1万元的部分进入大病报销。报销比例：1.1万-10万按60%；10万-30万按70%；30万以上按80%。年度最高支付限额40万元。', cat: '医保', kw: ['大病医保', '报销上限', '年度限额'] },
    { q: '教师资格证认定流程是什么？', a: '流程：1.在中国教师资格网注册报名；2.到指定医院体检；3.准备身份证、学历证、普通话等级证、考试合格证明；4.网上预约现场确认时间；5.到认定机构提交材料；6.30个工作日内领取证书。', cat: '教育', kw: ['教师资格', '认定', '考试'] },
    { q: '公积金异地贷款可以吗？', a: '可以。郑州已开通公积金异地贷款业务。缴存职工在缴存地缴存公积金，可在购房地申请贷款。需提供缴存地公积金中心出具的缴存证明。贷款政策按购房地执行。', cat: '公积金', kw: ['公积金', '异地贷款', '缴存证明'] },
    { q: '小微企业税收优惠有哪些？', a: '2024年优惠政策：1.年应纳税所得额不超过300万元部分，减按25%计入应纳税所得额，按20%税率缴纳（实际5%）；2.增值税小规模纳税人月销售额10万元以下免征增值税；3.六税两费减半征收。', cat: '税务', kw: ['小微企业', '税收优惠', '增值税'] },
    { q: '保障性租赁住房怎么申请？', a: '申请条件：1.年满18周岁；2.在郑州市无自有住房；3.未享受其他住房保障。租金为同地段市场价的70%-90%。通过郑好办APP"保障房申请"模块在线申请，审核通过后摇号配租。', cat: '住房', kw: ['保障性租赁', '申请', '租金'] },
    { q: '失业保险金怎么领取？', a: '领取条件：1.失业前用人单位和本人已缴纳失业保险满1年；2.非因本人意愿中断就业；3.已办理失业登记并有求职要求。标准为当地最低工资的80%，领取期限最长24个月。可通过郑好办APP线上申领。', cat: '社保', kw: ['失业保险', '领取', '申领'] },
    { q: '身份证到期怎么换证？', a: '可在到期前3个月申请换证。方式：1.到户籍地派出所现场办理；2.通过郑好办APP线上预约；3.自助终端机办理（需录入指纹）。费用20元，15个工作日内领取。可邮寄送达。', cat: '户籍', kw: ['身份证', '换证', '到期'] },
    { q: '医保家庭共济怎么绑定？', a: '职工医保参保人可通过郑好办APP或医保经办窗口绑定家庭成员（配偶、父母、子女）。绑定后个人账户余额可共济使用。每个参保人最多绑定5名家庭成员，被绑定人也可被5人绑定。', cat: '医保', kw: ['家庭共济', '医保', '个人账户'] },
    { q: '中职学生资助政策有哪些？', a: '1.国家助学金：全日制正式学籍一、二年级涉农专业和非涉农专业家庭困难学生，每生每年2000元；2.免学费：农村学生、城市涉农专业和家庭困难学生；3.国家奖学金每生每年6000元。', cat: '教育', kw: ['中职', '资助', '助学金'] },
    { q: '公积金冲还贷如何办理？', a: '冲还贷方式：1.年冲：每年提取一次公积金账户余额冲抵贷款本金；2.月冲：每月自动从公积金账户扣款偿还月供。办理：到公积金中心或通过网上办事大厅签约。签约后不可随意变更方式。', cat: '公积金', kw: ['冲还贷', '公积金', '月冲'] },
    { q: '个体工商户如何纳税？', a: '个体工商户纳税方式：1.查账征收：按实际利润5%-35%超额累进税率；2.核定征收：由税务局核定月营业额和税额。增值税：月销售额10万以下免征。个税：经营所得适用5%-35%超额累进税率。', cat: '税务', kw: ['个体工商户', '纳税', '核定征收'] },
    { q: '加装电梯如何申请补贴？', a: '郑州市既有住宅加装电梯补贴：1.由业主协商一致后向所在社区申请；2.补贴标准为每部电梯25万元；3.补贴范围：规划许可、土建施工、设备采购安装；4.需三分之二以上业主同意，且无反对意见。', cat: '住房', kw: ['加装电梯', '补贴', '老旧小区'] },
    { q: '工伤认定流程是什么？', a: '流程：1.用人单位30日内向社保行政部门提出认定申请；2.提交劳动合同、医疗诊断证明、事故报告；3.社保部门60日内作出决定；4.对认定不服可申请行政复议。职工也可在1年内自行申请。', cat: '社保', kw: ['工伤认定', '申请', '劳动保障'] },
    { q: '户口本信息有误如何更正？', a: '携带：1.本人申请；2.户口簿；3.证明信息有误的材料（如出生证、结婚证等）。到户籍地派出所办理，当场可更正。如涉及关键信息（姓名、出生日期等），需分局审批，5个工作日内完成。', cat: '户籍', kw: ['户口本', '信息更正', '派出所'] },
    { q: '长期护理保险如何申请？', a: '申请条件：1.参加郑州市基本医保；2.因年老、疾病、伤残导致失能6个月以上；3.经评估达到重度失能标准。流程：线上申请→评估机构上门评估→公示→享受待遇。报销比例约70%，月均支付1500-3000元。', cat: '医保', kw: ['长护险', '失能', '评估'] },
    { q: '学生转学如何办理？', a: '义务教育阶段转学：1.因家庭住址迁移等原因可申请；2.向转入学校提出申请；3.学校有学位且符合条件可接收；4.通过学籍系统办理转学手续。注意：毕业年级一般不办理转学，每学期开学前两周办理。', cat: '教育', kw: ['转学', '学籍', '义务教育'] },
    { q: '公积金贷款需要什么条件？', a: '贷款条件：1.连续正常缴存公积金6个月以上；2.有稳定的职业和收入，信用良好；3.有合法的购房合同或协议；4.已支付不低于规定比例的首付款；5.能够提供公积金中心认可的担保。', cat: '公积金', kw: ['公积金贷款', '条件', '首付款'] },
    { q: '车辆购置税怎么计算？', a: '车辆购置税=计税价格×10%。计税价格为不含增值税的购车价格。例如购车价（含税）13万元，计税价格=130000÷1.13=115044元，购置税=11504元。新能源车免征购置税。', cat: '税务', kw: ['购置税', '车辆', '新能源'] },
    { q: '廉租房和公租房有什么区别？', a: '廉租房：面向最低收入家庭，租金约为市场价5%，按月发放租赁补贴。公租房：面向中低收入家庭，租金为市场价70%左右，实物配租。两者已逐步并轨为公租房统一管理，低收入家庭可享更大租金优惠。', cat: '住房', kw: ['廉租房', '公租房', '租金补贴'] },
    { q: '生育津贴怎么申领？', a: '申领条件：1.用人单位按规定参加生育保险并连续缴费满10个月；2.符合国家计划生育政策。津贴标准：按用人单位上年度职工月平均工资÷30×产假天数计发。顺产98天，难产113天。产后3个月内通过单位申请。', cat: '社保', kw: ['生育津贴', '产假', '申领'] },
    { q: '临时身份证如何办理？', a: '在申请换领、补领居民身份证期间急需使用的，可申领临时身份证。需到户籍地派出所办理，需提供：1.户口簿；2.近期照片回执；3.已受理正式身份证的凭据。当场办理，有效期3个月，工本费10元。', cat: '户籍', kw: ['临时身份证', '加急', '办理'] },
    { q: '医保个人账户余额怎么查？', a: '查询方式：1.郑好办APP医保服务模块；2.国家医保服务平台APP；3.医保电子凭证小程序；4.拨打12393医保热线；5.医保经办机构窗口或自助机。查询内容包含余额、缴费记录、消费明细。', cat: '医保', kw: ['医保余额', '查询', '个人账户'] },
    { q: '成人高考报名条件是什么？', a: '报名条件：1.遵守宪法和法律；2.身体健康不影响专业学习；3.报考高起本/高起专需高中毕业文化程度；4.报考专升本需取得专科毕业证；5.河南省户籍或持有居住证。每年9月网上报名，10月考试。', cat: '教育', kw: ['成人高考', '报名', '专升本'] },
    { q: '公积金余额怎么查询？', a: '查询方式：1.郑好办APP公积金模块；2.郑州住房公积金管理中心官网；3.公积金热线12329；4.公积金业务网点自助终端；5.微信/支付宝"公积金查询"小程序。支持查询余额、缴存明细、贷款进度等。', cat: '公积金', kw: ['公积金余额', '查询', '明细'] },
  ]

  const statuses = ['已发布', '已发布', '已发布', '草稿', '待审核']
  return items.map((item, i) => {
    const id = `QA${String(2024001 + i)}`
    const status = statuses[i % statuses.length]
    const relatedCount = Math.floor(Math.random() * 3) + 1
    const related = policyOptions.sort(() => Math.random() - 0.5).slice(0, relatedCount)
    return {
      id,
      question: item.q,
      answer: item.a,
      category: item.cat,
      keywords: item.kw,
      relatedPolicies: related,
      views: Math.floor(Math.random() * 15000) + 500,
      matchScore: Math.floor(Math.random() * 20) + 80,
      status,
      feedbackHelpful: Math.floor(Math.random() * 200) + 20,
      feedbackUnhelpful: Math.floor(Math.random() * 30) + 2,
      similarQuestions: generateSimilar(item.q, items, i)
    }
  })
}

function generateSimilar(q: string, items: any[], idx: number) {
  const sameCategory = items.filter((_, i) => i !== idx && items[i].cat === items[idx]?.cat)
  const picked = sameCategory.sort(() => Math.random() - 0.5).slice(0, 3)
  return picked.length ? picked.map(p => p.q) : ['暂无相似问题']
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.qa-container { padding: 0; }

.qa-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.filter-bar {
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  padding: 16px 20px; margin-bottom: 20px;
  background: $bg-card; border-radius: $radius-md;
  box-shadow: $shadow-sm;
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 20px; border-radius: $radius-md; background: $bg-card;
  box-shadow: $shadow-sm; position: relative; overflow: hidden;
  .stat-icon { position: absolute; right: 16px; top: 16px; font-size: 36px; opacity: 0.15; color: $primary-color; }
  .stat-label { font-size: 13px; color: $text-secondary; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 700; color: $text-primary; }
  .stat-sub { font-size: 12px; color: $text-secondary; margin-top: 6px; }
  &.stat-primary .stat-value { color: $primary-color; }
  &.stat-success .stat-value { color: $success-color; }
  &.stat-warning .stat-value { color: $warning-color; }
  &.stat-info .stat-value { color: $info-color; }
}

.chart-row { margin-bottom: 20px; }

.card-wrapper {
  background: $bg-card; border-radius: $radius-md;
  box-shadow: $shadow-sm; padding: 20px;
  .card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    .card-title { font-size: 15px; font-weight: 600; color: $text-primary; }
  }
}

.table-card { margin-bottom: 20px; }

.expand-detail {
  padding: 16px 24px;
  .detail-section { margin-bottom: 16px;
    h4 { font-size: 14px; font-weight: 600; color: $text-primary; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid $border-lighter; }
    .detail-block { font-size: 13px; color: $text-regular; line-height: 1.8; margin-bottom: 6px;
      strong { color: $text-primary; }
    }
    .similar-item { padding: 6px 12px; margin-bottom: 6px; background: $border-extra-light; border-radius: $radius-sm; font-size: 13px; color: $text-regular; cursor: pointer; transition: all 0.2s;
      &:hover { background: #e8f0fe; color: $primary-color; }
    }
  }
  .feedback-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .fb-item { text-align: center; padding: 12px; background: $border-extra-light; border-radius: $radius-sm; }
  .fb-label { display: block; font-size: 12px; color: $text-secondary; margin-bottom: 6px; }
  .fb-val { font-size: 20px; font-weight: 700; color: $text-primary;
    &.positive { color: $success-color; }
    &.negative { color: $danger-color; }
  }
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding: 16px 0 4px; }
</style>
