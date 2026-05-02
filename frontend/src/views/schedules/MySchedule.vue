<template>
  <div class="my-schedule">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的课表</span>
          <div class="header-actions">
            <el-select v-model="searchForm.term" placeholder="选择学期" style="width: 120px" @change="loadData">
              <el-option label="第1学期" value="第1学期" />
              <el-option label="第2学期" value="第2学期" />
            </el-select>
            <el-select v-model="searchForm.academicYear" placeholder="选择学年" style="width: 150px" @change="loadData">
              <el-option label="2024-2025学年" value="2024-2025学年" />
              <el-option label="2023-2024学年" value="2023-2024学年" />
            </el-select>
          </div>
        </div>
      </template>

      <div class="schedule-container" v-loading="loading">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="time-header">时间</th>
              <th v-for="day in weekDays" :key="day.value">{{ day.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="timeSlot in timeSlots" :key="timeSlot.id">
              <td class="time-cell">
                <div class="time-period">{{ timeSlot.period }}</div>
                <div class="time-range">{{ timeSlot.start }} - {{ timeSlot.end }}</div>
              </td>
              <td v-for="day in weekDays" :key="day.value">
                <template v-if="getScheduleCell(day.value, timeSlot.id)">
                  <div class="schedule-cell has-class">
                    <div class="course-name">{{ getScheduleCell(day.value, timeSlot.id).courseName }}</div>
                    <div class="course-info">
                      <span>{{ getScheduleCell(day.value, timeSlot.id).teacherName }}</span>
                    </div>
                    <div class="course-info">
                      <span>{{ getScheduleCell(day.value, timeSlot.id).roomName }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="schedule-cell"></div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <el-empty v-if="scheduleList.length === 0 && !loading" description="暂无课程安排" />
      </div>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>课程列表</span>
      </template>
      <el-table :data="scheduleList" stripe v-loading="loading">
        <el-table-column prop="courseName" label="课程名称" />
        <el-table-column prop="teacherName" label="授课教师" />
        <el-table-column prop="roomName" label="上课教室" />
        <el-table-column prop="dayOfWeek" label="星期">
          <template #default="{ row }">
            {{ weekDays[row.dayOfWeek - 1]?.label }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="上课时间">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="weekType" label="周次">
          <template #default="{ row }">
            {{ weekTypeMap[row.weekType] }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/api/request';

const authStore = useAuthStore();
const userRole = computed(() => authStore.userRole);

const loading = ref(false);
const scheduleList = ref([]);

const searchForm = reactive({
  term: '第1学期',
  academicYear: '2024-2025学年'
});

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
];

const timeSlots = [
  { id: 1, period: '第1-2节', start: '08:00', end: '09:40' },
  { id: 2, period: '第3-4节', start: '10:00', end: '11:40' },
  { id: 3, period: '第5-6节', start: '14:00', end: '15:40' },
  { id: 4, period: '第7-8节', start: '16:00', end: '17:40' },
  { id: 5, period: '第9-10节', start: '19:00', end: '20:40' }
];

const weekTypeMap = {
  all: '全周',
  odd: '单周',
  even: '双周'
};

const scheduleMap = computed(() => {
  const map = {};
  scheduleList.value.forEach(item => {
    const key = `${item.dayOfWeek}-${getTimeSlotId(item.startTime)}`;
    map[key] = item;
  });
  return map;
});

const getTimeSlotId = (startTime) => {
  const slot = timeSlots.find(s => s.start === startTime);
  return slot ? slot.id : 1;
};

const getScheduleCell = (day, timeSlotId) => {
  const key = `${day}-${timeSlotId}`;
  return scheduleMap.value[key];
};

const loadData = async () => {
  loading.value = true;
  try {
    const endpoint = '/schedules/my';
    const response = await api.get(endpoint, { 
      params: {
        term: searchForm.term,
        academicYear: searchForm.academicYear
      }
    });
    scheduleList.value = response.data.schedules || [];
  } catch (error) {
    console.error('加载课表失败:', error);
    scheduleList.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.my-schedule {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.schedule-container {
  overflow-x: auto;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #ebeef5;
  padding: 8px;
  text-align: center;
}

.time-header {
  width: 120px;
  background: #f5f7fa;
}

.time-cell {
  background: #f5f7fa;
  font-size: 12px;
}

.time-period {
  font-weight: bold;
  margin-bottom: 4px;
}

.time-range {
  color: #909399;
}

.schedule-cell {
  height: 80px;
  vertical-align: middle;
}

.schedule-cell.has-class {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.schedule-cell.has-class:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.course-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.course-info {
  font-size: 12px;
  opacity: 0.9;
}
</style>
