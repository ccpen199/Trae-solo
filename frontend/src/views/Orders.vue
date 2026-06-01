<template>
  <div>
    <div class="page-header">
      <div class="page-title">订单管理</div>
      <div style="display: flex; gap: 8px;">
        <el-button type="success" @click="showRechargeDialog">充值</el-button>
        <el-button type="primary" @click="showSendDialog">赠送礼物</el-button>
      </div>
    </div>

    <div class="card-content">
      <div class="filter-bar">
        <el-input v-model="filters.userId" placeholder="用户ID" clearable style="width: 120px;" @change="loadData" />
        <el-input v-model="filters.receiverId" placeholder="接收方ID" clearable style="width: 120px;" @change="loadData" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
          <el-option label="处理中" value="pending" />
        </el-select>
        <el-date-picker v-model="filters.startTime" type="datetime" placeholder="开始时间" @change="loadData" />
        <el-date-picker v-model="filters.endTime" type="datetime" placeholder="结束时间" @change="loadData" />
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="orders" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column label="送礼用户" width="140">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_name }}
          </template>
        </el-table-column>
        <el-table-column label="礼物" width="140">
          <template #default="{ row }">
            <span class="gift-icon">{{ row.gift_icon }}</span>{{ row.gift_name }} x {{ row.quantity }}
          </template>
        </el-table-column>
        <el-table-column label="接收方" width="140">
          <template #default="{ row }">
            {{ row.receiver_nickname || row.receiver_name }}
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="单价" width="80">
          <template #default="{ row }">¥{{ row.unit_price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="总额" width="100">
          <template #default="{ row }">¥{{ row.total_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="scene" label="场景" width="80" />
        <el-table-column prop="message" label="留言" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fail_reason" label="失败原因" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="160" />
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="sendDialogVisible" title="赠送礼物" width="500px">
      <el-form :model="sendForm" :rules="sendRules" ref="sendFormRef" label-width="100px">
        <el-form-item label="礼物" prop="giftId">
          <el-select v-model="sendForm.giftId" style="width: 100%;">
            <el-option v-for="g in giftList" :key="g.id" :label="g.name" :value="g.id">
              <span>{{ g.icon }} {{ g.name }} - ¥{{ g.price }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="sendForm.quantity" :min="1" :max="99" />
        </el-form-item>
        <el-form-item label="接收方ID" prop="receiverId">
          <el-input v-model="sendForm.receiverId" placeholder="接收用户ID" />
        </el-form-item>
        <el-form-item label="场景">
          <el-input v-model="sendForm.scene" placeholder="直播/社区" />
        </el-form-item>
        <el-form-item label="留言">
          <el-input v-model="sendForm.message" type="textarea" :rows="2" placeholder="留言消息" />
        </el-form-item>
        <el-alert v-if="selectedGift" :title="`预计花费: ¥${(selectedGift.price * sendForm.quantity).toFixed(2)}，当前余额: ¥${userStore.user?.balance?.toFixed(2) || '0.00'}`" type="info" show-icon />
      </el-form>
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSend" :loading="sending">确定赠送</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rechargeDialogVisible" title="充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="1" :max="999999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRecharge" :loading="recharging">确定充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const orders = ref([])
const loading = ref(false)
const sending = ref(false)
const recharging = ref(false)
const sendDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)
const sendFormRef = ref(null)
const giftList = ref([])

const filters = reactive({ userId: '', receiverId: '', status: '', startTime: '', endTime: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const sendForm = reactive({ giftId: null, quantity: 1, receiverId: '', scene: '', message: '' })
const rechargeForm = reactive({ amount: 100 })

const sendRules = {
  giftId: [{ required: true, message: '请选择礼物', trigger: 'change' }],
  receiverId: [{ required: true, message: '请输入接收方ID', trigger: 'blur' }]
}

const statusMap = { success: '成功', failed: '失败', pending: '处理中' }
const statusType = s => s === 'success' ? 'success' : s === 'failed' ? 'danger' : 'warning'

const selectedGift = computed(() => giftList.value.find(g => g.id === sendForm.giftId))

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/orders', { params: { ...filters, ...pagination } })
    orders.value = data.items
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

async function loadGifts() {
  const data = await request.get('/gifts', { params: { status: 'online', pageSize: 100 } })
  giftList.value = data.items
}

function showSendDialog() {
  loadGifts()
  Object.assign(sendForm, { giftId: null, quantity: 1, receiverId: '', scene: '', message: '' })
  sendDialogVisible.value = true
}

function showRechargeDialog() {
  rechargeForm.amount = 100
  rechargeDialogVisible.value = true
}

async function handleSend() {
  try {
    await sendFormRef.value.validate()
    sending.value = true
    await request.post('/orders/send', sendForm)
    ElMessage.success('赠送成功')
    sendDialogVisible.value = false
    loadData()
    userStore.getProfile()
  } finally {
    sending.value = false
  }
}

async function handleRecharge() {
  try {
    recharging.value = true
    await request.post('/orders/recharge', { amount: rechargeForm.amount })
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    userStore.getProfile()
  } finally {
    recharging.value = false
  }
}

onMounted(loadData)
</script>
