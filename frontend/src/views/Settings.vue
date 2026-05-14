<template>
  <div class="settings" v-if="!loading">
    <div class="settings-header">
      <h2>设置</h2>
    </div>

    <div class="settings-tabs">
      <el-radio-group v-model="activeTab" size="large" direction="vertical">
        <el-radio-button label="password">修改密码</el-radio-button>
        <el-radio-button label="phone">修改手机号</el-radio-button>
      </el-radio-group>
    </div>

    <div class="settings-content">
      <div class="password-section" v-if="activeTab === 'password'">
        <h3>修改密码</h3>
        <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input 
              v-model="passwordForm.oldPassword" 
              type="password" 
              placeholder="请输入当前密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="passwordForm.newPassword" 
              type="password" 
              placeholder="请输入新密码（6-20位）"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="passwordForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleChangePassword"
              :loading="submittingPassword"
            >
              确认修改
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="phone-section" v-if="activeTab === 'phone'">
        <h3>修改手机号</h3>
        <el-form :model="phoneForm" label-width="100px" :rules="phoneRules" ref="phoneFormRef">
          <el-form-item label="当前手机号">
            <el-input 
              :value="currentPhone" 
              disabled
            />
          </el-form-item>
          <el-form-item label="新手机号" prop="newPhone">
            <el-input 
              v-model="phoneForm.newPhone" 
              placeholder="请输入新手机号"
              maxlength="11"
            />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-input">
              <el-input 
                v-model="phoneForm.code" 
                placeholder="请输入验证码"
                maxlength="6"
              />
              <el-button 
                :disabled="countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleChangePhone"
              :loading="submittingPhone"
            >
              确认修改
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="3" animated />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const loading = ref(true);
const activeTab = ref('password');
const submittingPassword = ref(false);
const submittingPhone = ref(false);
const countdown = ref(0);
const passwordFormRef = ref(null);
const phoneFormRef = ref(null);

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const phoneForm = reactive({
  newPhone: '',
  code: ''
});

const currentPhone = computed(() => {
  const phone = userStore.user?.phone || '';
  if (phone.length === 11) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return phone;
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const phoneRules = {
  newPhone: [
    { required: true, message: '请输入新手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, max: 6, message: '验证码长度为4-6位', trigger: 'blur' }
  ]
};

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submittingPassword.value = true;
    try {
      const response = await userApi.changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      });
      if (response.data?.success) {
        ElMessage.success('密码修改成功，请重新登录');
        passwordForm.oldPassword = '';
        passwordForm.newPassword = '';
        passwordForm.confirmPassword = '';
        userStore.logout();
      } else {
        ElMessage.error(response.data?.message || '修改失败');
      }
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '修改失败');
    } finally {
      submittingPassword.value = false;
    }
  });
};

const sendCode = async () => {
  if (!phoneForm.newPhone) {
    ElMessage.warning('请先输入手机号');
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }
  
  ElMessage.info('验证码已发送（演示模式：任意4-6位数字均可验证）');
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};

const handleChangePhone = async () => {
  if (!phoneFormRef.value) return;
  
  await phoneFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    submittingPhone.value = true;
    try {
      const response = await userApi.changePhone({
        new_phone: phoneForm.newPhone,
        code: phoneForm.code
      });
      if (response.data?.success) {
        ElMessage.success('手机号修改成功');
        phoneForm.newPhone = '';
        phoneForm.code = '';
        userStore.user.phone = phoneForm.newPhone;
      } else {
        ElMessage.error(response.data?.message || '修改失败');
      }
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '修改失败');
    } finally {
      submittingPhone.value = false;
    }
  });
};

onMounted(() => {
  loading.value = false;
});
</script>

<style scoped>
.settings {
  max-width: 600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-header h2 {
  font-size: 20px;
  margin: 0;
}

.settings-tabs {
  margin-bottom: 24px;
}

.settings-tabs :deep(.el-radio-group) {
  gap: 12px;
}

.settings-tabs :deep(.el-radio-button__inner) {
  padding: 12px 24px;
}

.settings-content {
  padding-top: 8px;
}

.password-section h3,
.phone-section h3 {
  font-size: 16px;
  margin: 0 0 20px 0;
  color: #303133;
}

.code-input {
  display: flex;
  gap: 12px;
}

.code-input :deep(.el-input) {
  flex: 1;
}

.loading-container {
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  max-width: 600px;
  margin: 0 auto;
}
</style>
