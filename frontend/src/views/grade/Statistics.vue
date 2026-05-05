<template>
  <div class="statistics-container">
    <el-card>
      <template #header>
        <span>成绩统计</span>
      </template>

      <div class="filters">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="课程">
            <el-select v-model="filterForm.courseId" placeholder="全部课程" clearable filterable style="width: 200px">
              <el-option v-for="item in courseList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="filterForm.classId" placeholder="全部班级" clearable filterable style="width: 180px">
              <el-option v-for="item in classList" :key="item.id" :label="item.className" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="学年">
            <el-select v-model="filterForm.academicYear" placeholder="全部学年" clearable style="width: 150px">
              <el-option v-for="year in academicYears" :key="year" :label="year" :value="year" />
            </el-select>
          </el-form-item>
          <el-form-item label="学期">
            <el-select v-model="filterForm.semester" placeholder="全部学期" clearable style="width: 120px">
              <el-option label="第一学期" :value="1" />
              <el-option label="第二学期" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadStatistics">统计</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-row :gutter="20" class="stat-cards">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #409EFF, #66b1ff)">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalCount || 0 }}</div>
                <div class="stat-label">总人数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #67C23A, #85ce61)">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.passCount || 0 }}</div>
                <div class="stat-label">及格人数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #F56C6C, #f78989)">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.failCount || 0 }}</div>
                <div class="stat-label">不及格人数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #E6A23C, #ebb563)">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.passRate || '0' }}%</div>
                <div class="stat-label">及格率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>分数段分布</span>
            </template>
            <el-table :data="scoreDistribution" border style="width: 100%">
              <el-table-column prop="range" label="分数段" width="120" />
              <el-table-column prop="count" label="人数" width="80" align="center" />
              <el-table-column prop="percentage" label="占比" width="120" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="18" :text-inside="true" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>等级分布</span>
            </template>
            <el-table :data="levelDistribution" border style="width: 100%">
              <el-table-column prop="level" label="等级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLevelType(row.level)" size="small">
                    {{ row.level }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="人数" width="80" align="center" />
              <el-table-column prop="percentage" label="占比" width="120" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="18" :text-inside="true" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>详细统计</span>
            <el-button type="primary" size="small" @click="exportStatistics">
              <el-icon><Download /></el-icon>
              导出报表
            </el-button>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="平均分">
                <span class="highlight-value">{{ statistics.avgScore || '0' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="最高分">
                <span class="highlight-value success">{{ statistics.maxScore || '0' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="最低分">
                <span class="highlight-value danger">{{ statistics.minScore || '0' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="标准差">
                <span class="highlight-value">{{ statistics.stdDev || '0' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { gradeApi, courseApi, classApi } from '@/api'

const loading = ref(false)
const courseList = ref([])
const classList = ref([])
const statistics = ref({})
const scoreDistribution = ref([])
const levelDistribution = ref([])

const currentYear = new Date().getFullYear()
const academicYears = computed(() => {
  const years = []
  for (let i = 0; i < 6; i++) {
    const startYear = currentYear - i
    years.push(`${startYear}-${startYear + 1}`)
  }
  return years
})

const filterForm = reactive({
  courseId: null,
  classId: null,
  academicYear: null,
  semester: null
})

const getLevelType = (level) => {
  const map = {
    '优秀': 'success',
    '良好': 'primary',
    '中等': 'info',
    '及格': 'warning',
    '不及格': 'danger'
  }
  return map[level] || 'info'
}

const loadCourses = async () => {
  try {
    const res = await courseApi.list({ pageSize: 1000 })
    courseList.value = res.data?.list || []
  } catch (error) {
    console.error('加载课程失败:', error)
  }
}

const loadClasses = async () => {
  try {
    const res = await classApi.list({ pageSize: 1000 })
    classList.value = res.data?.list || []
  } catch (error) {
    console.error('加载班级失败:', error)
  }
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const res = await gradeApi.getStatistics(filterForm)
    const data = res.data || {}
    statistics.value = data

    scoreDistribution.value = [
      { range: '90-100', count: data.range90_100 || 0, percentage: calcPercentage(data.range90_100, data.totalCount) },
      { range: '80-89', count: data.range80_89 || 0, percentage: calcPercentage(data.range80_89, data.totalCount) },
      { range: '70-79', count: data.range70_79 || 0, percentage: calcPercentage(data.range70_79, data.totalCount) },
      { range: '60-69', count: data.range60_69 || 0, percentage: calcPercentage(data.range60_69, data.totalCount) },
      { range: '0-59', count: data.range0_59 || 0, percentage: calcPercentage(data.range0_59, data.totalCount) }
    ]

    levelDistribution.value = [
      { level: '优秀', count: data.levelExcellent || 0, percentage: calcPercentage(data.levelExcellent, data.totalCount) },
      { level: '良好', count: data.levelGood || 0, percentage: calcPercentage(data.levelGood, data.totalCount) },
      { level: '中等', count: data.levelMedium || 0, percentage: calcPercentage(data.levelMedium, data.totalCount) },
      { level: '及格', count: data.levelPass || 0, percentage: calcPercentage(data.levelPass, data.totalCount) },
      { level: '不及格', count: data.levelFail || 0, percentage: calcPercentage(data.levelFail, data.totalCount) }
    ]
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

const calcPercentage = (count, total) => {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

const resetFilter = () => {
  filterForm.courseId = null
  filterForm.classId = null
  filterForm.academicYear = null
  filterForm.semester = null
  loadStatistics()
}

const exportStatistics = () => {
  ElMessage.info('导出功能开发中...')
}

onMounted(() => {
  loadCourses()
  loadClasses()
  loadStatistics()
})
</script>

<style scoped>
.statistics-container {
  padding: 0;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 10px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.stat-info {
  margin-left: 15px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.chart-card {
  min-height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.highlight-value {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
}

.highlight-value.success {
  color: #67C23A;
}

.highlight-value.danger {
  color: #F56C6C;
}
</style>
