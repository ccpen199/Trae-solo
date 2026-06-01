<template>
  <div class="career-planner">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <h2>
              <el-icon><Compass /></el-icon>
              职业路径规划
            </h2>
          </template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="当前岗位">
              <el-select v-model="form.current_position" placeholder="请选择或输入" filterable allow-create>
                <el-option label="初级工程师" value="初级工程师" />
                <el-option label="中级工程师" value="中级工程师" />
                <el-option label="高级工程师" value="高级工程师" />
                <el-option label="技术专家" value="技术专家" />
                <el-option label="后端工程师" value="后端工程师" />
                <el-option label="前端工程师" value="前端工程师" />
                <el-option label="全栈工程师" value="全栈工程师" />
                <el-option label="算法工程师" value="算法工程师" />
                <el-option label="大模型工程师" value="大模型工程师" />
                <el-option label="数据工程师" value="数据工程师" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标岗位">
              <el-select v-model="form.target_position" placeholder="请选择或输入" filterable allow-create>
                <el-option label="高级工程师" value="高级工程师" />
                <el-option label="技术专家" value="技术专家" />
                <el-option label="技术负责人" value="技术负责人" />
                <el-option label="架构师" value="架构师" />
                <el-option label="大模型工程师" value="大模型工程师" />
                <el-option label="算法专家" value="算法专家" />
              </el-select>
            </el-form-item>
            <el-form-item label="当前技能">
              <el-select
                v-model="form.current_skills"
                multiple
                filterable
                allow-create
                placeholder="选择或输入你掌握的技能"
              >
                <el-option
                  v-for="skill in allSkills"
                  :key="skill"
                  :label="skill"
                  :value="skill"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generatePlan" :loading="loading" style="width: 100%;">
                <el-icon><MagicStick /></el-icon>
                生成职业规划
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="history-card">
          <template #header>
            <span>历史规划</span>
          </template>
          <el-table :data="history" v-loading="historyLoading" size="small">
            <el-table-column label="当前/目标">
              <template #default="{ row }">
                <div class="path-text">
                  {{ row.current_position }}
                  <el-icon><ArrowRight /></el-icon>
                  {{ row.target_position }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="16">
        <div v-if="plan" class="plan-result">
          <el-card class="overview-card">
            <template #header>
              <h3>
                <el-icon><TrendCharts /></el-icon>
                规划概览
              </h3>
            </template>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">跨越难度</div>
                  <el-tag :type="getDifficultyTag(plan.transition_difficulty)" size="large">
                    {{ getDifficultyText(plan.transition_difficulty) }}
                  </el-tag>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">预计周期</div>
                  <div class="stat-value">{{ plan.estimated_months }} 个月</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">成功概率</div>
                  <el-progress
                    type="dashboard"
                    :percentage="plan.success_probability"
                    :width="80"
                    :color="plan.success_probability >= 70 ? '#67c23a' : '#e6a23c'"
                  />
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">技能缺口</div>
                  <div class="stat-value">{{ plan.skill_gaps?.length || 0 }} 项</div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="gaps-card">
            <template #header>
              <h3>
                <el-icon><Tools /></el-icon>
                技能缺口分析
              </h3>
            </template>
            <el-table :data="plan.skill_gaps" v-loading="loading">
              <el-table-column prop="skill" label="技能名称" width="180" />
              <el-table-column label="优先级" width="120">
                <template #default="{ row }">
                  <el-tag :type="getPriorityTag(row.priority)" size="small">
                    {{ getPriorityText(row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="预计周期" width="120">
                <template #default="{ row }">
                  {{ row.estimated_weeks }} 周
                </template>
              </el-table-column>
              <el-table-column label="学习资源">
                <template #default="{ row }">
                  <div class="resources-list">
                    <el-tag
                      v-for="res in row.resources?.slice(0, 3)"
                      :key="res.name"
                      size="small"
                      type="info"
                      effect="plain"
                    >
                      {{ res.name }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card class="roadmap-card">
            <template #header>
              <h3>
                <el-icon><Guide /></el-icon>
                学习路线图
              </h3>
            </template>
            <el-steps :active="-1" class="roadmap-steps">
              <el-step
                v-for="(stage, idx) in plan.roadmap"
                :key="idx"
                :title="stage.period"
                :description="stage.focus"
              >
                <template #icon>
                  <div class="step-icon">{{ idx + 1 }}</div>
                </template>
              </el-step>
            </el-steps>
            <el-row :gutter="20" class="roadmap-detail">
              <el-col :span="8" v-for="(stage, idx) in plan.roadmap" :key="idx">
                <el-card shadow="hover" class="stage-card">
                  <h4>{{ stage.period }}</h4>
                  <p class="stage-focus">{{ stage.focus }}</p>
                  <div class="stage-skills">
                    <el-tag
                      v-for="skill in stage.skills"
                      :key="skill"
                      size="small"
                      type="primary"
                      effect="light"
                    >
                      {{ skill }}
                    </el-tag>
                  </div>
                  <ul class="stage-actions">
                    <li v-for="(action, aIdx) in stage.actions" :key="aIdx">
                      <el-icon color="#67c23a"><CircleCheck /></el-icon>
                      {{ action }}
                    </li>
                  </ul>
                  <p class="stage-milestone">
                    <el-icon color="#e6a23c"><Flag /></el-icon>
                    {{ stage.milestone }}
                  </p>
                </el-card>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="recommendations-card">
            <template #header>
              <h3>
                <el-icon><Lightbulb /></el-icon>
                行动建议
              </h3>
            </template>
            <ul class="recommendations-list">
              <li v-for="(rec, idx) in plan.recommendations" :key="idx">
                <el-tag size="small" type="primary">{{ idx + 1 }}</el-tag>
                {{ rec }}
              </li>
            </ul>
          </el-card>
        </div>

        <el-card v-else class="empty-card">
          <el-empty description="输入当前信息后，AI将为你生成个性化职业规划">
            <el-icon size="80" color="#667eea"><Compass /></el-icon>
          </el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createCareerPlan, listCareerPlans } from '../../api'

const loading = ref(false)
const historyLoading = ref(false)
const plan = ref(null)
const history = ref([])

const allSkills = [
  'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust',
  'React', 'Vue', 'Next.js', 'Node.js', 'Spring Boot', 'Django', 'FastAPI',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git', 'Linux',
  '机器学习', '深度学习', '大模型', 'LLM', 'Transformer', 'RAG', '微调',
  '微服务', '分布式系统', '高并发', '系统设计', '性能优化',
  '数据结构', '算法', '设计模式', '架构设计'
]

const form = reactive({
  current_position: '中级工程师',
  target_position: '高级工程师',
  current_skills: ['Python', 'MySQL', 'Redis', 'Git', 'Linux']
})

const getDifficultyTag = (d) => d === 'easy' ? 'success' : d === 'medium' ? 'warning' : 'danger'
const getDifficultyText = (d) => d === 'easy' ? '容易' : d === 'medium' ? '中等' : '困难'
const getPriorityTag = (p) => p === 'critical' ? 'danger' : p === 'important' ? 'warning' : 'info'
const getPriorityText = (p) => p === 'critical' ? '关键' : p === 'important' ? '重要' : '加分'

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const generatePlan = async () => {
  if (!form.current_position || !form.target_position) {
    ElMessage.warning('请填写当前岗位和目标岗位')
    return
  }
  loading.value = true
  try {
    const data = await createCareerPlan(form)
    plan.value = data
    ElMessage.success('规划生成完成！')
    await loadHistory()
  } catch (e) {
    ElMessage.error('生成失败，请重试')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    history.value = await listCareerPlans(1)
  } catch (e) {
    console.error(e)
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.career-planner h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.career-planner h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-card {
  margin-top: 20px;
}

.path-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.overview-card {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.gaps-card {
  margin-bottom: 20px;
}

.resources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.roadmap-card {
  margin-bottom: 20px;
}

.roadmap-steps {
  margin-bottom: 24px;
}

.step-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.stage-card {
  margin-bottom: 16px;
}

.stage-card h4 {
  margin: 0 0 8px 0;
  color: #667eea;
  font-size: 16px;
  font-weight: 600;
}

.stage-focus {
  color: #1a1a2e;
  font-weight: 600;
  margin-bottom: 12px;
}

.stage-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
}

.stage-actions {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
}

.stage-actions li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
}

.stage-milestone {
  margin: 0;
  padding: 8px;
  background: #fdf6ec;
  border-radius: 6px;
  font-size: 13px;
  color: #b88230;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}

.recommendations-list li:last-child {
  border-bottom: none;
}

.empty-card {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
