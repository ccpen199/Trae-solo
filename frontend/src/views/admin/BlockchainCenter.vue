<template>
  <div class="blockchain-center-container">
    <div class="stats-cards">
      <el-card class="stat-card stat-card-1" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">存证总数</p>
            <p class="stat-value">{{ stats.totalRecords.toLocaleString() }} <span class="stat-unit">条</span></p>
          </div>
          <div class="stat-icon">
            <el-icon :size="32"><Coin /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-2" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">今日存证</p>
            <p class="stat-value">{{ stats.todayRecords }} <span class="stat-unit">条</span></p>
          </div>
          <div class="stat-icon">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-3" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">区块高度</p>
            <p class="stat-value">{{ stats.blockHeight.toLocaleString() }}</p>
          </div>
          <div class="stat-icon">
            <el-icon :size="32"><Histogram /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-4" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">参与节点</p>
            <p class="stat-value">{{ stats.nodeCount }} <span class="stat-unit">个</span></p>
          </div>
          <div class="stat-icon">
            <el-icon :size="32"><Connection /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <div class="type-stats-section">
      <el-card class="type-stats-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">存证类型统计</span>
          </div>
        </template>
        <div class="type-grid">
          <div v-for="type in recordTypes" :key="type.value" class="type-item">
            <div class="type-icon" :class="`type-${type.value}`">
              <el-icon :size="24"><component :is="type.icon" /></el-icon>
            </div>
            <div class="type-info">
              <div class="type-name">{{ type.label }}</div>
              <div class="type-count">{{ type.count }} 条</div>
            </div>
            <div class="type-percent">{{ type.percent }}%</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">存证记录</span>
          <div class="header-actions">
            <el-select v-model="typeFilter" placeholder="类型筛选" style="width: 140px">
              <el-option label="全部类型" value="" />
              <el-option label="订单存证" value="order" />
              <el-option label="转移存证" value="transfer" />
              <el-option label="磅单存证" value="weigh" />
              <el-option label="合同存证" value="contract" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索关联编号、交易哈希"
              clearable
              style="width: 260px"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe>
        <el-table-column label="记录类型" width="120">
          <template #default="scope">
            <div class="type-cell">
              <el-icon :class="`type-icon-small type-${scope.row.type}`">
                <component :is="typeIconMap[scope.row.type]" />
              </el-icon>
              <span>{{ typeTextMap[scope.row.type] }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="relatedNo" label="关联编号" width="180" />
        <el-table-column prop="blockHeight" label="区块高度" width="130" />
        <el-table-column label="交易哈希" min-width="300">
          <template #default="scope">
            <span class="hash-text" :title="scope.row.txHash">{{ scope.row.txHash }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="存证时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleDetail(scope.row)">
                查看详情
              </el-button>
              <el-button type="success" link size="small" @click="handleVerify(scope.row)">
                验证
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-card class="chain-visual-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">区块链可视化</span>
          <el-tag type="success" effect="dark">实时同步中</el-tag>
        </div>
      </template>
      <div class="chain-visual">
        <div class="chain-blocks">
          <div
            v-for="(block, index) in recentBlocks"
            :key="index"
            class="chain-block"
            :class="{ active: index === 0 }"
          >
            <div class="block-header">
              <el-icon class="block-icon"><Coin /></el-icon>
              <span class="block-height">#{{ block.height }}</span>
            </div>
            <div class="block-hash" :title="block.hash">{{ block.hash }}</div>
            <div class="block-info">
              <span class="block-tx-count">{{ block.txCount }} 笔交易</span>
              <span class="block-time">{{ block.time }}</span>
            </div>
          </div>
        </div>
        <div class="chain-more">
          <el-icon><MoreFilled /></el-icon>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="存证详情" width="680px" class="blockchain-detail-dialog">
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-header">
          <div class="detail-type-badge" :class="`badge-${currentRecord.type}`">
            <el-icon><component :is="typeIconMap[currentRecord.type]" /></el-icon>
            <span>{{ typeTextMap[currentRecord.type] }}</span>
          </div>
          <el-tag type="success" effect="dark">
            <el-icon><Lock /></el-icon>
            已上链
          </el-tag>
        </div>

        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="区块高度">{{ currentRecord.blockHeight }}</el-descriptions-item>
          <el-descriptions-item label="存证时间">{{ currentRecord.createTime }}</el-descriptions-item>
          <el-descriptions-item label="关联编号">{{ currentRecord.relatedNo }}</el-descriptions-item>
          <el-descriptions-item label="数据大小">{{ currentRecord.dataSize }}</el-descriptions-item>
          <el-descriptions-item label="交易哈希" :span="2">
            <span class="hash-text">{{ currentRecord.txHash }}</span>
            <el-button type="primary" link size="small" @click="copyHash(currentRecord.txHash)">
              复制
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="前一区块哈希" :span="2">
            <span class="hash-text">{{ currentRecord.prevHash }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <div class="section-title">存证数据摘要</div>
          <div class="data-summary">
            <div v-for="(item, index) in currentRecord.summary" :key="index" class="summary-item">
              <span class="summary-label">{{ item.label }}：</span>
              <span class="summary-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="verify-section">
          <el-button type="primary" size="large" @click="handleVerify(currentRecord)">
            <el-icon><Key /></el-icon>
            验证存证真实性
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" title="存证验证结果" width="520px" class="verify-dialog">
      <div class="verify-content">
        <div v-if="verifying" class="verifying-animation">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>正在区块链网络中验证...</p>
          <div class="verify-steps">
            <div class="verify-step" :class="{ active: verifyStep >= 1 }">
              <el-icon v-if="verifyStep > 1"><CircleCheck /></el-icon>
              <span v-else class="step-num">1</span>
              <span class="step-text">连接区块链节点</span>
            </div>
            <div class="verify-step" :class="{ active: verifyStep >= 2 }">
              <el-icon v-if="verifyStep > 2"><CircleCheck /></el-icon>
              <span v-else class="step-num">2</span>
              <span class="step-text">查询交易记录</span>
            </div>
            <div class="verify-step" :class="{ active: verifyStep >= 3 }">
              <el-icon v-if="verifyStep > 3"><CircleCheck /></el-icon>
              <span v-else class="step-num">3</span>
              <span class="step-text">校验数据哈希</span>
            </div>
            <div class="verify-step" :class="{ active: verifyStep >= 4 }">
              <el-icon v-if="verifyStep > 4"><CircleCheck /></el-icon>
              <span v-else class="step-num">4</span>
              <span class="step-text">生成验证报告</span>
            </div>
          </div>
        </div>
        <div v-else-if="verifySuccess" class="verify-success">
          <div class="success-icon">
            <el-icon :size="72"><CircleCheck /></el-icon>
          </div>
          <h3>存证验证通过</h3>
          <p class="success-desc">该存证记录已在区块链上确认，数据真实有效，不可篡改。</p>
          <div class="verify-details">
            <div class="verify-item">
              <span class="verify-label">区块高度：</span>
              <span>{{ currentRecord?.blockHeight }}</span>
            </div>
            <div class="verify-item">
              <span class="verify-label">确认数：</span>
              <span class="success-text">12 个确认</span>
            </div>
            <div class="verify-item">
              <span class="verify-label">交易哈希：</span>
              <span class="hash-text">{{ currentRecord?.txHash }}</span>
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
import { ref, reactive, computed, markRaw, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Coin, TrendCharts, Histogram, Connection,
  Search, Document, Transfer, Scale, File,
  Lock, Key, Loading, CircleCheck, MoreFilled
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const searchKeyword = ref('')
const typeFilter = ref('')
const detailDialogVisible = ref(false)
const verifyDialogVisible = ref(false)
const currentRecord = ref(null)
const verifying = ref(false)
const verifySuccess = ref(false)
const verifyStep = ref(0)
const verifyTime = ref('')

const stats = ref({
  totalRecords: 42358,
  todayRecords: 128,
  blockHeight: 1285673,
  nodeCount: 12
})

const recordTypes = ref([
  { value: 'order', label: '订单存证', count: 18652, percent: 44, icon: markRaw(Document) },
  { value: 'transfer', label: '转移存证', count: 12368, percent: 29, icon: markRaw(Transfer) },
  { value: 'weigh', label: '磅单存证', count: 8526, percent: 20, icon: markRaw(Scale) },
  { value: 'contract', label: '合同存证', count: 2812, percent: 7, icon: markRaw(File) }
])

const typeIconMap = {
  order: markRaw(Document),
  transfer: markRaw(Transfer),
  weigh: markRaw(Scale),
  contract: markRaw(File)
}

const typeTextMap = {
  order: '订单存证',
  transfer: '转移存证',
  weigh: '磅单存证',
  contract: '合同存证'
}

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: ''
})

const recordList = ref([
  {
    id: 1,
    type: 'order',
    relatedNo: 'DD202406140001',
    blockHeight: 1285673,
    txHash: '0x7f9a2b4c8d3e1f5a7b9c2d4e6f8a1b3c5d7e9f2a4b6c8d0e2f4a6b8c0d2e4f6a',
    prevHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    createTime: '2024-06-14 15:30:00',
    dataSize: '2.3KB',
    summary: [
      { label: '订单号', value: 'DD202406140001' },
      { label: '废弃物类型', value: '废塑料' },
      { label: '重量', value: '12.5吨' },
      { label: '金额', value: '¥8,750' },
      { label: '买方', value: '绿源再生资源' },
      { label: '卖方', value: '鑫源回收' }
    ]
  },
  {
    id: 2,
    type: 'transfer',
    relatedNo: 'ZY20240614002',
    blockHeight: 1285672,
    txHash: '0x6e8b1c3d7a2f4e6b9c0d8f2a4b6c8d0e2f4a6b8c0d2e4f6a7b9c2d4e6f8a1b3c',
    prevHash: '0x7f9a2b4c8d3e1f5a7b9c2d4e6f8a1b3c5d7e9f2a4b6c8d0e2f4a6b8c0d2e4f6a',
    createTime: '2024-06-14 14:25:00',
    dataSize: '3.1KB',
    summary: [
      { label: '联单编号', value: 'ZY20240614002' },
      { label: '废弃物', value: '废矿物油 HW08' },
      { label: '重量', value: '15.5吨' },
      { label: '移出地', value: '江苏省' },
      { label: '接收地', value: '浙江省' },
      { label: '运输单位', value: '安捷危险品运输' }
    ]
  },
  {
    id: 3,
    type: 'weigh',
    relatedNo: 'BD20240614003',
    blockHeight: 1285671,
    txHash: '0x5d7a1f4b8c2e6a9d0f3c7e1b5d8a2f4c6e9b0d2f4a6c8e1b3d5f7a9c2e4b6d8f',
    prevHash: '0x6e8b1c3d7a2f4e6b9c0d8f2a4b6c8d0e2f4a6b8c0d2e4f6a7b9c2d4e6f8a1b3c',
    createTime: '2024-06-14 13:10:00',
    dataSize: '1.8KB',
    summary: [
      { label: '磅单号', value: 'BD20240614003' },
      { label: '物资名称', value: '废钢铁' },
      { label: '毛重', value: '25.8吨' },
      { label: '皮重', value: '12.3吨' },
      { label: '净重', value: '13.5吨' },
      { label: '司磅员', value: '王师傅' }
    ]
  },
  {
    id: 4,
    type: 'contract',
    relatedNo: 'HT20240614004',
    blockHeight: 1285670,
    txHash: '0x4c6e0a3d7b2f5c8e1d4a6f9b0e3c5d7a1f4b8c2e6a9d0f3b7e1c5a8d2f4b7e9c',
    prevHash: '0x5d7a1f4b8c2e6a9d0f3c7e1b5d8a2f4c6e9b0d2f4a6c8e1b3d5f7a9c2e4b6d8f',
    createTime: '2024-06-14 10:45:00',
    dataSize: '4.5KB',
    summary: [
      { label: '合同编号', value: 'HT20240614004' },
      { label: '合同类型', value: '年度回收合同' },
      { label: '甲方', value: '华盛纸业' },
      { label: '乙方', value: '绿源再生资源' },
      { label: '合同金额', value: '¥1,200,000' },
      { label: '有效期', value: '2024.06-2025.06' }
    ]
  },
  {
    id: 5,
    type: 'order',
    relatedNo: 'DD20240613005',
    blockHeight: 1285665,
    txHash: '0x3b5d9f1a7c3e5b8d0f2c6a9e1b4d7f2c5a8e0b3d6f9c1e4a7b2d6f8c0e3a5b7d',
    prevHash: '0x4c6e0a3d7b2f5c8e1d4a6f9b0e3c5d7a1f4b8c2e6a9d0f3b7e1c5a8d2f4b7e9c',
    createTime: '2024-06-13 16:20:00',
    dataSize: '2.1KB',
    summary: [
      { label: '订单号', value: 'DD20240613005' },
      { label: '废弃物类型', value: '废纸' },
      { label: '重量', value: '25.6吨' },
      { label: '金额', value: '¥5,120' },
      { label: '买方', value: '华丰纸业' },
      { label: '卖方', value: '顺达回收' }
    ]
  },
  {
    id: 6,
    type: 'transfer',
    relatedNo: 'ZY20240613006',
    blockHeight: 1285663,
    txHash: '0x2a4c8e0b6d3f7a2c5e8b1d4f6a9c0e3b5d7f1a4c6e8b0d2f5a7c9e1b3d6f8a2c',
    prevHash: '0x3b5d9f1a7c3e5b8d0f2c6a9e1b4d7f2c5a8e0b3d6f9c1e4a7b2d6f8c0e3a5b7d',
    createTime: '2024-06-13 14:10:00',
    dataSize: '2.9KB',
    summary: [
      { label: '联单编号', value: 'ZY20240613006' },
      { label: '废弃物', value: '电镀污泥 HW17' },
      { label: '重量', value: '8.2吨' },
      { label: '移出地', value: '上海市' },
      { label: '接收地', value: '江苏省' },
      { label: '运输单位', value: '申联危化运输' }
    ]
  },
  {
    id: 7,
    type: 'weigh',
    relatedNo: 'BD20240613007',
    blockHeight: 1285661,
    txHash: '0x1e5a7c2f8b3d6a9e0c4f7b2d5e8a1c3f6d9b0e2a4c7f1d3b6e8a0c2f5d7b9e1c',
    prevHash: '0x2a4c8e0b6d3f7a2c5e8b1d4f6a9c0e3b5d7f1a4c6e8b0d2f5a7c9e1b3d6f8a2c',
    createTime: '2024-06-13 11:30:00',
    dataSize: '1.7KB',
    summary: [
      { label: '磅单号', value: 'BD20240613007' },
      { label: '物资名称', value: '废塑料PET' },
      { label: '毛重', value: '18.6吨' },
      { label: '皮重', value: '6.2吨' },
      { label: '净重', value: '12.4吨' },
      { label: '司磅员', value: '李师傅' }
    ]
  },
  {
    id: 8,
    type: 'order',
    relatedNo: 'DD20240612008',
    blockHeight: 1285658,
    txHash: '0x0d3b6f9a1c4e7b2d5f8a0c3e6d9b1f4a7c2e5b8d0f3c6a9e1b4d7f2c5a8e0b3d',
    prevHash: '0x1e5a7c2f8b3d6a9e0c4f7b2d5e8a1c3f6d9b0e2a4c7f1d3b6e8a0c2f5d7b9e1c',
    createTime: '2024-06-12 15:45:00',
    dataSize: '2.2KB',
    summary: [
      { label: '订单号', value: 'DD20240612008' },
      { label: '废弃物类型', value: '废金属' },
      { label: '重量', value: '8.3吨' },
      { label: '金额', value: '¥12,450' },
      { label: '买方', value: '宝盛金属' },
      { label: '卖方', value: '金诚回收' }
    ]
  }
])

const total = ref(486)

const recentBlocks = ref([
  { height: 1285673, hash: '0x7f9a2b4c8d3e1f5a7b9c2d4e...4f6a', txCount: 12, time: '15:30:00' },
  { height: 1285672, hash: '0x6e8b1c3d7a2f4e6b9c0d8f2a...1b3c', txCount: 8, time: '15:25:00' },
  { height: 1285671, hash: '0x5d7a1f4b8c2e6a9d0f3c7e1b...6d8f', txCount: 15, time: '15:20:00' },
  { height: 1285670, hash: '0x4c6e0a3d7b2f5c8e1d4a6f9b...7e9c', txCount: 10, time: '15:15:00' },
  { height: 1285669, hash: '0x3b5d9f1a7c3e5b8d0f2c6a9e...5b7d', txCount: 6, time: '15:10:00' }
])

let blockTimer = null

const filteredList = computed(() => {
  let list = recordList.value
  
  if (typeFilter.value) {
    list = list.filter(item => item.type === typeFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.relatedNo.toLowerCase().includes(keyword) ||
      item.txHash.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentRecord.value = row
  detailDialogVisible.value = true
}

const handleVerify = (row) => {
  currentRecord.value = row
  verifyDialogVisible.value = true
  verifying.value = true
  verifySuccess.value = false
  verifyStep.value = 0
  
  const steps = [500, 800, 1200, 1800]
  steps.forEach((delay, index) => {
    setTimeout(() => {
      verifyStep.value = index + 1
    }, delay)
  })
  
  setTimeout(() => {
    verifying.value = false
    verifySuccess.value = true
    verifyTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 2500)
}

const copyHash = (hash) => {
  navigator.clipboard.writeText(hash)
  ElMessage.success('已复制到剪贴板')
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}

const addNewBlock = () => {
  const newHeight = stats.value.blockHeight + 1
  const newBlock = {
    height: newHeight,
    hash: '0x' + Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6),
    txCount: Math.floor(Math.random() * 15) + 5,
    time: dayjs().format('HH:mm:ss')
  }
  recentBlocks.value.unshift(newBlock)
  recentBlocks.value = recentBlocks.value.slice(0, 5)
  stats.value.blockHeight = newHeight
  stats.value.totalRecords++
  stats.value.todayRecords++
}

onMounted(() => {
  blockTimer = setInterval(addNewBlock, 15000)
})

onUnmounted(() => {
  if (blockTimer) {
    clearInterval(blockTimer)
  }
})
</script>

<style scoped>
.blockchain-center-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-card-1 .stat-icon {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.stat-card-2 .stat-icon {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.stat-card-3 .stat-icon {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.stat-card-4 .stat-icon {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.type-stats-card {
  border-radius: 12px;
}

.type-stats-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.type-stats-card :deep(.el-card__body) {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f9fbe7;
  border-radius: 10px;
  border: 1px solid #e8f5e9;
  transition: all 0.3s ease;
}

.type-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(67, 160, 71, 0.15);
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.type-order {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.type-transfer {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.type-weigh {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.type-contract {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-name {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.type-count {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.type-percent {
  font-size: 20px;
  font-weight: 700;
  color: #43a047;
}

.list-card {
  border-radius: 12px;
}

.list-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.list-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.type-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon-small {
  font-size: 16px;
}

.type-icon-small.type-order {
  color: #67c23a;
  background: none;
}

.type-icon-small.type-transfer {
  color: #409eff;
  background: none;
}

.type-icon-small.type-weigh {
  color: #e6a23c;
  background: none;
}

.type-icon-small.type-contract {
  color: #909399;
  background: none;
}

.hash-text {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #7b1fa2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.chain-visual-card {
  border-radius: 12px;
}

.chain-visual-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chain-visual-card :deep(.el-card__body) {
  padding: 20px;
}

.chain-visual {
  display: flex;
  align-items: stretch;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.chain-blocks {
  display: flex;
  gap: 12px;
  flex: 1;
}

.chain-block {
  flex: 1;
  min-width: 180px;
  padding: 14px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 10px;
  border: 1px solid #a5d6a7;
  position: relative;
}

.chain-block.active {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border-color: #2e7d32;
  color: #fff;
}

.chain-block.active .block-hash,
.chain-block.active .block-time {
  color: rgba(255, 255, 255, 0.85);
}

.block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.block-icon {
  font-size: 18px;
}

.block-height {
  font-size: 15px;
  font-weight: 700;
}

.block-hash {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #558b2f;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #689f38;
}

.chain-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  color: #909399;
}

.blockchain-detail-dialog :deep(.el-dialog__body) {
  padding: 20px 24px 24px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.badge-order {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.badge-transfer {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.badge-weigh {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.badge-contract {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.detail-section {
  padding-top: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #66bb6a;
}

.data-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
  padding: 14px 16px;
  background: #f9fbe7;
  border-radius: 8px;
}

.summary-item {
  font-size: 13px;
  color: #606266;
}

.summary-label {
  color: #909399;
}

.summary-value {
  font-weight: 500;
  color: #303133;
}

.verify-section {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.verify-section .el-button {
  min-width: 200px;
}

.verify-dialog {
  --el-dialog-border-radius: 12px;
}

.verify-content {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.verifying-animation {
  text-align: center;
  width: 100%;
}

.loading-icon {
  font-size: 56px;
  color: #43a047;
  animation: rotate 1.5s linear infinite;
  margin-bottom: 16px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.verifying-animation > p {
  margin: 0 0 24px 0;
  font-size: 16px;
  color: #606266;
}

.verify-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
  max-width: 320px;
  margin: 0 auto;
}

.verify-step {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #c0c4cc;
  transition: all 0.3s ease;
}

.verify-step.active {
  color: #43a047;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.verify-step.active .step-num {
  background: #67c23a;
  color: #fff;
}

.verify-step .el-icon {
  width: 24px;
  height: 24px;
  color: #67c23a;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
}

.verify-success {
  text-align: center;
}

.success-icon {
  color: #67c23a;
  margin-bottom: 20px;
}

.verify-success h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.success-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #909399;
}

.verify-details {
  text-align: left;
  background: #f0f9eb;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #c2e7b0;
}

.verify-item {
  display: flex;
  font-size: 13px;
  margin-bottom: 10px;
  color: #606266;
  line-height: 1.6;
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
  word-break: break-all;
}

.success-text {
  color: #67c23a;
  font-weight: 600;
}
</style>
