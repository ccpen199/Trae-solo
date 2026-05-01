<template>
  <div class="knowledge-detail-page">
    <el-card v-loading="loading">
      <template #header v-if="knowledgeNode">
        <div class="detail-header">
          <div class="header-left">
            <el-tag :type="getNodeType(knowledgeNode.nodeType)" size="large">
              {{ getNodeTypeName(knowledgeNode.nodeType) }}
            </el-tag>
            <h1>{{ knowledgeNode.title }}</h1>
            <div class="meta-info">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ knowledgeNode.authorName || '系统收录' }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatTime(knowledgeNode.createdAt) }}
              </span>
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ knowledgeNode.statistics?.viewCount || 0 }} 次浏览
              </span>
              <span class="meta-item">
                <el-rate 
                  v-model="knowledgeNode.qualityScore" 
                  disabled 
                  :max="5" 
                  show-text
                  :texts="['低', '一般', '良好', '优秀', '精品']"
                />
              </span>
            </div>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="copyPermalink">
              <el-icon><Link /></el-icon>
              复制永久链接
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="knowledgeNode" class="knowledge-content">
        <el-descriptions :column="2" border style="margin-bottom: 24px;">
          <el-descriptions-item label="知识节点ID">{{ knowledgeNode.nodeId }}</el-descriptions-item>
          <el-descriptions-item label="来源问题">
            <router-link v-if="knowledgeNode.sourceQuestionId" :to="`/questions/${knowledgeNode.sourceQuestionId}`">
              {{ knowledgeNode.sourceQuestionId }}
            </router-link>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="收录编辑">{{ knowledgeNode.archivedBy || '系统' }}</el-descriptions-item>
          <el-descriptions-item label="收录时间">{{ formatTime(knowledgeNode.archivedAt) }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>知识内容</el-divider>

        <div class="content-body">
          {{ knowledgeNode.description || knowledgeNode.content }}
        </div>

        <el-divider>知识标签</el-divider>

        <div class="tags-section">
          <el-tag
            v-for="tag in knowledgeNode.tags"
            :key="tag"
            size="large"
            style="margin-right: 10px; margin-bottom: 10px;"
          >
            {{ tag }}
          </el-tag>
        </div>

        <el-divider>关联知识节点</el-divider>

        <div class="relations-section">
          <el-empty v-if="!knowledgeNode.relations?.length" description="暂无关联知识节点" />
          <div v-else class="relation-list">
            <div 
              v-for="rel in knowledgeNode.relations" 
              :key="rel.targetNodeId"
              class="relation-item"
            >
              <router-link :to="`/knowledge/${rel.targetNodeId}`" class="relation-link">
                <el-tag :type="getRelationType(rel.relationType)" size="small">
                  {{ getRelationTypeName(rel.relationType) }}
                </el-tag>
                <span class="relation-title">{{ rel.targetTitle || rel.targetNodeId }}</span>
              </router-link>
            </div>
          </div>
        </div>

        <el-divider>引用历史</el-divider>

        <el-table :data="knowledgeNode.referencedInQuestions || []" size="small">
          <el-table-column prop="questionId" label="问题ID" width="150">
            <template #default="{ row }">
              <router-link :to="`/questions/${row.questionId}`">{{ row.questionId }}</router-link>
            </template>
          </el-table-column>
          <el-table-column prop="questionTitle" label="问题标题" />
          <el-table-column prop="referencedAt" label="引用时间" width="160">
            <template #default="{ row }">
              {{ formatTime(row.referencedAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="!loading && !knowledgeNode" description="知识节点不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const route = useRoute()

const loading = ref(false)
const knowledgeNode = ref(null)

const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getNodeType = (type) => {
  const typeMap = {
    question: 'info',
    answer: '',
    article: 'primary',
    tutorial: 'success',
    reference: 'warning'
  }
  return typeMap[type] || 'info'
}

const getNodeTypeName = (type) => {
  const nameMap = {
    question: '问答',
    answer: '回答',
    article: '文章',
    tutorial: '教程',
    reference: '参考'
  }
  return nameMap[type] || type
}

const getRelationType = (type) => {
  const typeMap = {
    'related_to': '',
    'prerequisite': 'warning',
    'follow_up': 'success',
    'alternative': 'info',
    'contradicts': 'danger'
  }
  return typeMap[type] || ''
}

const getRelationTypeName = (type) => {
  const nameMap = {
    'related_to': '相关',
    'prerequisite': '前置知识',
    'follow_up': '后续延伸',
    'alternative': '替代方案',
    'contradicts': '相反观点'
  }
  return nameMap[type] || type
}

const copyPermalink = () => {
  const permalink = `http://localhost:8766/knowledge/${knowledgeNode.value?.nodeId}`
  navigator.clipboard.writeText(permalink).then(() => {
    ElMessage.success('永久链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制: ' + permalink)
  })
}

const loadKnowledgeNode = () => {
  const nodeId = route.params.nodeId
  loading.value = true

  knowledgeNode.value = {
    nodeId: nodeId || 'KN-001',
    title: 'React 性能优化最佳实践',
    description: `## 概述
React 性能优化是每个前端开发者都需要掌握的技能。本文将从多个维度介绍 React 应用的性能优化策略。

## 1. 使用 React.memo
对于纯函数组件，可以使用 React.memo 进行包裹，避免不必要的重新渲染。

## 2. 使用 useMemo 和 useCallback
- useMemo: 缓存计算结果
- useCallback: 缓存函数引用

## 3. 虚拟列表
对于长列表，使用 react-window 或 react-virtualized 实现虚拟滚动。

## 4. 代码分割
使用 React.lazy 和 Suspense 实现路由级别的代码分割。`,
    nodeType: 'article',
    tags: ['React', '性能优化', '前端', '最佳实践'],
    authorName: 'JavaScript专家',
    createdAt: new Date(Date.now() - 86400000 * 5),
    archivedAt: new Date(Date.now() - 86400000 * 3),
    archivedBy: '知识编辑',
    sourceQuestionId: 'Q-DEMO-001',
    qualityScore: 4.5,
    statistics: {
      viewCount: 1543,
      qualityScore: 4.5,
      referenceCount: 23
    },
    relations: [
      {
        targetNodeId: 'KN-002',
        targetTitle: 'Vue 3 性能优化指南',
        relationType: 'related_to'
      },
      {
        targetNodeId: 'KN-003',
        targetTitle: '前端性能监控方案',
        relationType: 'follow_up'
      }
    ],
    referencedInQuestions: [
      {
        questionId: 'Q-DEMO-001',
        questionTitle: '如何优化大型React应用的性能？',
        referencedAt: new Date(Date.now() - 86400000 * 2)
      }
    ]
  }

  loading.value = false
}

onMounted(() => {
  loadKnowledgeNode()
})
</script>

<style lang="scss" scoped>
.knowledge-detail-page {
  max-width: 1000px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .header-left {
    h1 {
      margin: 12px 0;
      font-size: 24px;
      color: #303133;
    }
    
    .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      color: #909399;
      font-size: 14px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }
  }
}

.content-body {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.tags-section {
  padding: 10px 0;
}

.relations-section {
  .relation-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .relation-item {
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-radius: 6px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #ecf5ff;
    }
  }
  
  .relation-link {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: #303133;
    
    &:hover {
      color: #409eff;
    }
  }
  
  .relation-title {
    font-weight: 500;
  }
}
</style>
