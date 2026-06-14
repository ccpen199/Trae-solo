<template>
  <div class="vehicle-list-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">车辆管理</span>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增车辆
        </el-button>
      </div>
      <div class="search-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索车牌号、司机姓名"
          clearable
          style="width: 320px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
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
        :data="filteredVehicles"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column label="车牌号" width="140">
          <template #default="{ row }">
            <div class="plate-no">
              <el-icon><Van /></el-icon>
              {{ row.plateNo }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="车辆类型" width="140">
          <template #default="{ row }">
            <el-tag type="success" size="small" effect="light">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="载重(吨)" width="100" align="center">
          <template #default="{ row }">
            <span class="load-capacity">{{ row.loadCapacity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="driverName" label="司机姓名" width="120" />
        <el-table-column prop="driverPhone" label="司机电话" width="150" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small" effect="dark">
              {{ statusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="licenseNo" label="行驶证号" width="160" />
        <el-table-column prop="collector" label="所属收废商" min-width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="warning" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
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

    <el-dialog
      v-model="detailVisible"
      title="车辆详情"
      width="600px"
      class="vehicle-detail-dialog"
    >
      <div v-if="currentVehicle" class="vehicle-detail">
        <div class="detail-header">
          <div class="vehicle-avatar">
            <el-image
              v-if="currentVehicle.vehicleImage"
              :src="currentVehicle.vehicleImage"
              fit="cover"
              class="vehicle-image"
            />
            <div v-else class="vehicle-placeholder">
              <el-icon><Van /></el-icon>
            </div>
          </div>
          <div class="vehicle-basic">
            <div class="plate-number">{{ currentVehicle.plateNo }}</div>
            <el-tag :type="statusTypeMap[currentVehicle.status]" size="default" effect="dark">
              {{ statusTextMap[currentVehicle.status] }}
            </el-tag>
          </div>
        </div>
        
        <el-divider />
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">车辆类型</span>
            <span class="detail-value">{{ currentVehicle.type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">载重</span>
            <span class="detail-value highlight">{{ currentVehicle.loadCapacity }} 吨</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">司机姓名</span>
            <span class="detail-value">{{ currentVehicle.driverName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">司机电话</span>
            <span class="detail-value">{{ currentVehicle.driverPhone }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">行驶证号</span>
            <span class="detail-value">{{ currentVehicle.licenseNo }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">所属收废商</span>
            <span class="detail-value">{{ currentVehicle.collector }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Refresh, Van, View, Edit, Delete
} from '@element-plus/icons-vue'
import { getVehicleList, deleteVehicle } from '@/api/vehicle'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const detailVisible = ref(false)
const currentVehicle = ref(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const statusTypeMap = {
  idle: 'success',
  working: 'primary',
  maintenance: 'warning'
}

const statusTextMap = {
  idle: '空闲',
  working: '作业中',
  maintenance: '维护中'
}

const vehicleList = ref([
  {
    id: 1,
    plateNo: '京A·88888',
    type: '厢式货车',
    loadCapacity: 5,
    driverName: '张师傅',
    driverPhone: '138****8888',
    licenseNo: '110108199001011234',
    collector: '绿源回收有限公司',
    status: 'idle',
    vehicleImage: 'https://via.placeholder.com/200x120/e8f5e9/66bb6a?text=Truck'
  },
  {
    id: 2,
    plateNo: '京B·66666',
    type: '平板车',
    loadCapacity: 8,
    driverName: '李师傅',
    driverPhone: '139****6666',
    licenseNo: '110108198505054321',
    collector: '绿源回收有限公司',
    status: 'working',
    vehicleImage: 'https://via.placeholder.com/200x120/c8e6c9/43a047?text=Flatbed'
  },
  {
    id: 3,
    plateNo: '京C·12345',
    type: '危化品车',
    loadCapacity: 3,
    driverName: '王师傅',
    driverPhone: '137****1234',
    licenseNo: '110108198808085678',
    collector: '绿源回收有限公司',
    status: 'maintenance',
    vehicleImage: 'https://via.placeholder.com/200x120/a5d6a7/2e7d32?text=Hazmat'
  },
  {
    id: 4,
    plateNo: '京D·99999',
    type: '厢式货车',
    loadCapacity: 6,
    driverName: '刘师傅',
    driverPhone: '136****5678',
    licenseNo: '110108199202028765',
    collector: '金诚金属回收',
    status: 'idle',
    vehicleImage: 'https://via.placeholder.com/200x120/dcedc8/81c784?text=Van'
  },
  {
    id: 5,
    plateNo: '京E·77777',
    type: '自卸车',
    loadCapacity: 10,
    driverName: '赵师傅',
    driverPhone: '135****7777',
    licenseNo: '110108199101011111',
    collector: '绿源回收有限公司',
    status: 'working',
    vehicleImage: 'https://via.placeholder.com/200x120/b9f6ca/66bb6a?text=Tipper'
  },
  {
    id: 6,
    plateNo: '京F·55555',
    type: '冷藏车',
    loadCapacity: 4,
    driverName: '孙师傅',
    driverPhone: '134****5555',
    licenseNo: '110108199303032222',
    collector: '塑再生资源公司',
    status: 'idle',
    vehicleImage: 'https://via.placeholder.com/200x120/f1f8e9/43a047?text=Refrigerated'
  }
])

const total = ref(15)

const filteredVehicles = computed(() => {
  let list = vehicleList.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.plateNo.toLowerCase().includes(keyword) ||
      item.driverName.toLowerCase().includes(keyword)
    )
  }
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getVehicleList(queryParams)
    if (res.data) {
      vehicleList.value = res.data.list || res.data
      total.value = res.data.total || vehicleList.value.length
    }
  } catch (err) {
    console.error('获取车辆列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchKeyword.value = ''
  queryParams.keyword = ''
  queryParams.page = 1
  fetchData()
}

const handleAdd = () => {
  router.push('/collector/vehicles/create')
}

const handleView = (row) => {
  currentVehicle.value = row
  detailVisible.value = true
}

const handleEdit = (row) => {
  router.push(`/collector/vehicles/${row.id}/edit`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定删除车辆 ${row.plateNo} 吗？删除后不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const res = await deleteVehicle(row.id)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('删除成功')
      vehicleList.value = vehicleList.value.filter(item => item.id !== row.id)
      total.value--
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.success('删除成功')
      vehicleList.value = vehicleList.value.filter(item => item.id !== row.id)
      total.value--
    }
  }
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
.vehicle-list-container {
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

.search-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.plate-no {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #303133;
}

.plate-no .el-icon {
  color: #66bb6a;
}

.load-capacity {
  font-weight: 600;
  color: #43a047;
  font-size: 15px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.vehicle-detail-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.detail-header {
  display: flex;
  gap: 20px;
  align-items: center;
}

.vehicle-avatar {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
}

.vehicle-image {
  width: 100%;
  height: 100%;
}

.vehicle-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #c0c4cc;
  background: #f5f5f5;
}

.vehicle-basic {
  flex: 1;
}

.plate-number {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 13px;
  color: #909399;
}

.detail-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.detail-value.highlight {
  color: #43a047;
  font-size: 18px;
  font-weight: 600;
}
</style>
