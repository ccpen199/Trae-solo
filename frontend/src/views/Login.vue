<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <el-icon size="48" color="#409EFF"><Document /></el-icon>
        <h2>电子作业指导书系统</h2>
      </div>
      <el-form :model="form" label-width="80px" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-tips">
        <p>测试账号：</p>
        <p>worker1 / 123456 (操作工)</p>
        <p>engineer1 / 123456 (工艺工程师)</p>
        <p>leader1 / 123456 (班组长)</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const form = ref({
  username: '',
  password: ''
});

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  
  try {
    await userStore.login(form.value.username, form.value.password);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e) {
    ElMessage.error('登录失败，请检查用户名和密码');
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 20px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin-top: 12px;
  color: #303133;
}

.login-btn {
  width: 100%;
}

.login-tips {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.login-tips p {
  margin: 4px 0;
}
</style>
