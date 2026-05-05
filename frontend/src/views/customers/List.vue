<template>
  <div class="customer-list-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="客户姓名/电话/编号"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="客户分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="归属">
          <el-radio-group v-model="searchForm.ownerType">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="my">我的客户</el-radio-button>
            <el-radio-button label="subordinate">下属客户</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>客户列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加客户
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="customerList"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="customer_no" label="客户编号" width="180" />
        <el-table-column prop="name" label="客户姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="category_name" label="客户分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category_name || '普通客户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="province" label="地区" width="100">
          <template #default="{ row }">
            {{ [row.province, row.city].filter(Boolean).join('') }}
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="归属销售" width="100" />
        <el-table-column prop="purchase_count" label="购买次数" width="90" align="center" />
        <el-table-column prop="total_amount" label="消费金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="last_order_at" label="最新下单" width="160">
          <template #default="{ row }">
            {{ row.last_order_at ? formatDate(row.last_order_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleCreateOrder(row)">快速下单</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="座机电话">
              <el-input v-model="formData.telephone" placeholder="请输入座机电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户分类">
              <el-select
                v-model="formData.categoryId"
                placeholder="请选择客户分类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份">
              <el-input v-model="formData.province" placeholder="省份" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市">
              <el-input v-model="formData.city" placeholder="城市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县">
              <el-input v-model="formData.district" placeholder="区县" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址">
          <el-input
            v-model="formData.address"
            type="textarea"
            :rows="2"
            placeholder="请输入详细地址"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getCustomerList, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { getCustomerCategories } from '@/api/common'

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const customerList = ref([])
const categories = ref([])

const searchForm = reactive({
  keyword: '',
  categoryId: null,
  ownerType: 'all'
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  name: '',
  phone: '',
  telephone: '',
  email: '',
  address: '',
  province: '',
  city: '',
  district: '',
  categoryId: null,
  remark: '',
  status: 1
})

const formRules = {
  name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑客户' : '添加客户')

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const fetchCategories = async () => {
  try {
    const res = await getCustomerCategories()
    categories.value = res.data || []
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      categoryId: searchForm.categoryId || undefined,
      myCustomers: searchForm.ownerType === 'my' ? true : undefined,
      subordinateCustomers: searchForm.ownerType === 'subordinate' ? true : undefined
    }

    const res = await getCustomerList(params)
    customerList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch customer list error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.categoryId = null
  searchForm.ownerType = 'all'
  pagination.page = 1
  fetchData()
}

const resetForm = () => {
  formData.name = ''
  formData.phone = ''
  formData.telephone = ''
  formData.email = ''
  formData.address = ''
  formData.province = ''
  formData.city = ''
  formData.district = ''
  formData.categoryId = null
  formData.remark = ''
  formData.status = 1
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editId.value = row.id
  resetForm()
  Object.assign(formData, {
    name: row.name,
    phone: row.phone,
    telephone: row.telephone,
    email: row.email,
    address: row.address,
    province: row.province,
    city: row.city,
    district: row.district,
    categoryId: row.category_id,
    remark: row.remark,
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  router.push(`/customers/${row.id}`)
}

const handleCreateOrder = (row) => {
  router.push({
    path: '/orders-create',
    query: { customerId: row.id }
  })
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteCustomer(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete customer error:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateCustomer(editId.value, formData)
          ElMessage.success('更新成功')
        } else {
          await createCustomer(formData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('Submit error:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
  fetchData()
})
</script>

<style scoped>
.customer-list-container {
  padding: 0;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
