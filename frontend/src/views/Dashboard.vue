<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.students || 0 }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.teachers || 0 }}</div>
              <div class="stat-label">教师总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.courses || 0 }}</div>
              <div class="stat-label">开设课程</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.enrollments || 0 }}</div>
              <div class="stat-label">选课记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>我的课表</span>
          </template>
          <el-table :data="todaySchedule" stripe style="width: 100%" v-loading="scheduleLoading">
            <el-table-column prop="courseName" label="课程名称" />
            <el-table-column prop="teacherName" label="教师" />
            <el-table-column prop="roomName" label="教室" />
            <el-table-column prop="dayOfWeek" label="星期">
              <template #default="{ row }">
                {{ weekDays[row.dayOfWeek - 1] }}
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="时间">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="todaySchedule.length === 0 && !scheduleLoading" description="暂无课程安排" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="姓名">{{ userInfo?.name }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userRoleName }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ userInfo?.username }}</el-descriptions-item>
            <el-descriptions-item v-if="profile?.studentNumber" label="学号">
              {{ profile?.studentNumber }}
            </el-descriptions-item>
            <el-descriptions-item v-if="profile?.teacherNumber" label="工号">
              {{ profile?.teacherNumber }}
            </el-descriptions-item>
            <el-descriptions-item v-if="profile?.className" label="班级">
              {{ profile?.className }}
            </el-descriptions-item>
            <el-descriptions-item v-if="profile?.major" label="专业">
              {{ profile?.major }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速入口</span>
          </template>
          <div class="quick-actions">
            <el-button 
              v-for="action in quickActions" 
              :key="action.path"
              type="primary"
              size="large"
              @click="router.push(action.path)"
              :icon="action.icon"
              plain
            >
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统说明</span>
          </template>
          <div class="system-info">
            <p>本系统是一个完整的校园教务管理系统，包含以下核心功能：</p>
            <ul>
              <li>学籍管理：学生、教师、班级、教室基础数据维护</li>
              <li>排课管理：智能排课，自动检测冲突</li>
              <li>选课管理：学生在线选课，规则引擎校验</li>
              <li>考勤管理：教师考勤录入，学生考勤查询</li>
              <li>成绩管理：成绩录入，自动计算绩点、排名</li>
              <li>报表统计：各类数据报表生成</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import api from '@/api/request';
import { 
  User, UserFilled, Document, List, 
  Calendar, Edit, DataAnalysis, Clock 
} from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const userInfo = computed(() => authStore.userInfo);
const userRole = computed(() => authStore.userRole);
const userRoleName = computed(() => authStore.userRoleName);
const profile = computed(() => authStore.profile);

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const stats = reactive({
  students: 0,
  teachers: 0,
  courses: 0,
  enrollments: 0
});

const todaySchedule = ref([]);
const scheduleLoading = ref(false);

const quickActions = computed(() => {
  const role = userRole.value;
  const actions = [];
  
  if (role === 'admin') {
    actions.push(
      { label: '学生管理', path: '/students', icon: User },
      { label: '课程管理', path: '/courses', icon: Document },
      { label: '报表统计', path: '/reports', icon: DataAnalysis }
    );
  } else if (role === 'teacher') {
    actions.push(
      { label: '考勤录入', path: '/attendance-take', icon: Edit },
      { label: '成绩录入', path: '/grade-entry', icon: Edit },
      { label: '我的课表', path: '/my-schedule', icon: Clock }
    );
  } else if (role === 'student') {
    actions.push(
      { label: '在线选课', path: '/course-selection', icon: List },
      { label: '我的课表', path: '/my-schedule', icon: Clock },
      { label: '我的成绩', path: '/my-grades', icon: DataAnalysis }
    );
  } else if (role === 'homeroom_teacher') {
    actions.push(
      { label: '班级学生', path: '/class-students', icon: UserFilled },
      { label: '考勤记录', path: '/attendances', icon: Calendar },
      { label: '报表统计', path: '/reports', icon: DataAnalysis }
    );
  }
  
  return actions;
});

const loadStats = async () => {
  try {
    const response = await api.get('/reports/student-stats');
    stats.students = response.data.statistics?.totalStudents || 0;
  } catch (error) {
    console.error('加载学生统计失败:', error);
  }
  
  try {
    const response = await api.get('/courses', { params: { pageSize: 1000 } });
    stats.courses = response.data.pagination?.total || response.data.courses?.length || 0;
  } catch (error) {
    console.error('加载课程统计失败:', error);
  }
  
  try {
    const response = await api.get('/teachers', { params: { pageSize: 1000 } });
    stats.teachers = response.data.pagination?.total || response.data.teachers?.length || 0;
  } catch (error) {
    console.error('加载教师统计失败:', error);
  }
};

const loadMySchedule = async () => {
  if (!userRole.value) return;
  
  scheduleLoading.value = true;
  try {
    const params = {
      term: '第1学期',
      academicYear: '2024-2025学年'
    };
    
    const endpoint = '/schedules/my';
    const response = await api.get(endpoint, { params });
    todaySchedule.value = response.data.schedules || [];
  } catch (error) {
    console.error('加载课表失败:', error);
    todaySchedule.value = [];
  } finally {
    scheduleLoading.value = false;
  }
};

onMounted(() => {
  loadStats();
  loadMySchedule();
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  cursor: pointer;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-info {
  margin-left: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-actions .el-button {
  width: calc(33.33% - 7px);
  height: 50px;
}

.system-info p {
  margin: 0 0 10px 0;
  color: #666;
}

.system-info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.system-info li {
  margin: 5px 0;
}
</style>
