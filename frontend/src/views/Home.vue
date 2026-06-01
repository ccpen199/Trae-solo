<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #409EFF; font-weight: bold">{{ stats.residentCount }}</div>
            <div style="color: #909399; margin-top: 10px">居民总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #67C23A; font-weight: bold">{{ stats.totalPoints }}</div>
            <div style="color: #909399; margin-top: 10px">总积分数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #E6A23C; font-weight: bold">{{ stats.activityCount }}</div>
            <div style="color: #909399; margin-top: 10px">活动总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 36px; color: #F56C6C; font-weight: bold">{{ stats.pendingAppeals }}</div>
            <div style="color: #909399; margin-top: 10px">待处理申诉</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold">积分排行榜</span>
              <el-button type="primary" link @click="$router.push('/ranking')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="ranking.slice(0, 5)" size="small">
            <el-table-column type="index" label="排名" width="60">
              <template #default="{ $index }">
                <el-tag v-if="$index === 0" type="danger" effect="dark">1</el-tag>
                <el-tag v-else-if="$index === 1" type="warning" effect="dark">2</el-tag>
                <el-tag v-else-if="$index === 2" type="success" effect="dark">3</el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="earned_points" label="本期积分" width="100" />
            <el-table-column prop="total_points" label="总积分" width="100" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold">最近活动</span>
          </template>
          <el-table :data="activities.slice(0, 5)" size="small">
            <el-table-column prop="title" label="活动名称" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ getTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
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
  residentCount: 0,
  totalPoints: 0,
  activityCount: 0,
  exchangeCount: 0,
  pendingAppeals: 0
})

const ranking = ref([])
const activities = ref([])

const getTypeLabel = (type) => {
  const types = {
    volunteer: '志愿',
    garbage: '垃圾分类',
    activity: '活动',
    civilization: '文明'
  }
  return types[type] || type
}

const getStatusLabel = (status) => {
  const statuses = {
    draft: '草稿',
    published: '已发布',
    ongoing: '进行中',
    completed: '已结束'
  }
  return statuses[status] || status
}

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    published: 'primary',
    ongoing: 'success',
    completed: 'warning'
  }
  return types[status] || 'info'
}

const loadStats = async () => {
  try {
    const res = await axios.get('/api/publication/stats')
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadRanking = async () => {
  try {
    const res = await axios.get('/api/publication/ranking')
    ranking.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadActivities = async () => {
  try {
    const res = await axios.get('/api/activities', { params: { pageSize: 10 } })
    activities.value = res.data.data || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadStats()
  loadRanking()
  loadActivities()
})
</script>
