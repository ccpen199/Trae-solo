<template>
  <div class="user-audit-container">
    <el-card class="header-card" shadow="never">
      <div class="card-header-wrapper">
        <span class="card-title">用户资质审核</span>
      </div>
      <el-tabs v-model="activeTab" class="audit-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="待审核" name="pending">
          <span class="tab-badge pending">{{ stats.pending }}</span>
        </el-tab-pane>
        <el-tab-pane label="已通过" name="approved">
          <span class="tab-badge approved">{{ stats.approved }}</span>
        </el-tab-pane>
        <el-tab-pane label="已拒绝" name="rejected">
          <span class="tab-badge rejected">{{ stats.rejected }}</span>
        </el-tab-pane>
      </el-tabs>

      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名、企业名称、手机号"
          clearable
          style="width: 320px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="filteredList" style="width: 100%" stripe>
        <el-table-column label="用户信息" min-width="220">
          <template #default="scope">
            <div class="user-cell">
              <el-avatar :size="40" :src="scope.row.avatar">
                {{ scope.row.username.charAt(0) }}
              </el-avatar>
              <div class="user-info">
                <div class="username">{{ scope.row.username }}</div>
                <div class="user-phone">{{ scope.row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="enterprise" label="企业名称" min-width="200" />
        <el-table-column label="角色" width="110">
          <template #default="scope">
            <el-tag :type="roleTypeMap[scope.row.role]" effect="light" size="small">
              {{ roleTextMap[scope.row.role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light" size="small">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
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

    <el-dialog v-model="detailDialogVisible" title="用户资质详情" width="720px">
      <div v-if="currentUser" class="detail-content">
        <div class="detail-section">
          <div class="section-title">
            <el-icon><User /></el-icon>
            基本信息
          </div>
          <div class="user-profile">
            <el-avatar :size="64" :src="currentUser.avatar">
              {{ currentUser.username.charAt(0) }}
            </el-avatar>
            <div class="profile-info">
              <h3 class="profile-name">{{ currentUser.username }}</h3>
              <el-tag :type="roleTypeMap[currentUser.role]" effect="light">
                {{ roleTextMap[currentUser.role] }}
              </el-tag>
            </div>
          </div>
          <el-descriptions :column="2" border size="default" style="margin-top: 16px">
            <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentUser.registerTime }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="statusTypeMap[currentUser.status]" effect="light">
                {{ statusTextMap[currentUser.status] }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><OfficeBuilding /></el-icon>
            企业信息
          </div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="企业名称" :span="2">{{ currentUser.enterprise }}</el-descriptions-item>
            <el-descriptions-item label="统一社会信用代码">{{ currentUser.creditCode }}</el-descriptions-item>
            <el-descriptions-item label="企业类型">{{ currentUser.enterpriseType }}</el-descriptions-item>
            <el-descriptions-item label="法人代表">{{ currentUser.legalPerson }}</el-descriptions-item>
            <el-descriptions-item label="注册资本">{{ currentUser.registeredCapital }}</el-descriptions-item>
            <el-descriptions-item label="企业地址" :span="2">{{ currentUser.address }}</el-descriptions-item>
            <el-descriptions-item label="经营范围" :span="2">{{ currentUser.businessScope }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon><Picture /></el-icon>
            资质证书
          </div>
          <div class="cert-list">
            <div
              v-for="(cert, index) in currentUser.certificates"
              :key="index"
              class="cert-item"
              @click="previewCert(cert)"
            >
              <div class="cert-icon">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="cert-info">
                <div class="cert-name">{{ cert.name }}</div>
                <div class="cert-status">
                  <el-tag :type="cert.status === 'valid' ? 'success' : 'warning'" size="small" effect="light">
                    {{ cert.status === 'valid' ? '有效' : '已过期' }}
                  </el-tag>
                </div>
              </div>
              <el-image :src="cert.image" fit="cover" class="cert-thumb" />
            </div>
          </div>
        </div>

        <div v-if="currentUser.rejectReason" class="detail-section">
          <div class="section-title reject-title">
            <el-icon><Warning /></el-icon>
            拒绝原因
          </div>
          <div class="reject-reason-box">
            {{ currentUser.rejectReason }}
          </div>
        </div>

        <div v-if="currentUser.status === 'pending'" class="detail-section">
          <div class="section-title">
            <el-icon><Edit /></el-icon>
            审核意见
          </div>
          <el-input
            v-model="auditForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见（选填）"
            maxlength="500"
            show-word-limit
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentUser?.status === 'pending'"
          type="danger"
          @click="confirmReject"
        >
          审核拒绝
        </el-button>
        <el-button
          v-if="currentUser?.status === 'pending'"
          type="success"
          @click="confirmApprove"
        >
          审核通过
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="certPreviewVisible" title="证书预览" width="700px">
      <el-image :src="previewCertImage" fit="contain" style="width: 100%; height: 500px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, User, OfficeBuilding, Picture, Edit, Warning, Document
} from '@element-plus/icons-vue'

const activeTab = ref('pending')
const searchKeyword = ref('')
const detailDialogVisible = ref(false)
const certPreviewVisible = ref(false)
const currentUser = ref(null)
const previewCertImage = ref('')

const stats = ref({
  pending: 23,
  approved: 2856,
  rejected: 47
})

const roleTypeMap = {
  producer: 'warning',
  collector: 'primary',
  processor: 'success',
  admin: 'danger'
}

const roleTextMap = {
  producer: '产废方',
  collector: '收废商',
  processor: '利废厂',
  admin: '管理员'
}

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
  status: 'pending',
  keyword: ''
})

const auditForm = reactive({
  opinion: ''
})

const userList = ref([
  {
    id: 1,
    username: 'lvyuan_huishou',
    avatar: '',
    phone: '138****6688',
    email: 'contact@lvyuan.com',
    role: 'collector',
    enterprise: '绿源再生资源回收有限公司',
    creditCode: '91320500MA1N3RKX2T',
    enterpriseType: '有限责任公司',
    legalPerson: '张建国',
    registeredCapital: '500万元',
    address: '江苏省苏州市工业园区星湖街123号',
    businessScope: '再生资源回收、加工、销售；废旧物资回收',
    registerTime: '2024-06-14 09:30:25',
    submitTime: '2024-06-14 10:15:00',
    status: 'pending',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '再生资源经营许可证', status: 'valid', image: 'https://via.placeholder.com/400x300/c5e1a5/81c784?text=Permit' },
      { name: '税务登记证', status: 'valid', image: 'https://via.placeholder.com/400x300/dcedc8/a5d6a7?text=Tax+Cert' }
    ]
  },
  {
    id: 2,
    username: 'baosheng_metal',
    avatar: '',
    phone: '139****2233',
    email: 'baosheng@metal.com',
    role: 'processor',
    enterprise: '宝盛金属再生科技有限公司',
    creditCode: '91330100MA28XXXXX5',
    enterpriseType: '股份有限公司',
    legalPerson: '李志强',
    registeredCapital: '2000万元',
    address: '浙江省杭州市萧山区经济技术开发区456号',
    businessScope: '金属废料和碎屑加工处理；再生资源回收',
    registerTime: '2024-06-13 14:20:10',
    submitTime: '2024-06-13 15:00:00',
    status: 'pending',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '危废经营许可证', status: 'valid', image: 'https://via.placeholder.com/400x300/ffebee/ef5350?text=Hazardous+Permit' }
    ]
  },
  {
    id: 3,
    username: 'huasheng_paper',
    avatar: '',
    phone: '137****5566',
    email: '',
    role: 'producer',
    enterprise: '华盛纸业有限公司',
    creditCode: '91320200MA1YYYYY3A',
    enterpriseType: '有限责任公司',
    legalPerson: '王建华',
    registeredCapital: '800万元',
    address: '江苏省无锡市梁溪区清扬路789号',
    businessScope: '纸制品制造、加工、销售；废纸回收',
    registerTime: '2024-06-12 08:30:00',
    submitTime: '2024-06-12 09:00:00',
    status: 'approved',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '环评批复', status: 'valid', image: 'https://via.placeholder.com/400x300/b9f6ca/43a047?text=EIA' }
    ]
  },
  {
    id: 4,
    username: 'antai_env',
    avatar: '',
    phone: '136****7788',
    email: 'antai@env.com',
    role: 'processor',
    enterprise: '安泰环保科技有限公司',
    creditCode: '91310000MA1ZZZZZ8B',
    enterpriseType: '有限责任公司',
    legalPerson: '赵天明',
    registeredCapital: '3000万元',
    address: '上海市浦东新区张江高科技园区901号',
    businessScope: '危险废物经营；环保技术开发、咨询',
    registerTime: '2024-06-11 13:50:00',
    submitTime: '2024-06-11 14:30:00',
    status: 'rejected',
    rejectReason: '危废经营许可证已过期，请更新后重新提交',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '危废经营许可证', status: 'expired', image: 'https://via.placeholder.com/400x300/ffebee/ef5350?text=Hazardous+Permit' }
    ]
  },
  {
    id: 5,
    username: 'shunda_machinery',
    avatar: '',
    phone: '135****9900',
    email: '',
    role: 'collector',
    enterprise: '顺达二手机械设备有限公司',
    creditCode: '91441900MA2AAAAA7C',
    enterpriseType: '有限责任公司',
    legalPerson: '孙德胜',
    registeredCapital: '200万元',
    address: '广东省东莞市塘厦镇工业区234号',
    businessScope: '二手机械设备回收、销售、维修',
    registerTime: '2024-06-10 11:20:00',
    submitTime: '2024-06-10 12:00:00',
    status: 'approved',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' }
    ]
  },
  {
    id: 6,
    username: 'jinyuan_precious',
    avatar: '',
    phone: '134****1122',
    email: 'jinyuan@precious.com',
    role: 'processor',
    enterprise: '金源贵金属回收有限公司',
    creditCode: '91440300MA2BBBBB9D',
    enterpriseType: '有限责任公司',
    legalPerson: '周金宝',
    registeredCapital: '1500万元',
    address: '广东省深圳市龙岗区坂田街道567号',
    businessScope: '贵金属回收、提炼、加工；废旧物资回收',
    registerTime: '2024-06-09 16:00:00',
    submitTime: '2024-06-09 16:30:00',
    status: 'pending',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '危险废物经营许可证', status: 'valid', image: 'https://via.placeholder.com/400x300/ffebee/ef5350?text=Hazardous+Permit' },
      { name: '排污许可证', status: 'valid', image: 'https://via.placeholder.com/400x300/b9f6ca/43a047?text=Pollution+Permit' }
    ]
  },
  {
    id: 7,
    username: 'xinhua_chem',
    avatar: '',
    phone: '133****3344',
    email: '',
    role: 'producer',
    enterprise: '新华化工有限公司',
    creditCode: '91370200MA3CCCCC2E',
    enterpriseType: '有限责任公司',
    legalPerson: '吴新华',
    registeredCapital: '600万元',
    address: '山东省青岛市黄岛区临港路123号',
    businessScope: '化工产品生产、销售；工业废料处理',
    registerTime: '2024-06-08 09:00:00',
    submitTime: '2024-06-08 10:00:00',
    status: 'approved',
    rejectReason: '',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' },
      { name: '安全生产许可证', status: 'valid', image: 'https://via.placeholder.com/400x300/fff3e0/ff9800?text=Safety+Permit' }
    ]
  },
  {
    id: 8,
    username: 'luming_plastic',
    avatar: '',
    phone: '132****5566',
    email: 'luming@plastic.com',
    role: 'producer',
    enterprise: '路明塑料科技有限公司',
    creditCode: '91330200MA3DDDDD5F',
    enterpriseType: '私营企业',
    legalPerson: '郑路明',
    registeredCapital: '100万元',
    address: '浙江省宁波市北仑区小港街道678号',
    businessScope: '塑料制品制造、加工；塑料原料销售',
    registerTime: '2024-06-07 14:00:00',
    submitTime: '2024-06-07 15:00:00',
    status: 'rejected',
    rejectReason: '企业营业执照信息与工商系统不一致，请核实后重新提交',
    certificates: [
      { name: '营业执照', status: 'valid', image: 'https://via.placeholder.com/400x300/e8f5e9/66bb6a?text=Business+License' }
    ]
  }
])

const total = ref(89)

const filteredList = computed(() => {
  let list = userList.value
  
  list = list.filter(item => item.status === activeTab.value)
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item =>
      item.username.toLowerCase().includes(keyword) ||
      item.enterprise.toLowerCase().includes(keyword) ||
      item.phone.includes(keyword)
    )
  }
  
  return list
})

const handleTabChange = (tab) => {
  queryParams.status = tab
  queryParams.page = 1
}

const handleSearch = () => {
  queryParams.keyword = searchKeyword.value
  queryParams.page = 1
}

const handleDetail = (row) => {
  currentUser.value = row
  auditForm.opinion = ''
  detailDialogVisible.value = true
}

const handleApprove = (row) => {
  currentUser.value = row
  auditForm.opinion = ''
  detailDialogVisible.value = true
}

const handleReject = (row) => {
  currentUser.value = row
  auditForm.opinion = ''
  detailDialogVisible.value = true
}

const previewCert = (cert) => {
  previewCertImage.value = cert.image
  certPreviewVisible.value = true
}

const confirmApprove = async () => {
  try {
    await ElMessageBox.confirm(
      '确定审核通过该用户资质吗？',
      '审核通过确认',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    const item = userList.value.find(item => item.id === currentUser.value.id)
    if (item) item.status = 'approved'
    if (currentUser.value) currentUser.value.status = 'approved'
    stats.value.pending--
    stats.value.approved++
    detailDialogVisible.value = false
    ElMessage.success('审核通过成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const confirmReject = async () => {
  if (!auditForm.opinion.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定拒绝该用户资质申请吗？',
      '审核拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const item = userList.value.find(item => item.id === currentUser.value.id)
    if (item) {
      item.status = 'rejected'
      item.rejectReason = auditForm.opinion
    }
    if (currentUser.value) {
      currentUser.value.status = 'rejected'
      currentUser.value.rejectReason = auditForm.opinion
    }
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

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.page = 1
}

const handleCurrentChange = (val) => {
  queryParams.page = val
}
</script>

<style scoped>
.user-audit-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 12px;
}

.header-card :deep(.el-card__body) {
  padding: 16px 20px 0;
}

.card-header-wrapper {
  margin-bottom: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.audit-tabs {
  margin-bottom: 16px;
}

.audit-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.tab-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 6px;
  font-weight: 500;
}

.tab-badge.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.tab-badge.approved {
  background: #f0f9eb;
  color: #67c23a;
}

.tab-badge.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.search-bar {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
}

.table-card {
  border-radius: 12px;
}

.table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
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
  border-left: 3px solid #409eff;
}

.section-title .el-icon {
  color: #409eff;
}

.section-title.reject-title {
  border-left-color: #f56c6c;
}

.section-title.reject-title .el-icon {
  color: #f56c6c;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}

.cert-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cert-item:hover {
  background: #ecf5ff;
}

.cert-icon {
  color: #409eff;
  flex-shrink: 0;
}

.cert-info {
  flex: 1;
  min-width: 0;
}

.cert-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cert-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  flex-shrink: 0;
}

.reject-reason-box {
  padding: 14px 16px;
  background: #fef0f0;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 14px;
  line-height: 1.6;
}
</style>
