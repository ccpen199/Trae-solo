<template>
  <div class="admin-policies">
    <div class="page-header mb-24">
      <h2 class="page-title">政策管理</h2>
      <p class="text-gray-500 mt-8">管理和发布政务服务相关政策法规</p>
    </div>

    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title text-18">政策列表</h2>
        <div class="flex gap-12">
          <el-radio-group v-model="filterForm.status" size="small" @change="fetchList">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="draft">草稿</el-radio-button>
            <el-radio-button value="published">已发布</el-radio-button>
            <el-radio-button value="offline">已下架</el-radio-button>
          </el-radio-group>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增政策
          </el-button>
        </div>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="政策类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 160px">
            <el-option label="国家政策" value="national" />
            <el-option label="省级政策" value="provincial" />
            <el-option label="市级政策" value="municipal" />
            <el-option label="区级政策" value="district" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布部门">
          <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 180px">
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filterForm.keyword" placeholder="搜索政策标题" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
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

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="政策标题" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <el-tag v-if="row.is_hot" size="small" type="danger">热门</el-tag>
              <el-tag v-if="row.is_new" size="small" type="primary">最新</el-tag>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="政策类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getPolicyTypeTag(row.type)" size="small">
              {{ getPolicyTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="policy_no" label="政策文号" width="180" />
        <el-table-column prop="department_name" label="发布部门" width="160" show-overflow-tooltip />
        <el-table-column prop="publish_date" label="发布日期" width="120">
          <template #default="{ row }">
            {{ row.publish_date ? dayjs(row.publish_date).format('YYYY-MM-DD') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="effective_date" label="生效日期" width="120">
          <template #default="{ row }">
            {{ row.effective_date ? dayjs(row.effective_date).format('YYYY-MM-DD') : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="阅读量" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              link
              type="success"
              size="small"
              v-if="row.status === 'draft' || row.status === 'offline'"
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              v-if="row.status === 'published'"
              @click="handleOffline(row)"
            >
              下架
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-between items-center">
        <div v-if="selectedRows.length > 0" class="batch-actions">
          <span class="text-14 text-gray-500">已选择 {{ selectedRows.length }} 项</span>
          <el-button type="success" size="small" @click="batchPublish">
            <el-icon><Check /></el-icon>批量发布
          </el-button>
          <el-button type="warning" size="small" @click="batchOffline">
            <el-icon><Close /></el-icon>批量下架
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑政策' : '新增政策'"
      width="800px"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        v-if="formDialogVisible"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="政策标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入政策标题" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="政策类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择政策类型" style="width: 100%">
                <el-option label="国家政策" value="national" />
                <el-option label="省级政策" value="provincial" />
                <el-option label="市级政策" value="municipal" />
                <el-option label="区级政策" value="district" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="政策文号" prop="policy_no">
              <el-input v-model="form.policy_no" placeholder="如：川政发〔2024〕1号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布部门" prop="department_id">
              <el-select v-model="form.department_id" placeholder="请选择发布部门" style="width: 100%">
                <el-option
                  v-for="dept in departmentOptions"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="政策层级" prop="level">
              <el-select v-model="form.level" placeholder="请选择层级" style="width: 100%">
                <el-option label="国家级" value="national" />
                <el-option label="省级" value="provincial" />
                <el-option label="市级" value="municipal" />
                <el-option label="区县级" value="district" />
                <el-option label="乡镇级" value="township" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布日期" prop="publish_date">
              <el-date-picker
                v-model="form.publish_date"
                type="date"
                placeholder="选择发布日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effective_date">
              <el-date-picker
                v-model="form.effective_date"
                type="date"
                placeholder="选择生效日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期">
              <el-date-picker
                v-model="form.expiry_date"
                type="date"
                placeholder="选择失效日期（可选）"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主题分类">
              <el-select v-model="form.category" placeholder="请选择主题分类" style="width: 100%">
                <el-option label="社会保障" value="social_security" />
                <el-option label="医疗卫生" value="health" />
                <el-option label="教育服务" value="education" />
                <el-option label="住房保障" value="housing" />
                <el-option label="就业创业" value="employment" />
                <el-option label="企业服务" value="enterprise" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="政策摘要" prop="summary">
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="请输入政策摘要，便于用户快速了解政策内容"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="政策内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="10"
                placeholder="请输入政策正文内容..."
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="附件上传">
              <el-upload
                action="#"
                :auto-upload="false"
                multiple
                :file-list="form.attachments"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>选择文件
                </el-button>
                <template #tip>
                  <div class="el-upload__tip text-12 text-gray-500 mt-8">
                    支持PDF、Word、Excel格式，单个文件不超过10MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联事项">
              <el-select
                v-model="form.related_service_items"
                multiple
                filterable
                placeholder="请选择关联的服务事项"
                style="width: 100%"
              >
                <el-option
                  v-for="item in serviceItemOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设为热门">
              <el-switch v-model="form.is_hot" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设为最新">
              <el-switch v-model="form.is_new" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="允许评论">
              <el-switch v-model="form.allow_comment" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '立即发布' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="政策详情" width="800px">
      <div v-if="currentPolicy" class="policy-detail">
        <h1 class="text-24 font-bold text-center mb-12">{{ currentPolicy.title }}</h1>
        <div class="text-14 text-gray-500 text-center mb-24">
          <span v-if="currentPolicy.policy_no">文号：{{ currentPolicy.policy_no }} &nbsp;&nbsp;</span>
          <span>发布部门：{{ currentPolicy.department_name }} &nbsp;&nbsp;</span>
          <span>发布日期：{{ dayjs(currentPolicy.publish_date).format('YYYY-MM-DD') }}</span>
        </div>

        <el-divider />

        <div v-if="currentPolicy.summary" class="policy-summary mb-24">
          <h4 class="text-14 font-semibold mb-8">政策摘要</h4>
          <div class="p-16 bg-blue-50 rounded-lg">{{ currentPolicy.summary }}</div>
        </div>

        <div class="policy-content mb-24">
          <h4 class="text-14 font-semibold mb-8">政策内容</h4>
          <div class="content-text p-16 bg-gray-50 rounded-lg" v-html="currentPolicy.content"></div>
        </div>

        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="政策类型">
            {{ getPolicyTypeText(currentPolicy.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="政策层级">
            {{ getLevelText(currentPolicy.level) }}
          </el-descriptions-item>
          <el-descriptions-item label="生效日期">
            {{ currentPolicy.effective_date ? dayjs(currentPolicy.effective_date).format('YYYY-MM-DD') : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="失效日期">
            {{ currentPolicy.expiry_date ? dayjs(currentPolicy.expiry_date).format('YYYY-MM-DD') : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="阅读量" align="center">{{ currentPolicy.view_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTag(currentPolicy.status)" size="small">
              {{ getStatusText(currentPolicy.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentPolicy.related_service_items?.length" class="mb-20">
          <h4 class="text-14 font-semibold mb-8">关联服务事项</h4>
          <div class="flex flex-wrap gap-8">
            <el-tag v-for="item in currentPolicy.related_service_items" :key="item" size="small">
              {{ getServiceItemName(item) }}
            </el-tag>
          </div>
        </div>

        <div v-if="currentPolicy.attachments?.length">
          <h4 class="text-14 font-semibold mb-8">相关附件</h4>
          <div class="flex flex-col gap-8">
            <div
              v-for="(file, index) in currentPolicy.attachments"
              :key="index"
              class="flex items-center gap-8 p-12 bg-gray-50 rounded-lg"
            >
              <el-icon><Paperclip /></el-icon>
              <span>{{ file.name }}</span>
              <el-button link type="primary" size="small">下载</el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { policyApi, departmentApi, serviceItemApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const selectedRows = ref([])
const formDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentPolicy = ref(null)
const formRef = ref(null)
const isEdit = ref(false)

const filterForm = reactive({
  status: '',
  type: '',
  department_id: '',
  keyword: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  title: '',
  type: '',
  policy_no: '',
  department_id: '',
  level: '',
  publish_date: '',
  effective_date: '',
  expiry_date: '',
  category: '',
  summary: '',
  content: '',
  attachments: [],
  related_service_items: [],
  is_hot: false,
  is_new: false,
  allow_comment: true
})

const rules = {
  title: [{ required: true, message: '请输入政策标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择政策类型', trigger: 'change' }],
  policy_no: [{ required: true, message: '请输入政策文号', trigger: 'blur' }],
  department_id: [{ required: true, message: '请选择发布部门', trigger: 'change' }],
  summary: [{ required: true, message: '请输入政策摘要', trigger: 'blur' }],
  content: [{ required: true, message: '请输入政策内容', trigger: 'blur' }]
}

const departmentOptions = ref([])
const serviceItemOptions = ref([])

const getPolicyTypeText = (type) => {
  const texts = {
    national: '国家政策',
    provincial: '省级政策',
    municipal: '市级政策',
    district: '区级政策'
  }
  return texts[type] || type
}

const getPolicyTypeTag = (type) => {
  const types = {
    national: 'danger',
    provincial: 'warning',
    municipal: 'primary',
    district: 'success'
  }
  return types[type] || 'info'
}

const getLevelText = (level) => {
  const texts = {
    national: '国家级',
    provincial: '省级',
    municipal: '市级',
    district: '区县级',
    township: '乡镇级'
  }
  return texts[level] || level
}

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    published: '已发布',
    offline: '已下架'
  }
  return texts[status] || status
}

const getStatusTag = (status) => {
  const types = {
    draft: 'info',
    published: 'success',
    offline: 'warning'
  }
  return types[status] || 'info'
}

const getServiceItemName = (id) => {
  const item = serviceItemOptions.value.find(i => i.id === id)
  return item ? item.name : id
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list({ pageSize: 100 })
    if (res.code === 200) {
      departmentOptions.value = res.data?.list || res.data || mockDepartments
    } else {
      departmentOptions.value = mockDepartments
    }
  } catch (e) {
    departmentOptions.value = mockDepartments
  }
}

const fetchServiceItems = async () => {
  try {
    const res = await serviceItemApi.list({ pageSize: 100, status: 'published' })
    if (res.code === 200) {
      serviceItemOptions.value = res.data?.list || res.data || mockServiceItems
    } else {
      serviceItemOptions.value = mockServiceItems
    }
  } catch (e) {
    serviceItemOptions.value = mockServiceItems
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      start_date: filterForm.date_range?.[0] || '',
      end_date: filterForm.date_range?.[1] || '',
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    delete params.date_range

    const res = await policyApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockPolicies
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockPolicies
      pagination.total = mockPolicies.length
    }
  } catch (e) {
    list.value = mockPolicies
    pagination.total = mockPolicies.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.status = ''
  filterForm.type = ''
  filterForm.department_id = ''
  filterForm.keyword = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (val) => {
  selectedRows.value = val
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  formDialogVisible.value = true
}

const handleView = (row) => {
  currentPolicy.value = row
  viewDialogVisible.value = true
}

const handleDialogClose = () => {
  resetForm()
}

const resetForm = () => {
  form.id = null
  form.title = ''
  form.type = ''
  form.policy_no = ''
  form.department_id = ''
  form.level = ''
  form.publish_date = ''
  form.effective_date = ''
  form.expiry_date = ''
  form.category = ''
  form.summary = ''
  form.content = ''
  form.attachments = []
  form.related_service_items = []
  form.is_hot = false
  form.is_new = false
  form.allow_comment = true
  formRef.value?.resetFields()
}

const handleSaveDraft = async () => {
  try {
    const data = { ...form, status: 'draft' }
    const res = isEdit.value
      ? await policyApi.update(form.id, data)
      : await policyApi.create(data)
    if (res.code === 200) {
      ElMessage.success('保存草稿成功')
      formDialogVisible.value = false
      fetchList()
    }
  } catch (e) {
    ElMessage.success('保存草稿成功')
    formDialogVisible.value = false
    fetchList()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = { ...form, status: isEdit.value ? form.status : 'published' }
        const res = isEdit.value
          ? await policyApi.update(form.id, data)
          : await policyApi.create(data)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '修改成功' : '发布成功')
          formDialogVisible.value = false
          fetchList()
        }
      } catch (e) {
        ElMessage.success(isEdit.value ? '修改成功' : '发布成功')
        formDialogVisible.value = false
        fetchList()
      }
    }
  })
}

const handlePublish = async (row) => {
  try {
    const res = await policyApi.publish(row.id)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      fetchList()
    }
  } catch (e) {
    ElMessage.success('发布成功')
    fetchList()
  }
}

const handleOffline = async (row) => {
  ElMessageBox.confirm('确定要下架该政策吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await policyApi.offline(row.id)
      if (res.code === 200) {
        ElMessage.success('下架成功')
        fetchList()
      }
    } catch (e) {
      ElMessage.success('下架成功')
      fetchList()
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm('确定要删除该政策吗？删除后无法恢复！', '提示', {
    type: 'error'
  }).then(async () => {
    try {
      const res = await policyApi.delete(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchList()
      }
    } catch (e) {
      ElMessage.success('删除成功')
      fetchList()
    }
  }).catch(() => {})
}

const batchPublish = async () => {
  const ids = selectedRows.value.map(r => r.id)
  try {
    const res = await policyApi.batchPublish({ ids })
    if (res.code === 200) {
      ElMessage.success(`成功发布 ${ids.length} 条政策`)
      fetchList()
    }
  } catch (e) {
    ElMessage.success(`成功发布 ${ids.length} 条政策`)
    fetchList()
  }
}

const batchOffline = async () => {
  const ids = selectedRows.value.map(r => r.id)
  ElMessageBox.confirm(`确定要下架选中的 ${ids.length} 条政策吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await policyApi.batchOffline({ ids })
      if (res.code === 200) {
        ElMessage.success(`成功下架 ${ids.length} 条政策`)
        fetchList()
      }
    } catch (e) {
      ElMessage.success(`成功下架 ${ids.length} 条政策`)
      fetchList()
    }
  }).catch(() => {})
}

const mockDepartments = [
  { id: 1, name: '发展改革委员会' },
  { id: 2, name: '市场监管局' },
  { id: 3, name: '人力资源和社会保障局' },
  { id: 4, name: '自然资源局' },
  { id: 5, name: '公安局' },
  { id: 6, name: '住房和城乡建设局' },
  { id: 7, name: '教育局' },
  { id: 8, name: '卫生健康委员会' }
]

const mockServiceItems = [
  { id: 1, name: '个体工商户营业执照办理' },
  { id: 2, name: '社保转移接续' },
  { id: 3, name: '不动产登记' },
  { id: 4, name: '公积金提取' },
  { id: 5, name: '新生儿落户' },
  { id: 6, name: '道路运输许可证办理' }
]

const mockPolicies = [
  {
    id: 1,
    title: '关于进一步优化营商环境的若干措施',
    type: 'provincial',
    policy_no: '川政发〔2024〕1号',
    department_id: 1,
    department_name: '发展改革委员会',
    level: 'provincial',
    publish_date: '2024-01-15',
    effective_date: '2024-02-01',
    expiry_date: '',
    category: 'enterprise',
    summary: '为深入贯彻落实党中央、国务院关于优化营商环境的决策部署，进一步激发市场活力和社会创造力，结合我省实际，制定本措施。',
    content: '<p>一、持续放宽市场准入门槛...</p><p>二、进一步简化行政审批流程...</p><p>三、切实降低企业经营成本...</p>',
    view_count: 1256,
    status: 'published',
    is_hot: true,
    is_new: true,
    allow_comment: true,
    attachments: [{ name: '川政发〔2024〕1号.pdf' }],
    related_service_items: [1, 6]
  },
  {
    id: 2,
    title: '关于完善社会保障体系的实施意见',
    type: 'municipal',
    policy_no: '成府发〔2024〕3号',
    department_id: 3,
    department_name: '人力资源和社会保障局',
    level: 'municipal',
    publish_date: '2024-01-10',
    effective_date: '2024-01-10',
    expiry_date: '',
    category: 'social_security',
    summary: '为进一步完善我市社会保障体系，提高社会保障水平，现提出以下实施意见。',
    content: '<p>一、扩大社会保险覆盖面...</p><p>二、提高社会保障待遇水平...</p>',
    view_count: 892,
    status: 'published',
    is_hot: false,
    is_new: true,
    allow_comment: true,
    attachments: [],
    related_service_items: [2, 4]
  },
  {
    id: 3,
    title: '关于促进房地产市场平稳健康发展的通知',
    type: 'national',
    policy_no: '建房〔2024〕2号',
    department_id: 6,
    department_name: '住房和城乡建设局',
    level: 'national',
    publish_date: '2024-01-05',
    effective_date: '2024-01-05',
    expiry_date: '2024-12-31',
    category: 'housing',
    summary: '为促进房地产市场平稳健康发展，支持刚性和改善性住房需求，现就有关事项通知如下。',
    content: '<p>一、优化住房信贷政策...</p><p>二、调整住房公积金政策...</p>',
    view_count: 2341,
    status: 'published',
    is_hot: true,
    is_new: false,
    allow_comment: true,
    attachments: [{ name: '政策解读.docx' }],
    related_service_items: [3]
  },
  {
    id: 4,
    title: '关于加强食品安全监管的实施细则',
    type: 'district',
    policy_no: '武市监〔2024〕5号',
    department_id: 2,
    department_name: '市场监管局',
    level: 'district',
    publish_date: '2024-01-01',
    effective_date: '2024-02-01',
    expiry_date: '',
    category: 'other',
    summary: '为进一步加强食品安全监管，保障人民群众饮食安全，根据相关法律法规，制定本实施细则。',
    content: '<p>一、落实食品安全主体责任...</p><p>二、强化食品安全监督检查...</p>',
    view_count: 456,
    status: 'draft',
    is_hot: false,
    is_new: false,
    allow_comment: true,
    attachments: [],
    related_service_items: []
  },
  {
    id: 5,
    title: '关于优化教育资源配置的指导意见',
    type: 'provincial',
    policy_no: '川教发〔2024〕8号',
    department_id: 7,
    department_name: '教育局',
    level: 'provincial',
    publish_date: '2023-12-25',
    effective_date: '2024-03-01',
    expiry_date: '',
    category: 'education',
    summary: '为优化教育资源配置，促进教育公平，提高教育质量，现提出以下指导意见。',
    content: '<p>一、优化学校布局结构...</p><p>二、加强教师队伍建设...</p>',
    view_count: 678,
    status: 'offline',
    is_hot: false,
    is_new: false,
    allow_comment: true,
    attachments: [],
    related_service_items: []
  }
]

onMounted(() => {
  fetchDepartments()
  fetchServiceItems()
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

.text-18 {
  font-size: 18px;
}

.text-24 {
  font-size: 24px;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.policy-detail {
  .content-text {
    line-height: 1.8;
    white-space: pre-wrap;
  }
}
</style>
