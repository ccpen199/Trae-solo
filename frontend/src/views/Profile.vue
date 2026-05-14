<template>
  <div class="main-layout" v-if="user">
    <div class="profile-header" :style="{ background: user.planet?.color || '#667eea' }">
      <el-button class="back-btn" @click="$router.back()" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="avatar-large" :style="{ background: getAvatarColor(user.id) }">
        {{ getAvatarEmoji(user.id) }}
      </div>
    </div>

    <div class="profile-content">
      <div class="basic-info">
        <h2>{{ user.gender === 'male' ? '♂' : '♀' }} {{ user.age || '?' }}岁</h2>
        <div class="tags">
          <span class="tag">{{ user.constellation }}</span>
          <span class="tag" :style="{ background: user.planet?.color }">{{ user.planet?.name }}</span>
        </div>
        <p class="signature" v-if="user.signature">{{ user.signature }}</p>
      </div>

      <div class="action-buttons">
        <el-button type="primary" size="large" @click="startChat">
          <el-icon><ChatDotRound /></el-icon>
          开始聊天
        </el-button>
        <el-button size="large" @click="followUser">
          <el-icon><Plus /></el-icon>
          关注
        </el-button>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/')">
        <el-icon><Planet /></el-icon>
        <span>星球</span>
      </div>
      <div class="nav-item" @click="$router.push('/square')">
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
  </div>

  <div v-else class="loading-page">
    <el-icon class="is-loading" :size="40"><Loading /></el-icon>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, ChatDotRound, Plus, Planet, Document, Connection, Loading } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()

const user = ref(null)

const avatarColors = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24',
  '#a78bfa', '#fb7185', '#2dd4bf', '#f97316'
]

const avatarEmojis = ['🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯', '🐻']

const getAvatarColor = (id) => avatarColors[(id - 1) % avatarColors.length]
const getAvatarEmoji = (id) => avatarEmojis[(id - 1) % avatarEmojis.length]

const fetchUser = async () => {
  try {
    const res = await request.get(`/users/${route.params.userId}`)
    user.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const startChat = () => {
  router.push(`/chat/${user.value.id}`)
}

const followUser = async () => {
  try {
    await request.post(`/follow/${route.params.userId}`)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped>
.profile-header {
  height: 200px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  border: 4px solid white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.profile-content {
  padding: 20px;
  margin-top: -30px;
  position: relative;
  z-index: 1;
}

.basic-info {
  background: white;
  border-radius: 20px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.basic-info h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
}

.tags {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.tag {
  background: #f3f4f6;
  color: #666;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
}

.tag:nth-child(2) {
  color: white;
}

.signature {
  color: #666;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.action-buttons .el-button {
  flex: 1;
}

.loading-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
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
