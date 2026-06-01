<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="入库预约" name="appointment">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>预约列表</span>
              <el-button type="primary" @click="showApptDialog">新增预约</el-button>
            </div>
          </template>
          <el-table :data="appointments" border size="small">
            <el-table-column prop="appointment_no" label="预约单号" width="150" />
            <el-table-column prop="customer_name" label="客户" width="100" />
            <el-table-column prop="product_name" label="货品" />
            <el-table-column prop="expected_quantity" label="预计数量" width="100" />
            <el-table-column prop="batch_no" label="批次号" width="120" />
            <el-table-column prop="vehicle_no" label="车牌号" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="receive(row)">收货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="入库记录" name="record">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>入库记录</span>
              <el-button type="primary" @click="showReceiveDialog">直接收货</el-button>
            </div>
          </template>
          <el-table :data="records" border size="small">
            <el-table-column prop="record_no" label="入库单号" width="150" />
            <el-table-column prop="customer_name" label="客户" width="100" />
            <el-table-column prop="product_name" label="货品" />
            <el-table-column prop="batch_no" label="批次号" width="120" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="location_code" label="库位" width="100" />
            <el-table-column prop="inspection_status" label="质检" width="80">
              <template #default="{ row }">
                <el-tag :type="row.inspection_status === 'passed' ? 'success' : row.inspection_status === 'failed' ? 'danger' : 'info'">
                  {{ row.inspection_status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'exception' ? 'danger' : 'warning'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button v-if="row.status === 'receiving'" size="small" @click="showInspectDialog(row)">质检</el-button>
                <el-button v-if="row.status === 'inspected'" size="small" type="primary" @click="showPutawayDialog(row)">上架</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="apptDialogVisible" title="新增预约" width="600px">
      <el-form :model="apptForm" label-width="100px">
        <el-form-item label="客户">
          <el-select v-model="apptForm.customer_id" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货品">
          <el-select v-model="apptForm.product_id" style="width: 100%">
            <el-option v-for="p in customerProducts" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计数量">
          <el-input-number v-model="apptForm.expected_quantity" :min="1" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="apptForm.batch_no" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="apptForm.vehicle_no" />
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="apptForm.driver" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="apptForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="apptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppointment">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="receiveDialogVisible" title="收货登记" width="600px">
      <el-form :model="receiveForm" label-width="100px">
        <el-form-item label="客户">
          <el-select v-model="receiveForm.customer_id" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货品">
          <el-select v-model="receiveForm.product_id" style="width: 100%">
            <el-option v-for="p in customerProducts" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="receiveForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="receiveForm.batch_no" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="receiveForm.vehicle_no" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReceive">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="inspectDialogVisible" title="质检" width="500px">
      <el-form :model="inspectForm" label-width="100px">
        <el-form-item label="质检结果">
          <el-radio-group v-model="inspectForm.is_qualified">
            <el-radio :label="true">合格</el-radio>
            <el-radio :label="false">不合格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="损坏数量" v-if="!inspectForm.is_qualified">
          <el-input-number v-model="inspectForm.damaged_quantity" :min="0" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="inspectForm.inspection_result" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspect">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="putawayDialogVisible" title="上架" width="500px">
      <el-form :model="putawayForm" label-width="100px">
        <el-form-item label="选择库位">
          <el-select v-model="putawayForm.location_id" style="width: 100%">
            <el-option v-for="l in availableLocations" :key="l.id" :label="l.code + ' - ' + l.zone_name" :value="l.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="putawayDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPutaway">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { inbound, customers, products as productApi, locations } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Inbound',
  data() {
    return {
      activeTab: 'appointment',
      appointments: [],
      records: [],
      customers: [],
      allProducts: [],
      customerProducts: [],
      availableLocations: [],
      apptDialogVisible: false,
      receiveDialogVisible: false,
      inspectDialogVisible: false,
      putawayDialogVisible: false,
      inspectId: null,
      putawayId: null,
      apptForm: { customer_id: null, product_id: null, expected_quantity: 1, batch_no: '', vehicle_no: '', driver: '', remark: '' },
      receiveForm: { customer_id: null, product_id: null, quantity: 1, batch_no: '', vehicle_no: '', appointment_id: null },
      inspectForm: { is_qualified: true, inspection_result: '', damaged_quantity: 0 },
      putawayForm: { location_id: null }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const [apptRes, recRes, custRes, prodRes] = await Promise.all([
        inbound.appointments(),
        inbound.records(),
        customers.list(),
        productApi.list()
      ])
      this.appointments = apptRes.data
      this.records = recRes.data
      this.customers = custRes.data
      this.allProducts = prodRes.data
    },
    onCustomerChange(customerId) {
      this.customerProducts = this.allProducts.filter(p => p.customer_id === customerId)
    },
    showApptDialog() {
      this.apptForm = { customer_id: null, product_id: null, expected_quantity: 1, batch_no: '', vehicle_no: '', driver: '', remark: '' }
      this.apptDialogVisible = true
    },
    async submitAppointment() {
      try {
        await inbound.createAppointment(this.apptForm)
        this.apptDialogVisible = false
        this.load()
        ElMessage.success('预约成功')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    },
    receive(row) {
      this.receiveForm = { customer_id: row.customer_id, product_id: row.product_id, quantity: row.expected_quantity, batch_no: row.batch_no || '', vehicle_no: row.vehicle_no || '', appointment_id: row.id }
      this.receiveDialogVisible = true
    },
    showReceiveDialog() {
      this.receiveForm = { customer_id: null, product_id: null, quantity: 1, batch_no: '', vehicle_no: '', appointment_id: null }
      this.receiveDialogVisible = true
    },
    async submitReceive() {
      try {
        await inbound.receive(this.receiveForm)
        this.receiveDialogVisible = false
        this.load()
        ElMessage.success('收货成功')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    },
    async showInspectDialog(row) {
      this.inspectId = row.id
      this.inspectForm = { is_qualified: true, inspection_result: '', damaged_quantity: 0 }
      this.inspectDialogVisible = true
    },
    async submitInspect() {
      try {
        await inbound.inspect(this.inspectId, this.inspectForm)
        this.inspectDialogVisible = false
        this.load()
        ElMessage.success('质检完成')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    },
    async showPutawayDialog(row) {
      this.putawayId = row.id
      const product = this.allProducts.find(p => p.id === row.product_id)
      const locRes = await locations.list({ zone_id: product?.temperature_zone_id })
      this.availableLocations = locRes.data.filter(l => l.status !== 'occupied')
      this.putawayForm = { location_id: null }
      this.putawayDialogVisible = true
    },
    async submitPutaway() {
      try {
        await inbound.putaway(this.putawayId, this.putawayForm)
        this.putawayDialogVisible = false
        this.load()
        ElMessage.success('上架完成')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    }
  }
}
</script>
