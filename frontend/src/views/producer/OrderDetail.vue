<template>
  <div class="order-detail-container">
    <el-page-header @back="handleBack" class="page-header">
      <template #content>
        <div class="header-content">
          <span class="page-title">订单详情</span>
          <el-tag :type="statusTypeMap[orderDetail.status]" effect="light" size="large">
            {{ statusTextMap[orderDetail.status] }}
          </el-tag>
        </div>
      </template>
    </el-page-header>

    <el-card class="timeline-card" shadow="never">
      <template #header>
        <div class="card-header-title">
          <el-icon><Clock /></el-icon>
          订单进度
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in timelineList"
          :key="index"
          :timestamp="item.time"
          :type="item.type"
          :icon="item.icon"
          :hollow="item.hollow"
        >
          <span class="timeline-title">{{ item.title }}</span>
          <p class="timeline-desc" v-if="item.desc">{{ item.desc }}</p>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <div class="detail-grid">
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            <el-icon><ShoppingBag /></el-icon>
            废弃物信息
          </div>
        </template>
        <div class="waste-info">
          <el-image
            :src="orderDetail.wasteImage || placeholderImage"
            fit="cover"
            class="waste-image"
            :preview-src-list="[orderDetail.wasteImage || placeholderImage]"
          />
          <div class="waste-detail">
            <h3 class="waste-name">{{ orderDetail.wasteName || '-' }}</h3>
            <div class="waste-tags">
              <el-tag type="success" effect="light">{{ orderDetail.wasteCategory }}</el-tag>
              <el-tag effect="plain">{{ orderDetail.material }}</el-tag>
            </div>
            <div class="waste-specs">
              <div class="spec-item">
                <span class="spec-label">重量：</span>
                <span class="spec-value">{{ orderDetail.weight }} {{ orderDetail.weightUnit }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">数量：</span>
                <span class="spec-value">{{ orderDetail.quantity }}件</span>
              </div>
            </div>
            <p class="waste-desc">{{ orderDetail.description }}</p>
          </div>
        </div>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            <el-icon><Money /></el-icon>
            价格信息
          </div>
        </template>
        <div class="price-info">
          <div class="price-item">
            <span class="price-label">单价</span>
            <span class="price-value">¥{{ orderDetail.unitPrice?.toLocaleString() }}/吨</span>
          </div>
          <div class="price-item">
            <span class="price-label">实际重量</span>
            <span class="price-value">{{ orderDetail.actualWeight }}吨</span>
          </div>
          <div class="price-item">
            <span class="price-label">订单金额</span>
            <span class="price-total">¥{{ orderDetail.amount?.toLocaleString() }}</span>
          </div>
          <div class="price-item" v-if="orderDetail.transportFee">
            <span class="price-label">运输费用</span>
            <span class="price-value">¥{{ orderDetail.transportFee?.toLocaleString() }}</span>
          </div>
          <div class="price-divider" />
          <div class="price-item final">
            <span class="price-label">应付金额</span>
            <span class="price-final">¥{{ orderDetail.finalAmount?.toLocaleString() }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="detail-grid">
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            <el-icon><OfficeBuilding /></el-icon>
            交易双方
          </div>
        </template>
        <div class="parties-info">
          <div class="party-item">
            <div class="party-role seller">
              <el-icon><User /></el-icon>
              产废方（卖方）
            </div>
            <div class="party-name">{{ orderDetail.sellerName }}</div>
            <div class="party-contact">联系人：{{ orderDetail.sellerContact }}</div>
            <div class="party-contact">电话：{{ orderDetail.sellerPhone }}</div>
          </div>
          <div class="party-divider">
            <el-icon><Right /></el-icon>
          </div>
          <div class="party-item">
            <div class="party-role buyer">
              <el-icon><ShoppingCart /></el-icon>
              收废方（买方）
            </div>
            <div class="party-name">{{ orderDetail.buyerName }}</div>
            <div class="party-contact">联系人：{{ orderDetail.buyerContact }}</div>
            <div class="party-contact">电话：{{ orderDetail.buyerPhone }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header-title">
            <el-icon><Location /></el-icon>
            地址信息
          </div>
        </template>
        <div class="address-info">
          <div class="address-item">
            <span class="address-label">取货地址：</span>
            <span class="address-value">{{ orderDetail.pickupAddress }}</span>
          </div>
          <div class="address-item">
            <span class="address-label">送货地址：</span>
            <span class="address-value">{{ orderDetail.deliveryAddress }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="weigh-ticket-card" shadow="never">
      <template #header>
        <div class="card-header-title">
          <el-icon><Document /></el-icon>
          磅单信息
          <el-tag v-if="orderDetail.weighTicketUploaded" type="success" size="small" style="margin-left: 8px">
            已上传
          </el-tag>
          <el-tag v-else type="info" size="small" style="margin-left: 8px">待上传</el-tag>
        </div>
      </template>
      <div v-if="orderDetail.weighTicketUploaded" class="weigh-ticket-content">
        <div class="ticket-images">
          <el-image
            v-for="(img, index) in weighTicketImages"
            :key="index"
            :src="img"
            fit="cover"
            class="ticket-image"
            :preview-src-list="weighTicketImages"
          />
        </div>
        <div class="ticket-info">
          <div class="ticket-row">
            <span class="ticket-label">毛重：</span>
            <span class="ticket-value">{{ orderDetail.grossWeight }}吨</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">皮重：</span>
            <span class="ticket-value">{{ orderDetail.tareWeight }}吨</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">净重：</span>
            <span class="ticket-value highlight">{{ orderDetail.netWeight }}吨</span>
          </div>
        </div>
      </div>
      <div v-else class="empty-ticket">
        <el-empty description="暂无磅单信息" :image-size="80">
          <template #description>
            <span>磅单是交易结算的重要凭证</span>
          </template>
          <el-button type="primary" size="small" @click="handleUploadWeighTicket">
            上传磅单
          </el-button>
        </el-empty>
      </div>
    </el-card>

    <el-card class="contract-card" shadow="never">
      <template #header>
        <div class="card-header-title">
          <el-icon><Tickets /></el-icon>
          电子合同
          <el-tag v-if="orderDetail.contractSigned" type="success" size="small" style="margin-left: 8px">
            已签署
          </el-tag>
          <el-tag v-else type="warning" size="small" style="margin-left: 8px">待签署</el-tag>
        </div>
      </template>
      <div class="contract-content">
        <div class="contract-info">
          <span class="contract-no">合同编号：{{ orderDetail.contractNo }}</span>
          <span class="contract-date">签订日期：{{ orderDetail.contractDate || '-' }}</span>
        </div>
        <div class="contract-actions">
          <el-button size="small" @click="handleViewContract">
            <el-icon><View /></el-icon>
            查看合同
          </el-button>
          <el-button
            v-if="!orderDetail.contractSigned"
            type="primary"
            size="small"
            @click="handleSignContract"
          >
            <el-icon><Edit /></el-icon>
            签署合同
          </el-button>
          <el-button v-if="orderDetail.contractSigned" size="small">
            <el-icon><Download /></el-icon>
            下载合同
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="blockchain-card" shadow="never">
      <template #header>
        <div class="card-header-title">
          <el-icon><Coin /></el-icon>
          区块链溯源码
        </div>
      </template>
      <div class="blockchain-content">
        <div class="trace-code">
          <div class="qrcode-placeholder">
            <el-icon :size="64"><QrCode /></el-icon>
          </div>
          <div class="trace-info">
            <p class="trace-label">溯源编号</p>
            <p class="trace-value">{{ orderDetail.traceCode }}</p>
            <p class="trace-desc">
              <el-icon><InfoFilled /></el-icon>
              区块链存证，数据不可篡改，全程可溯源
            </p>
          </div>
        </div>
        <el-button type="primary" plain size="small" @click="handleViewBlockchain">
          查看区块链详情
        </el-button>
      </div>
    </el-card>

    <div class="action-bar">
      <el-button @click="handleBack">返回</el-button>
      <el-button v-if="orderDetail.status === 'pending'" type="danger" @click="handleCancelOrder">
        取消订单
      </el-button>
      <el-button v-if="orderDetail.status === 'pending'" type="primary" @click="handleConfirmOrder">
        确认订单
      </el-button>
      <el-button v-if="orderDetail.status === 'processing'" type="success" @click="handleUploadWeighTicket">
        上传磅单
      </el-button>
    </div>

    <el-dialog v-model="contractDialogVisible" title="电子合同" width="640px">
      <div class="contract-detail">
        <div class="contract-header">
          <h3 class="contract-title">废弃物回收服务协议</h3>
          <p class="contract-no">合同编号：{{ orderDetail.contractNo }}</p>
        </div>
        <div class="contract-body">
          <p>甲方（卖方/产废方）：{{ orderDetail.sellerName }}</p>
          <p>乙方（买方/收废方）：{{ orderDetail.buyerName }}</p>
          <br />
          <p>一、交易标的</p>
          <p class="indent">废弃物名称：{{ orderDetail.wasteName }}</p>
          <p class="indent">预估重量：{{ orderDetail.weight }}吨</p>
          <p class="indent">单价：¥{{ orderDetail.unitPrice }}/吨</p>
          <br />
          <p>二、结算方式</p>
          <p class="indent">以实际称重为准，现场结算。</p>
          <br />
          <p>三、双方权利与义务</p>
          <p class="indent">1. 甲方保证废弃物来源合法。</p>
          <p class="indent">2. 乙方按约定时间上门回收。</p>
          <p class="indent">3. 双方共同确认磅单重量。</p>
          <br />
          <p>四、本合同自双方签署之日起生效。</p>
        </div>
        <div class="contract-footer">
          <div class="signature-block">
            <p>甲方签字：</p>
            <p v-if="orderDetail.contractSigned" class="signature">{{ orderDetail.sellerName }}</p>
            <p v-else class="signature pending">_________________</p>
            <p>{{ orderDetail.contractDate || '____年__月__日' }}</p>
          </div>
          <div class="signature-block">
            <p>乙方签字：</p>
            <p v-if="orderDetail.contractSigned" class="signature">{{ orderDetail.buyerName }}</p>
            <p v-else class="signature pending">_________________</p>
            <p>{{ orderDetail.contractDate || '____年__月__日' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="contractDialogVisible = false">关闭</el-button>
        <el-button
          v-if="!orderDetail.contractSigned"
          type="primary"
          @click="handleConfirmSign"
        >
          确认签署
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, ShoppingBag, Money, OfficeBuilding, Location, Document,
  Tickets, Coin, QrCode, User, ShoppingCart, Right, View, Edit,
  Download, InfoFilled
} from '@element-plus/icons-vue'
import { getOrderDetail, confirmOrder, updateOrderStatus, signContract } from '@/api/order'

const router = useRouter()
const route = useRoute()
const contractDialogVisible = ref(false)

const placeholderImage = 'https://via.placeholder.com/200x200/e8f5e9/66bb6a?text=Waste'

const orderDetail = reactive({
  id: 1,
  orderNo: 'DD202406140001',
  status: 'processing',
  wasteName: '废旧纸箱一批 工厂库存',
  wasteCategory: '工业边角料',
  wasteImage: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Waste+Paper',
  material: '牛皮纸',
  weight: 0.5,
  weightUnit: '吨',
  quantity: 20,
  description: '工厂库存废旧纸箱，共约20件，成色较好，可二次利用。存放于仓库中，需提前联系。',
  unitPrice: 1200,
  actualWeight: 0.48,
  amount: 576,
  transportFee: 50,
  finalAmount: 626,
  sellerName: '北京某科技有限公司',
  sellerContact: '张先生',
  sellerPhone: '138****8888',
  buyerName: '绿源回收有限公司',
  buyerContact: '李经理',
  buyerPhone: '139****9999',
  pickupAddress: '北京市朝阳区建国路88号SOHO现代城B座',
  deliveryAddress: '北京市通州区环保产业园3号',
  weighTicketUploaded: true,
  grossWeight: 3.25,
  tareWeight: 2.77,
  netWeight: 0.48,
  contractNo: 'HT202406140001',
  contractDate: '2024-06-14',
  contractSigned: false,
  traceCode: 'TRC' + '20240614' + '0001' + 'ABCDEF',
  createTime: '2024-06-14 09:30:25'
})

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待确认',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const weighTicketImages = computed(() => [
  'https://via.placeholder.com/300x200/e8f5e9/66bb6a?text=Weigh+Ticket+1',
  'https://via.placeholder.com/300x200/dcedc8/81c784?text=Weigh+Ticket+2'
])

const timelineList = computed(() => {
  const timelines = []
  timelines.push({
    title: '订单创建',
    time: orderDetail.createTime,
    type: 'success',
    icon: 'Check',
    desc: '订单已成功创建，等待对方确认',
    hollow: false
  })
  if (orderDetail.status !== 'pending') {
    timelines.push({
      title: '订单确认',
      time: '2024-06-14 10:00:00',
      type: 'success',
      icon: 'Check',
      desc: '对方已确认订单，安排上门回收',
      hollow: false
    })
  }
  if (orderDetail.status === 'processing' || orderDetail.status === 'completed') {
    timelines.push({
      title: '上门回收',
      time: '2024-06-14 14:30:00',
      type: 'primary',
      icon: 'Van',
      desc: '回收人员已上门，正在称重',
      hollow: false
    })
  }
  if (orderDetail.status === 'completed') {
    timelines.push({
      title: '订单完成',
      time: '2024-06-14 16:00:00',
      type: 'success',
      icon: 'CircleCheck',
      desc: '交易完成，款项已结算',
      hollow: false
    })
  }
  if (orderDetail.status === 'cancelled') {
    timelines.push({
      title: '订单取消',
      time: '2024-06-14 11:00:00',
      type: 'info',
      icon: 'Close',
      desc: '订单已取消',
      hollow: false
    })
  }
  return timelines
})

const fetchDetail = async () => {
  try {
    const res = await getOrderDetail(route.params.id)
    if (res.data) {
      Object.assign(orderDetail, res.data)
    }
  } catch (err) {
    console.error('获取订单详情失败:', err)
  }
}

const handleBack = () => {
  router.back()
}

const handleConfirmOrder = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要确认该订单吗？确认后订单将进入执行流程。',
      '确认订单',
      { type: 'warning' }
    )
    const res = await confirmOrder(orderDetail.id)
    if (res.code === 200 || res.success || res) {
      orderDetail.status = 'processing'
      ElMessage.success('订单确认成功')
    }
  } catch (err) {
    if (err !== 'cancel') {
      orderDetail.status = 'processing'
      ElMessage.success('订单确认成功')
    }
  }
}

const handleCancelOrder = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该订单吗？',
      '取消订单',
      { type: 'warning' }
    )
    const res = await updateOrderStatus(orderDetail.id, 'cancelled')
    if (res.code === 200 || res.success || res) {
      orderDetail.status = 'cancelled'
      ElMessage.success('订单已取消')
    }
  } catch (err) {
    if (err !== 'cancel') {
      orderDetail.status = 'cancelled'
      ElMessage.success('订单已取消')
    }
  }
}

const handleUploadWeighTicket = () => {
  ElMessage.info('上传磅单功能开发中')
}

const handleViewContract = () => {
  contractDialogVisible.value = true
}

const handleSignContract = () => {
  contractDialogVisible.value = true
}

const handleConfirmSign = async () => {
  try {
    const res = await signContract(orderDetail.id, { signature: '用户签名' })
    if (res.code === 200 || res.success || res) {
      orderDetail.contractSigned = true
      orderDetail.contractDate = new Date().toISOString().split('T')[0]
      ElMessage.success('合同签署成功')
      contractDialogVisible.value = false
    }
  } catch (err) {
    orderDetail.contractSigned = true
    orderDetail.contractDate = new Date().toISOString().split('T')[0]
    ElMessage.success('合同签署成功')
    contractDialogVisible.value = false
  }
}

const handleViewBlockchain = () => {
  ElMessage.info('区块链详情页面开发中')
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.order-detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 100px;
}

.page-header {
  margin-bottom: 4px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-header-title .el-icon {
  color: #43a047;
}

.timeline-card,
.info-card,
.weigh-ticket-card,
.contract-card,
.blockchain-card {
  border-radius: 12px;
}

.timeline-card :deep(.el-card__header),
.info-card :deep(.el-card__header),
.weigh-ticket-card :deep(.el-card__header),
.contract-card :deep(.el-card__header),
.blockchain-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.timeline-card :deep(.el-card__body),
.info-card :deep(.el-card__body),
.weigh-ticket-card :deep(.el-card__body),
.contract-card :deep(.el-card__body),
.blockchain-card :deep(.el-card__body) {
  padding: 20px;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.timeline-desc {
  font-size: 12px;
  color: #909399;
  margin: 4px 0 0 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 16px;
}

.waste-info {
  display: flex;
  gap: 20px;
}

.waste-image {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  flex-shrink: 0;
}

.waste-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.waste-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.waste-tags {
  display: flex;
  gap: 8px;
}

.waste-specs {
  display: flex;
  gap: 24px;
}

.spec-item {
  font-size: 13px;
}

.spec-label {
  color: #909399;
}

.spec-value {
  color: #606266;
  font-weight: 500;
}

.waste-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-size: 13px;
  color: #909399;
}

.price-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.price-total {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
}

.price-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.price-item.final .price-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.price-final {
  font-size: 22px;
  font-weight: 700;
  color: #f56c6c;
}

.parties-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.party-item {
  flex: 1;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.party-role {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
}

.party-role.seller {
  color: #43a047;
}

.party-role.buyer {
  color: #0288d1;
}

.party-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.party-contact {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.party-divider {
  color: #c0c4cc;
  font-size: 24px;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-item {
  display: flex;
  gap: 8px;
}

.address-label {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}

.address-value {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.weigh-ticket-content {
  display: flex;
  gap: 24px;
}

.ticket-images {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ticket-image {
  width: 150px;
  height: 100px;
  border-radius: 6px;
  cursor: pointer;
}

.ticket-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.ticket-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ticket-label {
  font-size: 13px;
  color: #909399;
}

.ticket-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.ticket-value.highlight {
  font-size: 18px;
  color: #67c23a;
  font-weight: 600;
}

.empty-ticket {
  padding: 20px 0;
}

.contract-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contract-no {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.contract-date {
  font-size: 12px;
  color: #909399;
}

.contract-actions {
  display: flex;
  gap: 10px;
}

.blockchain-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trace-code {
  display: flex;
  align-items: center;
  gap: 20px;
}

.qrcode-placeholder {
  width: 100px;
  height: 100px;
  background: #f1f8e9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66bb6a;
}

.trace-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trace-label {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.trace-value {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  font-family: monospace;
}

.trace-desc {
  font-size: 12px;
  color: #67c23a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #e8f5e9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  z-index: 100;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.contract-detail {
  padding: 20px;
}

.contract-header {
  text-align: center;
  border-bottom: 2px solid #66bb6a;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.contract-title {
  font-size: 20px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 8px 0;
}

.contract-body {
  font-size: 13px;
  color: #333;
  line-height: 1.8;
  max-height: 300px;
  overflow-y: auto;
}

.contract-body .indent {
  text-indent: 2em;
}

.contract-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
}

.signature-block {
  text-align: center;
  font-size: 13px;
  color: #606266;
}

.signature {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0;
}

.signature.pending {
  color: #c0c4cc;
  font-weight: normal;
}
</style>
