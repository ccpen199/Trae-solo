<template>
  <div>
    <el-alert
      v-if="gaps && gaps.length > 0"
      :title="`当前有 ${gaps.length} 项物资缺口待处理`"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;" />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="物资需求" name="demands">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">物资需求</h2>
            <el-button type="primary" @click="showDemandDialog = true" :icon="Plus">
              新增需求
            </el-button>
          </div>

          <div class="filter-bar">
            <el-select v-model="demandFilters.status" placeholder="状态" clearable style="width: 120px;">
              <el-option label="待分配" value="pending" />
              <el-option label="部分分配" value="partial" />
              <el-option label="已分配" value="allocated" />
              <el-option label="已完成" value="completed" />
            </el-select>
            <el-select v-model="demandFilters.urgency" placeholder="紧急程度" clearable style="width: 120px;">
              <el-option label="紧急" value="urgent" />
              <el-option label="普通" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
            <el-button type="primary" @click="loadDemands" :icon="Search">查询</el-button>
          </div>

          <el-table :data="demands" v-loading="loading" size="small">
            <el-table-column prop="demand_no" label="需求编号" width="180" />
            <el-table-column prop="item_name" label="物资名称" width="140" />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column label="数量" width="180">
              <template #default="{ row }">
                <span>{{ row.quantity }} {{ row.unit }}</span>
                <span v-if="row.allocated_quantity > 0" style="color: #67c23a; margin-left: 8px;">
                  已调{{ row.allocated_quantity }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="缺口" width="100">
              <template #default="{ row }">
                <span class="risk-high" v-if="row.quantity - (row.allocated_quantity || 0) > 0">
                  {{ row.quantity - (row.allocated_quantity || 0) }} {{ row.unit }}
                </span>
                <span v-else style="color: #67c23a;">已满足</span>
              </template>
            </el-table-column>
            <el-table-column prop="demand_location" label="需求地点" width="140" />
            <el-table-column prop="requester_unit" label="申请单位" width="140" />
            <el-table-column prop="urgency" label="紧急度" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.urgency === 'urgent'" type="danger" size="small">紧急</el-tag>
                <el-tag v-else size="small">{{ row.urgency === 'normal' ? '普通' : '低' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getDemandStatus(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="createAllocation(row)">调拨</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 16px; justify-content: flex-end;"
            v-model:current-page="demandPagination.page"
            v-model:page-size="demandPagination.pageSize"
            :total="demandPagination.total"
            layout="total, prev, pager, next"
            @current-change="loadDemands" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="物资库存" name="items">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">物资库存</h2>
            <el-button type="primary" @click="showItemDialog = true" :icon="Plus">
              新增物资
            </el-button>
          </div>
          <el-table :data="items" v-loading="loading" size="small">
            <el-table-column prop="item_code" label="物资编码" width="140" />
            <el-table-column prop="item_name" label="物资名称" width="160" />
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column label="库存数量" width="120">
              <template #default="{ row }">
                <span :class="row.total_stock < 10 ? 'risk-high' : ''">
                  {{ row.total_stock }} {{ row.unit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="unit_price" label="单价" width="100">
              <template #default="{ row }">¥{{ row.unit_price || '--' }}</template>
            </el-table-column>
            <el-table-column prop="specifications" label="规格" min-width="140" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editItem(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="物资调拨" name="allocations">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">物资调拨</h2>
          </div>
          <div class="filter-bar">
            <el-select v-model="allocationFilters.status" placeholder="状态" clearable style="width: 120px;">
              <el-option label="已出库" value="dispatched" />
              <el-option label="运输中" value="transit" />
              <el-option label="已送达" value="delivered" />
              <el-option label="已签收" value="signed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button type="primary" @click="loadAllocations" :icon="Search">查询</el-button>
          </div>
          <el-table :data="allocations" v-loading="loading" size="small">
            <el-table-column prop="allocation_no" label="调拨编号" width="180" />
            <el-table-column prop="item_name" label="物资名称" width="140" />
            <el-table-column label="数量" width="100">
              <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
            </el-table-column>
            <el-table-column prop="from_location" label="发出地" width="120" />
            <el-table-column prop="to_location" label="目的地" width="120" />
            <el-table-column prop="transporter" label="运输方" width="120" />
            <el-table-column prop="dispatch_time" label="出库时间" width="160">
              <template #default="{ row }">{{ formatTime(row.dispatch_time) }}</template>
            </el-table-column>
            <el-table-column prop="signoff_time" label="签收时间" width="160">
              <template #default="{ row }">{{ row.signoff_time ? formatTime(row.signoff_time) : '--' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getAllocationStatus(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status !== 'signed' && row.status !== 'cancelled'"
                  link type="primary" size="small"
                  @click="signAllocation(row)">签收</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            style="margin-top: 16px; justify-content: flex-end;"
            v-model:current-page="allocationPagination.page"
            v-model:page-size="allocationPagination.pageSize"
            :total="allocationPagination.total"
            layout="total, prev, pager, next"
            @current-change="loadAllocations" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="物资缺口" name="gaps">
        <div class="page-container">
          <h3 class="section-title">物资缺口清单</h3>
          <el-table :data="gaps" v-loading="loading" size="small">
            <el-table-column prop="item_name" label="物资名称" width="140" />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="quantity" label="需求量" width="100" />
            <el-table-column prop="allocated" label="已分配" width="100" />
            <el-table-column prop="gap_quantity" label="缺口量" width="100">
              <template #default="{ row }">
                <span class="risk-high">{{ row.gap_quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="total_stock" label="当前库存" width="100" />
            <el-table-column prop="demand_location" label="需求地点" width="140" />
            <el-table-column prop="urgency" label="紧急度" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.urgency === 'urgent'" type="danger" size="small">紧急</el-tag>
                <el-tag v-else size="small">{{ row.urgency === 'normal' ? '普通' : '低' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="createAllocation(row)">立即调拨</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!gaps || gaps.length === 0" description="暂无物资缺口" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showDemandDialog" title="新增物资需求" width="500px">
      <el-form :model="demandForm" label-width="100px">
        <el-form-item label="物资" required>
          <el-select v-model="demandForm.item_id" style="width: 100%;">
            <el-option
              v-for="item in items"
              :key="item.id"
              :label="`${item.item_name} (库存: ${item.total_stock}${item.unit})`"
              :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求数量" required>
          <el-input-number v-model="demandForm.quantity" :min="0" :step="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="紧急度">
          <el-select v-model="demandForm.urgency" style="width: 100%;">
            <el-option label="紧急" value="urgent" />
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求地点">
          <el-input v-model="demandForm.demand_location" />
        </el-form-item>
        <el-form-item label="申请单位">
          <el-input v-model="demandForm.requester_unit" />
        </el-form-item>
        <el-form-item label="需求说明">
          <el-input v-model="demandForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDemandDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDemand">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showItemDialog" title="新增物资" width="500px">
      <el-form :model="itemForm" label-width="100px">
        <el-form-item label="物资编码" required>
          <el-input v-model="itemForm.item_code" placeholder="如：W001" />
        </el-form-item>
        <el-form-item label="物资名称" required>
          <el-input v-model="itemForm.item_name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="itemForm.category" style="width: 100%;">
            <el-option label="食品水饮" value="food" />
            <el-option label="医疗用品" value="medical" />
            <el-option label="帐篷衣物" value="shelter" />
            <el-option label="救援设备" value="equipment" />
            <el-option label="通讯设备" value="communication" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="itemForm.unit" placeholder="如：箱、件、吨" />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number v-model="itemForm.total_stock" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number v-model="itemForm.unit_price" :min="0" :step="0.01" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="itemForm.specifications" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showItemDialog = false">取消</el-button>
        <el-button type="primary" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAllocationDialog" title="物资调拨" width="500px">
      <el-form :model="allocationForm" label-width="100px" v-if="currentDemand">
        <el-form-item label="物资">
          <span>{{ currentDemand.item_name }}</span>
        </el-form-item>
        <el-form-item label="需求数量">
          <span>{{ currentDemand.quantity }} {{ currentDemand.unit }}</span>
        </el-form-item>
        <el-form-item label="已分配">
          <span>{{ currentDemand.allocated_quantity || 0 }} {{ currentDemand.unit }}</span>
        </el-form-item>
        <el-form-item label="调拨数量" required>
          <el-input-number
            v-model="allocationForm.quantity"
            :min="1"
            :max="(currentDemand.quantity || 0) - (currentDemand.allocated_quantity || 0)"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item label="发出地">
          <el-input v-model="allocationForm.from_location" placeholder="如：中央仓库" />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="allocationForm.to_location" :placeholder="currentDemand.demand_location || '如：映秀镇'" />
        </el-form-item>
        <el-form-item label="运输方">
          <el-input v-model="allocationForm.transporter" placeholder="如：应急物流车队" />
        </el-form-item>
        <el-form-item label="预计到达">
          <el-date-picker
            v-model="allocationForm.estimated_arrival"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAllocationDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAllocation">确认调拨</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSignDialog" title="物资签收" width="400px">
      <el-form :model="signForm" label-width="100px" v-if="currentAllocation">
        <el-form-item label="调拨编号">
          <span>{{ currentAllocation.allocation_no }}</span>
        </el-form-item>
        <el-form-item label="物资">
          <span>{{ currentAllocation.item_name }} {{ currentAllocation.quantity }}{{ currentAllocation.unit }}</span>
        </el-form-item>
        <el-form-item label="签收人" required>
          <el-input v-model="signForm.receiver" />
        </el-form-item>
        <el-form-item label="签收时间">
          <el-date-picker
            v-model="signForm.signoff_time"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item label="实际到达">
          <el-date-picker
            v-model="signForm.actual_arrival"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSignDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSign">确认签收</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { api } from '@/api'

const activeTab = ref('demands')
const loading = ref(false)
const demands = ref([])
const items = ref([])
const allocations = ref([])
const gaps = ref([])

const showDemandDialog = ref(false)
const showItemDialog = ref(false)
const showAllocationDialog = ref(false)
const showSignDialog = ref(false)
const currentDemand = ref(null)
const currentAllocation = ref(null)

const demandFilters = reactive({ status: '', urgency: '' })
const demandPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const allocationFilters = reactive({ status: '' })
const allocationPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const demandForm = reactive({
  item_id: null,
  quantity: 0,
  urgency: 'normal',
  demand_location: '',
  requester_unit: '',
  description: ''
})

const itemForm = reactive({
  item_code: '',
  item_name: '',
  category: 'other',
  unit: '',
  total_stock: 0,
  unit_price: null,
  specifications: ''
})

const allocationForm = reactive({
  demand_id: null,
  item_id: null,
  quantity: 0,
  from_location: '',
  to_location: '',
  transporter: '',
  estimated_arrival: ''
})

const signForm = reactive({
  status: 'signed',
  receiver: '',
  signoff_time: new Date(),
  actual_arrival: new Date()
})

const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '--'
const getDemandStatus = (s) => ({ pending: '待分配', partial: '部分分配', allocated: '已分配', completed: '已完成' }[s] || s)
const getAllocationStatus = (s) => ({ dispatched: '已出库', transit: '运输中', delivered: '已送达', signed: '已签收', cancelled: '已取消' }[s] || s)

const loadDemands = async () => {
  loading.value = true
  try {
    const res = await api.materials.demands({
      page: demandPagination.page,
      pageSize: demandPagination.pageSize,
      ...demandFilters
    })
    demands.value = res.list
    demandPagination.total = res.total
  } catch (err) {
    console.error('加载需求失败:', err)
  } finally {
    loading.value = false
  }
}

const loadItems = async () => {
  try {
    items.value = await api.materials.items()
  } catch (err) {
    console.error('加载物资失败:', err)
  }
}

const loadAllocations = async () => {
  loading.value = true
  try {
    const res = await api.materials.allocations({
      page: allocationPagination.page,
      pageSize: allocationPagination.pageSize,
      ...allocationFilters
    })
    allocations.value = res.list
    allocationPagination.total = res.total
  } catch (err) {
    console.error('加载调拨失败:', err)
  } finally {
    loading.value = false
  }
}

const loadGaps = async () => {
  try {
    gaps.value = await api.materials.gaps()
  } catch (err) {
    console.error('加载缺口失败:', err)
  }
}

const resetDemandForm = () => {
  demandForm.item_id = null
  demandForm.quantity = 0
  demandForm.urgency = 'normal'
  demandForm.demand_location = ''
  demandForm.requester_unit = ''
  demandForm.description = ''
}

const submitDemand = async () => {
  if (!demandForm.item_id || !demandForm.quantity || !demandForm.quantity > 0) {
    ElMessage.warning('请选择物资并填写需求数量')
    return
  }
  try {
    await api.materials.createDemand(demandForm)
    ElMessage.success('需求提交成功，已生成待分配记录')
    showDemandDialog.value = false
    resetDemandForm()
    loadDemands()
    loadGaps()
  } catch (err) {
    console.error('提交失败:', err)
    ElMessage.error(err.message || '需求提交失败，请检查网络或稍后重试')
  }
}

const submitItem = async () => {
  try {
    await api.materials.createItem(itemForm)
    ElMessage.success('物资创建成功')
    showItemDialog.value = false
    loadItems()
  } catch (err) {
    console.error('创建失败:', err)
  }
}

const editItem = (row) => {
  Object.assign(itemForm, row)
  showItemDialog.value = true
}

const createAllocation = (row) => {
  currentDemand.value = row
  allocationForm.demand_id = row.id
  allocationForm.item_id = row.item_id
  allocationForm.quantity = Math.min(row.quantity - (row.allocated_quantity || 0), row.total_stock || row.quantity)
  allocationForm.to_location = row.demand_location || ''
  showAllocationDialog.value = true
}

const submitAllocation = async () => {
  if (!allocationForm.quantity || allocationForm.quantity <= 0) {
    ElMessage.warning('请填写调拨数量')
    return
  }
  try {
    await api.materials.createAllocation(allocationForm)
    ElMessage.success('调拨成功，已扣减库存并生成派送记录')
    showAllocationDialog.value = false
    loadDemands()
    loadAllocations()
    loadItems()
    loadGaps()
  } catch (err) {
    console.error('调拨失败:', err)
    ElMessage.error(err.message || '调拨失败，库存可能不足')
  }
}

const signAllocation = (row) => {
  currentAllocation.value = row
  signForm.receiver = ''
  signForm.signoff_time = new Date()
  signForm.actual_arrival = new Date()
  showSignDialog.value = true
}

const submitSign = async () => {
  if (!signForm.receiver) {
    ElMessage.warning('请填写签收人')
    return
  }
  try {
    await api.materials.updateAllocation(currentAllocation.value.id, signForm)
    ElMessage.success('签收成功，已更新需求状态')
    showSignDialog.value = false
    loadAllocations()
    loadDemands()
    loadGaps()
  } catch (err) {
    console.error('签收失败:', err)
    ElMessage.error(err.message || '签收失败，请重试')
  }
}

watch(activeTab, (val) => {
  if (val === 'demands') loadDemands()
  if (val === 'items') loadItems()
  if (val === 'allocations') loadAllocations()
  if (val === 'gaps') loadGaps()
})

onMounted(() => {
  loadDemands()
  loadItems()
  loadAllocations()
  loadGaps()
})
</script>
