<template>
  <div>
    <h2 style="margin-bottom: 20px">客户管理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>客户列表</span>
          <el-button type="primary" @click="openDialog()">新增客户</el-button>
        </div>
      </template>
      <el-table :data="customers" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag>{{ row.type === 'wholesale' ? '批发客户' : '零售客户' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" />
        <el-table-column prop="current_debt" label="当前欠款" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="editCustomer(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editingCustomer ? '编辑客户' : '新增客户'" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入11位手机号" />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="零售客户" value="retail" />
            <el-option label="批发客户" value="wholesale" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用额度">
          <el-input-number v-model="form.credit_limit" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCustomer">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const customers = ref([])
const showDialog = ref(false)
const editingCustomer = ref(null)
const formRef = ref(null)
const form = ref({ name: '', phone: '', type: 'retail', credit_limit: 0 })

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
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }]
}

const loadCustomers = async () => {
  const res = await axios.get('/api/customers')
  customers.value = res.data
}

const openDialog = () => {
  editingCustomer.value = null
  form.value = { name: '', phone: '', type: 'retail', credit_limit: 0 }
  showDialog.value = true
}

const editCustomer = (row) => {
  editingCustomer.value = row
  form.value = { ...row }
  showDialog.value = true
}

const saveCustomer = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (editingCustomer.value) {
      await axios.put(`/api/customers/${editingCustomer.value.id}`, form.value)
    } else {
      await axios.post('/api/customers', form.value)
    }
    ElMessage.success('保存成功')
    showDialog.value = false
    loadCustomers()
  } catch (e) {
    if (e !== false) {
      console.error('保存失败:', e)
      ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message || '验证未通过'))
    }
  }
}

onMounted(loadCustomers)
</script>
