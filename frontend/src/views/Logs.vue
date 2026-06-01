<template>
  <div class="logs">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="模块">
          <el-select v-model="searchForm.module" placeholder="全部" clearable>
            <el-option label="地块" value="parcel" />
            <el-option label="流转需求" value="demand" />
            <el-option label="合同" value="contract" />
            <el-option label="租金计划" value="rent_plan" />
            <el-option label="履约" value="performance" />
            <el-option label="纠纷" value="dispute" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="user_name" label="操作人" width="120" />
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            {{ moduleMap[row.module] || row.module }}
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="100" />
        <el-table-column prop="details" label="详情" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const logs = ref([])

const moduleMap = {
  parcel: '地块',
  demand: '流转需求',
  contract: '合同',
  rent_plan: '租金计划',
  performance: '履约',
  dispute: '纠纷',
  bid: '报名意向'
}

const searchForm = reactive({
  module: '',
  limit: 100
})

const loadData = async () => {
  try {
    const res = await api.get('/logs', searchForm)
    logs.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.module = ''
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
}
</style>
