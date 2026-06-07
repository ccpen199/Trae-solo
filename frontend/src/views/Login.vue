<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="logo">
          <el-icon :size="36"><OfficeBuilding /></el-icon>
          辽事通
        </h1>
        <p class="sub-title">辽宁省政务服务移动中台</p>
      </div>

      <div class="role-tabs">
        <div
          :class="['role-tab', { active: loginForm.loginType === 'natural' }]"
          @click="loginForm.loginType = 'natural'"
        >
          <el-icon :size="22"><User /></el-icon>
          <span>自然人入口</span>
        </div>
        <div
          :class="['role-tab', { active: loginForm.loginType === 'legal' }]"
          @click="loginForm.loginType = 'legal'"
        >
          <el-icon :size="22"><OfficeBuilding /></el-icon>
          <span>法人入口</span>
        </div>
      </div>

      <el-form :model="loginForm" :rules="rules" ref="formRef" class="login-form" @submit.prevent="handleLogin">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            :placeholder="loginForm.loginType === 'natural' ? '请输入用户名/身份证号' : '请输入统一社会信用代码/用户名'"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            @click="handleLogin"
            :loading="loading"
          >
            {{ loginForm.loginType === 'natural' ? '自然人登录' : '法人登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-result" v-if="loginError">
        <el-alert :title="loginError" type="error" show-icon :closable="true" @close="loginError = ''" />
      </div>

      <div class="test-accounts">
        <el-divider>测试账号</el-divider>
        <div class="account-item" @click="fillAccount('admin', 'admin123')">
          <el-tag type="danger" size="small">管理员</el-tag>
          <span>admin / admin123</span>
        </div>
        <div class="account-item" @click="fillAccount('zhangsan', '123456'); loginForm.loginType = 'natural'">
          <el-tag type="success" size="small">自然人</el-tag>
          <span>zhangsan / 123456</span>
        </div>
        <div class="account-item" @click="fillAccount('company1', '123456'); loginForm.loginType = 'legal'">
          <el-tag type="warning" size="small">法人</el-tag>
          <span>company1 / 123456</span>
        </div>
      </div>

      <div class="register-link">
        还没有账号？<el-link type="primary" @click="showRegister = true">立即注册</el-link>
      </div>
    </div>

    <el-dialog v-model="showRegister" title="用户注册" width="440px" :close-on-click-modal="false">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="100px">
        <el-form-item label="用户类型">
          <el-radio-group v-model="registerForm.userType">
            <el-radio value="natural">自然人</el-radio>
            <el-radio value="legal">法人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="registerForm.realName" :placeholder="registerForm.userType === 'legal' ? '企业名称' : '真实姓名'" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="身份证号" v-if="registerForm.userType === 'natural'">
          <el-input v-model="registerForm.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="统一社会信用代码" v-if="registerForm.userType === 'legal'">
          <el-input v-model="registerForm.creditCode" placeholder="请输入统一社会信用代码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" :loading="registerLoading" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/store/user';
import api from '@/utils/api';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();
const loading = ref(false);
const registerLoading = ref(false);
const loginError = ref('');
const showRegister = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
  loginType: 'natural' as 'natural' | 'legal'
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const registerForm = reactive({
  username: '',
  password: '',
  userType: 'natural' as 'natural' | 'legal',
  realName: '',
  phone: '',
  idCard: '',
  creditCode: ''
});

const registerRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
};

const fillAccount = (username: string, password: string) => {
  loginForm.username = username;
  loginForm.password = password;
  loginError.value = '';
};

const handleLogin = async () => {
  if (!formRef.value) return;
  loginError.value = '';

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
  } catch {
    return;
  }

  loading.value = true;
  try {
    const res = await userStore.login(loginForm.username, loginForm.password, loginForm.loginType);

    if (res.code === 200) {
      ElMessage.success('登录成功');
      const userType = res.data.userInfo.userType;
      if (userType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } else {
      loginError.value = res.message || '登录失败，请检查账号密码';
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || '网络连接异常，请稍后重试';
    loginError.value = msg;
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  try {
    const valid = await registerFormRef.value.validate();
    if (!valid) return;
  } catch {
    return;
  }

  registerLoading.value = true;
  try {
    const res = await api.post('/auth/register', registerForm);
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录');
      showRegister.value = false;
      loginForm.username = registerForm.username;
      loginForm.password = '';
    } else {
      ElMessage.error(res.message || '注册失败');
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || '注册失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    registerLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
}

.login-box {
  width: 440px;
  padding: 40px 48px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1e40af;
  margin: 0;
}

.sub-title {
  margin-top: 12px;
  font-size: 14px;
  color: #64748b;
}

.role-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 0;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
  font-size: 15px;
  font-weight: 500;
  color: #64748b;
}

.role-tab:hover {
  border-color: #93c5fd;
  color: #3b82f6;
}

.role-tab.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1e40af;
}

.login-form {
  margin-top: 0;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  letter-spacing: 2px;
}

.login-result {
  margin-top: 4px;
  margin-bottom: 8px;
}

.test-accounts {
  margin-top: 4px;
}

.test-accounts :deep(.el-divider__text) {
  font-size: 12px;
  color: #94a3b8;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: background 0.2s;
}

.account-item:hover {
  background: #f1f5f9;
  color: #1e40af;
}

.register-link {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  margin-top: 12px;
}
</style>
