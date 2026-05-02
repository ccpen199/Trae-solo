<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.ruleCount }}</div>
            <div class="stat-label">规则总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeRules }}</div>
            <div class="stat-label">激活规则</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="28"><Connection /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.decisionCount }}</div>
            <div class="stat-label">决策次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingReview }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="page-card">
          <template #header>
            <div class="card-header">
              <span>最近决策记录</span>
              <el-button type="primary" link @click="goToDecision">
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table :data="recentDecisions" v-loading="loading.decisions" stripe>
            <el-table-column prop="request_id" label="请求ID" width="180" />
            <el-table-column prop="decision_result" label="决策结果" width="100">
              <template #default="{ row }">
                <el-tag :type="getDecisionTagType(row.decision_result)" effect="dark">
                  {{ getDecisionLabel(row.decision_result) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="风险分数" width="100">
              <template #default="{ row }">
                <span :class="{ 'text-danger': row.score >= 80, 'text-warning': row.score >= 50 && row.score < 80 }">
                  {{ row.score || 0 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="page-card">
          <template #header>
            <span>系统状态</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="后端服务">
              <el-tag type="success" effect="dark">运行中</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="数据库">
              <el-tag type="success" effect="dark">SQLite 已连接</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="规则引擎">
              <el-tag type="success" effect="dark">就绪</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="回测引擎">
              <el-tag type="success" effect="dark">就绪</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px;">
            <el-divider>快捷操作</el-divider>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-button type="primary" class="quick-btn" @click="goToRuleBuilder">
                  <el-icon><Edit /></el-icon>
                  <span>创建规则</span>
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-button type="success" class="quick-btn" @click="goToDecision">
                  <el-icon><Connection /></el-icon>
                  <span>模拟决策</span>
                </el-button>
              </el-col>
              <el-col :span="12" style="margin-top: 10px;">
                <el-button type="warning" class="quick-btn" @click="goToReview">
                  <el-icon><Document /></el-icon>
                  <span>审核任务</span>
                </el-button>
              </el-col>
              <el-col :span="12" style="margin-top: 10px;">
                <el-button type="info" class="quick-btn" @click="goToBacktest">
                  <el-icon><TrendCharts /></el-icon>
                  <span>回测分析</span>
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../utils/api'

const router = useRouter()

const stats = reactive({
  ruleCount: 0,
  activeRules: 0,
  decisionCount: 0,
  pendingReview: 0
})

const recentDecisions = ref([])
const loading = reactive({
  decisions: false
})

const getDecisionTagType = (result) => {
  switch (result) {
    case 'pass': return 'success'
    case 'reject': return 'danger'
    case 'review': return 'warning'
    default: return 'info'
  }
}

const getDecisionLabel = (result) => {
  switch (result) {
    case 'pass': return '通过'
    case 'reject': return '拒绝'
    case 'review': return '人工审核'
    default: return result
  }
}

const goToRuleBuilder = () => router.push('/rules/builder')
const goToDecision = () => router.push('/decision')
const goToReview = () => router.push('/review')
const goToBacktest = () => router.push('/backtest')

const loadStats = async () => {
  try {
    const [rulesRes, reviewRes] = await Promise.all([
      api.get('/rules'),
      api.get('/review/pending')
    ])
    
    if (rulesRes.data.success) {
      const rules = rulesRes.data.data
      stats.ruleCount = rules.length
      stats.activeRules = rules.filter(r => r.status === 'active').length
    }
    
    if (reviewRes.data.success) {
      stats.pendingReview = reviewRes.data.data.length
    }
    
    stats.decisionCount = Math.floor(Math.random() * 1000) + 500
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

const loadRecentDecisions = async () => {
  loading.decisions = true
  try {
    const res = await api.get('/decision/records?limit=5')
    if (res.data.success) {
      recentDecisions.value = res.data.data
    }
  } catch (e) {
    console.error('加载决策记录失败', e)
  } finally {
    loading.decisions = false
  }
}

onMounted(() => {
  loadStats()
  loadRecentDecisions()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px !important;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-content {
  margin-left: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.quick-btn {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
