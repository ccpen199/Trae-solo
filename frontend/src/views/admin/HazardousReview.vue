<template>
  <div class="hazardous-review-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <div class="title-section">
          <span class="card-title">危废审核</span>
          <el-tag type="danger" effect="dark" class="warning-tag">
            <el-icon><Warning /></el-icon>
            危险废物需严格审核
          </el-tag>
        </div>
        <div class="stats-brief">
          <span class="stat-item">
            <span class="stat-label">待审核</span>
            <span class="stat-value pending">{{ stats.pending }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">已通过</span>
            <span class="stat-value passed">{{ stats.passed }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">已拒绝</span>
            <span class="stat-value rejected">{{ stats.rejected }}</span>
          </span>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索废弃物ID、名称、申请企业"
            clearable
            style="width: 320px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px">
            <el-option label="全部状态" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </div>
        <div class="filter-right">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="filteredList" style="width: 100%" stripe>
        <el-table-column prop="wasteId" label="废弃物ID" width="160" />
        <el-table-column label="废弃物名称" min-width="180">
          <template #default="scope">
            <div class="waste-name-cell">
              <el-tag type="danger" effect="dark" size="small" class="hazardous-tag">危</el-tag>
              <span>{{ scope.row.wasteName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="hazardousCode" label="危废代码" width="120" />
        <el-table-column prop="weight" label="重量（吨）" width="110" />
        <el-table-column prop="enterprise" label="申请企业" width="200" />
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light" size="small">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleDetail(scope.row)">
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="success"
                link
                size="small"
                @click="handleApprove(scope.row)"
              >
                审核通过
              </el-button>
              <el-button
                v-if="scope.row.status === 'pending'"
                type="danger"
                link
                size="small"
                @click="handleReject(scope.row)"
              >
                审核拒绝
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

    <el-dialog v-model="detailDialogVisible" title="危废详情审核" width="720px" class="review-dialog">
      <div v-if="currentItem" class="review-content">
        <div class="review-section">
          <div class="section-title">
            <el-icon><Document /></el-icon>
            基本信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="废弃物ID">{{ currentItem.wasteId }}</el-descriptions-item>
            <el-descriptions-item label="危废代码">
              <el-tag type="danger" effect="light">{{ currentItem.hazardousCode }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="废弃物名称">{{ currentItem.wasteName }}</el-descriptions-item>
            <el-descriptions-item label="重量">{{ currentItem.weight }} 吨</el-descriptions-item>
            <el-descriptions-item label="形态">{{ currentItem.form }}</el-descriptions-item>
            <el-descriptions-item label="危险特性">{{ currentItem.characteristic }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="review-section">
          <div class="section-title">
            <el-icon><OfficeBuilding /></el-icon>
            申请企业信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="企业名称">{{ currentItem.enterprise }}</el-descriptions-item>
            <el-descriptions-item label="统一社会信用代码">{{ currentItem.creditCode }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentItem.contact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentItem.phone }}</el-descriptions-item>
            <el-descriptions-item label="企业地址" :span="2">{{ currentItem.address }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="review-section">
          <div class="section-title">
            <el-icon><Picture /></el-icon>
            资质证明文件
          </div>
          <div class="cert-files">
            <div
              v-for="(file, index) in currentItem.certFiles"
              :key="index"
              class="cert-file-item"
              @click="handlePreviewImage(file)"
            >
              <el-image :src="file" fit="cover" class="cert-thumb" />
              <div class="cert-file-name">资质证明 {{ index + 1 }}</div>
            </div>
          </div>
        </div>

        <div class="review-section">
          <div class="section-title">
            <el-icon><Edit /></el-icon>
            审核意见
          </div>
          <el-input
            v-model="reviewForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            maxlength="500"
            show-word-limit
            :disabled="currentItem.status !== 'pending'"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentItem?.status === 'pending'"
          type="danger"
          @click="confirmReject"
        >
          审核拒绝
        </el-button>
        <el-button
          v-if="currentItem?.status === 'pending'"
          type="success"
          @click="confirmApprove"
        >
          审核通过
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="图片预览" width="800px">
      <el-image :src="previewImage" fit="contain" style="width: 100%; height: 500px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Warning, Document, OfficeBuilding, Picture, Edit
} from '@element-plus/icons-vue'

const searchKeyword = ref('')
const statusFilter = ref('')
const detailDialogVisible = ref(false)
const currentItem = ref(null)
const previewVisible = ref(false)
const previewImage = ref('')

const stats = ref({
  pending: 18,
  passed: 256,
  rejected: 12
})

const statusTypeMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

const statusTextMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: ''
})

const reviewForm = reactive({
  opinion: ''
})

const wasteList = ref([
  {
    id: 1,
    wasteId: 'HW20240614001',
    wasteName: '废油漆渣',
    hazardousCode: 'HW12',
    weight: 5.2,
    enterprise: '苏州华盛化工有限公司',
    creditCode: '91320500MA1XXXXXX1',
    contact: '王经理',
    phone: '138****1234',
    address: '江苏省苏州市工业园区星湖街123号',
    form: '固态',
    characteristic: '毒性、易燃性',
    submitTime: '2024-06-14 09:30:25',
    status: 'pending',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1',
      'https://via.placeholder.com/200x200/ffcdd2/e53935?text=Cert+2',
      'https://via.placeholder.com/200x200/ef9a9a/e57373?text=Cert+3'
    ]
  },
  {
    id: 2,
    wasteId: 'HW20240614002',
    wasteName: '废矿物油',
    hazardousCode: 'HW08',
    weight: 12.8,
    enterprise: '上海宝钢机械制造',
    creditCode: '91310000MA1XXXXXX2',
    contact: '李总',
    phone: '139****5678',
    address: '上海市宝山区月浦镇蕴川路345号',
    form: '液态',
    characteristic: '易燃性、毒性',
    submitTime: '2024-06-14 10:15:42',
    status: 'pending',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1',
      'https://via.placeholder.com/200x200/ffcdd2/e53935?text=Cert+2'
    ]
  },
  {
    id: 3,
    wasteId: 'HW20240613003',
    wasteName: '废酸液',
    hazardousCode: 'HW34',
    weight: 8.5,
    enterprise: '杭州电子科技有限公司',
    creditCode: '91330100MA1XXXXXX3',
    contact: '张工',
    phone: '137****9012',
    address: '浙江省杭州市滨江区江南大道678号',
    form: '液态',
    characteristic: '腐蚀性',
    submitTime: '2024-06-13 14:20:10',
    status: 'approved',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1'
    ]
  },
  {
    id: 4,
    wasteId: 'HW20240613004',
    wasteName: '废铅酸蓄电池',
    hazardousCode: 'HW49',
    weight: 6.3,
    enterprise: '南京新能源科技',
    creditCode: '91320100MA1XXXXXX4',
    contact: '陈经理',
    phone: '136****3456',
    address: '江苏省南京市江宁区科学园901号',
    form: '固态',
    characteristic: '毒性',
    submitTime: '2024-06-13 16:45:30',
    status: 'rejected',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1',
      'https://via.placeholder.com/200x200/ffcdd2/e53935?text=Cert+2'
    ]
  },
  {
    id: 5,
    wasteId: 'HW20240612005',
    wasteName: '电镀污泥',
    hazardousCode: 'HW17',
    weight: 15.2,
    enterprise: '温州电镀产业园',
    creditCode: '91330300MA1XXXXXX5',
    contact: '赵总',
    phone: '135****7890',
    address: '浙江省温州市龙湾区滨海二道234号',
    form: '固态',
    characteristic: '毒性',
    submitTime: '2024-06-12 08:30:00',
    status: 'approved',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1',
      'https://via.placeholder.com/200x200/ffcdd2/e53935?text=Cert+2',
      'https://via.placeholder.com/200x200/ef9a9a/e57373?text=Cert+3',
      'https://via.placeholder.com/200x200/ef9a9a/e57373?text=Cert+4'
    ]
  },
  {
    id: 6,
    wasteId: 'HW20240612006',
    wasteName: '废有机溶剂',
    hazardousCode: 'HW42',
    weight: 3.6,
    enterprise: '合肥精密电子',
    creditCode: '91340100MA1XXXXXX6',
    contact: '孙工',
    phone: '134****1122',
    address: '安徽省合肥市高新区科学大道567号',
    form: '液态',
    characteristic: '毒性、易燃性',
    submitTime: '2024-06-12 11:20:00',
    status: 'pending',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1'
    ]
  },
  {
    id: 7,
    wasteId: 'HW20240611007',
    wasteName: '医疗废物',
    hazardousCode: 'HW01',
    weight: 2.1,
    enterprise: '无锡人民医院',
    creditCode: '12320200MA1XXXXXX7',
    contact: '周主任',
    phone: '133****3344',
    address: '江苏省无锡市梁溪区清扬路299号',
    form: '固态',
    characteristic: '感染性、毒性',
    submitTime: '2024-06-11 13:50:00',
    status: 'approved',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1',
      'https://via.placeholder.com/200x200/ffcdd2/e53935?text=Cert+2'
    ]
  },
  {
    id: 8,
    wasteId: 'HW20240611008',
    wasteName: '废荧光灯管',
    hazardousCode: 'HW29',
    weight: 0.8,
    enterprise: '常州照明电器厂',
    creditCode: '91320400MA1XXXXXX8',
    contact: '吴经理',
    phone: '132****5566',
    address: '江苏省常州市新北区黄河西路789号',
    form: '固态',
    characteristic: '毒性',
    submitTime: '2024-06-11 15:30:00',
    status: 'pending',
    certFiles: [
      'https://via.placeholder.com/200x200/ffebee/ef5350?text=Cert+1'
    ]
  }
])

const total = ref(48)

const filteredList = computed(() => {
  let list = wasteList.value
  
  if (statusFilter.value) {
    list = list.filter(item => item.status === statusFilter.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.wasteId.toLowerCase().includes(keyword) ||
      item.wasteName.toLowerCase().includes(keyword) ||
      item.enterprise.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.status = statusFilter.value
  queryParams.page = 1
}

const handleReset = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentItem.value = row
  reviewForm.opinion = ''
  detailDialogVisible.value = true
}

const handleApprove = (row) => {
  currentItem.value = row
  reviewForm.opinion = ''
  detailDialogVisible.value = true
}

const handleReject = (row) => {
  currentItem.value = row
  reviewForm.opinion = ''
  detailDialogVisible.value = true
}

const confirmApprove = async () => {
  try {
    await ElMessageBox.confirm(
      '确定审核通过该危废申请吗？通过后将生成正式危废记录。',
      '审核通过确认',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success',
        confirmButtonClass: 'el-button--success'
      }
    )
    const item = wasteList.value.find(item => item.id === currentItem.value.id)
    if (item) item.status = 'approved'
    if (currentItem.value) currentItem.value.status = 'approved'
    stats.value.pending--
    stats.value.passed++
    ElMessage.success('审核通过成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const confirmReject = async () => {
  if (!reviewForm.opinion.trim()) {
    ElMessage.warning('请填写审核拒绝意见')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定拒绝该危废申请吗？',
      '审核拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const item = wasteList.value.find(item => item.id === currentItem.value.id)
    if (item) item.status = 'rejected'
    if (currentItem.value) currentItem.value.status = 'rejected'
    stats.value.pending--
    stats.value.rejected++
    detailDialogVisible.value = false
    ElMessage.success('已拒绝该申请')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handlePreviewImage = (src) => {
  previewImage.value = src
  previewVisible.value = true
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
.hazardous-review-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 20px 24px 0;
}

.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.warning-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-brief {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-value.pending {
  color: #e6a23c;
}

.stat-value.passed {
  color: #67c23a;
}

.stat-value.rejected {
  color: #f56c6c;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.filter-left {
  display: flex;
  gap: 12px;
}

.filter-right {
  display: flex;
  gap: 10px;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.waste-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hazardous-tag {
  flex-shrink: 0;
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

.review-dialog :deep(.el-dialog__body) {
  padding: 16px 24px 20px;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-section {
  padding-bottom: 16px;
  border-bottom: 1px dashed #e0e0e0;
}

.review-section:last-child {
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
  border-left: 3px solid #f56c6c;
}

.section-title .el-icon {
  color: #f56c6c;
}

.cert-files {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cert-file-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.cert-file-item:hover {
  transform: scale(1.05);
}

.cert-thumb {
  width: 100px;
  height: 100px;
  border-radius: 6px;
  border: 1px solid #eee;
}

.cert-file-name {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
