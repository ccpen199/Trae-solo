<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <div class="user-info">
            <el-avatar :size="80" class="avatar">
              <el-icon size="40"><UserFilled /></el-icon>
            </el-avatar>
            <div class="info-content">
              <div class="username">{{ userStore.user?.realName || userStore.user?.username }}</div>
              <div class="role-tag">
                <el-tag :type="userStore.user?.role === 'ADMIN' ? 'danger' : 'primary'">
                  {{ userStore.user?.role === 'ADMIN' ? '管理员' : '普通用户' }}
                </el-tag>
              </div>
              <div class="status">
                状态：
                <el-tag :type="getStatusType(userStore.user?.status)">
                  {{ getStatusText(userStore.user?.status) }}
                </el-tag>
              </div>
              <div class="detail-info">
                <div class="info-item" v-if="userStore.user?.username">
                  <span class="label">用户名：</span>
                  <span class="value">{{ userStore.user?.username }}</span>
                </div>
                <div class="info-item" v-if="userStore.user?.email">
                  <span class="label">邮箱：</span>
                  <span class="value">{{ userStore.user?.email }}</span>
                </div>
                <div class="info-item" v-if="userStore.user?.phone">
                  <span class="label">手机：</span>
                  <span class="value">{{ userStore.user?.phone }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 500px;"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleChangePassword">
                确认修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { authApi } from '@/api'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const saving = ref(false)

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
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getStatusType = (status) => {
  const map = {
    PENDING: 'warning',
    ACTIVE: 'success',
    REJECTED: 'danger',
    DISABLED: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    PENDING: '待审核',
    ACTIVE: '正常',
    REJECTED: '已拒绝',
    DISABLED: '已禁用'
  }
  return map[status] || status
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    await authApi.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.avatar {
  background: #f5f7fa;
  margin-bottom: 15px;
}

.info-content {
  width: 100%;
}

.username {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.role-tag,
.status {
  margin-bottom: 10px;
}

.status {
  color: #606266;
}

.detail-info {
  margin-top: 20px;
  text-align: left;
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
}

.info-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
  min-width: 60px;
  display: inline-block;
}

.info-item .value {
  color: #303133;
}
</style>
