<template>
  <div class="container">
    <div class="profile-card" v-if="profile">
      <div class="profile-avatar">
        {{ profile.name ? profile.name.charAt(0) : '👤' }}
      </div>
      <h2 class="profile-name">{{ profile.name }}</h2>
      <p class="profile-title">{{ profile.title }}</p>
      <p class="profile-bio">{{ profile.bio }}</p>

      <div class="profile-contact">
        <div class="contact-item" v-if="profile.email">
          📧 {{ profile.email }}
        </div>
        <div class="contact-item" v-if="profile.location">
          📍 {{ profile.location }}
        </div>
        <div class="contact-item" v-if="profile.phone">
          📱 {{ profile.phone }}
        </div>
        <div class="contact-item" v-if="profile.github">
          💻 {{ profile.github }}
        </div>
        <div class="contact-item" v-if="profile.website">
          🌐 {{ profile.website }}
        </div>
      </div>

      <div class="profile-section" v-if="profile.interests">
        <h3 class="profile-section-title">🎯 兴趣爱好</h3>
        <p class="profile-section-content">{{ profile.interests }}</p>
      </div>

      <div class="profile-section" v-if="profile.experience">
        <h3 class="profile-section-title">💼 经历</h3>
        <p class="profile-section-content">{{ profile.experience }}</p>
      </div>

      <div style="margin-top: 2rem;">
        <router-link to="/guestbook" class="btn btn-primary">
          💬 给我留言
        </router-link>
      </div>
    </div>
    <div v-else class="card card-body" style="text-align: center;">
      加载中...
    </div>

    <div v-if="messages.length" style="margin-top: 2rem;">
      <h3 class="section-title">💬 最新留言</h3>
      <div class="message-list">
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
      <div style="text-align: center; margin-top: 1rem;">
        <router-link to="/guestbook" class="btn btn-outline btn-sm">
          查看全部留言 →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { homeApi, messagesApi } from '@/api'

const profile = ref(null)
const messages = ref([])

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadProfile() {
  try {
    const res = await homeApi.getProfile()
    if (res.data.success) {
      profile.value = res.data.data
    }
  } catch (error) {
    console.error('加载个人信息失败:', error)
  }
}

async function loadMessages() {
  try {
    const res = await messagesApi.getList({ page: 1, limit: 5, status: 1 })
    if (res.data.success) {
      messages.value = res.data.data.list
    }
  } catch (error) {
    console.error('加载留言失败:', error)
  }
}

async function loadAllData() {
  await Promise.all([loadProfile(), loadMessages()])
}

onMounted(() => {
  loadAllData()
})

onActivated(() => {
  loadAllData()
})
</script>
