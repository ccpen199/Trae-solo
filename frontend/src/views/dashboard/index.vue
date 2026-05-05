<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <el-icon :size="30"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.orgCount }}</div>
              <div class="stat-label">机构数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">用户数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <el-icon :size="30"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayScheduleCount }}</div>
              <div class="stat-label">今日日程</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <el-icon :size="30"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.roleCount }}</div>
              <div class="stat-label">角色数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="schedule-card">
          <template #header>
            <div class="card-header">
              <span>今日日程</span>
              <el-button type="primary" link @click="goToSchedule">查看全部</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(schedule, index) in todaySchedules"
              :key="schedule.id"
              :timestamp="formatTime(schedule.startTime)"
              placement="top"
              :type="schedule.type === 'meeting' ? 'warning' : schedule.type === 'department' ? 'primary' : 'success'"
            >
              <el-card class="schedule-item">
                <div class="schedule-title">
                  <el-tag :type="getScheduleTypeTag(schedule.type)" size="small" style="margin-right: 8px;">
                    {{ getScheduleTypeText(schedule.type) }}
                  </el-tag>
                  {{ schedule.title }}
                </div>
                <div class="schedule-meta">
                  <span v-if="schedule.location">
                    <el-icon><Location /></el-icon> {{ schedule.location }}
                  </span>
                  <span v-if="schedule.creator">
                    <el-icon><User /></el-icon> {{ schedule.creator.realName }}
                  </span>
                </div>
              </el-card>
            </el-timeline-item>
            <el-timeline-item v-if="todaySchedules.length === 0" placement="top">
              <div class="empty-message">暂无今日日程</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-icon">
              <el-icon :size="60"><Hand /></el-icon>
            </div>
            <div class="welcome-text">
              <h3>欢迎回来，{{ userStore.userInfo?.realName }}！</h3>
              <p>{{ userStore.userInfo?.organization?.name || '' }}</p>
              <div class="roles">
                <el-tag v-for="role in userStore.userInfo?.roles" :key="role.id" size="small" style="margin-right: 5px;">
                  {{ role.name }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="quick-actions" style="margin-top: 20px;">
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="12" style="margin-bottom: 10px;">
              <el-button type="primary" class="action-btn" @click="goToSchedule">
                <el-icon><Calendar /></el-icon>
                <span>查看日程</span>
              </el-button>
            </el-col>
            <el-col :span="12" style="margin-bottom: 10px;">
              <el-button type="success" class="action-btn" @click="goToOrganization">
                <el-icon><OfficeBuilding /></el-icon>
                <span>机构管理</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button type="warning" class="action-btn" @click="goToRole">
                <el-icon><UserFilled /></el-icon>
                <span>角色管理</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button type="info" class="action-btn">
                <el-icon><Bell /></el-icon>
                <span>公告通知</span>
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/user';
import { getOrganizations } from '@/api/organization';
import { getRoles } from '@/api/role';
import { getMySchedules } from '@/api/schedule';

const router = useRouter();
const userStore = useUserStore();

const stats = ref({
  orgCount: 0,
  userCount: 0,
  roleCount: 0,
  todayScheduleCount: 0
});

const todaySchedules = ref([]);

const formatTime = (time) => {
  return dayjs(time).format('HH:mm');
};

const getScheduleTypeText = (type) => {
  const map = {
    personal: '个人',
    department: '部门',
    meeting: '会议'
  };
  return map[type] || '其他';
};

const getScheduleTypeTag = (type) => {
  const map = {
    personal: 'success',
    department: 'primary',
    meeting: 'warning'
  };
  return map[type] || '';
};

const goToSchedule = () => {
  router.push('/schedule');
};

const goToOrganization = () => {
  router.push('/organization');
};

const goToRole = () => {
  router.push('/role');
};

const loadData = async () => {
  try {
    const [orgRes, roleRes, scheduleRes] = await Promise.all([
      getOrganizations(),
      getRoles(),
      getMySchedules()
    ]);

    stats.value.orgCount = orgRes.data?.length || 0;
    stats.value.roleCount = roleRes.data?.length || 0;
    
    const today = dayjs().format('YYYY-MM-DD');
    const todayStart = dayjs(today).startOf('day').toISOString();
    const todayEnd = dayjs(today).endOf('day').toISOString();
    
    stats.value.todayScheduleCount = (scheduleRes.data || []).filter(s => {
      const startTime = dayjs(s.startTime);
      return startTime.isAfter(todayStart) && startTime.isBefore(todayEnd);
    }).length;

    todaySchedules.value = (scheduleRes.data || []).filter(s => {
      const startTime = dayjs(s.startTime);
      return startTime.isAfter(todayStart) && startTime.isBefore(todayEnd);
    }).slice(0, 5);
  } catch (error) {
    console.error('加载数据失败:', error);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  margin-left: 15px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-item {
  cursor: pointer;
  transition: all 0.3s;
}

.schedule-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.schedule-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.schedule-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 20px;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #999;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-content {
  display: flex;
  align-items: center;
  color: #fff;
}

.welcome-icon {
  opacity: 0.8;
}

.welcome-text {
  margin-left: 20px;
}

.welcome-text h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

.welcome-text p {
  margin: 0 0 10px 0;
  font-size: 14px;
  opacity: 0.8;
}

.action-btn {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
</style>
