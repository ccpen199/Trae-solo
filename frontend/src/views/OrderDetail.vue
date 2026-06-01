<template>
  <div>
    <h2 style="margin-bottom: 20px">
      订单详情
      <el-button link @click="$router.back()">返回</el-button>
    </h2>
    <el-card v-if="order.id">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>订单号: {{ order.order_no }}</span>
          <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
        </div>
      </template>
      
      <el-descriptions :column="3" border>
        <el-descriptions-item label="客户">{{ order.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="商户">{{ order.merchant_name }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ order.type === 'spot' ? '现货' : '预订' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ order.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="实际金额">¥{{ order.actual_amount }}</el-descriptions-item>
        <el-descriptions-item label="服务费">¥{{ order.service_fee }}</el-descriptions-item>
        <el-descriptions-item label="已付金额">¥{{ order.paid_amount }}</el-descriptions-item>
        <el-descriptions-item label="赊账金额">¥{{ order.credit_amount }}</el-descriptions-item>
        <el-descriptions-item label="退款金额">¥{{ order.refund_amount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ order.created_at }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ order.remark }}</el-descriptions-item>
      </el-descriptions>

      <h3 style="margin: 20px 0 10px">商品明细</h3>
      <el-table :data="order.items" border>
        <el-table-column prop="product_name" label="商品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="grade" label="等级" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="quoted_price" label="报价" />
        <el-table-column prop="negotiated_price" label="议价" />
        <el-table-column prop="booked_quantity" label="预订数量" />
        <el-table-column prop="weighed_quantity" label="称重数量" />
        <el-table-column prop="actual_amount" label="实付金额" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openWeighDialog(row)" v-if="!row.weighed_quantity">称重</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px">
        <el-button type="primary" @click="showSettleDialog = true">结算</el-button>
        <el-button @click="showInvoiceDialog = true">开票</el-button>
        <el-button type="danger" @click="showDisputeDialog = true">发起纠纷</el-button>
      </div>
    </el-card>

    <el-dialog v-model="showWeighDialog" title="称重录入" width="400px">
      <el-form label-width="80px">
        <el-form-item label="商品名称">{{ weighItem.product_name }}</el-form-item>
        <el-form-item label="预订数量">{{ weighItem.booked_quantity }} {{ weighItem.unit }}</el-form-item>
        <el-form-item label="单价">¥{{ weighItem.unit_price }}/{{ weighItem.unit }}</el-form-item>
        <el-form-item label="称重重量">
          <el-input-number v-model="weighWeight" :min="0" :precision="3" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWeighDialog = false">取消</el-button>
        <el-button type="primary" @click="submitWeigh">确认称重</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSettleDialog" title="订单结算" width="400px">
      <el-form label-width="80px">
        <el-form-item label="待结算">¥{{ order.actual_amount - order.paid_amount }}</el-form-item>
        <el-form-item label="结算金额">
          <el-input-number v-model="settleForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="settleForm.payment_method" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行转账" value="bank" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易号">
          <el-input v-model="settleForm.transaction_no" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettleDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSettle">确认结算</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showInvoiceDialog" title="开具发票" width="500px">
      <el-form label-width="100px">
        <el-form-item label="开票金额">
          <el-input-number v-model="invoiceForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发票类型">
          <el-select v-model="invoiceForm.type" style="width: 100%">
            <el-option label="增值税普通发票" value="normal" />
            <el-option label="增值税专用发票" value="special" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票抬头">
          <el-input v-model="invoiceForm.title" />
        </el-form-item>
        <el-form-item label="税号">
          <el-input v-model="invoiceForm.tax_no" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInvoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="submitInvoice">开具发票</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDisputeDialog" title="发起纠纷" width="500px">
      <el-form label-width="100px">
        <el-form-item label="纠纷类型">
          <el-select v-model="disputeForm.type" style="width: 100%">
            <el-option label="质量问题" value="quality" />
            <el-option label="重量差异" value="weight" />
            <el-option label="价格争议" value="price" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="disputeForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisputeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDispute">提交纠纷</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const order = ref({ items: [] })
const showWeighDialog = ref(false)
const showSettleDialog = ref(false)
const showInvoiceDialog = ref(false)
const showDisputeDialog = ref(false)
const weighItem = ref({})
const weighWeight = ref(0)
const settleForm = ref({ amount: 0, payment_method: 'cash', transaction_no: '' })
const invoiceForm = ref({ amount: 0, type: 'normal', title: '', tax_no: '' })
const disputeForm = ref({ type: 'quality', description: '' })

const getStatusType = (status) => {
  const map = { pending: 'warning', completed: 'success', partial: 'info' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待处理', completed: '已完成', partial: '部分付款' }
  return map[status] || status
}

const openWeighDialog = (row) => {
  weighItem.value = row
  weighWeight.value = row.booked_quantity || 0
  showWeighDialog.value = true
}

const submitWeigh = async () => {
  await axios.post(`/api/orders/${order.value.id}/weigh`, {
    item_id: weighItem.value.id,
    weight: weighWeight.value,
    operator: 'admin'
  })
  ElMessage.success('称重完成')
  showWeighDialog.value = false
  loadOrder()
}

const submitSettle = async () => {
  await axios.post(`/api/orders/${order.value.id}/settle`, {
    ...settleForm.value,
    operator: 'admin'
  })
  ElMessage.success('结算完成')
  showSettleDialog.value = false
  loadOrder()
}

const submitInvoice = async () => {
  await axios.post(`/api/orders/${order.value.id}/invoice`, invoiceForm.value)
  ElMessage.success('发票已开具')
  showInvoiceDialog.value = false
}

const submitDispute = async () => {
  await axios.post('/api/disputes', {
    order_id: order.value.id,
    ...disputeForm.value
  })
  ElMessage.success('纠纷已提交')
  showDisputeDialog.value = false
  router.push('/disputes')
}

const loadOrder = async () => {
  const res = await axios.get(`/api/orders/${route.params.id}`)
  order.value = res.data
  settleForm.value.amount = res.data.actual_amount - res.data.paid_amount
  invoiceForm.value.amount = res.data.actual_amount
}

onMounted(loadOrder)
</script>
