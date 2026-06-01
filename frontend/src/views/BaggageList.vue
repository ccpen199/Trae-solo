<template>
  <div class="baggage-list">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">行李档案</h1>
        <p class="page-subtitle">管理所有托运行李的档案信息</p>
      </div>
      <el-button type="primary" @click="goToCreate">
        <el-icon><Plus /></el-icon>
        录入行李
      </el-button>
    </div>

    <div class="card">
      <el-form :inline="true" :model="queryForm" class="mb-4">
        <el-form-item label="行李牌">
          <el-input v-model="queryForm.baggage_tag" placeholder="请输入行李牌" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="航班号">
          <el-input v-model="queryForm.flight_no" placeholder="请输入航班号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="旅客姓名">
          <el-input v-model="queryForm.passenger_name" placeholder="请输入姓名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="运输中" value="in_transit" />
            <el-option label="已到达" value="arrived" />
            <el-option label="已领取" value="picked_up" />
            <el-option label="异常" value="exception" />
            <el-option label="遗失" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="baggage_tag" label="行李牌" width="150">
          <template #default="{ row }">
            <span class="font-mono font-semibold">{{ row.baggage_tag }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="passenger_name" label="旅客姓名" width="100" />
        <el-table-column prop="passenger_phone" label="联系电话" width="130" />
        <el-table-column prop="flight_no" label="航班号" width="100" />
        <el-table-column prop="flight_date" label="航班日期" width="100" />
        <el-table-column label="航线" min-width="140">
          <template #default="{ row }">
            {{ row.departure }} → {{ row.destination }}
          </template>
        </el-table-column>
        <el-table-column prop="pieces" label="件数" width="60" align="center" />
        <el-table-column prop="weight" label="重量(kg)" width="90" align="center" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="check_in_time" label="托运时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.check_in_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="goToDetail(row.baggage_tag)">
              详情
            </el-button>
            <el-button type="success" size="small" link @click="goToAddNode(row.baggage_tag)">
              节点
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-4 justify-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { baggageApi } from '../api'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])

const queryForm = reactive({
  baggage_tag: '',
  flight_no: '',
  passenger_name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function loadData() {
  loading.value = true
  try {
    const data = await baggageApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...queryForm
    })
    tableData.value = data.list
    pagination.total = data.total
  } catch (err) {
    ElMessage.error('加载数据失败')
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.baggage_tag = ''
  queryForm.flight_no = ''
  queryForm.passenger_name = ''
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

function handleSizeChange(val) {
  pagination.pageSize = val
  pagination.page = 1
  loadData()
}

function handleCurrentChange(val) {
  pagination.page = val
  loadData()
}

function goToCreate() {
  router.push('/admin/baggage/create')
}

function goToDetail(tag) {
  router.push(`/admin/baggage/${tag}`)
}

function goToAddNode(tag) {
  router.push({ path: '/admin/nodes', query: { tag } })
}

function getStatusType(status) {
  const map = {
    in_transit: 'primary',
    arrived: 'success',
    picked_up: 'success',
    exception: 'danger',
    lost: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    in_transit: '运输中',
    arrived: '已到达',
    picked_up: '已领取',
    exception: '异常',
    lost: '遗失'
  }
  return map[status] || status
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.justify-end {
  display: flex;
  justify-content: flex-end;
}

.font-mono {
  font-family: monospace;
}

.font-semibold {
  font-weight: 600;
}
</style>
