<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h1>知识库</h1>
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识节点..."
        style="width: 300px;"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-card v-loading="loading" class="knowledge-list">
      <el-empty v-if="knowledgeNodes.length === 0" description="知识库还没有内容" />
      
      <el-row :gutter="20">
        <el-col :span="8" v-for="node in knowledgeNodes" :key="node.nodeId">
          <el-card class="knowledge-card" shadow="hover">
            <div class="card-header">
              <el-tag :type="getNodeType(node.nodeType)" size="small">
                {{ getNodeTypeName(node.nodeType) }}
              </el-tag>
              <el-rate 
                v-model="node.qualityScore" 
                disabled 
                :max="5" 
                :show-text="false"
              />
            </div>
            <h3 class="node-title">{{ node.title }}</h3>
            <p class="node-desc">{{ node.description?.substring(0, 100) }}...</p>
            <div class="node-tags">
              <el-tag
                v-for="tag in node.tags?.slice(0, 3)"
                :key="tag"
                size="mini"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="card-footer">
              <span class="views">
                <el-icon><View /></el-icon>
                {{ node.statistics?.viewCount || 0 }}
              </span>
              <router-link :to="`/knowledge/${node.nodeId}`">
                <el-button type="primary" text size="small">
                  查看详情 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </router-link>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const searchQuery = ref('')
const loading = ref(false)
const knowledgeNodes = ref([
  {
    nodeId: 'KN-001',
    title: 'React 性能优化最佳实践',
    description: '本文详细介绍了React应用的性能优化策略，包括使用React.memo、useMemo、useCallback等API，以及代码分割、虚拟列表等高级技术。',
    nodeType: 'article',
    tags: ['React', '性能优化', '前端'],
    statistics: { viewCount: 1256, qualityScore: 4.5 }
  },
  {
    nodeId: 'KN-002',
    title: '微服务架构数据一致性',
    description: '深入探讨微服务架构下的数据一致性问题，包括最终一致性、Saga模式、TCC模式等解决方案的实现原理和最佳实践。',
    nodeType: 'tutorial',
    tags: ['微服务', '分布式', '架构'],
    statistics: { viewCount: 892, qualityScore: 4.8 }
  },
  {
    nodeId: 'KN-003',
    title: 'Python 大数据处理指南',
    description: '使用Python处理大规模数据集的完整指南，涵盖Dask、Vaex、PySpark等框架的使用方法和性能对比。',
    nodeType: 'question',
    tags: ['Python', '大数据', '数据处理'],
    statistics: { viewCount: 2341, qualityScore: 4.2 }
  }
])

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

const handleSearch = () => {
  console.log('Searching:', searchQuery.value)
}

onMounted(() => {
})
</script>

<style lang="scss" scoped>
.knowledge-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
}

.knowledge-card {
  margin-bottom: 20px;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-4px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.node-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.node-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;

  .views {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
