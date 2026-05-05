<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="goBack" style="cursor: pointer; color: #409eff;">标定管理</el-breadcrumb-item>
          <el-breadcrumb-item>版本详情</el-breadcrumb-item>
        </el-breadcrumb>
        <h2 style="margin-top: 10px;">标定版本详情</h2>
      </div>
      <div>
        <el-button 
          v-if="version?.status === 'draft'" 
          type="warning" 
          @click="handleSubmitReview"
        >
          提交审核
        </el-button>
        <el-button 
          v-if="authStore.isAdmin && version?.status === 'pending_review'" 
          type="success" 
          @click="showReviewDialog = true"
        >
          审核
        </el-button>
        <el-button 
          v-if="authStore.isAdmin && version?.status === 'reviewed'" 
          type="primary" 
          @click="handlePublish"
        >
          发布
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">基本信息</div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="版本号">
              <el-tag type="primary" size="large">{{ version?.version_code }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="版本名称">{{ version?.version_name }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(version?.status)">
                {{ getStatusText(version?.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="适用车型">{{ version?.model_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="ECU型号">{{ version?.ecu_model || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ version?.created_by_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核人">{{ version?.reviewed_by_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布人">{{ version?.published_by_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="使用次数">{{ version?.usage_count || 0 }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(version?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ formatTime(version?.reviewed_at) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ formatTime(version?.published_at) || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">版本描述</div>
          </template>
          <p style="line-height: 1.8;">{{ version?.description || '暂无描述' }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>标定参数列表</span>
              <el-button 
                v-if="version?.status === 'draft'" 
                type="primary" 
                size="small"
                @click="showAddParamDialog = true"
              >
                添加参数
              </el-button>
            </div>
          </template>
          <el-table :data="versionParams" style="width: 100%" v-loading="paramsLoading">
            <el-table-column prop="param_name" label="参数名称" width="150" />
            <el-table-column prop="param_code" label="参数代码" width="120">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.param_code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                <el-tag size="small">{{ getCategoryText(scope.row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="param_value" label="参数值" width="120">
              <template #default="scope">
                <span style="font-weight: bold; color: #409eff;">
                  {{ scope.row.param_value }}
                  <span v-if="scope.row.unit">{{ scope.row.unit }}</span>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="min_value" label="最小值" width="100" />
            <el-table-column prop="max_value" label="最大值" width="100" />
            <el-table-column prop="default_value" label="默认值" width="100" />
            <el-table-column prop="description" label="描述" min-width="150" />
            <el-table-column label="操作" width="100" fixed="right" v-if="version?.status === 'draft'">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  link 
                  @click="handleEditParam(scope.row)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">审核记录</div>
          </template>
          <el-table :data="reviews" style="width: 100%">
            <el-table-column prop="review_result" label="审核结果" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.review_result === 'approved' ? 'success' : 'danger'">
                  {{ scope.row.review_result === 'approved' ? '通过' : '驳回' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="审核意见" min-width="200" />
            <el-table-column prop="reviewed_by_name" label="审核人" width="100" />
            <el-table-column prop="reviewed_at" label="审核时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.reviewed_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showReviewDialog"
      title="审核标定版本"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewStatus">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="reviewComment"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview" :loading="reviewLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showAddParamDialog"
      :title="isEditParam ? '编辑参数' : '添加参数'"
      width="600px"
    >
      <el-form ref="paramFormRef" :model="paramForm" :rules="paramRules" label-width="100px">
        <el-form-item label="参数名称" prop="param_name">
          <el-input v-model="paramForm.param_name" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数代码" prop="param_code">
          <el-input v-model="paramForm.param_code" placeholder="请输入参数代码" />
        </el-form-item>
        <el-form-item label="参数分类">
          <el-select v-model="paramForm.category" style="width: 100%">
            <el-option label="喷油" value="injection" />
            <el-option label="点火" value="ignition" />
            <el-option label="怠速" value="idle" />
            <el-option label="风扇" value="fan" />
            <el-option label="碳罐电磁阀" value="purge" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="参数值" prop="param_value">
          <el-input-number v-model="paramForm.param_value" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="paramForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="最小值">
          <el-input-number v-model="paramForm.min_value" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大值">
          <el-input-number v-model="paramForm.max_value" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input-number v-model="paramForm.default_value" :step="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="paramForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入参数描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddParamDialog = false">取消</el-button>
        <el-button type="primary" @click="submitParam" :loading="paramLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const versionId = computed(() => route.params.id)

const version = ref(null)
const versionParams = ref([])
const reviews = ref([])
const paramsLoading = ref(false)
const showReviewDialog = ref(false)
const showAddParamDialog = ref(false)
const isEditParam = ref(false)
const paramFormRef = ref(null)
const reviewLoading = ref(false)
const paramLoading = ref(false)

const reviewStatus = ref('approved')
const reviewComment = ref('')

const paramForm = reactive({
  calibration_param_id: null,
  param_name: '',
  param_code: '',
  category: 'injection',
  param_value: 0,
  unit: '',
  min_value: 0,
  max_value: 100,
  default_value: 50,
  description: '',
})

const paramRules = {
  param_name: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  param_code: [{ required: true, message: '请输入参数代码', trigger: 'blur' }],
  param_value: [{ required: true, message: '请输入参数值', trigger: 'blur' }],
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/calibration')
}

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    pending_review: 'warning',
    reviewed: 'primary',
    published: 'success',
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    pending_review: '待审核',
    reviewed: '已审核',
    published: '已发布',
  }
  return texts[status] || status
}

const getCategoryText = (category) => {
  const texts = {
    injection: '喷油',
    ignition: '点火',
    idle: '怠速',
    fan: '风扇',
    purge: '碳罐电磁阀',
    other: '其他',
  }
  return texts[category] || category
}

const fetchVersion = async () => {
  try {
    const data = await request.get(`/calibration/versions/${versionId.value}`)
    version.value = data
  } catch (err) {
    console.error('获取版本详情失败:', err)
  }
}

const fetchVersionParams = async () => {
  paramsLoading.value = true
  try {
    const data = await request.get(`/calibration/versions/${versionId.value}/params`)
    versionParams.value = data
  } catch (err) {
    console.error('获取版本参数失败:', err)
  } finally {
    paramsLoading.value = false
  }
}

const fetchReviews = async () => {
  try {
    const data = await request.get(`/calibration/versions/${versionId.value}/reviews`)
    reviews.value = data
  } catch (err) {
    console.error('获取审核记录失败:', err)
  }
}

const handleSubmitReview = () => {
  ElMessageBox.confirm('确定要提交此版本进行审核吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/calibration/versions/${versionId.value}/submit`)
        ElMessage.success('已提交审核')
        fetchVersion()
      } catch (err) {
        console.error('提交审核失败:', err)
      }
    })
    .catch(() => {})
}

const handlePublish = () => {
  ElMessageBox.confirm('确定要发布此版本吗？发布后将不可撤销。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/calibration/versions/${versionId.value}/publish`)
        ElMessage.success('发布成功')
        fetchVersion()
      } catch (err) {
        console.error('发布失败:', err)
      }
    })
    .catch(() => {})
}

const submitReview = async () => {
  reviewLoading.value = true
  try {
    await request.put(`/calibration/versions/${versionId.value}/review`, {
      status: reviewStatus.value,
      comment: reviewComment.value,
    })
    ElMessage.success('审核完成')
    showReviewDialog.value = false
    fetchVersion()
    fetchReviews()
  } catch (err) {
    console.error('审核失败:', err)
  } finally {
    reviewLoading.value = false
  }
}

const handleEditParam = (row) => {
  isEditParam.value = true
  paramForm.calibration_param_id = row.calibration_param_id
  paramForm.param_name = row.param_name
  paramForm.param_code = row.param_code
  paramForm.category = row.category
  paramForm.param_value = row.param_value
  paramForm.unit = row.unit || ''
  paramForm.min_value = row.min_value
  paramForm.max_value = row.max_value
  paramForm.default_value = row.default_value
  paramForm.description = row.description || ''
  showAddParamDialog.value = true
}

const submitParam = async () => {
  if (!paramFormRef.value) return

  await paramFormRef.value.validate(async (valid) => {
    if (valid) {
      paramLoading.value = true
      try {
        if (isEditParam.value) {
          await request.put(`/calibration/versions/${versionId.value}/params`, [paramForm])
          ElMessage.success('参数已更新')
        } else {
          await request.post(`/calibration/versions/${versionId.value}/params`, [paramForm])
          ElMessage.success('参数已添加')
        }
        showAddParamDialog.value = false
        fetchVersionParams()
      } catch (err) {
        console.error('保存参数失败:', err)
      } finally {
        paramLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchVersion()
  fetchVersionParams()
  fetchReviews()
})
</script>

<style scoped>
.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>
