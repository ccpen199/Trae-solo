<template>
  <div class="profile-page">
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        style="max-width: 500px"
      >
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-tag type="danger">管理员</el-tag>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-divider>修改密码</el-divider>
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="formData.oldPassword"
            type="password"
            placeholder="不修改请留空"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="formData.newPassword"
            type="password"
            placeholder="不修改请留空"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="确认新密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const userInfo = computed(() => userStore.userInfo);

const formData = reactive({
  realName: '',
  phone: '',
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (formData.newPassword && value !== formData.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules: FormRules = {
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  newPassword: [
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const params: any = {};
        if (formData.realName) params.realName = formData.realName;
        if (formData.phone) params.phone = formData.phone;
        if (formData.email) params.email = formData.email;
        if (formData.oldPassword && formData.newPassword) {
          params.oldPassword = formData.oldPassword;
          params.newPassword = formData.newPassword;
        }

        if (Object.keys(params).length > 0) {
          await userStore.updateProfile(params);
          ElMessage.success('保存成功');
          formData.oldPassword = '';
          formData.newPassword = '';
          formData.confirmPassword = '';
        }
      } catch (error) {
        console.error('Update profile error:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

onMounted(() => {
  if (userInfo.value) {
    formData.realName = userInfo.value.realName || '';
    formData.phone = userInfo.value.phone || '';
    formData.email = userInfo.value.email || '';
  }
});
</script>

<style scoped>
.profile-page {
  height: 100%;
}
</style>
