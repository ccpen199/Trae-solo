<template>
  <div class="production-records">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="产量记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>产量记录列表</span>
              <div class="header-actions">
                <el-select v-model="filterDevice" placeholder="按设备筛选" clearable style="width: 200px; margin-right: 10px" @change="loadRecords">
                  <el-option label="全部" :value="null" />
                  <el-option v-for="d in devices" :key="d.id" :label="`[${d.code}] ${d.name}`" :value="d.id" />
                </el-select>
                <el-button type="primary" @click="showRecordDialog">
                  <el-icon><Plus /></el-icon>录入产量
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="filteredRecords" style="width: 100%" stripe>
            <el-table-column label="设备" width="200">
              <template #default="{ row }">
                <div v-if="row.device" class="device-display">
                  <el-tag size="small" type="info">{{ row.device.code }}</el-tag>
                  <span class="device-name">{{ row.device.name }}</span>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="work_order.code" label="工单" width="100">
              <template #default="{ row }">{{ row.work_order?.code || '-' }}</template>
            </el-table-column>
            <el-table-column prop="product.name" label="产品" width="120">
              <template #default="{ row }">{{ row.product?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="shift.name" label="班次" width="80">
              <template #default="{ row }">{{ row.shift?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="production_date" label="生产日期" width="160">
              <template #default="{ row }">{{ formatDate(row.production_date) }}</template>
            </el-table-column>
            <el-table-column prop="total_output" label="总产量" width="90">
              <template #default="{ row }"><strong>{{ row.total_output }}</strong></template>
            </el-table-column>
            <el-table-column prop="good_quantity" label="良品数" width="90">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.good_quantity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rework_quantity" label="返工数" width="90">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.rework_quantity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scrap_quantity" label="报废数" width="90">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.scrap_quantity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="trial_production" label="试产" width="60">
              <template #default="{ row }">
                <el-tag v-if="row.trial_production" type="info" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="quality_result" label="质检" width="80">
              <template #default="{ row }">
                <el-tag :type="row.quality_result === '合格' ? 'success' : 'warning'" size="small">{{ row.quality_result || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="良品率" width="90">
              <template #default="{ row }">
                <strong :style="{ color: getYieldRateColor(row) }">{{ getYieldRate(row) }}%</strong>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editRecord(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteRecord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="产品管理" name="products">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>产品列表</span>
              <el-button type="primary" @click="showProductDialog">
                <el-icon><Plus /></el-icon>新增产品
              </el-button>
            </div>
          </template>

          <el-table :data="products" style="width: 100%" stripe>
            <el-table-column prop="code" label="产品编码" width="150" />
            <el-table-column prop="name" label="产品名称" />
            <el-table-column prop="standard_output" label="标准产能(件/小时)" width="180" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="editProduct(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteProduct(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="工单管理" name="workorders">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>工单列表</span>
              <el-button type="primary" @click="showWorkOrderDialog">
                <el-icon><Plus /></el-icon>新增工单
              </el-button>
            </div>
          </template>

          <el-table :data="workOrders" style="width: 100%" stripe>
            <el-table-column prop="code" label="工单编码" width="150" />
            <el-table-column prop="product.name" label="产品" width="150">
              <template #default="{ row }">{{ row.product?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="planned_quantity" label="计划数量" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getWorkOrderStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editWorkOrder(row)">编辑</el-button>
                <el-button size="small" type="success" :disabled="row.status === '已完成'" @click="completeWorkOrder(row)">完成</el-button>
                <el-button size="small" type="danger" @click="deleteWorkOrder(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="recordDialogVisible" :title="isRecordEdit ? '编辑产量' : '录入产量'" width="700px">
      <el-form :model="recordForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备" required>
              <el-select v-model="recordForm.device_id" placeholder="请选择设备" style="width: 100%">
                <el-option v-for="d in devices" :key="d.id" :label="`[${d.code}] ${d.name}`" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工单">
              <el-select v-model="recordForm.work_order_id" placeholder="请选择工单" style="width: 100%">
                <el-option v-for="wo in activeWorkOrders" :key="wo.id" :label="wo.code" :value="wo.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品" required>
              <el-select v-model="recordForm.product_id" placeholder="请选择产品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班次">
              <el-select v-model="recordForm.shift_id" placeholder="请选择班次" style="width: 100%">
                <el-option v-for="s in shifts" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期">
              <el-date-picker v-model="recordForm.production_date" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试生产">
              <el-switch v-model="recordForm.trial_production" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">产量数据</el-divider>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="总产量">
              <el-input-number v-model="recordForm.total_output" :min="0" style="width: 100%" @change="calcQuantities" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="良品数">
              <el-input-number v-model="recordForm.good_quantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="返工数">
              <el-input-number v-model="recordForm.rework_quantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="报废数">
              <el-input-number v-model="recordForm.scrap_quantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="操作员">
              <el-input v-model="recordForm.operator" placeholder="请输入操作员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质检员">
              <el-input v-model="recordForm.inspector" placeholder="请输入质检员" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="质检结果">
              <el-select v-model="recordForm.quality_result" placeholder="请选择" style="width: 100%">
                <el-option label="合格" value="合格" />
                <el-option label="待检" value="待检" />
                <el-option label="不合格" value="不合格" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="recordForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="productDialogVisible" :title="isProductEdit ? '编辑产品' : '新增产品'" width="500px">
      <el-form :model="productForm" label-width="100px">
        <el-form-item label="产品编码" required>
          <el-input v-model="productForm.code" :disabled="isProductEdit" placeholder="请输入产品编码" />
        </el-form-item>
        <el-form-item label="产品名称" required>
          <el-input v-model="productForm.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="标准产能">
          <el-input-number v-model="productForm.standard_output" :min="0" style="width: 100%" />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">单位：件/小时</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workOrderDialogVisible" :title="isWorkOrderEdit ? '编辑工单' : '新增工单'" width="500px">
      <el-form :model="workOrderForm" label-width="100px">
        <el-form-item label="工单编码" required>
          <el-input v-model="workOrderForm.code" :disabled="isWorkOrderEdit" placeholder="请输入工单编码" />
        </el-form-item>
        <el-form-item label="产品" required>
          <el-select v-model="workOrderForm.product_id" placeholder="请选择产品" style="width: 100%">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" required>
          <el-input-number v-model="workOrderForm.planned_quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="workOrderForm.status" style="width: 100%">
            <el-option label="待开始" value="待开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workOrderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWorkOrder">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getProductionRecords, createProductionRecord, deleteProductionRecord,
  getProducts, createProduct, deleteProduct as deleteProductApi,
  getWorkOrders, createWorkOrder, deleteWorkOrder as deleteWorkOrderApi,
  getDevices, getShifts
} from '../api'

const activeTab = ref('records')
const filterDevice = ref(null)

const records = ref([])
const products = ref([])
const workOrders = ref([])
const devices = ref([])
const shifts = ref([])

const recordDialogVisible = ref(false)
const productDialogVisible = ref(false)
const workOrderDialogVisible = ref(false)

const isRecordEdit = ref(false)
const isProductEdit = ref(false)
const isWorkOrderEdit = ref(false)

const recordForm = ref({
  device_id: null,
  work_order_id: null,
  product_id: null,
  shift_id: null,
  production_date: new Date(),
  total_output: 0,
  good_quantity: 0,
  rework_quantity: 0,
  scrap_quantity: 0,
  trial_production: false,
  operator: '',
  inspector: '',
  quality_result: '',
  notes: ''
})

const productForm = ref({
  code: '',
  name: '',
  standard_output: 100
})

const workOrderForm = ref({
  code: '',
  product_id: null,
  planned_quantity: 100,
  status: '进行中'
})

const filteredRecords = computed(() => {
  let result = records.value
  if (filterDevice.value) result = result.filter(r => r.device_id === filterDevice.value)
  return result.sort((a, b) => new Date(b.production_date) - new Date(a.production_date))
})

const activeWorkOrders = computed(() => workOrders.value.filter(w => w.status !== '已完成'))

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const getYieldRate = (row) => {
  if (row.total_output === 0) return 0
  return Math.round(row.good_quantity / row.total_output * 100)
}

const getYieldRateColor = (row) => {
  const rate = getYieldRate(row)
  if (rate >= 95) return '#67c23a'
  if (rate >= 85) return '#e6a23c'
  return '#f56c6c'
}

const getWorkOrderStatusType = (status) => {
  const types = { '待开始': 'info', '进行中': 'warning', '已完成': 'success' }
  return types[status] || 'info'
}

const calcQuantities = () => {
  if (recordForm.value.total_output > 0 && recordForm.value.good_quantity === 0) {
    recordForm.value.good_quantity = recordForm.value.total_output
  }
}

const loadRecords = async () => {
  try {
    const res = await getProductionRecords()
    records.value = res.data
  } catch (error) {
    ElMessage.error('加载记录失败')
  }
}

const loadProducts = async () => {
  try {
    const res = await getProducts()
    products.value = res.data
  } catch (error) {
    ElMessage.error('加载产品失败')
  }
}

const loadWorkOrders = async () => {
  try {
    const res = await getWorkOrders()
    workOrders.value = res.data
  } catch (error) {
    ElMessage.error('加载工单失败')
  }
}

const loadDevices = async () => {
  try {
    const res = await getDevices()
    devices.value = res.data.filter(d => d.is_active)
  } catch (error) {
    ElMessage.error('加载设备失败')
  }
}

const loadShifts = async () => {
  try {
    const res = await getShifts()
    shifts.value = res.data
  } catch (error) {
    ElMessage.error('加载班次失败')
  }
}

const showRecordDialog = () => {
  isRecordEdit.value = false
  recordForm.value = {
    device_id: null,
    work_order_id: null,
    product_id: null,
    shift_id: null,
    production_date: new Date(),
    total_output: 0,
    good_quantity: 0,
    rework_quantity: 0,
    scrap_quantity: 0,
    trial_production: false,
    operator: '',
    inspector: '',
    quality_result: '',
    notes: ''
  }
  recordDialogVisible.value = true
}

const editRecord = (row) => {
  isRecordEdit.value = true
  recordForm.value = { ...row }
  recordDialogVisible.value = true
}

const saveRecord = async () => {
  try {
    await createProductionRecord(recordForm.value)
    ElMessage.success('保存成功')
    recordDialogVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '确认删除', { type: 'warning' })
    await deleteProductionRecord(row.id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const showProductDialog = () => {
  isProductEdit.value = false
  productForm.value = { code: '', name: '', standard_output: 100 }
  productDialogVisible.value = true
}

const editProduct = (row) => {
  isProductEdit.value = true
  productForm.value = { ...row }
  productDialogVisible.value = true
}

const saveProduct = async () => {
  try {
    await createProduct(productForm.value)
    ElMessage.success('保存成功')
    productDialogVisible.value = false
    loadProducts()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '保存失败')
  }
}

const deleteProduct = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除产品 ${row.name} 吗？`, '确认删除', { type: 'warning' })
    await deleteProductApi(row.id)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const showWorkOrderDialog = () => {
  isWorkOrderEdit.value = false
  workOrderForm.value = { code: '', product_id: null, planned_quantity: 100, status: '进行中' }
  workOrderDialogVisible.value = true
}

const editWorkOrder = (row) => {
  isWorkOrderEdit.value = true
  workOrderForm.value = { ...row }
  workOrderDialogVisible.value = true
}

const saveWorkOrder = async () => {
  try {
    await createWorkOrder(workOrderForm.value)
    ElMessage.success('保存成功')
    workOrderDialogVisible.value = false
    loadWorkOrders()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '保存失败')
  }
}

const completeWorkOrder = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要完成工单 ${row.code} 吗？`, '确认操作', { type: 'warning' })
    ElMessage.success('工单已完成')
    loadWorkOrders()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

const deleteWorkOrder = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除工单 ${row.code} 吗？`, '确认删除', { type: 'warning' })
    await deleteWorkOrderApi(row.id)
    ElMessage.success('删除成功')
    loadWorkOrders()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadRecords()
  loadProducts()
  loadWorkOrders()
  loadDevices()
  loadShifts()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.device-display {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-name {
  margin-left: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
