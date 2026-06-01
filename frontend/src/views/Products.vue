<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>货品列表</span>
          <el-button type="primary" @click="showDialog">新增货品</el-button>
        </div>
      </template>
      <el-table :data="products" border>
        <el-table-column prop="code" label="货品编码" width="120" />
        <el-table-column prop="name" label="货品名称" />
        <el-table-column prop="customer_name" label="所属客户" width="120" />
        <el-table-column prop="temperature_zone_name" label="温区要求" width="100" />
        <el-table-column prop="shelf_life_days" label="保质期(天)" width="100" />
        <el-table-column prop="storage_fee" label="仓储费" width="100" />
        <el-table-column prop="handling_fee" label="操作费" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑货品' : '新增货品'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="货品编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="货品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所属客户">
          <el-select v-model="form.customer_id" style="width: 100%">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="温区要求">
          <el-select v-model="form.temperature_zone_id" style="width: 100%">
            <el-option v-for="z in zones" :key="z.id" :label="z.name" :value="z.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="保质期(天)">
          <el-input-number v-model="form.shelf_life_days" :min="1" />
        </el-form-item>
        <el-form-item label="仓储费">
          <el-input-number v-model="form.storage_fee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="操作费">
          <el-input-number v-model="form.handling_fee" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="包装类型">
          <el-input v-model="form.package_type" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="需要批次">
          <el-switch v-model="form.batch_required" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="需要质检">
          <el-switch v-model="form.inspection_required" :active-value="1" :inactive-value="0" />
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
import { products as productApi, customers, temperatureZones } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'Products',
  data() {
    return {
      products: [],
      customers: [],
      zones: [],
      dialogVisible: false,
      isEdit: false,
      form: {
        code: '',
        name: '',
        customer_id: null,
        temperature_zone_id: null,
        shelf_life_days: 30,
        batch_required: 1,
        package_type: '',
        inspection_required: 0,
        storage_fee: 0,
        handling_fee: 0,
        unit: ''
      }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const [prodRes, custRes, zoneRes] = await Promise.all([
        productApi.list(),
        customers.list(),
        temperatureZones.list()
      ])
      this.products = prodRes.data
      this.customers = custRes.data
      this.zones = zoneRes.data
    },
    showDialog() {
      this.isEdit = false
      this.form = { code: '', name: '', customer_id: null, temperature_zone_id: null, shelf_life_days: 30, batch_required: 1, package_type: '', inspection_required: 0, storage_fee: 0, handling_fee: 0, unit: '' }
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
          await productApi.update(this.editId, this.form)
        } else {
          await productApi.create(this.form)
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
        await ElMessageBox.confirm('确定删除此货品？', '提示')
        await productApi.delete(row.id)
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
