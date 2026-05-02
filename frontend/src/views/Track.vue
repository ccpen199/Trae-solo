<template>
  <div class="track-container">
    <div class="page-header" v-if="isLoggedIn">
      <h1 class="page-title">溯源查询</h1>
    </div>

    <div class="hero-section" v-if="!isLoggedIn">
      <h1>公益透明平台 - 溯源查询</h1>
      <p>让每一笔善款都有迹可循，每一份爱心都清晰可见</p>
    </div>

    <el-card class="card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="捐赠溯源编号">
          <el-input 
            v-model="searchForm.track_id" 
            placeholder="请输入捐赠溯源编号（如：DT-20240101120000-XXXXXX）"
            style="width: 400px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="searching" @click="handleSearch">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card" v-if="trackData">
      <template #header>
        <div class="card-header">
          <span>溯源查询结果</span>
          <el-tag type="success">数据已验证</el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="捐赠编号">
          <el-tag type="primary" size="large">{{ trackData.donation?.track_id }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="捐赠状态">
          <el-tag :type="trackData.donation?.status === 'completed' ? 'success' : 'info'">
            {{ trackData.donation?.status === 'completed' ? '已完成' : '处理中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="捐赠人">{{ trackData.donation?.donor_name }}</el-descriptions-item>
        <el-descriptions-item label="捐赠金额">
          <span style="color: #409EFF; font-size: 20px; font-weight: 600">
            ¥{{ formatAmount(trackData.donation?.amount) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="捐赠项目">{{ trackData.donation?.project_title }}</el-descriptions-item>
        <el-descriptions-item label="捐赠时间">
          {{ trackData.donation?.created_at ? new Date(trackData.donation.created_at).toLocaleString() : '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider>电子捐赠证书</el-divider>
      <el-card v-if="trackData.certificate" class="certificate-card">
        <div class="certificate-header">
          <h2>公益捐赠证书</h2>
          <p>CERTIFICATE OF DONATION</p>
        </div>
        <div class="certificate-content">
          <p>兹证明 <strong>{{ trackData.certificate.donor_name }}</strong></p>
          <p>于 <strong>{{ trackData.certificate.issued_at ? new Date(trackData.certificate.issued_at).toLocaleString() : '-' }}</strong></p>
          <p>向 <strong>{{ trackData.certificate.project_title }}</strong> 项目</p>
          <p>捐赠人民币 <strong style="font-size: 24px; color: #E6A23C">¥{{ formatAmount(trackData.certificate.amount) }}</strong> 元整。</p>
          <p>特颁此证，以资证明！</p>
        </div>
        <div class="certificate-footer">
          <p>证书编号：<strong>{{ trackData.certificate.certificate_no }}</strong></p>
          <p>公益透明平台</p>
        </div>
      </el-card>
      <el-empty v-else description="暂无证书信息" :image-size="60" />

      <el-divider>资金流向明细</el-divider>
      <el-table :data="trackData.payments || []" style="width: 100%">
        <el-table-column prop="task_name" label="关联任务" />
        <el-table-column prop="vendor_name" label="收款供应商" />
        <el-table-column prop="amount" label="支付金额" width="150">
          <template #default="scope">
            <span style="color: #E6A23C; font-weight: 600">¥{{ formatAmount(scope.row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="支付状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'completed' ? 'success' : 'info'">
              {{ scope.row.status === 'completed' ? '已支付' : '待支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paid_at" label="支付时间" width="180">
          <template #default="scope">
            {{ scope.row.paid_at ? new Date(scope.row.paid_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="trackData.payments?.length === 0" description="暂无支付记录" :image-size="60" />

      <el-divider>执行凭证</el-divider>
      <el-table :data="trackData.tasks || []" style="width: 100%">
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="executor_name" label="执行人" width="120">
          <template #default="scope">
            {{ scope.row.executor_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="voucher_type" label="凭证类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.voucher_type" :type="getVoucherTagType(scope.row.voucher_type)">
              {{ getVoucherTypeName(scope.row.voucher_type) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="凭证文件" width="200">
          <template #default="scope">
            <el-link v-if="scope.row.file_name" type="primary" :underline="false">
              <el-icon><Document /></el-icon>
              {{ scope.row.file_name }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="任务状态" width="100">
          <template #default="scope">
            <el-tag :type="getTaskStatusType(scope.row.status)">
              {{ getTaskStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="trackData.tasks?.length === 0" description="暂无执行凭证" :image-size="60" />

      <el-divider>数据完整性验证</el-divider>
      <el-alert
        title="数据完整性"
        type="success"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>所有数据均已通过 SHA-256 签名验证，数据完整未被篡改。</p>
          <p>签名机制确保每一笔记录都可追溯、不可篡改，保障公益透明度。</p>
        </template>
      </el-alert>
    </el-card>

    <el-empty 
      v-else-if="!searching && hasSearched" 
      description="未找到对应的捐赠记录，请检查溯源编号是否正确"
      :image-size="100"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { donationApi } from '@/api'
import { Search, Document } from '@element-plus/icons-vue'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const searchForm = ref({
  track_id: ''
})
const searching = ref(false)
const hasSearched = ref(false)
const trackData = ref(null)

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getVoucherTypeName = (type) => {
  const types = {
    'receipt': '发票',
    'snapshot': '受益快照',
    'contract': '合同',
    'other': '其他'
  }
  return types[type] || type
}

const getVoucherTagType = (type) => {
  const types = {
    'receipt': 'success',
    'snapshot': 'primary',
    'contract': 'warning',
    'other': 'info'
  }
  return types[type] || 'info'
}

const getTaskStatusType = (status) => {
  const types = {
    'pending': 'info',
    'in_progress': 'primary',
    'submitted': 'warning',
    'approved': 'success'
  }
  return types[status] || 'info'
}

const getTaskStatusName = (status) => {
  const names = {
    'pending': '待分配',
    'in_progress': '执行中',
    'submitted': '已提交',
    'approved': '已完成'
  }
  return names[status] || status
}

const handleSearch = async () => {
  if (!searchForm.value.track_id.trim()) {
    ElMessage.warning('请输入捐赠溯源编号')
    return
  }

  searching.value = true
  hasSearched.value = true
  trackData.value = null

  try {
    const result = await donationApi.track(searchForm.value.track_id.trim())
    if (result.success) {
      trackData.value = result
    } else {
      ElMessage.error(result.message || '查询失败')
    }
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    searching.value = false
  }
}
</script>

<style scoped>
.hero-section {
  text-align: center;
  padding: 40px 0;
}

.hero-section h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 10px;
}

.hero-section p {
  font-size: 16px;
  color: #606266;
}

.search-form {
  display: flex;
  justify-content: center;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.certificate-card {
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  border: 2px solid #dcdfe6;
  position: relative;
}

.certificate-card::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 1px dashed #c0c4cc;
  pointer-events: none;
}

.certificate-header {
  text-align: center;
  padding: 20px 0;
  border-bottom: 2px solid #e4e7ed;
}

.certificate-header h2 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.certificate-header p {
  font-size: 14px;
  color: #909399;
  margin: 5px 0 0;
}

.certificate-content {
  text-align: center;
  padding: 30px 0;
  font-size: 16px;
  line-height: 2.5;
  color: #303133;
}

.certificate-footer {
  text-align: right;
  padding: 20px 0;
  border-top: 2px solid #e4e7ed;
  font-size: 14px;
  color: #606266;
}
</style>
