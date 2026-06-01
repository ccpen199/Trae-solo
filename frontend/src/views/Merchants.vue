<template>
  <div>
    <h2 style="margin-bottom: 20px">商户管理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>商户列表</span>
          <el-button type="primary" @click="showDialog = true">新增商户</el-button>
        </div>
      </template>
      <el-table :data="merchants" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="商户名称" />
        <el-table-column prop="stall_number" label="档口编号" />
        <el-table-column prop="contact_person" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="credit_limit" label="信用额度" />
        <el-table-column prop="current_debt" label="当前欠款" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '营业中' : '已停业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editMerchant(row)">编辑</el-button>
            <el-button size="small" :type="row.status === 'active' ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '停业' : '恢复' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editingMerchant ? '编辑商户' : '新增商户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="档口编号" prop="stall_number">
          <el-input v-model="form.stall_number" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入11位手机号" />
        </el-form-item>
        <el-form-item label="信用额度">
          <el-input-number v-model="form.credit_limit" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMerchant">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const merchants = ref([])
const showDialog = ref(false)
const editingMerchant = ref(null)
const formRef = ref(null)
const form = ref({ name: '', stall_number: '', contact_person: '', phone: '', credit_limit: 0, status: 'active' })

const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入联系电话'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的11位手机号码'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  stall_number: [{ required: true, message: '请输入档口编号', trigger: 'blur' }],
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }]
}

const loadMerchants = async () => {
  const res = await axios.get('/api/merchants')
  merchants.value = res.data
}

const editMerchant = (row) => {
  editingMerchant.value = row
  form.value = { ...row }
  showDialog.value = true
}

const toggleStatus = async (row) => {
  await axios.put(`/api/merchants/${row.id}/toggle-status`)
  ElMessage.success('状态更新成功')
  loadMerchants()
}

const saveMerchant = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (editingMerchant.value) {
      await axios.put(`/api/merchants/${editingMerchant.value.id}`, form.value)
    } else {
      await axios.post('/api/merchants', form.value)
    }
    ElMessage.success('保存成功')
    showDialog.value = false
    loadMerchants()
  } catch (e) {
    if (e !== false) {
      ElMessage.error('保存失败')
    }
  }
}

onMounted(loadMerchants)
</script>
