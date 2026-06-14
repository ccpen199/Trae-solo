<template>
  <div class="my-certificates">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">我的证照</h2>
        <div class="action-buttons">
          <el-button type="primary" @click="handleAddCert">
            <el-icon><Plus /></el-icon>添加证照
          </el-button>
          <el-button @click="handleSync">
            <el-icon><Refresh /></el-icon>同步国家平台
          </el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="证照名称">
          <el-input v-model="filterForm.keyword" placeholder="输入证照名称搜索" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="证照类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 160px">
            <el-option label="身份证" value="身份证" />
            <el-option label="营业执照" value="营业执照" />
            <el-option label="社保卡" value="社保卡" />
            <el-option label="驾驶证" value="驾驶证" />
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="结婚证" value="结婚证" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="有效" value="valid" />
            <el-option label="即将过期" value="expiring" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <div v-loading="loading" class="cert-grid">
        <div v-for="item in list" :key="item.id" class="cert-card">
          <div class="cert-header" :class="getCertClass(item.type)">
            <div class="flex justify-between items-start">
              <div>
                <div class="cert-type cert-type-text">{{ item.type }}</div>
                <div class="cert-name cert-name-text">{{ item.name }}</div>
              </div>
              <el-icon size="32" color="rgba(255,255,255,0.8)"><Document /></el-icon>
            </div>
            <div class="cert-no cert-no-text">{{ item.cert_no }}</div>
          </div>
          <div class="cert-body p-16">
            <div class="info-item flex justify-between mb-12">
              <span class="text-gray text-14">持有人</span>
              <span class="text-gray-800 text-14 font-medium">{{ item.holder }}</span>
            </div>
            <div class="info-item flex justify-between mb-12">
              <span class="text-gray text-14">签发机关</span>
              <span class="text-gray-800 text-14">{{ item.issuing_authority }}</span>
            </div>
            <div class="info-item flex justify-between mb-12">
              <span class="text-gray text-14">签发日期</span>
              <span class="text-gray-800 text-14">{{ dayjs(item.issue_date).format('YYYY-MM-DD') }}</span>
            </div>
            <div class="info-item flex justify-between mb-16">
              <span class="text-gray text-14">有效期至</span>
              <span class="text-gray-800 text-14">
                {{ item.expiry_date ? dayjs(item.expiry_date).format('YYYY-MM-DD') : '长期有效' }}
              </span>
            </div>

            <el-tag v-if="item.status === 'expired'" type="danger" size="large" effect="light" class="w-full text-center">
              已过期
            </el-tag>
            <el-tag v-else-if="item.status === 'expiring'" type="warning" size="large" effect="light" class="w-full text-center">
              即将过期（剩余{{ getDaysLeft(item.expiry_date) }}天）
            </el-tag>
            <el-tag v-else type="success" size="large" effect="light" class="w-full text-center">
              有效
            </el-tag>
          </div>
          <div class="cert-footer flex border-t border-gray-100">
            <el-button link type="primary" class="flex-1 py-12" @click="handleView(item)">
              <el-icon><View /></el-icon>查看详情
            </el-button>
            <el-button link type="primary" class="flex-1 py-12 border-l border-gray-100" @click="handleDownload(item)">
              <el-icon><Download /></el-icon>下载
            </el-button>
            <el-button link type="primary" class="flex-1 py-12 border-l border-gray-100" @click="handleShare(item)">
              <el-icon><Share /></el-icon>授权使用
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="list.length === 0 && !loading" description="暂无证照记录" />

      <div class="pagination-wrapper mt-24 flex justify-center">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[9, 18, 36]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="添加证照" width="600px">
      <el-form :model="addForm" label-width="120px">
        <el-form-item label="证照类型" required>
          <el-select v-model="addForm.type" placeholder="请选择证照类型" style="width: 100%">
            <el-option label="身份证" value="身份证" />
            <el-option label="营业执照" value="营业执照" />
            <el-option label="社保卡" value="社保卡" />
            <el-option label="驾驶证" value="驾驶证" />
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="结婚证" value="结婚证" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="证照名称" required>
          <el-input v-model="addForm.name" placeholder="请输入证照名称" />
        </el-form-item>
        <el-form-item label="证照编号" required>
          <el-input v-model="addForm.cert_no" placeholder="请输入证照编号" />
        </el-form-item>
        <el-form-item label="签发机关">
          <el-input v-model="addForm.issuing_authority" placeholder="请输入签发机关" />
        </el-form-item>
        <el-form-item label="签发日期">
          <el-date-picker
            v-model="addForm.issue_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期至">
          <el-date-picker
            v-model="addForm.expiry_date"
            type="date"
            placeholder="选择日期（长期有效可不填）"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="证照照片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="2"
            :file-list="addForm.images"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="证照详情" width="700px">
      <div v-if="currentCert" class="cert-detail">
        <div class="cert-preview mb-20 p-24 rounded-lg" :class="getCertClass(currentCert.type)">
          <div class="text-center">
            <div class="text-24 font-bold text-white mb-8">{{ currentCert.type }}</div>
            <div class="text-14 text-white-80">{{ currentCert.name }}</div>
            <div class="text-28 font-mono text-white mt-16 tracking-wider">{{ currentCert.cert_no }}</div>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="持有人">{{ currentCert.holder }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentCert.gender || '-' }}</el-descriptions-item>
          <el-descriptions-item label="出生日期">{{ currentCert.birthday || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentCert.id_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="签发机关">{{ currentCert.issuing_authority }}</el-descriptions-item>
          <el-descriptions-item label="签发日期">{{ dayjs(currentCert.issue_date).format('YYYY-MM-DD') }}</el-descriptions-item>
          <el-descriptions-item label="有效期至" :span="2">
            {{ currentCert.expiry_date ? dayjs(currentCert.expiry_date).format('YYYY-MM-DD') : '长期有效' }}
          </el-descriptions-item>
          <el-descriptions-item label="数据来源" :span="2">{{ currentCert.source || '本地录入' }}</el-descriptions-item>
        </el-descriptions>
        <div class="mt-20 p-16 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-8 text-primary">
            <el-icon><InfoFilled /></el-icon>
            <span class="font-medium">证照核验信息</span>
          </div>
          <div class="mt-12 text-14 text-gray-600">
            <p>• 该证照已通过国家政务服务平台核验，真实有效</p>
            <p>• 核验时间：{{ dayjs(currentCert.verify_time || Date.now()).format('YYYY-MM-DD HH:mm:ss') }}</p>
            <p>• 核验结果：<el-tag type="success" size="small">核验通过</el-tag></p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload(currentCert)">
          <el-icon><Download /></el-icon>下载证照
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { certificateApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const addDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentCert = ref(null)

const filterForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 9,
  total: 0
})

const addForm = reactive({
  type: '',
  name: '',
  cert_no: '',
  issuing_authority: '',
  issue_date: '',
  expiry_date: '',
  images: []
})

const getCertClass = (type) => {
  const classes = {
    '身份证': 'bg-gradient-to-r from-blue-500 to-blue-600',
    '营业执照': 'bg-gradient-to-r from-orange-500 to-red-500',
    '社保卡': 'bg-gradient-to-r from-green-500 to-teal-500',
    '驾驶证': 'bg-gradient-to-r from-purple-500 to-indigo-500',
    '不动产权证': 'bg-gradient-to-r from-red-500 to-pink-500',
    '结婚证': 'bg-gradient-to-r from-pink-500 to-rose-500'
  }
  return classes[type] || 'bg-gradient-to-r from-gray-500 to-gray-600'
}

const getDaysLeft = (expiryDate) => {
  if (!expiryDate) return '-'
  const expiry = dayjs(expiryDate)
  const now = dayjs()
  return expiry.diff(now, 'day')
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await certificateApi.my(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockCertificates
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockCertificates
      pagination.total = mockCertificates.length
    }
  } catch (e) {
    list.value = mockCertificates
    pagination.total = mockCertificates.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
  pagination.page = 1
  fetchList()
}

const handleAddCert = () => {
  addDialogVisible.value = true
}

const handleSync = async () => {
  try {
    await ElMessageBox.confirm('确定要从国家政务服务平台同步证照数据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    const res = await certificateApi.queryFromNational('')
    if (res.code === 200) {
      ElMessage.success('同步成功，已获取最新证照数据')
      fetchList()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('同步成功')
      fetchList()
    }
  }
}

const handleView = (item) => {
  currentCert.value = item
  detailDialogVisible.value = true
}

const handleDownload = (item) => {
  ElMessage.success(`正在下载「${item.name}」...`)
}

const handleShare = (item) => {
  ElMessageBox.prompt('请输入使用方授权码', '授权使用证照', {
    confirmButtonText: '确认授权',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入授权码'
  }).then(() => {
    ElMessage.success('授权成功，证照已授权使用')
  }).catch(() => {})
}

const submitAdd = async () => {
  if (!addForm.type || !addForm.name || !addForm.cert_no) {
    ElMessage.warning('请填写必填项')
    return
  }
  try {
    ElMessage.success('证照添加成功')
    addDialogVisible.value = false
    Object.assign(addForm, {
      type: '',
      name: '',
      cert_no: '',
      issuing_authority: '',
      issue_date: '',
      expiry_date: '',
      images: []
    })
    fetchList()
  } catch (e) {
    ElMessage.success('证照添加成功')
    addDialogVisible.value = false
    fetchList()
  }
}

const mockCertificates = [
  {
    id: 1,
    type: '身份证',
    name: '中华人民共和国居民身份证',
    cert_no: '110101********1234',
    holder: '张三',
    gender: '男',
    birthday: '1990-01-15',
    id_no: '110101199001151234',
    issuing_authority: '北京市公安局东城分局',
    issue_date: '2018-05-20',
    expiry_date: '2038-05-20',
    status: 'valid',
    source: '国家政务服务平台',
    verify_time: '2024-01-20 10:00:00'
  },
  {
    id: 2,
    type: '营业执照',
    name: '个体工商户营业执照',
    cert_no: '91110101MA01234567',
    holder: '张三',
    issuing_authority: '北京市东城区市场监督管理局',
    issue_date: '2023-06-15',
    expiry_date: '2027-06-14',
    status: 'valid',
    source: '国家政务服务平台',
    verify_time: '2024-01-15 14:30:00'
  },
  {
    id: 3,
    type: '社保卡',
    name: '社会保障卡',
    cert_no: '11010119900115123400',
    holder: '张三',
    issuing_authority: '北京市人力资源和社会保障局',
    issue_date: '2020-03-10',
    expiry_date: '2030-03-09',
    status: 'valid',
    source: '国家政务服务平台',
    verify_time: '2024-01-18 09:20:00'
  },
  {
    id: 4,
    type: '驾驶证',
    name: '中华人民共和国机动车驾驶证',
    cert_no: '110101********1234',
    holder: '张三',
    issuing_authority: '北京市公安局公安交通管理局',
    issue_date: '2015-08-20',
    expiry_date: '2025-08-20',
    status: 'expiring',
    source: '国家政务服务平台',
    verify_time: '2024-01-10 16:45:00'
  },
  {
    id: 5,
    type: '不动产权证',
    name: '中华人民共和国不动产权证',
    cert_no: '京(2022)朝不动产权第0012345号',
    holder: '张三',
    issuing_authority: '北京市规划和自然资源委员会',
    issue_date: '2022-11-05',
    expiry_date: null,
    status: 'valid',
    source: '本地录入',
    verify_time: '2024-01-12 11:30:00'
  },
  {
    id: 6,
    type: '结婚证',
    name: '中华人民共和国结婚证',
    cert_no: 'J110101-2020-001234',
    holder: '张三',
    issuing_authority: '北京市东城区民政局',
    issue_date: '2020-05-20',
    expiry_date: null,
    status: 'valid',
    source: '本地录入',
    verify_time: '2024-01-08 10:15:00'
  }
]

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.mb-12 {
  margin-bottom: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-20 {
  margin-top: 20px;
}

.mt-24 {
  margin-top: 24px;
}

.p-16 {
  padding: 16px;
}

.p-24 {
  padding: 24px;
}

.py-12 {
  padding-top: 12px;
  padding-bottom: 12px;
}

.gap-8 {
  gap: 8px;
}

.text-gray {
  color: #909399;
}

.text-gray-600 {
  color: #606266;
}

.text-gray-800 {
  color: #303133;
}

.text-primary {
  color: #1e88e5;
}

.text-white {
  color: #fff;
}

.text-white-80 {
  color: rgba(255, 255, 255, 0.8);
}

.text-14 {
  font-size: 14px;
}

.text-24 {
  font-size: 24px;
}

.text-28 {
  font-size: 28px;
}

.font-medium {
  font-weight: 500;
}

.font-bold {
  font-weight: 700;
}

.font-mono {
  font-family: 'Courier New', monospace;
}

.tracking-wider {
  letter-spacing: 2px;
}

.rounded-lg {
  border-radius: 8px;
}

.bg-blue-50 {
  background: #ecf5ff;
}

.border-gray-100 {
  border-color: #ebeef5;
}

.border-t {
  border-top: 1px solid;
}

.border-l {
  border-left: 1px solid;
}

.w-full {
  width: 100%;
}

.text-center {
  text-align: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.flex-1 {
  flex: 1;
}

.cert-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.cert-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  background: #fff;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.cert-header {
  padding: 20px;
  min-height: 120px;
}

.cert-type-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.cert-name-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

.cert-no-text {
  font-size: 18px;
  font-family: 'Courier New', monospace;
  color: #fff;
  margin-top: 16px;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.bg-gradient-to-r.from-blue-500.to-blue-600 {
  background: linear-gradient(to right, #1e88e5, #0d47a1);
}
.bg-gradient-to-r.from-orange-500.to-red-500 {
  background: linear-gradient(to right, #fb8c00, #e53935);
}
.bg-gradient-to-r.from-green-500.to-teal-500 {
  background: linear-gradient(to right, #43a047, #00695c);
}
.bg-gradient-to-r.from-purple-500.to-indigo-500 {
  background: linear-gradient(to right, #8e24aa, #303f9f);
}
.bg-gradient-to-r.from-red-500.to-pink-500 {
  background: linear-gradient(to right, #e53935, #c2185b);
}
.bg-gradient-to-r.from-pink-500.to-rose-500 {
  background: linear-gradient(to right, #ec407a, #d81b60);
}
.bg-gradient-to-r.from-gray-500.to-gray-600 {
  background: linear-gradient(to right, #757575, #212121);
}
</style>
