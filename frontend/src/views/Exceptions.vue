<template>
  <div class="exceptions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>异常队列</span>
          <el-select v-model="filterStatus" placeholder="筛选状态" style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </div>
      </template>

      <el-table :data="exceptions" style="width: 100%">
        <el-table-column prop="exception_type" label="异常类型" width="120">
          <template #default="scope">
            <el-tag :type="getSeverityTag(scope.row.severity)">
              {{ scope.row.exception_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="异常标题" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'pending' ? 'warning' : 'success'">
              {{ scope.row.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发生时间" width="180" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button type="primary" link v-if="scope.row.status === 'pending'">处理</el-button>
            <el-button type="info" link>详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="exceptions.length === 0" description="暂无异常数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const filterStatus = ref('')
const exceptions = ref([])

const getSeverityTag = (severity) => {
  const map = {
    high: 'danger',
    normal: 'warning',
    low: 'info'
  }
  return map[severity] || 'info'
}
</script>

<style scoped>
.exceptions {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>