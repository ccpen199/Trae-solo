<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo-section">
        <span class="logo-icon">P</span>
        <h1 class="title">PMcaff</h1>
        <p class="subtitle">产品经理社区内容平台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="账号（用户名/邮箱/手机号）" prop="account">
          <el-input
            v-model="form.account"
            placeholder="请输入用户名、邮箱或手机号"
            size="large"
            :disabled="loading"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            :disabled="loading"
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
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="links">
        <router-link to="/forgot-password">忘记密码？</router-link>
        <span class="divider">|</span>
        <router-link to="/register">注册账号</router-link>
      </div>

      <el-divider />

      <div class="demo-accounts">
        <p class="text-muted" style="margin-bottom: 8px;">演示账号：</p>
        <p class="text-muted">管理员：admin@pmcaff.com / admin123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElForm } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref(null);
const loading = ref(false);

const form = reactive({
  account: '',
  password: ''
});

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    loading.value = true;
    await userStore.login(form);
    
    ElMessage.success('登录成功');
    
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  display: inline-block;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 12px;
  font-size: 28px;
  font-weight: bold;
  line-height: 56px;
  text-align: center;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.links {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.divider {
  color: #e4e7ed;
}

.demo-accounts {
  font-size: 12px;
}
</style>
