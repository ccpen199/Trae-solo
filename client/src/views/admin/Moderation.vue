<template>
  <div class="moderation-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>内容审核</span>
          <el-radio-group v-model="filterType" size="small">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="question">问题</el-radio-button>
            <el-radio-button label="answer">回答</el-radio-button>
            <el-radio-button label="report">举报</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="moderationItems" v-loading="loading" style="width: 100%">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="{ row }">
            <div class="content-preview">{{ row.content?.substring(0, 100) }}...</div>
            <div class="content-reason" v-if="row.reason">
              <el-tag type="danger" size="mini" effect="light">举报原因: {{ row.reason }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="提交者" width="120" />
        <el-table-column prop="riskScore" label="风险分" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.riskScore" 
              :color="getRiskColor(row.riskScore)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="approve(row)">通过</el-button>
            <el-button type="danger" link size="small" @click="reject(row)">拒绝</el-button>
            <el-button type="info" link size="small" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="moderationItems.length === 0 && !loading" description="暂无待审核内容" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const filterType = ref('')
const moderationItems = ref([])

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getTypeColor = (type) => {
  const colorMap = {
    'question': 'primary',
    'answer': '',
    'report': 'danger'
  }
  return colorMap[type] || 'info'
}

const getTypeName = (type) => {
  const nameMap = {
    'question': '问题',
    'answer': '回答',
    'report': '举报'
  }
  return nameMap[type] || type
}

const getRiskColor = (score) => {
  if (score >= 70) return '#f56c6c'
  if (score >= 40) return '#e6a23c'
  return '#67c23a'
}

const loadItems = () => {
  loading.value = true
  moderationItems.value = [
    {
      id: 'MOD-001',
      type: 'report',
      content: '这是一段被举报的内容，包含涉嫌抄袭的文字...',
      authorName: '用户A',
      reason: '涉嫌抄袭',
      riskScore: 85,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'MOD-002',
      type: 'question',
      content: '这是一个待审核的问题，需要确认是否符合社区规范...',
      authorName: '用户B',
      riskScore: 25,
      createdAt: new Date(Date.now() - 7200000)
    }
  ]
  loading.value = false
}

const approve = async (row) => {
  try {
    await ElMessageBox.confirm('确定通过该内容？', '确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'success'
    })
    ElMessage.success('已通过')
    moderationItems.value = moderationItems.value.filter(item => item.id !== row.id)
  } catch {}
}

const reject = async (row) => {
  try {
    await ElMessageBox.confirm('确定拒绝该内容？', '确认', {
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('已拒绝')
    moderationItems.value = moderationItems.value.filter(item => item.id !== row.id)
  } catch {}
}

const viewDetail = (row) => {
  ElMessage.info(`查看详情: ${row.id}`)
}

onMounted(() => {
  loadItems()
})
</script>

<style lang="scss" scoped>
.moderation-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.content-preview {
  color: #303133;
  margin-bottom: 8px;
}

.content-reason {
  margin-top: 8px;
}
</style>
