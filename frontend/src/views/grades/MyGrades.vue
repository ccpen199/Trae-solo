<template>
  <div class="my-grades">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的成绩</span>
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="总学分" :value="totalCredits" suffix="学分" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="GPA" :value="gpa" :precision="2" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已修课程" :value="gradeList.length" suffix="门" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="平均绩点" :value="averageGradePoint" :precision="2" />
        </el-col>
      </el-row>

      <el-table :data="gradeList" stripe v-loading="loading">
        <el-table-column prop="courseName" label="课程名称" />
        <el-table-column prop="teacherName" label="授课教师" />
        <el-table-column prop="usualScore" label="平时成绩" width="100">
          <template #default="{ row }">
            <span v-if="row.usualScore !== null && row.usualScore !== undefined">{{ row.usualScore }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="midtermScore" label="期中成绩" width="100">
          <template #default="{ row }">
            <span v-if="row.midtermScore !== null && row.midtermScore !== undefined">{{ row.midtermScore }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="finalScore" label="期末成绩" width="100">
          <template #default="{ row }">
            <span v-if="row.finalScore !== null && row.finalScore !== undefined">{{ row.finalScore }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总成绩" width="100">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.totalScore)">
              <span v-if="row.totalScore !== null && row.totalScore !== undefined">{{ row.totalScore }}</span>
              <span v-else class="text-muted">-</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeLevel" label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="getGradeType(row.gradeLevel)">
              {{ row.gradeLevel || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradePoint" label="绩点" width="80">
          <template #default="{ row }">
            <span v-if="row.gradePoint !== null && row.gradePoint !== undefined">{{ row.gradePoint }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="rank" label="排名" width="80">
          <template #default="{ row }">
            <span v-if="row.rank">第{{ row.rank }}名</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="term" label="学期" width="120">
          <template #default="{ row }">
            {{ row.term || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/request';

const loading = ref(false);
const gradeList = ref([]);

const totalCredits = computed(() => {
  return gradeList.value
    .filter(item => item.totalScore >= 60)
    .reduce((sum, item) => sum + (item.credits || 0), 0);
});

const gpa = computed(() => {
  const validGrades = gradeList.value.filter(item => item.gradePoint !== null && item.gradePoint !== undefined);
  if (validGrades.length === 0) return 0;
  
  const totalPoints = validGrades.reduce((sum, item) => sum + (item.gradePoint * (item.credits || 0)), 0);
  const totalCredits = validGrades.reduce((sum, item) => sum + (item.credits || 0), 0);
  
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
});

const averageGradePoint = computed(() => {
  const validGrades = gradeList.value.filter(item => item.gradePoint !== null && item.gradePoint !== undefined);
  if (validGrades.length === 0) return 0;
  
  const totalPoints = validGrades.reduce((sum, item) => sum + item.gradePoint, 0);
  return totalPoints / validGrades.length;
});

const getScoreType = (score) => {
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

const loadData = async () => {
  loading.value = true;
  try {
    const response = await api.get('/grades/my');
    gradeList.value = response.data || [];
  } catch (error) {
    console.error('加载成绩失败:', error);
  } finally {
    loading.value = false;
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

.text-muted {
  color: #909399;
}
</style>
