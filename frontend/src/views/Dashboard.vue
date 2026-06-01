<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #3498db">{{ stats.expertCount }}</div>
            <div style="color: #666; margin-top: 10px">专家总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #27ae60">{{ stats.validExpertCount }}</div>
            <div style="color: #666; margin-top: 10px">有效专家</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #e67e22">{{ stats.projectCount }}</div>
            <div style="color: #666; margin-top: 10px">项目总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; font-weight: bold; color: #9b59b6">{{ stats.todayAuditCount }}</div>
            <div style="color: #666; margin-top: 10px">今日操作</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">专家专业领域分布</span>
          </template>
          <el-table :data="fieldStats" border>
            <el-table-column prop="field" label="专业领域" />
            <el-table-column prop="count" label="人数" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">最近项目</span>
          </template>
          <el-table :data="recentProjects" border>
            <el-table-column prop="name" label="项目名称" />
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({
  expertCount: 0,
  validExpertCount: 0,
  projectCount: 0,
  todayAuditCount: 0
})

const fieldStats = ref([])
const recentProjects = ref([])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    extracted: 'success',
    completed: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待抽取',
    extracted: '已抽取',
    completed: '已完成'
  }
  return texts[status] || status
}

onMounted(async () => {
  try {
    const [expertsRes, projectsRes, auditRes] = await Promise.all([
      axios.get('/api/experts'),
      axios.get('/api/projects'),
      axios.get('/api/audit/stats')
    ])

    const experts = expertsRes.data
    const validExperts = experts.filter(e => e.is_valid)
    
    const fieldMap = {}
    experts.forEach(e => {
      fieldMap[e.professional_field] = (fieldMap[e.professional_field] || 0) + 1
    })
    fieldStats.value = Object.entries(fieldMap).map(([field, count]) => ({ field, count }))

    stats.value = {
      expertCount: experts.length,
      validExpertCount: validExperts.length,
      projectCount: projectsRes.data.length,
      todayAuditCount: auditRes.data.today_count || 0
    }

    recentProjects.value = projectsRes.data.slice(0, 5)
  } catch (err) {
    console.error('加载数据失败', err)
  }
})
</script>
