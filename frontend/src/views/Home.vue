<template>
  <div class="home-page">
    <el-row :gutter="20" class="hero-section">
      <el-col :span="12">
        <div class="hero-content">
          <h1>AI驱动的职业发展协同平台</h1>
          <p class="subtitle">深度履历解析 · AI模拟面试 · 智能人才匹配 · 数据驱动决策</p>
          <p class="description">
            基于大模型技术，为求职者提供全方位的职业发展支持，
            为企业提供智能化人才寻源服务，让人才发展更高效。
          </p>
          <div class="hero-buttons">
            <el-button type="primary" size="large" @click="$router.push('/resume')">
              <el-icon><Upload /></el-icon>
              上传简历
            </el-button>
            <el-button size="large" @click="$router.push('/talent')">
              <el-icon><Search /></el-icon>
              人才搜索
            </el-button>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" class="feature-card" @click="$router.push('/resume')">
              <div class="feature-icon resume-icon">
                <el-icon size="40"><Document /></el-icon>
              </div>
              <h3>深度履历解析</h3>
              <p>从PDF/图片中提取项目经验、技术栈、软技能，生成竞争力雷达图</p>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="feature-card" @click="$router.push('/interview')">
              <div class="feature-icon interview-icon">
                <el-icon size="40"><ChatDotRound /></el-icon>
              </div>
              <h3>AI模拟面试</h3>
              <p>基于岗位JD生成压力测试题，智能评估回答逻辑性</p>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="feature-card" @click="$router.push('/career')">
              <div class="feature-icon career-icon">
                <el-icon size="40"><Compass /></el-icon>
              </div>
              <h3>职业路径规划</h3>
              <p>输入当前岗位与目标方向，输出技能缺口与学习资源包</p>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="feature-card" @click="$router.push('/talent')">
              <div class="feature-icon talent-icon">
                <el-icon size="40"><UserSearch /></el-icon>
              </div>
              <h3>智能人才寻源</h3>
              <p>模糊需求匹配，自动生成候选人简报</p>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_users || 0 }}</div>
            <div class="stat-label">平台用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_resumes || 0 }}</div>
            <div class="stat-label">简历解析</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon><Briefcase /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_jobs || 0 }}</div>
            <div class="stat-label">在招职位</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon purple">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_companies || 0 }}</div>
            <div class="stat-label">入驻企业</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>岗位技能需求变迁趋势</span>
              <el-tag v-if="skillTrendData.fastest_growing?.length" type="success" size="small">
                最热: {{ skillTrendData.fastest_growing[0]?.skill }} ({{ skillTrendData.fastest_growing[0]?.growth_rate }}%)
              </el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="skillTrendOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>招聘效能ROI漏斗</span>
              <el-tag v-if="funnelData.stages?.length" type="info" size="small">
                平均招聘周期: {{ funnelData.avg_hiring_days || 28 }}天
              </el-tag>
            </div>
          </template>
          <v-chart class="chart" :option="funnelOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-section">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>行业人才流动热力图</span>
            </div>
          </template>
          <v-chart class="chart-lg" :option="heatmapOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>技能需求增速排行</span>
            </div>
          </template>
          <div class="growth-list" v-if="skillTrendData.fastest_growing?.length">
            <div
              v-for="(item, idx) in skillTrendData.fastest_growing"
              :key="item.skill"
              class="growth-item"
            >
              <div class="growth-rank" :class="{ top: idx < 3 }">{{ idx + 1 }}</div>
              <div class="growth-info">
                <div class="growth-name">{{ item.skill }}</div>
                <el-progress
                  :percentage="Math.abs(item.growth_rate)"
                  :color="item.growth_rate >= 0 ? '#67c23a' : '#f56c6c'"
                  :stroke-width="10"
                  :format="() => (item.growth_rate >= 0 ? '+' : '') + item.growth_rate + '%'"
                />
              </div>
              <div class="growth-demand">需求 {{ item.current_demand }}</div>
            </div>
          </div>
          <el-empty v-else description="加载中..." :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getStats, getSkillTrend, getRecruitmentFunnel, getTalentFlow } from '../api'

const stats = ref({})
const skillTrendData = ref({})
const funnelData = ref({})
const talentFlowData = ref({})

const skillTrendOption = computed(() => {
  const data = skillTrendData.value
  if (!data.skills?.length || !data.months?.length) {
    return { title: { text: '加载中...', left: 'center', top: 'middle', textStyle: { color: '#999', fontSize: 14 } } }
  }
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: data.skills, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: data.months },
    yAxis: { type: 'value', name: '需求量' },
    series: data.skills.map((skill, i) => ({
      name: skill,
      type: 'line',
      smooth: true,
      data: data.trends[i] || [],
      lineStyle: { width: 2 },
      itemStyle: { color: colors[i % colors.length] },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colors[i % colors.length] + '40' }, { offset: 1, color: colors[i % colors.length] + '05' }] } }
    }))
  }
})

const funnelOption = computed(() => {
  const data = funnelData.value
  if (!data.stages?.length) {
    return { title: { text: '加载中...', left: 'center', top: 'middle', textStyle: { color: '#999', fontSize: 14 } } }
  }
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
  return {
    tooltip: { trigger: 'item', formatter: (p) => `${p.name}: ${p.value} (${data.stages[p.dataIndex]?.conversion_rate?.toFixed(1) || '-'}%)` },
    series: [{
      type: 'funnel',
      left: '10%',
      width: '80%',
      label: { show: true, position: 'inside', formatter: (p) => `${p.name}\n${p.value}` },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: data.stages.map((s, i) => ({ value: s.count, name: s.stage, itemStyle: { color: colors[i % colors.length] } }))
    }]
  }
})

const heatmapOption = computed(() => {
  const data = talentFlowData.value
  if (!data.industries?.length || !data.roles?.length) {
    return { title: { text: '加载中...', left: 'center', top: 'middle', textStyle: { color: '#999', fontSize: 14 } } }
  }
  const heatData = (data.matrix || []).map(item => [item[1], item[0], item[2]])
  return {
    tooltip: { position: 'top', formatter: (p) => `${data.industries[p.value[1]]} → ${data.roles[p.value[0]]}: ${p.value[2]}人` },
    grid: { left: '15%', right: '15%', bottom: '20%', top: '5%' },
    xAxis: { type: 'category', data: data.roles, axisLabel: { rotate: 30, fontSize: 11 }, splitArea: { show: true } },
    yAxis: { type: 'category', data: data.industries, axisLabel: { fontSize: 11 }, splitArea: { show: true } },
    visualMap: { min: 0, max: data.max_value || 100, calculable: true, orient: 'vertical', right: '2%', top: 'center' },
    series: [{
      type: 'heatmap',
      data: heatData,
      label: { show: true, fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }
})

onMounted(async () => {
  const fallback = { total_users: 3, total_resumes: 3, total_jobs: 1, total_companies: 1 }

  try { stats.value = await getStats() } catch (e) { stats.value = fallback }

  try { skillTrendData.value = await getSkillTrend(6) } catch (e) { console.error('skill trend', e) }

  try { funnelData.value = await getRecruitmentFunnel() } catch (e) { console.error('funnel', e) }

  try { talentFlowData.value = await getTalentFlow() } catch (e) { console.error('talent flow', e) }
})
</script>

<style scoped>
.home-page {
  padding: 0;
}

.hero-section {
  margin-bottom: 32px;
}

.hero-content {
  padding: 40px 0;
}

.hero-content h1 {
  font-size: 42px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  line-height: 1.3;
}

.subtitle {
  font-size: 20px;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 12px;
}

.description {
  font-size: 16px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 32px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
}

.hero-buttons .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 180px;
  margin-bottom: 20px;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: white;
}

.resume-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.interview-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.career-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.talent-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.purple { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.charts-section {
  margin-bottom: 24px;
}

.charts-section .chart {
  height: 320px;
}

.charts-section .chart-lg {
  height: 380px;
}

.card-header {
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.growth-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.growth-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.growth-rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f0f2f5;
  color: #909399;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.growth-rank.top {
  background: #667eea;
  color: white;
}

.growth-info {
  flex: 1;
  min-width: 0;
}

.growth-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.growth-demand {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}
</style>
