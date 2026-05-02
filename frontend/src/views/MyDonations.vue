<template>
  <div class="my-donations-container">
    <div class="page-header">
      <h1 class="page-title">我的捐赠</h1>
    </div>

    <el-card class="card">
      <el-table :data="donations" style="width: 100%" v-loading="loading">
        <el-table-column prop="project_title" label="项目名称" />
        <el-table-column prop="amount" label="捐赠金额" width="150">
          <template #default="scope">
            <span style="color: #409EFF; font-weight: 600">¥{{ formatAmount(scope.row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="track_id" label="溯源编号" width="200">
          <template #default="scope">
            <el-tag type="info">{{ scope.row.track_id }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certificate_no" label="证书编号" width="200">
          <template #default="scope">
            <el-tag type="success" v-if="scope.row.certificate_no">{{ scope.row.certificate_no }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'completed' ? 'success' : 'info'">
              {{ scope.row.status === 'completed' ? '已完成' : '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="捐赠时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at ? new Date(scope.row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="success" link @click="viewCertificate(scope.row.track_id)" v-if="scope.row.certificate_no">
              查看证书
            </el-button>
            <el-button type="primary" link @click="trackDonation(scope.row.track_id)">
              溯源查询
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="donations.length === 0 && !loading" description="暂无捐赠记录" />
    </el-card>

    <el-dialog v-model="trackDialogVisible" title="捐赠溯源详情" width="800px">
      <div v-if="trackData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="捐赠编号">{{ trackData.donation?.track_id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ trackData.donation?.project_title }}</el-descriptions-item>
          <el-descriptions-item label="捐赠金额">¥{{ formatAmount(trackData.donation?.amount) }}</el-descriptions-item>
          <el-descriptions-item label="捐赠时间">
            {{ trackData.donation?.created_at ? new Date(trackData.donation.created_at).toLocaleString() : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="证书编号" :span="2">
            <el-tag type="success">{{ trackData.certificate?.certificate_no || '-' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>资金流向</el-divider>
        <el-table :data="trackData.payments || []" style="width: 100%">
          <el-table-column prop="task_name" label="关联任务" />
          <el-table-column prop="vendor_name" label="收款方" />
          <el-table-column prop="amount" label="支付金额" width="150">
            <template #default="scope">
              <span style="color: #E6A23C">¥{{ formatAmount(scope.row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
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
        <el-empty v-if="trackData.payments?.length === 0" description="暂无支付记录" :image-size="80" />

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
              <el-tag v-if="scope.row.voucher_type">{{ getVoucherTypeName(scope.row.voucher_type) }}</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="file_name" label="文件名" width="200">
            <template #default="scope">
              {{ scope.row.file_name || '-' }}
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
        <el-empty v-if="trackData.tasks?.length === 0" description="暂无执行任务" :image-size="80" />
      </div>
    </el-dialog>

    <el-dialog v-model="certificateDialogVisible" title="🎉 电子捐赠证书" width="500px" :close-on-click-modal="false">
      <div class="certificate-container">
        <div class="certificate-header">
          <el-icon :size="48" color="#E6A23C"><Star /></el-icon>
          <h2>捐赠证书</h2>
        </div>
        <div class="certificate-body">
          <p class="thank-you">感谢您的爱心捐赠！</p>
          <el-divider />
          <el-descriptions :column="1" border size="large">
            <el-descriptions-item label="捐赠人">
              <span class="highlight-text">{{ certificateData?.donor_name }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="项目名称">
              <span class="highlight-text">{{ certificateData?.project_title }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="捐赠金额">
              <span class="amount-text">¥{{ formatAmount(certificateData?.amount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="证书编号">
              <el-tag type="success" size="large">{{ certificateData?.certificate_no }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="溯源编号">
              <el-tag type="info" size="large">{{ certificateData?.track_id }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="签发时间">
              {{ certificateData?.issued_at ? new Date(certificateData.issued_at).toLocaleString() : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="certificate-footer">
          <p class="tip">此证书具有唯一溯源编号，可在"我的捐赠"中随时查看</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="certificateDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { donationApi } from '@/api'

const donations = ref([])
const loading = ref(false)
const trackDialogVisible = ref(false)
const trackData = ref(null)
const certificateDialogVisible = ref(false)
const certificateData = ref(null)

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

const fetchDonations = async () => {
  loading.value = true
  try {
    const result = await donationApi.getMy()
    if (result.success) {
      donations.value = result.donations
    }
  } catch (error) {
    ElMessage.error('获取捐赠记录失败')
  } finally {
    loading.value = false
  }
}

const trackDonation = async (trackId) => {
  try {
    const result = await donationApi.track(trackId)
    if (result.success) {
      trackData.value = result
      trackDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取溯源详情失败')
  }
}

const viewCertificate = async (trackId) => {
  try {
    const result = await donationApi.track(trackId)
    if (result.success) {
      certificateData.value = {
        ...result.donation,
        certificate_no: result.certificate?.certificate_no,
        issued_at: result.certificate?.issued_at
      }
      certificateDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取证书详情失败')
  }
}

onMounted(() => {
  fetchDonations()
})
</script>

<style scoped>
.certificate-container {
  text-align: center;
}

.certificate-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.certificate-header h2 {
  margin: 15px 0 0;
  font-size: 24px;
  color: #303133;
}

.thank-you {
  font-size: 18px;
  color: #606266;
  margin-bottom: 15px;
}

.highlight-text {
  font-size: 16px;
  font-weight: 600;
  color: #409EFF;
}

.amount-text {
  font-size: 24px;
  font-weight: 700;
  color: #E6A23C;
}

.certificate-footer {
  margin-top: 20px;
}

.certificate-footer .tip {
  font-size: 12px;
  color: #909399;
}
</style>
