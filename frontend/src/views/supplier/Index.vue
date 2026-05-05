<template>
  <div class="supplier-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="供应商名称/编号/联系人"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="合作状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="合作中" :value="1" />
            <el-option label="暂停合作" :value="2" />
            <el-option label="已终止" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>供应商列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增供应商
          </el-button>
        </div>
      </template>
      
      <el-table :data="supplierList" v-loading="loading" stripe>
        <el-table-column prop="supplier_code" label="供应商编号" min-width="140" />
        <el-table-column prop="name" label="供应商名称" min-width="180" />
        <el-table-column prop="main_product" label="主营产品" min-width="200" show-overflow-tooltip />
        <el-table-column prop="region" label="地区" min-width="120" />
        <el-table-column prop="phone" label="联系电话" min-width="130" />
        <el-table-column prop="contact" label="联系人" min-width="100" />
        <el-table-column prop="status" label="合作状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" link @click="handleView(row)">详情</el-button>
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
          @size-change="loadSupplierList"
          @current-change="loadSupplierList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑供应商' : '新增供应商'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="supplierFormRef"
        :model="supplierForm"
        :rules="supplierRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商编号" prop="supplier_code">
              <el-input v-model="supplierForm.supplier_code" placeholder="请输入供应商编号（可选）" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="supplierForm.contact" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="地区" prop="region">
              <el-input v-model="supplierForm.region" placeholder="请输入地区" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作状态" prop="status">
              <el-select v-model="supplierForm.status" placeholder="请选择合作状态" style="width: 100%">
                <el-option label="合作中" :value="1" />
                <el-option label="暂停合作" :value="2" />
                <el-option label="已终止" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="主营产品" prop="main_product">
          <el-input v-model="supplierForm.main_product" placeholder="请输入主营产品" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="supplierForm.address"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="supplierForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="供应商详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="供应商编号">{{ currentSupplier.supplier_code }}</el-descriptions-item>
        <el-descriptions-item label="供应商名称">{{ currentSupplier.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentSupplier.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentSupplier.phone }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ currentSupplier.region }}</el-descriptions-item>
        <el-descriptions-item label="合作状态">
          <el-tag :type="getStatusType(currentSupplier.status)">{{ getStatusText(currentSupplier.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主营产品" :span="2">{{ currentSupplier.main_product }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ currentSupplier.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentSupplier.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentSupplier.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(currentSupplier.updated_at) }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(currentSupplier)">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)

const supplierFormRef = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const supplierList = ref([])
const currentSupplier = ref({})

const supplierForm = reactive({
  id: '',
  name: '',
  supplier_code: '',
  contact: '',
  phone: '',
  region: '',
  main_product: '',
  address: '',
  status: 1,
  remark: ''
})

const supplierRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  region: [{ required: true, message: '请输入地区', trigger: 'blur' }],
  main_product: [{ required: true, message: '请输入主营产品', trigger: 'blur' }],
  status: [{ required: true, message: '请选择合作状态', trigger: 'change' }]
}

const statusMap = {
  1: '合作中',
  2: '暂停合作',
  3: '已终止'
}

function formatTime(time) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function getStatusType(status) {
  const types = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return types[status] || ''
}

function getStatusText(status) {
  return statusMap[status] || '未知'
}

async function loadSupplierList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    }
    
    const res = await request.get('/api/suppliers', { params })
    if (res.success) {
      supplierList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('加载供应商列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadSupplierList()
}

function handleReset() {
  Object.assign(searchForm, {
    keyword: '',
    status: ''
  })
  pagination.page = 1
  loadSupplierList()
}

function handleAdd() {
  isEdit.value = false
  Object.assign(supplierForm, {
    id: '',
    name: '',
    supplier_code: '',
    contact: '',
    phone: '',
    region: '',
    main_product: '',
    address: '',
    status: 1,
    remark: ''
  })
  dialogVisible.value = true
}

async function handleEdit(row) {
  detailVisible.value = false
  isEdit.value = true
  try {
    const res = await request.get(`/api/suppliers/${row.id}`)
    if (res.success) {
      Object.assign(supplierForm, res.data)
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('获取供应商详情失败:', error)
  }
}

async function handleView(row) {
  try {
    const res = await request.get(`/api/suppliers/${row.id}`)
    if (res.success) {
      currentSupplier.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    console.error('获取供应商详情失败:', error)
  }
}

async function handleSubmit() {
  if (!supplierFormRef.value) return
  
  await supplierFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = { ...supplierForm }
        delete data.id
        
        let res
        if (isEdit.value) {
          res = await request.put(`/api/suppliers/${supplierForm.id}`, data)
        } else {
          res = await request.post('/api/suppliers', data)
        }
        
        if (res.success) {
          ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
          dialogVisible.value = false
          loadSupplierList()
        }
      } catch (error) {
        console.error('保存供应商失败:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  loadSupplierList()
})
</script>

<style scoped>
.supplier-container {
  min-height: 100%;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  flex-wrap: wrap;
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
