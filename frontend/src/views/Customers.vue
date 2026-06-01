<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>客户列表</span>
          <el-button type="primary" @click="showDialog">新增客户</el-button>
        </div>
      </template>
      <el-table :data="customers" border>
        <el-table-column prop="code" label="客户编码" width="120" />
        <el-table-column prop="name" label="客户名称" />
        <el-table-column prop="contact" label="联系人" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="billing_method" label="计费方式" width="100">
          <template #default="{ row }">
            {{ { daily: '按天', weekly: '按周', monthly: '按月' }[row.billing_method] }}
          </template>
        </el-table-column>
        <el-table-column prop="product_count" label="货品数" width="80" />
        <el-table-column prop="inventory_count" label="库存数" width="80" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑客户' : '新增客户'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" />
        </el-form-item>
        <el-form-item label="计费方式">
          <el-select v-model="form.billing_method" style="width: 100%">
            <el-option label="按天" value="daily" />
            <el-option label="按周" value="weekly" />
            <el-option label="按月" value="monthly" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { customers as customerApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Customers',
  data() {
    return {
      customers: [],
      dialogVisible: false,
      isEdit: false,
      form: {
        code: '',
        name: '',
        contact: '',
        phone: '',
        address: '',
        billing_method: 'daily'
      }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const res = await customerApi.list()
      this.customers = res.data
    },
    showDialog() {
      this.isEdit = false
      this.form = { code: '', name: '', contact: '', phone: '', address: '', billing_method: 'daily' }
      this.dialogVisible = true
    },
    edit(row) {
      this.isEdit = true
      this.editId = row.id
      this.form = { ...row }
      this.dialogVisible = true
    },
    async submit() {
      try {
        if (this.isEdit) {
          await customerApi.update(this.editId, this.form)
        } else {
          await customerApi.create(this.form)
        }
        this.dialogVisible = false
        this.load()
        ElMessage.success('保存成功')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '保存失败')
      }
    },
    async remove(row) {
      try {
        await ElMessageBox.confirm('确定删除此客户？', '提示')
        await customerApi.delete(row.id)
        this.load()
        ElMessage.success('删除成功')
      } catch (e) {
        if (e !== 'cancel') {
          ElMessage.error(e.response?.data?.error || '删除失败')
        }
      }
    }
  }
}
</script>
