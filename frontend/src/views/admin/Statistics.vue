<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <span>课程评价统计</span>
      </template>
      <el-table :data="evaluations" style="width: 100%">
        <el-table-column prop="course_title" label="课程名称" />
        <el-table-column prop="user_name" label="评价人" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column label="评分" width="150">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="评价内容" show-overflow-tooltip />
        <el-table-column prop="created_at" label="评价时间" width="160">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>考试结果统计</span>
      </template>
      <el-table :data="examResults" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="岗位" width="120" />
        <el-table-column prop="score" label="得分" width="80">
          <template #default="{ row }">
            <span :class="{ passed: row.is_passed, failed: !row.is_passed }">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_passed ? 'success' : 'danger'" size="small">
              {{ row.is_passed ? '通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="attempt_number" label="考试次数" width="100" />
        <el-table-column prop="submitted_at" label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.submitted_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const evaluations = ref([])
const examResults = ref([])

async function loadData() {
  try {
    evaluations.value = await api.get('/admin/evaluations')
  } catch (e) {}
  
  try {
    const exams = await api.get('/exams/course/2')
    if (exams.length > 0) {
      examResults.value = await api.get(`/exams/${exams[0].id}/results`)
    }
  } catch (e) {}
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(loadData)
</script>

<style scoped>
.passed {
  color: #67c23a;
  font-weight: bold;
}

.failed {
  color: #f56c6c;
  font-weight: bold;
}
</style>
