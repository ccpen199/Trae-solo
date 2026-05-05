<template>
  <div class="container">
    <h2 class="section-title">⚙️ 后台管理</h2>
    
    <div class="admin-stats" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.articles }}</div>
        <div class="stat-label">📝 已发布文章</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.albums }}</div>
        <div class="stat-label">📷 相册数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.pendingMessages }}</div>
        <div class="stat-label">💬 待审核留言</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalViews }}</div>
        <div class="stat-label">👁 总浏览量</div>
      </div>
    </div>
    
    <div class="admin-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="admin-tab"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div v-if="activeTab === 'articles'">
      <div class="card card-body" style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">📝 新增文章</h3>
        <div class="form-group">
          <label class="form-label">标题</label>
          <input type="text" class="form-input" v-model="newArticle.title" placeholder="文章标题" />
        </div>
        <div class="form-group">
          <label class="form-label">分类</label>
          <select class="form-select" v-model="newArticle.category_id">
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">摘要</label>
          <textarea class="form-textarea" v-model="newArticle.summary" placeholder="文章摘要" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea class="form-textarea" v-model="newArticle.content" placeholder="文章内容" rows="6"></textarea>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" v-model="newArticle.is_recommended" /> 推荐文章
          </label>
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" v-model="newArticle.status" /> 立即发布
          </label>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn btn-primary" @click="createArticle">创建文章</button>
        </div>
      </div>
      
      <table class="admin-table" v-if="adminArticles.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>分类</th>
            <th>状态</th>
            <th>推荐</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in adminArticles" :key="article.id">
            <td>{{ article.id }}</td>
            <td>{{ article.title }}</td>
            <td>{{ article.category_name }}</td>
            <td>
              <span :style="{ color: article.status ? '#10b981' : '#f59e0b' }">
                {{ article.status ? '已发布' : '草稿' }}
              </span>
            </td>
            <td>{{ article.is_recommended ? '⭐' : '-' }}</td>
            <td>
              <div class="admin-actions">
                <button 
                  class="btn btn-sm btn-outline" 
                  @click="toggleArticleStatus(article)"
                >
                  {{ article.status ? '下架' : '发布' }}
                </button>
                <button 
                  class="btn btn-sm btn-danger" 
                  @click="deleteArticle(article.id)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="activeTab === 'messages'">
      <h3 style="margin-bottom: 1rem;">💬 留言管理 (待审核: {{ pendingMessages.length }})</h3>
      
      <div class="message-list" v-if="adminMessages.length">
        <div v-for="msg in adminMessages" :key="msg.id" class="message-item">
          <div class="message-header">
            <div>
              <span class="message-author">{{ msg.name }}</span>
              <span v-if="msg.email" style="color: var(--text-muted); margin-left: 1rem;">{{ msg.email }}</span>
              <span v-if="msg.is_sensitive" style="color: #ef4444; margin-left: 1rem; font-size: 0.75rem;">⚠️ 含敏感词</span>
            </div>
            <div>
              <span class="message-date">{{ formatDate(msg.created_at) }}</span>
              <span 
                :style="{ 
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  backgroundColor: msg.status === 1 ? '#d1fae5' : '#fef3c7',
                  color: msg.status === 1 ? '#065f46' : '#92400e'
                }"
              >
                {{ msg.status === 1 ? '已审核' : '待审核' }}
              </span>
            </div>
          </div>
          <div class="message-content">{{ msg.content }}</div>
          <div v-if="msg.reply" class="message-reply">
            <div class="message-reply-label">💬 已回复：</div>
            {{ msg.reply }}
          </div>
          <div style="margin-top: 1rem;">
            <button 
              v-if="msg.status !== 1"
              class="btn btn-sm btn-primary" 
              style="margin-right: 0.5rem;"
              @click="approveMessage(msg.id)"
            >
              ✅ 通过审核
            </button>
            <button 
              class="btn btn-sm btn-outline" 
              style="margin-right: 0.5rem;"
              @click="showReplyInput(msg)"
            >
              💬 回复
            </button>
            <button 
              class="btn btn-sm btn-danger" 
              @click="deleteMessage(msg.id)"
            >
              🗑️ 删除
            </button>
          </div>
          
          <div v-if="replyingMessageId === msg.id" style="margin-top: 1rem;">
            <div class="form-group">
              <textarea 
                class="form-textarea" 
                v-model="replyContent" 
                placeholder="输入回复内容..."
                rows="2"
              ></textarea>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-sm btn-primary" @click="submitReply(msg.id)">发送回复</button>
              <button class="btn btn-sm btn-outline" @click="cancelReply">取消</button>
            </div>
          </div>
        </div>
      </div>
      
      <p v-else class="card card-body">暂无留言</p>
    </div>
    
    <div v-if="activeTab === 'profile'">
      <div class="card card-body">
        <h3 style="margin-bottom: 1rem;">👤 个人信息设置</h3>
        
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input type="text" class="form-input" v-model="profileForm.name" />
          </div>
          <div class="form-group">
            <label class="form-label">职位/头衔</label>
            <input type="text" class="form-input" v-model="profileForm.title" />
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">个人简介</label>
          <textarea class="form-textarea" v-model="profileForm.bio" rows="3"></textarea>
        </div>
        
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input type="email" class="form-input" v-model="profileForm.email" />
          </div>
          <div class="form-group">
            <label class="form-label">所在地</label>
            <input type="text" class="form-input" v-model="profileForm.location" />
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">兴趣爱好</label>
          <textarea class="form-textarea" v-model="profileForm.interests" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">经历</label>
          <textarea class="form-textarea" v-model="profileForm.experience" rows="3"></textarea>
        </div>
        
        <button class="btn btn-primary" @click="updateProfile">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { adminApi, homeApi } from '@/api'

const tabs = [
  { label: '📝 文章管理', value: 'articles' },
  { label: '💬 留言管理', value: 'messages' },
  { label: '👤 个人信息', value: 'profile' }
]

const activeTab = ref('articles')
const stats = ref(null)
const categories = ref([])
const adminArticles = ref([])
const adminMessages = ref([])

const newArticle = ref({
  title: '',
  category_id: 1,
  summary: '',
  content: '',
  is_recommended: false,
  status: false
})

const replyingMessageId = ref(null)
const replyContent = ref('')

const profileForm = ref({
  name: '',
  title: '',
  bio: '',
  email: '',
  location: '',
  interests: '',
  experience: ''
})

const pendingMessages = computed(() => {
  return adminMessages.value.filter(m => m.status === 0)
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadStats() {
  try {
    const res = await adminApi.getStats()
    if (res.data.success) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function loadCategories() {
  try {
    const res = await adminApi.getCategories()
    if (res.data.success) {
      categories.value = res.data.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadAdminArticles() {
  try {
    const res = await adminApi.getArticles({ limit: 20 })
    if (res.data.success) {
      adminArticles.value = res.data.data.list
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
  }
}

async function loadAdminMessages() {
  try {
    const res = await adminApi.getMessages({ limit: 50 })
    if (res.data.success) {
      adminMessages.value = res.data.data.list
    }
  } catch (error) {
    console.error('加载留言列表失败:', error)
  }
}

async function loadProfile() {
  try {
    const res = await homeApi.getProfile()
    if (res.data.success && res.data.data) {
      profileForm.value = { ...res.data.data }
    }
  } catch (error) {
    console.error('加载个人信息失败:', error)
  }
}

async function createArticle() {
  if (!newArticle.value.title.trim()) {
    alert('请输入文章标题')
    return
  }
  
  try {
    const res = await adminApi.createArticle({
      title: newArticle.value.title.trim(),
      category_id: newArticle.value.category_id,
      summary: newArticle.value.summary.trim(),
      content: newArticle.value.content.trim(),
      is_recommended: newArticle.value.is_recommended ? 1 : 0,
      status: newArticle.value.status ? 1 : 0
    })
    
    if (res.data.success) {
      alert('文章创建成功')
      newArticle.value = { title: '', category_id: 1, summary: '', content: '', is_recommended: false, status: false }
      loadAdminArticles()
      loadStats()
    }
  } catch (error) {
    console.error('创建文章失败:', error)
    alert('创建失败')
  }
}

async function toggleArticleStatus(article) {
  try {
    const newStatus = article.status === 1 ? 0 : 1
    const res = await adminApi.updateArticle(article.id, { status: newStatus })
    if (res.data.success) {
      article.status = newStatus
      loadStats()
    }
  } catch (error) {
    console.error('更新文章状态失败:', error)
  }
}

async function deleteArticle(id) {
  if (!confirm('确定要删除这篇文章吗？')) return
  
  try {
    await adminApi.deleteArticle(id)
    loadAdminArticles()
    loadStats()
  } catch (error) {
    console.error('删除文章失败:', error)
  }
}

async function approveMessage(id) {
  try {
    await adminApi.approveMessage(id)
    loadAdminMessages()
    loadStats()
  } catch (error) {
    console.error('审核留言失败:', error)
  }
}

function showReplyInput(msg) {
  replyingMessageId.value = msg.id
  replyContent.value = msg.reply || ''
}

function cancelReply() {
  replyingMessageId.value = null
  replyContent.value = ''
}

async function submitReply(id) {
  if (!replyContent.value.trim()) return
  
  try {
    await adminApi.replyMessage(id, replyContent.value.trim())
    cancelReply()
    loadAdminMessages()
    loadStats()
  } catch (error) {
    console.error('回复留言失败:', error)
  }
}

async function deleteMessage(id) {
  if (!confirm('确定要删除这条留言吗？')) return
  
  try {
    await adminApi.deleteMessage(id)
    loadAdminMessages()
    loadStats()
  } catch (error) {
    console.error('删除留言失败:', error)
  }
}

async function updateProfile() {
  try {
    await adminApi.updateProfile(profileForm.value)
    alert('保存成功')
  } catch (error) {
    console.error('更新个人信息失败:', error)
    alert('保存失败')
  }
}

watch(activeTab, () => {
  if (activeTab.value === 'articles') {
    loadAdminArticles()
  } else if (activeTab.value === 'messages') {
    loadAdminMessages()
  } else if (activeTab.value === 'profile') {
    loadProfile()
  }
})

onMounted(() => {
  loadStats()
  loadCategories()
  loadAdminArticles()
  loadProfile()
})
</script>
