<template>
  <div>
    <div class="page-header">
      <div class="page-title">活动配置</div>
      <el-button type="primary" @click="handleAdd" v-if="canEdit">新增活动</el-button>
    </div>

    <div class="card-content">
      <div class="filter-bar">
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
          <el-option label="已结束" value="ended" />
        </el-select>
        <el-select v-model="filters.type" placeholder="类型" clearable style="width: 120px;" @change="loadData">
          <el-option label="限时折扣" value="discount" />
          <el-option label="组合礼物" value="combo" />
          <el-option label="排行榜加成" value="ranking" />
          <el-option label="节日主题" value="festival" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="activities" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="活动名称" width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ typeMap[row.type] }}</template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="80">
          <template #default="{ row }">{{ row.discount ? row.discount + '%' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="160" />
        <el-table-column prop="end_time" label="结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" @click="handleEdit(row)" v-if="canEdit">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-if="canEdit">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑活动' : '新增活动'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="form.type" style="width: 100%;">
            <el-option label="限时折扣" value="discount" />
            <el-option label="组合礼物" value="combo" />
            <el-option label="排行榜加成" value="ranking" />
            <el-option label="节日主题" value="festival" />
          </el-select>
        </el-form-item>
        <el-form-item label="折扣比例">
          <el-input-number v-model="form.discount" :min="0" :max="90" placeholder="0-90" />% off
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker v-model="form.start_time" type="datetime" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker v-model="form.end_time" type="datetime" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="关联礼物">
          <el-select v-model="form.giftIds" multiple filterable style="width: 100%;">
            <el-option v-for="g in giftList" :key="g.id" :label="g.name" :value="g.id">
              <span>{{ g.icon }} {{ g.name }} - ¥{{ g.price }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已结束" value="ended" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="用户端效果预览" width="600px">
      <div class="preview-box" v-if="previewData">
        <h3 style="margin-bottom: 16px;">{{ previewData.activity.name }}</h3>
        <p>活动时间: {{ previewData.activity.start_time }} ~ {{ previewData.activity.end_time }}</p>
        <p v-if="previewData.activity.discount">折扣: {{ previewData.activity.discount }}%</p>
        <p>{{ previewData.activity.description }}</p>
        <div style="margin-top: 16px;">
          <h4 style="margin-bottom: 8px;">活动礼物:</h4>
          <div style="display: flex; gap: 16px; flex-wrap: wrap;">
            <div v-for="g in previewData.gifts" :key="g.gift_id" 
                 style="padding: 12px; border: 1px solid #ebeef5; border-radius: 8px; text-align: center; min-width: 100px;">
              <div style="font-size: 32px;">{{ g.icon }}</div>
              <div>{{ g.name }}</div>
              <div style="text-decoration: line-through; color: #909399;">¥{{ g.price }}</div>
              <div style="color: #f56c6c; font-weight: 600;">¥{{ g.discount_price?.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const canEdit = computed(() => ['admin', 'operator'].includes(userStore.user?.role))

const activities = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const giftList = ref([])
const previewData = ref(null)

const filters = reactive({ status: '', type: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  id: null, name: '', type: 'discount', discount: null, start_time: '', end_time: '',
  giftIds: [], status: 'draft', description: ''
})

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }]
}

const typeMap = { discount: '限时折扣', combo: '组合礼物', ranking: '排行榜加成', festival: '节日主题' }
const statusMap = { draft: '草稿', published: '已发布', ended: '已结束' }
const statusType = s => s === 'published' ? 'success' : s === 'draft' ? 'info' : 'info'

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/activities', { params: { ...filters, ...pagination } })
    activities.value = data.items
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

async function loadGifts() {
  const data = await request.get('/gifts', { params: { status: 'online', pageSize: 100 } })
  giftList.value = data.items
}

function handleAdd() {
  loadGifts()
  isEdit.value = false
  Object.assign(form, { id: null, name: '', type: 'discount', discount: null, start_time: '', end_time: '', giftIds: [], status: 'draft', description: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  loadGifts()
  isEdit.value = true
  request.get(`/activities/${row.id}`).then(data => {
    Object.assign(form, {
      id: data.id, name: data.name, type: data.type, discount: data.discount,
      start_time: data.start_time, end_time: data.end_time, status: data.status,
      description: data.description, giftIds: data.gifts?.map(g => g.gift_id) || []
    })
    dialogVisible.value = true
  })
}

async function handleSave() {
  try {
    await formRef.value.validate()
    saving.value = true
    if (isEdit.value) {
      await request.put(`/activities/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/activities', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除活动「${row.name}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/activities/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

async function handlePreview(row) {
  previewData.value = await request.get(`/activities/preview/${row.id}`)
  previewVisible.value = true
}

onMounted(loadData)
</script>
