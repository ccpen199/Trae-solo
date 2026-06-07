<template>
  <div class="knowledge-page">
    <div class="page-header">
      <h1>知识管理</h1>
      <p>管理品牌知识库，支持增删改查和分类管理</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索知识标题..."
          clearable
          class="search-input"
          @keyup.enter="loadKnowledge"
          @clear="loadKnowledge"
        >
          <template #prepend>
            <el-button @click="loadKnowledge">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-select v-model="filters.category" placeholder="分类" clearable class="filter-select" @change="loadKnowledge">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增知识
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="knowledgeList" v-loading="loading" stripe>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.summary || row.content?.substring(0, 100) }}
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
        <el-table-column prop="likeCount" label="点赞" width="80" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewGraph(row)">
              <el-icon><Connection /></el-icon>图谱
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        class="pagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑知识' : '新增知识'" width="700px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入知识标题" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联品牌">
              <el-select v-model="form.relatedBrands" multiple placeholder="选择关联品牌" style="width: 100%" filterable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="请输入知识摘要" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="10" placeholder="请输入知识内容" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple placeholder="请输入标签，回车添加" style="width: 100%" filterable allow-create default-first-option />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="graphDialogVisible" title="知识图谱" width="900px" destroy-on-close>
      <div ref="graphContainer" class="graph-container"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Edit, Delete, Connection
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { knowledgeAPI } from '@/utils/api'

const loading = ref(false)
const dialogVisible = ref(false)
const graphDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const graphContainer = ref(null)

let graphChart = null

const filters = reactive({
  category: ''
})

const categories = ref([])
const knowledgeList = ref([])

const form = reactive({
  id: null,
  title: '',
  category: '',
  summary: '',
  content: '',
  tags: [],
  relatedBrands: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

async function loadCategories() {
  try {
    const res = await knowledgeAPI.getCategories()
    categories.value = res.data || []
  } catch (e) {
    console.error(e)
    categories.value = ['行业政策', '市场分析', '技术趋势', '品牌故事', '消费洞察', '竞争格局']
  }
}

async function loadKnowledge() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      ...filters
    }
    const res = await knowledgeAPI.getList(params)
    knowledgeList.value = res.data?.data || []
    total.value = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    title: '',
    category: '',
    summary: '',
    content: '',
    tags: [],
    relatedBrands: []
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await knowledgeAPI.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await knowledgeAPI.create(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadKnowledge()
      } catch (e) {
        console.error(e)
      }
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除知识「${row.title}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await knowledgeAPI.delete(row.id)
      ElMessage.success('删除成功')
      loadKnowledge()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleViewGraph(row) {
  graphDialogVisible.value = true
  await nextTick()
  initGraph(row)
}

function initGraph(row) {
  if (!graphContainer.value) return
  
  if (graphChart) {
    graphChart.dispose()
  }
  
  graphChart = echarts.init(graphContainer.value)
  
  const nodes = [
    { id: '0', name: row.title, symbolSize: 60, category: 0 },
    { id: '1', name: '市场表现', symbolSize: 40, category: 1 },
    { id: '2', name: '技术创新', symbolSize: 40, category: 1 },
    { id: '3', name: '品牌声誉', symbolSize: 40, category: 1 },
    { id: '4', name: '品牌A', symbolSize: 30, category: 2 },
    { id: '5', name: '品牌B', symbolSize: 30, category: 2 },
    { id: '6', name: '品牌C', symbolSize: 30, category: 2 },
    { id: '7', name: '政策影响', symbolSize: 35, category: 3 },
    { id: '8', name: '消费趋势', symbolSize: 35, category: 3 }
  ]
  
  const links = [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '0', target: '3' },
    { source: '1', target: '4' },
    { source: '1', target: '5' },
    { source: '2', target: '5' },
    { source: '2', target: '6' },
    { source: '3', target: '4' },
    { source: '3', target: '6' },
    { source: '0', target: '7' },
    { source: '0', target: '8' },
    { source: '7', target: '4' },
    { source: '8', target: '5' }
  ]
  
  graphChart.setOption({
    tooltip: {},
    legend: [{
      data: ['核心主题', '分析维度', '关联品牌', '影响因素']
    }],
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      categories: [
        { name: '核心主题', itemStyle: { color: '#409eff' } },
        { name: '分析维度', itemStyle: { color: '#67c23a' } },
        { name: '关联品牌', itemStyle: { color: '#e6a23c' } },
        { name: '影响因素', itemStyle: { color: '#f56c6c' } }
      ],
      roam: true,
      label: {
        show: true,
        position: 'right',
        formatter: '{b}'
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3
      },
      force: {
        repulsion: 300,
        edgeLength: 120
      }
    }]
  })
  
  window.addEventListener('resize', handleResize)
}

function handleResize() {
  graphChart?.resize()
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadKnowledge()
}

function handlePageChange(page) {
  currentPage.value = page
  loadKnowledge()
}

onMounted(() => {
  loadCategories()
  loadKnowledge()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  graphChart?.dispose()
})
</script>

<style scoped>
.knowledge-page {
  padding-bottom: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 8px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.graph-container {
  width: 100%;
  height: 500px;
}
</style>
