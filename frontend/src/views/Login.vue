<template>
  <div class="login-page">
    <div class="login-container">
      <el-card class="login-card">
        <div class="login-header">
          <h1>欢迎回来</h1>
          <p>登录读书人频道，开启阅读之旅</p>
        </div>
        
        <el-form
          :model="loginForm"
          :rules="loginRules"
          ref="loginFormRef"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              placeholder="邮箱地址"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-footer">
          <p>
            还没有账号？
            <router-link to="/register" class="register-link">立即注册</router-link>
          </p>
          <div class="test-accounts">
            <p class="test-title">测试账号：</p>
            <div class="account-list">
              <div class="account-item">
                <span class="account-label">管理员：</span>
                <span class="account-value">admin@example.com / admin123</span>
              </div>
              <div class="account-item">
                <span class="account-label">用户：</span>
                <span class="account-value">user1@example.com / user123</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import {
  User,
  Lock
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  email: '',
  password: ''
});

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await userStore.login({
          email: loginForm.email,
          password: loginForm.password
        });
        ElMessage.success('登录成功');
        
        const redirect = route.query.redirect || '/';
        router.push(redirect);
      } catch (error) {
        console.error('Login failed:', error);
        ElMessage.error(error.response?.data?.message || '登录失败，请检查邮箱和密码');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
}

.login-footer p {
  font-size: 14px;
  color: #606266;
  margin-bottom: 20px;
}

.register-link {
  color: #409eff;
  font-weight: 500;
}

.test-accounts {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.test-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.account-item {
  font-size: 12px;
  color: #606266;
}

.account-label {
  font-weight: 500;
  color: #909399;
}

.account-value {
  font-family: monospace;
  background: #e4e7ed;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
