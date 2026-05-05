<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <span>个人信息</span>
      </template>

      <el-descriptions :column="2" border label-width="120px">
        <el-descriptions-item label="用户名">
          {{ userInfo?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ userInfo?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="工号">
          {{ userInfo?.employeeId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="roleTagType" size="small">
            {{ userInfo?.role?.name || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="部门">
          {{ userInfo?.department?.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userInfo?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱" :span="2">
          {{ userInfo?.email || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="password-card" style="margin-top: 20px;">
      <template #header>
        <span>修改密码</span>
      </template>

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="120px"
        style="max-width: 500px"
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
          <el-button type="primary" @click="handleChangePassword">
            修改密码
          </el-button>
          <el-button @click="handleResetPassword">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const passwordFormRef = ref(null)

const userInfo = computed(() => userStore.userInfo)

const roleTagType = computed(() => {
  const roleMap = {
    'super_admin': 'danger',
    'sales': 'primary',
    'warehouse': 'warning',
    'finance': 'success',
    'customer_service': 'info'
  }
  return roleMap[userStore.roleCode] || ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
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
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      ElMessage.info('密码修改功能开发中')
      // TODO: 调用后端 API 修改密码
    }
  })
}

const handleResetPassword = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}
</script>

<style scoped>
.profile-container {
  padding: 0;
}

.profile-card,
.password-card {
  border-radius: 8px;
}
</style>
