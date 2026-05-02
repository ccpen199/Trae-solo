<template>
  <div class="product-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>产品管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增产品
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline>
        <el-form-item label="产品编码">
          <el-input v-model="searchForm.code" placeholder="请输入编码" width="200" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" width="200" />
        </el-form-item>
        <el-form-item label="产品类别">
          <el-input v-model="searchForm.category" placeholder="请输入类别" width="150" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isActive" placeholder="请选择状态" width="120">
            <el-option label="全部" value="" />
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="productList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="code" label="产品编码" />
        <el-table-column prop="name" label="产品名称" />
        <el-table-column prop="specification" label="规格" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="sellingPrice" label="销售价格" width="120">
          <template #default="{ row }">
            ¥{{ row.sellingPrice || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleStatusChange(row.id, row.isActive)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" style="margin-top: 20px;">
        <el-pagination
          v-model:current-page="pageInfo.page"
          v-model:page-size="pageInfo.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageInfo.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑产品' : '新增产品'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="产品编码" prop="code" v-if="!isEdit">
          <el-input v-model="form.code" placeholder="请输入产品编码" />
        </el-form-item>
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-input v-model="form.category" placeholder="请输入类别" />
        </el-form-item>
        <el-form-item label="销售价格" prop="sellingPrice">
          <el-input v-model.number="form.sellingPrice" placeholder="请输入销售价格" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { get, post, put, del } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const productList = ref<any[]>([])
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  code: '',
  name: '',
  category: '',
  isActive: '',
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  code: '',
  name: '',
  specification: '',
  unit: '',
  category: '',
  sellingPrice: 0,
})

const rules = reactive<FormRules>({
  code: [{ required: true, message: '请输入产品编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  sellingPrice: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
})

const loadProducts = async () => {
  try {
    const response = await get('/products', {
      params: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        code: searchForm.code,
        name: searchForm.name,
        category: searchForm.category,
        isActive: searchForm.isActive === '' ? undefined : searchForm.isActive,
      },
    })
    productList.value = response.data.list
    pageInfo.total = response.data.total
  } catch (error) {
    ElMessage.error('获取产品列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  loadProducts()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  pageInfo.page = 1
  loadProducts()
}

const handleSizeChange = (size: number) => {
  pageInfo.pageSize = size
  loadProducts()
}

const handleCurrentChange = (current: number) => {
  pageInfo.page = current
  loadProducts()
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(form).forEach(key => {
    form[key as keyof typeof form] = ''
  })
  form.sellingPrice = 0
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.specification = row.specification
  form.unit = row.unit
  form.category = row.category
  form.sellingPrice = row.sellingPrice
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await put(`/products/${form.id}`, {
          name: form.name,
          specification: form.specification,
          unit: form.unit,
          category: form.category,
          sellingPrice: form.sellingPrice,
        })
        ElMessage.success('编辑成功')
      } else {
        await post('/products', form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadProducts()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    }
  })
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定删除该产品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await del(`/products/${id}`)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
    // 取消删除
  }
}

const handleStatusChange = async (id: string, isActive: boolean) => {
  try {
    await put(`/products/${id}`, { isActive })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    loadProducts() // 重新加载数据
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style lang="scss" scoped>
.product-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
