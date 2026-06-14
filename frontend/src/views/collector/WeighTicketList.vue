<template>
  <div class="weigh-ticket-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">电子磅单列表</span>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          生成磅单
        </el-button>
      </div>
      <div class="filter-wrapper">
        <el-input
          v-model="filterTicketNo"
          placeholder="磅单编号"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Tickets /></el-icon>
          </template>
        </el-input>
        <el-input
          v-model="filterOrderNo"
          placeholder="订单号"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Document /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 300px"
          value-format="YYYY-MM-DD"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        :data="filteredList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="ticketNo" label="磅单编号" width="180" />
        <el-table-column prop="orderNo" label="关联订单" width="180" />
        <el-table-column prop="wasteName" label="废弃物名称" min-width="160" />
        <el-table-column label="毛重(吨)" width="100" align="right">
          <template #default="{ row }">
            <span class="weight-text">{{ row.grossWeight }}</span>
          </template>
        </el-table-column>
        <el-table-column label="皮重(吨)" width="100" align="right">
          <template #default="{ row }">
            <span class="weight-text">{{ row.tareWeight }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净重(吨)" width="100" align="right">
          <template #default="{ row }">
            <span class="net-weight">{{ row.netWeight }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weighTime" label="称重时间" width="180" />
        <el-table-column prop="weigher" label="司磅员" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="light">
              {{ statusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
            <el-button type="success" link size="small" @click="handlePrint(row)">
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
            <el-button type="info" link size="small" @click="handleDownload(row)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Search, Refresh, Tickets, Document, View, Printer, Download
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const filterTicketNo = ref('')
const filterOrderNo = ref('')
const dateRange = ref([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  ticketNo: '',
  orderNo: '',
  startDate: '',
  endDate: ''
})

const statusTypeMap = {
  draft: 'info',
  confirmed: 'success',
  certified: 'primary'
}

const statusTextMap = {
  draft: '草稿',
  confirmed: '已确认',
  certified: '已存证'
}

const weighTicketList = ref([
  {
    id: 1,
    ticketNo: 'BD202406140001',
    orderNo: 'DD202406140001',
    wasteName: '废旧纸箱一批',
    grossWeight: 5.2,
    tareWeight: 1.8,
    netWeight: 3.4,
    unitPrice: 1200,
    totalAmount: 4080,
    vehicleNo: '京A·88888',
    driverName: '张师傅',
    weigher: '李司磅',
    weighTime: '2024-06-14 14:30:25',
    status: 'certified',
    hasImage: true
  },
  {
    id: 2,
    ticketNo: 'BD202406140002',
    orderNo: 'DD202406140002',
    wasteName: '工业废铁边角料',
    grossWeight: 4.5,
    tareWeight: 2.0,
    netWeight: 2.5,
    unitPrice: 1800,
    totalAmount: 4500,
    vehicleNo: '京B·66666',
    driverName: '李师傅',
    weigher: '王司磅',
    weighTime: '2024-06-14 10:15:42',
    status: 'confirmed',
    hasImage: true
  },
  {
    id: 3,
    ticketNo: 'BD202406130003',
    orderNo: 'DD202406130003',
    wasteName: '生活塑料瓶',
    grossWeight: 2.1,
    tareWeight: 1.5,
    netWeight: 0.6,
    unitPrice: 1300,
    totalAmount: 780,
    vehicleNo: '京A·88888',
    driverName: '张师傅',
    weigher: '李司磅',
    weighTime: '2024-06-13 16:45:10',
    status: 'draft',
    hasImage: false
  },
  {
    id: 4,
    ticketNo: 'BD202406130004',
    orderNo: 'DD202406130004',
    wasteName: '废旧家电',
    grossWeight: 0.8,
    tareWeight: 0.3,
    netWeight: 0.5,
    unitPrice: 3000,
    totalAmount: 1500,
    vehicleNo: '京C·12345',
    driverName: '王师傅',
    weigher: '赵司磅',
    weighTime: '2024-06-13 09:20:33',
    status: 'certified',
    hasImage: true
  },
  {
    id: 5,
    ticketNo: 'BD202406120005',
    orderNo: 'DD202406120005',
    wasteName: '二手注塑机',
    grossWeight: 3.2,
    tareWeight: 1.2,
    netWeight: 2.0,
    unitPrice: 6000,
    totalAmount: 12000,
    vehicleNo: '京B·66666',
    driverName: '李师傅',
    weigher: '王司磅',
    weighTime: '2024-06-12 14:00:18',
    status: 'confirmed',
    hasImage: true
  },
  {
    id: 6,
    ticketNo: 'BD202406110006',
    orderNo: 'DD202406110006',
    wasteName: '废玻璃',
    grossWeight: 1.5,
    tareWeight: 1.0,
    netWeight: 0.5,
    unitPrice: 400,
    totalAmount: 200,
    vehicleNo: '京A·88888',
    driverName: '张师傅',
    weigher: '李司磅',
    weighTime: '2024-06-11 11:30:00',
    status: 'certified',
    hasImage: true
  },
  {
    id: 7,
    ticketNo: 'BD202406100007',
    orderNo: 'DD202406100007',
    wasteName: '纺织废料',
    grossWeight: 0.9,
    tareWeight: 0.4,
    netWeight: 0.5,
    unitPrice: 800,
    totalAmount: 400,
    vehicleNo: '京D·99999',
    driverName: '刘师傅',
    weigher: '赵司磅',
    weighTime: '2024-06-10 15:45:30',
    status: 'draft',
    hasImage: false
  },
  {
    id: 8,
    ticketNo: 'BD202406090008',
    orderNo: 'DD202406090008',
    wasteName: '建筑垃圾',
    grossWeight: 8.5,
    tareWeight: 3.0,
    netWeight: 5.5,
    unitPrice: 60,
    totalAmount: 330,
    vehicleNo: '京B·66666',
    driverName: '李师傅',
    weigher: '王司磅',
    weighTime: '2024-06-09 10:20:15',
    status: 'confirmed',
    hasImage: true
  }
])

const total = ref(42)

const filteredList = computed(() => {
  let list = weighTicketList.value
  
  if (filterTicketNo.value) {
    list = list.filter(item => 
      item.ticketNo.toLowerCase().includes(filterTicketNo.value.toLowerCase())
    )
  }
  
  if (filterOrderNo.value) {
    list = list.filter(item => 
      item.orderNo.toLowerCase().includes(filterOrderNo.value.toLowerCase())
    )
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(item => {
      const date = item.weighTime.split(' ')[0]
      return date >= start && date <= end
    })
  }
  
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
  } catch (err) {
    console.error('获取磅单列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.ticketNo = filterTicketNo.value
  queryParams.orderNo = filterOrderNo.value
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  }
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  filterTicketNo.value = ''
  filterOrderNo.value = ''
  dateRange.value = []
  queryParams.ticketNo = ''
  queryParams.orderNo = ''
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/collector/weigh-tickets/create')
}

const handleDetail = (row) => {
  router.push(`/collector/weigh-tickets/${row.id}`)
}

const handlePrint = (row) => {
  ElMessage.success(`正在打印磅单 ${row.ticketNo}`)
}

const handleDownload = (row) => {
  ElMessage.success(`正在下载磅单 ${row.ticketNo}`)
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.weigh-ticket-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card,
.table-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.filter-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.weight-text {
  color: #606266;
}

.net-weight {
  color: #43a047;
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
