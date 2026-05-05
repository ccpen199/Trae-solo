<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <van-icon name="shopping-cart-o" size="48" color="#FF4D4F" />
      </div>
      <h1 class="title">每日鲜鲜</h1>
      <p class="subtitle">1小时达 · 新鲜到家</p>
    </div>
    
    <div class="login-form">
      <div class="form-item">
        <van-field
          v-model="phone"
          type="tel"
          placeholder="请输入手机号"
          maxlength="11"
          clearable
        >
          <template #left-icon>
            <van-icon name="phone-o" size="20" color="#999" />
          </template>
        </van-field>
      </div>
      
      <div class="form-item">
        <van-field
          v-model="code"
          type="tel"
          placeholder="请输入验证码"
          maxlength="6"
          clearable
        >
          <template #left-icon>
            <van-icon name="shield-o" size="20" color="#999" />
          </template>
          <template #button>
            <van-button 
              size="small" 
              type="primary" 
              :disabled="countdown > 0 || !isValidPhone"
              :loading="sendingCode"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
      </div>
      
      <div class="agreement">
        <van-checkbox v-model="agreed" shape="square" checked-color="#FF4D4F">
          <span class="agreement-text">
            我已阅读并同意
            <span class="link">《用户协议》</span>
            和
            <span class="link">《隐私政策》</span>
          </span>
        </van-checkbox>
      </div>
      
      <van-button 
        type="primary" 
        block 
        size="large"
        :disabled="!canLogin"
        :loading="loggingIn"
        @click="handleLogin"
        class="login-btn"
      >
        登录
      </van-button>
      
      <div class="divider">
        <span class="line"></span>
        <span class="text">其他登录方式</span>
        <span class="line"></span>
      </div>
      
      <div class="other-login">
        <div class="login-method" @click="handleWechatLogin">
          <div class="icon wechat">
            <van-icon name="chat-o" size="24" color="#07C160" />
          </div>
          <span class="text">微信登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const phone = ref('');
const code = ref('');
const agreed = ref(false);
const countdown = ref(0);
const sendingCode = ref(false);
const loggingIn = ref(false);

let countdownTimer = null;

const isValidPhone = computed(() => /^1\d{10}$/.test(phone.value));

const canLogin = computed(() => {
  return isValidPhone.value && code.value.length === 6 && agreed.value;
});

const sendCode = async () => {
  if (!isValidPhone.value) {
    showToast('请输入正确的手机号');
    return;
  }
  
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策');
    return;
  }
  
  sendingCode.value = true;
  
  try {
    await userStore.sendCode(phone.value);
    showToast('验证码已发送');
    
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败:', error);
  } finally {
    sendingCode.value = false;
  }
};

const handleLogin = async () => {
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策');
    return;
  }
  
  loggingIn.value = true;
  
  try {
    await userStore.login(phone.value, code.value);
    showToast('登录成功');
    router.push('/home');
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loggingIn.value = false;
  }
};

const handleWechatLogin = async () => {
  if (!agreed.value) {
    showToast('请先同意用户协议和隐私政策');
    return;
  }
  
  if (!isValidPhone.value) {
    showToast('请先输入手机号');
    return;
  }
  
  loggingIn.value = true;
  
  try {
    await userStore.login(phone.value, '', 'wechat');
    showToast('微信登录成功');
    router.push('/home');
  } catch (error) {
    console.error('微信登录失败:', error);
  } finally {
    loggingIn.value = false;
  }
};

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F5 0%, #FFFFFF 100%);
  padding: 60px 24px 0;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo {
    width: 80px;
    height: 80px;
    background: #FFECEC;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  
  .title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 14px;
    color: #999;
  }
}

.login-form {
  .form-item {
    margin-bottom: 16px;
    
    :deep(.van-cell) {
      border-radius: 12px;
      background: #fff;
      padding: 12px 16px;
    }
    
    :deep(.van-field__control) {
      font-size: 15px;
    }
  }
  
  .agreement {
    margin-bottom: 24px;
    padding: 0 8px;
    
    .agreement-text {
      font-size: 12px;
      color: #666;
      
      .link {
        color: #FF4D4F;
      }
    }
  }
  
  .login-btn {
    height: 48px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    --van-button-primary-background: #FF4D4F;
    --van-button-primary-border-color: #FF4D4F;
  }
  
  .divider {
    display: flex;
    align-items: center;
    margin: 32px 0;
    
    .line {
      flex: 1;
      height: 1px;
      background: #E8E8E8;
    }
    
    .text {
      font-size: 12px;
      color: #999;
      margin: 0 16px;
    }
  }
  
  .other-login {
    display: flex;
    justify-content: center;
    
    .login-method {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        
        &.wechat {
          background: #E8F5E9;
        }
      }
      
      .text {
        font-size: 12px;
        color: #666;
      }
    }
  }
}
</style>
