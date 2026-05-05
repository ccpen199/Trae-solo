<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="24" :lg="8">
        <el-card class="info-card">
          <div class="avatar-section">
            <el-avatar :size="80" class="user-avatar">
              <el-icon :size="40"><UserFilled /></el-icon>
            </el-avatar>
            <h3>{{ userStore.userName }}</h3>
            <el-tag :type="roleTagType" size="large">{{ userStore.userRole }}</el-tag>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">{{ userInfo.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ userInfo.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userStore.userRole }}</el-descriptions-item>
            <el-descriptions-item label="账户状态">
              <el-tag :type="userInfo.status === 'active' ? 'success' : 'danger'">
                {{ userInfo.status === 'active' ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="24" :lg="16">
        <el-card>
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 500px"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                @click="handleChangePassword"
              >
                确认修改
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '@/store/user'
import { authApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const passwordFormRef = ref(null)
const loading = ref(false)

const userInfo = computed(() => userStore.userInfo || {})

const roleTagType = computed(() => {
  const code = userInfo.value?.role?.code
  const typeMap = {
    'SYSTEM_ADMIN': 'danger',
    'TEACHING_ADMIN': 'warning',
    'TEACHER': 'primary',
    'STUDENT': 'success'
  }
  return typeMap[code] || 'info'
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    ElMessage.success('密码修改成功')
    resetPasswordForm()
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}

const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields()
}
</script>

<style scoped>
.profile-container {
  padding: 0;
}

.info-card {
  margin-bottom: 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.user-avatar {
  background-color: #409EFF;
  color: #fff;
  margin-bottom: 15px;
}

.avatar-section h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}
</style>
