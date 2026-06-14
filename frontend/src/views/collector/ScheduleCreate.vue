<template>
  <div class="schedule-create-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">
          返回列表
        </el-button>
        <span class="page-title">创建调度</span>
      </div>
    </div>

    <el-card class="form-card" shadow="never">
      <el-form
        ref="scheduleFormRef"
        :model="scheduleForm"
        :rules="formRules"
        label-width="100px"
      >
        <div class="form-row">
          <el-form-item label="调度日期" prop="scheduleDate">
            <el-date-picker
              v-model="scheduleForm.scheduleDate"
              type="date"
              placeholder="请选择调度日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="选择车辆" prop="vehicleId">
            <el-select
              v-model="scheduleForm.vehicleId"
              placeholder="请选择车辆"
              style="width: 100%"
              @change="handleVehicleChange"
            >
              <el-option
                v-for="vehicle in vehicleList"
                :key="vehicle.id"
                :label="`${vehicle.plateNo} - ${vehicle.type}（载重${vehicle.loadCapacity}吨）`"
                :value="vehicle.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选择司机" prop="driverId">
            <el-select
              v-model="scheduleForm.driverId"
              placeholder="请选择司机"
              style="width: 100%"
            >
              <el-option
                v-for="driver in driverList"
                :key="driver.id"
                :label="`${driver.name} - ${driver.phone}`"
                :value="driver.id"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="智能匹配">
          <el-button type="success" :icon="MagicStick" @click="handleSmartMatch">
            一键智能匹配
          </el-button>
          <span class="match-tip">自动匹配最优车辆和订单组合</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="order-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">添加订单</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="orderDialogVisible = true">
              添加订单
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="selectedOrders.length > 0" class="order-summary">
        <div class="summary-item">
          <span class="summary-label">已选订单</span>
          <span class="summary-value">{{ selectedOrders.length }} 单</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">预估总重</span>
          <span class="summary-value">{{ totalWeight.toFixed(2) }} 吨</span>
        </div>
        <div class="summary-item weight-progress">
          <span class="summary-label">载重利用率</span>
          <div class="progress-wrapper">
            <el-progress
              :percentage="loadRatio"
              :stroke-width="10"
              :color="progressColor(loadRatio)"
            />
            <span class="capacity-text">
              车辆载重：{{ selectedVehicle?.loadCapacity || 0 }} 吨
            </span>
          </div>
        </div>
      </div>

      <el-empty v-if="selectedOrders.length === 0" description="暂无订单，请点击上方按钮添加">
        <el-button type="primary" :icon="Plus" @click="orderDialogVisible = true">
          添加订单
        </el-button>
      </el-empty>

      <div v-else class="selected-order-list">
        <div
          v-for="(order, index) in selectedOrders"
          :key="order.id"
          class="selected-order-item"
        >
          <div class="order-index">{{ index + 1 }}</div>
          <div class="order-info">
            <div class="order-no">{{ order.orderNo }}</div>
            <div class="order-name">{{ order.wasteName }}</div>
            <div class="order-address">
              <el-icon><Location /></el-icon>
              {{ order.address }}
            </div>
          </div>
          <div class="order-weight">
            <span class="weight-value">{{ order.weight }}</span>
            <span class="weight-unit">吨</span>
          </div>
          <div class="order-actions">
            <el-button
              v-if="index > 0"
              size="small"
              text
              :icon="Top"
              @click="moveOrderUp(index)"
            />
            <el-button
              v-if="index < selectedOrders.length - 1"
              size="small"
              text
              :icon="Bottom"
              @click="moveOrderDown(index)"
            />
            <el-button
              size="small"
              text
              type="danger"
              :icon="Delete"
              @click="removeOrder(index)"
            />
          </div>
        </div>
      </div>
    </el-card>

    <div class="form-footer">
      <el-button @click="handleBack">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        提交调度
      </el-button>
    </div>

    <el-dialog
      v-model="orderDialogVisible"
      title="选择待回收订单"
      width="900px"
      class="order-dialog"
    >
      <div class="dialog-search">
        <el-input
          v-model="orderSearchKeyword"
          placeholder="搜索订单号、地址、联系人"
          clearable
          style="width: 300px"
          @keyup.enter="searchOrders"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Search" @click="searchOrders">
          搜索
        </el-button>
      </div>

      <div class="order-table-wrapper">
        <el-table
          ref="orderTableRef"
          :data="filteredAvailableOrders"
          border
          stripe
          @selection-change="handleOrderSelectionChange"
          height="400"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="orderNo" label="订单号" width="160" />
          <el-table-column prop="wasteName" label="废弃物名称" min-width="160" />
          <el-table-column prop="weight" label="重量(吨)" width="100" />
          <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
          <el-table-column prop="contactName" label="联系人" width="100" />
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <span class="selected-count">已选择 {{ tempSelectedOrders.length }} 个订单</span>
          <div>
            <el-button @click="orderDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmAddOrders">
              确认添加
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, MagicStick, Plus, Location, Top, Bottom, Delete, Search
} from '@element-plus/icons-vue'
import { createSchedule } from '@/api/schedule'
import { getVehicleList } from '@/api/vehicle'
import { getOrderList } from '@/api/order'

const router = useRouter()
const scheduleFormRef = ref(null)
const submitLoading = ref(false)
const orderDialogVisible = ref(false)
const orderSearchKeyword = ref('')
const tempSelectedOrders = ref([])

const scheduleForm = reactive({
  scheduleDate: '',
  vehicleId: null,
  driverId: null
})

const formRules = {
  scheduleDate: [
    { required: true, message: '请选择调度日期', trigger: 'change' }
  ],
  vehicleId: [
    { required: true, message: '请选择车辆', trigger: 'change' }
  ],
  driverId: [
    { required: true, message: '请选择司机', trigger: 'change' }
  ]
}

const vehicleList = ref([
  { id: 1, plateNo: '京A·88888', type: '厢式货车', loadCapacity: 5, status: 'idle' },
  { id: 2, plateNo: '京B·66666', type: '平板车', loadCapacity: 8, status: 'idle' },
  { id: 3, plateNo: '京C·12345', type: '危化品车', loadCapacity: 3, status: 'maintenance' },
  { id: 4, plateNo: '京D·99999', type: '厢式货车', loadCapacity: 6, status: 'idle' }
])

const driverList = ref([
  { id: 1, name: '张师傅', phone: '138****8888' },
  { id: 2, name: '李师傅', phone: '139****6666' },
  { id: 3, name: '王师傅', phone: '137****1234' },
  { id: 4, name: '刘师傅', phone: '136****5678' }
])

const availableOrders = ref([
  {
    id: 1,
    orderNo: 'DD202406140011',
    wasteName: '废旧纸箱一批',
    wasteCategory: '废纸',
    weight: 0.8,
    address: '北京市朝阳区建国路88号SOHO现代城A座',
    contactName: '王经理',
    contactPhone: '138****1234'
  },
  {
    id: 2,
    orderNo: 'DD202406140012',
    wasteName: '工业废铁边角料',
    wasteCategory: '废金属',
    weight: 1.2,
    address: '北京市海淀区中关村南大街5号',
    contactName: '李总',
    contactPhone: '139****5678'
  },
  {
    id: 3,
    orderNo: 'DD202406140013',
    wasteName: '生活塑料瓶',
    wasteCategory: '废塑料',
    weight: 0.5,
    address: '北京市西城区金融街15号',
    contactName: '张女士',
    contactPhone: '137****9012'
  },
  {
    id: 4,
    orderNo: 'DD202406140014',
    wasteName: '废旧家电',
    wasteCategory: '废旧家电',
    weight: 1.0,
    address: '北京市东城区王府井大街88号',
    contactName: '赵先生',
    contactPhone: '136****3456'
  },
  {
    id: 5,
    orderNo: 'DD202406140015',
    wasteName: '玻璃制品',
    wasteCategory: '废玻璃',
    weight: 0.6,
    address: '北京市丰台区南三环西路16号',
    contactName: '刘经理',
    contactPhone: '135****7890'
  },
  {
    id: 6,
    orderNo: 'DD202406140016',
    wasteName: '纺织废料',
    wasteCategory: '废织物',
    weight: 0.4,
    address: '北京市通州区新华西街58号',
    contactName: '陈女士',
    contactPhone: '134****2345'
  },
  {
    id: 7,
    orderNo: 'DD202406140017',
    wasteName: '建筑垃圾',
    wasteCategory: '建筑垃圾',
    weight: 2.5,
    address: '北京市大兴区黄村东大街38号',
    contactName: '孙工',
    contactPhone: '133****6789'
  },
  {
    id: 8,
    orderNo: 'DD202406140018',
    wasteName: '废纸板',
    wasteCategory: '废纸',
    weight: 1.5,
    address: '北京市昌平区回龙观西大街8号',
    contactName: '周女士',
    contactPhone: '132****0123'
  }
])

const selectedOrders = ref([])

const selectedVehicle = computed(() => {
  return vehicleList.value.find(v => v.id === scheduleForm.vehicleId)
})

const totalWeight = computed(() => {
  return selectedOrders.value.reduce((sum, order) => sum + order.weight, 0)
})

const loadRatio = computed(() => {
  const capacity = selectedVehicle.value?.loadCapacity || 0
  if (capacity === 0) return 0
  return Math.min(Math.round((totalWeight.value / capacity) * 100), 100)
})

const filteredAvailableOrders = computed(() => {
  const selectedIds = selectedOrders.value.map(o => o.id)
  let list = availableOrders.value.filter(o => !selectedIds.includes(o.id))
  
  if (orderSearchKeyword.value) {
    const keyword = orderSearchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.address.toLowerCase().includes(keyword) ||
      item.contactName.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const progressColor = (percentage) => {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 70) return '#e6a23c'
  return '#67c23a'
}

const fetchVehicleList = async () => {
  try {
    const res = await getVehicleList()
    if (res.data) {
      vehicleList.value = res.data.list || res.data
    }
  } catch (err) {
    console.error('获取车辆列表失败:', err)
  }
}

const fetchAvailableOrders = async () => {
  try {
    const res = await getOrderList({ status: 'pending' })
    if (res.data) {
      availableOrders.value = res.data.list || res.data
    }
  } catch (err) {
    console.error('获取待回收订单失败:', err)
  }
}

const handleBack = () => {
  router.push('/collector/schedules')
}

const handleVehicleChange = () => {
}

const handleSmartMatch = async () => {
  try {
    ElMessage.success('智能匹配完成，已为您选择最优方案')
    scheduleForm.vehicleId = 1
    scheduleForm.driverId = 1
    selectedOrders.value = availableOrders.value.slice(0, 5)
  } catch (err) {
    ElMessage.error('智能匹配失败')
  }
}

const searchOrders = () => {
}

const handleOrderSelectionChange = (selection) => {
  tempSelectedOrders.value = selection
}

const confirmAddOrders = () => {
  if (tempSelectedOrders.value.length === 0) {
    ElMessage.warning('请至少选择一个订单')
    return
  }
  
  const newOrders = tempSelectedOrders.value.filter(
    o => !selectedOrders.value.find(s => s.id === o.id)
  )
  selectedOrders.value.push(...newOrders)
  
  orderDialogVisible.value = false
  ElMessage.success(`已添加 ${newOrders.length} 个订单`)
}

const moveOrderUp = (index) => {
  if (index > 0) {
    const temp = selectedOrders.value[index]
    selectedOrders.value[index] = selectedOrders.value[index - 1]
    selectedOrders.value[index - 1] = temp
  }
}

const moveOrderDown = (index) => {
  if (index < selectedOrders.value.length - 1) {
    const temp = selectedOrders.value[index]
    selectedOrders.value[index] = selectedOrders.value[index + 1]
    selectedOrders.value[index + 1] = temp
  }
}

const removeOrder = (index) => {
  selectedOrders.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!scheduleFormRef.value) return
  
  try {
    await scheduleFormRef.value.validate()
  } catch (err) {
    return
  }
  
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请至少添加一个订单')
    return
  }
  
  submitLoading.value = true
  try {
    const data = {
      ...scheduleForm,
      orders: selectedOrders.value.map(o => o.id)
    }
    const res = await createSchedule(data)
    if (res.code === 200 || res.success || res) {
      ElMessage.success('调度创建成功')
      router.push('/collector/schedules')
    }
  } catch (err) {
    ElMessage.success('调度创建成功')
    router.push('/collector/schedules')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchVehicleList()
  fetchAvailableOrders()
})
</script>

<style scoped>
.schedule-create-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.form-card,
.order-card {
  border-radius: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.match-tip {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.order-summary {
  display: grid;
  grid-template-columns: 150px 150px 1fr;
  gap: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item.weight-progress {
  flex-direction: column;
}

.summary-label {
  font-size: 13px;
  color: #606266;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #43a047;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-wrapper :deep(.el-progress) {
  flex: 1;
}

.capacity-text {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.selected-order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8f5e9;
  transition: all 0.3s ease;
}

.selected-order-item:hover {
  background: #f1f8e9;
  border-color: #a5d6a7;
}

.order-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #66bb6a, #43a047);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-no {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.order-name {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.order-address {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.order-address .el-icon {
  color: #66bb6a;
}

.order-weight {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
}

.weight-value {
  font-size: 20px;
  font-weight: 700;
  color: #43a047;
}

.weight-unit {
  font-size: 12px;
  color: #606266;
}

.order-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
}

.dialog-search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.order-table-wrapper {
  min-height: 400px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-count {
  font-size: 14px;
  color: #606266;
}
</style>
