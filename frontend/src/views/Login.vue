<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">网约车派单系统</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            size="large"
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
      <div style="margin-top: 20px; color: #909399; font-size: 13px;">
        <p>测试账号：</p>
        <p>乘客: passenger1 / 123456</p>
        <p>司机: driver1 / 123456</p>
        <p>调度员: dispatcher / 123456</p>
        <p>管理员: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../store/user';

const router = useRouter();
const route = useRoute();
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
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await userStore.login(loginForm.username, loginForm.password);
        
        if (result.success) {
          ElMessage.success('登录成功');
          const redirect = route.query.redirect || '/dashboard';
          router.push(redirect);
        } else {
          ElMessage.error(result.error || '登录失败');
        }
      } catch (error) {
        ElMessage.error(error.error || '登录失败，请检查网络连接');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>
