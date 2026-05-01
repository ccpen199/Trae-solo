<template>
  <div class="archives-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>归档管理</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索归档记录"
            style="width: 250px;"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="archives" v-loading="loading" style="width: 100%">
        <el-table-column prop="archiveId" label="归档编号" width="180" />
        <el-table-column prop="sourceType" label="来源类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getSourceType(row.sourceType)" size="small">
              {{ getSourceName(row.sourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <span>{{ row.title }}</span>
              <el-tag v-if="row.isInKnowledgeBase" type="primary" size="mini" effect="light">
                知识图谱
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="knowledgeNodeId" label="知识节点" width="150">
          <template #default="{ row }">
            <span v-if="row.knowledgeNodeId" class="knowledge-link">
              {{ row.knowledgeNodeId }}
            </span>
            <span v-else class="no-link">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="归档人" width="100" />
        <el-table-column prop="createdAt" label="归档时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button 
              v-if="!row.isInKnowledgeBase" 
              type="success" 
              link 
              size="small" 
              @click="addToKnowledge(row)"
            >
              收录知识库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="archives.length === 0 && !loading" description="暂无归档记录" />

      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchQuery = ref('')
const archives = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getSourceType = (type) => {
  const typeMap = {
    'question': 'primary',
    'answer': '',
    'qa_pair': 'success'
  }
  return typeMap[type] || 'info'
}

const getSourceName = (type) => {
  const nameMap = {
    'question': '问题',
    'answer': '回答',
    'qa_pair': '问答对'
  }
  return nameMap[type] || type
}

const loadArchives = () => {
  loading.value = true
  archives.value = [
    {
      archiveId: 'ARC-2024-00001',
      sourceType: 'qa_pair',
      title: '如何优化大型React应用的性能？',
      knowledgeNodeId: 'KN-001',
      isInKnowledgeBase: true,
      creatorName: 'editor',
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      archiveId: 'ARC-2024-00002',
      sourceType: 'question',
      title: '微服务架构下如何保证数据一致性？',
      knowledgeNodeId: null,
      isInKnowledgeBase: false,
      creatorName: 'admin',
      createdAt: new Date(Date.now() - 172800000)
    }
  ]
  total.value = archives.value.length
  loading.value = false
}

const handleSearch = () => {
  loadArchives()
}

const viewDetail = (row) => {
  ElMessage.info(`查看归档: ${row.archiveId}`)
}

const addToKnowledge = async (row) => {
  try {
    await ElMessageBox.confirm('确定将此归档收录到知识图谱？', '确认收录', {
      confirmButtonText: '收录',
      cancelButtonText: '取消',
      type: 'success'
    })
    ElMessage.success('已收录到知识图谱')
    row.isInKnowledgeBase = true
    row.knowledgeNodeId = 'KN-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  } catch {}
}

onMounted(() => {
  loadArchives()
})
</script>

<style lang="scss" scoped>
.archives-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.knowledge-link {
  color: #409eff;
  font-weight: 500;
}

.no-link {
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
