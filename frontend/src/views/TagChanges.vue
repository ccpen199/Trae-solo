<template>
  <div class="tag-changes">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters">
        <el-form-item label="内容ID">
          <el-input v-model="filters.post_id" placeholder="内容ID" clearable style="width: 140px" @keyup.enter="loadList" />
        </el-form-item>
        <el-form-item label="话题ID">
          <el-input v-model="filters.topic_id" placeholder="话题ID" clearable style="width: 140px" @keyup.enter="loadList" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width: 140px">
            <el-option label="添加标签" value="add" />
            <el-option label="移除标签" value="remove" />
            <el-option label="创建话题" value="topic_create" />
            <el-option label="更新话题" value="topic_update" />
            <el-option label="合并话题" value="topic_merge" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.post_id > 0" size="small" type="info">内容标签</el-tag>
            <el-tag v-else size="small" type="warning">话题操作</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="post_id" label="内容ID" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.post_id > 0">{{ row.post_id }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="topic_id" label="话题ID" width="90" align="center" />
        <el-table-column label="动作" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionName(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getSourceType(row.source)">{{ getSourceName(row.source) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column label="变更内容" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.action === 'add'">添加话题ID: {{ row.new_value }}</span>
            <span v-else-if="row.action === 'remove'">移除话题ID: {{ row.old_value }}</span>
            <span v-else-if="row.action === 'topic_create'">{{ formatChange(row.new_value) }}</span>
            <span v-else-if="row.action === 'topic_update'">{{ formatChange(row.new_value) }}</span>
            <span v-else-if="row.action === 'topic_merge'">{{ formatChange(row.new_value) }}</span>
            <span v-else>{{ row.new_value || row.old_value }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="filters.page"
        :page-size="filters.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="pageChange"
        @size-change="sizeChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { tagChangesApi } from '../api'

const loading = ref(false)
const list = ref([])
const total = ref(0)

const filters = reactive({
  page: 1,
  pageSize: 20,
  post_id: '',
  topic_id: '',
  action: ''
})

const sourceMap = {
  manual: { name: '人工', type: 'success' },
  auto: { name: '自动', type: 'warning' },
  batch: { name: '批量', type: 'info' },
  merge: { name: '合并', type: 'primary' },
  system: { name: '系统', type: 'info' }
}

const actionMap = {
  add: { name: '添加标签', type: 'success' },
  remove: { name: '移除标签', type: 'danger' },
  topic_create: { name: '创建话题', type: 'primary' },
  topic_update: { name: '更新话题', type: 'warning' },
  topic_merge: { name: '合并话题', type: 'info' }
}

const getSourceName = (source) => sourceMap[source]?.name || source
const getSourceType = (source) => sourceMap[source]?.type || 'info'
const getActionName = (action) => actionMap[action]?.name || action
const getActionType = (action) => actionMap[action]?.type || 'info'

const formatChange = (val) => {
  if (!val) return '-'
  try {
    const obj = JSON.parse(val)
    if (obj.name) return `创建话题「${obj.name}」`
    if (obj.source_topic && obj.target_topic) return `「${obj.source_topic}」→「${obj.target_topic}」(${obj.merged_posts}篇)`
    const changes = []
    Object.keys(obj).forEach(k => {
      const v = obj[k]
      if (v.old !== undefined && v.new !== undefined) {
        changes.push(`${k}: ${v.old} → ${v.new}`)
      }
    })
    return changes.join('; ')
  } catch {
    return val
  }
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN')
}

const loadList = async () => {
  loading.value = true
  try {
    const params = { ...filters }
    if (!params.post_id) delete params.post_id
    if (!params.topic_id) delete params.topic_id
    if (!params.action) delete params.action
    const res = await tagChangesApi.list(params)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.page = 1
  filters.post_id = ''
  filters.topic_id = ''
  filters.action = ''
  loadList()
}

const pageChange = (p) => {
  filters.page = p
  loadList()
}

const sizeChange = (s) => {
  filters.pageSize = s
  filters.page = 1
  loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 16px;
  border: none;
}
.table-card {
  border: none;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
