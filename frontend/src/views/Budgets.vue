<template>
  <div class="card-container">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3>预算管理</h3>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8" v-for="budget in budgets" :key="budget.id">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <h4 style="margin-bottom: 10px;">{{ budget.name }}</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #909399;">总预算:</span>
              <span style="font-weight: bold;">¥{{ budget.total_amount.toFixed(2) }}</span>
            </div>
            <el-progress
              :percentage="budget.usagePercent"
              :color="getProgressColor(budget.usagePercent)"
              style="margin-bottom: 10px;"
            />
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #f56c6c;">已用: ¥{{ budget.used_amount.toFixed(2) }}</span>
              <span style="color: #e6a23c;">占用: ¥{{ budget.reserved_amount.toFixed(2) }}</span>
              <span style="color: #67c23a;">可用: ¥{{ budget.available_amount.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <span>预算列表</span>
      </template>
      <el-table :data="budgets" v-loading="loading" stripe>
        <el-table-column prop="code" label="预算编码" width="150" />
        <el-table-column prop="name" label="预算名称" min-width="200" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="fiscal_year" label="年度" width="100" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="total_amount" label="总金额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="used_amount" label="已使用" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c;">¥{{ row.used_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reserved_amount" label="已占用" width="120">
          <template #default="{ row }">
            <span style="color: #e6a23c;">¥{{ row.reserved_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="available_amount" label="可用" width="120">
          <template #default="{ row }">
            <span style="color: #67c23a;">¥{{ row.available_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.usagePercent"
              :color="getProgressColor(row.usagePercent)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const budgets = ref([])

const budgetsWithPercent = computed(() => {
  return budgets.value.map(budget => {
    const usedPercent = budget.total_amount > 0 
      ? Math.round((budget.used_amount + budget.reserved_amount) / budget.total_amount * 100)
      : 0
    return {
      ...budget,
      usagePercent: usedPercent
    }
  })
})

const getProgressColor = (percent) => {
  if (percent >= 90) return '#f56c6c'
  if (percent >= 70) return '#e6a23c'
  return '#67c23a'
}

const loadBudgets = async () => {
  loading.value = true
  try {
    budgets.value = await request.get('/purchases/budgets/list')
  } catch (error) {
    console.error('加载预算失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBudgets()
})
</script>
