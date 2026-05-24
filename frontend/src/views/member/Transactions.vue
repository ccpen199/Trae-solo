<template>
  <div class="transactions">
    <el-card>
      <template #header>加油记录</template>
      <el-table :data="list" border>
        <el-table-column prop="end_time" label="时间" width="180" />
        <el-table-column prop="station_name" label="油站" />
        <el-table-column prop="nozzle_number" label="油枪" width="80" />
        <el-table-column prop="fuel_type_name" label="油品" width="100" />
        <el-table-column prop="volume" label="升数(L)" width="100" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template #default="{row}">¥{{ row.unit_price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="优惠" width="150">
          <template #default="{row}">
            <div v-if="row.discount_amount || row.coupon_amount">
              <el-tag v-if="row.discount_amount" size="small" type="success">会员减¥{{ row.discount_amount.toFixed(2) }}</el-tag>
              <el-tag v-if="row.coupon_amount" size="small" type="warning">券减¥{{ row.coupon_amount.toFixed(2) }}</el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_amount" label="实付(元)" width="120">
          <template #default="{row}">¥{{ row.final_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="points_earned" label="积分" width="80" />
        <el-table-column label="发票" width="100">
          <template #default="{row}">
            <el-tag v-if="row.invoice_status === 'issued'" type="success">已开</el-tag>
            <el-tag v-else-if="row.invoice_status === 'pending'" type="warning">待开</el-tag>
            <el-button v-else type="primary" link size="small" @click="applyInvoice(row)">开发票</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        style="margin-top: 20px; text-align: right;"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        @current-change="load"
      />
    </el-card>
    <el-dialog v-model="invoiceVisible" title="申请发票" width="400px">
      <el-form :model="invoiceForm" label-width="80px">
        <el-form-item label="类型">
          <el-radio-group v-model="invoiceForm.invoice_type">
            <el-radio value="personal">个人</el-radio>
            <el-radio value="company">企业</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="抬头">
          <el-input v-model="invoiceForm.invoice_title" />
        </el-form-item>
        <el-form-item v-if="invoiceForm.invoice_type === 'company'" label="税号">
          <el-input v-model="invoiceForm.tax_number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="invoiceVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { member } from '../../api'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const invoiceVisible = ref(false)
const invoiceForm = ref({ transaction_id: null, invoice_type: 'personal', invoice_title: '', tax_number: '' })

const load = async () => {
  const res = await member.getTransactions({ page: page.value, pageSize: pageSize.value })
  list.value = res.list
  total.value = res.total
}
onMounted(load)

const applyInvoice = (row) => {
  invoiceForm.value.transaction_id = row.id
  invoiceForm.value.invoice_title = ''
  invoiceForm.value.tax_number = ''
  invoiceVisible.value = true
}

const submitInvoice = async () => {
  try {
    await member.applyInvoice(invoiceForm.value)
    ElMessage.success('发票申请已提交')
    invoiceVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.error || '提交失败')
  }
}
</script>
