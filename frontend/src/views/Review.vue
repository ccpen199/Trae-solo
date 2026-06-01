<template>
  <div class="review">
    <el-card>
      <template #header><span>预约审核</span></template>
      <el-table :data="list" size="small" v-loading="loading">
        <el-table-column prop="appointment_no" label="预约号" width="120" />
        <el-table-column prop="visitor_name" label="访客" width="100" />
        <el-table-column prop="visitor_id_card" label="身份证" width="180" />
        <el-table-column prop="enterprise_name" label="企业" />
        <el-table-column prop="visit_reason" label="事由" width="100" />
        <el-table-column prop="scheduled_arrival" label="预约时间" width="160">
          <template #default="{ row }">{{ formatTime(row.scheduled_arrival) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无待审核预约" />
    </el-card>

    <el-dialog v-model="showReject" title="拒绝原因" width="400px">
      <el-input v-model="rejectComment" type="textarea" :rows="4" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { appointments } from '../api'

const list = ref([])
const loading = ref(false)
const showReject = ref(false)
const currentRow = ref(null)
const rejectComment = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await appointments.list({ reviewStatus: 'pending_review' })
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await appointments.review(row.id, { status: 'approved', comment: '', reviewerId: 1 })
    ElMessage.success('审核通过')
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleReject = (row) => {
  currentRow.value = row
  rejectComment.value = ''
  showReject.value = true
}

const confirmReject = async () => {
  try {
    await appointments.review(currentRow.value.id, { status: 'rejected', comment: rejectComment.value, reviewerId: 1 })
    ElMessage.success('已拒绝')
    showReject.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const formatTime = (t) => t ? t.slice(0, 16) : ''

onMounted(loadData)
</script>
