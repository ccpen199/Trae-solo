<template>
  <div class="inbound-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>原料入库</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增入库
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline>
        <el-form-item label="原料编码">
          <el-input v-model="searchForm.materialCode" placeholder="请输入原料编码" width="200" />
        </el-form-item>
        <el-form-item label="供应商编码">
          <el-input v-model="searchForm.supplierCode" placeholder="请输入供应商编码" width="200" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="searchForm.batchNumber" placeholder="请输入批次号" width="200" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="inboundList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column label="原料信息" min-width="200">
          <template #default="{ row }">
            <div>
              <div><strong>编码：</strong>{{ row.material?.code }}</div>
              <div><strong>名称：</strong>{{ row.material?.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="150">
          <template #default="{ row }">
            <div>
              <div><strong>编码：</strong>{{ row.supplier?.code }}</div>
              <div><strong>名称：</strong>{{ row.supplier?.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="入库数量" width="120">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="batchNumber" label="批次号" width="180" />
        <el-table-column prop="expiryDate" label="有效期" width="150" />
        <el-table-column prop="createdAt" label="入库时间" width="180" />
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

    <!-- 新增入库对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增原料入库"
      width="800px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="原料" prop="materialId">
          <el-select v-model="form.materialId" placeholder="请选择原料" filterable @change="handleMaterialChange">
            <el-option
              v-for="material in materials"
              :key="material.id"
              :label="`${material.code} - ${material.name} (${material.unit})`"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable>
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="`${supplier.code} - ${supplier.name}`"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入库数量" prop="quantity">
          <el-input v-model.number="form.quantity" type="number" placeholder="请输入入库数量" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNumber">
          <el-input v-model="form.batchNumber" placeholder="不填写则自动生成" />
        </el-form-item>
        <el-form-item label="有效期" prop="expiryDate">
          <el-date-picker
            v-model="form.expiryDate"
            type="date"
            placeholder="请选择有效期"
            style="width: 100%"
          />
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
import { get, post } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const inboundList = ref<any[]>([])
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  materialCode: '',
  supplierCode: '',
  batchNumber: '',
})

const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const materials = ref<any[]>([])
const suppliers = ref<any[]>([])

const form = reactive({
  materialId: '',
  supplierId: '',
  quantity: 0,
  unit: '',
  batchNumber: '',
  expiryDate: '',
  remark: '',
})

const rules = reactive<FormRules>({
  materialId: [{ required: true, message: '请选择原料', trigger: 'blur' }],
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  expiryDate: [{ required: true, message: '请选择有效期', trigger: 'blur' }],
})

const loadInbounds = async () => {
  try {
    const response = await get('/inbounds', {
      params: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        materialCode: searchForm.materialCode,
        supplierCode: searchForm.supplierCode,
        batchNumber: searchForm.batchNumber,
      },
    })
    inboundList.value = response.data.list
    pageInfo.total = response.data.total
  } catch (error) {
    ElMessage.error('获取入库记录失败')
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

const loadSuppliers = async () => {
  try {
    const response = await get('/suppliers', {
      params: {
        page: 1,
        pageSize: 100,
      },
    })
    suppliers.value = response.data.list
  } catch (error) {
    ElMessage.error('获取供应商列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  loadInbounds()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  pageInfo.page = 1
  loadInbounds()
}

const handleSizeChange = (size: number) => {
  pageInfo.pageSize = size
  loadInbounds()
}

const handleCurrentChange = (current: number) => {
  pageInfo.page = current
  loadInbounds()
}

const handleAdd = () => {
  form.materialId = ''
  form.supplierId = ''
  form.quantity = 0
  form.unit = ''
  form.batchNumber = ''
  form.expiryDate = ''
  form.remark = ''
  dialogVisible.value = true
}

const handleMaterialChange = (materialId: string) => {
  const material = materials.value.find(m => m.id === materialId)
  if (material) {
    form.unit = material.unit
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await post('/inbounds', form)
      ElMessage.success('入库成功')
      dialogVisible.value = false
      loadInbounds()
    } catch (error: any) {
      ElMessage.error(error.message || '入库失败')
    }
  })
}

onMounted(() => {
  loadInbounds()
  loadMaterials()
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.inbound-management {
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
