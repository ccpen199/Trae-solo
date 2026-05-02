<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1><el-icon :size="32"><Monitor /></el-icon> 监控告警平台</h1>
        <p>Alert Monitoring Platform</p>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
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
        <p>默认账号 (密码: 123456)</p>
        <p>admin | ops01 | dev01 | oncall01 | manager01</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Monitor } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const handleLogin = async () => {
  await loginFormRef.value?.validate();
  
  loading.value = true;
  try {
    await userStore.login(loginForm.username, loginForm.password);
    ElMessage.success('登录成功');
    
    const redirect = router.currentRoute.value.query.redirect || '/dashboard';
    router.push(redirect);
  } catch (error) {
    console.error('登录失败:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-header p {
  margin: 8px 0 0;
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.login-footer p {
  margin: 4px 0;
}
</style>
