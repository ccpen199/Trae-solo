<template>
  <div class="my-attendance">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的考勤</span>
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="4">
          <el-statistic title="总记录数" :value="stats.total || 0" />
        </el-col>
        <el-col :span="4">
          <el-statistic title="出勤" :value="stats.present || 0">
            <template #suffix>
              <span style="color: #67c23a">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="迟到" :value="stats.late || 0">
            <template #suffix>
              <span style="color: #e6a23c">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="早退" :value="stats.earlyLeave || 0">
            <template #suffix>
              <span style="color: #e6a23c">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="缺勤" :value="stats.absent || 0">
            <template #suffix>
              <span style="color: #f56c6c">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="出勤率" :value="attendanceRate" :precision="2">
            <template #suffix>%</template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable filterable>
            <el-option v-for="item in courseOptions" :key="item.id" :label="item.courseName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="出勤" value="present" />
            <el-option label="迟到" value="late" />
            <el-option label="早退" value="early_leave" />
            <el-option label="缺勤" value="absent" />
            <el-option label="请假" value="leave" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="searchForm.attendanceDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="attendanceList" stripe v-loading="loading">
        <el-table-column prop="courseName" label="课程名称" width="150" />
        <el-table-column prop="teacherName" label="授课教师" width="100">
          <template #default="{ row }">
            {{ row.teacherName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="roomName" label="教室" width="100">
          <template #default="{ row }">
            {{ row.roomName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="attendanceDate" label="考勤日期" width="120" />
        <el-table-column prop="startTime" label="上课时间" width="120">
          <template #default="{ row }">
            {{ row.startTime ? `${row.startTime} - ${row.endTime}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="200">
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import api from '@/api/request';

const loading = ref(false);

const searchForm = reactive({
  courseId: null,
  status: '',
  attendanceDate: null
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const attendanceList = ref([]);
const courseOptions = ref([]);
const stats = ref({});

const attendanceRate = computed(() => {
  const total = stats.value.total || 0;
  if (total === 0) return 0;
  const valid = (stats.value.present || 0) + (stats.value.late || 0) + (stats.value.leave || 0) + (stats.value.earlyLeave || 0);
  return Math.round((valid / total) * 10000) / 100;
});

const getStatusType = (status) => {
  const types = {
    present: 'success',
    late: 'warning',
    early_leave: 'warning',
    absent: 'danger',
    leave: 'primary'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    present: '出勤',
    late: '迟到',
    early_leave: '早退',
    absent: '缺勤',
    leave: '请假'
  };
  return texts[status] || status;
};

const loadOptions = async () => {
  try {
    const response = await api.get('/courses', { params: { pageSize: 1000 } });
    courseOptions.value = response.data.courses || [];
  } catch (error) {
    console.error('加载选项失败:', error);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    const response = await api.get('/attendances/my', { params });
    attendanceList.value = response.data.attendances || [];
    pagination.total = response.data.pagination?.total || 0;
    stats.value = response.data.statistics || {};
  } catch (error) {
    console.error('加载考勤记录失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.courseId = null;
  searchForm.status = '';
  searchForm.attendanceDate = null;
  handleSearch();
};

onMounted(() => {
  loadOptions();
  loadData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
