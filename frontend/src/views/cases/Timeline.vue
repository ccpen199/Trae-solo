<template>
  <div class="timeline-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="info" size="small" @click="router.back()" style="margin-right: 12px;">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="page-title">办案轨迹</span>
          </div>
          <el-button 
            v-if="userStore.isLawyer" 
            type="primary" 
            @click="showAdd = true"
          >
            <el-icon><Plus /></el-icon>
            添加记录
          </el-button>
        </div>
      </template>
      
      <div class="timeline-container">
        <el-timeline>
          <el-timeline-item
            v-for="event in timeline"
            :key="event.id"
            :timestamp="formatDateTime(event.event_date)"
            placement="top"
          >
            <template #dot>
              <el-icon :size="20" :color="getEventColor(event.event_type)">
                <component :is="getEventIcon(event.event_type)" />
              </el-icon>
            </template>
            
            <el-card shadow="hover" class="event-card">
              <div class="event-header">
                <span class="event-title">{{ event.title }}</span>
                <el-tag size="small" :type="getEventTypeTag(event.event_type)">
                  {{ getEventTypeName(event.event_type) }}
                </el-tag>
              </div>
              
              <div class="event-body" v-if="event.description">
                {{ event.description }}
              </div>
              
              <div class="event-footer">
                <span class="creator">
                  <el-icon><User /></el-icon>
                  {{ event.creator_name || '系统' }}
                </span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        
        <el-empty v-if="!loading && timeline.length === 0" description="暂无办案记录" />
        
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>加载中...</p>
        </div>
      </div>
    </el-card>
    
    <el-dialog v-model="showAdd" title="添加沟通记录" width="500px">
      <el-form :model="commForm" label-width="100px">
        <el-form-item label="沟通类型">
          <el-select v-model="commForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="电话" value="phone" />
            <el-option label="邮件" value="email" />
            <el-option label="会议" value="meeting" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="参与人员">
          <el-input v-model="commForm.participants" placeholder="请输入参与人员" />
        </el-form-item>
        <el-form-item label="沟通内容">
          <el-input
            v-model="commForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入沟通内容详情"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCommunication">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { caseApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const caseId = computed(() => route.params.id)
const loading = ref(false)
const saving = ref(false)
const showAdd = ref(false)
const timeline = ref([])

const commForm = ref({
  type: 'other',
  participants: '',
  content: ''
})

const eventIconMap = {
  case_created: 'FolderAdd',
  evidence_uploaded: 'Picture',
  document_updated: 'Document',
  hearing_signed: 'Edit',
  case_closed: 'Check',
  communication: 'ChatDotRound'
}

const eventColorMap = {
  case_created: '#409eff',
  evidence_uploaded: '#67c23a',
  document_updated: '#e6a23c',
  hearing_signed: '#f56c6c',
  case_closed: '#909399',
  communication: '#409eff'
}

const eventTypeNameMap = {
  case_created: '系统事件',
  evidence_uploaded: '证据',
  document_updated: '文书',
  hearing_signed: '开庭',
  case_closed: '结案',
  communication: '沟通'
}

const eventTypeTagMap = {
  case_created: 'primary',
  evidence_uploaded: 'success',
  document_updated: 'warning',
  hearing_signed: 'danger',
  case_closed: 'info',
  communication: 'primary'
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const getEventIcon = (eventType) => eventIconMap[eventType] || 'Document'
const getEventColor = (eventType) => eventColorMap[eventType] || '#909399'
const getEventTypeName = (eventType) => eventTypeNameMap[eventType] || '其他'
const getEventTypeTag = (eventType) => eventTypeTagMap[eventType] || 'info'

const loadTimeline = async () => {
  loading.value = true
  try {
    timeline.value = await caseApi.getTimeline(caseId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const saveCommunication = async () => {
  if (!commForm.value.content) {
    ElMessage.warning('请输入沟通内容')
    return
  }

  saving.value = true
  try {
    await caseApi.createCommunication(caseId.value, {
      type: commForm.value.type,
      participants: commForm.value.participants,
      content: commForm.value.content
    })
    ElMessage.success('记录添加成功')
    showAdd.value = false
    commForm.value = { type: 'other', participants: '', content: '' }
    loadTimeline()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadTimeline()
})
</script>

<style scoped>
.timeline-page {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.timeline-container {
  min-height: 200px;
}

.event-card {
  max-width: 100%;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.event-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.event-body {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.event-footer {
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.creator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
}

.loading-icon {
  font-size: 32px;
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
