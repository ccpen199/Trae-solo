<template>
  <div class="config-detail">
    <div class="page-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>配置详情</h2>
      <el-button type="primary" @click="showChangeDialog = true">
        <el-icon><Edit /></el-icon> 申请变更
      </el-button>
    </div>
    
    <el-card v-if="config">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="配置名称">{{ config.name }}</el-descriptions-item>
        <el-descriptions-item label="版本">v{{ config.version }}</el-descriptions-item>
        <el-descriptions-item label="应用">{{ config.app_name }}</el-descriptions-item>
        <el-descriptions-item label="环境">
          <el-tag size="small">{{ config.env_name }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="URL" :span="2">{{ config.url }}</el-descriptions-item>
        <el-descriptions-item label="方法">
          <el-tag type="primary" size="small">{{ config.method }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="超时">{{ config.timeout }}ms</el-descriptions-item>
        <el-descriptions-item label="重试次数">{{ config.retry_count }}次</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="config.status === 'active' ? 'success' : 'info'" size="small">
            {{ config.status === 'active' ? '激活' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="密钥">{{ config.secret_key }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>请求头</el-divider>
      <pre class="json-preview">{{ config.headers }}</pre>
    </el-card>
    
    <el-card style="margin-top: 20px;" v-if="config?.pendingChanges?.length">
      <template #header><span>待审批变更</span></template>
      <el-table :data="config.pendingChanges" size="small">
        <el-table-column prop="id" label="变更单ID" width="180" />
        <el-table-column prop="change_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.change_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变更内容">
          <template #default="{ row }">
            <span style="text-decoration: line-through; color: #ef4444;">{{ row.old_value }}</span>
            <el-icon style="margin: 0 8px;"><ArrowRight /></el-icon>
            <span style="color: #10b981; font-weight: 600;">{{ row.new_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header><span>变更历史</span></template>
      <el-table :data="config?.changeHistory || []" size="small">
        <el-table-column prop="id" label="变更单ID" width="180" />
        <el-table-column prop="change_type" label="类型" width="120" />
        <el-table-column label="变更内容" min-width="200">
          <template #default="{ row }">
            <span style="text-decoration: line-through; color: #999;">{{ row.old_value }}</span>
            <el-icon style="margin: 0 8px;"><ArrowRight /></el-icon>
            <span>{{ row.new_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showChangeDialog" title="申请变更" width="600px">
      <el-form :model="changeForm" label-width="100px">
        <el-form-item label="变更类型" required>
          <el-select v-model="changeForm.change_type" style="width: 100%">
            <el-option label="URL" value="url" />
            <el-option label="请求方法" value="method" />
            <el-option label="超时时间" value="timeout" />
            <el-option label="重试次数" value="retry_count" />
            <el-option label="密钥" value="secret_key" />
          </el-select>
        </el-form-item>
        <el-form-item label="新值" required>
          <el-input v-model="changeForm.new_value" />
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input v-model="changeForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChange">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { configs } from '@/api'

const route = useRoute()
const config = ref(null)
const showChangeDialog = ref(false)

const changeForm = reactive({
  change_type: 'url',
  new_value: '',
  reason: ''
})

const statusType = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const statusText = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  try {
    config.value = await configs.get(route.params.id)
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const submitChange = async () => {
  if (!changeForm.change_type || !changeForm.new_value || !changeForm.reason) {
    ElMessage.error('请填写完整信息')
    return
  }
  
  try {
    await configs.requestChange(route.params.id, changeForm)
    ElMessage.success('变更申请已提交')
    showChangeDialog.value = false
    Object.assign(changeForm, { change_type: 'url', new_value: '', reason: '' })
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '提交失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  flex: 1;
}

.json-preview {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  margin: 0;
  white-space: pre-wrap;
  max-height: 200px;
  overflow: auto;
}
</style>
