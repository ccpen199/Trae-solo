<template>
  <div class="forgot-page">
    <div class="forgot-card">
      <div class="logo-section">
        <span class="logo-icon">P</span>
        <h1 class="title">找回密码</h1>
        <p class="subtitle">通过邮箱或手机号重置密码</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-radio-group v-model="resetType" style="margin-bottom: 16px;">
          <el-radio value="email">通过邮箱</el-radio>
          <el-radio value="phone">通过手机号</el-radio>
        </el-radio-group>

        <el-form-item
          v-if="resetType === 'email'"
          label="邮箱"
          prop="email"
        >
          <el-input
            v-model="form.email"
            placeholder="请输入注册邮箱"
            size="large"
            :disabled="loading"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item
          v-if="resetType === 'phone'"
          label="手机号"
          prop="phone"
        >
          <el-input
            v-model="form.phone"
            placeholder="请输入注册手机号"
            size="large"
            :disabled="loading"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少 6 个字符）"
            size="large"
            show-password
            :disabled="loading"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            size="large"
            show-password
            :disabled="loading"
            @keyup.enter="handleSubmit"
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
            @click="handleSubmit"
          >
            重置密码
          </el-button>
        </el-form-item>
      </el-form>

      <div class="links">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm } from 'element-plus';
import { Lock, Message, Phone } from '@element-plus/icons-vue';
import { userApi } from '@/api';

const router = useRouter();

const formRef = ref(null);
const loading = ref(false);
const resetType = ref('email');

const form = reactive({
  email: '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    loading.value = true;
    
    await userApi.forgotPassword({
      email: resetType.value === 'email' ? form.email : undefined,
      phone: resetType.value === 'phone' ? form.phone : undefined,
      newPassword: form.newPassword
    });
    
    ElMessage.success('密码重置成功，短信已发送，请用新密码登录');
    router.push('/login');
  } catch (error) {
    console.error('Reset password error:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.forgot-card {
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
  text-align: center;
  font-size: 14px;
}
</style>
