<template>
  <div class="supplier-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增供应商
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline>
        <el-form-item label="供应商编码">
          <el-input v-model="searchForm.code" placeholder="请输入编码" width="200" />
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" width="200" />
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

      <el-table :data="supplierList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="code" label="供应商编码" />
        <el-table-column prop="name" label="供应商名称" />
        <el-table-column prop="contactPerson" label="联系人" />
        <el-table-column prop="contactPhone" label="联系电话" />
        <el-table-column prop="address" label="地址" />
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
      :title="isEdit ? '编辑供应商' : '新增供应商'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="供应商编码" prop="code" v-if="!isEdit">
          <el-input v-model="form.code" placeholder="请输入供应商编码" />
        </el-form-item>
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" type="textarea" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" type="textarea" />
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

const supplierList = ref<any[]>([])
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  code: '',
  name: '',
  isActive: '',
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  code: '',
  name: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  remark: '',
})

const rules = reactive<FormRules>({
  code: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
})

const loadSuppliers = async () => {
  try {
    const response = await get('/suppliers', {
      params: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        code: searchForm.code,
        name: searchForm.name,
        isActive: searchForm.isActive === '' ? undefined : searchForm.isActive,
      },
    })
    supplierList.value = response.data.list
    pageInfo.total = response.data.total
  } catch (error) {
    ElMessage.error('获取供应商列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  loadSuppliers()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  pageInfo.page = 1
  loadSuppliers()
}

const handleSizeChange = (size: number) => {
  pageInfo.pageSize = size
  loadSuppliers()
}

const handleCurrentChange = (current: number) => {
  pageInfo.page = current
  loadSuppliers()
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(form).forEach(key => {
    form[key as keyof typeof form] = ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.contactPerson = row.contactPerson
  form.contactPhone = row.contactPhone
  form.address = row.address
  form.remark = row.remark
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await put(`/suppliers/${form.id}`, {
          name: form.name,
          contactPerson: form.contactPerson,
          contactPhone: form.contactPhone,
          address: form.address,
          remark: form.remark,
        })
        ElMessage.success('编辑成功')
      } else {
        await post('/suppliers', form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadSuppliers()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    }
  })
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定删除该供应商吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await del(`/suppliers/${id}`)
    ElMessage.success('删除成功')
    loadSuppliers()
  } catch (error: any) {
    if (error.message?.includes('存在关联的原料批次')) {
      ElMessage.error(error.message)
    }
    // 取消删除
  }
}

const handleStatusChange = async (id: string, isActive: boolean) => {
  try {
    await put(`/suppliers/${id}`, { isActive })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    loadSuppliers() // 重新加载数据
  }
}

onMounted(() => {
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.supplier-management {
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
