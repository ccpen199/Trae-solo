<template>
  <div class="waybills-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>运单监控</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="运单状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="待装货" value="created" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="已到达" value="arrived" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchWaybills">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="waybills" v-loading="loading" border>
        <el-table-column prop="waybill_no" label="运单号" width="200" fixed="left" />
        <el-table-column prop="cargo_name" label="货物名称" width="140" />
        <el-table-column prop="weight" label="重量(吨)" width="100" />
        <el-table-column prop="origin" label="始发地" width="120" />
        <el-table-column prop="destination" label="目的地" width="120" />
        <el-table-column prop="shipper_name" label="货主" width="120" />
        <el-table-column prop="driver_name" label="司机" width="120" />
        <el-table-column prop="vehicle_no" label="车牌号" width="120" />
        <el-table-column prop="amount" label="运费(元)" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="queryForm.page"
        v-model:page-size="queryForm.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchWaybills"
        @current-change="fetchWaybills"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="运单详情" width="720px">
      <el-descriptions :column="2" border v-if="currentWaybill">
        <el-descriptions-item label="运单号" :span="2">{{ currentWaybill.waybill_no }}</el-descriptions-item>
        <el-descriptions-item label="货物名称">{{ currentWaybill.cargo_name }}</el-descriptions-item>
        <el-descriptions-item label="货物类型">{{ currentWaybill.cargo_type }}</el-descriptions-item>
        <el-descriptions-item label="重量">{{ currentWaybill.weight }} 吨</el-descriptions-item>
        <el-descriptions-item label="体积">{{ currentWaybill.volume || '-' }} m³</el-descriptions-item>
        <el-descriptions-item label="始发地">{{ currentWaybill.origin }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ currentWaybill.destination }}</el-descriptions-item>
        <el-descriptions-item label="货主">{{ currentWaybill.shipper_name }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentWaybill.driver_name }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentWaybill.vehicle_no }}</el-descriptions-item>
        <el-descriptions-item label="运费">¥{{ currentWaybill.amount?.toFixed(2) || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(currentWaybill.status)">{{ getStatusText(currentWaybill.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前位置" :span="2">{{ currentWaybill.current_location || '暂无位置信息' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentWaybill.created_at }}</el-descriptions-item>
        <el-descriptions-item label="预计送达">{{ currentWaybill.estimated_arrival || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentWaybill.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../../api'

const loading = ref(false)
const waybills = ref([])
const total = ref(0)
const currentWaybill = ref(null)
const detailDialogVisible = ref(false)

const queryForm = reactive({
  status: '',
  page: 1,
  page_size: 20
})

const statusMap = {
  created: { text: '待装货', tag: 'warning' },
  pending_loading: { text: '待装货', tag: 'warning' },
  loading: { text: '装货中', tag: 'primary' },
  in_transit: { text: '运输中', tag: 'primary' },
  arrived: { text: '已到达', tag: 'info' },
  completed: { text: '已完成', tag: 'success' },
  cancelled: { text: '已取消', tag: 'danger' }
}

function getStatusText(status) {
  return statusMap[status]?.text || status
}

function getStatusTag(status) {
  return statusMap[status]?.tag || 'info'
}

async function fetchWaybills() {
  loading.value = true
  try {
    const params = { ...queryForm }
    if (!params.status) delete params.status
    const res = await adminApi.getWaybills(params)
    if (res.data?.list) {
      waybills.value = res.data.list
      total.value = res.data.total || 0
    } else {
      waybills.value = res.data || []
      total.value = res.data?.length || 0
    }
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  queryForm.status = ''
  queryForm.page = 1
  fetchWaybills()
}

function viewDetail(row) {
  currentWaybill.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchWaybills()
})
</script>

<style scoped>
.waybills-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-header {
  font-weight: 600;
  font-size: 16px;
}
.query-form {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
  display: flex;
}
</style>
