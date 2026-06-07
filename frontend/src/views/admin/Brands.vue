<template>
  <div class="brands-page">
    <div class="page-header">
      <h1>品牌管理</h1>
      <p>管理平台品牌数据，支持增删改查和数据采集</p>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索品牌名称..."
          clearable
          class="search-input"
          @keyup.enter="loadBrands"
          @clear="loadBrands"
        >
          <template #prepend>
            <el-button @click="loadBrands">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-select v-model="filters.industry" placeholder="行业" clearable class="filter-select" @change="loadBrands">
          <el-option v-for="item in filterOptions.industries" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filters.level" placeholder="等级" clearable class="filter-select" @change="loadBrands">
          <el-option label="S级" value="S" />
          <el-option label="A级" value="A" />
          <el-option label="B级" value="B" />
          <el-option label="C级" value="C" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button type="warning" @click="handleRunCollection">
          <el-icon><Coin /></el-icon>全量采集
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增品牌
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="brands" v-loading="loading" stripe>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="logo" label="Logo" width="70">
          <template #default="{ row }">
            <img :src="row.logo" :alt="row.name" class="table-logo" @error="handleLogoError" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="品牌名称" min-width="120">
          <template #default="{ row }">
            <div class="brand-name-cell">
              <span class="name">{{ row.name }}</span>
              <span v-if="row.nameEn" class="name-en">{{ row.nameEn }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="120" />
        <el-table-column prop="country" label="国家/地区" width="120" />
        <el-table-column prop="level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评分" width="100">
          <template #default="{ row }">
            <span class="score-text">{{ row.score?.toFixed(1) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览量" width="90" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleCollect(row)">
              <el-icon><Coin /></el-icon>采集
            </el-button>
            <el-button type="primary" link size="small" @click="handleTrace(row)">
              <el-icon><Connection /></el-icon>溯源
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑品牌' : '新增品牌'" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入品牌名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称">
              <el-input v-model="form.nameEn" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="行业" prop="industry">
              <el-select v-model="form.industry" placeholder="请选择行业" style="width: 100%">
                <el-option v-for="item in filterOptions.industries" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国家/地区" prop="country">
              <el-input v-model="form.country" placeholder="请输入国家/地区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="等级" prop="level">
              <el-select v-model="form.level" placeholder="请选择等级" style="width: 100%">
                <el-option label="S级" value="S" />
                <el-option label="A级" value="A" />
                <el-option label="B级" value="B" />
                <el-option label="C级" value="C" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评分" prop="score">
              <el-input-number v-model="form.score" :min="0" :max="100" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Logo">
          <el-input v-model="form.logo" placeholder="请输入Logo图片URL" />
        </el-form-item>
        <el-form-item label="品牌简介">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入品牌简介" />
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

    <el-dialog v-model="traceDialogVisible" title="数据溯源" width="700px" destroy-on-close>
      <div v-loading="traceLoading">
        <div class="trace-header">
          <img :src="currentBrand?.logo" :alt="currentBrand?.name" class="trace-logo" @error="handleLogoError" />
          <div>
            <h3>{{ currentBrand?.name }}</h3>
            <p>{{ currentBrand?.industry }} · {{ currentBrand?.country }}</p>
          </div>
        </div>
        <el-divider />
        <div v-if="traceData.length === 0" class="empty-state">
          <el-empty description="暂无溯源数据" />
        </div>
        <div v-else>
          <div v-for="(item, index) in traceData" :key="index" class="trace-item">
            <div class="trace-source">
              <el-icon><Coin /></el-icon>
              {{ item.source }}
            </div>
            <div class="trace-time">{{ formatDate(item.collectedAt) }}</div>
            <div class="trace-data">{{ formatRawData(item.rawData) }}</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Plus, Edit, Delete, Coin, Connection
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { brandAPI, adminAPI } from '@/utils/api'

const loading = ref(false)
const traceLoading = ref(false)
const dialogVisible = ref(false)
const traceDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const currentBrand = ref(null)
const traceData = ref([])

const filters = reactive({
  industry: '',
  level: ''
})

const filterOptions = reactive({
  industries: []
})

const brands = ref([])

const form = reactive({
  id: null,
  name: '',
  nameEn: '',
  industry: '',
  country: '',
  level: '',
  score: 0,
  logo: '',
  description: '',
  tags: []
})

const rules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
  industry: [{ required: true, message: '请选择行业', trigger: 'change' }],
  country: [{ required: true, message: '请输入国家/地区', trigger: 'blur' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  score: [{ required: true, message: '请输入评分', trigger: 'blur' }]
}

async function loadFilters() {
  try {
    const res = await brandAPI.getFilters()
    filterOptions.industries = res.data?.industries || []
  } catch (e) {
    console.error(e)
  }
}

async function loadBrands() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      ...filters
    }
    const res = await brandAPI.getList(params)
    brands.value = res.data?.data || []
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
    name: '',
    nameEn: '',
    industry: '',
    country: '',
    level: '',
    score: 0,
    logo: '',
    description: '',
    tags: []
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
          await brandAPI.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await brandAPI.create(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadBrands()
      } catch (e) {
        console.error(e)
      }
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除品牌「${row.name}」吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await brandAPI.delete(row.id)
      ElMessage.success('删除成功')
      loadBrands()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleCollect(row) {
  try {
    ElMessage.info(`开始采集品牌「${row.name}」的数据...`)
    await adminAPI.collectBrand(row.id)
    ElMessage.success('数据采集完成')
    loadBrands()
  } catch (e) {
    console.error(e)
  }
}

async function handleRunCollection() {
  ElMessageBox.confirm('确定要启动全量数据采集吗？这可能需要较长时间。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      ElMessage.info('开始全量数据采集...')
      await adminAPI.runCollection()
      ElMessage.success('全量采集任务已启动')
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleTrace(row) {
  currentBrand.value = row
  traceDialogVisible.value = true
  traceLoading.value = true
  try {
    const res = await brandAPI.getTraceability(row.id)
    traceData.value = res.data || []
  } catch (e) {
    console.error(e)
    traceData.value = []
  } finally {
    traceLoading.value = false
  }
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  loadBrands()
}

function handlePageChange(page) {
  currentPage.value = page
  loadBrands()
}

function getLevelType(level) {
  const types = { S: 'warning', A: 'success', B: 'primary', C: 'info' }
  return types[level] || 'info'
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function formatRawData(data) {
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}

function handleLogoError(e) {
  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f0f2f5" width="100" height="100"/><text fill="%23909399" font-size="14" x="50" y="50" text-anchor="middle" dominant-baseline="middle">品牌</text></svg>'
}

onMounted(() => {
  loadFilters()
  loadBrands()
})
</script>

<style scoped>
.brands-page {
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

.toolbar-right {
  display: flex;
  gap: 12px;
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

.table-logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: #f0f2f5;
}

.brand-name-cell {
  display: flex;
  flex-direction: column;
}

.brand-name-cell .name {
  font-weight: 500;
  color: #303133;
}

.brand-name-cell .name-en {
  font-size: 12px;
  color: #909399;
}

.score-text {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.trace-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trace-logo {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  background: #f0f2f5;
}

.trace-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #1f2f3d;
}

.trace-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.trace-item {
  border-left: 3px solid #409eff;
  padding: 16px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 0 8px 8px 0;
}

.trace-source {
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.trace-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.trace-data {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  background: #f0f2f5;
  padding: 12px;
  border-radius: 6px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  padding: 40px;
  text-align: center;
}
</style>
