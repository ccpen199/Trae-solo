<template>
  <div class="square-page">
    <div class="header">
      <h1>广场</h1>
      <el-button type="primary" size="small" @click="showPost = true">
        <el-icon><Plus /></el-icon>
        发布
      </el-button>
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
      </div>
      <div v-else-if="posts.length === 0" class="empty">
        <el-icon :size="60"><Document /></el-icon>
        <p>暂无动态</p>
      </div>
      <div v-else class="post-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <div class="post-header">
            <div class="avatar" :style="{ background: getAvatarColor(post.user_id) }">
              {{ getAvatarEmoji(post.user_id) }}
            </div>
            <div class="info">
              <div class="name">用户{{ post.user_id }}</div>
              <div class="planet-tag" :style="{ background: post.planet_color }" v-if="post.planet_name">
                {{ post.planet_name }}
              </div>
            </div>
          </div>
          <div class="post-content">
            <p>{{ post.content }}</p>
            <div class="tags" v-if="post.tags && post.tags.length">
              <span class="tag" v-for="tag in post.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="post-actions">
            <div class="action" @click="likePost(post)">
              <el-icon><Heart :style="{ color: post.liked ? '#f472b6' : '#999' }" /></el-icon>
              <span>{{ post.likes_count || 0 }}</span>
            </div>
            <div class="action" @click="showComments(post)">
              <el-icon><ChatDotRound /></el-icon>
              <span>{{ post.comments_count || 0 }}</span>
            </div>
            <div class="action">
              <el-icon><Share /></el-icon>
              <span>{{ post.shares_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/')">
        <el-icon><Planet /></el-icon>
        <span>星球</span>
      </div>
      <div class="nav-item active">
        <el-icon><Document /></el-icon>
        <span>广场</span>
      </div>
      <div class="nav-item match-btn" @click="$router.push('/match')">
        <el-icon><Connection /></el-icon>
        <span>匹配</span>
      </div>
      <div class="nav-item" @click="$router.push('/messages')">
        <el-icon><ChatDotRound /></el-icon>
        <span>消息</span>
      </div>
    </div>

    <el-dialog v-model="showPost" title="发布动态" width="90%">
      <el-input
        v-model="newPostContent"
        type="textarea"
        :rows="4"
        placeholder="分享你的想法..."
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showPost = false">取消</el-button>
        <el-button type="primary" :loading="posting" @click="createPost">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCommentsDialog" title="评论" width="90%">
      <div class="comments-list" v-if="currentPost">
        <div v-if="commentsLoading" class="comments-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
        <div v-else-if="comments.length === 0" class="comments-empty">
          暂无评论
        </div>
        <div v-else class="comment-item" v-for="comment in comments" :key="comment.id">
          <div class="comment-avatar" :style="{ background: getAvatarColor(comment.user_id) }">
            {{ getAvatarEmoji(comment.user_id) }}
          </div>
          <div class="comment-content">
            <div class="comment-name">用户{{ comment.user_id }}</div>
            <div class="comment-text">{{ comment.content }}</div>
          </div>
        </div>
      </div>
      <div class="comment-input-area">
        <el-input
          v-model="newComment"
          placeholder="输入评论..."
          @keyup.enter="addComment"
        >
          <template #append>
            <el-button :loading="commenting" @click="addComment">发送</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Plus, Loading, Document, Heart, ChatDotRound, Share, Planet, Connection } from '@element-plus/icons-vue'
import request from '../utils/request'

const tabs = [
  { label: '最新', value: 'latest' },
  { label: '推荐', value: 'hot' },
  { label: '关注', value: 'follow' }
]

const currentTab = ref('latest')
const loading = ref(true)
const posting = ref(false)
const commenting = ref(false)
const commentsLoading = ref(false)
const posts = ref([])
const comments = ref([])
const showPost = ref(false)
const showCommentsDialog = ref(false)
const newPostContent = ref('')
const newComment = ref('')
const currentPost = ref(null)

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const fetchPosts = async () => {
  try {
    loading.value = true
    let res
    if (currentTab.value === 'follow') {
      res = await request.get('/posts/follow')
    } else {
      res = await request.get('/posts', { params: { type: currentTab.value } })
    }
    posts.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const createPost = async () => {
  if (!newPostContent.value.trim()) return
  
  try {
    posting.value = true
    await request.post('/posts', {
      content: newPostContent.value,
      type: 'text',
      tags: []
    })
    newPostContent.value = ''
    showPost.value = false
    await fetchPosts()
  } catch (e) {
    console.error(e)
  } finally {
    posting.value = false
  }
}

const likePost = async (post) => {
  try {
    if (post.liked) {
      await request.delete(`/posts/${post.id}/like`)
      post.likes_count = Math.max(0, (post.likes_count || 0) - 1)
      post.liked = false
    } else {
      await request.post(`/posts/${post.id}/like`)
      post.likes_count = (post.likes_count || 0) + 1
      post.liked = true
    }
  } catch (e) {
    console.error(e)
  }
}

const showComments = async (post) => {
  currentPost.value = post
  showCommentsDialog.value = true
  await fetchComments(post.id)
}

const fetchComments = async (postId) => {
  try {
    commentsLoading.value = true
    const res = await request.get(`/posts/${postId}/comments`)
    comments.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    commentsLoading.value = false
  }
}

const addComment = async () => {
  if (!newComment.value.trim() || !currentPost.value) return
  
  try {
    commenting.value = true
    await request.post(`/posts/${currentPost.value.id}/comments`, {
      content: newComment.value
    })
    newComment.value = ''
    currentPost.value.comments_count = (currentPost.value.comments_count || 0) + 1
    await fetchComments(currentPost.value.id)
  } catch (e) {
    console.error(e)
  } finally {
    commenting.value = false
  }
}

watch(currentTab, () => {
  fetchPosts()
})

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.square-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 24px;
  margin: 0;
}

.header .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.tabs {
  background: white;
  display: flex;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.tab {
  padding: 15px 20px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #667eea;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.content {
  padding: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty .el-icon {
  margin-bottom: 15px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-item {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.info {
  flex: 1;
}

.name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.planet-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
}

.post-content p {
  color: #333;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tags .tag {
  background: #f3f4f6;
  color: #666;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
}

.post-actions {
  display: flex;
  gap: 30px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.action:hover {
  color: #667eea;
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.comments-loading, .comments-empty {
  text-align: center;
  padding: 30px;
  color: #999;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-item.active {
  color: #667eea;
}

.nav-item.match-btn {
  color: #667eea;
}

.nav-item.match-btn .el-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -8px;
}
</style>
