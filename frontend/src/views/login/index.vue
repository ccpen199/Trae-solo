<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">环保监测平台</div>
      <div class="login-subtitle">政企联动 · 智慧监管</div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <div class="tip-title">测试账号：</div>
        <div class="tip-item">监管员：admin / admin123</div>
        <div class="tip-item">监管员：regulator1 / 123456</div>
        <div class="tip-item">企业：lantian_user / 123456</div>
        <div class="tip-item">企业：bishui_user / 123456</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { login as loginApi } from '@/api/user';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const loginFormRef = ref(null);
const loginForm = reactive({
  username: '',
  password: '',
});

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true;
        const res = await loginApi(loginForm);
        userStore.login(res.data);
        ElMessage.success('登录成功');
        router.push('/dashboard');
      } catch (error) {
        console.error('登录失败:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #333;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  text-align: center;
  color: #999;
  margin-bottom: 30px;
}

.login-form {
  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: bold;
  }
}

.login-tips {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;

  .tip-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .tip-item {
    margin-top: 6px;
    line-height: 1.5;
  }
}
</style>
