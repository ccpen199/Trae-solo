<template>
  <div class="console">
    <h2>Webhook 调试控制台</h2>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
          <span>选择配置</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="应用">
              <el-select v-model="selectedApp" @change="loadConfigs" placeholder="选择应用" style="width: 100%">
                <el-option v-for="app in apps" :key="app.id" :label="app.name" :value="app.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Webhook">
              <el-select v-model="selectedConfig" placeholder="选择配置" style="width: 100%">
                <el-option v-for="c in configs" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-form>
          
          <div v-if="currentConfig" class="config-info">
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="URL">{{ currentConfig.url }}</el-descriptions-item>
              <el-descriptions-item label="方法">{{ currentConfig.method }}</el-descriptions-item>
              <el-descriptions-item label="版本">v{{ currentConfig.version }}</el-descriptions-item>
              <el-descriptions-item label="超时">{{ currentConfig.timeout }}ms</el-descriptions-item>
              <el-descriptions-item label="重试">{{ currentConfig.retry_count }}次</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
          <div class="card-header">
            <span>请求体</span>
            <el-button type="primary" @click="sendRequest" :loading="sending" :disabled="!selectedConfig">
              <el-icon><VideoPlay /></el-icon> 发送请求
            </el-button>
          </div>
          </template>
          
          <el-form-item label="JSON Payload" label-width="120px">
            <el-input
              v-model="payload"
              type="textarea"
              :rows="10"
              placeholder='{"key": "value"}'
              @blur="validatePayload"
            />
          </el-form-item>
          
          <div v-if="payloadError" class="error-text">
            <el-icon><Warning /></el-icon> {{ payloadError }}
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px;">
      <template #header>
      <div class="card-header">
        <span>执行结果</span>
        <el-tag :type="resultStatusType">{{ resultStatus }}</el-tag>
      </div>
      </template>
      
      <div v-if="!result" class="empty-state">
        <el-empty description="暂无执行记录" />
      </div>
      
      <div v-else class="result-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="result-item">
              <label>任务ID:</label>
              <span class="mono">{{ result.taskId }}</span>
            </div>
            <div class="result-item">
              <label>状态:</label>
              <el-tag :type="result.success ? 'success' : 'danger'">{{ result.success ? '成功' : '失败' }}</el-tag>
            </div>
            <div class="result-item" v-if="result.logId">
              <label>日志ID:</label>
              <el-button type="primary" link @click="viewLog(result.logId)">{{ result.logId }}</el-button>
            </div>
          </el-col>
          <el-col :span="16">
            <div v-if="result.error" class="error-block">
              <label>错误信息:</label>
              <pre>{{ result.error }}</pre>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { VideoPlay, Warning } from '@element-plus/icons-vue'
import { applications, configs as configsApi, executions } from '@/api'

const router = useRouter()
const apps = ref([])
const configs = ref([])
const selectedApp = ref('')
const selectedConfig = ref('')
const payload = ref(JSON.stringify({ orderId: 'ORD-001', status: 'created', amount: 99.99 }, null, 2))
const payloadError = ref('')
const sending = ref(false)
const result = ref(null)

const currentConfig = computed(() => {
  return configs.value.find(c => c.id === selectedConfig.value)
})

const resultStatus = computed(() => {
  if (!result.value) return '等待执行'
  return result.value.success ? '执行成功' : '执行失败'
})

const resultStatusType = computed(() => {
  if (!result.value) return 'info'
  return result.value.success ? 'success' : 'danger'
})

const loadApps = async () => {
  apps.value = await applications.list()
}

const loadConfigs = async (appId) => {
  configs.value = await configsApi.list({ app_id: appId, status: 'active' })
}

const validatePayload = () => {
  try {
    JSON.parse(payload.value)
    payloadError.value = ''
    return true
  } catch (e) {
    payloadError.value = 'JSON格式错误: ' + e.message
    return false
  }
}

const sendRequest = async () => {
  if (!validatePayload()) {
    ElMessage.error('请求体格式错误')
    return
  }
  
  sending.value = true
  result.value = null
  
  try {
    const task = await executions.createTask({
      config_id: selectedConfig.value,
      payload: JSON.parse(payload.value)
    })
    
    ElMessage.success('任务已提交，正在执行...')
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const taskDetail = await executions.getTask(task.id)
    result.value = {
      taskId: task.id,
      success: taskDetail.status === 'completed',
      error: taskDetail.status === 'failed' ? '执行失败，请查看日志' : null,
      logId: taskDetail.logs?.[0]?.id
    }
  } catch (e) {
    result.value = {
      taskId: null,
      success: false,
      error: e.error || e.message
    }
    ElMessage.error('提交失败: ' + (e.error || e.message))
  } finally {
    sending.value = false
  }
}

const viewLog = (logId) => {
  router.push(`/executions/logs/${logId}`)
}

onMounted(() => {
  loadApps()
})
</script>

<style scoped>
.console h2 {
  margin: 0 0 20px;
  font-size: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-info {
  margin-top: 20px;
}

.error-text {
  color: #ef4444;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 40px 0;
}

.result-content {
  padding: 16px 0;
}

.result-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-item label {
  font-weight: 600;
  min-width: 80px;
}

.mono {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.error-block {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.error-block label {
  font-weight: 600;
  color: #dc2626;
  display: block;
  margin-bottom: 8px;
}

.error-block pre {
  margin: 0;
  white-space: pre-wrap;
  color: #991b1b;
}
</style>
