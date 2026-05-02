<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="page-title">审核池 (人工审核)</span>
          <el-tag type="warning" effect="light">
            <el-icon><Warning /></el-icon>
            待审核: {{ pendingTasks.length }} 个
          </el-tag>
        </div>
      </template>
      
      <el-empty v-if="pendingTasks.length === 0" description="暂无待审核任务" />
      
      <div v-else class="task-list">
        <div 
          v-for="task in pendingTasks" 
          :key="task.id"
          class="task-card"
        >
          <div class="task-header">
            <div class="task-info">
              <el-icon :size="24" color="#e6a23c"><Document /></el-icon>
              <div>
                <div class="task-id">审核任务: {{ task.id }}</div>
                <div class="task-time">创建时间: {{ task.created_at }}</div>
              </div>
            </div>
            <el-tag :type="getRiskTagType(task.risk_level)" effect="dark">
              {{ getRiskLabel(task.risk_level) }}
            </el-tag>
          </div>

          <el-divider />

          <div class="task-detail">
            <div class="detail-section">
              <div class="section-title">决策信息</div>
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="决策ID">{{ task.decision_id }}</el-descriptions-item>
                <el-descriptions-item label="原决策">{{ task.decision_result }}</el-descriptions-item>
                <el-descriptions-item label="风险分数">
                  <el-progress :percentage="task.score" :color="getScoreColor(task.score)" :stroke-width="15" />
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="detail-section" v-if="task.variables_snapshot && Object.keys(task.variables_snapshot).length > 0">
              <div class="section-title">变量快照</div>
              <el-table :data="getSnapshotList(task.variables_snapshot)" size="small" stripe>
                <el-table-column prop="code" label="变量编码" width="200">
                  <template #default="{ row }">
                    <el-tag type="info" size="small">{{ row.code }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="name" label="变量名称" />
                <el-table-column prop="value" label="值" width="120">
                  <template #default="{ row }">
                    <span :class="{ 'text-danger': row.isHighRisk }">{{ row.value }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="type" label="类型" width="80" />
                <el-table-column prop="weight" label="权重" width="80" />
              </el-table>
            </div>
          </div>

          <el-divider />

          <div class="task-actions">
            <div class="action-form">
              <el-form :model="task.reviewForm" label-width="80px" style="max-width: 600px;">
                <el-form-item label="审核结果">
                  <el-radio-group v-model="task.reviewForm.result">
                    <el-radio label="approve">
                      <el-tag type="success" effect="light">通过 (原决策正确)</el-tag>
                    </el-radio>
                    <el-radio label="reject">
                      <el-tag type="danger" effect="light">拒绝 (原决策错误)</el-tag>
                    </el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="审核备注">
                  <el-input 
                    v-model="task.reviewForm.comment" 
                    type="textarea" 
                    :rows="2" 
                    placeholder="请输入审核备注，将用于模型优化"
                  />
                </el-form-item>
              </el-form>
            </div>
            <div class="action-buttons">
              <el-button 
                type="primary" 
                :disabled="!task.reviewForm.result"
                @click="resolveTask(task)"
                :loading="task.submitting"
              >
                <el-icon><Check /></el-icon>
                提交审核
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="page-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>已处理记录</span>
          <el-button type="primary" link @click="loadTasks">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="resolvedTasks" v-loading="loading" stripe>
        <el-table-column prop="id" label="任务ID" width="150" />
        <el-table-column prop="risk_level" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.risk_level)" size="small">
              {{ getRiskLabel(row.risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_status" label="处理结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.current_status === 'approved' ? 'success' : 'danger'" size="small">
              {{ row.current_status === 'approved' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_comment" label="审核备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="assigned_to" label="处理人" width="100" />
        <el-table-column prop="reviewed_at" label="处理时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

const pendingTasks = ref([])
const resolvedTasks = ref([])
const loading = ref(false)

const getRiskTagType = (level) => {
  switch (level) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const getRiskLabel = (level) => {
  switch (level) {
    case 'high': return '高风险'
    case 'medium': return '中风险'
    case 'low': return '低风险'
    default: return level
  }
}

const getScoreColor = (score) => {
  if (score >= 80) return '#f56c6c'
  if (score >= 50) return '#e6a23c'
  return '#67c23a'
}

const getSnapshotList = (snapshot) => {
  if (!snapshot) return []
  return Object.entries(snapshot).map(([code, data]) => ({
    code,
    name: data.name,
    value: data.value,
    type: data.type,
    weight: data.weight,
    isHighRisk: data.type === 'boolean' && data.value === true
  }))
}

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await api.get('/review/pending')
    if (res.data.success) {
      pendingTasks.value = res.data.data.map(task => ({
        ...task,
        reviewForm: reactive({
          result: '',
          comment: ''
        }),
        submitting: false
      }))
    }
  } catch (e) {
    console.error('加载任务失败', e)
  } finally {
    loading.value = false
  }
}

const resolveTask = async (task) => {
  if (!task.reviewForm.result) {
    ElMessage.warning('请选择审核结果')
    return
  }

  task.submitting = true
  try {
    const res = await api.post(`/review/${task.id}/resolve`, {
      result: task.reviewForm.result,
      comment: task.reviewForm.comment
    })
    
    if (res.data.success) {
      ElMessage.success('审核完成，已提交')
      loadTasks()
    }
  } catch (e) {
    console.error('提交审核失败', e)
    ElMessage.error('提交失败')
  } finally {
    task.submitting = false
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.task-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.task-id {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.task-time {
  font-size: 13px;
  color: #909399;
}

.task-detail {
  padding: 10px 0;
}

.section-title {
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 20px;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.action-form {
  flex: 1;
}

.action-buttons {
  flex-shrink: 0;
  padding-top: 30px;
}

.text-danger {
  color: #f56c6c;
  font-weight: bold;
}
</style>
