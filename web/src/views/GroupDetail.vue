<template>
  <div class="group-detail-page">
    <div class="container" v-loading="loading">
      <el-skeleton :loading="loading" animated>
        <template #default>
          <div class="group-header">
            <div class="group-info">
              <el-avatar :size="100" class="group-avatar">
                <img v-if="group.avatar" :src="group.avatar" />
                <el-icon v-else size="50"><ChatDotRound /></el-icon>
              </el-avatar>
              <div class="group-details">
                <h1 class="group-name">{{ group.name }}</h1>
                <p class="group-desc">{{ group.description || '暂无描述' }}</p>
                <div class="group-stats">
                  <span>{{ group.memberCount }} 成员</span>
                  <span>{{ group.postCount }} 帖子</span>
                </div>
              </div>
            </div>
            <div class="group-actions">
              <el-button 
                v-if="!isJoined" 
                type="primary" 
                :loading="joining"
                @click="handleJoin"
              >
                加入小组
              </el-button>
              <el-button v-else type="success" disabled>
                <el-icon><Check /></el-icon>
                已加入
              </el-button>
            </div>
          </div>

          <div class="group-content">
            <div class="content-header">
              <h2>小组帖子</h2>
              <el-button v-if="isJoined" type="primary" @click="showPostDialog = true">
                <el-icon><Edit /></el-icon>
                发布帖子
              </el-button>
            </div>

            <div class="posts-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-item"
              >
                <div class="post-header">
                  <el-avatar :size="40">
                    <img v-if="post.author?.avatar" :src="post.author?.avatar" />
                    <el-icon v-else><User /></el-icon>
                  </el-avatar>
                  <div class="post-author-info">
                    <span class="author-name">{{ post.author?.nickname || post.author?.username }}</span>
                    <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                  </div>
                </div>
                <div class="post-content">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <p class="post-body">{{ post.content }}</p>
                </div>
                <div class="post-meta">
                  <span><el-icon><View /></el-icon> {{ post.viewCount }}</span>
                  <span><el-icon><ChatLineRound /></el-icon> {{ post.commentCount }}</span>
                  <span><el-icon><Star /></el-icon> {{ post.likeCount }}</span>
                </div>
              </div>

              <el-empty v-if="!postsLoading && posts.length === 0" description="暂无帖子" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <el-dialog
      v-model="showPostDialog"
      title="发布帖子"
      width="600px"
    >
      <el-form
        ref="postFormRef"
        :model="postForm"
        :rules="postRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入帖子内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPostDialog = false">取消</el-button>
        <el-button type="primary" :loading="posting" @click="handleCreatePost">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getGroupById, joinGroup, getGroupPosts, createGroupPost } from '@/api'
import { ChatDotRound, User, View, ChatLineRound, Star, Check, Edit } from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const postsLoading = ref(false)
const joining = ref(false)
const posting = ref(false)
const showPostDialog = ref(false)
const postFormRef = ref(null)

const group = ref({})
const posts = ref([])
const isJoined = ref(false)

const postForm = reactive({
  title: '',
  content: ''
})

const postRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString('zh-CN')
}

const fetchGroup = async () => {
  loading.value = true
  try {
    const res = await getGroupById(route.params.id)
    group.value = res.data?.group || {}
  } catch (e) {
    console.error('Fetch group error:', e)
  } finally {
    loading.value = false
  }
}

const fetchPosts = async () => {
  postsLoading.value = true
  try {
    const res = await getGroupPosts(route.params.id, { page: 1, limit: 20 })
    posts.value = res.data?.posts || []
  } catch (e) {
    console.error('Fetch posts error:', e)
  } finally {
    postsLoading.value = false
  }
}

const handleJoin = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  joining.value = true
  try {
    await joinGroup(route.params.id)
    ElMessage.success('已加入小组')
    isJoined.value = true
  } catch (e) {
    console.error('Join group error:', e)
  } finally {
    joining.value = false
  }
}

const handleCreatePost = async () => {
  const valid = await postFormRef.value?.validate().catch(() => false)
  if (!valid) return
  
  posting.value = true
  try {
    await createGroupPost(route.params.id, postForm)
    ElMessage.success('帖子发布成功')
    showPostDialog.value = false
    postForm.title = ''
    postForm.content = ''
    fetchPosts()
  } catch (e) {
    console.error('Create post error:', e)
  } finally {
    posting.value = false
  }
}

onMounted(() => {
  fetchGroup()
  fetchPosts()
})
</script>

<style scoped>
.group-detail-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  background: #f5f7fa;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.group-header {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.group-info {
  display: flex;
  gap: 24px;
}

.group-avatar {
  background: #f5f7fa;
}

.group-details {
  flex: 1;
}

.group-name {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.group-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 16px;
}

.group-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #909399;
}

.group-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.content-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-item {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.post-time {
  font-size: 12px;
  color: #909399;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.post-body {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.post-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
