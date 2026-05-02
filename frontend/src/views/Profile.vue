<template>
  <div class="profile-page">
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ userInfo?.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ userInfo?.name }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ userRoleName }}</el-descriptions-item>
        <el-descriptions-item label="账户状态">
          <el-tag :type="userInfo?.status === 'active' ? 'success' : 'danger'">
            {{ userInfo?.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="userInfo?.gender" label="性别">
          {{ userInfo.gender === 'male' ? '男' : '女' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="userInfo?.phone" label="联系电话">{{ userInfo.phone }}</el-descriptions-item>
        <el-descriptions-item v-if="userInfo?.email" label="电子邮箱">{{ userInfo.email }}</el-descriptions-item>
        
        <template v-if="profile">
          <el-descriptions-item v-if="profile.student_number" label="学号">{{ profile.student_number }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.teacher_number" label="工号">{{ profile.teacher_number }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.class_name" label="班级">{{ profile.class_name }} ({{ profile.class_code }})</el-descriptions-item>
          <el-descriptions-item v-if="profile.major" label="专业">{{ profile.major }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.department" label="所属院系">{{ profile.department }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.position" label="职称">{{ profile.position }}</el-descriptions-item>
          <el-descriptions-item v-if="profile.enrollment_status" label="学籍状态">
            <el-tag :type="getStatusType(profile.enrollment_status)">
              {{ getStatusText(profile.enrollment_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="profile.enrollment_date" label="入学日期">{{ profile.enrollment_date }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();

const userInfo = computed(() => authStore.userInfo);
const userRoleName = computed(() => authStore.userRoleName);
const profile = computed(() => authStore.profile);

const getStatusType = (status) => {
  const types = {
    enrolled: 'info',
    studying: 'success',
    suspended: 'warning',
    withdrawn: 'danger',
    graduated: 'primary'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    enrolled: '已注册',
    studying: '在读中',
    suspended: '休学',
    withdrawn: '退学',
    graduated: '已毕业'
  };
  return texts[status] || status;
};
</script>

<style scoped>
.profile-page {
  max-width: 800px;
}
</style>
