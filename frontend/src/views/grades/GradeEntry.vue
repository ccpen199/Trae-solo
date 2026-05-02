<template>
  <div class="grade-entry">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成绩录入</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="选择课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" style="width: 300px" @change="loadGrades">
            <el-option v-for="item in courseList" :key="item.id" :label="`${item.course_name} (${item.term})`" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template v-if="searchForm.courseId">
        <el-alert title="成绩录入说明" type="info" style="margin-bottom: 20px" show-icon>
          <template #default>
            <ul>
              <li>平时成绩占 30%，期中成绩占 30%，期末成绩占 40%</li>
              <li>总分、绩点、等级由系统自动计算</li>
              <li>成绩状态：草稿 → 已提交 → 已审核 → 已归档</li>
            </ul>
          </template>
        </el-alert>

        <div class="action-bar">
          <el-button type="primary" @click="handleBatchSave" :loading="saving">保存草稿</el-button>
          <el-button type="success" @click="handleSubmit" :loading="submitting">提交成绩</el-button>
          <el-button @click="loadGrades">刷新</el-button>
        </div>

        <el-table :data="gradeList" stripe v-loading="loading" border>
          <el-table-column prop="student_number" label="学号" width="120" fixed />
          <el-table-column prop="student_name" label="姓名" width="100" fixed />
          <el-table-column label="平时成绩 (30%)" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.usual_score" 
                :min="0" 
                :max="100" 
                :precision="1"
                controls-position="right"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="期中成绩 (30%)" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.midterm_score" 
                :min="0" 
                :max="100" 
                :precision="1"
                controls-position="right"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="期末成绩 (40%)" width="120">
            <template #default="{ row }">
              <el-input-number 
                v-model="row.final_score" 
                :min="0" 
                :max="100" 
                :precision="1"
                controls-position="right"
                size="small"
              />
            </template>
          </el-table-column>
          <el-table-column label="总成绩" width="100">
            <template #default="{ row }">
              <el-tag :type="getScoreType(calculateTotal(row))">
                {{ calculateTotal(row) !== null ? calculateTotal(row).toFixed(1) : '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="绩点" width="80">
            <template #default="{ row }">
              <span v-if="row.grade_point !== null">{{ row.grade_point }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="等级" width="80">
            <template #default="{ row }">
              <el-tag :type="getGradeType(row.grade_level)">
                {{ row.grade_level || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排名" width="80">
            <template #default="{ row }">
              <span v-if="row.rank">第{{ row.rank }}名</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>

      <template v-else>
        <el-empty description="请先选择课程" />
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/api/request';

const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const courseList = ref([]);
const gradeList = ref([]);

const searchForm = reactive({
  courseId: null
});

const calculateTotal = (row) => {
  if (row.usual_score === null && row.midterm_score === null && row.final_score === null) {
    return null;
  }
  const usual = row.usual_score || 0;
  const midterm = row.midterm_score || 0;
  const final = row.final_score || 0;
  return usual * 0.3 + midterm * 0.3 + final * 0.4;
};

const getScoreType = (score) => {
  if (score === null) return 'info';
  if (score >= 90) return 'success';
  if (score >= 80) return 'primary';
  if (score >= 60) return 'warning';
  return 'danger';
};

const getGradeType = (level) => {
  const types = {
    A: 'success',
    B: 'primary',
    C: 'warning',
    D: 'info',
    F: 'danger'
  };
  return types[level] || 'info';
};

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    archived: 'primary'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审核',
    archived: '已归档'
  };
  return texts[status] || status;
};

const loadCourses = async () => {
  try {
    const response = await api.get('/courses/teacher');
    courseList.value = response.data || [];
  } catch (error) {
    console.error('加载课程列表失败:', error);
  }
};

const loadGrades = async () => {
  if (!searchForm.courseId) return;
  
  loading.value = true;
  try {
    const response = await api.get(`/grades/course/${searchForm.courseId}`);
    gradeList.value = response.data || [];
  } catch (error) {
    console.error('加载成绩失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleBatchSave = async () => {
  saving.value = true;
  try {
    const grades = gradeList.value.map(item => ({
      id: item.id,
      usual_score: item.usual_score,
      midterm_score: item.midterm_score,
      final_score: item.final_score
    }));
    
    await api.put('/grades/batch', { grades, status: 'draft' });
    ElMessage.success('保存成功');
    loadGrades();
  } catch (error) {
    console.error('保存失败:', error);
  } finally {
    saving.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const grades = gradeList.value.map(item => ({
      id: item.id,
      usual_score: item.usual_score,
      midterm_score: item.midterm_score,
      final_score: item.final_score
    }));
    
    await api.put('/grades/batch', { grades, status: 'submitted' });
    ElMessage.success('提交成功，成绩已进入待审核状态');
    loadGrades();
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
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
  margin-bottom: 20px;
}

.text-muted {
  color: #909399;
}
</style>
