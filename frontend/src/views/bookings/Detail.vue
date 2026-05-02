<template>
  <div class="booking-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button text @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="card-title">订舱单详情</span>
          </div>
          <div class="header-right">
            <el-tag :type="getStatusType(booking?.status)" size="large">
              {{ getStatusLabel(booking?.status) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="info">
          <div class="detail-content">
            <el-descriptions title="订舱信息" :column="3" border>
              <el-descriptions-item label="主单号">
                {{ booking?.mainNo || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(booking?.status)">
                  {{ getStatusLabel(booking?.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="货主名称">
                {{ booking?.shipperName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="装货港">
                {{ booking?.pol || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="卸货港">
                {{ booking?.pod || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="预计开船时间">
                {{ formatTime(booking?.eta) }}
              </el-descriptions-item>
              <el-descriptions-item label="预计到港时间">
                {{ formatTime(booking?.etd) }}
              </el-descriptions-item>
              <el-descriptions-item label="货物类型">
                {{ getCargoTypeLabel(booking?.cargoType) }}
              </el-descriptions-item>
              <el-descriptions-item label="货物描述">
                {{ booking?.cargoDesc || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="集装箱数">
                {{ booking?.containerCount || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="集装箱类型">
                {{ booking?.containerType || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="毛重(吨)">
                {{ booking?.grossWeight || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="体积(立方米)">
                {{ booking?.volume || 0 }}
              </el-descriptions-item>
              <el-descriptions-item label="责任人">
                {{ booking?.responsiblePerson || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="期望完成时间">
                {{ formatTime(booking?.expectedCompleteTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(booking?.createdAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatTime(booking?.updatedAt) }}
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="3">
                {{ booking?.remark || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="集装箱明细" name="containers">
          <div class="detail-content">
            <el-table :data="details" stripe v-loading="loading">
              <el-table-column prop="detailNo" label="明细单号" width="160" />
              <el-table-column prop="containerNo" label="箱号" width="180">
                <template #default="{ row }">
                  <span v-if="row.containerNo">{{ row.containerNo }}</span>
                  <span v-else class="text-muted">待分配</span>
                </template>
              </el-table-column>
              <el-table-column prop="containerType" label="箱型" width="100" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sealNo" label="封箱号" width="120">
                <template #default="{ row }">
                  {{ row.sealNo || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="grossWeight" label="毛重(吨)" width="100" />
              <el-table-column prop="volume" label="体积(立方米)" width="120" />
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="状态流转" name="timeline">
          <div class="detail-content">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in transitions"
                :key="item.id"
                :timestamp="formatTime(item.createdAt)"
                :type="getTimelineType(item.action)"
              >
                <el-card>
                  <template #header>
                    <div class="timeline-header">
                      <span class="timeline-action">{{ item.actionLabel || item.action }}</span>
                      <el-tag :type="getStatusType(item.toStatus)">
                        {{ getStatusLabel(item.toStatus) }}
                      </el-tag>
                    </div>
                  </template>
                  <div class="timeline-content">
                    <p v-if="item.comment">
                      <strong>处理意见：</strong>{{ item.comment }}
                    </p>
                    <p>
                      <strong>操作人：</strong>{{ item.operatorName || '-' }}
                    </p>
                    <p v-if="item.fromStatus">
                      <strong>原状态：</strong>{{ getStatusLabel(item.fromStatus) }}
                    </p>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-if="transitions.length === 0" description="暂无状态流转记录" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="提单信息" name="bills">
          <div class="detail-content">
            <el-table :data="bills" stripe v-loading="loading">
              <el-table-column prop="bolNo" label="提单号" width="180" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  {{ getBolTypeLabel(row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getBolStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="shipper" label="托运人" min-width="150" />
              <el-table-column prop="consignee" label="收货人" min-width="150" />
              <el-table-column prop="notifier" label="通知人" min-width="150" />
              <el-table-column prop="isLocked" label="是否锁定" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.isLocked ? 'danger' : 'success'">
                    {{ row.isLocked ? '已锁定' : '未锁定' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="bills.length === 0" description="暂无提单信息" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="费用信息" name="fees">
          <div class="detail-content">
            <el-table :data="fees" stripe v-loading="loading" show-summary>
              <el-table-column prop="type" label="费用类型" width="150">
                <template #default="{ row }">
                  {{ getFeeTypeLabel(row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="费用描述" min-width="200" />
              <el-table-column prop="currency" label="币种" width="100" />
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  {{ row.amount?.toFixed(2) || '0.00' }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFeeStatusType(row.status)">
                    {{ getFeeStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="paidAt" label="支付时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.paidAt) }}
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="fees.length === 0" description="暂无费用信息" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="action-bar">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="action-buttons">
          <el-button
            v-for="action in availableActions"
            :key="action.value"
            :type="action.type || 'primary'"
            @click="handleAction(action.value)"
          >
            {{ action.label }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="actionDialogVisible"
      title="处理订舱单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="actionFormRef"
        :model="actionForm"
        :rules="actionRules"
        label-width="100px"
      >
        <el-form-item label="处理意见">
          <el-input
            v-model="actionForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见"
          />
        </el-form-item>
        <el-form-item
          v-if="currentAction === 'ASSIGN_CONTAINER'"
          label="箱号"
          prop="containerNo"
        >
          <el-input
            v-model="actionForm.containerNo"
            placeholder="请输入箱号（如：MSKU1234567）"
          />
          <div class="form-tip">
            箱号格式：4个字母（公司代码）+ 6个数字 + 1个校验位
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleSubmitAction">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { bookingsApi, containerApi } from '@/api'
import { STATUS_LABELS, STATUS_TYPES, STATUS_TRANSITIONS } from '@/utils/constants'
import { ElMessage } from 'element-plus'

const route = useRoute()

const loading = ref(false)
const activeTab = ref('info')
const booking = ref(null)
const details = ref([])
const transitions = ref([])
const bills = ref([])
const fees = ref([])

const actionDialogVisible = ref(false)
const actionLoading = ref(false)
const actionFormRef = ref(null)
const currentAction = ref('')

const actionForm = reactive({
  comment: '',
  containerNo: '',
})

const actionRules = {
  containerNo: [
    { required: true, message: '请输入箱号', trigger: 'blur' },
    {
      pattern: /^[A-Z]{4}\d{7}$/,
      message: '箱号格式应为4个字母+7个数字',
      trigger: 'blur',
    },
  ],
}

const bookingId = computed(() => route.params.id)

const availableActions = computed(() => {
  if (!booking.value) return []
  const status = booking.value.status
  const transitions = STATUS_TRANSITIONS[status] || []
  return transitions
    .filter(t => t.allowed)
    .map(t => ({
      label: t.label,
      value: t.action,
      type: t.action === 'REJECT_BOOKING' ? 'danger' : 'primary',
    }))
})

const getStatusLabel = (status) => STATUS_LABELS[status] || status || '-'
const getStatusType = (status) => STATUS_TYPES[status] || 'info'

const getTimelineType = (action) => {
  const types = {
    SUBMIT_BOOKING: 'primary',
    APPROVE_BOOKING: 'success',
    REJECT_BOOKING: 'danger',
    ASSIGN_CONTAINER: 'primary',
    PORT_ENTRY: 'warning',
    LOADING: 'primary',
    RELEASE_BOL: 'success',
  }
  return types[action] || 'info'
}

const getCargoTypeLabel = (type) => {
  const labels = {
    GENERAL: '普通货物',
    DANGEROUS: '危险品',
    REEFER: '冷冻货',
    OVERSIZE: '超大件',
    OTHER: '其他',
  }
  return labels[type] || type || '-'
}

const getBolTypeLabel = (type) => {
  const labels = {
    SEA: '海运提单',
    RAIL: '铁路提单',
    AIR: '空运提单',
  }
  return labels[type] || type || '-'
}

const getBolStatusLabel = (status) => {
  const labels = {
    DRAFT: '草稿',
    ISSUED: '已签发',
    RELEASED: '已放单',
    TELEX_RELEASED: '电放',
  }
  return labels[status] || status || '-'
}

const getFeeTypeLabel = (type) => {
  const labels = {
    FREIGHT: '海运费',
    THC: '码头操作费',
    DOC: '文件费',
    CUSTOMS: '报关费',
    INSURANCE: '保险费',
    OTHER: '其他费用',
  }
  return labels[type] || type || '-'
}

const getFeeStatusLabel = (status) => {
  const labels = {
    PENDING: '待支付',
    PAID: '已支付',
    REFUNDED: '已退款',
  }
  return labels[status] || status || '-'
}

const getFeeStatusType = (status) => {
  const types = {
    PENDING: 'warning',
    PAID: 'success',
    REFUNDED: 'info',
  }
  return types[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const fetchBookingDetail = async () => {
  loading.value = true
  try {
    const result = await bookingsApi.getDetail(bookingId.value)
    if (result.success) {
      booking.value = result.data?.main || null
      details.value = result.data?.details || []
      transitions.value = result.data?.transitions || []
      bills.value = result.data?.bills || []
      fees.value = result.data?.fees || []
    }
  } catch (error) {
    console.error('Fetch booking detail error:', error)
    ElMessage.error('获取订舱单详情失败')
  } finally {
    loading.value = false
  }
}

const handleAction = (action) => {
  currentAction.value = action
  actionForm.comment = ''
  actionForm.containerNo = ''
  actionDialogVisible.value = true
}

const handleSubmitAction = async () => {
  if (!actionFormRef.value && currentAction.value === 'ASSIGN_CONTAINER') return

  if (currentAction.value === 'ASSIGN_CONTAINER') {
    await actionFormRef.value.validate(async (valid) => {
      if (valid) {
        await submitAction()
      }
    })
  } else {
    await submitAction()
  }
}

const submitAction = async () => {
  actionLoading.value = true
  try {
    let result
    const { comment, containerNo } = actionForm
    const id = bookingId.value

    if (currentAction.value === 'SUBMIT_BOOKING') {
      result = await bookingsApi.submit(id, { comment })
    } else if (currentAction.value === 'APPROVE_BOOKING') {
      result = await bookingsApi.approve(id, { comment })
    } else if (currentAction.value === 'REJECT_BOOKING') {
      result = await bookingsApi.reject(id, { comment })
    } else if (currentAction.value === 'ASSIGN_CONTAINER') {
      result = await containerApi.assign(id, {
        containerNo,
        comment,
      })
    } else if (currentAction.value === 'PORT_ENTRY') {
      result = await bookingsApi.portEntry(id, { comment })
    } else if (currentAction.value === 'LOADING') {
      result = await bookingsApi.loading(id, { comment })
    } else if (currentAction.value === 'RELEASE_BOL') {
      result = await bookingsApi.releaseBol(id, { comment })
    }

    if (result?.success) {
      ElMessage.success('操作成功')
      actionDialogVisible.value = false
      fetchBookingDetail()
    } else {
      ElMessage.error(result?.message || '操作失败')
    }
  } catch (error) {
    console.error('Submit action error:', error)
    ElMessage.error('操作失败')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchBookingDetail()
})
</script>

<style scoped>
.booking-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-content {
  padding: 10px 0;
}

.text-muted {
  color: #909399;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-action {
  font-weight: 600;
  font-size: 14px;
}

.timeline-content {
  font-size: 13px;
  color: #606266;
}

.timeline-content p {
  margin: 4px 0;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
