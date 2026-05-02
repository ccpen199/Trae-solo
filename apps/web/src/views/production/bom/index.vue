<template>
  <div class="bom-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>BOM配方管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增BOM
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline>
        <el-form-item label="产品编码">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编码" width="200" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" width="200" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="bomList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column label="产品信息" min-width="200">
          <template #default="{ row }">
            <div>
              <div><strong>编码：</strong>{{ row.product?.code }}</div>
              <div><strong>名称：</strong>{{ row.product?.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="120" />
        <el-table-column label="原料数量" width="100">
          <template #default="{ row }">
            {{ row.materials?.length || 0 }}
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
      :title="isEdit ? '编辑BOM' : '新增BOM'"
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择产品" filterable>
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="`${product.code} - ${product.name}`"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="form.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="原料清单" prop="materials">
          <el-button type="primary" size="small" @click="handleAddMaterial" style="margin-bottom: 10px;">
            <el-icon><Plus /></el-icon> 添加原料
          </el-button>
          <el-table :data="form.materials" style="width: 100%">
            <el-table-column label="原料" width="300">
              <template #default="{ row }">
                <el-select v-model="row.materialId" placeholder="请选择原料" filterable>
                  <el-option
                    v-for="material in materials"
                    :key="material.id"
                    :label="`${material.code} - ${material.name} (${material.unit})`"
                    :value="material.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template #default="{ row }">
                <el-input v-model.number="row.quantity" type="number" placeholder="请输入数量" />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="120">
              <template #default="{ row }">
                <el-input v-model="row.unit" placeholder="请输入单位" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="form.materials.splice($index, 1)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { get, post, put, del } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const bomList = ref<any[]>([])
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  productCode: '',
  productName: '',
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const products = ref<any[]>([])
const materials = ref<any[]>([])

const form = reactive({
  id: '',
  productId: '',
  version: '',
  materials: [] as any[],
})

const rules = reactive<FormRules>({
  productId: [{ required: true, message: '请选择产品', trigger: 'blur' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  materials: [{
    validator: (rule: any, value: any, callback: any) => {
      if (value.length === 0) {
        callback(new Error('请至少添加一种原料'))
      } else {
        callback()
      }
    },
    trigger: 'change',
  }],
})

const loadBoms = async () => {
  try {
    const response = await get('/boms', {
      params: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        productCode: searchForm.productCode,
        productName: searchForm.productName,
      },
    })
    bomList.value = response.data.list
    pageInfo.total = response.data.total
  } catch (error) {
    ElMessage.error('获取BOM列表失败')
  }
}

const loadProducts = async () => {
  try {
    const response = await get('/products', {
      params: {
        page: 1,
        pageSize: 100,
      },
    })
    products.value = response.data.list
  } catch (error) {
    ElMessage.error('获取产品列表失败')
  }
}

const loadMaterials = async () => {
  try {
    const response = await get('/materials', {
      params: {
        page: 1,
        pageSize: 100,
      },
    })
    materials.value = response.data.list
  } catch (error) {
    ElMessage.error('获取原料列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  loadBoms()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  pageInfo.page = 1
  loadBoms()
}

const handleSizeChange = (size: number) => {
  pageInfo.pageSize = size
  loadBoms()
}

const handleCurrentChange = (current: number) => {
  pageInfo.page = current
  loadBoms()
}

const handleAdd = () => {
  isEdit.value = false
  form.id = ''
  form.productId = ''
  form.version = ''
  form.materials = []
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.productId = row.productId
  form.version = row.version
  form.materials = row.materials.map((item: any) => ({
    materialId: item.materialId,
    quantity: item.quantity,
    unit: item.unit,
  }))
  dialogVisible.value = true
}

const handleAddMaterial = () => {
  form.materials.push({
    materialId: '',
    quantity: 0,
    unit: '',
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await put(`/boms/${form.id}`, {
          version: form.version,
          materials: form.materials,
        })
        ElMessage.success('编辑成功')
      } else {
        await post('/boms', form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadBoms()
    } catch (error: any) {
      ElMessage.error(error.message || (isEdit.value ? '编辑失败' : '新增失败'))
    }
  })
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定删除该BOM配方吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await del(`/boms/${id}`)
    ElMessage.success('删除成功')
    loadBoms()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
    // 取消删除
  }
}

onMounted(() => {
  loadBoms()
  loadProducts()
  loadMaterials()
})
</script>

<style lang="scss" scoped>
.bom-management {
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
