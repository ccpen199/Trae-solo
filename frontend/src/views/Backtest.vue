<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span class="page-title">回测分析 (Backtest-Simulator)</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>选择规则进行回测</span>
            </template>
            <el-form :model="backtestForm" label-width="80px">
              <el-form-item label="规则">
                <el-select 
                  v-model="backtestForm.ruleId" 
                  placeholder="请选择规则" 
                  style="width: 100%;"
                  filterable
                >
                  <el-option 
                    v-for="rule in rules" 
                    :key="rule.id" 
                    :label="rule.name" 
                    :value="rule.id"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span>{{ rule.name }}</span>
                      <el-tag :type="getStatusTagType(rule.status)" size="small">
                        {{ getStatusLabel(rule.status) }}
                      </el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="样本数量">
                <el-input-number v-model="backtestForm.sampleCount" :min="10" :max="1000" :step="10" style="width: 100%;" />
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  :disabled="!backtestForm.ruleId || runningBacktest"
                  @click="startBacktest"
                  :loading="runningBacktest"
                >
                  <el-icon><VideoPlay /></el-icon>
                  开始回测
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card shadow="never" v-if="currentResult">
            <template #header>
              <div class="result-header">
                <span>回测结果摘要</span>
                <el-tag :type="currentResult.status === 'completed' ? 'success' : 'warning'" effect="light">
                  {{ currentResult.status === 'completed' ? '已完成' : '运行中' }}
                </el-tag>
              </div>
            </template>
            
            <el-row :gutter="20" v-if="currentResult.result_summary">
              <el-col :span="6">
                <div class="stat-box">
                  <div class="stat-value">{{ currentResult.result_summary.totalCount }}</div>
                  <div class="stat-label">总样本数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-box success">
                  <div class="stat-value">{{ currentResult.result_summary.passMatch + currentResult.result_summary.rejectMatch + currentResult.result_summary.reviewMatch }}</div>
                  <div class="stat-label">正确决策</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-box danger">
                  <div class="stat-value">{{ currentResult.result_summary.falsePositives }}</div>
                  <div class="stat-label">误判</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-box warning">
                  <div class="stat-value">{{ currentResult.result_summary.falseNegatives }}</div>
                  <div class="stat-label">漏检</div>
                </div>
              </el-col>
            </el-row>

            <el-divider v-if="currentResult.result_summary" />

            <div v-if="currentResult.result_summary?.accuracy !== undefined">
              <div class="accuracy-section">
                <div class="accuracy-label">准确率</div>
                <el-progress 
                  :percentage="currentResult.result_summary.accuracy" 
                  :color="getAccuracyColor(currentResult.result_summary.accuracy)"
                  :stroke-width="24"
                />
                <div class="accuracy-value">{{ currentResult.result_summary.accuracy }}%</div>
              </div>
            </div>

            <el-divider v-if="currentResult.result_summary?.optimizationSuggestions?.length > 0" />

            <div v-if="currentResult.result_summary?.optimizationSuggestions?.length > 0">
              <div class="suggestion-title">
                <el-icon><Bulb /></el-icon>
                优化建议
              </div>
              <div 
                v-for="(suggestion, idx) in currentResult.result_summary.optimizationSuggestions" 
                :key="idx"
                class="suggestion-card"
                :class="'priority-' + suggestion.priority"
              >
                <div class="suggestion-header">
                  <el-tag :type="suggestion.type === 'promotion' ? 'success' : 'warning'">
                    {{ suggestion.type === 'promotion' ? '上线建议' : '优化建议' }}
                  </el-tag>
                  <span class="suggestion-title-text">{{ suggestion.title }}</span>
                </div>
                <div class="suggestion-desc">{{ suggestion.description }}</div>
                <div class="suggestion-actions">
                  <div class="action-item" v-for="(action, aIdx) in suggestion.actions" :key="aIdx">
                    <el-icon><Check /></el-icon>
                    <span>{{ action }}</span>
                  </div>
                </div>
                
                <el-button 
                  v-if="suggestion.type === 'promotion'"
                  type="success" 
                  size="small"
                  style="margin-top: 12px;"
                  @click="activateRuleFromSuggestion"
                >
                  <el-icon><Upload /></el-icon>
                  一键上线
                </el-button>
              </div>
            </div>
          </el-card>

          <el-empty v-else description="选择规则并开始回测查看结果" />
        </el-col>
      </el-row>
    </el-card>

    <el-card class="page-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>历史回测记录</span>
          <el-button type="primary" link @click="loadBacktests">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="backtests" v-loading="loading" stripe>
        <el-table-column prop="id" label="回测ID" width="150" />
        <el-table-column prop="rule_name" label="规则名称" min-width="180" />
        <el-table-column prop="rule_version" label="版本" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ row.status === 'completed' ? '已完成' : '运行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="准确率" width="150">
          <template #default="{ row }">
            <span v-if="row.result_summary?.accuracy !== undefined">
              {{ row.result_summary.accuracy }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewBacktestResult(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'

const rules = ref([])
const backtests = ref([])
const currentResult = ref(null)
const loading = ref(false)
const runningBacktest = ref(false)

const backtestForm = reactive({
  ruleId: '',
  sampleCount: 50
})

const getStatusTagType = (status) => {
  switch (status) {
    case 'draft': return 'info'
    case 'testing': return 'warning'
    case 'active': return 'success'
    default: return 'info'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'testing': return '测试中'
    case 'active': return '已激活'
    default: return status
  }
}

const getAccuracyColor = (accuracy) => {
  if (accuracy >= 90) return '#67c23a'
  if (accuracy >= 70) return '#e6a23c'
  return '#f56c6c'
}

const loadRules = async () => {
  try {
    const res = await api.get('/rules')
    if (res.data.success) {
      rules.value = res.data.data
    }
  } catch (e) {
    console.error('加载规则失败', e)
  }
}

const loadBacktests = async () => {
  loading.value = true
  try {
    const res = await api.get('/backtest')
    if (res.data.success) {
      backtests.value = res.data.data
    }
  } catch (e) {
    console.error('加载回测记录失败', e)
  } finally {
    loading.value = false
  }
}

const startBacktest = async () => {
  if (!backtestForm.ruleId) {
    ElMessage.warning('请选择规则')
    return
  }

  runningBacktest.value = true
  try {
    const res = await api.post('/backtest/start', {
      ruleId: backtestForm.ruleId,
      options: {
        sampleCount: backtestForm.sampleCount
      }
    })
    
    if (res.data.success) {
      ElMessage.success('回测已启动，正在执行...')
      
      const pollResult = async () => {
        const statusRes = await api.get(`/backtest/${res.data.data.backtestId}/status`)
        if (statusRes.data.success) {
          currentResult.value = statusRes.data.data
          if (statusRes.data.data.status === 'running') {
            setTimeout(pollResult, 2000)
          } else {
            runningBacktest.value = false
            loadBacktests()
          }
        }
      }
      
      pollResult()
    }
  } catch (e) {
    console.error('启动回测失败', e)
    ElMessage.error('启动回测失败')
    runningBacktest.value = false
  }
}

const viewBacktestResult = (row) => {
  currentResult.value = row
}

const activateRuleFromSuggestion = async () => {
  if (!backtestForm.ruleId) return
  
  try {
    await ElMessageBox.confirm('确定将此规则激活上线吗？', '确认操作', { type: 'success' })
    
    const res = await api.post(`/rules/${backtestForm.ruleId}/activate`)
    if (res.data.success) {
      ElMessage.success('规则已激活上线')
      loadRules()
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('激活失败', e)
    }
  }
}

onMounted(() => {
  loadRules()
  loadBacktests()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-box.success {
  background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
}

.stat-box.danger {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
}

.stat-box.warning {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.accuracy-section {
  text-align: center;
  padding: 20px;
}

.accuracy-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.accuracy-value {
  font-size: 24px;
  font-weight: 700;
  margin-top: 12px;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.suggestion-card {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.suggestion-card.priority-high {
  border-left: 4px solid #f56c6c;
}

.suggestion-card.priority-medium {
  border-left: 4px solid #e6a23c;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.suggestion-title-text {
  font-weight: 600;
  color: #303133;
}

.suggestion-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}

.suggestion-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
