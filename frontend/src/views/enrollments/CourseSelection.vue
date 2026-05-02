<template>
  <div class="course-selection">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>在线选课</span>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </template>

      <el-alert title="选课规则说明" type="info" style="margin-bottom: 20px" show-icon>
        <template #default>
          <ul>
            <li>每学期最多可选 {{ rules.maxCredits }} 学分，最少 {{ rules.minCredits }} 学分</li>
            <li>每学期最多可选 {{ rules.maxCourses }} 门课程</li>
            <li>选课系统会自动检测时间冲突</li>
            <li>部分课程可能有先修要求</li>
          </ul>
        </template>
      </el-alert>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="可选课程" name="available">
          <el-table :data="availableCourses" stripe v-loading="loading">
            <el-table-column prop="course_name" label="课程名称" />
            <el-table-column prop="course_code" label="课程代码" width="120" />
            <el-table-column prop="course_type" label="课程类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getCourseType(row.course_type)">
                  {{ getCourseTypeText(row.course_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="credits" label="学分" width="80" />
            <el-table-column prop="teacher_name" label="授课教师" width="120" />
            <el-table-column prop="current_students" label="已选/容量" width="100">
              <template #default="{ row }">
                {{ row.current_students || 0 }}/{{ row.max_students || 30 }}
              </template>
            </el-table-column>
            <el-table-column prop="term" label="学期" width="100" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  link 
                  :disabled="(row.current_students || 0) >= (row.max_students || 30)"
                  @click="handleEnroll(row)"
                >
                  选课
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="已选课程" name="enrolled">
          <el-table :data="enrolledCourses" stripe v-loading="loading">
            <el-table-column prop="course_name" label="课程名称" />
            <el-table-column prop="course_code" label="课程代码" width="120" />
            <el-table-column prop="course_type" label="课程类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getCourseType(row.course_type)">
                  {{ getCourseTypeText(row.course_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="credits" label="学分" width="80" />
            <el-table-column prop="teacher_name" label="授课教师" width="120" />
            <el-table-column prop="enroll_time" label="选课时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.enroll_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="danger" 
                  link 
                  :disabled="row.status !== 'enrolled'"
                  @click="handleDrop(row)"
                >
                  退课
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/request';

const loading = ref(false);
const activeTab = ref('available');
const availableCourses = ref([]);
const enrolledCourses = ref([]);

const rules = reactive({
  maxCredits: 24,
  minCredits: 12,
  maxCourses: 8
});

const getCourseType = (type) => {
  const types = {
    required: 'danger',
    elective: 'primary',
    optional: 'warning'
  };
  return types[type] || 'info';
};

const getCourseTypeText = (type) => {
  const texts = {
    required: '必修',
    elective: '选修',
    optional: '任选'
  };
  return texts[type] || type;
};

const getStatusType = (status) => {
  const types = {
    enrolled: 'success',
    dropped: 'info',
    pending: 'warning'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    enrolled: '已选',
    dropped: '已退',
    pending: '待审核'
  };
  return texts[status] || status;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return new Date(dateTime).toLocaleString('zh-CN');
};

const loadData = async () => {
  loading.value = true;
  try {
    const [availableRes, enrolledRes] = await Promise.all([
      api.get('/courses/available'),
      api.get('/enrollments/my')
    ]);
    availableCourses.value = availableRes.data || [];
    enrolledCourses.value = enrolledRes.data || [];
  } catch (error) {
    console.error('加载选课数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleEnroll = async (course) => {
  try {
    await ElMessageBox.confirm(`确定要选择课程「${course.course_name}」吗？`, '选课确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    });
    
    await api.post('/enrollments/enroll', { courseId: course.id });
    ElMessage.success('选课成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('选课失败:', error);
    }
  }
};

const handleDrop = async (enrollment) => {
  try {
    await ElMessageBox.confirm(`确定要退选课程「${enrollment.course_name}」吗？`, '退课确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await api.post('/enrollments/drop', { enrollmentId: enrollment.id });
    ElMessage.success('退课成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退课失败:', error);
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
