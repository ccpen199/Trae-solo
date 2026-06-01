<template>
  <div>
    <div class="page-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 class="page-title" style="margin:0">应用管理</h2>
        <div>
          <el-input v-model="keyword" placeholder="搜索应用编码/名称" size="small" style="width:220px" clearable />
          <el-button type="primary" size="small" style="margin-left:8px" @click="openCreate">新增应用</el-button>
        </div>
      </div>
      <el-divider />
      <el-table :data="rows" size="small" stripe>
        <el-table-column prop="app_code" label="应用编码" width="140" />
        <el-table-column prop="app_name" label="应用名称" />
        <el-table-column prop="owner" label="责任人" width="120" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/applications/${row.id}`)">详情</el-button>
            <el-button link type="warning" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑应用' : '新增应用'" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="应用编码"><el-input v-model="form.app_code" :disabled="!!editing" /></el-form-item>
        <el-form-item label="应用名称"><el-input v-model="form.app_name" /></el-form-item>
        <el-form-item label="责任人"><el-input v-model="form.owner" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="业务应用" value="业务应用" />
            <el-option label="基础服务" value="基础服务" />
            <el-option label="中间件" value="中间件" />
            <el-option label="数据服务" value="数据服务" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="active" value="active" />
            <el-option label="inactive" value="inactive" />
            <el-option label="archived" value="archived" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { AppAPI } from '../api'

const rows = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const editing = ref(null)
const form = ref({ app_code: '', app_name: '', owner: '', category: '', description: '', status: 'active' })

async function load() {
  const res = await AppAPI.list({ keyword: keyword.value })
  if (res?.code === 0) rows.value = res.data
}
onMounted(load)
watch(keyword, load)

function openCreate() {
  editing.value = null
  form.value = { app_code: '', app_name: '', owner: '', category: '', description: '', status: 'active' }
  dialogVisible.value = true
}
function openEdit(row) {
  editing.value = row
  form.value = { ...row }
  dialogVisible.value = true
}
async function save() {
  if (editing.value) {
    const res = await AppAPI.update(editing.value.id, form.value)
    if (res?.code === 0) { ElMessage.success('更新成功'); dialogVisible.value = false; load() }
  } else {
    if (!form.value.app_code || !form.value.app_name) return ElMessage.warning('编码和名称必填')
    const res = await AppAPI.create(form.value)
    if (res?.code === 0) { ElMessage.success('创建成功'); dialogVisible.value = false; load() }
  }
}
async function remove(row) {
  try {
    await ElMessageBox.confirm(`确定删除应用 ${row.app_name}？`, '警告', { type: 'warning' })
    const res = await AppAPI.remove(row.id)
    if (res?.code === 0) { ElMessage.success('删除成功'); load() }
  } catch (e) {}
}
</script>
