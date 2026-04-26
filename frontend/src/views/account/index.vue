<template>
  <div class="account-center">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <div class="user-info">
            <div class="user-avatar">
              <el-avatar :size="80" :icon="UserFilled" />
            </div>
            <div class="user-detail">
              <h3>{{ user?.realName }}</h3>
              <p>
                <el-tag :type="getRoleType(user?.role)">
                  {{ getRoleText(user?.role) }}
                </el-tag>
              </p>
              <p>用户名：{{ user?.username }}</p>
              <p>手机号：{{ user?.phone }}</p>
              <p>邮箱：{{ user?.email || '未设置' }}</p>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>虚拟账户</span>
          </template>
          <div class="account-info">
            <div class="balance-section">
              <div class="balance-label">账户余额</div>
              <div class="balance-value">
                ¥{{ formatNumber(virtualAccount?.balance) }}
              </div>
            </div>
            <el-divider />
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="stat-item">
                  <div class="stat-label">冻结金额</div>
                  <div class="stat-value">¥{{ formatNumber(virtualAccount?.frozenAmount) }}</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-item">
                  <div class="stat-label">账户状态</div>
                  <div class="stat-value">
                    <el-tag :type="virtualAccount?.status === 'ACTIVE' ? 'success' : 'danger'">
                      {{ virtualAccount?.status === 'ACTIVE' ? '正常' : '冻结' }}
                    </el-tag>
                  </div>
                </div>
              </el-col>
            </el-row>
            <div style="margin-top: 20px">
              <el-button type="primary" style="width: 100%" @click="handleRecharge">
                充值
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="我的订单" name="orders">
            <el-table :data="userOrders" stripe style="width: 100%">
              <el-table-column prop="orderNo" label="订单号" width="200" />
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column label="重量(kg)" width="100">
                <template #default="{ row }">
                  {{ formatNumber(row.actualWeight || row.expectedWeight) }}
                </template>
              </el-table-column>
              <el-table-column label="金额(元)" width="120">
                <template #default="{ row }">
                  ¥{{ formatNumber(row.actualAmount || row.expectedAmount) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" text @click="viewOrder(row.id)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="子订单" name="suborders" v-if="userStore.isFarmer">
            <el-table :data="userSubOrders" stripe style="width: 100%">
              <el-table-column prop="subOrderNo" label="子订单号" width="200" />
              <el-table-column label="主订单号" width="200">
                <template #default="{ row }">
                  {{ row.mainOrderId }}
                </template>
              </el-table-column>
              <el-table-column prop="productName" label="产品名称" />
              <el-table-column label="重量(kg)" width="100">
                <template #default="{ row }">
                  {{ formatNumber(row.actualWeight || row.expectedWeight) }}
                </template>
              </el-table-column>
              <el-table-column label="金额(元)" width="120">
                <template #default="{ row }">
                  ¥{{ formatNumber(row.actualAmount || row.expectedAmount) }}
                </template>
              </el-table-column>
              <el-table-column label="质检等级" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.qualityGrade" :type="getGradeType(row.qualityGrade)">
                    {{ getGradeText(row.qualityGrade) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="通知记录" name="notifications">
            <el-table :data="userNotifications" stripe style="width: 100%">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="title" label="标题" width="200">
                <template #default="{ row }">
                  <span :class="{ 'unread-title': !row.isRead }">
                    {{ row.title }}
                  </span>
                  <el-badge v-if="!row.isRead" is-dot style="margin-left: 8px" />
                </template>
              </el-table-column>
              <el-table-column prop="content" label="内容" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'ALERT' ? 'danger' : ''">
                    {{ row.type === 'ALERT' ? '预警' : row.type === 'ORDER' ? '订单' : '系统' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="!row.isRead"
                    type="primary"
                    text
                    @click="markAsRead(row.id)"
                  >
                    标为已读
                  </el-button>
                  <span v-else style="color: #909399">已读</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <el-dialog v-model="rechargeVisible" title="账户充值" width="500px">
      <el-form :model="rechargeForm" label-width="100px">
        <el-form-item label="当前余额">
          <span style="font-size: 20px; font-weight: 600; color: #409eff">
            ¥{{ formatNumber(virtualAccount?.balance) }}
          </span>
        </el-form-item>
        <el-form-item label="充值金额">
          <el-radio-group v-model="rechargeForm.amount">
            <el-radio :value="1000">¥1,000</el-radio>
            <el-radio :value="5000">¥5,000</el-radio>
            <el-radio :value="10000">¥10,000</el-radio>
            <el-radio :value="50000">¥50,000</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="自定义金额">
          <el-input-number
            v-model="rechargeForm.customAmount"
            :min="0"
            :precision="2"
            placeholder="输入自定义金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="rechargeForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
            <el-option label="微信支付" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="银行转账" value="BANK" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" :loading="rechargeLoading" @click="submitRecharge">
          确认充值
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import mockData from '@/utils/mock-data'
import type { Order, SubOrder, OrderStatus, QualityLevel, Role, Notification, VirtualAccount } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const activeTab = ref('orders')
const rechargeVisible = ref(false)
const rechargeLoading = ref(false)

const user = computed(() => userStore.user)
const virtualAccount = computed(() => {
  if (user.value) {
    return mockData.getMockVirtualAccount(user.value.id)
  }
  return null
})

const userOrders = computed(() => {
  if (userStore.isBuyer) {
    return mockData.mockOrders.filter(o => o.buyerId === user.value?.id)
  }
  return mockData.mockOrders
})

const userSubOrders = computed(() => {
  if (userStore.isFarmer && user.value) {
    return mockData.mockSubOrders.filter(so => so.farmerId === user.value?.id)
  }
  return []
})

const userNotifications = computed(() => {
  if (user.value) {
    return mockData.getMockNotifications(user.value.id)
  }
  return []
})

const rechargeForm = reactive({
  amount: 5000,
  customAmount: 0,
  paymentMethod: 'WECHAT',
})

const roleMap: Record<Role, { text: string; type: string }> = {
  [Role.BUYER]: { text: '采购商', type: 'primary' },
  [Role.FARMER]: { text: '农户', type: 'success' },
  [Role.OPERATOR]: { text: '平台运营', type: 'warning' },
  [Role.FINANCE]: { text: '财务人员', type: 'info' },
  [Role.STORAGE]: { text: '收储机构', type: '' },
}

const getRoleType = (role?: Role) => role ? (roleMap[role]?.type || '') : ''
const getRoleText = (role?: Role) => role ? (roleMap[role]?.text || role) : ''

const statusMap: Record<OrderStatus, { text: string; type: string }> = {
  DRAFT: { text: '草稿', type: 'info' },
  PENDING_PREPAYMENT: { text: '待预付', type: 'warning' },
  PREPAYMENT_PAID: { text: '已预付', type: '' },
  IN_COLLECTION: { text: '采集中', type: 'primary' },
  QUALITY_CHECKED: { text: '质检完成', type: '' },
  IN_TRANSPORT: { text: '运输中', type: 'primary' },
  DELIVERED: { text: '已到货', type: 'success' },
  SETTLED: { text: '已结算', type: 'success' },
  CANCELLED: { text: '已取消', type: 'danger' },
  EXCEPTION_HANDLING: { text: '异常处理', type: 'danger' },
  STORAGE_TRANSFERRED: { text: '货权转移', type: 'warning' },
}

const getStatusType = (status: OrderStatus) => statusMap[status]?.type || ''
const getStatusText = (status: OrderStatus) => statusMap[status]?.text || status

const gradeMap: Record<QualityLevel, { text: string; type: string }> = {
  PREMIUM: { text: '特级', type: 'success' },
  GRADE_A: { text: '一级', type: 'primary' },
  GRADE_B: { text: '二级', type: '' },
  GRADE_C: { text: '三级', type: 'info' },
  REJECTED: { text: '等外', type: 'danger' },
}

const getGradeType = (grade: QualityLevel) => gradeMap[grade]?.type || ''
const getGradeText = (grade: QualityLevel) => gradeMap[grade]?.text || grade

const formatNumber = (num: any) => {
  if (num?.toNumber) {
    return num.toNumber().toFixed(2)
  }
  return Number(num || 0).toFixed(2)
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const viewOrder = (id: string) => {
  router.push(`/orders/${id}`)
}

const markAsRead = async (id: string) => {
  await notificationStore.markAsRead(id)
  ElMessage.success('已标为已读')
}

const handleRecharge = () => {
  rechargeVisible.value = true
}

const submitRecharge = async () => {
  const amount = rechargeForm.customAmount > 0 ? rechargeForm.customAmount : rechargeForm.amount
  
  if (amount <= 0) {
    ElMessage.warning('请输入有效的充值金额')
    return
  }

  rechargeLoading.value = true
  try {
    ElMessage.success(`充值成功！金额：¥${amount.toFixed(2)}`)
    rechargeVisible.value = false
  } catch (error) {
    console.error('Failed to recharge:', error)
    ElMessage.error('充值失败')
  } finally {
    rechargeLoading.value = false
  }
}

onMounted(() => {
  notificationStore.loadMockNotifications()
})
</script>

<style lang="scss" scoped>
.account-center {
  .user-info {
    text-align: center;

    .user-avatar {
      margin-bottom: 16px;
    }

    .user-detail {
      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #333;
      }

      p {
        margin: 6px 0;
        font-size: 14px;
        color: #666;
      }
    }
  }

  .account-info {
    .balance-section {
      text-align: center;

      .balance-label {
        font-size: 14px;
        color: #999;
        margin-bottom: 8px;
      }

      .balance-value {
        font-size: 32px;
        font-weight: 600;
        color: #409eff;
      }
    }

    .stat-item {
      text-align: center;

      .stat-label {
        font-size: 13px;
        color: #999;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }
    }
  }

  .unread-title {
    font-weight: 600;
    color: #333;
  }
}
</style>
