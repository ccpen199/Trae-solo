<template>
  <div class="my-bids">
    <el-card>
      <template #header>
        <div class="card-header">
          <span><el-icon><List /></el-icon> 我的报价</span>
          <el-button type="primary" @click="loadData" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="cargo_name" label="货源名称" min-width="150" />
        <el-table-column label="路线" min-width="200">
          <template #default="{ row }">
            <div class="route">
              <span class="city">{{ row.start_city }}</span>
              <el-icon class="arrow"><Right /></el-icon>
              <span class="city">{{ row.end_city }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="distance" label="距离(km)" width="100">
          <template #default="{ row }">{{ row.distance || '-' }}</template>
        </el-table-column>
        <el-table-column label="报价金额" width="120">
          <template #default="{ row }">
            <span class="price">¥{{ row.bid_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="留言" min-width="150" show-overflow-tooltip />
        <el-table-column label="报价状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="company_name" label="货主" min-width="150">
          <template #default="{ row }">{{ row.company_name || row.shipper_name }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="报价时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)" v-if="row.status === 'accepted'">
              查看运单
            </el-button>
            <el-button type="info" size="small" link @click="viewDetail(row)" v-if="row.status === 'pending'">
              等待确认
            </el-button>
            <el-button type="danger" size="small" link v-if="row.status === 'rejected'">
              已拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { List, Refresh, Right } from '@element-plus/icons-vue'
import { driverApi } from '../../api'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getStatusType(status) {
  const types = {
    pending: 'warning',
    accepted: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    accepted: '已接受',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

async function loadData() {
  loading.value = true
  try {
    const res = await driverApi.getMyBids({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data || []
    pagination.total = res.data?.length || 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  router.push({ name: 'WaybillDetail', query: { cargoId: row.cargo_id } })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.my-bids {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.route {
  display: flex;
  align-items: center;
  gap: 8px;
}
.city {
  font-weight: 500;
}
.arrow {
  color: #409eff;
}
.price {
  color: #f56c6c;
  font-weight: 600;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
