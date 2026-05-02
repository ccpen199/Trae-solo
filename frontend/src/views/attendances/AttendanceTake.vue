<template>
  <div class="attendance-take">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤录入</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="选择课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" style="width: 200px" @change="loadStudents">
            <el-option v-for="item in courseList" :key="item.id" :label="`${item.course_name} (${item.term})`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="考勤日期">
          <el-date-picker
            v-model="searchForm.attendanceDate"
            type="date"
            placeholder="请选择日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="节次">
          <el-select v-model="searchForm.scheduleId" placeholder="请选择节次" style="width: 150px">
            <el-option v-for="item in scheduleList" :key="item.id" :label="`${weekDays[item.day_of_week - 1]?.label} ${item.start_time}-${item.end_time}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAttendance">查询</el-button>
        </el-form-item>
      </el-form>

      <template v-if="studentList.length > 0">
        <div class="action-bar">
          <el-button type="primary" @click="handleBatchStatus('present')" size="small">全选出勤</el-button>
          <el-button type="warning" @click="handleBatchStatus('late')" size="small">全选迟到</el-button>
          <el-button type="info" @click="handleBatchStatus('early_leave')" size="small">全选早退</el-button>
          <el-button type="danger" @click="handleBatchStatus('absent')" size="small">全选旷课</el-button>
          <el-button type="info" @click="handleBatchStatus('leave')" size="small">全选请假</el-button>
        </div>

        <el-table :data="studentList" stripe v-loading="loading" border>
          <el-table-column prop="student_number" label="学号" width="120" />
          <el-table-column prop="student_name" label="姓名" width="100" />
          <el-table-column label="考勤状态" width="300">
            <template #default="{ row }">
              <el-radio-group v-model="row.status" size="small">
                <el-radio-button label="present">出勤</el-radio-button>
                <el-radio-button label="late">迟到</el-radio-button>
                <el-radio-button label="early_leave">早退</el-radio-button>
                <el-radio-button label="absent">旷课</el-radio-button>
                <el-radio-button label="leave">请假</el-radio-button>
              </el-radio-group>
            </template>
          </el-table-column>
          <el-table-column label="备注" width="200">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="备注" size="small" />
            </template>
          </el-table-column>
        </el-table>

        <div class="action-bar" style="margin-top: 20px; text-align: right">
          <el-button type="primary" @click="handleSave" :loading="saving" size="large">保存考勤记录</el-button>
        </div>
      </template>

      <template v-else>
        <el-empty description="请先选择课程和日期" />
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api/request';

const loading = ref(false);
const saving = ref(false);
const courseList = ref([]);
const scheduleList = ref([]);
const studentList = ref([]);

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
];

const searchForm = reactive({
  courseId: null,
  attendanceDate: new Date().toISOString().split('T')[0],
  scheduleId: null
});

const currentSchedule = computed(() => {
  return scheduleList.value.find(s => s.id === searchForm.scheduleId);
});

const loadCourses = async () => {
  try {
    const response = await api.get('/courses/teacher');
    courseList.value = response.data || [];
  } catch (error) {
    console.error('加载课程列表失败:', error);
  }
};

const loadStudents = async () => {
  if (!searchForm.courseId) return;
  
  loading.value = true;
  try {
    const [enrollRes, scheduleRes] = await Promise.all([
      api.get(`/enrollments/course/${searchForm.courseId}`),
      api.get(`/schedules/course/${searchForm.courseId}`)
    ]);
    
    studentList.value = (enrollRes.data || []).map(item => ({
      ...item,
      student_number: item.student_number,
      student_name: item.student_name,
      status: 'present',
      remark: ''
    }));
    
    scheduleList.value = scheduleRes.data || [];
    if (scheduleList.value.length > 0) {
      searchForm.scheduleId = scheduleList.value[0].id;
    }
  } catch (error) {
    console.error('加载学生列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadAttendance = async () => {
  if (!searchForm.courseId || !searchForm.attendanceDate) return;
  
  loading.value = true;
  try {
    const response = await api.get('/attendances/date', {
      params: {
        courseId: searchForm.courseId,
        date: searchForm.attendanceDate,
        scheduleId: searchForm.scheduleId
      }
    });
    
    if (response.data && response.data.length > 0) {
      studentList.value = response.data.map(item => ({
        ...item,
        student_number: item.student_number,
        student_name: item.student_name,
        status: item.status || 'present',
        remark: item.remark || ''
      }));
    }
  } catch (error) {
    console.error('加载考勤记录失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleBatchStatus = (status) => {
  studentList.value.forEach(item => {
    item.status = status;
  });
};

const handleSave = async () => {
  if (!searchForm.courseId || !searchForm.attendanceDate || !searchForm.scheduleId) {
    ElMessage.warning('请选择课程、日期和节次');
    return;
  }
  
  if (studentList.value.length === 0) {
    ElMessage.warning('没有学生需要考勤');
    return;
  }
  
  saving.value = true;
  try {
    const attendances = studentList.value.map(item => ({
      id: item.id,
      studentId: item.student_id,
      status: item.status,
      remark: item.remark
    }));
    
    await api.post('/attendances/batch', {
      courseId: searchForm.courseId,
      scheduleId: searchForm.scheduleId,
      attendanceDate: searchForm.attendanceDate,
      attendances
    });
    
    ElMessage.success('考勤记录保存成功');
    loadAttendance();
  } catch (error) {
    console.error('保存考勤记录失败:', error);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCourses();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-bar {
  margin-bottom: 15px;
}

.action-bar .el-button {
  margin-right: 10px;
}
</style>
