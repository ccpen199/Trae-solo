<template>
  <div class="my-courses">
    <div class="filter-tabs">
      <el-radio-group v-model="statusFilter">
        <el-radio-button value="all">全部课程</el-radio-button>
        <el-radio-button value="enrolled">学习中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="required">必修课</el-radio-button>
      </el-radio-group>
    </div>

    <el-alert 
      v-if="requiredNotCompleted.length > 0" 
      :title="'有 ' + requiredNotCompleted.length + ' 门必修课未完成'"
      type="warning" 
      show-icon
      style="margin-bottom: 20px;"
    >
      <template #default>
        <span>{{ requiredNotCompleted.map(c => c.title).join('、') }}</span>
      </template>
    </el-alert>

    <el-table :data="filteredCourses" style="width: 100%">
      <el-table-column prop="title" label="课程名称" min-width="180">
        <template #default="{ row }">
          <div class="course-title-cell">
            <span>{{ row.title }}</span>
            <el-tag v-if="row.is_required" type="danger" size="small" style="margin-left: 8px;">必修</el-tag>
            <el-tag v-if="row.is_late" type="warning" size="small" style="margin-left: 4px;">迟到</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="instructor_name" label="讲师" width="90" />
      <el-table-column label="出勤状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.attendance_status === 'present'" type="success" size="small">已签到</el-tag>
          <el-tag v-else-if="row.attendance_status === 'absent'" type="danger" size="small">缺席</el-tag>
          <el-tag v-else type="info" size="small">未开始</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="学习进度" width="160">
        <template #default="{ row }">
          <el-progress :percentage="row.progress || 0" :stroke-width="10" />
        </template>
      </el-table-column>
      <el-table-column label="考试成绩" width="90">
        <template #default="{ row }">
          <span v-if="row.exam_score !== null" :class="{ passed: row.exam_passed, failed: !row.exam_passed }">
            {{ row.exam_score }}分
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="证书" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.certificate_no" type="success" size="small">已获得</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="enrollment_status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.enrollment_status === 'completed' ? 'success' : 'primary'" size="small">
            {{ row.enrollment_status === 'completed' ? '已完成' : '学习中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="live_time" label="直播时间" width="150">
        <template #default="{ row }">{{ formatDate(row.live_time) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="$router.push(`/courses/${row.id}`)">详情</el-button>
          <el-button v-if="row.status !== 'completed'" size="small" @click="$router.push(`/live/${row.id}`)">
            {{ new Date(row.live_time) > new Date() ? '直播' : '回放' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="filteredCourses.length === 0" description="暂无课程" style="margin-top: 60px;" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/api'

const courses = ref([])
const statusFilter = ref('all')

const filteredCourses = computed(() => {
  let data = courses.value
  if (statusFilter.value === 'enrolled') {
    data = data.filter(c => c.enrollment_status === 'enrolled')
  } else if (statusFilter.value === 'completed') {
    data = data.filter(c => c.enrollment_status === 'completed')
  } else if (statusFilter.value === 'required') {
    data = data.filter(c => c.is_required)
  }
  return data
})

const requiredNotCompleted = computed(() => {
  return courses.value.filter(c => c.is_required && c.enrollment_status !== 'completed')
})

async function loadCourses() {
  courses.value = await api.get('/courses/my-courses')
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(loadCourses)
</script>

<style scoped>
.filter-tabs {
  margin-bottom: 20px;
}

.course-title-cell {
  display: flex;
  align-items: center;
}

.passed {
  color: #67c23a;
  font-weight: bold;
}

.failed {
  color: #f56c6c;
  font-weight: bold;
}
</style>
