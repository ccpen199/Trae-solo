<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2>企业注册</h2>
        <p>加入物流信息交互平台</p>
      </div>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-width="100px"
      >
        <el-divider content-position="left">账号信息</el-divider>
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password
          />
        </el-form-item>
        <el-divider content-position="left">企业信息</el-divider>
        <el-form-item label="企业编号" prop="enterpriseCode">
          <el-input
            v-model="registerForm.enterpriseCode"
            placeholder="请输入企业编号"
            size="large"
          />
        </el-form-item>
        <el-form-item label="企业名称" prop="enterpriseName">
          <el-input
            v-model="registerForm.enterpriseName"
            placeholder="请输入企业名称"
            size="large"
          />
        </el-form-item>
        <el-form-item label="企业类型" prop="enterpriseType">
          <el-select
            v-model="registerForm.enterpriseType"
            placeholder="请选择企业类型"
            size="large"
            style="width: 100%"
          >
            <el-option label="生产企业" value="production" />
            <el-option label="物流企业" value="logistics" />
            <el-option label="中转企业" value="transfer" />
            <el-option label="接收企业" value="receiver" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">联系方式</el-divider>
        <el-form-item label="真实姓名" prop="realName">
          <el-input
            v-model="registerForm.realName"
            placeholder="请输入真实姓名"
            size="large"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            size="large"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            size="large"
          />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="registerForm.address"
            type="textarea"
            :rows="2"
            placeholder="请输入企业地址"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-btn"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goLogin">立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const registerFormRef = ref<FormInstance>();
const loading = ref(false);

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  enterpriseCode: '',
  enterpriseName: '',
  enterpriseType: '',
  realName: '',
  phone: '',
  email: '',
  address: '',
});

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  enterpriseCode: [
    { required: true, message: '请输入企业编号', trigger: 'blur' },
  ],
  enterpriseName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
  ],
  enterpriseType: [
    { required: true, message: '请选择企业类型', trigger: 'change' },
  ],
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const { confirmPassword, ...params } = registerForm;
        const result = await userStore.register(params as any);
        if (result.success) {
          ElMessage.success('注册成功，请等待管理员审核');
          router.push('/login');
        }
      } catch (error: any) {
        console.error('Register error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

const goLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-box {
  width: 560px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 20px;
}

.register-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.register-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.register-form {
  margin-top: 20px;
}

.register-btn {
  width: 100%;
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
