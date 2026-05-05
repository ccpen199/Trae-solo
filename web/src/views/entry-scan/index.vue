<template>
  <div class="scan-container">
    <div class="page-header">
      <h2 class="page-title">入场扫描</h2>
      <p class="page-desc">扫描条码进行入场核验</p>
    </div>
    
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <div class="card-container scan-input-area">
          <h3 class="area-title">扫码输入</h3>
          
          <div class="barcode-input-wrapper">
            <el-input
              ref="barcodeInputRef"
              v-model="barcodeInput"
              placeholder="请扫描条码或手动输入"
              size="large"
              @keyup.enter="handleScan"
              clearable
            >
              <template #prefix>
                <el-icon :size="20"><QRCode /></el-icon>
              </template>
              <template #suffix>
                <el-button type="primary" @click="handleScan" :loading="scanning">
                  确认
                </el-button>
              </template>
            </el-input>
          </div>
          
          <div class="scan-tips mt-20">
            <el-alert
              title="使用说明"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <ul class="tips-list">
                  <li>• 将条码对准手持机扫描窗口进行扫描</li>
                  <li>• 或手动输入条码编号后按回车确认</li>
                  <li>• 系统自动验证条码有效性并记录入场</li>
                  <li>• 同一条码多次扫描会提示已入场</li>
                </ul>
              </template>
            </el-alert>
          </div>
          
          <div class="quick-actions mt-20">
            <el-button type="warning" @click="handleOfflineMode" :disabled="offlineMode">
              <el-icon><Connection /></el-icon>{{ offlineMode ? '离线模式' : '切换离线模式' }}
            </el-button>
            <el-button type="info" @click="handleSyncOffline" :disabled="!offlineMode">
              <el-icon><Upload /></el-icon>同步离线数据
            </el-button>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <div class="card-container result-area">
          <h3 class="area-title">扫描结果</h3>
          
          <div v-if="scanResult" class="scan-result" :class="scanResultType">
            <div class="result-header">
              <el-icon :size="40">
                <CircleCheckFilled v-if="scanResultType === 'success'" class="success-icon" />
                <CircleCloseFilled v-else-if="scanResultType === 'error'" class="error-icon" />
                <WarningFilled v-else class="warning-icon" />
              </el-icon>
              <h4>{{ scanResult.message }}</h4>
            </div>
            
            <el-divider v-if="scanResultType === 'success'" />
            
            <div v-if="scanResultType === 'success' && scanResult.data" class="result-details">
              <div class="detail-item">
                <span class="label">条码:</span>
                <span class="value">{{ scanResult.data.barcode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">姓名:</span>
                <span class="value">{{ scanResult.data.name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">部门:</span>
                <span class="value">{{ scanResult.data.departmentName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">入场次数:</span>
                <span class="value">{{ scanResult.data.entryCount }} / {{ scanResult.data.maxEntryCount }}</span>
              </div>
              <div class="detail-item">
                <span class="label">入场时间:</span>
                <span class="value">{{ formatTime(scanResult.data.enteredAt) }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-result">
            <el-icon :size="60"><Monitor /></el-icon>
            <p>等待扫描...</p>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row class="mt-20">
      <el-col :span="24">
        <div class="card-container">
          <h3 class="area-title">今日入场记录 ({{ todayCount }} 条)</h3>
          <el-table :data="recentEntries" style="width: 100%" v-loading="loading">
            <el-table-column prop="barcode" label="条码" width="150" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="departmentName" label="部门" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'success' ? 'success' : 'warning'">
                  {{ scope.row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="结果" min-width="200" />
            <el-table-column prop="enteredAt" label="时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.enteredAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const barcodeInputRef = ref(null)
const barcodeInput = ref('')
const scanning = ref(false)
const offlineMode = ref(false)
const scanResult = ref(null)
const scanResultType = ref('')
const loading = ref(false)
const recentEntries = ref([])
const todayCount = ref(0)

const offlineRecords = ref([])

const scanResultType = computed(() => {
  if (!scanResult.value) return ''
  if (scanResult.value.success) return 'success'
  if (scanResult.value.code === 'ALREADY_ENTERED' || scanResult.value.code === 'DUPLICATE_SCAN') return 'warning'
  return 'error'
})

async function fetchRecentEntries() {
  loading.value = true
  try {
    const res = await request.get('/api/entries/recent', { params: { limit: 20 } })
    if (res.success) {
      recentEntries.value = res.data || []
      todayCount.value = res.data?.length || 0
    }
  } catch (error) {
    console.error('Failed to fetch entries:', error)
  } finally {
    loading.value = false
  }
}

async function handleScan() {
  if (!barcodeInput.value.trim()) {
    ElMessage.warning('请输入条码')
    return
  }
  
  scanning.value = true
  scanResult.value = null
  
  try {
    const data = {
      barcode: barcodeInput.value.trim(),
      deviceId: localStorage.getItem('deviceId') || null
    }
    
    let result
    if (offlineMode.value) {
      result = handleOfflineScan(data)
    } else {
      const res = await request.post('/api/entries/scan', data)
      result = res
    }
    
    scanResult.value = result
    barcodeInput.value = ''
    
    if (result.success) {
      fetchRecentEntries()
    }
    
    await nextTick()
    barcodeInputRef.value?.focus()
  } catch (error) {
    console.error('Scan error:', error)
    scanResult.value = {
      success: false,
      message: error.response?.data?.message || '扫描失败，请稍后重试'
    }
  } finally {
    scanning.value = false
  }
}

function handleOfflineScan(data) {
  const record = {
    id: Date.now().toString(),
    barcode: data.barcode,
    scannedAt: new Date().toISOString(),
    type: 'entry',
    status: 'pending'
  }
  offlineRecords.value.push(record)
  
  return {
    success: true,
    message: '离线扫描成功，等待同步',
    data: {
      barcode: data.barcode,
      name: '离线扫描',
      departmentName: '待同步',
      entryCount: 0,
      maxEntryCount: 1,
      enteredAt: record.scannedAt
    }
  }
}

function handleOfflineMode() {
  offlineMode.value = !offlineMode.value
  ElMessage.info(offlineMode.value ? '已切换到离线模式' : '已切换到在线模式')
}

async function handleSyncOffline() {
  if (offlineRecords.value.length === 0) {
    ElMessage.info('没有待同步的离线数据')
    return
  }
  
  ElMessage.info(`正在同步 ${offlineRecords.value.length} 条数据...`)
  
  try {
    const res = await request.post('/api/entries/sync-offline', {
      records: offlineRecords.value
    })
    
    if (res.success) {
      ElMessage.success(`同步成功，共 ${res.data.count} 条`)
      offlineRecords.value = []
      offlineMode.value = false
      fetchRecentEntries()
    }
  } catch (error) {
    ElMessage.error('同步失败，请检查网络连接')
  }
}

function formatTime(time) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchRecentEntries()
  nextTick(() => {
    barcodeInputRef.value?.focus()
  })
})
</script>

<style scoped lang="scss">
.scan-container {
  .area-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20px;
  }
  
  .barcode-input-wrapper {
    :deep(.el-input__inner) {
      font-size: 18px;
      letter-spacing: 2px;
    }
  }
  
  .tips-list {
    margin-top: 10px;
    line-height: 1.8;
    color: #606266;
  }
  
  .quick-actions {
    display: flex;
    gap: 10px;
  }
  
  .result-area {
    min-height: 300px;
  }
  
  .scan-result {
    text-align: center;
    
    .result-header {
      .success-icon {
        color: #67C23A;
      }
      
      .error-icon {
        color: #F56C6C;
      }
      
      .warning-icon {
        color: #E6A23C;
      }
      
      h4 {
        margin-top: 10px;
        font-size: 18px;
        font-weight: 600;
      }
    }
    
    .result-details {
      text-align: left;
      padding: 0 20px;
      
      .detail-item {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          width: 100px;
          color: #909399;
        }
        
        .value {
          flex: 1;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
  
  .empty-result {
    text-align: center;
    padding: 60px 20px;
    color: #C0C4CC;
    
    p {
      margin-top: 15px;
      font-size: 16px;
    }
  }
}
</style>
