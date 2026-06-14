<template>
  <div class="trace-query-container">
    <el-card class="search-card" shadow="never">
      <div class="search-header">
        <div class="search-title">
          <el-icon class="title-icon"><Connection /></el-icon>
          <h2>废弃物溯源查询</h2>
          <p>输入溯源编号，查询废弃物全生命周期流转信息</p>
        </div>
      </div>
      
      <div class="search-input-wrapper">
        <el-input
          v-model="traceCode"
          placeholder="请输入溯源编号，例如：TR2024061400001"
          size="large"
          clearable
          @keyup.enter="handleQuery"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" :loading="loading" @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询溯源
        </el-button>
      </div>

      <div class="quick-trace">
        <span class="quick-label">快速查询：</span>
        <el-tag
          v-for="code in quickCodes"
          :key="code"
          class="quick-tag"
          effect="plain"
          @click="quickQuery(code)"
        >
          {{ code }}
        </el-tag>
      </div>
    </el-card>

    <div v-if="traceResult" class="result-section">
      <el-card class="result-card basic-info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><Document /></el-icon>
            <span class="header-title">溯源基本信息</span>
            <el-tag type="success" effect="dark" class="verify-tag" @click="handleVerify">
              <el-icon><Lock /></el-icon>
              已存证
            </el-tag>
          </div>
        </template>
        
        <div class="basic-info-content">
          <div class="info-row">
            <div class="info-item">
              <label>溯源编号</label>
              <span class="info-value code-value">{{ traceResult.traceCode }}</span>
            </div>
            <div class="info-item">
              <label>废弃物名称</label>
              <span class="info-value">{{ traceResult.wasteName }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <label>分类</label>
              <el-tag type="primary" effect="light">{{ traceResult.category }}</el-tag>
            </div>
            <div class="info-item">
              <label>总重量</label>
              <span class="info-value highlight">{{ traceResult.totalWeight }} 吨</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <label>危废代码</label>
              <span class="info-value">{{ traceResult.hazardousCode || '无' }}</span>
            </div>
            <div class="info-item">
              <label>当前状态</label>
              <el-tag type="success" effect="dark">{{ traceResult.status }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="result-card timeline-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><TrendCharts /></el-icon>
            <span class="header-title">流转时间线</span>
            <span class="header-subtitle">全流程区块链存证 · 数据不可篡改</span>
          </div>
        </template>

        <div class="timeline-wrapper">
          <el-steps :active="traceResult.timeline.length" finish-status="success" direction="vertical">
            <el-step
              v-for="(step, index) in traceResult.timeline"
              :key="index"
              :title="step.title"
              :description="step.time"
            >
              <template #icon>
                <div class="step-icon" :class="`step-${index + 1}`">
                  <el-icon><component :is="step.icon" /></el-icon>
                </div>
              </template>
              <template #description>
                <div class="step-content">
                  <div class="step-time">{{ step.time }}</div>
                  <div class="step-details">
                    <div class="detail-item">
                      <span class="detail-label">责任主体：</span>
                      <span>{{ step.organization }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">负责人：</span>
                      <span>{{ step.person }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">重量：</span>
                      <span class="weight-value">{{ step.weight }} 吨</span>
                    </div>
                    <div v-if="step.location" class="detail-item">
                      <span class="detail-label">地点：</span>
                      <span>{{ step.location }}</span>
                    </div>
                    <div v-if="step.hash" class="detail-item hash-item">
                      <span class="detail-label">存证哈希：</span>
                      <span class="hash-text">{{ step.hash }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-step>
          </el-steps>
        </div>
      </el-card>

      <el-card class="result-card blockchain-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><Coin /></el-icon>
            <span class="header-title">区块链存证信息</span>
          </div>
        </template>

        <div class="blockchain-info">
          <div class="chain-stats">
            <div class="chain-stat-item">
              <div class="stat-icon icon-1">
                <el-icon><Histogram /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">区块高度</div>
                <div class="stat-value">{{ traceResult.blockHeight }}</div>
              </div>
            </div>
            <div class="chain-stat-item">
              <div class="stat-icon icon-2">
                <el-icon><Link /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">交易哈希</div>
                <div class="stat-value hash-value">{{ traceResult.txHash }}</div>
              </div>
            </div>
            <div class="chain-stat-item">
              <div class="stat-icon icon-3">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">上链时间</div>
                <div class="stat-value">{{ traceResult.chainTime }}</div>
              </div>
            </div>
            <div class="chain-stat-item">
              <div class="stat-icon icon-4">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-label">存证状态</div>
                <div class="stat-value success">已确认</div>
              </div>
            </div>
          </div>

          <div class="verify-section">
            <el-button type="primary" size="large" @click="handleVerify">
              <el-icon><Key /></el-icon>
              验证存证真实性
            </el-button>
            <p class="verify-tip">点击验证按钮，可对区块链存证数据进行真实性校验</p>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="hasQueried && !traceResult" description="未查询到相关溯源信息" />

    <el-dialog v-model="verifyDialogVisible" title="区块链存证验证" width="520px">
      <div class="verify-dialog-content">
        <div v-if="verifying" class="verifying-animation">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>正在验证存证数据...</p>
        </div>
        <div v-else-if="verifySuccess" class="verify-success">
          <div class="success-icon">
            <el-icon :size="64"><CircleCheck /></el-icon>
          </div>
          <h3>存证验证通过</h3>
          <p class="success-desc">该溯源记录已在区块链上存证，数据真实有效，不可篡改。</p>
          <div class="verify-details">
            <div class="verify-item">
              <span class="verify-label">区块高度：</span>
              <span>{{ traceResult?.blockHeight }}</span>
            </div>
            <div class="verify-item">
              <span class="verify-label">交易哈希：</span>
              <span class="hash-text">{{ traceResult?.txHash }}</span>
            </div>
            <div class="verify-item">
              <span class="verify-label">验证时间：</span>
              <span>{{ verifyTime }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Connection, Document, Lock, TrendCharts,
  Coin, Histogram, Link, Clock, Key,
  Building, Van, Factory, Loading, CircleCheck
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const traceCode = ref('')
const loading = ref(false)
const traceResult = ref(null)
const hasQueried = ref(false)
const verifyDialogVisible = ref(false)
const verifying = ref(false)
const verifySuccess = ref(false)
const verifyTime = ref('')

const quickCodes = [
  'TR2024061400001',
  'TR2024061300025',
  'TR2024061200078'
]

const mockResult = {
  traceCode: 'TR2024061400001',
  wasteName: '工业废铁边角料',
  category: '工业边角料',
  totalWeight: 25.5,
  hazardousCode: '—',
  status: '已处理完成',
  blockHeight: 1285673,
  txHash: '0x7f9a2b4c8d3e1f5a7b9c2d4e6f8a1b3c5d7e9f2a4b6c8d0e2f4a6b8c0d2e4f6a',
  chainTime: '2024-06-14 15:30:00',
  timeline: [
    {
      title: '产废方产出',
      icon: markRaw(Building),
      time: '2024-06-10 09:00:00',
      organization: '苏州精密制造有限公司',
      person: '张建国',
      weight: 25.5,
      location: '江苏省苏州市工业园区',
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b'
    },
    {
      title: '收废商收集',
      icon: markRaw(Van),
      time: '2024-06-11 14:30:00',
      organization: '鑫源金属回收有限公司',
      person: '李志强',
      weight: 25.3,
      location: '江苏省苏州市',
      hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c'
    },
    {
      title: '利废厂处理',
      icon: markRaw(Factory),
      time: '2024-06-14 10:00:00',
      organization: '绿源再生资源有限公司',
      person: '王建华',
      weight: 25.0,
      location: '浙江省宁波市北仑区',
      hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d'
    }
  ]
}

const handleQuery = async () => {
  if (!traceCode.value.trim()) {
    ElMessage.warning('请输入溯源编号')
    return
  }
  
  loading.value = true
  hasQueried.value = true
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (traceCode.value.startsWith('TR2024')) {
    traceResult.value = { ...mockResult, traceCode: traceCode.value }
  } else {
    traceResult.value = null
  }
  
  loading.value = false
}

const quickQuery = (code) => {
  traceCode.value = code
  handleQuery()
}

const handleVerify = async () => {
  verifyDialogVisible.value = true
  verifying.value = true
  verifySuccess.value = false
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  verifying.value = false
  verifySuccess.value = true
  verifyTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style scoped>
.trace-query-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: none;
  border-radius: 16px;
}

.search-card :deep(.el-card__body) {
  padding: 40px 50px;
}

.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 48px;
  color: #43a047;
}

.search-title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2e7d32;
}

.search-title p {
  margin: 0;
  font-size: 14px;
  color: #558b2f;
  opacity: 0.8;
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  max-width: 700px;
  margin: 0 auto 24px;
}

.search-input-wrapper :deep(.el-input) {
  flex: 1;
}

.quick-trace {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 13px;
  color: #558b2f;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-tag:hover {
  background: #43a047;
  color: #fff;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card {
  border-radius: 12px;
  border: 1px solid #e8f5e9;
}

.result-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: #f1f8e9;
  border-bottom: 1px solid #e8f5e9;
}

.result-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
  color: #43a047;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.header-subtitle {
  font-size: 12px;
  color: #909399;
}

.verify-tag {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.basic-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
}

.info-value.code-value {
  font-family: 'Courier New', monospace;
  color: #43a047;
  font-size: 16px;
}

.info-value.highlight {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}

.timeline-wrapper {
  padding: 10px 20px;
}

.timeline-wrapper :deep(.el-steps) {
  --el-steps-border-width: 2px;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
}

.step-1 {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.step-2 {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.step-3 {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.step-content {
  padding: 8px 0 24px 16px;
}

.step-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
}

.step-details {
  background: #f9fbe7;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #e8f5e9;
}

.detail-item {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  line-height: 1.6;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #909399;
}

.weight-value {
  color: #43a047;
  font-weight: 600;
}

.hash-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.hash-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #7b1fa2;
  word-break: break-all;
  flex: 1;
}

.blockchain-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chain-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.chain-stat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f9fbe7;
  border-radius: 10px;
  border: 1px solid #e8f5e9;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  flex-shrink: 0;
}

.icon-1 {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.icon-2 {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.icon-3 {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.icon-4 {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value.hash-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.stat-value.success {
  color: #67c23a;
}

.verify-section {
  text-align: center;
  padding-top: 10px;
  border-top: 1px dashed #e0e0e0;
}

.verify-section .el-button {
  min-width: 200px;
}

.verify-tip {
  margin: 12px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.verify-dialog-content {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.verifying-animation {
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: #43a047;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.verifying-animation p {
  margin-top: 16px;
  font-size: 15px;
  color: #606266;
}

.verify-success {
  text-align: center;
}

.success-icon {
  color: #67c23a;
  margin-bottom: 16px;
}

.verify-success h3 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #303133;
}

.success-desc {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #909399;
}

.verify-details {
  text-align: left;
  background: #f0f9ff;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #e0f2fe;
}

.verify-item {
  display: flex;
  font-size: 13px;
  margin-bottom: 8px;
  color: #606266;
}

.verify-item:last-child {
  margin-bottom: 0;
}

.verify-label {
  flex-shrink: 0;
  color: #909399;
  margin-right: 8px;
}

.verify-item .hash-text {
  font-size: 12px;
  color: #7b1fa2;
}
</style>
