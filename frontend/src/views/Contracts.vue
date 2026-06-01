<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">合同管理</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增合同
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已生效" value="active" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadContracts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="contractList" border style="width: 100%">
      <el-table-column prop="contract_number" label="合同编号" width="140" />
      <el-table-column prop="company_name" label="客户企业" width="140" />
      <el-table-column label="签约房源" min-width="150">
        <template #default="{ row }">
          <span v-if="row.rooms">
            {{ row.rooms.map(r => `${r.building_name}-${r.room_number}`).join(', ') }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="start_date" label="起租日期" width="110" />
      <el-table-column prop="end_date" label="到期日期" width="110" />
      <el-table-column prop="rent_amount" label="月租金" width="100">
        <template #default="{ row }">{{ row.rent_amount }}元</template>
      </el-table-column>
      <el-table-column prop="deposit_amount" label="保证金" width="100">
        <template #default="{ row }">{{ row.deposit_amount }}元</template>
      </el-table-column>
      <el-table-column prop="free_rent_days" label="免租期" width="80">
        <template #default="{ row }">{{ row.free_rent_days }}天</template>
      </el-table-column>
      <el-table-column prop="approval_status" label="审批状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.approval_status === 'approved' ? 'success' : 'warning'" size="small">
            {{ row.approval_status === 'approved' ? '已审批' : '待审批' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="合同状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : row.status === 'pending' ? 'warning' : 'info'" size="small">
            {{ row.status === 'active' ? '已生效' : row.status === 'pending' ? '待签约' : row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" v-if="row.approval_status !== 'approved'" @click="approveContract(row)">审批</el-button>
            <el-button size="small" type="success" v-if="row.approval_status === 'approved' && row.status !== 'active'" @click="openSignDialog(row)">签约</el-button>
            <el-button size="small" type="warning" v-if="row.status === 'active'" @click="openCheckinDialog(row)">入驻</el-button>
            <el-button size="small" type="danger" v-if="row.status !== 'active'" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="新增合同" width="700px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="客户线索" required>
          <el-select v-model="form.lead_id" placeholder="请选择客户" style="width: 100%" filterable>
            <el-option v-for="l in leadList" :key="l.id" :label="l.company_name" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联报价">
          <el-select v-model="form.quote_id" placeholder="选择已锁定报价" style="width: 100%" clearable>
            <el-option v-for="q in quoteList" :key="q.id" :label="`V${q.version} - ${q.final_price}元`" :value="q.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="签约房源" required>
          <el-select v-model="selectedRooms" multiple placeholder="请选择房源" style="width: 100%" filterable @change="checkConflict">
            <el-option v-for="r in roomList" :key="r.id" :label="`${r.building_name}-${r.floor_number}层-${r.room_number}(${r.area}㎡)`" :value="r.id" />
          </el-select>
          <div v-if="conflictWarning" style="color: #f56c6c; font-size: 12px; margin-top: 4px">
            ⚠️ 房源存在冲突，请重新选择
          </div>
        </el-form-item>
        <el-form-item label="租赁期限" required>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item label="月租金" required>
          <el-input-number v-model="form.rent_amount" :min="0" />
          <span style="margin-left: 8px">元</span>
        </el-form-item>
        <el-form-item label="付款周期">
          <el-select v-model="form.rent_payment_cycle" style="width: 150px">
            <el-option label="月付" value="month" />
            <el-option label="季付" value="quarter" />
            <el-option label="半年付" value="half_year" />
            <el-option label="年付" value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="保证金">
          <el-input-number v-model="form.deposit_amount" :min="0" />
          <span style="margin-left: 8px">元</span>
        </el-form-item>
        <el-form-item label="免租期">
          <el-input-number v-model="form.free_rent_days" :min="0" />
          <span style="margin-left: 8px">天</span>
        </el-form-item>
        <el-form-item label="物业费">
          <el-input-number v-model="form.property_fee" :min="0" />
          <span style="margin-left: 8px">元/月</span>
        </el-form-item>
        <el-form-item label="交付事项">
          <el-input v-model="form.delivery_items" type="textarea" :rows="2" placeholder="如：装修、家具、网络等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="signDialogVisible" title="合同签约" width="500px">
      <el-form :model="signForm" label-width="100px">
        <el-form-item label="客户签约人">
          <el-input v-model="signForm.signed_by_tenant" />
        </el-form-item>
        <el-form-item label="园区签约人">
          <el-input v-model="signForm.signed_by_park" />
        </el-form-item>
        <el-form-item label="签约日期">
          <el-date-picker v-model="signForm.sign_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSign">确认签约</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkinDialogVisible" title="办理入驻" width="500px">
      <el-form :model="checkinForm" label-width="100px">
        <el-form-item label="选择房源" required>
          <el-select v-model="checkinForm.room_id" placeholder="请选择房源" style="width: 100%">
            <el-option v-for="r in currentContractRooms" :key="r.id" :label="`${r.building_name}-${r.room_number}`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="企业名称">
          <el-input v-model="checkinForm.company_name" />
        </el-form-item>
        <el-form-item label="约定入驻日期">
          <el-date-picker v-model="checkinForm.check_in_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="实际入驻日期">
          <el-date-picker v-model="checkinForm.actual_check_in_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="交接状态">
          <el-select v-model="checkinForm.handover_status" style="width: 100%">
            <el-option label="待交接" value="pending" />
            <el-option label="已交接" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkinForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkinDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCheckin">确认入驻</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contracts as contractsApi, leads as leadsApi, quotes as quotesApi, rooms as roomsApi } from '@/api'

const contractList = ref([])
const leadList = ref([])
const quoteList = ref([])
const roomList = ref([])
const dialogVisible = ref(false)
const signDialogVisible = ref(false)
const checkinDialogVisible = ref(false)
const currentContractId = ref(null)
const currentContractRooms = ref([])
const selectedRooms = ref([])
const dateRange = ref([])
const conflictWarning = ref(false)

const searchForm = reactive({
  status: ''
})

const form = reactive({
  lead_id: null,
  quote_id: null,
  rent_amount: 0,
  rent_payment_cycle: 'month',
  deposit_amount: 0,
  deposit_type: 'two_month',
  free_rent_days: 0,
  property_fee: 0,
  property_fee_cycle: 'month',
  delivery_items: ''
})

const signForm = reactive({
  signed_by_tenant: '',
  signed_by_park: '',
  sign_date: ''
})

const checkinForm = reactive({
  room_id: null,
  company_name: '',
  check_in_date: '',
  actual_check_in_date: '',
  handover_status: 'completed',
  remarks: ''
})

async function loadContracts() {
  const params = { status: searchForm.status || undefined }
  const data = await contractsApi.list(params)
  contractList.value = data
}

async function loadLeads() {
  const data = await leadsApi.list()
  leadList.value = data
}

async function loadQuotes() {
  const data = await quotesApi.list()
  quoteList.value = data.filter(q => q.is_locked)
}

async function loadRooms() {
  const data = await roomsApi.list()
  roomList.value = data.filter(r => r.status !== 'rented')
}

function resetSearch() {
  searchForm.status = ''
  loadContracts()
}

async function checkConflict() {
  if (selectedRooms.value.length > 0) {
    const result = await contractsApi.checkConflict({ room_ids: selectedRooms.value })
    conflictWarning.value = result.hasConflict
  } else {
    conflictWarning.value = false
  }
}

function openDialog() {
  Object.assign(form, { lead_id: null, quote_id: null, rent_amount: 0, rent_payment_cycle: 'month', deposit_amount: 0, deposit_type: 'two_month', free_rent_days: 0, property_fee: 0, property_fee_cycle: 'month', delivery_items: '' })
  selectedRooms.value = []
  dateRange.value = []
  conflictWarning.value = false
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.lead_id || selectedRooms.value.length === 0 || dateRange.value.length !== 2) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (conflictWarning.value) {
    ElMessage.error('房源存在冲突，请重新选择')
    return
  }
  const data = {
    ...form,
    room_ids: selectedRooms.value,
    start_date: dateRange.value[0],
    end_date: dateRange.value[1]
  }
  await contractsApi.create(data)
  ElMessage.success('创建成功')
  dialogVisible.value = false
  loadContracts()
  loadRooms()
}

async function approveContract(row) {
  try {
    await ElMessageBox.confirm('确定审批通过该合同吗？', '提示', { type: 'warning' })
    await contractsApi.approve(row.id)
    ElMessage.success('已审批')
    loadContracts()
  } catch {
  }
}

function openSignDialog(row) {
  currentContractId.value = row.id
  Object.assign(signForm, { signed_by_tenant: '', signed_by_park: '', sign_date: new Date().toISOString().split('T')[0] })
  signDialogVisible.value = true
}

async function confirmSign() {
  await contractsApi.sign(currentContractId.value, signForm)
  ElMessage.success('签约成功，房源已标记为已出租')
  signDialogVisible.value = false
  loadContracts()
  loadRooms()
}

function openCheckinDialog(row) {
  currentContractId.value = row.id
  currentContractRooms.value = row.rooms || []
  Object.assign(checkinForm, { room_id: null, company_name: row.company_name, check_in_date: row.start_date, actual_check_in_date: '', handover_status: 'completed', remarks: '' })
  checkinDialogVisible.value = true
}

async function confirmCheckin() {
  if (!checkinForm.room_id) {
    ElMessage.warning('请选择房源')
    return
  }
  await contractsApi.checkin(currentContractId.value, checkinForm)
  ElMessage.success('入驻办理成功')
  checkinDialogVisible.value = false
  loadContracts()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该合同吗？', '提示', { type: 'warning' })
    await contractsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadContracts()
  } catch {
  }
}

onMounted(() => {
  loadContracts()
  loadLeads()
  loadQuotes()
  loadRooms()
})
</script>
