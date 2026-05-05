<template>
  <el-container style="min-height: 100vh;">
    <Header />
    <el-main>
      <el-card style="max-width: 800px; margin: 0 auto;">
        <template #header>
          <span style="font-size: 18px; font-weight: bold;">个人中心</span>
        </template>

        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="个人资料" name="profile">
            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-width="80px"
              style="max-width: 500px;"
            >
              <el-form-item label="用户名">
                <el-input :value="userStore.userInfo?.username" disabled />
              </el-form-item>
              <el-form-item label="用户角色">
                <el-tag :type="userStore.userInfo?.role === 'admin' ? 'danger' : 'primary'">
                  {{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </el-form-item>
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="收货地址" prop="address">
                <el-input
                  v-model="profileForm.address"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入收货地址"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="profileLoading" @click="handleUpdateProfile">
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="修改密码" name="password">
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
                  placeholder="请输入新密码（至少6位）"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-main>
    <el-footer style="background-color: #333; color: #fff; text-align: center; padding: 20px 0;">
      <p>© 2026 网上商城 - 版权所有</p>
    </el-footer>
  </el-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const activeTab = ref('profile')
const profileFormRef = ref(null)
const passwordFormRef = ref(null)
const profileLoading = ref(false)
const passwordLoading = ref(false)

const profileForm = reactive({
  email: '',
  phone: '',
  address: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
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
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const initProfileForm = () => {
  profileForm.email = userStore.userInfo?.email || ''
  profileForm.phone = userStore.userInfo?.phone || ''
  profileForm.address = userStore.userInfo?.address || ''
}

const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      profileLoading.value = true
      try {
        const res = await userStore.updateUserProfile(profileForm)
        if (res.success) {
          ElMessage.success('个人资料更新成功')
        }
      } catch (error) {
        console.error('更新个人资料失败', error)
      } finally {
        profileLoading.value = false
      }
    }
  })
}

const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true
      try {
        const res = await userStore.changePassword(passwordForm)
        if (res.success) {
          ElMessage.success('密码修改成功')
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        }
      } catch (error) {
        console.error('修改密码失败', error)
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

onMounted(() => {
  initProfileForm()
})
</script>
