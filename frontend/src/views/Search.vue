<template>
  <el-card>
    <template #header>
      <span>搜索文档</span>
    </template>

    <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="搜索标题/内容/摘要" style="width: 400px" clearable @keyup.enter="handleSearch">
          <template #append>
            <el-button type="primary" :loading="loading" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
          <el-option label="待创建" value="pending_creation" />
          <el-option label="待审核" value="pending_review" />
          <el-option label="已发布" value="published" />
          <el-option label="待使用" value="pending_use" />
          <el-option label="待更新" value="pending_update" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="searchForm.tag_ids" multiple placeholder="选择标签" clearable style="width: 200px">
          <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id">
            <span style="display: flex; align-items: center; gap: 8px">
              <span :style="{ background: tag.color, width: 12, height: 12, borderRadius: '50%', display: 'inline-block' }"></span>
              {{ tag.name }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <el-table :data="results" v-loading="loading" stripe @row-click="goToDetail" v-if="hasSearched">
      <el-table-column prop="main_order_no" label="单号" width="160" />
      <el-table-column prop="title" label="标题" min-width="200">
        <template #default="{ row }">
          <span v-html="highlightKeyword(row.title)"></span>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="创建人" width="100" />
      <el-table-column label="标签" min-width="150">
        <template #default="{ row }">
          <el-tag v-for="tag in row.tags" :key="tag.id" :color="tag.color" size="small" style="margin-right: 4px">
            {{ tag.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click.stop="goToDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="hasSearched && results.length === 0" description="未找到匹配的文档" />
    <el-empty v-if="!hasSearched" description="请输入关键词进行搜索" />
  </el-card>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { documentApi, tagApi } from '@/api'

const router = useRouter()
const loading = ref(false)
const hasSearched = ref(false)
const results = ref([])
const tags = ref([])

const searchForm = reactive({
  keyword: '',
  status: '',
  tag_ids: []
})

const getStatusType = (status) => {
  const types = {
    pending_creation: 'info',
    pending_review: 'warning',
    published: 'success',
    pending_use: '',
    pending_update: 'warning'
  }
  return types[status] || ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending_creation: '待创建',
    pending_review: '待审核',
    published: '已发布',
    pending_use: '待使用',
    pending_update: '待更新'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const highlightKeyword = (text) => {
  if (!searchForm.keyword || !text) return text
  const regex = new RegExp(`(${searchForm.keyword})`, 'gi')
  return text.replace(regex, '<span style="color: #f56c6c; font-weight: bold">$1</span>')
}

const loadTags = async () => {
  try {
    const res = await tagApi.list()
    tags.value = res.data.tags
  } catch (e) {
    console.error(e)
  }
}

const handleSearch = async () => {
  if (!searchForm.keyword && !searchForm.status && searchForm.tag_ids.length === 0) {
    return
  }

  loading.value = true
  hasSearched.value = true
  try {
    const params = {}
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status

    const res = await documentApi.list(params)
    results.value = res.data.documents

    if (searchForm.tag_ids.length > 0) {
      results.value = results.value.filter(doc => {
        const docTagIds = (doc.tags || []).map(t => t.id)
        return searchForm.tag_ids.some(tid => docTagIds.includes(tid))
      })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const goToDetail = (row) => {
  router.push(`/documents/${row.id}`)
}

onMounted(() => {
  loadTags()
})
</script>
