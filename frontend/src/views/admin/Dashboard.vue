<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon><Reading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalCourses || 0 }}</div>
            <div class="stat-label">课程总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalUsers || 0 }}</div>
            <div class="stat-label">员工总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon orange">
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalEnrollments || 0 }}</div>
            <div class="stat-label">总报名人次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon purple">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.completionRate || 0 }}%</div>
            <div class="stat-label">课程完成率</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon green">
            <el-icon><Medal /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalCertificates || 0 }}</div>
            <div class="stat-label">颁发证书</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-icon blue">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.examPassRate || 0 }}%</div>
            <div class="stat-label">考试通过率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>部门完成情况</span>
          </template>
          <el-table :data="stats?.departmentStats || []" style="width: 100%">
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="total_employees" label="员工数" width="80" />
            <el-table-column prop="total_enrollments" label="报名数" width="80" />
            <el-table-column prop="completed_count" label="完成数" width="80" />
            <el-table-column label="完成率" width="120">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.total_enrollments ? Math.round(row.completed_count / row.total_enrollments * 100) : 0" 
                  :stroke-width="12" 
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>缺席名单</span>
          </template>
          <el-table :data="stats?.absentees || []" style="width: 100%">
            <el-table-column prop="course_title" label="课程" show-overflow-tooltip />
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column prop="department" label="部门" width="100" />
            <el-table-column prop="position" label="岗位" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>课程统计</span>
          <el-button type="primary" @click="exportRecords">
            <el-icon><Download /></el-icon> 导出培训档案
          </el-button>
        </div>
      </template>
      <el-table :data="stats?.courseStats || []" style="width: 100%" size="small">
        <el-table-column prop="title" label="课程名称" min-width="180" />
        <el-table-column label="必修" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.is_required" type="danger" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="enrolled_count" label="报名" width="70" />
        <el-table-column prop="attended_count" label="出勤" width="70" />
        <el-table-column prop="late_count" label="迟到" width="70" />
        <el-table-column prop="completed_count" label="完成" width="70" />
        <el-table-column prop="exam_attempts" label="考试" width="70" />
        <el-table-column prop="exam_passed" label="通过" width="70" />
        <el-table-column label="完成率" width="100">
          <template #default="{ row }">
            <el-tag :type="row.completion_rate >= 80 ? 'success' : row.completion_rate >= 60 ? 'warning' : 'danger'" size="small">
              {{ row.completion_rate || 0 }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>考试统计</span>
      </template>
      <el-table :data="stats?.examStats || []" style="width: 100%" size="small">
        <el-table-column prop="title" label="考试名称" />
        <el-table-column prop="course_title" label="所属课程" width="180" />
        <el-table-column prop="total_participants" label="参考人数" width="100" />
        <el-table-column prop="passed_count" label="通过人数" width="100" />
        <el-table-column label="通过率" width="100">
          <template #default="{ row }">
            <el-tag :type="(row.passed_count / row.total_participants * 100) >= 80 ? 'success' : 'warning'" size="small">
              {{ row.total_participants ? (row.passed_count / row.total_participants * 100).toFixed(1) : 0 }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avg_score" label="平均分" width="100" />
        <el-table-column prop="min_score" label="最低分" width="100" />
        <el-table-column prop="max_score" label="最高分" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElIcon } from 'element-plus'
import { Reading, User, List, CircleCheck, Download, Medal, DataAnalysis } from '@element-plus/icons-vue'
import api from '@/utils/api'

const stats = ref(null)

async function loadStats() {
  stats.value = await api.get('/admin/statistics')
}

async function exportRecords() {
  try {
    const records = await api.get('/admin/export/training-records')
    const headers = ['姓名', '部门', '岗位', '课程名称', '学分', '是否必修', '报名状态', '出勤状态', '是否迟到', '考试分数', '是否通过', '证书编号', '报名时间', '完成时间']
    const csvContent = [
      headers.join(','),
      ...records.map(r => [
        r.name, r.department, r.position, r.course_title, r.credits, 
        r.is_required ? '是' : '否', r.enrollment_status, r.attendance_status || '未签到',
        r.is_late ? '是' : '否', r.exam_score || '-', r.is_passed ? '是' : '否',
        r.certificate_no || '-', r.enrolled_at, r.completed_at || '-'
      ].map(v => `"${v || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `培训档案_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(loadStats)
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.blue { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.stat-icon.orange { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.purple { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
