<template>
  <div class="page-container">
    <div style="display: flex; align-items: center; margin-bottom: 20px">
      <el-button @click="$router.back()">返回</el-button>
      <h2 style="margin-left: 20px; margin-bottom: 0">学情分析</h2>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card>
            <div style="text-align: center">
              <div style="font-size: 48px; color: #409eff; font-weight: bold">{{ (overview.avgAccuracy * 100).toFixed(1) }}%</div>
              <div style="color: #666; margin-top: 10px">平均正确率</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div style="text-align: center">
              <div style="font-size: 48px; color: #67c23a; font-weight: bold">{{ overview.submissions?.length || 0 }}</div>
              <div style="color: #666; margin-top: 10px">已提交人数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <div style="text-align: center">
              <div style="font-size: 48px; color: #e6a23c; font-weight: bold">{{ overview.questionStats?.length || 0 }}</div>
              <div style="color: #666; margin-top: 10px">题目数量</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px">
        <template #header>
          <span>学生提交情况</span>
        </template>
        <el-table :data="overview.submissions || []" v-loading="loading">
          <el-table-column prop="student_name" label="学生姓名" />
          <el-table-column prop="accuracy" label="正确率">
            <template #default="{ row }">
              {{ ((row.accuracy || 0) * 100).toFixed(1) }}%
            </template>
          </el-table-column>
          <el-table-column prop="correct_count" label="正确题数" />
          <el-table-column prop="total_count" label="总题数" />
          <el-table-column prop="duration" label="用时(秒)" />
          <el-table-column label="操作">
            <template #default="{ row, $index }">
              <el-button size="small" type="primary" @click="$router.push(`/homework/${route.params.id}/student/${row.student_id}`)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card style="margin-top: 20px">
        <template #header>
          <span>题目正确率统计</span>
        </template>
        <el-table :data="overview.questionStats || []" v-loading="loading">
          <el-table-column type="index" label="题号" />
          <el-table-column prop="content" label="题目" show-overflow-tooltip />
          <el-table-column prop="correctCount" label="做对人数" />
          <el-table-column prop="totalCount" label="总提交人数" />
          <el-table-column prop="accuracy" label="正确率">
            <template #default="{ row }">
              <el-progress :percentage="Math.round((row.accuracy || 0) * 100)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/request'

const route = useRoute()
const loading = ref(false)
const overview = reactive({
  avgAccuracy: 0,
  submissions: [],
  questionStats: []
})

const fetchOverview = async () => {
  loading.value = true
  try {
    const res = await api.get(`/homework/${route.params.id}/overview`)
    Object.assign(overview, res.data)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOverview()
})
</script>