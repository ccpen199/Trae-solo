<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>标定管理</h2>
        <div class="description">管理标定参数版本、审核流程和发布状态</div>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建版本
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending_review" />
            <el-option label="已审核" value="reviewed" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchVersions">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px;">
      <el-table :data="versions" style="width: 100%" v-loading="loading">
        <el-table-column prop="version_code" label="版本号" width="160" />
        <el-table-column prop="version_name" label="版本名称" />
        <el-table-column prop="model_name" label="适用车型" width="150" />
        <el-table-column prop="ecu_model" label="ECU型号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by_name" label="创建人" width="100" />
        <el-table-column prop="reviewed_by_name" label="审核人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="goToDetail(scope.row.id)">详情</el-button>
            <el-button 
              v-if="scope.row.status === 'draft'" 
              type="warning" 
              link 
              @click="submitReview(scope.row)"
            >
              提交审核
            </el-button>
            <el-button 
              v-if="authStore.isAdmin && scope.row.status === 'pending_review'" 
              type="success" 
              link 
              @click="showReviewDialog = true; currentVersionId = scope.row.id"
            >
              审核
            </el-button>
            <el-button 
              v-if="authStore.isAdmin && scope.row.status === 'reviewed'" 
              type="primary" 
              link 
              @click="publishVersion(scope.row)"
            >
              发布
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchVersions"
        @current-change="fetchVersions"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="新建标定版本"
      width="550px"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="版本号" prop="version_code">
          <el-input v-model="createForm.version_code" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="版本名称" prop="version_name">
          <el-input v-model="createForm.version_name" placeholder="请输入版本名称" />
        </el-form-item>
        <el-form-item label="适用车型">
          <el-select v-model="createForm.vehicle_model_id" placeholder="请选择车型" filterable style="width: 100%">
            <el-option
              v-for="m in vehicleModels"
              :key="m.id"
              :label="m.model_name"
              :value="m.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="ECU型号">
          <el-input v-model="createForm.ecu_model" placeholder="请输入ECU型号" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入版本描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createVersion" :loading="createLoading">
          创建
        </el-button>
      </template>
    </el-dialog>

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
        <el-button type="primary" @click="submitReviewDecision" :loading="reviewLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import request from '../utils/request'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const createLoading = ref(false)
const reviewLoading = ref(false)
const showCreateDialog = ref(false)
const showReviewDialog = ref(false)
const createFormRef = ref(null)
const currentVersionId = ref(null)
const reviewStatus = ref('approved')
const reviewComment = ref('')

const versions = ref([])
const vehicleModels = ref([])
const parameters = ref([])

const searchForm = reactive({
  status: '',
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
})

const createForm = reactive({
  version_code: '',
  version_name: '',
  vehicle_model_id: null,
  ecu_model: '',
  description: '',
})

const createRules = {
  version_code: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  version_name: [{ required: true, message: '请输入版本名称', trigger: 'blur' }],
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
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

const fetchVehicleModels = async () => {
  try {
    const data = await request.get('/vehicles/models')
    vehicleModels.value = data
  } catch (err) {
    console.error('获取车型列表失败:', err)
  }
}

const fetchVersions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const data = await request.get('/calibration/versions', { params })
    versions.value = data.versions
    pagination.total = data.pagination.total
  } catch (err) {
    console.error('获取版本列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  pagination.page = 1
  fetchVersions()
}

const goToDetail = (id) => {
  router.push(`/calibration/version/${id}`)
}

const submitReview = (row) => {
  ElMessageBox.confirm('确定要提交此版本进行审核吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/calibration/versions/${row.id}/submit`)
        ElMessage.success('已提交审核')
        fetchVersions()
      } catch (err) {
        console.error('提交审核失败:', err)
      }
    })
    .catch(() => {})
}

const publishVersion = (row) => {
  ElMessageBox.confirm('确定要发布此版本吗？发布后将不可撤销。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/calibration/versions/${row.id}/publish`)
        ElMessage.success('发布成功')
        fetchVersions()
      } catch (err) {
        console.error('发布失败:', err)
      }
    })
    .catch(() => {})
}

const createVersion = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true
      try {
        await request.post('/calibration/versions', createForm)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        fetchVersions()
      } catch (err) {
        console.error('创建版本失败:', err)
      } finally {
        createLoading.value = false
      }
    }
  })
}

const submitReviewDecision = async () => {
  reviewLoading.value = true
  try {
    await request.put(`/calibration/versions/${currentVersionId.value}/review`, {
      status: reviewStatus.value,
      comment: reviewComment.value,
    })
    ElMessage.success('审核完成')
    showReviewDialog.value = false
    fetchVersions()
  } catch (err) {
    console.error('审核失败:', err)
  } finally {
    reviewLoading.value = false
  }
}

onMounted(() => {
  fetchVehicleModels()
  fetchVersions()
})
</script>
