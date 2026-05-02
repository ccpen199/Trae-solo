<template>
  <el-card>
    <template #header>
      <span>审计日志</span>
    </template>

    <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
      <el-form-item label="操作类型">
        <el-select v-model="searchForm.action" placeholder="全部操作" clearable style="width: 150px">
          <el-option v-for="act in actions" :key="act" :label="act" :value="act" />
        </el-select>
      </el-form-item>
      <el-form-item label="资源类型">
        <el-select v-model="searchForm.resource_type" placeholder="全部类型" clearable style="width: 150px">
          <el-option v-for="type in resourceTypes" :key="type" :label="type" :value="type" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始日期">
        <el-date-picker v-model="searchForm.start_date" type="date" placeholder="选择日期" style="width: 150px" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="结束日期">
        <el-date-picker v-model="searchForm.end_date" type="date" placeholder="选择日期" style="width: 150px" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadLogs">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="logs" v-loading="loading" stripe max-height="600">
      <el-table-column prop="user_name" label="操作人" width="120" />
      <el-table-column prop="action" label="操作" width="150">
        <template #default="{ row }">
          <el-tag size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource_type" label="资源类型" width="100">
        <template #default="{ row }">
          <el-tag type="info" size="small">{{ row.resource_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource_id" label="资源ID" width="80" />
      <el-table-column label="变更详情" min-width="300">
        <template #default="{ row }">
          <div style="font-size: 12px">
            <p v-if="row.details"><strong>详情:</strong> {{ row.details }}</p>
            <p v-if="row.old_value"><strong>原值:</strong> {{ row.old_value }}</p>
            <p v-if="row.new_value"><strong>新值:</strong> {{ row.new_value }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="操作时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 20px; text-align: right"
      @size-change="loadLogs"
      @current-change="loadLogs"
    />
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { auditApi } from '@/api'

const loading = ref(false)
const logs = ref([])
const actions = ref([])
const resourceTypes = ref([])
const total = ref(0)

const searchForm = reactive({
  action: '',
  resource_type: '',
  start_date: '',
  end_date: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadOptions = async () => {
  try {
    const [actionsRes, typesRes] = await Promise.all([
      auditApi.getActions(),
      auditApi.getResourceTypes()
    ])
    actions.value = actionsRes.data.actions
    resourceTypes.value = typesRes.data.resourceTypes
  } catch (e) {
    console.error(e)
  }
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize
    }
    if (searchForm.action) params.action = searchForm.action
    if (searchForm.resource_type) params.resource_type = searchForm.resource_type
    if (searchForm.start_date) params.start_date = searchForm.start_date
    if (searchForm.end_date) params.end_date = searchForm.end_date

    const res = await auditApi.list(params)
    logs.value = res.data.logs
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOptions()
  loadLogs()
})
</script>
