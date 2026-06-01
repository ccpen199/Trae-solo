<template>
  <div class="customer-list">
    <div class="page-header">
      <h2 class="page-title">👥 客户管理</h2>
      <button class="btn btn-primary" @click="showAddModal = true">+ 新增客户</button>
    </div>

    <div class="filters">
      <input v-model="keyword" type="text" placeholder="搜索客户姓名/手机号..." class="input" />
      <select v-model="filterStage" class="select">
        <option value="">全部阶段</option>
        <option v-for="s in stages" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <select v-model="filterAgent" class="select">
        <option value="">全部顾问</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </div>

    <div class="panel">
      <table class="table">
        <thead>
          <tr>
            <th>客户姓名</th>
            <th>手机号</th>
            <th>来源渠道</th>
            <th>意向户型</th>
            <th>置业顾问</th>
            <th>当前阶段</th>
            <th>首次到访</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.id">
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.phone }}</td>
            <td>{{ c.channel_name || '-' }}</td>
            <td>{{ c.intended_layout || '-' }}</td>
            <td>{{ c.agent_name || '-' }}</td>
            <td><span :class="['badge', getStageBadge(c.stage)]">{{ getStageLabel(c.stage) }}</span></td>
            <td>{{ formatDate(c.first_visit_date) }}</td>
            <td>
              <button class="btn-link" @click="viewDetail(c.id)">查看</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增客户</h3>
          <button class="modal-close" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>客户姓名 *</label>
              <input v-model="form.name" type="text" class="input" placeholder="请输入姓名" />
            </div>
            <div class="form-group">
              <label>手机号 *</label>
              <input v-model="form.phone" type="text" class="input" placeholder="请输入手机号" />
            </div>
            <div class="form-group">
              <label>身份证号</label>
              <input v-model="form.id_card" type="text" class="input" placeholder="请输入身份证号" />
            </div>
            <div class="form-group">
              <label>来源渠道</label>
              <select v-model="form.channel_id" class="select">
                <option :value="null">请选择</option>
                <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>意向户型</label>
              <select v-model="form.intended_layout" class="select">
                <option value="">请选择</option>
                <option value="两室一厅">两室一厅</option>
                <option value="三室两厅">三室两厅</option>
                <option value="四室两厅">四室两厅</option>
              </select>
            </div>
            <div class="form-group">
              <label>置业顾问</label>
              <select v-model="form.agent_id" class="select">
                <option :value="null">请选择</option>
                <option v-for="u in users.filter(u => u.role === 'agent')" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>预算下限 (万)</label>
              <input v-model.number="form.budget_min" type="number" class="input" placeholder="例如：100" />
            </div>
            <div class="form-group">
              <label>预算上限 (万)</label>
              <input v-model.number="form.budget_max" type="number" class="input" placeholder="例如：200" />
            </div>
            <div class="form-group">
              <label>家庭结构</label>
              <input v-model="form.family_structure" type="text" class="input" placeholder="例如：三口之家" />
            </div>
            <div class="form-group full-width">
              <label>备注</label>
              <textarea v-model="form.remarks" class="textarea" rows="2"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="submitForm">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCustomers, getUsers, getChannels, createCustomer } from '../api'

export default {
  name: 'CustomerList',
  setup() {
    const router = useRouter()
    const customers = ref([])
    const users = ref([])
    const channels = ref([])
    const keyword = ref('')
    const filterStage = ref('')
    const filterAgent = ref('')
    const showAddModal = ref(false)
    const form = ref({
      name: '',
      phone: '',
      id_card: '',
      channel_id: null,
      intended_layout: '',
      agent_id: null,
      budget_min: null,
      budget_max: null,
      family_structure: '',
      remarks: ''
    })

    const stages = [
      { value: 'lead', label: '新线索' },
      { value: 'visited', label: '已到访' },
      { value: 'deposit', label: '已认筹' },
      { value: 'subscription', label: '已认购' },
      { value: 'signed', label: '已签约' },
      { value: 'churned', label: '已流失' }
    ]

    const getStageLabel = (stage) => {
      const found = stages.find(s => s.value === stage)
      return found ? found.label : stage
    }

    const getStageBadge = (stage) => {
      const map = {
        'lead': 'badge-gray',
        'visited': 'badge-blue',
        'deposit': 'badge-yellow',
        'subscription': 'badge-orange',
        'signed': 'badge-green',
        'churned': 'badge-red'
      }
      return map[stage] || 'badge-gray'
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('zh-CN')
    }

    const loadCustomers = async () => {
      const params = {}
      if (keyword.value) params.keyword = keyword.value
      if (filterStage.value) params.stage = filterStage.value
      if (filterAgent.value) params.agent_id = filterAgent.value
      const res = await getCustomers(params)
      customers.value = res.data
    }

    const loadUsers = async () => {
      const res = await getUsers()
      users.value = res.data
    }

    const loadChannels = async () => {
      const res = await getChannels()
      channels.value = res.data
    }

    const viewDetail = (id) => {
      router.push(`/customers/${id}`)
    }

    const resetForm = () => {
      form.value = {
        name: '',
        phone: '',
        id_card: '',
        channel_id: null,
        intended_layout: '',
        agent_id: null,
        budget_min: null,
        budget_max: null,
        family_structure: '',
        remarks: ''
      }
    }

    const submitForm = async () => {
      if (!form.value.name || !form.value.phone) {
        alert('请填写必填项')
        return
      }
      try {
        const data = {
          ...form.value,
          budget_min: form.value.budget_min ? form.value.budget_min * 10000 : null,
          budget_max: form.value.budget_max ? form.value.budget_max * 10000 : null
        }
        await createCustomer(data)
        showAddModal.value = false
        resetForm()
        loadCustomers()
      } catch (e) {
        if (e.response?.status === 409) {
          alert(e.response.data.message)
        } else {
          alert('保存失败: ' + e.message)
        }
      }
    }

    watch([keyword, filterStage, filterAgent], loadCustomers)

    onMounted(() => {
      loadCustomers()
      loadUsers()
      loadChannels()
    })

    return {
      customers,
      users,
      channels,
      keyword,
      filterStage,
      filterAgent,
      showAddModal,
      form,
      stages,
      getStageLabel,
      getStageBadge,
      formatDate,
      viewDetail,
      submitForm
    }
  }
}
</script>

<style scoped>
.customer-list { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 0; }
.filters { display: flex; gap: 12px; }
.input, .select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
.input:focus, .select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 14px 12px; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
.table th { background: #f9fafb; font-weight: 600; color: #374151; }
.table td { color: #4b5563; }
.badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.badge-gray { background: #f3f4f6; color: #4b5563; }
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-yellow { background: #fef3c7; color: #b45309; }
.badge-orange { background: #fed7aa; color: #c2410c; }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-red { background: #fee2e2; color: #b91c1c; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-default { background: #f3f4f6; color: #374151; }
.btn-default:hover { background: #e5e7eb; }
.btn-link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px; padding: 4px 8px; }
.btn-link:hover { text-decoration: underline; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #f3f4f6; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid #f3f4f6; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; }
</style>
