<template>
  <div class="settlements">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="酒店确认" name="confirmations">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>酒店确认单</span>
              <el-button type="primary" size="small" @click="openConfirmationDialog">
                <el-icon><Plus /></el-icon>
                新建确认
              </el-button>
            </div>
          </template>
          <el-table :data="confirmations" v-loading="confirmationLoading">
            <el-table-column prop="team_name" label="团队" />
            <el-table-column prop="hotel_name" label="酒店" />
            <el-table-column prop="confirmed_rooms" label="确认房数" width="100" align="center" />
            <el-table-column prop="actual_checkin" label="实际入住" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.actual_checkin }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="cancelled" label="取消" width="80" align="center" />
            <el-table-column prop="no_show" label="No-show" width="90" align="center" />
            <el-table-column prop="price_diff" label="差价" width="100">
              <template #default="{ row }">
                <span :style="{ color: row.price_diff > 0 ? '#f56c6c' : '#67c23a' }">
                  {{ row.price_diff > 0 ? '+' : '' }}{{ row.price_diff }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="invoice_status" label="发票" width="100">
              <template #default="{ row }">
                <el-tag :type="getInvoiceStatusType(row.invoice_status)" size="small">
                  {{ getInvoiceStatusText(row.invoice_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="editConfirmation(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="结算管理" name="settlements">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>结算单</span>
              <el-button type="primary" size="small" @click="openSettlementDialog">
                <el-icon><Plus /></el-icon>
                新建结算
              </el-button>
            </div>
          </template>
          <el-table :data="settlements" v-loading="settlementLoading">
            <el-table-column prop="team_name" label="团队" />
            <el-table-column prop="hotel_name" label="酒店" />
            <el-table-column prop="total_amount" label="应收金额" width="120">
              <template #default="{ row }">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="actual_amount" label="实际金额" width="120">
              <template #default="{ row }">¥{{ row.actual_amount || '-' }}</template>
            </el-table-column>
            <el-table-column prop="paid_amount" label="已付金额" width="120">
              <template #default="{ row }">¥{{ row.paid_amount }}</template>
            </el-table-column>
            <el-table-column prop="invoice_amount" label="已开发票" width="120">
              <template #default="{ row }">¥{{ row.invoice_amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getSettlementStatusType(row.status)" size="small">
                  {{ getSettlementStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="editSettlement(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="confirmationDialogVisible" :title="isEditingConfirmation ? '编辑确认单' : '新建确认单'" width="600px">
      <el-form :model="confirmationForm" label-width="100px">
        <el-form-item label="团队">
          <el-select v-model="confirmationForm.team_id" placeholder="请选择团队">
            <el-option v-for="team in teams" :key="team.id" :label="team.name" :value="team.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="酒店">
          <el-select v-model="confirmationForm.hotel_id" placeholder="请选择酒店">
            <el-option v-for="hotel in hotels" :key="hotel.id" :label="hotel.name" :value="hotel.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="确认房数">
          <el-input-number v-model="confirmationForm.confirmed_rooms" :min="0" />
        </el-form-item>
        <el-form-item label="实际入住">
          <el-input-number v-model="confirmationForm.actual_checkin" :min="0" />
        </el-form-item>
        <el-form-item label="取消房数">
          <el-input-number v-model="confirmationForm.cancelled" :min="0" />
        </el-form-item>
        <el-form-item label="No-show">
          <el-input-number v-model="confirmationForm.no_show" :min="0" />
        </el-form-item>
        <el-form-item label="差价">
          <el-input-number v-model="confirmationForm.price_diff" :precision="2" />
        </el-form-item>
        <el-form-item label="发票状态">
          <el-select v-model="confirmationForm.invoice_status">
            <el-option label="未开" value="pending" />
            <el-option label="部分" value="partial" />
            <el-option label="已开" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="confirmationForm.status">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已拒单" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="confirmationForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfirmation">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="settlementDialogVisible" :title="isEditingSettlement ? '编辑结算单' : '新建结算单'" width="600px">
      <el-form :model="settlementForm" label-width="100px">
        <el-form-item label="团队">
          <el-select v-model="settlementForm.team_id" placeholder="请选择团队">
            <el-option v-for="team in teams" :key="team.id" :label="team.name" :value="team.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="酒店">
          <el-select v-model="settlementForm.hotel_id" placeholder="请选择酒店">
            <el-option v-for="hotel in hotels" :key="hotel.id" :label="hotel.name" :value="hotel.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="应收金额">
          <el-input-number v-model="settlementForm.total_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="实际金额">
          <el-input-number v-model="settlementForm.actual_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="已付金额">
          <el-input-number v-model="settlementForm.paid_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="已开发票">
          <el-input-number v-model="settlementForm.invoice_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="settlementForm.status">
            <el-option label="待结算" value="pending" />
            <el-option label="部分结算" value="partial" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="settlementForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settlementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettlement">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { settlementApi, teamApi, hotelApi } from '@/api'

const activeTab = ref('confirmations')
const confirmationLoading = ref(false)
const settlementLoading = ref(false)
const confirmations = ref([])
const settlements = ref([])
const teams = ref([])
const hotels = ref([])
const confirmationDialogVisible = ref(false)
const settlementDialogVisible = ref(false)
const isEditingConfirmation = ref(false)
const isEditingSettlement = ref(false)

const confirmationForm = ref({
  team_id: '',
  hotel_id: '',
  confirmed_rooms: 0,
  actual_checkin: 0,
  cancelled: 0,
  no_show: 0,
  price_diff: 0,
  invoice_status: 'pending',
  status: 'pending',
  remark: ''
})

const settlementForm = ref({
  team_id: '',
  hotel_id: '',
  total_amount: 0,
  actual_amount: 0,
  paid_amount: 0,
  invoice_amount: 0,
  status: 'pending',
  remark: ''
})

const getInvoiceStatusType = (status) => {
  const types = { pending: 'info', partial: 'warning', completed: 'success' }
  return types[status] || 'info'
}

const getInvoiceStatusText = (status) => {
  const texts = { pending: '未开', partial: '部分', completed: '已开' }
  return texts[status] || status
}

const getStatusType = (status) => {
  const types = { pending: 'warning', confirmed: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待确认', confirmed: '已确认', rejected: '已拒单' }
  return texts[status] || status
}

const getSettlementStatusType = (status) => {
  const types = { pending: 'warning', partial: 'info', completed: 'success' }
  return types[status] || 'info'
}

const getSettlementStatusText = (status) => {
  const texts = { pending: '待结算', partial: '部分结算', completed: '已完成' }
  return texts[status] || status
}

const loadConfirmations = async () => {
  confirmationLoading.value = true
  try {
    const res = await settlementApi.getConfirmations()
    if (res.success) {
      confirmations.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    confirmationLoading.value = false
  }
}

const loadSettlements = async () => {
  settlementLoading.value = true
  try {
    const res = await settlementApi.getAll()
    if (res.success) {
      settlements.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    settlementLoading.value = false
  }
}

const loadTeams = async () => {
  try {
    const res = await teamApi.getAll()
    if (res.success) {
      teams.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const loadHotels = async () => {
  try {
    const res = await hotelApi.getAll()
    if (res.success) {
      hotels.value = res.data
    }
  } catch (error) {
    console.error(error)
  }
}

const openConfirmationDialog = (row = null) => {
  isEditingConfirmation.value = !!row
  if (row) {
    confirmationForm.value = { ...row }
  } else {
    confirmationForm.value = {
      team_id: '',
      hotel_id: '',
      confirmed_rooms: 0,
      actual_checkin: 0,
      cancelled: 0,
      no_show: 0,
      price_diff: 0,
      invoice_status: 'pending',
      status: 'pending',
      remark: ''
    }
  }
  confirmationDialogVisible.value = true
}

const editConfirmation = (row) => {
  openConfirmationDialog(row)
}

const saveConfirmation = async () => {
  try {
    if (isEditingConfirmation.value) {
      await settlementApi.updateConfirmation(confirmationForm.value.id, confirmationForm.value)
      ElMessage.success('更新成功')
    } else {
      await settlementApi.createConfirmation(confirmationForm.value)
      ElMessage.success('创建成功')
    }
    confirmationDialogVisible.value = false
    loadConfirmations()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const openSettlementDialog = (row = null) => {
  isEditingSettlement.value = !!row
  if (row) {
    settlementForm.value = { ...row }
  } else {
    settlementForm.value = {
      team_id: '',
      hotel_id: '',
      total_amount: 0,
      actual_amount: 0,
      paid_amount: 0,
      invoice_amount: 0,
      status: 'pending',
      remark: ''
    }
  }
  settlementDialogVisible.value = true
}

const editSettlement = (row) => {
  openSettlementDialog(row)
}

const saveSettlement = async () => {
  try {
    if (isEditingSettlement.value) {
      await settlementApi.update(settlementForm.value.id, settlementForm.value)
      ElMessage.success('更新成功')
    } else {
      await settlementApi.create(settlementForm.value)
      ElMessage.success('创建成功')
    }
    settlementDialogVisible.value = false
    loadSettlements()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadConfirmations()
  loadSettlements()
  loadTeams()
  loadHotels()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
