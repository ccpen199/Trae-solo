<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <el-icon :size="40" color="#409EFF"><Coffee /></el-icon>
        <h1>食品生产管理系统</h1>
        <p>原料入库 - 领料生产 - 批次质检 - 成品入库 - 发货追溯</p>
      </div>
      <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <p>系统角色说明：</p>
        <div class="role-list">
          <el-tag type="primary" size="small">采购人员</el-tag>
          <el-tag type="success" size="small">仓库管理</el-tag>
          <el-tag type="warning" size="small">生产班组</el-tag>
          <el-tag type="danger" size="small">质检人员</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { post } from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const response = await post<{
        token: string
        user: {
          id: string
          username: string
          name: string
          role: string
          isActive: boolean
        }
      }>('/auth/login', loginForm)

      userStore.setToken(response.data.token)
      userStore.setUserInfo({
        id: response.data.user.id,
        username: response.data.user.username,
        name: response.data.user.name,
        role: response.data.user.role as any,
      })

      ElMessage.success('登录成功')
      router.push('/dashboard')
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;

  .login-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      margin: 16px 0 8px;
      font-size: 24px;
      color: #333;
    }

    p {
      font-size: 14px;
      color: #999;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 24px;
    }
  }

  .login-footer {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #eee;

    p {
      font-size: 12px;
      color: #999;
      margin-bottom: 12px;
    }

    .role-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
}
</style>
