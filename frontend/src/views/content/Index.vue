<template>
  <div class="content-container">
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="文案" name="article">
          <template #label>
            <span><el-icon><Document /></el-icon> 文案</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="活动" name="activity">
          <template #label>
            <span><el-icon><Calendar /></el-icon> 活动</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="优惠券" name="coupon">
          <template #label>
            <span><el-icon><Ticket /></el-icon> 优惠券</span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索标题"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" @click="handleSearch" style="margin-left: 10px">搜索</el-button>
          </div>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增{{ tabLabel }}
          </el-button>
        </div>
      </template>
      
      <el-table :data="contentList" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'coupon'" label="优惠信息" min-width="200">
          <template #default="{ row }">
            <span>满{{ row.min_amount }}减{{ row.discount_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'activity'" label="活动时间" min-width="200">
          <template #default="{ row }">
            <div v-if="row.start_time || row.end_time">
              <div>{{ row.start_time ? formatTime(row.start_time) : '-' }}</div>
              <div class="time-arrow">↓</div>
              <div>{{ row.end_time ? formatTime(row.end_time) : '-' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'coupon'" label="优惠券码" width="150">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.coupon_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadContentList"
          @current-change="loadContentList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑' + tabLabel : '新增' + tabLabel"
      width="600px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
      class="content-dialog"
    >
      <div class="dialog-mask" v-if="dialogVisible">
        <div class="mask-text">
          <el-icon size="24"><Edit /></el-icon>
          <span>编辑模式</span>
        </div>
      </div>
      
      <el-form
        ref="contentFormRef"
        :model="contentForm"
        :rules="contentRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="contentForm.title" placeholder="请输入标题" />
        </el-form-item>
        
        <el-form-item label="排序">
          <el-input-number v-model="contentForm.sort_order" :min="0" style="width: 200px" />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch v-model="contentForm.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        
        <el-form-item v-if="activeTab === 'activity'" label="开始时间">
          <el-date-picker
            v-model="contentForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item v-if="activeTab === 'activity'" label="结束时间">
          <el-date-picker
            v-model="contentForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item v-if="activeTab === 'coupon'" label="优惠券码" prop="coupon_code">
          <el-input v-model="contentForm.coupon_code" placeholder="请输入优惠券码，如：NEW50" />
        </el-form-item>
        
        <el-form-item v-if="activeTab === 'coupon'" label="满减金额">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="满" label-width="40px">
                <el-input-number v-model="contentForm.min_amount" :min="0" :precision="2" style="width: 100%" placeholder="最低消费" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="减" label-width="40px">
                <el-input-number v-model="contentForm.discount_amount" :min="0" :precision="2" style="width: 100%" placeholder="优惠金额" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input
            v-model="contentForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入内容描述"
          />
        </el-form-item>
        
        <el-form-item label="链接">
          <el-input v-model="contentForm.link" placeholder="跳转链接（可选）" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const activeTab = ref('article')
const searchKeyword = ref('')

const contentFormRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const contentList = ref([])

const contentForm = reactive({
  id: '',
  type: 'article',
  title: '',
  content: '',
  link: '',
  sort_order: 0,
  status: 1,
  start_time: '',
  end_time: '',
  coupon_code: '',
  discount_amount: 0,
  min_amount: 0
})

const tabLabel = computed(() => {
  const labels = {
    article: '文案',
    activity: '活动',
    coupon: '优惠券'
  }
  return labels[activeTab.value] || '内容'
})

const contentRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

async function loadContentList() {
  loading.value = true
  try {
    const params = {
      type: activeTab.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const res = await request.get('/api/contents', { params })
    if (res.success) {
      contentList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载内容列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  searchKeyword.value = ''
  loadContentList()
}

function handleSearch() {
  pagination.page = 1
  loadContentList()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(contentForm, {
    id: '',
    type: activeTab.value,
    title: '',
    content: '',
    link: '',
    sort_order: 0,
    status: 1,
    start_time: '',
    end_time: '',
    coupon_code: '',
    discount_amount: 0,
    min_amount: 0
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(contentForm, {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    link: row.link,
    sort_order: row.sort_order,
    status: row.status,
    start_time: row.start_time || '',
    end_time: row.end_time || '',
    coupon_code: row.coupon_code || '',
    discount_amount: row.discount_amount || 0,
    min_amount: row.min_amount || 0
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该内容吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.delete(`/api/contents/${row.id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      loadContentList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleSubmit() {
  if (!contentFormRef.value) return
  
  await contentFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        let res
        if (isEdit.value) {
          res = await request.put(`/api/contents/${contentForm.id}`, contentForm)
        } else {
          res = await request.post('/api/contents', contentForm)
        }
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          dialogVisible.value = false
          loadContentList()
        }
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

function handleDialogClosed() {
  contentFormRef.value?.resetFields()
}

watch(activeTab, () => {
  handleTabChange()
})

onMounted(() => {
  loadContentList()
})
</script>

<style scoped>
.content-container {
  min-height: 100%;
}

.tabs-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-left {
  display: flex;
  align-items: center;
}

.time-arrow {
  color: #909399;
  font-size: 12px;
  margin: 4px 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.content-dialog :deep(.el-dialog__body) {
  position: relative;
}

.dialog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, rgba(64, 158, 255, 0.1), transparent);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.mask-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-weight: 600;
}
</style>
