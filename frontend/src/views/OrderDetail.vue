<template>
  <Layout>
    <div v-if="loading" class="loading-container">
      <el-icon size="40" class="is-loading"><Loading /></el-icon>
    </div>
    
    <div v-else-if="!orderDetail" class="empty-container">
      订单不存在
    </div>
    
    <div v-else>
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="page-card">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>
                  订单号: {{ orderDetail.order.order_no }}
                  <el-tag :type="getStatusType(orderDetail.order.status)" style="margin-left: 10px;">
                    {{ getStatusName(orderDetail.order.status) }}
                  </el-tag>
                </span>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="乘客">
                {{ orderDetail.order.passenger_name }} ({{ orderDetail.order.passenger_phone }})
              </el-descriptions-item>
              <el-descriptions-item label="司机">
                <template v-if="orderDetail.order.driver_name">
                  {{ orderDetail.order.driver_name }} ({{ orderDetail.order.car_plate }})
                </template>
                <el-tag v-else type="info">待分配</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="出发地址" :span="2">
                {{ orderDetail.order.start_address }}
              </el-descriptions-item>
              <el-descriptions-item label="目的地址" :span="2">
                {{ orderDetail.order.end_address }}
              </el-descriptions-item>
              <el-descriptions-item label="预估价格">
                <span style="font-weight: bold; color: #409eff;">
                  ¥{{ orderDetail.order.estimated_price || '待计算' }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="实际价格">
                <span style="font-weight: bold; color: #f56c6c;">
                  ¥{{ orderDetail.order.actual_price || '待结算' }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="预估距离">
                {{ orderDetail.order.estimated_distance ? orderDetail.order.estimated_distance.toFixed(2) + ' km' : '待计算' }}
              </el-descriptions-item>
              <el-descriptions-item label="车型">
                {{ getRideTypeName(orderDetail.order.ride_type) }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="2">
                {{ formatTime(orderDetail.order.created_at) }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="availableActions.length > 0" style="margin-top: 30px;">
              <el-divider>可用操作</el-divider>
              <div class="action-buttons">
                <el-button 
                  v-if="availableActions.includes('assign_driver')"
                  type="primary"
                  :loading="actionLoading"
                  @click="showAssignDialog = true"
                >
                  派单给司机
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('driver_accept')"
                  type="primary"
                  :loading="actionLoading"
                  @click="handleDriverAccept"
                >
                  确认接单
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('start_ride')"
                  type="primary"
                  :loading="actionLoading"
                  @click="handleStartRide"
                >
                  开始行程
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('confirm_arrival')"
                  type="warning"
                  :loading="actionLoading"
                  @click="handleConfirmArrival"
                >
                  确认到达
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('payment')"
                  type="success"
                  :loading="actionLoading"
                  @click="showPaymentDialog = true"
                >
                  立即支付
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('rate')"
                  type="warning"
                  :loading="actionLoading"
                  @click="showRateDialog = true"
                >
                  评价服务
                </el-button>
                
                <el-button 
                  v-if="availableActions.includes('cancel')"
                  type="danger"
                  :loading="actionLoading"
                  @click="showCancelDialog = true"
                >
                  取消订单
                </el-button>
              </div>
            </div>
          </el-card>

          <el-card class="page-card" style="margin-top: 20px;">
            <template #header>
              <span>订单时间轴</span>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in orderDetail.timeline"
                :key="index"
                :type="getTimelineType(item.type)"
                :timestamp="formatTimestamp(item.time)"
                placement="top"
              >
                <h4 style="margin-bottom: 5px;">{{ item.title }}</h4>
                <p style="margin: 0; color: #606266;">{{ item.description }}</p>
                <p v-if="item.operator" style="margin: 5px 0 0 0; font-size: 12px; color: #909399;">
                  操作人: {{ item.operator }}
                </p>
                <p v-if="item.rating" style="margin: 5px 0 0 0; font-size: 12px; color: #e6a23c;">
                  评分: {{ item.rating }} ⭐
                </p>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="page-card">
            <template #header>
              <span>状态流转</span>
            </template>
            <div v-if="orderDetail.statusFlow?.length === 0" class="empty-container">
              暂无状态流转记录
            </div>
            <div v-else>
              <div 
                v-for="flow in orderDetail.statusFlow" 
                :key="flow.id" 
                style="padding: 15px 0; border-bottom: 1px solid #ebeef5;"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <el-tag :type="getStatusType(flow.to_status)" size="small">
                      {{ getStatusName(flow.to_status) }}
                    </el-tag>
                  </div>
                  <div style="font-size: 12px; color: #909399;">
                    {{ formatTime(flow.created_at) }}
                  </div>
                </div>
                <div v-if="flow.operator_name" style="margin-top: 8px; font-size: 13px; color: #606266;">
                  操作人: {{ flow.operator_name }}
                </div>
                <div v-if="flow.reason" style="margin-top: 5px; font-size: 13px; color: #909399;">
                  原因: {{ flow.reason }}
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="page-card" style="margin-top: 20px;">
            <template #header>
              <span>通知消息</span>
            </template>
            <div v-if="orderDetail.notifications?.length === 0" class="empty-container">
              暂无通知
            </div>
            <div v-else>
              <div 
                v-for="notification in orderDetail.notifications" 
                :key="notification.id" 
                style="padding: 10px 0; border-bottom: 1px solid #ebeef5;"
              >
                <div style="font-weight: bold; font-size: 14px;">
                  {{ notification.title }}
                </div>
                <div style="font-size: 13px; color: #606266; margin-top: 5px;">
                  {{ notification.content }}
                </div>
                <div style="font-size: 12px; color: #909399; margin-top: 5px;">
                  {{ formatTime(notification.created_at) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showAssignDialog" title="选择司机" width="600px">
      <el-select 
        v-model="selectedDriver" 
        placeholder="请选择司机"
        style="width: 100%;"
        size="large"
      >
        <el-option
          v-for="driver in availableDrivers"
          :key="driver.id"
          :label="`${driver.driver_name} - ${driver.car_model} (${driver.car_plate}) - 距离${driver.distance?.toFixed(2) || '0'}km - 评分${driver.rating}`"
          :value="driver.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleAssignDriver">
          确认派单
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPaymentDialog" title="确认支付" width="500px">
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 14px; color: #909399; margin-bottom: 10px;">支付金额</div>
        <div style="font-size: 48px; font-weight: bold; color: #409eff;">
          ¥{{ orderDetail.order.actual_price }}
        </div>
        <div style="margin-top: 20px;">
          <el-radio-group v-model="paymentMethod">
            <el-radio value="alipay">支付宝</el-radio>
            <el-radio value="wechat">微信支付</el-radio>
            <el-radio value="cash">现金</el-radio>
          </el-radio-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPaymentDialog = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handlePayment">
          确认支付
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRateDialog" title="评价服务" width="500px">
      <div style="padding: 20px;">
        <el-form label-width="80px">
          <el-form-item label="评分">
            <el-rate v-model="ratingValue" :max="5" />
          </el-form-item>
          <el-form-item label="评价内容">
            <el-input
              v-model="ratingContent"
              type="textarea"
              :rows="4"
              placeholder="请输入评价内容"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showRateDialog = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleRate">
          提交评价
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCancelDialog" title="取消订单" width="500px">
      <div style="padding: 20px;">
        <el-form label-width="80px">
          <el-form-item label="取消原因">
            <el-select v-model="cancelReason" placeholder="请选择取消原因" style="width: 100%;">
              <el-option label="改变行程" value="改变行程" />
              <el-option label="等待时间过长" value="等待时间过长" />
              <el-option label="司机服务态度差" value="司机服务态度差" />
              <el-option label="其他原因" value="其他原因" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="cancelNote"
              type="textarea"
              :rows="3"
              placeholder="请输入详细说明（选填）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showCancelDialog = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="handleCancel">
          确认取消
        </el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import Layout from '../components/Layout.vue';
import { orderApi, userApi } from '../api';
import { useUserStore } from '../store/user';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const orderDetail = ref(null);
const availableDrivers = ref([]);
const selectedDriver = ref('');
const paymentMethod = ref('alipay');
const ratingValue = ref(5);
const ratingContent = ref('');
const cancelReason = ref('');
const cancelNote = ref('');

const showAssignDialog = ref(false);
const showPaymentDialog = ref(false);
const showRateDialog = ref(false);
const showCancelDialog = ref(false);

const loadOrderDetail = async () => {
  const orderId = route.params.orderId;
  if (!orderId) return;

  loading.value = true;
  try {
    const result = await orderApi.getById(orderId);
    if (result.success) {
      orderDetail.value = result;
      
      if (orderDetail.value.order.status === 'pending') {
        loadAvailableDrivers();
      }
    }
  } catch (error) {
    console.error('Load order detail error:', error);
  } finally {
    loading.value = false;
  }
};

const loadAvailableDrivers = async () => {
  if (!orderDetail.value) return;
  
  try {
    const result = await orderApi.getAvailableDrivers(
      orderDetail.value.order.start_lat,
      orderDetail.value.order.start_lng,
      orderDetail.value.order.ride_type
    );
    if (result.success) {
      availableDrivers.value = result.drivers || [];
    }
  } catch (error) {
    console.error('Load available drivers error:', error);
  }
};

const availableActions = computed(() => {
  if (!orderDetail.value) return [];
  
  const actions = [];
  const status = orderDetail.value.order.status;
  const userRole = userStore.user?.role;

  if (status === 'pending' && (userRole === 'admin' || userRole === 'dispatcher')) {
    actions.push('assign_driver');
  }

  if (status === 'driver_assigned' && userRole === 'driver') {
    actions.push('driver_accept');
  }

  if (status === 'driver_accepted' && userRole === 'driver') {
    actions.push('start_ride');
  }

  if (status === 'in_progress' && userRole === 'driver') {
    actions.push('confirm_arrival');
  }

  if (status === 'arrived' && userRole === 'passenger') {
    actions.push('payment');
  }

  if (status === 'payment_completed' && userRole === 'passenger') {
    actions.push('rate');
  }

  if (!['completed', 'cancelled', 'payment_completed'].includes(status)) {
    actions.push('cancel');
  }

  return actions;
});

const handleAssignDriver = async () => {
  if (!selectedDriver.value) {
    ElMessage.warning('请选择司机');
    return;
  }

  actionLoading.value = true;
  try {
    const result = await orderApi.assignDriver(route.params.orderId, {
      driver_id: selectedDriver.value,
      operator_id: userStore.user.id,
      operator_role: userStore.user.role
    });

    if (result.success) {
      ElMessage.success('派单成功');
      showAssignDialog.value = false;
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '派单失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '派单失败');
  } finally {
    actionLoading.value = false;
  }
};

const handleDriverAccept = async () => {
  actionLoading.value = true;
  try {
    const result = await orderApi.driverAccept(route.params.orderId, {
      driver_id: userStore.profile.id,
      operator_id: userStore.user.id,
      operator_role: userStore.user.role
    });

    if (result.success) {
      ElMessage.success('接单成功');
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '接单失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '接单失败');
  } finally {
    actionLoading.value = false;
  }
};

const handleStartRide = async () => {
  actionLoading.value = true;
  try {
    const result = await orderApi.startRide(route.params.orderId, {
      driver_id: userStore.profile.id,
      operator_id: userStore.user.id,
      operator_role: userStore.user.role,
      start_lat: orderDetail.value.order.start_lat,
      start_lng: orderDetail.value.order.start_lng
    });

    if (result.success) {
      ElMessage.success('行程已开始');
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '操作失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '操作失败');
  } finally {
    actionLoading.value = false;
  }
};

const handleConfirmArrival = async () => {
  actionLoading.value = true;
  try {
    const result = await orderApi.confirmArrival(route.params.orderId, {
      driver_id: userStore.profile.id,
      operator_id: userStore.user.id,
      operator_role: userStore.user.role,
      end_lat: orderDetail.value.order.end_lat,
      end_lng: orderDetail.value.order.end_lng
    });

    if (result.success) {
      ElMessage.success('已确认到达');
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '操作失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '操作失败');
  } finally {
    actionLoading.value = false;
  }
};

const handlePayment = async () => {
  actionLoading.value = true;
  try {
    const result = await orderApi.payment(route.params.orderId, {
      passenger_id: userStore.profile.id,
      payment_method: paymentMethod.value,
      operator_id: userStore.user.id,
      operator_role: userStore.user.role
    });

    if (result.success) {
      ElMessage.success('支付成功');
      showPaymentDialog.value = false;
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '支付失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '支付失败');
  } finally {
    actionLoading.value = false;
  }
};

const handleRate = async () => {
  actionLoading.value = true;
  try {
    const result = await orderApi.rate(route.params.orderId, {
      user_id: userStore.user.id,
      user_role: userStore.user.role,
      rating: ratingValue.value,
      content: ratingContent.value,
      action: 'rate'
    });

    if (result.success) {
      ElMessage.success('评价提交成功');
      showRateDialog.value = false;
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '提交失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '提交失败');
  } finally {
    actionLoading.value = false;
  }
};

const handleCancel = async () => {
  if (!cancelReason.value) {
    ElMessage.warning('请选择取消原因');
    return;
  }

  actionLoading.value = true;
  try {
    const result = await orderApi.cancel(route.params.orderId, {
      user_id: userStore.user.id,
      user_role: userStore.user.role,
      reason: cancelReason.value + (cancelNote.value ? `: ${cancelNote.value}` : '')
    });

    if (result.success) {
      ElMessage.success('订单已取消');
      showCancelDialog.value = false;
      loadOrderDetail();
    } else {
      ElMessage.error(result.error || '取消失败');
    }
  } catch (error) {
    ElMessage.error(error.error || '取消失败');
  } finally {
    actionLoading.value = false;
  }
};

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'driver_assigned': 'info',
    'driver_accepted': 'primary',
    'in_progress': 'success',
    'arrived': 'warning',
    'payment_completed': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'exception': 'danger'
  };
  return map[status] || 'info';
};

const getStatusName = (status) => {
  const map = {
    'pending': '待派单',
    'driver_assigned': '已派单待司机接单',
    'driver_accepted': '司机已接单',
    'in_progress': '行程进行中',
    'arrived': '已到达',
    'payment_completed': '已支付',
    'completed': '已完成',
    'cancelled': '已取消',
    'exception': '异常'
  };
  return map[status] || status;
};

const getRideTypeName = (type) => {
  const map = {
    'standard': '经济型',
    'premium': '舒适型',
    'luxury': '豪华型'
  };
  return map[type] || type;
};

const getTimelineType = (type) => {
  const map = {
    'order_created': 'primary',
    'status_change': 'success',
    'comment': 'warning',
    'exception': 'danger'
  };
  return map[type] || 'info';
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

watch(
  () => route.params.orderId,
  () => loadOrderDetail(),
  { immediate: true }
);

onMounted(() => {
  loadOrderDetail();
});
</script>
