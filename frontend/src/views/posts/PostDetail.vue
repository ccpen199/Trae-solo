<template>
  <div class="post-detail-page">
    <div class="container">
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="8" animated />
      </div>
      
      <div v-else-if="error" class="page-error">
        <el-empty description="加载失败">
          <el-button type="primary" @click="loadPost">重试</el-button>
        </el-empty>
      </div>
      
      <template v-else-if="post">
        <div class="post-header">
          <div class="post-breadcrumb">
            <router-link :to="`/bars/${post.bar_id}`">{{ post.bar_name }}</router-link>
            <span class="separator">/</span>
            <span>{{ post.column_name || '帖子' }}</span>
          </div>
          
          <h1 class="post-title">
            <el-tag v-if="post.is_top" type="danger" size="small" style="margin-right: 8px;">置顶</el-tag>
            <el-tag v-if="post.is_recommended" type="warning" size="small" style="margin-right: 8px;">精华</el-tag>
            {{ post.title }}
          </h1>
          
          <div class="post-meta">
            <span class="author">
              <el-avatar :size="24" :src="post.author_avatar">
                {{ (post.author_nickname || 'U').charAt(0) }}
              </el-avatar>
              {{ post.author_nickname }}
            </span>
            <span class="time">{{ formatTime(post.created_at) }}</span>
            <span class="views"><el-icon><View /></el-icon> {{ post.view_count || 0 }}</span>
            <span class="likes"><el-icon><Star /></el-icon> {{ post.like_count || 0 }}</span>
            <span class="comments"><el-icon><ChatDotRound /></el-icon> {{ post.comment_count || 0 }}</span>
            <span class="tag" v-if="post.source">来源: {{ post.source }}</span>
          </div>
        </div>
        
        <div class="post-content">
          <el-card>
            <div class="content-body" v-html="formatContent(post.content)"></div>
            
            <div class="post-actions">
              <el-button type="primary" :icon="Star" @click="likePost">
                点赞
              </el-button>
              <el-button @click="showReportDialog = true">
                举报
              </el-button>
            </div>
          </el-card>
        </div>
        
        <div class="comments-section">
          <h3>评论 ({{ commentPagination.total }})</h3>
          
          <div v-if="userStore.isLoggedIn" class="comment-input">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="写下你的评论..."
              maxlength="500"
              show-word-limit
            />
            <div class="comment-actions">
              <el-button
                type="primary"
                :loading="submittingComment"
                :disabled="!newComment.trim() || submittingComment"
                @click="submitComment"
              >
                发表评论
              </el-button>
            </div>
          </div>
          <div v-else class="comment-login-hint">
            <router-link to="/login">登录</router-link> 后参与评论
          </div>
          
          <div v-if="loadingComments" class="page-loading">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="comments.length === 0" class="page-empty">
            <el-empty description="暂无评论，快来抢沙发！" />
          </div>
          
          <div v-else class="comment-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
              <el-avatar :size="36" :src="comment.user_avatar">
                {{ (comment.user_nickname || 'U').charAt(0) }}
              </el-avatar>
              <div class="comment-body">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.user_nickname }}</span>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
              </div>
            </div>
          </div>
          
          <div v-if="commentPagination.total > commentPagination.pageSize" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="commentPagination.page"
              :page-size="commentPagination.pageSize"
              :total="commentPagination.total"
              layout="prev, pager, next"
              @current-change="loadComments"
            />
          </div>
        </div>
      </template>
    </div>
    
    <el-dialog v-model="showReportDialog" title="举报" width="400px">
      <el-form :model="reportForm" label-width="80px">
        <el-form-item label="举报类型">
          <el-select v-model="reportForm.reason_category" placeholder="请选择类型">
            <el-option label="广告" value="ad" />
            <el-option label="色情" value="porn" />
            <el-option label="政治" value="political" />
            <el-option label="暴力" value="violence" />
            <el-option label="诈骗" value="fraud" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="举报理由">
          <el-input
            v-model="reportForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细描述举报理由"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingReport" @click="submitReport">
          提交举报
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { View, Star, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const error = ref(false)
const loadingComments = ref(false)
const submittingComment = ref(false)
const submittingReport = ref(false)
const showReportDialog = ref(false)
const post = ref(null)
const comments = ref([])
const newComment = ref('')

const commentPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const reportForm = reactive({
  reason_category: 'other',
  reason: ''
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function formatContent(content) {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/ /g, '&nbsp;')
}

async function loadPost() {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/posts/${route.params.id}`)
    if (res.success) {
      post.value = res.data
      loadComments()
    }
  } catch (e) {
    console.error('加载帖子失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  loadingComments.value = true
  try {
    const res = await api.get(`/posts/${route.params.id}/comments`, {
      params: {
        page: commentPagination.page,
        pageSize: commentPagination.pageSize
      }
    })
    if (res.success) {
      comments.value = res.data.list || []
      commentPagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载评论失败:', e)
  } finally {
    loadingComments.value = false
  }
}

async function likePost() {
  try {
    const res = await api.post(`/posts/${route.params.id}/like`)
    if (res.success) {
      post.value.like_count = (post.value.like_count || 0) + 1
      ElMessage.success('点赞成功')
    }
  } catch (e) {
    console.error('点赞失败:', e)
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  
  submittingComment.value = true
  try {
    const res = await api.post(`/posts/${route.params.id}/comments`, {
      content: newComment.value
    })
    if (res.success) {
      ElMessage.success('评论成功')
      newComment.value = ''
      post.value.comment_count = (post.value.comment_count || 0) + 1
      commentPagination.page = 1
      loadComments()
    }
  } catch (e) {
    console.error('评论失败:', e)
  } finally {
    submittingComment.value = false
  }
}

async function submitReport() {
  if (!reportForm.reason_category || !reportForm.reason.trim()) {
    ElMessage.warning('请填写完整举报信息')
    return
  }
  
  submittingReport.value = true
  try {
    const res = await api.post('/reports', {
      target_type: 'post',
      target_id: route.params.id,
      reason_category: reportForm.reason_category,
      reason: reportForm.reason
    })
    if (res.success) {
      ElMessage.success('举报已提交')
      showReportDialog.value = false
      reportForm.reason = ''
    }
  } catch (e) {
    console.error('举报失败:', e)
  } finally {
    submittingReport.value = false
  }
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped>
.post-detail-page {
  padding: 30px 0;
}

.post-header {
  margin-bottom: 30px;
}

.post-breadcrumb {
  font-size: 14px;
  color: #909399;
  margin-bottom: 16px;
}

.post-breadcrumb a {
  color: #409eff;
}

.post-breadcrumb .separator {
  margin: 0 8px;
}

.post-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 16px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  color: #909399;
}

.post-meta .author {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.post-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.post-content {
  margin-bottom: 30px;
}

.content-body {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.comments-section h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #303133;
}

.comment-input {
  margin-bottom: 30px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.comment-login-hint {
  text-align: center;
  padding: 20px;
  color: #909399;
  margin-bottom: 30px;
}

.comment-login-hint a {
  color: #409eff;
}

.comment-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-user {
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
