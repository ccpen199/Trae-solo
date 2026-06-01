<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card gradient-1">
          <div class="stat-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">总用户数</div>
            <div class="stat-value">{{ stats.total_users }}</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              {{ stats.user_growth || 0 }}% 增长
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card gradient-2">
          <div class="stat-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">简历解析</div>
            <div class="stat-value">{{ stats.total_resumes }}</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              {{ stats.resume_growth || 0 }}% 增长
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card gradient-3">
          <div class="stat-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">面试场次</div>
            <div class="stat-value">{{ stats.total_interviews }}</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              {{ stats.interview_growth || 0 }}% 增长
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card gradient-4">
          <div class="stat-icon">
            <el-icon><Briefcase /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">活跃职位</div>
            <div class="stat-value">{{ stats.active_jobs }}</div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              {{ stats.job_growth || 0 }}% 增长
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>
                <el-icon><TrendCharts /></el-icon>
                岗位技能需求变迁趋势
              </h3>
              <el-radio-group v-model="skillTrendPeriod" size="small" @change="loadSkillTrend">
                <el-radio-button value="6">近6个月</el-radio-button>
                <el-radio-button value="12">近12个月</el-radio-button>
                <el-radio-button value="24">近24个月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="trend-chart" :option="skillTrendOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card class="chart-card">
          <template #header>
            <h3>
              <el-icon><PieChart /></el-icon>
              人才岗位分布
            </h3>
          </template>
          <v-chart class="pie-chart" :option="positionDistOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="second-row">
      <el-col :span="14">
        <el-card class="chart-card">
          <template #header>
            <h3>
              <el-icon><Location /></el-icon>
              行业人才流动热力图
            </h3>
          </template>
          <v-chart class="heatmap-chart" :option="talentFlowOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <h3>
                <el-icon><DataAnalysis /></el-icon>
                招聘效能漏斗
              </h3>
              <el-radio-group v-model="funnelPeriod" size="small" @change="loadFunnel">
                <el-radio-button value="month">本月</el-radio-button>
                <el-radio-button value="quarter">本季度</el-radio-button>
                <el-radio-button value="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="funnel-stats" v-if="funnelData">
            <div class="funnel-summary">
              <div class="summary-item">
                <div class="label">总体转化率</div>
                <div class="value accent">{{ funnelData.overall_conversion }}%</div>
              </div>
              <div class="summary-item">
                <div class="label">平均招聘周期</div>
                <div class="value">{{ funnelData.avg_hiring_days }} 天</div>
              </div>
              <div class="summary-item">
                <div class="label">ROI</div>
                <div class="value success">x{{ funnelData.roi }}</div>
              </div>
            </div>
            <v-chart class="funnel-chart" :option="funnelOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="third-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <h3>
              <el-icon><TrendCharts /></el-icon>
              简历检测风险分布
            </h3>
          </template>
          <v-chart class="risk-chart" :option="riskOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <h3>
              <el-icon><DataLine /></el-icon>
              平台活跃度
            </h3>
          </template>
          <v-chart class="activity-chart" :option="activityOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getStatsOverview, getSkillTrend, getTalentFlow, getRecruitmentFunnel } from '../../api'

const loading = ref(false)
const stats = reactive({
  total_users: 0, total_resumes: 0, total_interviews: 0, active_jobs: 0,
  user_growth: 15, resume_growth: 22, interview_growth: 35, job_growth: 18
})

const skillTrendPeriod = ref('6')
const funnelPeriod = ref('quarter')

const skillTrendOption = ref({})
const talentFlowOption = ref({})
const funnelOption = ref({})
const funnelData = ref(null)
const positionDistOption = ref({})
const riskOption = ref({})
const activityOption = ref({})

const positionDistOption_template = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 14, fontWeight: 'bold' }
    },
    data: [
      { value: 35, name: '后端开发', itemStyle: { color: '#667eea' } },
      { value: 25, name: '大模型/AI', itemStyle: { color: '#764ba2' } },
      { value: 20, name: '前端开发', itemStyle: { color: '#4facfe' } },
      { value: 12, name: '算法', itemStyle: { color: '#43e97b' } },
      { value: 8, name: '其他', itemStyle: { color: '#fa709a' } }
    ]
  }]
}

const riskOption_template = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', max: 100 },
  yAxis: { type: 'category', data: ['低风险', '中风险', '高风险'] },
  series: [{
    type: 'bar',
    data: [
      { value: 65, itemStyle: { color: '#67c23a', borderRadius: [0, 4, 4, 0] } },
      { value: 25, itemStyle: { color: '#e6a23c', borderRadius: [0, 4, 4, 0] } },
      { value: 10, itemStyle: { color: '#f56c6c', borderRadius: [0, 4, 4, 0] } }
    ],
    label: { show: true, position: 'right', formatter: '{c}%' }
  }]
}

const activityOption_template = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '求职者', type: 'line', smooth: true,
      areaStyle: { color: 'rgba(102, 126, 234, 0.15)' },
      lineStyle: { color: '#667eea', width: 3 },
      itemStyle: { color: '#667eea' },
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '企业HR', type: 'line', smooth: true,
      areaStyle: { color: 'rgba(118, 75, 162, 0.15)' },
      lineStyle: { color: '#764ba2', width: 3 },
      itemStyle: { color: '#764ba2' },
      data: [80, 92, 78, 104, 70, 55, 48]
    }
  ]
}

const loadStats = async () => {
  try {
    const data = await getStatsOverview()
    Object.assign(stats, data)
  } catch (e) {
    console.error(e)
  }
}

const loadSkillTrend = async () => {
  try {
    const data = await getSkillTrend(parseInt(skillTrendPeriod.value))
    skillTrendOption.value = {
      tooltip: { trigger: 'axis' },
      legend: { data: data.skills, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: data.months },
      yAxis: { type: 'value', name: '需求热度' },
      series: data.skills.map((skill, idx) => ({
        name: skill,
        type: 'line',
        smooth: true,
        data: data.trends[idx],
        lineStyle: { width: 2 }
      }))
    }
  } catch (e) {
    console.error(e)
    skillTrendOption.value = {
      tooltip: {},
      xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      yAxis: { type: 'value' },
      series: [
        { data: [820, 932, 901, 934, 1290, 1330], type: 'line', smooth: true, name: 'Python', lineStyle: { color: '#667eea' } },
        { data: [620, 732, 801, 734, 1090, 1230], type: 'line', smooth: true, name: '大模型', lineStyle: { color: '#764ba2' } },
        { data: [520, 632, 701, 734, 890, 930], type: 'line', smooth: true, name: 'RAG', lineStyle: { color: '#4facfe' } }
      ],
      legend: { data: ['Python', '大模型', 'RAG'] }
    }
  }
}

const loadTalentFlow = async () => {
  try {
    const data = await getTalentFlow()
    talentFlowOption.value = {
      tooltip: { position: 'top' },
      grid: { height: '50%', top: '10%' },
      xAxis: { type: 'category', data: data.industries, splitArea: { show: true }, axisLabel: { rotate: 30 } },
      yAxis: { type: 'category', data: data.roles, splitArea: { show: true } },
      visualMap: { min: 0, max: data.max_value || 100, calculable: true,
        orient: 'horizontal', left: 'center', bottom: '5%',
        inRange: { color: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f'] }
      },
      series: [{ name: '人才流动指数', type: 'heatmap', data: data.matrix,
        label: { show: true }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    }
  } catch (e) {
    console.error(e)
    talentFlowOption.value = {
      tooltip: { position: 'top' },
      grid: { height: '50%', top: '10%' },
      xAxis: { type: 'category', data: ['互联网', '金融', '电商', '教育', '医疗', '制造'], splitArea: { show: true } },
      yAxis: { type: 'category', data: ['后端', '前端', '算法', '大模型', '数据'], splitArea: { show: true } },
      visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: '5%',
        inRange: { color: ['#e0f7fa', '#80deea', '#26c6da', '#00acc1', '#00838f'] }
      },
      series: [{ name: '人才流动指数', type: 'heatmap',
        data: [
          [0, 0, 85], [1, 0, 65], [2, 0, 90], [3, 0, 55], [4, 0, 60], [5, 0, 45],
          [0, 1, 75], [1, 1, 55], [2, 1, 80], [3, 1, 45], [4, 1, 50], [5, 1, 35],
          [0, 2, 90], [1, 2, 75], [2, 2, 70], [3, 2, 65], [4, 2, 80], [5, 2, 40],
          [0, 3, 95], [1, 3, 85], [2, 3, 88], [3, 3, 70], [4, 3, 92], [5, 3, 60],
          [0, 4, 80], [1, 4, 90], [2, 4, 85], [3, 4, 60], [4, 4, 75], [5, 4, 50]
        ],
        label: { show: true }
      }]
    }
  }
}

const loadFunnel = async () => {
  try {
    const data = await getRecruitmentFunnel(funnelPeriod.value)
    funnelData.value = data
    funnelOption.value = {
      tooltip: { trigger: 'item', formatter: '{b} : {c} ({d}%)' },
      series: [{
        type: 'funnel',
        left: '10%', top: 20, bottom: 20, width: '80%',
        min: 0, max: 100,
        minSize: '0%', maxSize: '100%',
        sort: 'descending', gap: 2,
        label: { show: true, position: 'inside', formatter: '{b}\n{c}' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        emphasis: { label: { fontSize: 16 } },
        data: data.stages.map((s, i) => ({
          value: s.conversion_rate,
          name: s.stage,
          itemStyle: {
            color: i === 0 ? '#667eea' : i === 1 ? '#764ba2' :
                   i === 2 ? '#4facfe' : i === 3 ? '#43e97b' : '#fa709a'
          }
        }))
      }]
    }
  } catch (e) {
    console.error(e)
    funnelData.value = {
      overall_conversion: 4.2, avg_hiring_days: 28, roi: 3.5,
      stages: [
        { stage: '简历曝光', count: 10000, conversion_rate: 100 },
        { stage: '简历查看', count: 3500, conversion_rate: 35 },
        { stage: '面试邀请', count: 800, conversion_rate: 8 },
        { stage: '面试通过', count: 200, conversion_rate: 2 },
        { stage: '成功入职', count: 85, conversion_rate: 0.85 }
      ]
    }
    funnelOption.value = {
      tooltip: { trigger: 'item', formatter: '{b} : {c} ({d}%)' },
      series: [{
        type: 'funnel', left: '10%', top: 20, bottom: 20, width: '80%',
        min: 0, max: 100, sort: 'descending', gap: 2,
        label: { show: true, position: 'inside', formatter: '{b}\n{d}%' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: 100, name: '简历曝光', itemStyle: { color: '#667eea' } },
          { value: 35, name: '简历查看', itemStyle: { color: '#764ba2' } },
          { value: 8, name: '面试邀请', itemStyle: { color: '#4facfe' } },
          { value: 2, name: '面试通过', itemStyle: { color: '#43e97b' } },
          { value: 0.85, name: '成功入职', itemStyle: { color: '#fa709a' } }
        ]
      }]
    }
  }
}

onMounted(() => {
  loadStats()
  loadSkillTrend()
  loadTalentFlow()
  loadFunnel()
  positionDistOption.value = positionDistOption_template
  riskOption.value = riskOption_template
  activityOption.value = activityOption_template
})
</script>

<style scoped>
.dashboard h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  gap: 16px;
  align-items: center;
  border-radius: 12px;
  border: none;
  color: white;
  overflow: hidden;
}

.stat-card.gradient-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.gradient-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.gradient-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.gradient-4 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-content {
  flex: 1;
  color: white;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-trend {
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.up {
  color: rgba(255, 255, 255, 0.95);
}

.second-row, .third-row {
  margin-top: 20px;
}

.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-chart {
  height: 350px;
}

.pie-chart {
  height: 300px;
}

.heatmap-chart {
  height: 350px;
}

.funnel-chart {
  height: 280px;
}

.risk-chart, .activity-chart {
  height: 280px;
}

.funnel-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-item .label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 4px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.summary-item .value.accent {
  color: #667eea;
}

.summary-item .value.success {
  color: #67c23a;
}
</style>
