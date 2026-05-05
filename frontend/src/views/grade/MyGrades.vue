<template>
  <div class="my-grades-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的成绩</span>
          <el-button type="primary" size="small" @click="loadGrades">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="filters" v-if="classList.length > 0 || courseList.length > 0">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="课程">
            <el-select
              v-model="filterForm.courseId"
              placeholder="全部课程"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="item in courseList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="学年">
            <el-select
              v-model="filterForm.academicYear"
              placeholder="全部学年"
              clearable
              style="width: 150px"
            >
              <el-option
                v-for="year in academicYears"
                :key="year"
                :label="year"
                :value="year"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="学期">
            <el-select
              v-model="filterForm.semester"
              placeholder="全部学期"
              clearable
              style="width: 120px"
            >
              <el-option label="第一学期" :value="1" />
              <el-option label="第二学期" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadGrades">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        v-loading="loading"
        :data="gradeList"
        border
        stripe
        style="width: 100%"
        :empty-text="loading ? '加载中...' : '暂无成绩数据'"
      >
        <el-table-column prop="student.studentNumber" label="学号" width="120" />
        <el-table-column prop="student.name" label="姓名" width="100" />
        <el-table-column prop="course.name" label="课程名称" min-width="180" />
        <el-table-column prop="course.credit" label="学分" width="80" align="center" />
        <el-table-column prop="academicYear" label="学年" width="120" align="center" />
        <el-table-column prop="semester" label="学期" width="80" align="center">
          <template #default="{ row }">
            <span>{{ row.semester === 1 ? '第一学期' : '第二学期' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreType(row.score)" size="small">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gpa" label="绩点" width="80" align="center" />
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        background
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-card class="statistics-card">
      <template #header>
        <span>成绩统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">已修课程</div>
            <div class="stat-value">{{ statistics.totalCourses || 0 }} 门</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">已获学分</div>
            <div class="stat-value">{{ statistics.totalCredits || 0 }} 分</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">平均分</div>
            <div class="stat-value">{{ statistics.avgScore || 0 }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">GPA</div>
            <div class="stat-value">{{ statistics.gpa || 0 }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { studentApi, courseApi, gradeApi } from '@/api'

const loading = ref(false)
const gradeList = ref([])
const classList = ref([])
const courseList = ref([])
const total = ref(0)
const statistics = ref({})

const academicYears = computed(() => {
  const years = new Set(gradeList.value.map(g => g.academicYear).filter(Boolean))
  return Array.from(years).sort((a, b) => b.localeCompare(a))
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const filterForm = reactive({
  courseId: null,
  academicYear: null,
  semester: null
})

const getScoreType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

const getLevelType = (level) => {
  const typeMap = {
    '优秀': 'success',
    '良好': 'primary',
    '中等': 'info',
    '及格': 'warning',
    '不及格': 'danger'
  }
  return typeMap[level] || 'info'
}

const loadCourses = async () => {
  try {
    const res = await courseApi.list({ pageSize: 1000 })
    courseList.value = res.data?.list || []
  } catch (error) {
    console.error('加载课程失败:', error)
  }
}

const loadGrades = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterForm
    }
    const res = await gradeApi.getMyGrades(params)
    gradeList.value = res.data?.list || []
    total.value = res.data?.total || 0
    statistics.value = res.data?.statistics || {}
  } catch (error) {
    ElMessage.error('加载成绩失败')
    console.error('加载成绩失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.courseId = null
  filterForm.academicYear = null
  filterForm.semester = null
  pagination.page = 1
  loadGrades()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadGrades()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadGrades()
}

onMounted(() => {
  loadCourses()
  loadGrades()
})
</script>

<style scoped>
.my-grades-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.statistics-card {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
</style>
