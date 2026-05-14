<template>
  <div class="reviews-page">
    <h2 class="page-title">内容审核</h2>
    
    <div class="filter-bar">
      <el-select v-model="statusFilter" placeholder="状态" @change="loadReviews" style="width: 150px;">
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>
      
      <el-select v-model="targetTypeFilter" placeholder="类型" clearable @change="loadReviews" style="width: 150px;">
        <el-option label="产品吧" value="bar" />
        <el-option label="帖子" value="post" />
      </el-select>
    </div>
    
    <div v-if="loading" class="page-loading">
      <el-skeleton :rows="4" animated />
    </div>
    
    <div v-else-if="reviews.length === 0" class="page-empty">
      <el-empty description="暂无审核内容" />
    </div>
    
    <div v-else class="review-list">
      <el-card v-for="review in reviews" :key="review.id" class="review-card">
        <div class="review-header">
          <div class="review-type">
            <el-tag :type="review.target_type === 'bar' ? 'primary' : 'success'">
              {{ review.target_type === 'bar' ? '产品吧' : '帖子' }}
            </el-tag>
            <el-tag :type="statusTagType(review.status)" size="small">
              {{ statusText(review.status) }}
            </el-tag>
          </div>
          <div class="review-meta">
            <span>提交者: {{ review.submitter_nickname }}</span>
            <span>{{ formatTime(review.created_at) }}</span>
          </div>
        </div>
        
        <div class="review-target">
          <h4>{{ review.target_info?.name || review.target_info?.title }}</h4>
          <p v-if="review.reason" class="review-reason">{{ review.reason }}</p>
        </div>
        
        <div v-if="review.status === 'pending'" class="review-actions">
          <el-input
            v-model="rejectReasons[review.id]"
            placeholder="拒绝理由（可选）"
            style="width: 300px; margin-right: 12px;"
          />
          <el-button type="success" @click="approve(review)">通过</el-button>
          <el-button type="danger" @click="reject(review)">拒绝</el-button>
        </div>
        
        <div v-else class="review-result">
          <span>处理人: {{ review.reviewer_nickname || '-' }}</span>
          <span v-if="review.remark">备注: {{ review.remark }}</span>
        </div>
      </el-card>
    </div>
    
    <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="loadReviews"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/utils/api'

const loading = ref(false)
const statusFilter = ref('pending')
const targetTypeFilter = ref('')
const reviews = ref([])
const rejectReasons = ref({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

function statusText(status) {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || '未知'
}

function statusTagType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function loadReviews() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value
    }
    if (targetTypeFilter.value) {
      params.target_type = targetTypeFilter.value
    }
    
    const res = await api.get('/operator/reviews', { params })
    if (res.success) {
      reviews.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载审核列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function approve(review) {
  try {
    await ElMessageBox.confirm('确定通过此审核？', '提示', { type: 'success' })
    
    const res = await api.post(`/operator/reviews/${review.id}/approve`)
    if (res.success) {
      ElMessage.success('审核通过')
      loadReviews()
    }
  } catch (e) {
    console.error('审核失败:', e)
  }
}

async function reject(review) {
  try {
    await ElMessageBox.confirm('确定拒绝此审核？', '提示', { type: 'warning' })
    
    const res = await api.post(`/operator/reviews/${review.id}/reject`, {
      reason: rejectReasons.value[review.id] || '内容不符合规范'
    })
    if (res.success) {
      ElMessage.success('已拒绝')
      loadReviews()
    }
  } catch (e) {
    console.error('拒绝失败:', e)
  }
}

onMounted(() => {
  loadReviews()
})
</script>

<style scoped>
.reviews-page {
  min-height: 100%;
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 24px;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  transition: box-shadow 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.review-type {
  display: flex;
  gap: 8px;
}

.review-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.review-target h4 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.review-reason {
  font-size: 14px;
  color: #909399;
}

.review-actions {
  display: flex;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.review-result {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>
