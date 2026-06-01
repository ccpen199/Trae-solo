<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">处罚记录</h1>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择状态" clearable>
            <el-option label="待缴款" value="unpaid" />
            <el-option label="已缴款" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="filters.platformId" placeholder="请选择平台" clearable>
            <el-option v-for="p in platforms" :key="p.id" :label="p.name" :value="p.id" />
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
        <el-table-column prop="penalty_no" label="处罚编号" width="160" />
        <el-table-column prop="case_no" label="关联案件" width="160" />
        <el-table-column prop="penalty_type" label="类型" width="120">
          <template #default="{ row }">
            {{ getTypeText(row.penalty_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="penalty_amount" label="金额(元)" width="120" align="right" />
        <el-table-column prop="points_deducted" label="扣分" width="80" align="center" />
        <el-table-column prop="driver_name" label="涉事司机" width="100" />
        <el-table-column prop="plate_no" label="车牌号" width="120" />
        <el-table-column prop="platform_name" label="所属平台" min-width="120" />
        <el-table-column prop="status" label="缴款状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="penalty_time" label="处罚时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'unpaid'" type="success" link @click="handlePay(row)">缴款</el-button>
          </template>
        </el-table-column>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const platforms = ref([])

const filters = reactive({
  status: '',
  platformId: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusText = (status) => {
  const map = { 'unpaid': '待缴款', 'paid': '已缴款' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { 'unpaid': 'tag-warning', 'paid': 'tag-success' }
  return map[status] || 'tag-info'
}

const getTypeText = (type) => {
  const map = { 'fine': '罚款', 'suspend_license': '暂扣执照' }
  return map[type] || type
}

const fetchPlatforms = async () => {
  try {
    const data = await request.get('/platforms/all')
    platforms.value = data
  } catch (error) {
    console.error('获取平台列表失败')
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const data = await request.get('/penalties', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        platform_id: filters.platformId || undefined
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
  filters.status = ''
  filters.platformId = ''
  pagination.page = 1
  fetchList()
}

const handlePay = async (row) => {
  try {
    await ElMessageBox.confirm(`确认缴纳罚款 ${row.penalty_amount} 元？`, '缴款确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.post(`/penalties/${row.id}/pay`, { paid_amount: row.penalty_amount })
    ElMessage.success('缴款成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('缴款失败')
    }
  }
}

onMounted(() => {
  fetchPlatforms()
  fetchList()
})
</script>
