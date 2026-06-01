<template>
  <div>
    <h2 style="margin-bottom: 20px">纠纷处理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>纠纷列表</span>
          <el-button type="primary" @click="showCreateDialog = true">发起纠纷</el-button>
        </div>
      </template>
      <el-table :data="disputes" border>
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="type" label="纠纷类型">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="处理结果" show-overflow-tooltip />
        <el-table-column prop="responsible_party" label="责任方" />
        <el-table-column prop="refund_amount" label="退款金额" />
        <el-table-column prop="handler" label="处理人" />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="handleDispute(row)" v-if="row.status === 'pending'">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="发起纠纷" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="关联订单">
          <el-select v-model="createForm.order_id" style="width: 100%" placeholder="请选择订单">
            <el-option v-for="o in orders" :key="o.id" :label="o.order_no" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="纠纷类型">
          <el-select v-model="createForm.type" style="width: 100%">
            <el-option label="质量问题" value="quality" />
            <el-option label="重量差异" value="weight" />
            <el-option label="价格争议" value="price" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请详细描述问题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交纠纷</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDialog" title="处理纠纷" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="处理结果">
          <el-input v-model="form.result" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="责任方">
          <el-select v-model="form.responsible_party" style="width: 100%">
            <el-option label="商户" value="merchant" />
            <el-option label="客户" value="customer" />
            <el-option label="双方各半" value="both" />
            <el-option label="市场" value="market" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="form.refund_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="form.handler" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const disputes = ref([])
const orders = ref([])
const showDialog = ref(false)
const showCreateDialog = ref(false)
const currentDispute = ref(null)
const form = ref({ status: 'resolved', result: '', responsible_party: '', refund_amount: 0, handler: '' })
const createForm = ref({ order_id: '', type: 'quality', description: '' })

const getTypeText = (type) => {
  const map = { quality: '质量问题', weight: '重量差异', price: '价格争议', other: '其他' }
  return map[type] || type
}

const getStatusType = (status) => {
  const map = { pending: 'warning', resolved: 'success', rejected: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待处理', resolved: '已解决', rejected: '已驳回' }
  return map[status] || status
}

const handleDispute = (row) => {
  currentDispute.value = row
  form.value = { status: 'resolved', result: '', responsible_party: '', refund_amount: 0, handler: '' }
  showDialog.value = true
}

const submitCreate = async () => {
  if (!createForm.value.order_id || !createForm.value.description) {
    ElMessage.warning('请完善纠纷信息')
    return
  }
  try {
    await axios.post('/api/disputes', createForm.value)
    ElMessage.success('纠纷提交成功')
    showCreateDialog.value = false
    createForm.value = { order_id: '', type: 'quality', description: '' }
    loadDisputes()
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

const submitHandle = async () => {
  await axios.put(`/api/disputes/${currentDispute.value.id}`, form.value)
  ElMessage.success('纠纷处理完成')
  showDialog.value = false
  loadDisputes()
}

const loadDisputes = async () => {
  const res = await axios.get('/api/disputes')
  disputes.value = res.data
}

const loadOrders = async () => {
  const res = await axios.get('/api/orders')
  orders.value = res.data
}

onMounted(() => {
  loadDisputes()
  loadOrders().then(() => {
    const quickOrder = sessionStorage.getItem('quick_dispute_order')
    if (quickOrder) {
      try {
        const order = JSON.parse(quickOrder)
        createForm.value.order_id = order.id
        showCreateDialog.value = true
        sessionStorage.removeItem('quick_dispute_order')
      } catch (e) {}
    }
  })
})
</script>
