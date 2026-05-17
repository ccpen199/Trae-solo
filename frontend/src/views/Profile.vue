<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchProfile">重试</el-button>
    </div>
    
    <div v-else-if="user" class="profile-container">
      <div class="profile-card">
        <div class="avatar-section">
          <el-avatar :size="100" :src="user.avatar">
            {{ user.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <el-button type="primary" size="small" @click="showEditDialog = true">
            编辑资料
          </el-button>
        </div>
        
        <div class="user-info">
          <h2 class="nickname">{{ user.nickname }}</h2>
          <p class="phone">{{ user.phone }}</p>
          <p class="bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
        </div>
        
        <div class="stats-row">
          <div class="stat-item">
            <strong>{{ user.followers_count || 0 }}</strong>
            <span>粉丝</span>
          </div>
          <div class="stat-item">
            <strong>{{ user.following_count || 0 }}</strong>
            <span>关注</span>
          </div>
          <div class="stat-item">
            <strong>{{ user.notes_count || 0 }}</strong>
            <span>笔记</span>
          </div>
          <div class="stat-item">
            <strong>{{ user.likes_count || 0 }}</strong>
            <span>获赞</span>
          </div>
        </div>
      </div>
      
      <div class="menu-list">
        <div class="menu-item" @click="$router.push('/cart')">
          <el-icon><ShoppingCart /></el-icon>
          <span>购物车</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="$router.push('/orders')">
          <el-icon><Document /></el-icon>
          <span>我的订单</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="$router.push('/messages')">
          <el-icon><ChatDotRound /></el-icon>
          <span>消息中心</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
        <div class="menu-item" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span>退出登录</span>
          <el-icon class="arrow"><ArrowRight /></el-icon>
        </div>
      </div>
      
      <div class="my-notes">
        <h3>我的笔记</h3>
        <div v-if="notesLoading" class="loading-small">
          <el-icon class="is-loading"><Loading /></el-icon>
        </div>
        <div v-else-if="notes.length === 0" class="empty-notes">
          <el-icon><Document /></el-icon>
          <p>还没有发布笔记</p>
          <el-button type="primary" @click="$router.push('/publish')">发布笔记</el-button>
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
    
    <el-dialog v-model="showEditDialog" title="编辑资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input 
            v-model="editForm.bio" 
            type="textarea" 
            :rows="3"
            placeholder="介绍一下自己吧" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile" :loading="saveLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Warning, ShoppingCart, Document, ChatDotRound, SwitchButton, ArrowRight } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'
import NoteCard from '@/components/NoteCard.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const notesLoading = ref(true)
const saveLoading = ref(false)
const user = ref(null)
const notes = ref([])
const showEditDialog = ref(false)

const editForm = reactive({
  nickname: '',
  bio: ''
})

const fetchProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get('/api/user/profile')
    if (res.success) {
      user.value = res.data
      editForm.nickname = res.data.nickname || ''
      editForm.bio = res.data.bio || ''
      fetchMyNotes()
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

const fetchMyNotes = async () => {
  notesLoading.value = true
  try {
    const res = await request.get('/api/user/notes')
    if (res.success) {
      notes.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to fetch notes:', err)
  } finally {
    notesLoading.value = false
  }
}

const saveProfile = async () => {
  saveLoading.value = true
  try {
    const res = await request.put('/api/user/profile', editForm)
    if (res.success) {
      ElMessage.success('保存成功')
      showEditDialog.value = false
      user.value = { ...user.value, ...editForm }
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

const goToDetail = (id) => {
  router.push(`/note/${id}`)
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped lang="scss">
.profile-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  
  .loading-container,
  .error-container {
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
    .profile-card {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 20px;
      
      .avatar-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .user-info {
        text-align: center;
        margin-bottom: 24px;
        
        .nickname {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #333;
        }
        
        .phone {
          margin: 0 0 8px 0;
          color: #999;
          font-size: 14px;
        }
        
        .bio {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }
      
      .stats-row {
        display: flex;
        justify-content: space-around;
        padding-top: 24px;
        border-top: 1px solid #f5f5f5;
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          
          strong {
            font-size: 24px;
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
    
    .menu-list {
      background: #fff;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      
      .menu-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        cursor: pointer;
        border-bottom: 1px solid #f5f5f5;
        transition: background 0.2s;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background: #f9f9f9;
        }
        
        .el-icon {
          font-size: 20px;
          color: #666;
          margin-right: 12px;
          
          &.arrow {
            margin-left: auto;
            margin-right: 0;
            color: #c0c4cc;
            font-size: 16px;
          }
        }
        
        span {
          color: #333;
        }
      }
    }
    
    .my-notes {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      
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
        
        p {
          margin: 8px 0 16px 0;
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
