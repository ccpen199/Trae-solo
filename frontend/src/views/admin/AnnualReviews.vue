<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">年审管理</h2>
    <div class="card">
      <el-table :data="reviews" style="width: 100%">
        <el-table-column prop="club_name" label="社团名称" />
        <el-table-column prop="year" label="年度" />
        <el-table-column prop="report" label="年审报告" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="review_note" label="审核意见" show-overflow-tooltip />
        <el-table-column prop="reviewer_name" label="审核人" />
        <el-table-column prop="submitted_at" label="提交时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="reviewAnnual(row, 'passed')" v-if="row.status === 'pending'">
              通过
            </el-button>
            <el-button type="danger" link size="small" @click="openRejectDialog(row)" v-if="row.status === 'pending'">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showRejectDialog" title="年审不通过">
      <el-form label-width="80px">
        <el-form-item label="审核意见">
          <el-input v-model="reviewNote" type="textarea" :rows="4" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReview('failed')">确认不通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { clubs, stats } from '@/api'

const reviews = ref([])
const showRejectDialog = ref(false)
const currentReview = ref(null)
const reviewNote = ref('')

const loadData = async () => {
  const clubsRes = await stats.membersByClub()
  const allReviews = []
  for (const club of clubsRes.data) {
    try {
      const reviewRes = await clubs.reviews(club.id)
      reviewRes.data.forEach(r => {
        r.club_name = club.name
        allReviews.push(r)
      })
    } catch (e) {
      console.error(e)
    }
  }
  reviews.value = allReviews.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
}

const reviewAnnual = async (row, status) => {
  try {
    await clubs.reviewAnnual(row.id, { status, review_note: '' })
    ElMessage.success('审核成功')
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const openRejectDialog = (row) => {
  currentReview.value = row
  reviewNote.value = ''
  showRejectDialog.value = true
}

const confirmReview = async (status) => {
  try {
    await clubs.reviewAnnual(currentReview.value.id, { status, review_note: reviewNote.value })
    ElMessage.success('审核完成')
    showRejectDialog.value = false
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', passed: 'success', failed: 'danger' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审核', passed: '已通过', failed: '未通过' }
  return map[status] || status
}

onMounted(loadData)
</script>
