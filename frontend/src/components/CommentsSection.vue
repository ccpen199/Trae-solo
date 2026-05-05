<template>
  <div class="comments-section">
    <div class="comment-stats" v-if="stats.total > 0">
      <div class="stat-item">
        <span class="stat-label">总评论</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">好评率</span>
        <span class="stat-value">{{ stats.goodRate || 100 }}%</span>
      </div>
      <div class="rating-display">
        <el-rate v-model="stats.avgRating" disabled show-score text-color="#ff9900" />
      </div>
    </div>
    
    <div class="comment-form" v-if="userStore.isLoggedIn">
      <h4>发表评论</h4>
      <el-form :model="commentForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="commentForm.rating" show-score text-color="#ff9900" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input 
            v-model="commentForm.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入您的评价..."
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="submitting"
            @click="handleSubmit"
          >
            发表评论
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="comment-login-tip" v-else>
      <el-alert
        title="登录后才能发表评论"
        type="warning"
        show-icon
        :closable="false"
      >
        <template #default>
          <router-link to="/login" style="color: #667eea;">立即登录</router-link>
        </template>
      </el-alert>
    </div>
    
    <div class="comments-list" v-loading="loading">
      <div class="comment-item" v-for="comment in comments" :key="comment.id">
        <div class="comment-header">
          <el-avatar :size="40" icon="UserFilled" />
          <div class="comment-user">
            <div class="user-name">{{ comment.user?.realName || comment.user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '匿名用户' }}</div>
            <div class="comment-time">
              {{ formatTime(comment.createdAt) }}
            </div>
          </div>
          <div class="comment-rating">
            <el-rate v-model="comment.rating" disabled show-score text-color="#ff9900" />
          </div>
        </div>
        <div class="comment-content">
          {{ comment.content }}
        </div>
        <div class="comment-actions">
          <el-button 
            type="text" 
            :class="{ 'liked': comment.isLiked }"
            @click="handleLike(comment)"
          >
            <el-icon><HandThumbUp /></el-icon>
            {{ comment.likeCount || 0 }}
          </el-button>
          <el-button type="text" @click="toggleReply(comment)">
            <el-icon><ChatDotRound /></el-icon>
            回复
          </el-button>
        </div>
        
        <div class="comment-reply" v-if="replyTo === comment.id">
          <el-input 
            v-model="replyContent" 
            type="textarea" 
            :rows="2" 
            placeholder="输入回复内容..."
            size="small"
          />
          <div class="reply-actions">
            <el-button size="small" type="primary" :loading="replying" @click="handleReply(comment)">
              发送
            </el-button>
            <el-button size="small" @click="cancelReply">
              取消
            </el-button>
          </div>
        </div>
        
        <div class="replies" v-if="comment.replies && comment.replies.length">
          <div class="reply-item" v-for="reply in comment.replies" :key="reply.id">
            <div class="reply-header">
              <span class="reply-user">{{ reply.user?.realName || '管理员' }}</span>
              <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
          </div>
        </div>
      </div>
      
      <el-empty v-if="comments.length === 0 && !loading" description="暂无评论" />
      
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { commentApi } from '@/api/comment'
import { useUserStore } from '@/store/user'

const props = defineProps({
  packageId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const replying = ref(false)
const comments = ref([])
const stats = ref({ total: 0, avgRating: 0, goodRate: 100 })
const total = ref(0)
const replyTo = ref(null)
const replyContent = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const commentForm = reactive({
  rating: 5,
  content: ''
})

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const fetchComments = async () => {
  if (!props.packageId) return
  
  loading.value = true
  try {
    const result = await commentApi.getList({
      packageId: props.packageId,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    comments.value = result.data.list || []
    stats.value = result.data.stats || { total: 0, avgRating: 0, goodRate: 100 }
    total.value = result.data.total || 0
  } catch (error) {
    console.error('获取评论列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  if (!commentForm.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  submitting.value = true
  try {
    await commentApi.create({
      packageId: props.packageId,
      rating: commentForm.rating,
      content: commentForm.content
    })
    ElMessage.success('评论发表成功')
    commentForm.content = ''
    commentForm.rating = 5
    pagination.page = 1
    fetchComments()
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error(error.response?.data?.message || '发表评论失败')
  } finally {
    submitting.value = false
  }
}

const handleLike = async (comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    if (comment.isLiked) {
      await commentApi.unlike(comment.id)
      comment.likeCount = (comment.likeCount || 0) - 1
    } else {
      await commentApi.like(comment.id)
      comment.likeCount = (comment.likeCount || 0) + 1
    }
    comment.isLiked = !comment.isLiked
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const toggleReply = (comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  replyTo.value = replyTo.value === comment.id ? null : comment.id
  replyContent.value = ''
}

const cancelReply = () => {
  replyTo.value = null
  replyContent.value = ''
}

const handleReply = async (comment) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replying.value = true
  try {
    await commentApi.reply(comment.id, {
      content: replyContent.value
    })
    ElMessage.success('回复成功')
    cancelReply()
    fetchComments()
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

const handlePageChange = () => {
  fetchComments()
}

watch(() => props.packageId, () => {
  pagination.page = 1
  fetchComments()
})

onMounted(() => {
  fetchComments()
})
</script>

<style scoped>
.comments-section {
  padding: 10px;
}

.comment-stats {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}

.rating-display {
  display: flex;
  align-items: center;
}

.comment-form {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-form h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

.comment-login-tip {
  margin-bottom: 30px;
}

.comments-list {
  min-height: 200px;
}

.comment-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.comment-user {
  margin-left: 12px;
  flex: 1;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.comment-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.comment-actions .el-button {
  color: #909399;
}

.comment-actions .el-button.liked {
  color: #667eea;
}

.comment-actions .el-button:hover {
  color: #667eea;
}

.comment-reply {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.replies {
  margin-top: 15px;
  margin-left: 52px;
  padding-left: 15px;
  border-left: 2px solid #e4e7ed;
}

.reply-item {
  padding: 10px 0;
}

.reply-header {
  margin-bottom: 8px;
}

.reply-user {
  font-size: 13px;
  color: #667eea;
  font-weight: bold;
}

.reply-time {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.reply-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}
</style>
