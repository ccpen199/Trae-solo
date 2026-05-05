<template>
  <div class="register-page">
    <div class="register-container">
      <el-card class="register-card">
        <div class="register-header">
          <h1>创建账号</h1>
          <p>加入读书人频道，开启你的阅读之旅</p>
        </div>
        
        <el-form
          :model="registerForm"
          :rules="registerRules"
          ref="registerFormRef"
          class="register-form"
        >
          <el-form-item prop="nickname">
            <el-input
              v-model="registerForm.nickname"
              placeholder="昵称"
              size="large"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="邮箱地址"
              size="large"
            >
              <template #prefix>
                <el-icon><ChatDotRound /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              show-password
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
              class="register-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="register-footer">
          <p>
            已有账号？
            <router-link to="/login" class="login-link">立即登录</router-link>
          </p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { ElMessage } from 'element-plus';
import {
  User,
  ChatDotRound,
  Lock
} from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

const registerFormRef = ref(null);
const loading = ref(false);

const registerForm = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const registerRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度为2-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为6-32个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await userStore.register({
          nickname: registerForm.nickname,
          email: registerForm.email,
          password: registerForm.password
        });
        ElMessage.success('注册成功，正在登录...');
        router.push('/');
      } catch (error) {
        console.error('Register failed:', error);
        ElMessage.error(error.response?.data?.message || '注册失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.register-container {
  width: 100%;
  max-width: 420px;
}

.register-card {
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.register-header p {
  font-size: 14px;
  color: #909399;
}

.register-form {
  margin-bottom: 24px;
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
}

.register-footer p {
  font-size: 14px;
  color: #606266;
}

.login-link {
  color: #409eff;
  font-weight: 500;
}
</style>
