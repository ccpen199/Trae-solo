<template>
  <div class="admin-zones">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>运营区配置</h3>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加运营区
          </el-button>
        </div>
      </template>

      <el-table :data="zones" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="city_name" label="城市" width="150" />
        <el-table-column prop="district_name" label="区域" width="150" />
        <el-table-column prop="geofence" label="围栏坐标" :show-overflow-tooltip="true">
          <template #default="{ row }">
            {{ row.geofence ? '已配置' : '未配置' }}
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link :type="row.is_active ? 'warning' : 'success'" @click="handleToggle(row)">
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="城市名称" prop="city_name">
          <el-input v-model="form.city_name" placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="区域名称" prop="district_name">
          <el-input v-model="form.district_name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/modules'

const loading = ref(false)
const zones = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加运营区')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const form = reactive({
  id: null,
  city_name: '',
  district_name: '',
  is_active: true
})

const rules = {
  city_name: [
    { required: true, message: '请输入城市名称', trigger: 'blur' }
  ]
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadZones = async () => {
  loading.value = true
  try {
    const res = await adminApi.zones.list()
    if (res.success) {
      zones.value = res.zones
    }
  } catch (error) {
    console.error('加载运营区失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '添加运营区'
  isEdit.value = false
  form.id = null
  form.city_name = ''
  form.district_name = ''
  form.is_active = true
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑运营区'
  isEdit.value = true
  form.id = row.id
  form.city_name = row.city_name
  form.district_name = row.district_name
  form.is_active = row.is_active === 1
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let res
        if (isEdit.value) {
          res = await adminApi.zones.update(form.id, form)
        } else {
          res = await adminApi.zones.create(form)
        }

        if (res.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          dialogVisible.value = false
          loadZones()
        }
      } catch (error) {
        console.error('操作失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleToggle = async (row) => {
  try {
    await adminApi.zones.update(row.id, { is_active: row.is_active ? 0 : 1 })
    ElMessage.success(row.is_active ? '已禁用' : '已启用')
    loadZones()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该运营区？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await adminApi.zones.delete(row.id)
    ElMessage.success('删除成功')
    loadZones()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadZones()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}
</style>
