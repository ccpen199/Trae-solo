<template>
  <div class="profile-page">
    <div class="container">
    <div class="page-header">
      <h1>编辑资料</h1>
      <p class="subtitle">修改您的个人信息</p>
    </div>

    <el-card class="profile-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="100">
              <img v-if="form.avatar" :src="form.avatar" />
              <el-icon v-else size="48"><User /></el-icon>
            </el-avatar>
            <div class="upload-actions">
              <el-button type="primary" size="small">更换头像</el-button>
              <p class="upload-tip">支持 JPG、PNG 格式，大小不超过 2MB</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input v-model="form.username" disabled />
          <p class="form-tip">用户名不可修改</p>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="4"
            placeholder="介绍一下自己..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            保存修改
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="security-card">
      <template #header>
        <div class="card-header">
          <span>安全设置</span>
        </div>
      </template>

      <el-form label-width="100px" size="large">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="passwordLoading">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCurrentUser, updateProfile } from '@/api'
import { User } from '@element-plus/icons-vue'

const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const passwordLoading = ref(false)

const form = reactive({
  nickname: '',
  username: '',
  email: '',
  bio: '',
  avatar: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 50, message: '昵称长度需在2-50个字符之间', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '简介长度不能超过200个字符', trigger: 'blur' }
  ]
}

const fetchUserInfo = async () => {
  try {
    const res = await getCurrentUser()
    const user = res.data?.user || {}
    form.nickname = user.nickname || ''
    form.username = user.username || ''
    form.email = user.email || ''
    form.bio = user.bio || ''
    form.avatar = user.avatar || ''
  } catch (e) {
    console.error('Fetch user info error:', e)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await updateProfile({
      nickname: form.nickname,
      email: form.email,
      bio: form.bio
    })
    ElMessage.success('资料保存成功')
    if (userStore.user) {
      userStore.user.nickname = form.nickname
    }
  } catch (e) {
    console.error('Update profile error:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  fetchUserInfo()
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 64px);
  padding: 40px 0;
  background: #f5f7fa;
}

.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-header .subtitle {
  color: #666;
  font-size: 15px;
}

.profile-card,
.security-card {
  border-radius: 12px;
  margin-bottom: 24px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 24px;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  font-weight: 600;
}
</style>
