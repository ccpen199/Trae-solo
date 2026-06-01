<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">操作日志</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="操作类型">
          <el-select v-model="filters.operation" placeholder="请选择操作类型" clearable>
            <el-option label="创建" value="创建" />
            <el-option label="更新" value="更新" />
            <el-option label="审核" value="审核" />
            <el-option label="派单" value="派单" />
            <el-option label="核查" value="核查" />
            <el-option label="处罚决定" value="处罚决定" />
            <el-option label="申诉" value="申诉" />
            <el-option label="复核" value="复核" />
            <el-option label="整改" value="整改" />
            <el-option label="缴款" value="缴款" />
            <el-option label="抽查" value="抽查" />
            <el-option label="绑定" value="绑定" />
            <el-option label="解绑" value="解绑" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="filters.module" placeholder="请选择操作模块" clearable>
            <el-option label="平台管理" value="platforms" />
            <el-option label="司机管理" value="drivers" />
            <el-option label="车辆管理" value="vehicles" />
            <el-option label="订单管理" value="orders" />
            <el-option label="投诉管理" value="complaints" />
            <el-option label="工单管理" value="work_orders" />
            <el-option label="案件管理" value="enforcement_cases" />
            <el-option label="处罚管理" value="penalties" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operation" label="操作类型" width="100" align="center" />
        <el-table-column prop="module" label="操作模块" width="140">
          <template #default="{ row }">
            {{ getModuleText(row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="操作人" width="120" />
        <el-table-column prop="detail" label="操作内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="操作时间" width="180" />
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])

const filters = reactive({
  operation: '',
  module: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getModuleText = (module) => {
  const map = {
    'platforms': '平台管理',
    'drivers': '司机管理',
    'vehicles': '车辆管理',
    'orders': '订单管理',
    'complaints': '投诉管理',
    'work_orders': '工单管理',
    'enforcement_cases': '案件管理',
    'penalties': '处罚管理',
    'driver_vehicle_bind': '人车绑定'
  }
  return map[module] || module
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/operation-logs', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        operation: filters.operation || undefined,
        module: filters.module || undefined
      }
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.operation = ''
  filters.module = ''
  pagination.page = 1
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>
