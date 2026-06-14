<template>
  <div class="weigh-ticket-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" text @click="handleBack">
          返回列表
        </el-button>
        <span class="page-title">电子磅单详情</span>
        <el-tag :type="statusTypeMap[ticketDetail.status]" effect="light" size="large">
          {{ statusTextMap[ticketDetail.status] }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button :icon="Printer" @click="handlePrint">
          打印磅单
        </el-button>
        <el-button
          v-if="ticketDetail.status === 'draft'"
          type="primary"
          :icon="Check"
          @click="handleConfirm"
        >
          确认磅单
        </el-button>
        <el-button
          v-if="ticketDetail.status === 'confirmed'"
          type="success"
          :icon="Key"
          @click="handleBlockchainCert"
        >
          区块链存证
        </el-button>
      </div>
    </div>

    <div class="ticket-wrapper">
      <div class="ticket-card" ref="ticketCardRef">
        <div class="ticket-header">
          <div class="ticket-title">
            <h2>电子磅单</h2>
            <p>ELECTRONIC WEIGH TICKET</p>
          </div>
          <div class="ticket-logo">
            <div class="logo-icon">
              <el-icon><Scale /></el-icon>
            </div>
            <span>绿源称重</span>
          </div>
        </div>

        <div class="ticket-info">
          <div class="info-row">
            <div class="info-item">
              <span class="label">磅单编号</span>
              <span class="value">{{ ticketDetail.ticketNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">关联订单</span>
              <span class="value">{{ ticketDetail.orderNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">称重时间</span>
              <span class="value">{{ ticketDetail.weighTime }}</span>
            </div>
          </div>
        </div>

        <div class="ticket-section">
          <div class="section-title">车辆信息</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">车牌号</span>
                <span class="value">{{ ticketDetail.vehicleNo }}</span>
              </div>
              <div class="info-item">
                <span class="label">车辆类型</span>
                <span class="value">{{ ticketDetail.vehicleType }}</span>
              </div>
              <div class="info-item">
                <span class="label">司机姓名</span>
                <span class="value">{{ ticketDetail.driverName }}</span>
              </div>
              <div class="info-item">
                <span class="label">司机电话</span>
                <span class="value">{{ ticketDetail.driverPhone }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-section">
          <div class="section-title">废弃物信息</div>
          <div class="section-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">废弃物名称</span>
                <span class="value">{{ ticketDetail.wasteName }}</span>
              </div>
              <div class="info-item">
                <span class="label">规格</span>
                <span class="value">{{ ticketDetail.spec || '统货' }}</span>
              </div>
              <div class="info-item">
                <span class="label">单位</span>
                <span class="value">吨</span>
              </div>
              <div class="info-item">
                <span class="label">单价</span>
                <span class="value highlight">¥{{ ticketDetail.unitPrice }}/吨</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-section weight-section">
          <div class="section-title">重量信息</div>
          <div class="section-content">
            <div class="weight-display">
              <div class="weight-item">
                <div class="weight-label">毛 重</div>
                <div class="weight-value">
                  <span class="number">{{ ticketDetail.grossWeight }}</span>
                  <span class="unit">吨</span>
                </div>
                <div class="weight-time">{{ ticketDetail.grossWeighTime || '过毛时间' }}</div>
              </div>
              <div class="weight-minus">
                <el-icon><Minus /></el-icon>
              </div>
              <div class="weight-item">
                <div class="weight-label">皮 重</div>
                <div class="weight-value">
                  <span class="number">{{ ticketDetail.tareWeight }}</span>
                  <span class="unit">吨</span>
                </div>
                <div class="weight-time">{{ ticketDetail.tareWeighTime || '过皮时间' }}</div>
              </div>
              <div class="weight-equals">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="weight-item net">
                <div class="weight-label">净 重</div>
                <div class="weight-value">
                  <span class="number">{{ ticketDetail.netWeight }}</span>
                  <span class="unit">吨</span>
                </div>
                <div class="weight-time">结算重量</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ticket-section amount-section">
          <div class="amount-row">
            <span class="amount-label">总金额</span>
            <span class="amount-value">
              <span class="currency">¥</span>
              <span class="amount">{{ ticketDetail.totalAmount?.toLocaleString() }}</span>
            </span>
          </div>
          <div class="amount-words">
            大写金额：{{ amountInWords }}
          </div>
        </div>

        <div class="ticket-footer">
          <div class="footer-item">
            <span class="label">司磅员</span>
            <span class="value">{{ ticketDetail.weigher }}</span>
          </div>
          <div class="footer-item">
            <span class="label">所属收废商</span>
            <span class="value">{{ ticketDetail.collector || '绿源回收有限公司' }}</span>
          </div>
          <div class="footer-item">
            <span class="label">打印时间</span>
            <span class="value">{{ currentTime }}</span>
          </div>
        </div>

        <div class="ticket-stamps">
          <div v-if="ticketDetail.status === 'confirmed' || ticketDetail.status === 'certified'" class="stamp confirmed">
            已确认
          </div>
          <div v-if="ticketDetail.status === 'certified'" class="stamp certified">
            区块链存证
          </div>
        </div>
      </div>

      <el-card class="image-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">磅单照片</span>
            <el-button type="primary" :icon="Upload" size="small" @click="uploadDialogVisible = true">
              上传照片
            </el-button>
          </div>
        </template>
        <div v-if="ticketImages.length > 0" class="image-list">
          <div
            v-for="(img, index) in ticketImages"
            :key="index"
            class="image-item"
          >
            <el-image
              :src="img"
              fit="cover"
              class="ticket-image"
              :preview-src-list="ticketImages"
              :initial-index="index"
            />
          </div>
        </div>
        <el-empty v-else description="暂无磅单照片，请点击上传" />
      </el-card>
    </div>

    <el-dialog v-model="uploadDialogVisible" title="上传磅单照片" width="600px">
      <div class="upload-container">
        <el-upload
          v-model:file-list="uploadFileList"
          list-type="picture-card"
          :auto-upload="false"
          :limit="5"
          multiple
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">最多上传5张磅单照片，支持 jpg、png 格式</div>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="confirmUpload">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Printer, Check, Key, Scale, Minus, Plus, Upload
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const ticketCardRef = ref(null)
const uploadDialogVisible = ref(false)
const uploadFileList = ref([])
const uploadLoading = ref(false)

const statusTypeMap = {
  draft: 'info',
  confirmed: 'success',
  certified: 'primary'
}

const statusTextMap = {
  draft: '草稿',
  confirmed: '已确认',
  certified: '已存证'
}

const ticketDetail = ref({
  id: 1,
  ticketNo: 'BD202406140001',
  orderNo: 'DD202406140001',
  wasteName: '废旧纸箱一批',
  spec: '统货',
  grossWeight: 5.2,
  tareWeight: 1.8,
  netWeight: 3.4,
  unitPrice: 1200,
  totalAmount: 4080,
  vehicleNo: '京A·88888',
  vehicleType: '厢式货车',
  driverName: '张师傅',
  driverPhone: '138****8888',
  weigher: '李司磅',
  collector: '绿源回收有限公司',
  weighTime: '2024-06-14 14:30:25',
  grossWeighTime: '14:25:10',
  tareWeighTime: '14:28:35',
  status: 'certified'
})

const ticketImages = ref([
  'https://via.placeholder.com/300x200/e8f5e9/66bb6a?text=Weigh+Ticket+1',
  'https://via.placeholder.com/300x200/c8e6c9/43a047?text=Weigh+Ticket+2'
])

const currentTime = computed(() => {
  const now = new Date()
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

const amountInWords = computed(() => {
  const amount = ticketDetail.value.totalAmount || 0
  return convertToChineseAmount(amount)
})

const convertToChineseAmount = (amount) => {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟', '万', '拾万', '佰万', '仟万', '亿']
  
  let result = ''
  const intPart = Math.floor(amount)
  const decPart = Math.round((amount - intPart) * 100)
  
  if (intPart === 0) {
    result = '零元'
  } else {
    const intStr = intPart.toString()
    let zeroFlag = false
    for (let i = 0; i < intStr.length; i++) {
      const digit = parseInt(intStr[i])
      const unitIndex = intStr.length - 1 - i
      if (digit === 0) {
        zeroFlag = true
      } else {
        if (zeroFlag) {
          result += '零'
          zeroFlag = false
        }
        result += digits[digit] + units[unitIndex]
      }
      if (unitIndex === 4 && result !== '') {
        result += '万'
      }
    }
    result += '元'
  }
  
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10)
    const fen = decPart % 10
    if (jiao > 0) {
      result += digits[jiao] + '角'
    } else {
      result += '零'
    }
    if (fen > 0) {
      result += digits[fen] + '分'
    }
  } else {
    result += '整'
  }
  
  return result
}

const handleBack = () => {
  router.push('/collector/weigh-tickets')
}

const handlePrint = () => {
  ElMessage.success('正在准备打印...')
}

const handleConfirm = async () => {
  try {
    await ElMessageBox.confirm(
      '确认磅单信息无误吗？确认后磅单将生效，不可修改。',
      '确认磅单',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('磅单已确认')
    ticketDetail.value.status = 'confirmed'
  } catch (err) {
    if (err === 'cancel') return
  }
}

const handleBlockchainCert = async () => {
  try {
    await ElMessageBox.confirm(
      '确定将磅单信息上链存证吗？上链后数据不可篡改。',
      '区块链存证',
      {
        confirmButtonText: '确认存证',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.success('区块链存证成功')
    ticketDetail.value.status = 'certified'
  } catch (err) {
    if (err === 'cancel') return
  }
}

const confirmUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请至少上传一张照片')
    return
  }
  uploadLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('照片上传成功')
    uploadDialogVisible.value = false
  } finally {
    uploadLoading.value = false
  }
}

onMounted(() => {
  const id = route.params.id
})
</script>

<style scoped>
.weigh-ticket-detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.ticket-wrapper {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
}

.ticket-card {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  border: 1px solid #e8f5e9;
}

.ticket-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #43a047, #66bb6a, #81c784);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px dashed #c8e6c9;
  margin-bottom: 20px;
}

.ticket-title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2e7d32;
  letter-spacing: 4px;
}

.ticket-title p {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #909399;
  letter-spacing: 2px;
}

.ticket-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #43a047;
}

.logo-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #66bb6a, #43a047);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.ticket-logo span {
  font-size: 12px;
  font-weight: 600;
}

.ticket-info {
  margin-bottom: 20px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.info-item .value.highlight {
  color: #43a047;
  font-weight: 600;
}

.ticket-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #43a047;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8f5e9;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #43a047;
  border-radius: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.weight-section .section-content {
  padding: 16px 0;
}

.weight-display {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.weight-item {
  text-align: center;
  flex: 1;
}

.weight-item.net {
  padding: 20px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 8px;
}

.weight-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.weight-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.weight-value .number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.weight-item.net .weight-value .number {
  color: #2e7d32;
  font-size: 32px;
}

.weight-value .unit {
  font-size: 14px;
  color: #909399;
}

.weight-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.weight-minus,
.weight-equals {
  font-size: 24px;
  color: #c0c4cc;
  padding: 0 10px;
}

.amount-section {
  background: linear-gradient(135deg, #f1f8e9, #e8f5e9);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: baseline;
}

.amount-value .currency {
  font-size: 18px;
  color: #e6a23c;
  margin-right: 4px;
}

.amount-value .amount {
  font-size: 36px;
  font-weight: 700;
  color: #e6a23c;
}

.amount-words {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  text-align: right;
}

.ticket-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-top: 20px;
  border-top: 2px dashed #c8e6c9;
}

.footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-item .label {
  font-size: 12px;
  color: #909399;
}

.footer-item .value {
  font-size: 13px;
  color: #606266;
}

.ticket-stamps {
  position: absolute;
  top: 50%;
  right: 60px;
  transform: translateY(-50%) rotate(-15deg);
  display: flex;
  flex-direction: column;
  gap: 20px;
  pointer-events: none;
}

.stamp {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  opacity: 0.3;
  border: 3px solid;
}

.stamp.confirmed {
  color: #67c23a;
  border-color: #67c23a;
}

.stamp.certified {
  color: #409eff;
  border-color: #409eff;
}

.image-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  width: 100%;
}

.ticket-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  cursor: pointer;
}

.upload-container {
  padding: 10px 0;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 12px;
  text-align: center;
}
</style>
