<template>
  <div class="container">
    <h2 class="section-title">💬 留言板</h2>
    
    <div class="guestbook-form">
      <h3 style="margin-bottom: 1rem;">📝 发表留言</h3>
      
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      
      <div class="form-group">
        <label class="form-label">姓名 *</label>
        <input 
          type="text" 
          class="form-input" 
          v-model="formData.name" 
          placeholder="请输入您的姓名"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">邮箱（可选）</label>
        <input 
          type="email" 
          class="form-input" 
          v-model="formData.email" 
          placeholder="请输入您的邮箱"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">留言内容 *</label>
        <textarea 
          class="form-textarea" 
          v-model="formData.content" 
          placeholder="请输入您的留言内容..."
          rows="4"
        ></textarea>
      </div>
      
      <button class="btn btn-primary" @click="submitMessage" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交留言' }}
      </button>
    </div>
    
    <h3 class="section-title">📋 已审核留言</h3>
    
    <div class="message-list" v-if="messages.length">
      <div v-for="msg in messages" :key="msg.id" class="message-item">
        <div class="message-header">
          <span class="message-author">{{ msg.name }}</span>
          <span class="message-date">{{ formatDate(msg.created_at) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
        <div v-if="msg.reply" class="message-reply">
          <div class="message-reply-label">💬 站长回复：</div>
          {{ msg.reply }}
        </div>
      </div>
    </div>
    
    <p v-else class="card card-body">暂无已审核的留言</p>
    
    <div class="pagination" v-if="totalPages > 1">
      <button class="pagination-btn" :disabled="page === 1" @click="page--">上一页</button>
      <span style="padding: 0.5rem 1rem;">第 {{ page }} 页</span>
      <button class="pagination-btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { messagesApi } from '@/api'

const formData = ref({
  name: '',
  email: '',
  content: ''
})

const messages = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const totalPages = computed(() => Math.ceil(total.value / limit.value))

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadMessages() {
  try {
    const res = await messagesApi.getList({ page: page.value, limit: limit.value, status: 1 })
    if (res.data.success) {
      messages.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('加载留言列表失败:', error)
  }
}

async function submitMessage() {
  if (!formData.value.name.trim() || !formData.value.content.trim()) {
    errorMessage.value = '姓名和留言内容不能为空'
    return
  }
  
  successMessage.value = ''
  errorMessage.value = ''
  submitting.value = true
  
  try {
    const res = await messagesApi.submit({
      name: formData.value.name.trim(),
      email: formData.value.email.trim(),
      content: formData.value.content.trim()
    })
    
    if (res.data.success) {
      successMessage.value = res.data.message
      formData.value = { name: '', email: '', content: '' }
      
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = res.data.message || '提交失败'
    }
  } catch (error) {
    if (error.response?.status === 429) {
      errorMessage.value = '请求过于频繁，请稍后再试'
    } else {
      errorMessage.value = error.response?.data?.message || '提交失败，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}

watch(page, () => {
  loadMessages()
})

onMounted(() => {
  loadMessages()
})

onActivated(() => {
  loadMessages()
})
</script>
