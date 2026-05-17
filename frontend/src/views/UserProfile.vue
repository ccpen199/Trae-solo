<template>
  <div class="user-profile">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchUser">重试</el-button>
    </div>
    
    <div v-else-if="user" class="profile-container">
      <div class="profile-header">
        <el-avatar :size="80" :src="user.avatar">
          {{ user.nickname?.charAt(0) || 'U' }}
        </el-avatar>
        <div class="user-info">
          <h2 class="nickname">{{ user.nickname }}</h2>
          <p class="bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
          <div class="stats">
            <span class="stat-item">
              <strong>{{ user.followers_count || 0 }}</strong>
              <span>粉丝</span>
            </span>
            <span class="stat-item">
              <strong>{{ user.following_count || 0 }}</strong>
              <span>关注</span>
            </span>
            <span class="stat-item">
              <strong>{{ user.notes_count || 0 }}</strong>
              <span>笔记</span>
            </span>
          </div>
        </div>
        <div class="action-buttons">
          <el-button 
            :type="isFollowing ? 'default' : 'primary'"
            @click="toggleFollow"
            :loading="followLoading"
          >
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>
      
      <div class="notes-section">
        <h3>TA的笔记</h3>
        <div v-if="notesLoading" class="loading-small">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
        <div v-else-if="notes.length === 0" class="empty-notes">
          <el-icon><Document /></el-icon>
          <p>还没有发布笔记</p>
        </div>
        <div v-else class="notes-grid">
          <NoteCard 
            v-for="note in notes" 
            :key="note.id" 
            :note="note"
            @click="goToDetail(note.id)"
          />
        </div>
      </div>
    </div>
    
    <div v-else class="empty-container">
      <el-icon :size="64"><User /></el-icon>
      <p>用户不存在</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Warning, Document, User } from '@element-plus/icons-vue'
import NoteCard from '@/components/NoteCard.vue'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const followLoading = ref(false)
const notesLoading = ref(true)
const user = ref(null)
const notes = ref([])
const isFollowing = ref(false)

const fetchUser = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get(`/api/users/${route.params.id}`)
    if (res.success) {
      user.value = res.data
      isFollowing.value = res.data.is_following || false
      fetchNotes()
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const fetchNotes = async () => {
  notesLoading.value = true
  try {
    const res = await request.get(`/api/users/${route.params.id}/notes`)
    if (res.success) {
      notes.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to fetch notes:', err)
  } finally {
    notesLoading.value = false
  }
}

const toggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  followLoading.value = true
  try {
    const res = await request.post(`/api/users/${route.params.id}/follow`)
    if (res.success) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/note/${id}`)
}

onMounted(() => {
  fetchUser()
})
</script>

<style scoped lang="scss">
.user-profile {
  padding: 20px;
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #999;
    
    .el-icon {
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 8px 0;
    }
  }
  
  .profile-container {
    max-width: 1000px;
    margin: 0 auto;
    
    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      background: #fff;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      
      .user-info {
        flex: 1;
        
        .nickname {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #333;
        }
        
        .bio {
          margin: 0 0 16px 0;
          color: #666;
          font-size: 14px;
        }
        
        .stats {
          display: flex;
          gap: 32px;
          
          .stat-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            
            strong {
              font-size: 20px;
              font-weight: 600;
              color: #333;
            }
            
            span {
              font-size: 12px;
              color: #999;
            }
          }
        }
      }
    }
    
    .notes-section {
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      
      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .loading-small {
        display: flex;
        justify-content: center;
        padding: 40px;
      }
      
      .empty-notes {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 60px 20px;
        color: #999;
        
        .el-icon {
          margin-bottom: 12px;
          font-size: 48px;
          color: #c0c4cc;
        }
      }
      
      .notes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
      }
    }
  }
}
</style>
