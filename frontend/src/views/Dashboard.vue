<template>
  <div class="dashboard">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon blue">
              <el-icon size="24"><CollectionTag /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.stats?.totalTopics || 0 }}</div>
              <div class="stat-label">话题总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon green">
              <el-icon size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.stats?.activeTopics || 0 }}</div>
              <div class="stat-label">活跃话题</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon orange">
              <el-icon size="24"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.stats?.totalPosts || 0 }}</div>
              <div class="stat-label">内容总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon red">
              <el-icon size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ data.stats?.pendingModeration || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card quality-card">
          <template #header>内容质量指标</template>
          <div class="quality-item">
            <div class="quality-label">高点赞率 (点赞>50)</div>
            <el-progress :percentage="data.stats?.contentQuality?.high_quality_rate || 0" :color="'#67C23A'" />
          </div>
          <div class="quality-item">
            <div class="quality-label">高评论率 (评论>20)</div>
            <el-progress :percentage="data.stats?.contentQuality?.high_comment_rate || 0" :color="'#409EFF'" />
          </div>
          <div class="quality-item">
            <div class="quality-label">高分享率 (分享>10)</div>
            <el-progress :percentage="data.stats?.contentQuality?.high_share_rate || 0" :color="'#E6A23C'" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card quality-card">
          <template #header>搜索命中指标</template>
          <div class="quality-item">
            <div class="quality-label">高浏览率 (浏览>100)</div>
            <el-progress :percentage="data.stats?.searchHitRate?.high_view_rate || 0" :color="'#F56C6C'" />
          </div>
          <div class="quality-item">
            <div class="quality-label">高浏览内容数</div>
            <div class="quality-value">{{ data.stats?.searchHitRate?.high_view_posts || 0 }} 篇</div>
          </div>
          <div class="quality-item">
            <div class="quality-label">内容总数</div>
            <div class="quality-value">{{ data.stats?.searchHitRate?.total_posts || 0 }} 篇</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card quality-card">
          <template #header>治理结果统计</template>
          <div class="quality-item">
            <div class="quality-label">待处理</div>
            <el-tag type="warning" size="large">{{ getGovernanceCount(0) }} 条</el-tag>
          </div>
          <div class="quality-item">
            <div class="quality-label">已处理</div>
            <el-tag type="success" size="large">{{ getGovernanceCount(1) }} 条</el-tag>
          </div>
          <div class="quality-item">
            <div class="quality-label">创建来源分布</div>
            <div class="source-tags">
              <el-tag v-for="s in data.sourceStats || []" :key="s.source" size="small" style="margin-right: 4px">
                {{ getSourceName(s.source) }}: {{ s.count }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>热门话题排行</span>
              <el-button type="primary" link @click="$router.push('/topics')">查看全部</el-button>
            </div>
          </template>
          <div ref="chartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>分类分布</span>
          </template>
          <div ref="pieRef" class="chart pie-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>话题增长趋势</span>
          </template>
          <div ref="lineRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>审核类型统计</span>
          </template>
          <div ref="barRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>话题互动贡献排行</span>
              <span class="sub-title">基于点赞(1x) + 评论(2x) + 分享(3x)加权计算</span>
            </div>
          </template>
          <div ref="interactionRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '../api'

const data = ref({})
const chartRef = ref(null)
const pieRef = ref(null)
const lineRef = ref(null)
const barRef = ref(null)
const interactionRef = ref(null)

const sourceMap = {
  manual: '人工创建',
  auto: '系统自动',
  import: '运营导入',
  user: '用户推荐',
  system: '系统预置'
}

const getSourceName = (source) => sourceMap[source] || source

const getGovernanceCount = (status) => {
  const results = data.value.governanceResults || []
  const found = results.find(r => r.status === status)
  return found?.count || 0
}

const loadData = async () => {
  try {
    const res = await dashboardApi.overview()
    data.value = res
    await nextTick()
    renderCharts()
  } catch (e) {}
}

const renderCharts = () => {
  if (chartRef.value) {
    const chart = echarts.init(chartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: (data.value.topTopics || []).map(t => t.name).reverse()
      },
      series: [{
        name: '热度',
        type: 'bar',
        data: (data.value.topTopics || []).map(t => t.heat_score).reverse(),
        itemStyle: { color: '#409EFF' },
        barWidth: 12
      }, {
        name: '内容数',
        type: 'bar',
        data: (data.value.topTopics || []).map(t => t.post_count).reverse(),
        itemStyle: { color: '#67C23A' },
        barWidth: 12
      }]
    })
  }

  if (pieRef.value) {
    const pie = echarts.init(pieRef.value)
    pie.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: (data.value.categoryStats || []).map(c => ({ name: c.name, value: c.count })),
        label: { show: true, formatter: '{b}: {c}' }
      }]
    })
  }

  if (lineRef.value) {
    const line = echarts.init(lineRef.value)
    const growth = data.value.topicGrowth || []
    line.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: growth.map(g => g.date).reverse() },
      yAxis: { type: 'value' },
      series: [{
        name: '新增话题',
        type: 'line',
        smooth: true,
        data: growth.map(g => g.count).reverse(),
        areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
        itemStyle: { color: '#409EFF' }
      }]
    })
  }

  if (barRef.value) {
    const bar = echarts.init(barRef.value)
    const modStats = data.value.moderationStats || []
    const typeMap = {
      sensitive_topic: '敏感话题',
      malicious_tag: '恶意蹭标签',
      duplicate_topic: '重复话题',
      wrong_category: '错误归类'
    }
    bar.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: modStats.map(m => typeMap[m.type] || m.type) },
      yAxis: { type: 'value' },
      series: [{
        name: '数量',
        type: 'bar',
        data: modStats.map(m => m.count),
        itemStyle: { color: '#E6A23C' },
        barWidth: 40
      }]
    })
  }

  if (interactionRef.value) {
    const interaction = echarts.init(interactionRef.value)
    const interactions = data.value.interactionContribution || []
    interaction.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['总点赞', '总评论', '总分享', '互动得分'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: interactions.map(i => i.name) },
      yAxis: { type: 'value' },
      series: [
        { name: '总点赞', type: 'bar', data: interactions.map(i => i.total_likes), itemStyle: { color: '#67C23A' } },
        { name: '总评论', type: 'bar', data: interactions.map(i => i.total_comments), itemStyle: { color: '#409EFF' } },
        { name: '总分享', type: 'bar', data: interactions.map(i => i.total_shares), itemStyle: { color: '#E6A23C' } },
        { name: '互动得分', type: 'line', data: interactions.map(i => i.interaction_score), itemStyle: { color: '#F56C6C' }, lineStyle: { width: 3 } }
      ]
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stats-row {
  margin-bottom: 16px;
}
.stat-card {
  border: none;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.stat-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.red { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.chart-card {
  border: none;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.sub-title {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
.chart {
  height: 300px;
}
.pie-chart {
  height: 280px;
}
.quality-card {
  min-height: 180px;
}
.quality-item {
  margin-bottom: 16px;
}
.quality-item:last-child {
  margin-bottom: 0;
}
.quality-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.quality-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.source-tags {
  margin-top: 4px;
}
</style>
