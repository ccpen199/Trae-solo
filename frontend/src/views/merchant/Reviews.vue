<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">评价管理</h2>
      <p class="page-subtitle">查看并回复客户评价</p>
    </div>

    <el-card class="card-shadow">
      <div class="review-item" v-for="review in reviews" :key="review.id">
        <div class="review-header flex-between">
          <div class="reviewer-info">
            <el-avatar>{{ review.couple_name?.charAt(0) || 'U' }}</el-avatar>
            <span class="reviewer-name">{{ review.couple_name }}</span>
            <el-rate v-model="review.rating" disabled size="small" style="margin-left: 12px;" />
            <el-tag v-if="review.is_negative" type="danger" size="small" style="margin-left: 12px;">差评</el-tag>
          </div>
          <span class="review-date">{{ review.created_at }}</span>
        </div>
        <div class="review-content">{{ review.content }}</div>
        <div v-if="review.merchant_reply" class="reply-box">
          <div class="reply-label">商家回复：</div>
          <div class="reply-content">{{ review.merchant_reply }}</div>
        </div>
        <div v-else class="reply-action">
          <el-input
            v-model="replyMap[review.id]"
            type="textarea"
            :rows="2"
            placeholder="请输入回复内容"
            style="width: 100%; margin-bottom: 10px;"
          />
          <el-button type="primary" size="small" @click="submitReply(review.id)">回复</el-button>
        </div>
      </div>
      <el-empty v-if="reviews.length === 0" description="暂无评价" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const reviews = ref([])
const replyMap = reactive({})

async function loadReviews() {
  try {
    const res = await api.get('/merchant/reviews')
    reviews.value = res.data
    res.data.forEach(r => {
      replyMap[r.id] = ''
    })
  } catch (e) {
    console.error(e)
  }
}

async function submitReply(id) {
  try {
    await api.post(`/merchant/reviews/${id}/reply`, { merchant_reply: replyMap[id] })
    ElMessage.success('回复成功')
    loadReviews()
  } catch (e) {
    ElMessage.error('回复失败')
  }
}

onMounted(() => {
  loadReviews()
})
</script>

<style scoped lang="scss">
.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .review-header {
    margin-bottom: 12px;
    
    .reviewer-info {
      display: flex;
      align-items: center;
      
      .reviewer-name {
        margin-left: 12px;
        font-weight: 500;
        color: #303133;
      }
    }
    
    .review-date {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .review-content {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    line-height: 1.6;
  }
  
  .reply-box {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    
    .reply-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }
    
    .reply-content {
      font-size: 14px;
      color: #606266;
    }
  }
  
  .reply-action {
    margin-top: 12px;
  }
}
</style>
