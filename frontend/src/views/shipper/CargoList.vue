<template>
  <div class="cargo-list-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">货源管理</span>
          <el-button type="primary" @click="goToPublish">
            <el-icon><Plus /></el-icon>
            发布货源
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable @change="fetchCargoList">
              <el-option label="待报价" value="published" />
              <el-option label="议价中" value="trading" />
              <el-option label="已签约" value="signed" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchCargoList">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="cargoList" v-loading="loading" stripe>
        <el-table-column prop="id" label="货源ID" width="100" />
        <el-table-column prop="cargo_name" label="货物名称" min-width="120" />
        <el-table-column prop="cargo_type" label="货物类型" width="100" />
        <el-table-column label="重量/体积" width="140">
          <template #default="{ row }">
            {{ row.weight }}吨 / {{ row.volume }}m³
          </template>
        </el-table-column>
        <el-table-column label="运输路线" min-width="200">
          <template #default="{ row }">
            <div class="route">
              <div class="route-city">{{ row.departure_city }}</div>
              <el-icon class="route-arrow"><Right /></el-icon>
              <div class="route-city">{{ row.destination_city }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="distance" label="距离(km)" width="100" />
        <el-table-column prop="expected_price" label="估价(元)" width="100">
          <template #default="{ row }">
            ¥{{ row.expected_price?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">详情</el-button>
            <el-button
              type="danger"
              link
              :disabled="!['pending', 'published', 'trading'].includes(row.status)"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && cargoList.length === 0" description="暂无货源数据" />

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchCargoList"
          @current-change="fetchCargoList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Right } from '@element-plus/icons-vue'
import { shipperApi } from '../../api/index'

const router = useRouter()
const loading = ref(false)

const filterForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const cargoList = ref([])

function getStatusType(status) {
  const map = {
    pending: 'warning',
    published: 'warning',
    trading: 'primary',
    signed: 'success',
    accepted: 'primary',
    transporting: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    pending: '待报价',
    published: '待报价',
    trading: '议价中',
    signed: '已签约',
    accepted: '已接单',
    transporting: '运输中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

function goToPublish() {
  router.push('/shipper/cargo/publish')
}

function viewDetail(id) {
  router.push(`/shipper/cargo/${id}`)
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定要取消该货源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  loading.value = true
  try {
    await shipperApi.cancelCargo(row.id)
    ElMessage.success('货源已取消')
    fetchCargoList()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '取消失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  filterForm.status = ''
  pagination.page = 1
  fetchCargoList()
}

async function fetchCargoList() {
  loading.value = true
  try {
    const res = await shipperApi.getCargoList({
      status: filterForm.status || undefined,
      page: pagination.page,
      page_size: pagination.page_size
    })
    const data = res.data || {}
    cargoList.value = data.list || data || []
    pagination.total = data.total || cargoList.value.length
  } catch (e) {
    ElMessage.error('获取货源列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCargoList()
})
</script>

<style scoped>
.cargo-list-page {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.filter-bar {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}
.filter-form {
  margin: 0;
}
.route {
  display: flex;
  align-items: center;
  gap: 8px;
}
.route-city {
  font-size: 14px;
  color: #303133;
}
.route-arrow {
  color: #409eff;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
