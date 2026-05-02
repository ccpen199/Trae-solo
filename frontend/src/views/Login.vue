<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>📋 固定资产管理系统</h1>
        <p>Fixed Asset Management System</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名"
            :disabled="loading"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="请输入密码"
            :disabled="loading"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-tips">
        <h4>测试账号：</h4>
        <ul>
          <li>资产管理员：admin / 123456</li>
          <li>使用部门：dept_user / 123456</li>
          <li>财务：finance / 123456</li>
          <li>审计：audit / 123456</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  const result = await authStore.login(username.value, password.value);
  
  loading.value = false;

  if (result.success) {
    const redirect = route.query.redirect as string || '/';
    router.push(redirect);
  } else {
    errorMessage.value = result.message || '登录失败';
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 10px;
  background: #fdf2f2;
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  transition: opacity 0.3s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-tips {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
}

.login-tips h4 {
  color: #666;
  margin-bottom: 10px;
  font-size: 14px;
}

.login-tips ul {
  list-style: none;
}

.login-tips li {
  color: #888;
  font-size: 12px;
  line-height: 1.8;
}
</style>
