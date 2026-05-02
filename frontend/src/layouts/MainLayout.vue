<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" style="background-color: #304156">
      <div class="logo">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23409eff'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E" alt="logo" />
        <span>校园教务管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu v-if="userRole === 'admin'" index="1">
          <template #title>
            <el-icon><User /></el-icon>
            <span>学籍管理</span>
          </template>
          <el-menu-item index="/students">学生管理</el-menu-item>
          <el-menu-item index="/classes">班级管理</el-menu-item>
          <el-menu-item index="/teachers">教师管理</el-menu-item>
          <el-menu-item index="/classrooms">教室管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="userRole === 'admin' || userRole === 'teacher'" index="2">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>排课管理</span>
          </template>
          <el-menu-item index="/courses">课程管理</el-menu-item>
          <el-menu-item index="/schedules">课表管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item v-if="userRole === 'student'" index="/course-selection">
          <el-icon><Checked /></el-icon>
          <span>在线选课</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'admin'" index="/enrollments">
          <el-icon><List /></el-icon>
          <span>选课管理</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'teacher'" index="/attendance-take">
          <el-icon><EditPen /></el-icon>
          <span>考勤录入</span>
        </el-menu-item>

        <el-menu-item v-if="['admin', 'teacher', 'homeroom_teacher'].includes(userRole)" index="/attendances">
          <el-icon><Calendar /></el-icon>
          <span>考勤记录</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'student'" index="/my-attendance">
          <el-icon><Calendar /></el-icon>
          <span>我的考勤</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'teacher'" index="/grade-entry">
          <el-icon><Edit /></el-icon>
          <span>成绩录入</span>
        </el-menu-item>

        <el-menu-item v-if="['admin', 'teacher', 'homeroom_teacher'].includes(userRole)" index="/grades">
          <el-icon><DataAnalysis /></el-icon>
          <span>成绩管理</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'student'" index="/my-grades">
          <el-icon><DataAnalysis /></el-icon>
          <span>我的成绩</span>
        </el-menu-item>

        <el-menu-item index="/my-schedule">
          <el-icon><Clock /></el-icon>
          <span>我的课表</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'homeroom_teacher'" index="/class-students">
          <el-icon><UserFilled /></el-icon>
          <span>班级学生</span>
        </el-menu-item>

        <el-menu-item v-if="userRole === 'admin' || userRole === 'homeroom_teacher'" index="/reports">
          <el-icon><TrendCharts /></el-icon>
          <span>报表统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="text-align: right; font-size: 12px; background: #fff; border-bottom: 1px solid #dcdfe6; display: flex; align-items: center; justify-content: flex-end">
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <el-icon><UserFilled /></el-icon>
              {{ userName }} ({{ userRoleName }})
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  House, User, Document, Checked, List, EditPen, Calendar, 
  Edit, DataAnalysis, Clock, UserFilled, TrendCharts, ArrowDown 
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const userRole = computed(() => authStore.userRole);
const userName = computed(() => authStore.userName);
const userRoleName = computed(() => authStore.userRoleName);

const activeMenu = computed(() => route.path);

const passwordDialogVisible = ref(false);
const passwordFormRef = ref(null);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile');
      break;
    case 'password':
      passwordDialogVisible.value = true;
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      break;
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        authStore.logout();
        router.push('/login');
        ElMessage.success('已退出登录');
      } catch {
      }
      break;
  }
};

const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate();
  
  try {
    await authStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    ElMessage.success('密码修改成功');
    passwordDialogVisible.value = false;
  } catch (error) {
    console.error('修改密码失败:', error);
  }
};
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.user-info {
  margin-right: 20px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.el-dropdown-link:hover {
  color: #66b1ff;
}

.el-icon--right {
  margin-left: 5px;
}
</style>
