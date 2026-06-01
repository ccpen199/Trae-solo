<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">报价方案</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增报价
      </el-button>
    </div>

    <el-table :data="quoteList" border style="width: 100%">
      <el-table-column prop="company_name" label="客户企业" width="140" />
      <el-table-column prop="version" label="版本" width="70" />
      <el-table-column label="意向房源" min-width="150">
        <template #default="{ row }">
          <span v-if="row.rooms">
            {{ row.rooms.map(r => `${r.building_name}-${r.room_number}`).join(', ') }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="base_rent" label="基础租金" width="100">
        <template #default="{ row }">{{ row.base_rent }}元/月</template>
      </el-table-column>
      <el-table-column prop="discount_policy" label="优惠政策" show-overflow-tooltip />
      <el-table-column prop="final_price" label="最终报价" width="100">
        <template #default="{ row }">{{ row.final_price }}元/月</template>
      </el-table-column>
      <el-table-column prop="expire_date" label="有效期至" width="120" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_locked ? 'success' : 'info'" size="small">
            {{ row.is_locked ? '已锁定' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" v-if="!row.is_locked" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="success" v-if="!row.is_locked" @click="lockQuote(row)">锁定</el-button>
            <el-button size="small" type="danger" v-if="!row.is_locked" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentQuote.id ? '编辑报价' : '新增报价'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户线索" required>
          <el-select v-model="form.lead_id" placeholder="请选择客户" style="width: 100%" filterable>
            <el-option v-for="l in leadList" :key="l.id" :label="l.company_name" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联带看">
          <el-select v-model="form.viewing_id" placeholder="选择带看记录" style="width: 100%" clearable>
            <el-option v-for="v in viewingList" :key="v.id" :label="`${v.viewing_time} - ${v.contact_person}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="意向房源" required>
          <el-select v-model="selectedRooms" multiple placeholder="请选择房源" style="width: 100%" filterable>
            <el-option v-for="r in roomList" :key="r.id" :label="`${r.building_name}-${r.floor_number}层-${r.room_number}(${r.area}㎡, ${r.rent_price}元)`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="基础租金">
          <el-input-number v-model="form.base_rent" :min="0" />
          <span style="margin-left: 8px">元/月</span>
        </el-form-item>
        <el-form-item label="优惠政策">
          <el-input v-model="form.discount_policy" placeholder="如：免租期2个月" />
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="form.discount_amount" :min="0" />
          <span style="margin-left: 8px">元</span>
        </el-form-item>
        <el-form-item label="最终报价" required>
          <el-input-number v-model="form.final_price" :min="0" />
          <span style="margin-left: 8px">元/月</span>
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="form.payment_method" style="width: 100%">
            <el-option label="月付" value="monthly" />
            <el-option label="季付" value="quarterly" />
            <el-option label="半年付" value="half_year" />
            <el-option label="年付" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-input-number v-model="form.valid_days" :min="1" />
          <span style="margin-left: 8px">天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { quotes as quotesApi, leads as leadsApi, viewings as viewingsApi, rooms as roomsApi } from '@/api'

const quoteList = ref([])
const leadList = ref([])
const viewingList = ref([])
const roomList = ref([])
const dialogVisible = ref(false)
const currentQuote = ref({})
const selectedRooms = ref([])

const form = reactive({
  id: null,
  lead_id: null,
  viewing_id: null,
  base_rent: 0,
  discount_policy: '',
  discount_amount: 0,
  final_price: 0,
  payment_method: 'monthly',
  valid_days: 30
})

watch(selectedRooms, (newVal) => {
  if (newVal && newVal.length > 0) {
    let total = 0
    newVal.forEach(id => {
      const room = roomList.value.find(r => r.id === id)
      if (room) total += Number(room.rent_price)
    })
    form.base_rent = total
    if (!form.final_price) form.final_price = total
  }
})

async function loadQuotes() {
  const data = await quotesApi.list()
  quoteList.value = data
}

async function loadLeads() {
  const data = await leadsApi.list()
  leadList.value = data
}

async function loadRooms() {
  const data = await roomsApi.list({ status: 'available' })
  roomList.value = data
}

function openDialog(row = null) {
  if (row) {
    Object.assign(form, row)
    selectedRooms.value = row.room_ids ? row.room_ids.split(',').map(Number) : []
  } else {
    Object.assign(form, { id: null, lead_id: null, viewing_id: null, base_rent: 0, discount_policy: '', discount_amount: 0, final_price: 0, payment_method: 'monthly', valid_days: 30 })
    selectedRooms.value = []
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.lead_id || selectedRooms.value.length === 0) {
    ElMessage.warning('请填写必填项')
    return
  }
  const data = { ...form, room_ids: selectedRooms.value }
  if (form.id) {
    await quotesApi.update(form.id, data)
    ElMessage.success('更新成功')
  } else {
    await quotesApi.create(data)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadQuotes()
}

async function lockQuote(row) {
  try {
    await ElMessageBox.confirm('锁定后将无法修改，确定锁定吗？', '提示', { type: 'warning' })
    await quotesApi.lock(row.id)
    ElMessage.success('已锁定')
    loadQuotes()
  } catch {
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该报价吗？', '提示', { type: 'warning' })
    await quotesApi.delete(row.id)
    ElMessage.success('删除成功')
    loadQuotes()
  } catch {
  }
}

onMounted(() => {
  loadQuotes()
  loadLeads()
  loadRooms()
})
</script>
