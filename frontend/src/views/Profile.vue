<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const profile = ref({
  nickname: '',
  avatar: '',
  phone: '',
  email: ''
})

const fetchProfile = async () => {
  if (!userStore.isLoggedIn) return
  try {
    loading.value = true
    const res = await request.get('/auth/profile')
    profile.value = { ...res.data }
  } catch (err) {
    console.error('Fetch profile error:', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!profile.value.nickname?.trim()) {
    ElMessage.warning('请输入昵称')
    return
  }
  try {
    submitting.value = true
    await request.put('/auth/profile', profile.value)
    ElMessage.success('保存成功')
    userStore.user = { ...userStore.user, ...profile.value }
  } catch (err) {
    console.error('Save profile error:', err)
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (userStore.user) {
    profile.value = {
      nickname: userStore.user.nickname || '',
      avatar: userStore.user.avatar || '',
      phone: userStore.user.phone || '',
      email: userStore.user.email || ''
    }
  }
  fetchProfile()
})
</script>

<template>
  <Layout>
    <div class="profile-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">个人中心</h1>
        </div>

        <div v-if="!userStore.isLoggedIn" class="empty-state">
          <el-empty description="请先登录">
            <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
          </el-empty>
        </div>

        <template v-else>
          <div class="profile-card">
            <div class="avatar-section">
              <el-avatar :size="100" :src="profile.avatar">
                {{ profile.nickname?.charAt(0) || userStore.user.username?.charAt(0) }}
              </el-avatar>
              <div class="user-info">
                <h2 class="username">{{ profile.nickname || userStore.user.username }}</h2>
                <p class="user-role">
                  <el-tag :type="userStore.user.role === 'admin' ? 'danger' : 'primary'" size="small">
                    {{ userStore.user.role === 'admin' ? '管理员' : '普通用户' }}
                  </el-tag>
                </p>
              </div>
            </div>

            <el-divider />

            <el-form :model="profile" label-width="100px" class="profile-form">
              <el-form-item label="用户名">
                <el-input v-model="userStore.user.username" disabled />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="profile.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profile.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profile.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="submitting" @click="handleSave">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="quick-actions">
            <h3>快捷操作</h3>
            <div class="action-grid">
              <div class="action-item" @click="$router.push('/pets')">
                <el-icon size="32"><Memo /></el-icon>
                <span>宠物档案</span>
              </div>
              <div class="action-item" @click="$router.push('/health')">
                <el-icon size="32"><Document /></el-icon>
                <span>健康管理</span>
              </div>
              <div class="action-item" @click="$router.push('/doctors')">
                <el-icon size="32"><User /></el-icon>
                <span>在线问诊</span>
              </div>
              <div v-if="userStore.user.role === 'admin'" class="action-item" @click="$router.push('/admin')">
                <el-icon size="32"><Setting /></el-icon>
                <span>管理后台</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.profile-page {
  min-height: 80vh;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 600px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.user-role {
  margin: 0;
}

.profile-form {
  padding-top: 10px;
}

.quick-actions {
  margin-top: 30px;
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-width: 600px;
}

.quick-actions h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
}

.action-item:hover {
  background: #f5f7fa;
  color: #409eff;
  transform: translateY(-2px);
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
