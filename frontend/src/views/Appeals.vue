<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">申诉处理</span>
          <el-button type="primary" @click="openAppealDialog">新增申诉</el-button>
        </div>
      </template>

      <el-table :data="appeals" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="resident_name" label="申诉人" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              size="small"
              @click="openHandleDialog(row)"
            >处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="appealDialogVisible" title="新增申诉" width="500px">
      <el-form :model="appealForm" label-width="100px">
        <el-form-item label="申诉人" required>
          <el-select v-model="appealForm.resident_id" style="width: 100%" filterable placeholder="请选择居民">
            <el-option
              v-for="r in residents"
              :key="r.id"
              :label="`${r.name} (${r.phone || r.id_card})`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申诉类型" required>
          <el-select v-model="appealForm.type" style="width: 100%">
            <el-option label="积分问题" value="points" />
            <el-option label="活动问题" value="activity" />
            <el-option label="兑换问题" value="exchange" />
            <el-option label="其他问题" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="申诉标题" required>
          <el-input v-model="appealForm.title" />
        </el-form-item>
        <el-form-item label="申诉内容" required>
          <el-input v-model="appealForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppeal">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleDialogVisible" title="处理申诉" width="500px">
      <el-descriptions :column="1" border size="small" v-if="currentAppeal">
        <el-descriptions-item label="申诉人">{{ currentAppeal.resident_name }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeLabel(currentAppeal.type) }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ currentAppeal.title }}</el-descriptions-item>
        <el-descriptions-item label="内容">{{ currentAppeal.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form label-width="100px" style="margin-top: 20px">
        <el-form-item label="处理结果">
          <el-select v-model="handleResult.status" style="width: 100%">
            <el-option label="已解决" value="resolved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="handleResult.handle_result" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="申诉详情" width="600px">
      <el-descriptions :column="2" border v-if="currentAppeal">
        <el-descriptions-item label="申诉人">{{ currentAppeal.resident_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentAppeal.resident_phone }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ getTypeLabel(currentAppeal.type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentAppeal.status)" size="small">
            {{ getStatusLabel(currentAppeal.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申诉标题" :span="2">{{ currentAppeal.title }}</el-descriptions-item>
        <el-descriptions-item label="申诉内容" :span="2">{{ currentAppeal.content }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAppeal.handler || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAppeal.handled_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" :span="2">{{ currentAppeal.handle_result || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const appeals = ref([])
const residents = ref([])

const appealDialogVisible = ref(false)
const handleDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const appealForm = ref({})
const currentAppeal = ref(null)
const handleResult = ref({})

const getTypeLabel = (type) => {
  const labels = { points: '积分问题', activity: '活动问题', exchange: '兑换问题', other: '其他问题' }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = { pending: '待处理', resolved: '已解决', rejected: '已驳回' }
  return labels[status] || status
}

const getStatusType = (status) => {
  const types = { pending: 'warning', resolved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/publication/appeals', { params: { pageSize: 100 } })
    appeals.value = res.data.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadResidents = async () => {
  try {
    const res = await axios.get('/api/residents', { params: { pageSize: 1000 } })
    residents.value = res.data.data
  } catch (e) {
    console.error(e)
  }
}

const openAppealDialog = () => {
  appealForm.value = {
    resident_id: null,
    type: 'points',
    title: '',
    content: ''
  }
  appealDialogVisible.value = true
}

const submitAppeal = async () => {
  if (!appealForm.value.resident_id || !appealForm.value.title || !appealForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await axios.post('/api/publication/appeals', appealForm.value)
    ElMessage.success('提交成功')
    appealDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const openHandleDialog = (row) => {
  currentAppeal.value = row
  handleResult.value = {
    status: 'resolved',
    handle_result: ''
  }
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  try {
    await axios.post(`/api/publication/appeals/${currentAppeal.value.id}/handle`, handleResult.value)
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const viewDetail = (row) => {
  currentAppeal.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadData()
  loadResidents()
})
</script>
