<template>
  <div class="barcode-container">
    <div class="page-header">
      <h2 class="page-title">条码管理</h2>
      <p class="page-desc">管理参会人员条码信息，支持批量创建</p>
    </div>
    
    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="条码">
          <el-input v-model="searchForm.code" placeholder="请输入条码" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择部门" clearable style="width: 150px;">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
            <el-option label="有效" value="active" />
            <el-option label="已使用" value="used" />
            <el-option label="已过期" value="expired" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="toolbar mb-20">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新增条码
      </el-button>
      <el-button type="success" @click="handleBatchCreate">
        <el-icon><DocumentAdd /></el-icon>批量创建
      </el-button>
      <el-button type="warning" @click="handleExport">
        <el-icon><Download /></el-icon>导出
      </el-button>
    </div>
    
    <div class="data-table">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="code" label="条码" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="departmentName" label="部门" width="120" />
        <el-table-column label="入场权限">
          <template #default="scope">
            <span>{{ scope.row.entryCount }} / {{ scope.row.maxEntryCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="餐饮权限">
          <template #default="scope">
            <span>{{ scope.row.cateringCount }} / {{ scope.row.maxCateringCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="图册权限">
          <template #default="scope">
            <span>{{ scope.row.bookletCount }} / {{ scope.row.maxBookletCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
            <el-button 
              type="danger" 
              link 
              @click="handleCancel(scope.row)"
              :disabled="scope.row.status !== 'active'"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination mt-20">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="barcodeFormRef"
        :model="barcodeForm"
        :rules="barcodeRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="条码" prop="code">
              <el-input v-model="barcodeForm.code" placeholder="自动生成可留空" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="barcodeForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="barcodeForm.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId">
              <el-select v-model="barcodeForm.departmentId" placeholder="请选择部门" style="width: 100%;">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider>权限配置</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="入场次数">
              <el-input-number v-model="barcodeForm.maxEntryCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="餐饮次数">
              <el-input-number v-model="barcodeForm.maxCateringCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图册次数">
              <el-input-number v-model="barcodeForm.maxBookletCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效期开始">
              <el-date-picker
                v-model="barcodeForm.validFrom"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期结束">
              <el-date-picker
                v-model="barcodeForm.validTo"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input v-model="barcodeForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog
      v-model="batchDialogVisible"
      title="批量创建条码"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="条码前缀">
          <el-input v-model="batchForm.prefix" placeholder="例如: EXH2024" />
        </el-form-item>
        <el-form-item label="起始序号">
          <el-input-number v-model="batchForm.startNumber" :min="1" :max="99999" />
        </el-form-item>
        <el-form-item label="创建数量">
          <el-input-number v-model="batchForm.count" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="batchForm.departmentId" placeholder="请选择部门" style="width: 100%;">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-divider>权限配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="入场次数">
              <el-input-number v-model="batchForm.maxEntryCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="餐饮次数">
              <el-input-number v-model="batchForm.maxCateringCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图册次数">
              <el-input-number v-model="batchForm.maxBookletCount" :min="0" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitLoading = ref(false)
const batchLoading = ref(false)
const dialogVisible = ref(false)
const batchDialogVisible = ref(false)
const barcodeFormRef = ref(null)
const isEdit = ref(false)

const searchForm = reactive({
  code: '',
  name: '',
  departmentId: null,
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const departments = ref([])

const dialogTitle = computed(() => isEdit.value ? '编辑条码' : '新增条码')

const barcodeForm = reactive({
  id: null,
  code: '',
  name: '',
  phone: '',
  departmentId: null,
  maxEntryCount: 1,
  maxCateringCount: 0,
  maxBookletCount: 0,
  validFrom: null,
  validTo: null,
  remark: ''
})

const batchForm = reactive({
  prefix: 'EXH',
  startNumber: 1,
  count: 10,
  departmentId: null,
  maxEntryCount: 1,
  maxCateringCount: 0,
  maxBookletCount: 0
})

const barcodeRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

async function fetchDepartments() {
  try {
    const res = await request.get('/api/departments', { params: { pageSize: 1000 } })
    if (res.success) {
      departments.value = res.data.list || []
    }
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  }
}

async function fetchBarcodes() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const res = await request.get('/api/barcodes', { params })
    if (res.success) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('Failed to fetch barcodes:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchBarcodes()
}

function handleReset() {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.departmentId = null
  searchForm.status = ''
  pagination.page = 1
  fetchBarcodes()
}

function handleCreate() {
  isEdit.value = false
  Object.assign(barcodeForm, {
    id: null,
    code: '',
    name: '',
    phone: '',
    departmentId: departments.value.length > 0 ? departments.value[0].id : null,
    maxEntryCount: 1,
    maxCateringCount: 0,
    maxBookletCount: 0,
    validFrom: null,
    validTo: null,
    remark: ''
  })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(barcodeForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    phone: row.phone,
    departmentId: row.departmentId,
    maxEntryCount: row.maxEntryCount,
    maxCateringCount: row.maxCateringCount,
    maxBookletCount: row.maxBookletCount,
    validFrom: row.validFrom ? dayjs(row.validFrom).toDate() : null,
    validTo: row.validTo ? dayjs(row.validTo).toDate() : null,
    remark: row.remark
  })
  dialogVisible.value = true
}

function handleView(row) {
  ElMessage.info('详情功能开发中')
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定要取消该条码吗？取消后将无法使用。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.put(`/api/barcodes/${row.id}/cancel`)
    if (res.success) {
      ElMessage.success('条码已取消')
      fetchBarcodes()
    }
  } catch {
    // 用户取消
  }
}

async function handleSubmit() {
  if (!barcodeFormRef.value) return
  
  await barcodeFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      
      try {
        const data = {
          ...barcodeForm,
          validFrom: barcodeForm.validFrom ? dayjs(barcodeForm.validFrom).format() : null,
          validTo: barcodeForm.validTo ? dayjs(barcodeForm.validTo).format() : null
        }
        
        let res
        if (isEdit.value) {
          res = await request.put(`/api/barcodes/${barcodeForm.id}`, data)
        } else {
          res = await request.post('/api/barcodes', data)
        }
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
          dialogVisible.value = false
          fetchBarcodes()
        }
      } catch (error) {
        console.error('Submit error:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleBatchCreate() {
  Object.assign(batchForm, {
    prefix: 'EXH',
    startNumber: 1,
    count: 10,
    departmentId: departments.value.length > 0 ? departments.value[0].id : null,
    maxEntryCount: 1,
    maxCateringCount: 0,
    maxBookletCount: 0
  })
  batchDialogVisible.value = true
}

async function handleBatchSubmit() {
  batchLoading.value = true
  
  try {
    const res = await request.post('/api/barcodes/batch', batchForm)
    
    if (res.success) {
      ElMessage.success(`批量创建成功，共 ${res.data.count} 条`)
      batchDialogVisible.value = false
      fetchBarcodes()
    }
  } catch (error) {
    console.error('Batch submit error:', error)
  } finally {
    batchLoading.value = false
  }
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

function handleSizeChange(size) {
  pagination.pageSize = size
  fetchBarcodes()
}

function handleCurrentChange(page) {
  pagination.page = page
  fetchBarcodes()
}

function getStatusTag(status) {
  const map = {
    active: 'success',
    used: 'primary',
    expired: 'warning',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    active: '有效',
    used: '已使用',
    expired: '已过期',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatTime(time) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  fetchDepartments().then(() => {
    fetchBarcodes()
  })
})
</script>

<style scoped lang="scss">
.barcode-container {
  .toolbar {
    display: flex;
    gap: 10px;
  }
  
  .pagination {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
