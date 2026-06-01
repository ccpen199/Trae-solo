<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">积分排行公示</span>
          <div>
            <el-radio-group v-model="period" @change="loadData">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="year">本年</el-radio-button>
            </el-radio-group>
            <el-button type="primary" style="margin-left: 10px" @click="publishRanking">发布公示</el-button>
          </div>
        </div>
      </template>

      <el-table :data="ranking" v-loading="loading">
        <el-table-column type="index" label="排名" width="80" align="center">
          <template #default="{ $index }">
            <div v-if="$index === 0" style="font-size: 24px">🥇</div>
            <div v-else-if="$index === 1" style="font-size: 24px">🥈</div>
            <div v-else-if="$index === 2" style="font-size: 24px">🥉</div>
            <span v-else style="font-weight: bold; font-size: 16px">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="楼栋信息" width="150">
          <template #default="{ row }">
            {{ row.building || '-' }}栋{{ row.unit || '-' }}单元{{ row.room_number || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="身份" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.is_party_member" type="danger" size="small" style="margin-right: 5px">党员</el-tag>
            <el-tag v-if="row.is_volunteer" type="success" size="small">志愿者</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="earned_points" label="本期积分" width="120">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #67C23A; font-size: 16px">{{ row.earned_points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_points" label="总积分" width="100" />
        <el-table-column prop="available_points" label="可用积分" width="100" />
      </el-table>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <span style="font-weight: bold">历史公示记录</span>
      </template>

      <el-table :data="publications" size="small">
        <el-table-column prop="period" label="周期" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="published_by" label="发布人" width="100" />
        <el-table-column prop="created_at" label="发布时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewPublication(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="publicationDialogVisible" title="公示详情" width="600px">
      <el-descriptions :column="2" border v-if="currentPublication">
        <el-descriptions-item label="周期">{{ currentPublication.period }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ currentPublication.type }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ currentPublication.published_by }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ currentPublication.created_at }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="currentPublication?.data || []" size="small" style="margin-top: 20px">
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="earned_points" label="积分" width="100" />
        <el-table-column prop="total_points" label="总积分" width="100" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const period = ref('month')
const ranking = ref([])
const publications = ref([])
const publicationDialogVisible = ref(false)
const currentPublication = ref(null)

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/publication/ranking', {
      params: { period: period.value, limit: 50 }
    })
    ranking.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadPublications = async () => {
  try {
    const res = await axios.get('/api/publication/publications', { params: { type: 'ranking' } })
    publications.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const publishRanking = async () => {
  try {
    await axios.post('/api/publication/publications', {
      period: period.value,
      type: 'ranking',
      data: ranking.value.slice(0, 20)
    })
    ElMessage.success('发布成功')
    loadPublications()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const viewPublication = (row) => {
  currentPublication.value = row
  publicationDialogVisible.value = true
}

onMounted(() => {
  loadData()
  loadPublications()
})
</script>
