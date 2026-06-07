<template>
  <AdminLayout>
    <div class="admin-services">
      <div class="page-header">
        <h3>服务事项管理</h3>
        <div class="header-actions">
          <el-button type="primary" @click="handleCreate">新增服务事项</el-button>
        </div>
      </div>

      <el-card class="table-card">
        <el-table :data="services" border style="width: 100%">
          <el-table-column prop="code" label="事项编码" width="140" />
          <el-table-column prop="name" label="事项名称" min-width="200" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="department" label="责任部门" width="140" />
          <el-table-column prop="handling_time" label="承诺时限" width="100">
            <template #default="{ row }">{{ row.handling_time }}个工作日</template>
          </el-table-column>
          <el-table-column prop="fee" label="费用" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" link @click="toggleStatus(row)">
                {{ row.status === 'active' ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑服务事项' : '新增服务事项'" width="700px">
        <el-form :model="form" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="事项编码">
                <el-input v-model="form.code" placeholder="请输入事项编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="事项名称">
                <el-input v-model="form.name" placeholder="请输入事项名称" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="事项分类">
                <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                  <el-option label="社保服务" value="social_security" />
                  <el-option label="医保服务" value="medical" />
                  <el-option label="户政服务" value="household" />
                  <el-option label="不动产服务" value="real_estate" />
                  <el-option label="企业服务" value="business" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="责任部门">
                <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
                  <el-option label="省民政厅" value="省民政厅" />
                  <el-option label="省公安厅" value="省公安厅" />
                  <el-option label="省人力资源社会保障厅" value="省人力资源社会保障厅" />
                  <el-option label="省卫生健康委" value="省卫生健康委" />
                  <el-option label="省市场监管局" value="省市场监管局" />
                  <el-option label="省自然资源厅" value="省自然资源厅" />
                  <el-option label="省医保局" value="省医保局" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="承诺时限（工作日）">
                <el-input-number v-model="form.handling_time" :min="1" :max="365" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="办理费用">
                <el-input v-model="form.fee" placeholder="请输入办理费用" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="事项描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入事项描述" />
          </el-form-item>
          <el-form-item label="所需材料">
            <el-input v-model="form.materials" type="textarea" :rows="3" placeholder="请输入所需材料，每行一个" />
          </el-form-item>
          <el-form-item label="办理流程">
            <el-input v-model="form.processSteps" type="textarea" :rows="3" placeholder="请输入办理流程步骤，每行一个" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api'

const services = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  code: '',
  name: '',
  category: '',
  department: '',
  description: '',
  materials: '',
  processSteps: '',
  handling_time: 5,
  fee: '免费'
})

const loadData = async () => {
  try {
    const res = await adminApi.getServices()
    services.value = res
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.value = {
    id: null,
    code: '',
    name: '',
    category: '',
    department: '',
    description: '',
    materials: '',
    processSteps: '',
    handling_time: 5,
    fee: '免费'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    department: row.department,
    description: row.description,
    materials: row.materials,
    processSteps: row.process_steps,
    handling_time: row.handling_time,
    fee: row.fee,
    status: row.status
  }
  dialogVisible.value = true
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    await adminApi.updateService(row.id, {
      ...row,
      status: newStatus
    })
    ElMessage.success(`已${newStatus === 'active' ? '启用' : '停用'}`)
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const submitForm = async () => {
  if (!form.value.code || !form.value.name || !form.value.category || !form.value.department) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    if (isEdit.value) {
      await adminApi.updateService(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await adminApi.createService(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-services .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-services .page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.table-card {
  border-radius: 8px;
}
</style>
