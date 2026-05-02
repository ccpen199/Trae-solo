<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <span class="page-title">决策中心 (Decision Engine)</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="10">
          <el-card shadow="never">
            <template #header>
              <span>请求参数</span>
            </template>
            <el-form :model="requestForm" label-width="120px">
              <el-form-item label="用户ID">
                <el-input v-model="requestForm.userId" placeholder="例如: user_123" />
              </el-form-item>
              <el-form-item label="IP地址">
                <el-input v-model="requestForm.ip" placeholder="例如: 192.168.1.100" />
              </el-form-item>
              <el-form-item label="设备ID">
                <el-input v-model="requestForm.deviceId" placeholder="例如: device_abc123" />
              </el-form-item>
              <el-form-item label="交易金额">
                <el-input-number v-model="requestForm.amount" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="快速测试场景">
                <el-radio-group v-model="quickScenario">
                  <el-radio label="normal">正常场景</el-radio>
                  <el-radio label="risk">高风险场景</el-radio>
                  <el-radio label="suspicious">可疑场景</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="executeDecision" :loading="executing">
                  <el-icon><Connection /></el-icon>
                  执行决策
                </el-button>
                <el-button @click="clearResult">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :span="14">
          <el-card shadow="never" v-if="decisionResult">
            <template #header>
              <div class="result-header">
                <span>决策结果</span>
                <el-tag :type="getResultTagType(decisionResult.result.decision)" effect="dark" size="large">
                  {{ getResultLabel(decisionResult.result.decision) }}
                </el-tag>
              </div>
            </template>
            
            <el-descriptions :column="3" border>
              <el-descriptions-item label="请求ID">{{ decisionResult.requestId }}</el-descriptions-item>
              <el-descriptions-item label="决策ID">{{ decisionResult.decisionId }}</el-descriptions-item>
              <el-descriptions-item label="执行耗时">{{ decisionResult.result.executionTimeMs }}ms</el-descriptions-item>
              <el-descriptions-item label="风险分数" :span="3">
                <el-progress 
                  :percentage="decisionResult.result.score" 
                  :color="getScoreColor(decisionResult.result.score)"
                  :status="decisionResult.result.score >= 80 ? 'exception' : ''"
                />
              </el-descriptions-item>
            </el-descriptions>

            <el-divider>匹配条件</el-divider>
            <div v-if="decisionResult.matchedConditions.length > 0">
              <div 
                v-for="(mc, idx) in decisionResult.matchedConditions" 
                :key="idx"
                class="matched-condition"
              >
                <div class="mc-header">
                  <el-tag type="danger" effect="dark">{{ mc.ruleName }}</el-tag>
                  <span class="mc-score">风险分数: +{{ mc.score }}</span>
                </div>
                <div class="mc-conditions">
                  <div v-for="(cond, cIdx) in mc.conditions" :key="cIdx" class="mc-item">
                    <el-tag type="warning" size="small">{{ cond.variableName }}</el-tag>
                    <span>{{ cond.variableValue }} {{ cond.operator }} {{ cond.conditionValue }}</span>
                    <el-tag type="info" size="small">权重: {{ cond.weight }}x</el-tag>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="无匹配条件，决策通过" />

            <el-divider>变量快照</el-divider>
            <el-table :data="snapshotList" size="small" stripe>
              <el-table-column prop="code" label="变量编码" width="180">
                <template #default="{ row }">
                  <el-tag type="info">{{ row.code }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="变量名称" width="180" />
              <el-table-column prop="value" label="当前值" width="120">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': row.isHighRisk }">{{ row.value }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="类型" width="80" />
              <el-table-column prop="weight" label="权重" width="80" />
            </el-table>

            <el-divider>执行的处置动作</el-divider>
            <div v-if="decisionResult.actionsExecuted.length > 0">
              <div 
                v-for="(action, idx) in decisionResult.actionsExecuted" 
                :key="idx"
                class="action-item"
              >
                <el-icon :size="20"><Check /></el-icon>
                <span class="action-type">{{ getActionLabel(action.actionType) }}</span>
                <span class="action-status">
                  <el-tag :type="action.status === 'completed' ? 'success' : 'danger'" size="small">
                    {{ action.status === 'completed' ? '已执行' : '失败' }}
                  </el-tag>
                </span>
              </div>
            </div>
            <el-empty v-else description="无处置动作执行" :image-size="60" />
          </el-card>
          
          <el-empty v-else description="请输入请求参数并执行决策" />
        </el-col>
      </el-row>

      <el-card class="page-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>历史决策记录</span>
          </div>
        </template>
        <el-table :data="historyRecords" v-loading="loadingHistory" stripe>
          <el-table-column prop="request_id" label="请求ID" width="180" />
          <el-table-column prop="decision_result" label="决策结果" width="120">
            <template #default="{ row }">
              <el-tag :type="getResultTagType(row.decision_result)" effect="light">
                {{ getResultLabel(row.decision_result) }}
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

const executing = ref(false)
const loadingHistory = ref(false)
const quickScenario = ref('normal')
const decisionResult = ref(null)
const historyRecords = ref([])

const requestForm = ref({
  userId: 'user_001',
  ip: '192.168.1.100',
  deviceId: 'device_001',
  amount: 1000
})

const snapshotList = computed(() => {
  if (!decisionResult.value?.variablesSnapshot) return []
  const snapshot = decisionResult.value.variablesSnapshot
  return Object.entries(snapshot).map(([code, data]) => ({
    code,
    name: data.name,
    value: data.value,
    type: data.type,
    weight: data.weight,
    isHighRisk: data.type === 'boolean' && data.value === true
  }))
})

const getResultTagType = (result) => {
  switch (result) {
    case 'pass': return 'success'
    case 'reject': return 'danger'
    case 'review': return 'warning'
    default: return 'info'
  }
}

const getResultLabel = (result) => {
  switch (result) {
    case 'pass': return '通过'
    case 'reject': return '拒绝'
    case 'review': return '人工审核'
    default: return result
  }
}

const getScoreColor = (score) => {
  if (score >= 80) return '#f56c6c'
  if (score >= 50) return '#e6a23c'
  return '#67c23a'
}

const getActionLabel = (type) => {
  const map = {
    block_account: '封禁用户账户',
    block_ip: '封禁IP地址',
    create_review_task: '创建人工审核任务',
    flag_transaction: '标记交易监控',
    notify_admin: '通知管理员',
    require_mfa: '要求MFA验证'
  }
  return map[type] || type
}

watch(quickScenario, (val) => {
  switch (val) {
    case 'normal':
      requestForm.value = {
        userId: 'user_001',
        ip: '192.168.1.100',
        deviceId: 'device_001',
        amount: 1000
      }
      break
    case 'risk':
      requestForm.value = {
        userId: 'user_999',
        ip: '10.0.0.1',
        deviceId: 'device_new_001',
        amount: 50000
      }
      break
    case 'suspicious':
      requestForm.value = {
        userId: 'user_suspicious',
        ip: '203.0.113.5',
        deviceId: 'device_002',
        amount: 25000
      }
      break
  }
})

const executeDecision = async () => {
  if (!requestForm.value.userId) {
    ElMessage.warning('请输入用户ID')
    return
  }

  executing.value = true
  try {
    const res = await api.post('/decision/evaluate', {
      userId: requestForm.value.userId,
      ip: requestForm.value.ip,
      deviceId: requestForm.value.deviceId,
      amount: requestForm.value.amount
    })
    
    if (res.data.success) {
      decisionResult.value = res.data
      ElMessage.success('决策执行完成')
      loadHistory()
    }
  } catch (e) {
    console.error('决策执行失败', e)
    ElMessage.error('决策执行失败')
  } finally {
    executing.value = false
  }
}

const clearResult = () => {
  decisionResult.value = null
}

const loadHistory = async () => {
  loadingHistory.value = true
  try {
    const res = await api.get('/decision/records?limit=10')
    if (res.data.success) {
      historyRecords.value = res.data.data
    }
  } catch (e) {
    console.error('加载历史记录失败', e)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  loadHistory()
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

.matched-condition {
  background: #fdf6ec;
  border: 1px solid #f5dab1;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
}

.mc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.mc-score {
  font-weight: 600;
  color: #e6a23c;
}

.mc-conditions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 12px;
  border-radius: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f9eb;
  border-radius: 4px;
  margin-bottom: 8px;
  color: #67c23a;
}

.action-type {
  flex: 1;
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}
</style>
