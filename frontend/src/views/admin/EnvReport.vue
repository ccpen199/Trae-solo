<template>
  <div class="env-report-container">
    <el-card class="stats-card" shadow="never">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">本月报送次数</div>
            <div class="stat-value">{{ stats.monthReports }} <span class="stat-unit">次</span></div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon">
            <el-icon :size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">累计报送量</div>
            <div class="stat-value">{{ stats.totalWeight }} <span class="stat-unit">吨</span></div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-icon warning">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待报送数量</div>
            <div class="stat-value warning">{{ stats.pendingCount }} <span class="stat-unit">批</span></div>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item submit-section">
          <el-button type="primary" size="large" @click="handleSubmitReport">
            <el-icon><Upload /></el-icon>
            一键报送
          </el-button>
          <p class="submit-tip">向地方生态环境局报送</p>
        </div>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">报送记录</span>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px" size="default">
              <el-option label="全部状态" value="" />
              <el-option label="已报送" value="submitted" />
              <el-option label="待报送" value="pending" />
              <el-option label="报送中" value="submitting" />
              <el-option label="已退回" value="returned" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 280px"
            />
            <el-input
              v-model="searchKeyword"
              placeholder="搜索报送编号"
              clearable
              style="width: 220px"
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
        <el-table-column prop="reportNo" label="报送编号" width="180" />
        <el-table-column prop="reportTime" label="报送时间" width="170" />
        <el-table-column prop="wasteCategory" label="废弃物品类" min-width="160" />
        <el-table-column prop="totalWeight" label="总重量（吨）" width="130" />
        <el-table-column prop="batchCount" label="批次数量" width="110" />
        <el-table-column prop="receiveDept" label="接收部门" min-width="180" />
        <el-table-column label="报送状态" width="110">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light" size="small">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleDetail(scope.row)">
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'returned' || scope.row.status === 'pending'"
                type="success"
                link
                size="small"
                @click="handleResubmit(scope.row)"
              >
                重新报送
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

    <el-dialog v-model="detailDialogVisible" title="报送详情" width="720px" class="report-detail-dialog">
      <div v-if="currentReport" class="detail-content">
        <div class="detail-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            报送基本信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="报送编号">{{ currentReport.reportNo }}</el-descriptions-item>
            <el-descriptions-item label="报送状态">
              <el-tag :type="statusTypeMap[currentReport.status]" effect="light">
                {{ statusTextMap[currentReport.status] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="报送时间">{{ currentReport.reportTime }}</el-descriptions-item>
            <el-descriptions-item label="报送周期">{{ currentReport.reportPeriod }}</el-descriptions-item>
            <el-descriptions-item label="接收部门" :span="2">{{ currentReport.receiveDept }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Box /></el-icon>
            废弃物明细
          </div>
          <el-table :data="currentReport.wasteDetails" size="small" border>
            <el-table-column prop="wasteName" label="废弃物名称" min-width="140" />
            <el-table-column prop="hazardousCode" label="危废代码" width="110" />
            <el-table-column prop="weight" label="重量（吨）" width="110" />
            <el-table-column prop="source" label="来源" width="140" />
            <el-table-column prop="treatment" label="处置方式" min-width="140" />
          </el-table>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><OfficeBuilding /></el-icon>
            报送单位信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="单位名称">{{ currentReport.companyName }}</el-descriptions-item>
            <el-descriptions-item label="统一社会信用代码">{{ currentReport.creditCode }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentReport.contact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentReport.phone }}</el-descriptions-item>
            <el-descriptions-item label="单位地址" :span="2">{{ currentReport.address }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="currentReport.status === 'returned'" class="detail-section">
          <div class="section-title return-title">
            <el-icon><Close /></el-icon>
            退回原因
          </div>
          <div class="return-reason-box">
            {{ currentReport.returnReason }}
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Paperclip /></el-icon>
            附件材料
          </div>
          <div class="attachments">
            <div
              v-for="(file, index) in currentReport.attachments"
              :key="index"
              class="attachment-item"
            >
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ file.size }}</span>
              <el-button type="primary" link size="small">下载</el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentReport?.status === 'returned' || currentReport?.status === 'pending'"
          type="primary"
          @click="handleResubmit(currentReport)"
        >
          重新报送
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="submitDialogVisible" title="一键报送" width="500px">
      <div class="submit-form">
        <p class="submit-desc">
          将向 <strong>江苏省生态环境厅</strong> 报送本月待报送的废弃物数据。
        </p>
        <el-form label-width="100px">
          <el-form-item label="报送周期">
            <el-select v-model="submitForm.period" style="width: 100%">
              <el-option label="2024年6月" value="202406" />
              <el-option label="2024年5月" value="202405" />
            </el-select>
          </el-form-item>
          <el-form-item label="报送批次">
            <span class="batch-count">共 {{ stats.pendingCount }} 批，{{ stats.pendingWeight }} 吨</span>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="submitForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（选填）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="submitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmSubmit">
          确认报送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Calendar, TrendCharts, Warning, Upload, Search,
  Document, Box, OfficeBuilding, Paperclip, Close
} from '@element-plus/icons-vue'

const searchKeyword = ref('')
const statusFilter = ref('')
const dateRange = ref(null)
const detailDialogVisible = ref(false)
const submitDialogVisible = ref(false)
const currentReport = ref(null)
const submitting = ref(false)

const stats = ref({
  monthReports: 12,
  totalWeight: 1568.5,
  pendingCount: 3,
  pendingWeight: 89.2
})

const statusTypeMap = {
  pending: 'warning',
  submitting: 'primary',
  submitted: 'success',
  returned: 'danger'
}

const statusTextMap = {
  pending: '待报送',
  submitting: '报送中',
  submitted: '已报送',
  returned: '已退回'
}

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: ''
})

const submitForm = reactive({
  period: '202406',
  remark: ''
})

const reportList = ref([
  {
    id: 1,
    reportNo: 'BS20240614001',
    reportTime: '2024-06-14 10:30:00',
    reportPeriod: '2024年6月',
    wasteCategory: '工业边角料、生活塑料、危废',
    totalWeight: 156.8,
    batchCount: 5,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'submitted',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '',
    wasteDetails: [
      { wasteName: '废塑料', hazardousCode: '—', weight: 65.2, source: '苏州工业园区', treatment: '再生造粒' },
      { wasteName: '废金属', hazardousCode: '—', weight: 45.6, source: '昆山开发区', treatment: '回炉冶炼' },
      { wasteName: '废纸', hazardousCode: '—', weight: 32.5, source: '苏州新区', treatment: '制浆造纸' },
      { wasteName: '废矿物油', hazardousCode: 'HW08', weight: 8.5, source: '吴江工厂', treatment: '再生基础油' },
      { wasteName: '废油漆渣', hazardousCode: 'HW12', weight: 5.0, source: '相城工业园', treatment: '安全填埋' }
    ],
    attachments: [
      { name: '月度报表.pdf', size: '2.3MB' },
      { name: '转移联单汇总.xlsx', size: '1.1MB' },
      { name: '现场照片.zip', size: '8.5MB' }
    ]
  },
  {
    id: 2,
    reportNo: 'BS20240610002',
    reportTime: '2024-06-10 14:20:00',
    reportPeriod: '2024年6月',
    wasteCategory: '危废',
    totalWeight: 25.5,
    batchCount: 2,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'returned',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '危废转移联单不完整，缺少第3、5批次的联单扫描件，请补充后重新报送。',
    wasteDetails: [
      { wasteName: '废铅酸蓄电池', hazardousCode: 'HW49', weight: 15.0, source: '苏州各回收点', treatment: '湿法冶炼' },
      { wasteName: '废有机溶剂', hazardousCode: 'HW42', weight: 10.5, source: '新区电子厂', treatment: '精馏回收' }
    ],
    attachments: [
      { name: '危废月报.pdf', size: '1.8MB' },
      { name: '转移联单.pdf', size: '3.2MB' }
    ]
  },
  {
    id: 3,
    reportNo: 'BS20240601003',
    reportTime: '2024-06-01 09:00:00',
    reportPeriod: '2024年5月',
    wasteCategory: '工业边角料、生活塑料、废旧家电',
    totalWeight: 320.5,
    batchCount: 8,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'submitted',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '',
    wasteDetails: [
      { wasteName: '废塑料', hazardousCode: '—', weight: 120.5, source: '各区县回收点', treatment: '再生造粒' },
      { wasteName: '废金属', hazardousCode: '—', weight: 85.0, source: '各区县回收点', treatment: '回炉冶炼' },
      { wasteName: '废纸', hazardousCode: '—', weight: 65.0, source: '各区县回收点', treatment: '制浆造纸' },
      { wasteName: '废旧家电', hazardousCode: '—', weight: 50.0, source: '各区县回收点', treatment: '拆解回收' }
    ],
    attachments: [
      { name: '5月报表.pdf', size: '3.5MB' },
      { name: '转移联单汇总.xlsx', size: '2.1MB' }
    ]
  },
  {
    id: 4,
    reportNo: 'BS20240520004',
    reportTime: '2024-05-20 11:30:00',
    reportPeriod: '2024年5月',
    wasteCategory: '危废',
    totalWeight: 42.8,
    batchCount: 3,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'submitted',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '',
    wasteDetails: [
      { wasteName: '废矿物油', hazardousCode: 'HW08', weight: 18.5, source: '汽车修理厂', treatment: '再生基础油' },
      { wasteName: '废油漆渣', hazardousCode: 'HW12', weight: 12.3, source: '家具厂', treatment: '安全填埋' },
      { wasteName: '电镀污泥', hazardousCode: 'HW17', weight: 12.0, source: '电镀厂', treatment: '固化填埋' }
    ],
    attachments: [
      { name: '危废月报.pdf', size: '2.0MB' }
    ]
  },
  {
    id: 5,
    reportNo: 'BS20240510005',
    reportTime: '2024-05-10 16:00:00',
    reportPeriod: '2024年4月',
    wasteCategory: '工业边角料、生活塑料',
    totalWeight: 285.0,
    batchCount: 6,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'submitted',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '',
    wasteDetails: [
      { wasteName: '废塑料', hazardousCode: '—', weight: 110.0, source: '各区县', treatment: '再生造粒' },
      { wasteName: '废金属', hazardousCode: '—', weight: 95.0, source: '各区县', treatment: '回炉冶炼' },
      { wasteName: '废纸', hazardousCode: '—', weight: 80.0, source: '各区县', treatment: '制浆造纸' }
    ],
    attachments: [
      { name: '4月报表.pdf', size: '2.8MB' }
    ]
  },
  {
    id: 6,
    reportNo: 'BS20240615006',
    reportTime: '-',
    reportPeriod: '2024年6月',
    wasteCategory: '工业边角料、二手设备',
    totalWeight: 35.6,
    batchCount: 2,
    receiveDept: '江苏省生态环境厅固体废物与化学品处',
    status: 'pending',
    companyName: '绿源再生资源有限公司',
    creditCode: '91320500MA1N3RKX2T',
    contact: '张经理',
    phone: '138****6688',
    address: '江苏省苏州市工业园区星湖街123号',
    returnReason: '',
    wasteDetails: [
      { wasteName: '废钢铁', hazardousCode: '—', weight: 25.0, source: '张家港钢厂', treatment: '回炉冶炼' },
      { wasteName: '旧机床设备', hazardousCode: '—', weight: 10.6, source: '常熟机械厂', treatment: '翻新再利用' }
    ],
    attachments: [
      { name: '待报送报表.xlsx', size: '856KB' }
    ]
  }
])

const total = ref(36)

const filteredList = computed(() => {
  let list = reportList.value
  
  if (statusFilter.value) {
    list = list.filter(item => item.status === statusFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => item.reportNo.toLowerCase().includes(keyword))
  }
  
  return list
})

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentReport.value = row
  detailDialogVisible.value = true
}

const handleResubmit = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定重新报送「${row.reportNo}」吗？`,
      '重新报送确认',
      {
        confirmButtonText: '确认报送',
        cancelButtonText: '取消',
        type: 'primary'
      }
    )
    const item = reportList.value.find(item => item.id === row.id)
    if (item) {
      item.status = 'submitting'
      setTimeout(() => {
        item.status = 'submitted'
        item.reportTime = new Date().toLocaleString().replace(/\//g, '-')
        ElMessage.success('报送成功')
      }, 1500)
    }
    detailDialogVisible.value = false
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleSubmitReport = () => {
  submitForm.period = '202406'
  submitForm.remark = ''
  submitDialogVisible.value = true
}

const confirmSubmit = async () => {
  submitting.value = true
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  submitting.value = false
  submitDialogVisible.value = false
  
  const pendingItems = reportList.value.filter(item => item.status === 'pending')
  pendingItems.forEach(item => {
    item.status = 'submitted'
    item.reportTime = new Date().toLocaleString().replace(/\//g, '-')
  })
  
  stats.value.monthReports++
  stats.value.pendingCount = 0
  
  ElMessage.success('报送成功，数据已提交至江苏省生态环境厅')
}

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}
</script>

<style scoped>
.env-report-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card {
  background: linear-gradient(135deg, #00695c 0%, #004d40 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
}

.stats-card :deep(.el-card__body) {
  padding: 24px 32px;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b2dfdb;
}

.stat-icon.warning {
  background: rgba(255, 152, 0, 0.2);
  color: #ffb74d;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #b2dfdb;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
}

.stat-value.warning {
  color: #ffb74d;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #b2dfdb;
}

.stat-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.15);
}

.submit-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.submit-section .el-button {
  min-width: 140px;
}

.submit-tip {
  margin: 0;
  font-size: 12px;
  color: #b2dfdb;
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

.header-actions {
  display: flex;
  gap: 12px;
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

.report-detail-dialog :deep(.el-dialog__body) {
  padding: 16px 24px 20px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding-bottom: 16px;
  border-bottom: 1px dashed #e0e0e0;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #00695c;
}

.section-title .el-icon {
  color: #00695c;
}

.section-title.return-title {
  border-left-color: #f56c6c;
}

.section-title.return-title .el-icon {
  color: #f56c6c;
}

.return-reason-box {
  padding: 14px 16px;
  background: #fef0f0;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 14px;
  line-height: 1.6;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
}

.file-icon {
  color: #00695c;
  font-size: 18px;
}

.file-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.file-size {
  font-size: 12px;
  color: #909399;
  margin-right: 12px;
}

.submit-form {
  padding: 10px 0;
}

.submit-desc {
  margin: 0 0 20px 0;
  padding: 12px 16px;
  background: #e0f2f1;
  border-radius: 6px;
  font-size: 14px;
  color: #00695c;
}

.submit-desc strong {
  color: #004d40;
}

.batch-count {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
</style>
