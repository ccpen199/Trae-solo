<template>
  <div class="orchestration-container">
    <div class="orchestration-header">
      <div>
        <h2>服务编排 · 一件事联办管理</h2>
        <p class="header-sub">
          <el-icon><Connection /></el-icon>
          共 {{ orchestrations.length }} 个编排 · 今日执行 {{ todayExecCount }} 次
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 运行中
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download">导出报表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><SetUp /></div>
          <div class="stat-label">编排总数</div>
          <div class="stat-value">{{ orchestrations.length }}</div>
          <div class="stat-sub"><TrendCharts class="up" />已上线 {{ onlineCount }} 个</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><VideoPlay /></div>
          <div class="stat-label">今日执行次数</div>
          <div class="stat-value">{{ todayExecCount }}</div>
          <div class="stat-sub"><TrendCharts class="up" />较昨日 +{{ Math.floor(todayExecCount * 0.12) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Timer /></div>
          <div class="stat-label">平均执行时长</div>
          <div class="stat-value">{{ avgDuration }} <span style="font-size:14px;">秒</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 -3.2%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><CircleCheck /></div>
          <div class="stat-label">成功率</div>
          <div class="stat-value">{{ successRate }}<span style="font-size:14px;">%</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上周 +0.5%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-wrapper list-card">
          <div class="card-header">
            <div class="card-title">一件事联办编排</div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索编排名称"
              :prefix-icon="Search"
              size="small"
              clearable
              style="width: 180px;"
            />
          </div>
          <div class="orch-list">
            <div
              v-for="item in filteredList"
              :key="item.id"
              class="orch-item"
              :class="{ active: selectedId === item.id }"
              @click="selectOrch(item.id)"
            >
              <div class="orch-item-header">
                <span class="orch-item-name">{{ item.name }}</span>
                <el-tag
                  :type="item.status === 'online' ? 'success' : item.status === 'testing' ? 'warning' : 'info'"
                  size="small"
                  round
                >{{ statusText(item.status) }}</el-tag>
              </div>
              <div class="orch-item-meta">
                <span><OfficeBuilding /> {{ item.deptCount }}部门</span>
                <span><List /> {{ item.steps.length }}步骤</span>
                <span><VideoPlay /> {{ item.execCount }}次</span>
              </div>
              <el-progress
                :percentage="item.successRate"
                :stroke-width="8"
                :color="progressColor(item.successRate)"
                :show-text="false"
                style="margin-top: 8px;"
              />
              <div class="orch-item-rate">
                <span>成功率</span>
                <span :style="{ color: progressColor(item.successRate) }">{{ item.successRate }}%</span>
              </div>
            </div>
            <el-empty v-if="filteredList.length === 0" description="无匹配编排" :image-size="60" />
          </div>
        </div>
      </el-col>

      <el-col :span="16">
        <template v-if="current">
          <div class="card-wrapper">
            <div class="card-header">
              <div class="card-title">{{ current.name }}</div>
              <div>
                <el-tag type="success" effect="plain" round style="margin-right:8px;">
                  涉及 {{ current.deptCount }} 个委办局
                </el-tag>
                <el-tag type="primary" effect="plain" round>
                  {{ current.steps.length }} 个步骤
                </el-tag>
              </div>
            </div>

            <el-descriptions :column="3" border size="default" style="margin-bottom: 20px;">
              <el-descriptions-item label="触发条件" :span="3">{{ current.trigger }}</el-descriptions-item>
              <el-descriptions-item label="涉及委办局" :span="3">
                <el-tag
                  v-for="dept in current.departments"
                  :key="dept"
                  size="small"
                  style="margin: 2px 4px 2px 0;"
                >{{ dept }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="执行参数" :span="3">
                <el-tag
                  v-for="param in current.params"
                  :key="param"
                  type="info"
                  size="small"
                  effect="plain"
                  style="margin: 2px 4px 2px 0;"
                >{{ param }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <el-row :gutter="16" style="margin-top: 16px;">
            <el-col :span="12">
              <div class="card-wrapper">
                <div class="card-header"><div class="card-title">执行耗时趋势</div></div>
                <v-chart :option="durationChartOption" style="height: 220px;" autoresize />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="card-wrapper">
                <div class="card-header"><div class="card-title">步骤成功率分布</div></div>
                <v-chart :option="stepSuccessChartOption" style="height: 220px;" autoresize />
              </div>
            </el-col>
          </el-row>

          <div class="card-wrapper" style="margin-top: 16px;">
            <div class="card-header">
              <div class="card-title">流程步骤</div>
            </div>
            <div class="steps-flow">
              <div
                v-for="(step, idx) in current.steps"
                :key="idx"
                class="step-node"
                :class="{ 'step-done': step.status === 'done', 'step-running': step.status === 'running', 'step-failed': step.status === 'failed' }"
              >
                <div class="step-connector" v-if="idx > 0">
                  <div class="connector-line"></div>
                  <el-icon class="connector-arrow"><ArrowRight /></el-icon>
                </div>
                <div class="step-body">
                  <div class="step-index">{{ idx + 1 }}</div>
                  <div class="step-info">
                    <div class="step-name">{{ step.name }}</div>
                    <div class="step-dept"><OfficeBuilding /> {{ step.department }}</div>
                    <div class="step-detail">
                      <el-tag
                        :type="stepStatusType(step.status)"
                        size="small"
                        effect="light"
                      >{{ stepStatusText(step.status) }}</el-tag>
                      <span class="step-duration"><Timer /> {{ step.duration }}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 16px;">
            <div class="card-header">
              <div class="card-title">执行记录（最近20次）</div>
            </div>
            <el-table :data="current.execRecords" size="small" stripe border>
              <el-table-column prop="id" label="执行ID" width="140" />
              <el-table-column prop="triggerTime" label="触发时间" width="170" />
              <el-table-column prop="user" label="用户" width="100" />
              <el-table-column prop="totalDuration" label="总耗时" width="90" align="center">
                <template #default="{ row }">{{ row.totalDuration }}s</template>
              </el-table-column>
              <el-table-column
                v-for="(step, sIdx) in current.steps"
                :key="sIdx"
                :label="step.name.length > 4 ? step.name.slice(0, 4) + '…' : step.name"
                width="90"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="stepStatusType(row.stepStatuses[sIdx])"
                    size="small"
                    round
                  >{{ stepStatusText(row.stepStatuses[sIdx]) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="最终状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.finalStatus === 'success' ? 'success' : row.finalStatus === 'failed' ? 'danger' : 'warning'"
                    size="small"
                    effect="dark"
                    round
                  >{{ row.finalStatus === 'success' ? '成功' : row.finalStatus === 'failed' ? '失败' : '部分成功' }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>

        <div v-else class="card-wrapper empty-detail">
          <el-empty description="请从左侧选择一个编排查看详情" :image-size="120" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Refresh, Download, Search, SetUp, VideoPlay, Timer, CircleCheck,
  TrendCharts, OfficeBuilding, List, ArrowRight, Odometer, Connection
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

type StepStatus = 'done' | 'running' | 'failed' | 'pending'
type OrchStatus = 'online' | 'testing' | 'offline'

interface Step {
  name: string
  department: string
  status: StepStatus
  duration: number
}

interface ExecRecord {
  id: string
  triggerTime: string
  user: string
  totalDuration: number
  stepStatuses: StepStatus[]
  finalStatus: 'success' | 'failed' | 'partial'
}

interface Orchestration {
  id: string
  name: string
  status: OrchStatus
  deptCount: number
  execCount: number
  successRate: number
  trigger: string
  departments: string[]
  params: string[]
  steps: Step[]
  execRecords: ExecRecord[]
}

const orchDefs = [
  {
    name: '新生儿出生一件事',
    trigger: '出生医学证明签发后自动触发',
    departments: ['卫健委', '公安局', '医保局', '人社局', '财政局'],
    params: ['出生医学证明编号', '父母身份证号', '户籍所在地', '医保参保地'],
    stepDefs: [
      { name: '出生医学证明', department: '卫健委' },
      { name: '户口登记', department: '公安局' },
      { name: '医保参保', department: '医保局' },
      { name: '社保参保', department: '人社局' },
      { name: '育儿补贴申领', department: '财政局' }
    ]
  },
  {
    name: '二手房过户一件事',
    trigger: '买卖双方提交过户申请后触发',
    departments: ['自然资源和规划局', '税务局', '住建局', '公积金中心', '水务公司', '电力公司'],
    params: ['房屋产权证号', '买卖双方身份证', '合同编号', '缴税基数'],
    stepDefs: [
      { name: '房屋核验', department: '自然资源和规划局' },
      { name: '税费计算', department: '税务局' },
      { name: '税款缴纳', department: '税务局' },
      { name: '产权转移登记', department: '自然资源和规划局' },
      { name: '水电气过户', department: '住建局' }
    ]
  },
  {
    name: '企业开办一件事',
    trigger: '企业设立登记申请提交后触发',
    departments: ['市场监管局', '公安局', '税务局', '人社局', '政务大数据局'],
    params: ['企业名称', '法定代表人身份证', '注册地址', '经营范围'],
    stepDefs: [
      { name: '企业核名', department: '市场监管局' },
      { name: '营业执照', department: '市场监管局' },
      { name: '刻章备案', department: '公安局' },
      { name: '税务登记', department: '税务局' },
      { name: '社保开户', department: '人社局' }
    ]
  },
  {
    name: '退休一件事',
    trigger: '达到法定退休年龄前30天自动触发',
    departments: ['人社局', '医保局', '公积金中心', '社保中心'],
    params: ['身份证号', '社保账号', '医保账号', '公积金账号'],
    stepDefs: [
      { name: '退休资格审核', department: '人社局' },
      { name: '养老金核算', department: '人社局' },
      { name: '医保退休待遇', department: '医保局' },
      { name: '公积金提取', department: '公积金中心' },
      { name: '退休证办理', department: '社保中心' }
    ]
  },
  {
    name: '公民身后事一件事',
    trigger: '死亡证明签发后自动触发',
    departments: ['卫健委', '公安局', '人社局', '医保局', '公积金中心'],
    params: ['死亡证明编号', '死者身份证号', '申请人身份证号', '与死者关系'],
    stepDefs: [
      { name: '死亡证明', department: '卫健委' },
      { name: '户口注销', department: '公安局' },
      { name: '社保终止', department: '人社局' },
      { name: '医保注销', department: '医保局' },
      { name: '公积金提取', department: '公积金中心' }
    ]
  },
  {
    name: '人才引进一件事',
    trigger: '人才认定通过后自动触发',
    departments: ['人社局', '公安局', '住建局', '教育局', '社保中心'],
    params: ['人才认定编号', '身份证号', '学历证书编号', '引进单位统一社会信用代码'],
    stepDefs: [
      { name: '人才认定', department: '人社局' },
      { name: '落户登记', department: '公安局' },
      { name: '住房补贴', department: '住建局' },
      { name: '子女入学', department: '教育局' },
      { name: '社保转移', department: '社保中心' }
    ]
  },
  {
    name: '失业登记一件事',
    trigger: '失业保险金申领提交后触发',
    departments: ['人社局', '医保局', '教育局', '就业服务中心'],
    params: ['身份证号', '离职证明编号', '社保账号', '失业原因'],
    stepDefs: [
      { name: '失业登记', department: '人社局' },
      { name: '失业金申领', department: '人社局' },
      { name: '医保代缴', department: '医保局' },
      { name: '职业培训', department: '教育局' },
      { name: '就业推荐', department: '就业服务中心' }
    ]
  },
  {
    name: '残疾证办理一件事',
    trigger: '残疾人评定申请提交后触发',
    departments: ['残联', '卫健委', '民政局', '人社局'],
    params: ['身份证号', '评定医院', '残疾类别', '残疾等级'],
    stepDefs: [
      { name: '残疾评定', department: '卫健委' },
      { name: '残疾证申领', department: '残联' },
      { name: '生活补贴', department: '民政局' },
      { name: '护理补贴', department: '民政局' },
      { name: '康复服务', department: '人社局' }
    ]
  },
  {
    name: '婚姻登记一件事',
    trigger: '婚姻登记申请提交后触发',
    departments: ['民政局', '公安局', '卫健委', '人社局'],
    params: ['双方身份证号', '户口簿编号', '婚前检查报告', '婚姻状况'],
    stepDefs: [
      { name: '婚前检查', department: '卫健委' },
      { name: '婚姻登记', department: '民政局' },
      { name: '户口变更', department: '公安局' },
      { name: '生育登记', department: '卫健委' },
      { name: '社保信息更新', department: '人社局' }
    ]
  },
  {
    name: '居住证办理一件事',
    trigger: '居住登记满6个月后自动触发',
    departments: ['公安局', '政务大数据局', '人社局'],
    params: ['身份证号', '居住地址', '房屋租赁合同编号', '就业证明'],
    stepDefs: [
      { name: '居住登记', department: '公安局' },
      { name: '材料审核', department: '政务大数据局' },
      { name: '居住证制作', department: '公安局' },
      { name: '居住证发放', department: '公安局' },
      { name: '签注提醒', department: '政务大数据局' }
    ]
  },
  {
    name: '公积金提取一件事',
    trigger: '提取申请提交后触发',
    departments: ['公积金中心', '住建局', '税务局', '银行'],
    params: ['公积金账号', '提取原因', '银行卡号', '购房合同号'],
    stepDefs: [
      { name: '提取资格审核', department: '公积金中心' },
      { name: '材料核验', department: '住建局' },
      { name: '提取审批', department: '公积金中心' },
      { name: '资金划拨', department: '银行' },
      { name: '到账确认', department: '公积金中心' }
    ]
  },
  {
    name: '医保转移一件事',
    trigger: '跨统筹区医保关系转移申请提交后触发',
    departments: ['医保局（转出地）', '医保局（转入地）', '人社局', '社保中心'],
    params: ['身份证号', '转出地医保账号', '转入地医保账号', '转移原因'],
    stepDefs: [
      { name: '转出地审核', department: '医保局（转出地）' },
      { name: '关系转出', department: '医保局（转出地）' },
      { name: '关系转入', department: '医保局（转入地）' },
      { name: '转入地审核', department: '医保局（转入地）' },
      { name: '待遇衔接', department: '社保中心' }
    ]
  }
]

const userPool = ['张建国', '李明华', '王志强', '刘淑芬', '赵文博', '陈晓燕', '周海涛', '吴慧敏', '郑伟东', '孙丽娟', '钱志宏', '冯晓光', '许文龙', '韩雪梅', '蒋明辉']

function generateSteps(stepDefs: typeof orchDefs[0]['stepDefs']): Step[] {
  return stepDefs.map((s) => ({
    name: s.name,
    department: s.department,
    status: 'done' as StepStatus,
    duration: Math.floor(3 + Math.random() * 25)
  }))
}

function generateRecords(stepCount: number): ExecRecord[] {
  return Array.from({ length: 20 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(i / 4))
    d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))
    const stepStatuses: StepStatus[] = Array.from({ length: stepCount }, () =>
      Math.random() > 0.06 ? 'done' : 'failed'
    )
    const hasFailed = stepStatuses.includes('failed')
    const allDone = stepStatuses.every(s => s === 'done')
    return {
      id: `EXE${String(202406000 + 20 - i).padStart(9, '0')}`,
      triggerTime: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
      user: userPool[Math.floor(Math.random() * userPool.length)],
      totalDuration: Math.floor(15 + Math.random() * 80),
      stepStatuses,
      finalStatus: allDone ? 'success' : hasFailed ? 'failed' : 'partial'
    }
  })
}

function generateOrchestration(def: typeof orchDefs[0], idx: number): Orchestration {
  const statusList: OrchStatus[] = ['online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'testing', 'online']
  const execCount = Math.floor(800 + Math.random() * 8000)
  return {
    id: `ORCH_${String(idx + 1).padStart(3, '0')}`,
    name: def.name,
    status: statusList[idx],
    deptCount: def.departments.length,
    execCount,
    successRate: Math.floor(90 + Math.random() * 10),
    trigger: def.trigger,
    departments: def.departments,
    params: def.params,
    steps: generateSteps(def.stepDefs),
    execRecords: generateRecords(def.stepDefs.length)
  }
}

const orchestrations = ref<Orchestration[]>([])
const selectedId = ref<string | null>(null)
const searchKeyword = ref('')

onMounted(() => {
  orchestrations.value = orchDefs.map((def, idx) => generateOrchestration(def, idx))
  selectedId.value = orchestrations.value[0]?.id || null
})

const current = computed(() => orchestrations.value.find(o => o.id === selectedId.value) || null)

const filteredList = computed(() => {
  if (!searchKeyword.value) return orchestrations.value
  const kw = searchKeyword.value.toLowerCase()
  return orchestrations.value.filter(o => o.name.toLowerCase().includes(kw))
})

const onlineCount = computed(() => orchestrations.value.filter(o => o.status === 'online').length)
const todayExecCount = computed(() => orchestrations.value.reduce((s, o) => s + o.execCount, 0))
const avgDuration = computed(() => {
  if (!current.value) return 0
  return current.value.steps.reduce((s, st) => s + st.duration, 0)
})
const successRate = computed(() => {
  if (orchestrations.value.length === 0) return 0
  return Math.round(orchestrations.value.reduce((s, o) => s + o.successRate, 0) / orchestrations.value.length * 10) / 10
})

const durationChartOption = computed(() => {
  if (!current.value) return {}
  const records = [...current.value.execRecords].reverse()
  return {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>耗时: {c}s' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: records.map(r => r.triggerTime.slice(5, 16)),
      axisLabel: { fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: { type: 'value', name: '秒', splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    series: [{
      type: 'line', smooth: true, data: records.map(r => r.totalDuration),
      lineStyle: { color: '#1E4FA5', width: 2 },
      itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.3)' }, { offset: 1, color: 'rgba(30,79,165,0.02)' }]
        }
      }
    }]
  }
})

const stepSuccessChartOption = computed(() => {
  if (!current.value) return {}
  const steps = current.value.steps
  const records = current.value.execRecords
  const stepRates = steps.map((_, sIdx) => {
    const done = records.filter(r => r.stepStatuses[sIdx] === 'done').length
    return Math.round((done / records.length) * 100)
  })
  return {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>成功率: {c}%' },
    grid: { left: 80, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } } },
    yAxis: {
      type: 'category',
      data: steps.map(s => s.name.length > 5 ? s.name.slice(0, 5) + '…' : s.name),
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'bar', data: stepRates, barWidth: 16,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: '#79BBFF' }, { offset: 1, color: '#1E4FA5' }]
        }
      },
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, color: '#606266' }
    }]
  }
})

function selectOrch(id: string) {
  selectedId.value = id
}

function statusText(s: OrchStatus) {
  return { online: '已上线', testing: '测试中', offline: '已下线' }[s]
}

function progressColor(rate: number) {
  if (rate >= 95) return '#27AE60'
  if (rate >= 85) return '#F39C12'
  return '#E74C3C'
}

function stepStatusType(s: StepStatus) {
  return { done: 'success', running: 'warning', failed: 'danger', pending: 'info' }[s] as 'success' | 'warning' | 'danger' | 'info'
}

function stepStatusText(s: StepStatus) {
  return { done: '完成', running: '运行中', failed: '失败', pending: '待执行' }[s]
}

function refreshData() {
  orchestrations.value.forEach(o => {
    o.execCount += Math.floor(Math.random() * 20)
    o.successRate = Math.min(99, Math.max(85, o.successRate + Math.floor(Math.random() * 3) - 1))
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.orchestration-container { padding: 0; }

.orchestration-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px 0 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    color: $text-primary;
    font-weight: 700;
  }

  .header-sub {
    margin: 0;
    color: $text-secondary;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 20px;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-sub {
    margin-top: 8px;
    font-size: 12px;
    color: $text-secondary;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &.stat-primary {
    background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%);
    &::before { background: $primary-color; }
    .stat-icon { background: rgba(30, 79, 165, 0.12); color: $primary-color; }
  }

  &.stat-success {
    background: linear-gradient(135deg, #e6f7ed 0%, #ffffff 100%);
    &::before { background: $success-color; }
    .stat-icon { background: rgba(39, 174, 96, 0.12); color: $success-color; }
  }

  &.stat-warning {
    background: linear-gradient(135deg, #fef5e7 0%, #ffffff 100%);
    &::before { background: $warning-color; }
    .stat-icon { background: rgba(243, 156, 18, 0.12); color: $warning-color; }
  }

  &.stat-info {
    background: linear-gradient(135deg, #e7f4fd 0%, #ffffff 100%);
    &::before { background: $info-color; }
    .stat-icon { background: rgba(41, 128, 185, 0.12); color: $info-color; }
  }
}

.card-wrapper {
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
  }
}

.list-card {
  height: calc(100vh - 340px);
  display: flex;
  flex-direction: column;

  .card-header { flex-shrink: 0; }
}

.orch-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: $border-light; border-radius: 2px; }
}

.orch-item {
  padding: 14px;
  border-radius: $radius-md;
  border: 1px solid $border-lighter;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    border-color: $primary-light;
    background: #f0f7ff;
    transform: translateX(4px);
  }

  &.active {
    border-color: $primary-color;
    background: linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%);
    box-shadow: 0 2px 8px rgba(30, 79, 165, 0.15);
  }
}

.orch-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.orch-item-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.orch-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: $text-secondary;

  span {
    display: flex;
    align-items: center;
    gap: 3px;
  }
}

.orch-item-rate {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
}

.steps-flow {
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding: 16px 0;
  gap: 0;
}

.step-node {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
}

.step-connector {
  display: flex;
  align-items: center;
  padding-top: 18px;
  margin: 0 4px;

  .connector-line {
    width: 24px;
    height: 2px;
    background: $border-base;
  }

  .connector-arrow {
    color: $primary-light;
    font-size: 12px;
  }
}

.step-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  padding: 12px 8px;
  border-radius: $radius-md;
  border: 1px solid $border-lighter;
  background: $bg-card;
  transition: all 0.3s;
}

.step-done .step-body {
  border-color: rgba(39, 174, 96, 0.3);
  background: linear-gradient(135deg, #f0faf4 0%, #ffffff 100%);
}

.step-running .step-body {
  border-color: rgba(30, 79, 165, 0.4);
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  animation: pulse 2s infinite;
}

.step-failed .step-body {
  border-color: rgba(231, 76, 60, 0.3);
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(30, 79, 165, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(30, 79, 165, 0.05); }
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: $primary-color;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.step-done .step-index { background: $success-color; }
.step-failed .step-index { background: $danger-color; }

.step-info {
  text-align: center;
}

.step-name {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 4px;
  white-space: nowrap;
}

.step-dept {
  font-size: 11px;
  color: $text-secondary;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.step-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-duration {
  font-size: 11px;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 2px;
}

.empty-detail {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
