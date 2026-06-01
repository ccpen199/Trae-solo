<template>
  <div class="bills">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账单管理</span>
          <div class="header-actions">
            <el-select v-model="filter.billing_period" placeholder="选择账期" clearable style="width: 150px; margin-right: 10px;">
              <el-option v-for="p in periods" :key="p" :label="p" :value="p" />
            </el-select>
            <el-button type="primary" @click="showGenerateDialog">
              <el-icon><Plus /></el-icon>
              生成账单
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="bills" border stripe>
        <el-table-column prop="bill_no" label="账单编号" width="200" />
        <el-table-column prop="enterprise_name" label="企业名称" width="180" />
        <el-table-column prop="billing_period" label="账期" width="100" />
        <el-table-column label="能源类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ energyTypeMap[row.energy_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_usage" label="总用量" width="120">
          <template #default="{ row }">
            {{ row.total_usage?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="subtotal" label="不含税金额" width="120">
          <template #default="{ row }">
            ¥{{ row.subtotal?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税额" width="100">
          <template #default="{ row }">
            ¥{{ row.tax_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="应收金额" width="120">
          <template #default="{ row }">
            <strong style="color: #f56c6c;">¥{{ row.total_amount?.toFixed(2) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="企业确认" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.enterprise_confirm_status === 'confirmed'" type="success">已确认</el-tag>
            <el-tag v-else type="warning">待确认</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收款状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.payment_status === 'paid'" type="success">已收款</el-tag>
            <el-tag v-else type="info">未收款</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">
              详情
            </el-button>
            <el-button type="success" link size="small" @click="handleConfirm(row)" :disabled="row.enterprise_confirm_status === 'confirmed'">
              确认
            </el-button>
            <el-button type="warning" link size="small" @click="handlePay(row)" :disabled="row.payment_status === 'paid'">
              收款
            </el-button>
            <el-button type="info" link size="small" @click="handleRecalculate(row)">
              重算
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="generateVisible" title="批量生成账单" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="账期" required>
          <el-date-picker
            v-model="generateForm.billing_period"
            type="month"
            value-format="YYYYMM"
            placeholder="选择账期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="企业">
          <el-select v-model="generateForm.enterprise_id" placeholder="全部企业" style="width: 100%;" clearable>
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="能源类型">
          <el-select v-model="generateForm.energy_type" placeholder="全部类型" style="width: 100%;" clearable>
            <el-option label="电" value="electricity" />
            <el-option label="水" value="water" />
            <el-option label="气" value="gas" />
            <el-option label="空调" value="cooling" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate">生成账单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="账单详情" width="800px">
      <div v-if="billDetail" class="bill-detail">
        <div class="bill-header">
          <div class="bill-title">
            <h2>能源消费账单</h2>
            <p>账单编号: {{ billDetail.bill_no }}</p>
          </div>
          <div class="bill-status">
            <el-tag :type="billDetail.payment_status === 'paid' ? 'success' : 'warning'" size="large">
              {{ billDetail.payment_status === 'paid' ? '已收款' : '待收款' }}
            </el-tag>
          </div>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称">{{ billDetail.enterprise_name }}</el-descriptions-item>
          <el-descriptions-item label="账期">{{ billDetail.billing_period }}</el-descriptions-item>
          <el-descriptions-item label="能源类型">{{ energyTypeMap[billDetail.energy_type] }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ billDetail.contact_person }} / {{ billDetail.contact_phone }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin: 20px 0 10px;">账单明细</h4>
        <el-table :data="billDetail.items" border size="small">
          <el-table-column prop="item_type" label="类型" width="100">
            <template #default="{ row }">
              {{ row.item_type === 'direct' ? '直抄' : '分摊' }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" />
          <el-table-column prop="usage" label="用量" width="120">
            <template #default="{ row }">{{ row.usage?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价" width="100">
            <template #default="{ row }">¥{{ row.unit_price?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <div class="bill-summary">
          <div class="summary-row">
            <span>直抄用量:</span>
            <span>{{ billDetail.direct_usage?.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>分摊用量:</span>
            <span>{{ billDetail.allocated_usage?.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>总用量:</span>
            <span><strong>{{ billDetail.total_usage?.toFixed(2) }}</strong></span>
          </div>
          <div class="summary-row">
            <span>不含税金额:</span>
            <span>¥{{ billDetail.subtotal?.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>税额:</span>
            <span>¥{{ billDetail.tax_amount?.toFixed(2) }}</span>
          </div>
          <div class="summary-row total">
            <span>应收金额:</span>
            <span class="total-amount">¥{{ billDetail.total_amount?.toFixed(2) }}</span>
          </div>
        </div>

        <h4 style="margin: 20px 0 10px;">操作日志</h4>
        <el-table :data="billDetail.logs" border size="small">
          <el-table-column prop="operation" label="操作" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.operation }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column prop="remark" label="备注" />
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">{{ row.created_at?.substring(0, 19) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBills, getBillDetail, generateBills, confirmBill, payBill, recalculateBill, getEnterprises, energyTypeMap } from '../api'

const bills = ref([])
const enterprises = ref([])
const filter = reactive({ billing_period: '' })
const generateVisible = ref(false)
const detailVisible = ref(false)
const billDetail = ref(null)
const periods = ref(['202401', '202402', '202403', '202404', '202405', '202406', '202407', '202408', '202409', '202410', '202411', '202412'])

const generateForm = ref({
  billing_period: '',
  enterprise_id: null,
  energy_type: ''
})

const loadBills = async () => {
  try {
    const params = {}
    if (filter.billing_period) params.billing_period = filter.billing_period
    const res = await getBills(params)
    bills.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const showGenerateDialog = () => {
  const now = new Date()
  generateForm.value = {
    billing_period: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`,
    enterprise_id: null,
    energy_type: ''
  }
  generateVisible.value = true
}

const handleGenerate = async () => {
  if (!generateForm.value.billing_period) {
    ElMessage.warning('请选择账期')
    return
  }
  try {
    const res = await generateBills(generateForm.value)
    ElMessage.success(`成功生成 ${res.data.generated} 张账单`)
    generateVisible.value = false
    loadBills()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '生成失败')
  }
}

const showDetail = async (row) => {
  try {
    const res = await getBillDetail(row.id)
    billDetail.value = res.data
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm('确认企业已确认该账单？', '提示', { type: 'info' })
    await confirmBill(row.id, { confirmed_by: '企业经办人' })
    ElMessage.success('已确认')
    loadBills()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handlePay = async (row) => {
  try {
    await ElMessageBox.confirm('确认已收到该账单款项？', '提示', { type: 'info' })
    await payBill(row.id, { payment_method: 'bank_transfer' })
    ElMessage.success('已收款')
    loadBills()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const handleRecalculate = async (row) => {
  try {
    await ElMessageBox.confirm('确定重新计算该账单？原有数据将被覆盖。', '提示', { type: 'warning' })
    await recalculateBill(row.id)
    ElMessage.success('重算成功')
    loadBills()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

watch(
  () => filter.billing_period,
  () => {
    loadBills()
  }
)

onMounted(async () => {
  await loadBills()
  const eRes = await getEnterprises({ status: 'active' })
  enterprises.value = eRes.data
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
.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.bill-title h2 {
  margin: 0 0 5px 0;
  color: #333;
}
.bill-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
.bill-summary {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 14px;
}
.summary-row.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #dcdfe6;
  font-size: 16px;
  font-weight: bold;
}
.total-amount {
  color: #f56c6c;
  font-size: 20px;
}
</style>
