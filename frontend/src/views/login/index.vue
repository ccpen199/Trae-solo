<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">💪</div>
      <h1 class="title">FITLIFE</h1>
      <p class="subtitle">开启你的健身之旅</p>
    </div>
    
    <div class="login-form">
      <van-form @submit="handleLogin" ref="formRef">
        <div class="form-item">
          <label>手机号</label>
          <van-field
            v-model="form.phone"
            type="tel"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }]"
          />
        </div>
        
        <div class="form-item">
          <label>密码</label>
          <van-field
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </div>
        
        <div class="form-actions">
          <van-button
            type="primary"
            native-type="submit"
            class="login-btn"
            :loading="loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
          
          <div class="register-link" @click="handleRegister">
            没有账号？立即注册
          </div>
        </div>
      </van-form>
    </div>
    
    <div class="demo-tip">
      <p>演示账号：13800138000</p>
      <p>演示密码：123456</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const isRegister = ref(false);

const form = reactive({
  phone: '',
  password: '',
  nickname: ''
});

async function handleLogin() {
  if (isRegister.value) {
    await doRegister();
  } else {
    await doLogin();
  }
}

async function doLogin() {
  try {
    loading.value = true;
    const res = await request.post('/user/login', {
      phone: form.phone,
      password: form.password
    });
    
    localStorage.setItem('fitlife_token', res.data.token);
    localStorage.setItem('fitlife_user', JSON.stringify(res.data.user));
    
    showToast('登录成功');
    setTimeout(() => {
      router.push('/home');
    }, 500);
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loading.value = false;
  }
}

async function doRegister() {
  try {
    loading.value = true;
    const res = await request.post('/user/register', {
      phone: form.phone,
      password: form.password,
      nickname: form.nickname || `用户${form.phone.slice(-4)}`
    });
    
    localStorage.setItem('fitlife_token', res.data.token);
    localStorage.setItem('fitlife_user', JSON.stringify(res.data.user));
    
    showToast('注册成功');
    setTimeout(() => {
      router.push('/home');
    }, 500);
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleRegister() {
  isRegister.value = !isRegister.value;
}
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 24px 24px;
}

.login-header {
  text-align: center;
  margin-bottom: 50px;
  
  .logo {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 32px;
    font-weight: bold;
    color: white;
    margin-bottom: 8px;
    letter-spacing: 4px;
  }
  
  .subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-form {
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  .form-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }
  
  .form-actions {
    margin-top: 32px;
    
    .login-btn {
      width: 100%;
      height: 50px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 500;
    }
    
    .register-link {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #667eea;
      cursor: pointer;
    }
  }
}

.demo-tip {
  margin-top: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  line-height: 1.8;
}
</style>
