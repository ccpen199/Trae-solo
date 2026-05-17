<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">📕</span>
          <span class="logo-text">小红书</span>
        </div>
        <p class="slogan">标记我的生活</p>
      </div>

      <div class="login-form">
        <el-input
          v-model="phone"
          placeholder="请输入手机号"
          size="large"
          class="input-item"
        />
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          size="large"
          class="input-item"
        />
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleLogin"
          class="login-btn"
        >
          登录
        </el-button>
      </div>

      <div class="tips">
        <p>测试账号: 13800000001</p>
        <p>密码: 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('13800000001')
const password = ref('123456')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await userStore.loginWithPassword(phone.value, password.value)
    ElMessage.success('登录成功')
    router.push('/discover')
  } catch (error) {
    ElMessage.error('登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  .login-header {
    text-align: center;
    margin-bottom: 30px;

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 28px;
      font-weight: 700;
      color: #ff2442;
      margin-bottom: 8px;

      .logo-icon {
        font-size: 36px;
      }
    }

    .slogan {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  .login-form {
    .input-item {
      margin-bottom: 16px;
    }

    .login-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      background: linear-gradient(135deg, #ff2442 0%, #ff6b6b 100%);
      border: none;
      margin-top: 8px;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 36, 66, 0.3);
      }
    }
  }

  .tips {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 13px;
    color: #999;

    p {
      margin: 4px 0;
    }
  }
}
</style>
