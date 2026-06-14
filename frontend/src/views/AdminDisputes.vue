<template>
  <div class="admin-disputes">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>服务纠纷仲裁台账</h3>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px" @change="loadDisputes">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </div>
      </template>

      <el-table :data="disputes" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="task_id" label="任务ID" width="100" />
        <el-table-column prop="complainant_id" label="投诉人ID" width="120" />
        <el-table-column prop="reason" label="投诉原因" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="decision" label="仲裁结果" :show-overflow-tooltip="true" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && disputes.length === 0" description="暂无纠纷记录" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="处理纠纷" width="600px">
      <el-descriptions :column="2" border v-if="currentDispute.id">
        <el-descriptions-item label="纠纷ID">{{ currentDispute.id }}</el-descriptions-item>
        <el-descriptions-item label="任务ID">{{ currentDispute.task_id }}</el-descriptions-item>
        <el-descriptions-item label="投诉人">{{ currentDispute.complainant?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="被投诉人">{{ currentDispute.respondent?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="投诉原因" :span="2">{{ currentDispute.reason }}</el-descriptions-item>
        <el-descriptions-item label="证据" :span="2">
          <span v-if="currentDispute.evidence">{{ currentDispute.evidence }}</span>
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form :model="form" label-width="100px">
        <el-form-item label="仲裁决策">
          <el-input v-model="form.decision" type="textarea" :rows="4" placeholder="请输入仲裁决策" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResolve" :loading="submitLoading">
          标记已解决
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/modules'

const loading = ref(false)
const disputes = ref([])
const dialogVisible = ref(false)
const currentDispute = ref({})
const submitLoading = ref(false)
const filterStatus = ref('')

const form = reactive({
  decision: ''
})

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决'
  }
  return map[status] || status
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadDisputes = async () => {
  loading.value = true
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const res = await adminApi.disputes.list(params)
    if (res.success) {
      disputes.value = res.disputes
    }
  } catch (error) {
    console.error('加载纠纷失败:', error)
  } finally {
    loading.value = false
  }
}

const handleView = (row) => {
  currentDispute.value = row
  form.decision = row.decision || ''
  dialogVisible.value = true
}

const handleResolve = async () => {
  if (!form.decision) {
    ElMessage.warning('请输入仲裁决策')
    return
  }

  submitLoading.value = true
  try {
    const res = await adminApi.disputes.update(currentDispute.value.id, {
      status: 'resolved',
      decision: form.decision
    })

    if (res.success) {
      ElMessage.success('纠纷已解决')
      dialogVisible.value = false
      loadDisputes()
    }
  } catch (error) {
    console.error('处理纠纷失败:', error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadDisputes()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}
</style>
