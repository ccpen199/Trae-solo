<template>
  <div class="admin-couriers">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>骑手管理</h3>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px" @change="loadCouriers">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </div>
      </template>

      <el-table :data="couriers" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="face_verified" label="人脸验证" width="120">
          <template #default="{ row }">
            <el-tag :type="row.face_verified ? 'success' : 'warning'" size="small">
              {{ row.face_verified ? '已验证' : '未验证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="license_types" label="服务资质" :show-overflow-tooltip="true" />
        <el-table-column prop="credit_score" label="信用评分" width="120">
          <template #default="{ row }">
            <span :style="{ color: getCreditColor(row.credit_score) }">
              {{ row.credit_score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'pending'" link type="success" @click="handleApprove(row)">
              通过
            </el-button>
            <el-button v-if="row.status === 'pending'" link type="danger" @click="handleReject(row)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && couriers.length === 0" description="暂无骑手" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑骑手" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="骑手ID">
          <el-input v-model="form.id" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" disabled />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用评分">
          <el-input-number v-model="form.credit_score" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/modules'

const loading = ref(false)
const couriers = ref([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const filterStatus = ref('')

const form = reactive({
  id: null,
  name: '',
  phone: '',
  status: '',
  credit_score: 100
})

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const getCreditColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadCouriers = async () => {
  loading.value = true
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const res = await adminApi.couriers.list(params)
    if (res.success) {
      couriers.value = res.couriers
    }
  } catch (error) {
    console.error('加载骑手失败:', error)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  form.id = row.id
  form.name = row.name
  form.phone = row.phone
  form.status = row.status
  form.credit_score = row.credit_score
  dialogVisible.value = true
}

const handleSubmit = async () => {
  submitLoading.value = true
  try {
    const res = await adminApi.couriers.update(form.id, {
      status: form.status,
      credit_score: form.credit_score
    })

    if (res.success) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      loadCouriers()
    }
  } catch (error) {
    console.error('更新失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await adminApi.couriers.update(row.id, { status: 'approved' })
    ElMessage.success('已通过审核')
    loadCouriers()
  } catch (error) {
    console.error('审核失败:', error)
  }
}

const handleReject = async (row) => {
  try {
    await adminApi.couriers.update(row.id, { status: 'rejected' })
    ElMessage.success('已拒绝')
    loadCouriers()
  } catch (error) {
    console.error('拒绝失败:', error)
  }
}

onMounted(() => {
  loadCouriers()
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
