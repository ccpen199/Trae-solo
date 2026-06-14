<template>
  <div class="contract-list-container">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <el-icon><Document /></el-icon>
            电子合同
          </h2>
          <p class="page-desc">管理您的所有电子合同，查看、签署、下载一站式服务</p>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">{{ stats.total }}</span>
            <span class="stat-label">全部合同</span>
          </div>
          <div class="stat-item">
            <span class="stat-number pending">{{ stats.pending }}</span>
            <span class="stat-label">待签署</span>
          </div>
          <div class="stat-item">
            <span class="stat-number signed">{{ stats.signed }}</span>
            <span class="stat-label">已签署</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="filter-card" shadow="never">
      <el-form :model="queryParams" inline>
        <el-form-item label="合同状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="待签署" value="pending" />
            <el-option label="已签署" value="signed" />
            <el-option label="已作废" value="void" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同编号">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入合同编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        empty-text="暂无合同记录"
      >
        <el-table-column prop="contractNo" label="合同编号" width="200">
          <template #default="scope">
            <span class="contract-no">{{ scope.row.contractNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="关联订单" width="200">
          <template #default="scope">
            <el-button type="primary" link @click="handleViewOrder(scope.row)">
              {{ scope.row.orderNo }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="wasteName" label="废弃物名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="amount" label="合同金额" width="140">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="otherParty" label="对方当事人" width="180" />
        <el-table-column prop="signDate" label="签订日期" width="140" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="success"
              link
              @click="handleSign(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              签署
            </el-button>
            <el-button
              v-if="scope.row.status === 'signed'"
              type="info"
              link
              @click="handleDownload(scope.row)"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="danger"
              link
              @click="handleVoid(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              作废
            </el-button>
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

    <el-dialog v-model="detailDialogVisible" title="合同详情" width="720px" class="contract-detail-dialog">
      <div class="contract-detail" v-if="currentContract">
        <div class="contract-header">
          <div class="contract-title-wrapper">
            <h3 class="contract-title">废弃物回收服务协议</h3>
            <el-tag :type="statusTypeMap[currentContract.status]" effect="light" size="large">
              {{ statusTextMap[currentContract.status] }}
            </el-tag>
          </div>
          <p class="contract-no">合同编号：{{ currentContract.contractNo }}</p>
        </div>

        <div class="contract-info-grid">
          <div class="info-block">
            <h4 class="block-title">甲方（卖方/产废方）</h4>
            <p class="info-line">公司名称：{{ currentContract.sellerName }}</p>
            <p class="info-line">联系人：{{ currentContract.sellerContact }}</p>
            <p class="info-line">联系电话：{{ currentContract.sellerPhone }}</p>
          </div>
          <div class="info-block">
            <h4 class="block-title">乙方（买方/收废方）</h4>
            <p class="info-line">公司名称：{{ currentContract.buyerName }}</p>
            <p class="info-line">联系人：{{ currentContract.buyerContact }}</p>
            <p class="info-line">联系电话：{{ currentContract.buyerPhone }}</p>
          </div>
        </div>

        <el-divider />

        <div class="contract-section">
          <h4 class="section-title">一、交易标的</h4>
          <el-table :data="[currentContract]" size="small" border>
            <el-table-column prop="wasteName" label="废弃物名称" />
            <el-table-column prop="wasteCategory" label="分类" width="120" />
            <el-table-column prop="weight" label="预估重量" width="120" />
            <el-table-column prop="unitPrice" label="单价（元/吨）" width="140" />
            <el-table-column prop="amount" label="预估金额（元）" width="140">
              <template #default="scope">¥{{ scope.row.amount?.toLocaleString() }}</template>
            </el-table-column>
          </el-table>
        </div>

        <div class="contract-section">
          <h4 class="section-title">二、结算方式</h4>
          <p class="section-content">
            以实际磅单称重为准，按实际重量结算。结算价格按照本合同约定单价执行。
          </p>
        </div>

        <div class="contract-section">
          <h4 class="section-title">三、双方权利与义务</h4>
          <ol class="section-list">
            <li>甲方保证废弃物来源合法，符合国家相关法律法规要求。</li>
            <li>甲方应按约定时间和地点交付废弃物。</li>
            <li>乙方应按约定时间上门回收，文明作业。</li>
            <li>双方共同对磅单重量进行确认，作为结算依据。</li>
            <li>乙方应按约定及时支付货款。</li>
          </ol>
        </div>

        <div class="contract-section">
          <h4 class="section-title">四、违约责任</h4>
          <p class="section-content">
            任何一方违反本合同约定，应承担相应的违约责任，并赔偿对方因此遭受的损失。
          </p>
        </div>

        <div class="contract-section">
          <h4 class="section-title">五、其他</h4>
          <p class="section-content">
            本合同自双方签署之日起生效。本合同一式两份，甲乙双方各执一份，具有同等法律效力。
          </p>
        </div>

        <div class="signature-section">
          <div class="signature-block">
            <p class="signature-label">甲方（盖章）</p>
            <div class="signature-name">
              <template v-if="currentContract.sellerSigned">
                <el-icon :size="20"><Select /></el-icon>
                <span>{{ currentContract.sellerName }}</span>
              </template>
              <template v-else>
                <span class="not-signed">未签署</span>
              </template>
            </div>
            <p class="signature-date">
              {{ currentContract.sellerSignDate || '____年__月__日' }}
            </p>
          </div>
          <div class="signature-block">
            <p class="signature-label">乙方（盖章）</p>
            <div class="signature-name">
              <template v-if="currentContract.buyerSigned">
                <el-icon :size="20"><Select /></el-icon>
                <span>{{ currentContract.buyerName }}</span>
              </template>
              <template v-else>
                <span class="not-signed">未签署</span>
              </template>
            </div>
            <p class="signature-date">
              {{ currentContract.buyerSignDate || '____年__月__日' }}
            </p>
          </div>
        </div>

        <div class="blockchain-info" v-if="currentContract.status === 'signed'">
          <el-alert
            type="success"
            :closable="false"
            show-icon
            title="本合同已上链存证"
            :description="'区块链存证编号：' + currentContract.blockchainHash"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentContract?.status === 'pending'"
          type="primary"
          @click="handleConfirmSign"
        >
          签署合同
        </el-button>
        <el-button
          v-if="currentContract?.status === 'signed'"
          @click="handleDownload(currentContract)"
        >
          <el-icon><Download /></el-icon>
          下载合同
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Search, Refresh, View, Edit, Download, Delete, Select
} from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentContract = ref(null)
const signLoading = ref(false)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  status: '',
  keyword: ''
})

const stats = reactive({
  total: 24,
  pending: 3,
  signed: 21
})

const statusTypeMap = {
  pending: 'warning',
  signed: 'success',
  void: 'info'
}

const statusTextMap = {
  pending: '待签署',
  signed: '已签署',
  void: '已作废'
}

const tableData = ref([
  {
    id: 1,
    contractNo: 'HT202406140001',
    orderNo: 'DD202406140001',
    wasteName: '废旧纸箱一批 工厂库存',
    wasteCategory: '工业边角料',
    weight: '0.5吨',
    unitPrice: 1200,
    amount: 600,
    otherParty: '绿源回收有限公司',
    sellerName: '北京某科技有限公司',
    sellerContact: '张先生',
    sellerPhone: '138****8888',
    sellerSigned: true,
    sellerSignDate: '2024-06-14',
    buyerName: '绿源回收有限公司',
    buyerContact: '李经理',
    buyerPhone: '139****9999',
    buyerSigned: false,
    buyerSignDate: '',
    signDate: '-',
    status: 'pending',
    blockchainHash: ''
  },
  {
    id: 2,
    contractNo: 'HT202406130002',
    orderNo: 'DD202406130002',
    wasteName: '工业废铁 边角料',
    wasteCategory: '废金属',
    weight: '3吨',
    unitPrice: 1800,
    amount: 5400,
    otherParty: '金诚金属回收',
    sellerName: '北京某科技有限公司',
    sellerContact: '张先生',
    sellerPhone: '138****8888',
    sellerSigned: true,
    sellerSignDate: '2024-06-13',
    buyerName: '金诚金属回收公司',
    buyerContact: '王总',
    buyerPhone: '137****7777',
    buyerSigned: true,
    buyerSignDate: '2024-06-13',
    signDate: '2024-06-13',
    status: 'signed',
    blockchainHash: '0x' + 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890'
  },
  {
    id: 3,
    contractNo: 'HT202406120003',
    orderNo: 'DD202406120003',
    wasteName: '生活塑料瓶 回收打包',
    wasteCategory: '生活塑料',
    weight: '0.8吨',
    unitPrice: 1300,
    amount: 1040,
    otherParty: '塑再生资源公司',
    sellerName: '北京某科技有限公司',
    sellerContact: '张先生',
    sellerPhone: '138****8888',
    sellerSigned: true,
    sellerSignDate: '2024-06-12',
    buyerName: '塑再生资源公司',
    buyerContact: '赵经理',
    buyerPhone: '136****6666',
    buyerSigned: true,
    buyerSignDate: '2024-06-12',
    signDate: '2024-06-12',
    status: 'signed',
    blockchainHash: '0x' + 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
  },
  {
    id: 4,
    contractNo: 'HT202406110004',
    orderNo: 'DD202406110004',
    wasteName: '二手注塑机 8成新',
    wasteCategory: '二手设备',
    weight: '2.5吨',
    unitPrice: 6000,
    amount: 15000,
    otherParty: '二手机械设备市场',
    sellerName: '北京某科技有限公司',
    sellerContact: '张先生',
    sellerPhone: '138****8888',
    sellerSigned: false,
    sellerSignDate: '',
    buyerName: '二手机械设备市场',
    buyerContact: '孙经理',
    buyerPhone: '135****5555',
    buyerSigned: true,
    buyerSignDate: '2024-06-11',
    signDate: '-',
    status: 'pending',
    blockchainHash: ''
  },
  {
    id: 5,
    contractNo: 'HT202406100005',
    orderNo: 'DD202406100005',
    wasteName: '废旧家电 冰箱洗衣机',
    wasteCategory: '废旧家电',
    weight: '0.12吨',
    unitPrice: 3000,
    amount: 360,
    otherParty: '绿源回收有限公司',
    sellerName: '北京某科技有限公司',
    sellerContact: '张先生',
    sellerPhone: '138****8888',
    sellerSigned: true,
    sellerSignDate: '2024-06-10',
    buyerName: '绿源回收有限公司',
    buyerContact: '李经理',
    buyerPhone: '139****9999',
    buyerSigned: false,
    buyerSignDate: '',
    signDate: '-',
    status: 'void',
    blockchainHash: ''
  }
])

const total = ref(24)

const fetchData = async () => {
  loading.value = true
  try {
    // 调用接口获取数据
  } catch (err) {
    console.error('获取合同列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchData()
}

const handleReset = () => {
  queryParams.status = ''
  queryParams.keyword = ''
  queryParams.page = 1
  fetchData()
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
  fetchData()
}

const handleCurrentChange = (val) => {
  queryParams.page = val
  fetchData()
}

const handleView = (row) => {
  currentContract.value = row
  detailDialogVisible.value = true
}

const handleSign = (row) => {
  currentContract.value = row
  detailDialogVisible.value = true
}

const handleConfirmSign = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要签署该合同吗？签署后合同将立即生效。',
      '签署确认',
      {
        confirmButtonText: '确认签署',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    signLoading.value = true
    // 调用签署接口
    await new Promise(resolve => setTimeout(resolve, 1000))
    const item = tableData.value.find(i => i.id === currentContract.value.id)
    if (item) {
      item.status = 'signed'
      item.sellerSigned = true
      item.sellerSignDate = new Date().toISOString().split('T')[0]
      item.signDate = new Date().toISOString().split('T')[0]
      item.blockchainHash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)
      currentContract.value = { ...item }
      stats.pending--
      stats.signed++
    }
    ElMessage.success('合同签署成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('签署失败')
    }
  } finally {
    signLoading.value = false
  }
}

const handleDownload = (row) => {
  ElMessage.success('合同下载中...')
}

const handleVoid = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要作废该合同吗？作废后合同将不再有效。',
      '作废确认',
      {
        confirmButtonText: '确认作废',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const item = tableData.value.find(i => i.id === row.id)
    if (item) {
      item.status = 'void'
      stats.pending--
    }
    ElMessage.success('合同已作废')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('作废失败')
    }
  }
}

const handleViewOrder = (row) => {
  router.push(`/producer/orders/${row.id}`)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.contract-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
  color: #fff;
}

.header-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-desc {
  font-size: 13px;
  margin: 0;
  opacity: 0.9;
}

.header-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
}

.stat-number.pending {
  color: #ffecb3;
}

.stat-number.signed {
  color: #c8e6c9;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.filter-card {
  border-radius: 12px;
}

.filter-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}

.contract-no {
  font-family: monospace;
  font-weight: 500;
  color: #303133;
}

.amount-text {
  color: #e6a23c;
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.contract-detail-dialog :deep(.el-dialog__body) {
  padding: 0 24px 20px;
}

.contract-detail {
  padding: 10px 0;
}

.contract-header {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #66bb6a;
  margin-bottom: 20px;
}

.contract-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.contract-title {
  font-size: 22px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0;
}

.contract-no {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.contract-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-block {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 3px solid #67c23a;
}

.info-line {
  font-size: 13px;
  color: #606266;
  margin: 6px 0;
}

.contract-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.section-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
  text-indent: 2em;
}

.section-list {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  padding-left: 20px;
  margin: 0;
}

.signature-section {
  display: flex;
  justify-content: space-around;
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px dashed #ddd;
}

.signature-block {
  text-align: center;
}

.signature-label {
  font-size: 13px;
  color: #606266;
  margin: 0 0 8px 0;
}

.signature-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  min-height: 32px;
  margin-bottom: 8px;
}

.signature-name .el-icon {
  color: #67c23a;
}

.not-signed {
  color: #c0c4cc;
  font-weight: 400;
  font-style: italic;
}

.signature-date {
  font-size: 12px;
  color: #909399;
  margin: 0;
}

.blockchain-info {
  margin-top: 20px;
}
</style>
