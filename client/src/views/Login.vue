<template>
  <div class="login">
    <div class="back-btn" @click="goBack">
      <span>←</span>
    </div>
    
    <div class="logo-section">
      <div class="logo">🛍️</div>
      <h1>淘宝商城</h1>
      <p>精选好物，品质生活</p>
    </div>

    <div class="form-section">
      <div class="tab-switch">
        <span 
          class="tab" 
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >登录</span>
        <span 
          class="tab" 
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >注册</span>
      </div>

      <div class="form">
        <div class="form-item">
          <span class="icon">👤</span>
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="用户名"
          />
        </div>
        
        <div class="form-item">
          <span class="icon">🔒</span>
          <input 
            v-model="form.password" 
            :type="showPassword ? 'text' : 'password'" 
            placeholder="密码"
          />
          <span class="eye-btn" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </span>
        </div>

        <div v-if="!isLogin" class="form-item">
          <span class="icon">😊</span>
          <input 
            v-model="form.nickname" 
            type="text" 
            placeholder="昵称（选填）"
          />
        </div>

        <button 
          class="btn btn-primary submit-btn"
          @click="handleSubmit"
          :disabled="loading"
        >
          {{ loading ? '请稍候...' : (isLogin ? '登录' : '注册') }}
        </button>

        <div v-if="isLogin" class="quick-login">
          <p>测试账号：user1 / 123456</p>
        </div>
      </div>
    </div>

    <div class="agreement">
      登录即表示同意
      <a href="#">《用户协议》</a>
      和
      <a href="#">《隐私政策》</a>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const showToast = inject('showToast');

const isLogin = ref(true);
const showPassword = ref(false);
const loading = ref(false);

const form = ref({
  username: 'user1',
  password: '123456',
  nickname: ''
});

const goBack = () => {
  const redirect = route.query.redirect;
  if (redirect) {
    router.push(redirect);
  } else {
    router.back();
  }
};

const handleSubmit = async () => {
  if (!form.value.username.trim()) {
    showToast('请输入用户名');
    return;
  }
  if (!form.value.password) {
    showToast('请输入密码');
    return;
  }
  if (form.value.password.length < 6) {
    showToast('密码长度至少6位');
    return;
  }

  loading.value = true;
  
  try {
    if (isLogin.value) {
      await userStore.login(form.value.username, form.value.password);
      showToast('登录成功');
    } else {
      await userStore.register(form.value.username, form.value.password, form.value.nickname);
      showToast('注册成功');
    }
    
    const redirect = route.query.redirect;
    if (redirect) {
      router.push(redirect);
    } else {
      router.push('/');
    }
  } catch (e) {
    showToast(e.message || '操作失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5000 0%, #ff6b00 50%, #ff8c00 100%);
  padding: 20px;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 24px;
  color: #fff;
  z-index: 10;
}

.logo-section {
  text-align: center;
  padding: 80px 0 40px;
  color: #fff;
}

.logo {
  font-size: 64px;
  margin-bottom: 16px;
}

.logo-section h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.logo-section p {
  font-size: 14px;
  opacity: 0.9;
}

.form-section {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.tab-switch {
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 16px;
  color: #999;
  position: relative;
}

.tab.active {
  color: #ff5000;
  font-weight: bold;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #ff5000;
  border-radius: 2px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 12px 16px;
}

.form-item .icon {
  font-size: 18px;
  margin-right: 12px;
}

.form-item input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
}

.eye-btn {
  font-size: 18px;
  padding: 4px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
  margin-top: 8px;
}

.submit-btn:disabled {
  opacity: 0.7;
}

.quick-login {
  text-align: center;
  margin-top: 16px;
}

.quick-login p {
  font-size: 12px;
  color: #999;
}

.agreement {
  position: fixed;
  bottom: 30px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.agreement a {
  color: #fff;
  text-decoration: underline;
}
</style>
