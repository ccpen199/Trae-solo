<template>
  <div class="resume-detail" v-loading="loading">
    <el-page-header @back="$router.back()" content="简历详情" class="page-header" />

    <el-card v-if="resume" class="detail-card">
      <template #header>
        <div class="header">
          <h2>
            <el-icon><Document /></el-icon>
            {{ resume.parsed_data?.name || '未知' }}
          </h2>
          <div class="header-tags">
            <el-tag v-if="resume.is_valid" type="success">简历有效</el-tag>
            <el-tag v-else type="danger">存在风险</el-tag>
            <el-tag
              :type="resume.ai_generated_score > 0.7 ? 'danger' : resume.ai_generated_score > 0.4 ? 'warning' : 'success'"
            >
              AI生成风险 {{ Math.round(resume.ai_generated_score * 100) }}%
            </el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="3" border class="section">
        <el-descriptions-item label="姓名">
          {{ resume.parsed_data?.name || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="工作年限">
          {{ resume.parsed_data?.years_of_experience || 0 }} 年
        </el-descriptions-item>
        <el-descriptions-item label="联系方式">
          {{ [resume.parsed_data?.phone, resume.parsed_data?.email].filter(Boolean).join(' | ') || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="教育背景" :span="3">
          <div v-for="edu in resume.parsed_data?.education || []" :key="edu" class="edu-item">{{ edu }}</div>
          <span v-if="!resume.parsed_data?.education?.length">-</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-row :gutter="20" class="section">
        <el-col :span="14">
          <el-card>
            <template #header>
              <h4><el-icon><TrendCharts /></el-icon> 竞争力雷达图</h4>
            </template>
            <v-chart class="radar-chart" :option="radarOption" autoresize />
            <el-descriptions :column="2" border size="small" class="radar-desc">
              <el-descriptions-item
                v-for="dim in resume.radar_data?.dimensions || []"
                :key="dim.name"
                :label="dim.name"
              >
                <el-progress
                  :percentage="dim.score"
                  :color="dim.score >= 70 ? '#67c23a' : dim.score >= 40 ? '#e6a23c' : '#f56c6c'"
                  :stroke-width="14"
                />
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="10">
          <el-card class="skills-card">
            <template #header>
              <h4><el-icon><Collection /></el-icon> 技术栈 ({{ (resume.skills || []).length }})</h4>
            </template>
            <div class="skills-list">
              <el-tag
                v-for="skill in resume.skills || []"
                :key="skill"
                class="skill-tag"
                size="default"
                effect="light"
              >
                {{ skill }}
              </el-tag>
            </div>
          </el-card>

          <el-card class="soft-skills-card">
            <template #header>
              <h4><el-icon><Star /></el-icon> 软技能 ({{ (resume.soft_skills || []).length }})</h4>
            </template>
            <div class="soft-skills-list" v-if="resume.soft_skills?.length">
              <el-tag
                v-for="skill in resume.soft_skills"
                :key="skill"
                class="soft-skill-tag"
                type="warning"
                effect="light"
                size="default"
              >
                {{ skill }}
              </el-tag>
            </div>
            <el-empty v-else description="未识别到软技能" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-card class="section">
        <template #header>
          <h4><el-icon><SetUp /></el-icon> 项目经验 ({{ (resume.projects || []).length }})</h4>
        </template>
        <el-timeline v-if="resume.projects?.length">
          <el-timeline-item
            v-for="(project, index) in resume.projects"
            :key="index"
            :timestamp="project.duration"
            placement="top"
          >
            <el-card shadow="hover" class="project-card">
              <div class="project-header">
                <h5>{{ project.name }}</h5>
                <el-tag v-if="project.role" size="small">{{ project.role }}</el-tag>
              </div>
              <p class="project-desc">{{ project.description }}</p>
              <div class="project-tech" v-if="project.tech_stack?.length">
                <el-tag
                  v-for="tech in project.tech_stack"
                  :key="tech"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ tech }}
                </el-tag>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="未解析到项目经验" :image-size="60" />
      </el-card>

      <el-card class="section">
        <template #header>
          <h4>
            <el-icon color="#e6a23c"><Warning /></el-icon>
            简历注水识别明细
          </h4>
        </template>
        <div v-if="resume.anticheat_flags?.length">
          <el-alert
            v-for="(flag, index) in resume.anticheat_flags"
            :key="index"
            :type="flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'info'"
            :closable="false"
            class="anticheat-alert"
          >
            <template #title>
              <span class="flag-title">
                <el-tag size="small" :type="flag.severity === 'high' ? 'danger' : flag.severity === 'medium' ? 'warning' : 'info'">
                  {{ flag.severity === 'high' ? '高风险' : flag.severity === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
                {{ flag.message || flag.type }}
              </span>
            </template>
            <template v-if="flag.details" #default>
              <div class="flag-detail-content">
                <div v-for="(val, key) in flag.details" :key="key" class="flag-detail-item">
                  <strong>{{ key }}：</strong>
                  <span v-if="Array.isArray(val)">{{ val.join('、') }}</span>
                  <span v-else-if="typeof val === 'object'">{{ JSON.stringify(val) }}</span>
                  <span v-else>{{ val }}</span>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
        <el-empty v-else description="未检测到注水风险" :image-size="60" />
      </el-card>

      <el-card class="section">
        <template #header>
          <h4>
            <el-icon color="#667eea"><Cpu /></el-icon>
            AI生成内容检测
          </h4>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="ai-score-card">
              <el-progress
                type="dashboard"
                :percentage="Math.round(resume.ai_generated_score * 100)"
                :color="resume.ai_generated_score > 0.7 ? '#f56c6c' : resume.ai_generated_score > 0.4 ? '#e6a23c' : '#67c23a'"
                :width="120"
              >
                <template #default="{ percentage }">
                  <span class="ai-score-text">{{ percentage }}%</span>
                </template>
              </el-progress>
              <div class="ai-score-label">AI生成可能性</div>
            </div>
          </el-col>
          <el-col :span="16">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="检测方法">GLTR-like统计特征分析</el-descriptions-item>
              <el-descriptions-item label="判断依据">
                {{ resume.ai_generated_score > 0.7 ? '文本词汇分布高度符合AI生成模式，词汇选择偏向常见搭配，缺少个性化表达' : resume.ai_generated_score > 0.4 ? '部分文本特征介于人工撰写与AI生成之间，存在疑似AI辅助痕迹' : '文本词汇分布自然，句式结构多样，符合人工撰写特征' }}
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag
                  :type="resume.ai_generated_score > 0.7 ? 'danger' : resume.ai_generated_score > 0.4 ? 'warning' : 'success'"
                  size="small"
                  effect="dark"
                >
                  {{ resume.ai_generated_score > 0.7 ? '高风险' : resume.ai_generated_score > 0.4 ? '中风险' : '低风险' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="section" v-if="resume.anticheat_logs?.length">
        <template #header>
          <h4>
            <el-icon color="#909399"><List /></el-icon>
            复查记录 ({{ resume.anticheat_logs.length }})
          </h4>
        </template>
        <el-table :data="resume.anticheat_logs" size="small" border>
          <el-table-column prop="check_type" label="检查类型" width="150">
            <template #default="{ row }">
              <el-tag size="small" :type="row.check_type === 'resume_padding' ? 'warning' : row.check_type === 'ai_generated' ? 'danger' : 'info'">
                {{ row.check_type === 'resume_padding' ? '简历注水' : row.check_type === 'ai_generated' ? 'AI生成' : row.check_type === 'exaggeration' ? '内容夸大' : row.check_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'success'">
                {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="检查详情" min-width="300">
            <template #default="{ row }">
              <div v-if="row.details" class="log-details">
                <div v-for="(val, key) in row.details" :key="key" class="log-detail-item">
                  <strong>{{ key }}：</strong>
                  <span v-if="Array.isArray(val)">{{ val.join('、') }}</span>
                  <span v-else-if="typeof val === 'object'">{{ JSON.stringify(val) }}</span>
                  <span v-else>{{ val }}</span>
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="检查时间" width="180">
            <template #default="{ row }">
              {{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getResume } from '../../api'

const route = useRoute()
const resume = ref(null)
const loading = ref(false)

const radarOption = computed(() => {
  if (!resume.value?.radar_data?.dimensions) {
    return {
      radar: { indicator: [
        { name: '技术广度', max: 100 },
        { name: '技术深度', max: 100 },
        { name: '项目经验', max: 100 },
        { name: '教育背景', max: 100 },
        { name: '软技能', max: 100 }
      ]},
      series: [{ type: 'radar', data: [{ value: [0, 0, 0, 0, 0] }] }]
    }
  }
  const dims = resume.value.radar_data.dimensions
  return {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: dims.map(d => ({ name: d.name, max: 100 })),
      shape: 'polygon',
      splitArea: { areaStyle: { color: ['rgba(102,126,234,0.05)', 'rgba(102,126,234,0.1)'] } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: dims.map(d => d.score),
        name: '竞争力',
        areaStyle: { color: 'rgba(102, 126, 234, 0.3)' },
        lineStyle: { color: '#667eea', width: 2 },
        itemStyle: { color: '#667eea' }
      }]
    }]
  }
})

onMounted(async () => {
  loading.value = true
  try {
    resume.value = await getResume(route.params.id)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-tags {
  display: flex;
  gap: 8px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.edu-item {
  line-height: 1.8;
}

.radar-chart {
  height: 280px;
}

.radar-desc {
  margin-top: 12px;
}

.skills-card,
.soft-skills-card {
  margin-bottom: 20px;
}

.skills-list,
.soft-skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag,
.soft-skill-tag {
  margin-bottom: 4px;
}

.project-card {
  margin-bottom: 8px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.project-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.project-desc {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.project-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.anticheat-alert {
  margin-bottom: 10px;
}

.flag-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-detail-content {
  font-size: 13px;
  line-height: 1.8;
}

.flag-detail-item {
  margin-bottom: 4px;
}

.ai-score-card {
  text-align: center;
  padding: 20px 0;
}

.ai-score-text {
  font-size: 24px;
  font-weight: 700;
}

.ai-score-label {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
}

.log-details {
  font-size: 13px;
}

.log-detail-item {
  line-height: 1.6;
}
</style>
