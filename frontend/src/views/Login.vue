<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>🚀 FastTrust 同城即时交付</h2>
          <p class="subtitle">高信任度同城即时服务平台</p>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="委托人登录" name="client">
          <el-form :model="clientForm" :rules="clientRules" ref="clientFormRef" label-width="80px" @submit.prevent>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="clientForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="clientForm.password" type="password" placeholder="请输入密码" show-password @keyup.enter="handleClientLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" style="width: 100%" @click="handleClientLogin" :loading="loading">
                登录
              </el-button>
            </el-form-item>
            <div class="form-footer">
              <span>还没有账号？</span>
              <el-link type="primary" @click="$router.push('/client/register')">立即注册</el-link>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="接单人登录" name="courier">
          <el-form :model="courierForm" :rules="courierRules" ref="courierFormRef" label-width="80px" @submit.prevent>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="courierForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="courierForm.password" type="password" placeholder="请输入密码" show-password @keyup.enter="handleCourierLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" style="width: 100%" @click="handleCourierLogin" :loading="loading">
                登录
              </el-button>
            </el-form-item>
            <div class="form-footer">
              <span>还没有账号？</span>
              <el-link type="primary" @click="$router.push('/courier/register')">立即入驻</el-link>
            </div>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="管理后台" name="admin">
          <el-form :model="adminForm" :rules="adminRules" ref="adminFormRef" label-width="80px" @submit.prevent>
            <el-form-item label="管理员ID" prop="adminId">
              <el-input v-model="adminForm.adminId" placeholder="admin / platform / ops" />
            </el-form-item>
            <el-form-item label="密钥" prop="secretKey">
              <el-input v-model="adminForm.secretKey" type="password" placeholder="请输入密钥" show-password @keyup.enter="handleAdminLogin" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" style="width: 100%" @click="handleAdminLogin" :loading="loading">
                进入后台
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('client')
const loading = ref(false)
const clientFormRef = ref(null)
const courierFormRef = ref(null)
const adminFormRef = ref(null)

const clientForm = reactive({ phone: '', password: '' })
const courierForm = reactive({ phone: '', password: '' })
const adminForm = reactive({ adminId: '', secretKey: '' })

const phoneRule = [
  { required: true, message: '请输入手机号', trigger: 'blur' },
  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
]
const passwordRule = [{ required: true, message: '请输入密码', trigger: 'blur' }]

const clientRules = { phone: phoneRule, password: passwordRule }
const courierRules = { phone: phoneRule, password: passwordRule }
const adminRules = {
  adminId: [{ required: true, message: '请输入管理员ID', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入密钥', trigger: 'blur' }]
}

function doLogin(formRef, loginFn, userType, successPath, userField) {
  if (!formRef.value) {
    ElMessage.error('表单未初始化')
    return
  }
  formRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    loginFn()
      .then((res) => {
        if (res.success) {
          userStore.setUser(res[userField], userType, res.token)
          ElMessage.success('登录成功')
          router.push(successPath)
        } else {
          ElMessage.error(res.error || '登录失败')
        }
      })
      .catch((error) => {
        const msg = error?.response?.data?.error || error?.message || '登录失败，请检查账号密码'
        ElMessage.error(msg)
      })
      .finally(() => {
        loading.value = false
      })
  })
}

const handleClientLogin = () => {
  doLogin(
    clientFormRef,
    () => authApi.clientLogin({ phone: clientForm.phone, password: clientForm.password }),
    'client', '/home', 'user'
  )
}

const handleCourierLogin = () => {
  doLogin(
    courierFormRef,
    () => authApi.courierLogin({ phone: courierForm.phone, password: courierForm.password }),
    'courier', '/home', 'courier'
  )
}

const handleAdminLogin = () => {
  doLogin(
    adminFormRef,
    () => authApi.adminLogin({ admin_id: adminForm.adminId, secret_key: adminForm.secretKey }),
    'admin', '/admin', 'admin'
  )
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 10px;
  color: #303133;
  font-size: 22px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.login-tabs {
  padding: 0 10px;
}

.form-footer {
  text-align: center;
  margin-top: 10px;
  color: #606266;
}

.form-footer span {
  margin-right: 5px;
}
</style>
