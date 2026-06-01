<template>
  <div class="property-list">
    <div class="page-header">
      <h2 class="page-title">🏢 房源管理</h2>
      <div class="filters">
        <select v-model="filterBuilding" class="select">
          <option value="">全部楼栋</option>
          <option v-for="b in buildings" :key="b" :value="b">{{ b }}号楼</option>
        </select>
        <select v-model="filterLayout" class="select">
          <option value="">全部户型</option>
          <option value="两室一厅">两室一厅</option>
          <option value="三室两厅">三室两厅</option>
          <option value="四室两厅">四室两厅</option>
        </select>
        <select v-model="filterStatus" class="select">
          <option value="">全部状态</option>
          <option value="available">可售</option>
          <option value="reserved">已锁定</option>
          <option value="sold">已售出</option>
        </select>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">总房源</span>
        <span class="stat-value">{{ properties.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">可售</span>
        <span class="stat-value text-green">{{ getStatusCount('available') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已锁定</span>
        <span class="stat-value text-yellow">{{ getStatusCount('reserved') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已售出</span>
        <span class="stat-value text-gray">{{ getStatusCount('sold') }}</span>
      </div>
    </div>

    <div class="property-grid">
      <div 
        v-for="p in filteredProperties" 
        :key="p.id" 
        :class="['property-card', getStatusClass(p.status)]"
        @click="openDetail(p)"
      >
        <div class="property-header">
          <span class="property-title">{{ p.building_no }}号楼{{ p.unit_no }}单元{{ p.room_no }}</span>
          <span :class="['badge', getStatusBadge(p.status)]">{{ getStatusLabel(p.status) }}</span>
        </div>
        <div class="property-body">
          <div class="property-info">
            <span class="info-label">户型</span>
            <span class="info-value">{{ p.layout_type }}</span>
          </div>
          <div class="property-info">
            <span class="info-label">面积</span>
            <span class="info-value">{{ p.area }}㎡</span>
          </div>
          <div class="property-info">
            <span class="info-label">楼层</span>
            <span class="info-value">{{ p.floor_no }}层</span>
          </div>
          <div class="property-info">
            <span class="info-label">总价</span>
            <span class="info-value price">¥{{ formatMoney(p.price) }}</span>
          </div>
        </div>
        <div class="property-footer">
          <span class="click-hint">点击查看详情 →</span>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>房源详情 - {{ selectedProperty?.building_no }}号楼{{ selectedProperty?.unit_no }}单元{{ selectedProperty?.room_no }}</h3>
          <button class="modal-close" @click="showDetail = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedProperty" class="detail-content">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">楼栋</span>
                  <span class="detail-value">{{ selectedProperty.building_no }}号楼</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">单元</span>
                  <span class="detail-value">{{ selectedProperty.unit_no }}单元</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">楼层</span>
                  <span class="detail-value">{{ selectedProperty.floor_no }}层</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">房号</span>
                  <span class="detail-value">{{ selectedProperty.room_no }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">户型</span>
                  <span class="detail-value">{{ selectedProperty.layout_type }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">建筑面积</span>
                  <span class="detail-value">{{ selectedProperty.area }}㎡</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">销售总价</span>
                  <span class="detail-value price">¥{{ formatMoney(selectedProperty.price) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">当前状态</span>
                  <span :class="['badge', getStatusBadge(selectedProperty.status)]">{{ getStatusLabel(selectedProperty.status) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>状态管理</h4>
              <div class="status-actions">
                <button 
                  :class="['btn', selectedProperty.status === 'available' ? 'btn-primary' : 'btn-default']"
                  @click="updateStatus('available')"
                  :disabled="selectedProperty.status === 'available'"
                >
                  标记为可售
                </button>
                <button 
                  :class="['btn', selectedProperty.status === 'reserved' ? 'btn-primary' : 'btn-default']"
                  @click="updateStatus('reserved')"
                  :disabled="selectedProperty.status === 'reserved'"
                >
                  标记为锁定
                </button>
                <button 
                  :class="['btn', selectedProperty.status === 'sold' ? 'btn-primary' : 'btn-default']"
                  @click="updateStatus('sold')"
                  :disabled="selectedProperty.status === 'sold'"
                >
                  标记为已售
                </button>
              </div>
            </div>

            <div class="detail-section">
              <h4>交易记录</h4>
              <div v-if="intentions.length > 0" class="record-list">
                <div v-for="i in intentions" :key="i.id" class="record-item">
                  <div class="record-header">
                    <span :class="['record-type', getIntentionTypeClass(i.type)]">{{ getIntentionTypeLabel(i.type) }}</span>
                    <span class="record-date">{{ formatDateTime(i.created_at) }}</span>
                    <span :class="['badge', getApprovalBadge(i.approval_status)]">{{ getApprovalLabel(i.approval_status) }}</span>
                  </div>
                  <div class="record-body">
                    <p><strong>客户：</strong>{{ i.customer_name }} ({{ i.customer_phone }})</p>
                    <p v-if="i.deposit_amount"><strong>定金：</strong>¥{{ formatMoney(i.deposit_amount) }}</p>
                    <p v-if="i.discount_amount"><strong>优惠：</strong>¥{{ formatMoney(i.discount_amount) }}</p>
                    <p v-if="i.payment_method"><strong>付款方式：</strong>{{ i.payment_method }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">暂无交易记录</div>
            </div>

            <div class="detail-section">
              <h4>编辑房源</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label>楼栋号</label>
                  <input v-model="editForm.building_no" type="text" class="input" />
                </div>
                <div class="form-group">
                  <label>单元号</label>
                  <input v-model="editForm.unit_no" type="text" class="input" />
                </div>
                <div class="form-group">
                  <label>楼层</label>
                  <input v-model.number="editForm.floor_no" type="number" class="input" />
                </div>
                <div class="form-group">
                  <label>房号</label>
                  <input v-model="editForm.room_no" type="text" class="input" />
                </div>
                <div class="form-group">
                  <label>户型</label>
                  <select v-model="editForm.layout_type" class="select">
                    <option value="两室一厅">两室一厅</option>
                    <option value="三室两厅">三室两厅</option>
                    <option value="四室两厅">四室两厅</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>面积 (㎡)</label>
                  <input v-model.number="editForm.area" type="number" class="input" />
                </div>
                <div class="form-group full-width">
                  <label>销售总价 (元)</label>
                  <input v-model.number="editForm.price" type="number" class="input" />
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" @click="saveProperty">保存修改</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { getProperties, updatePropertyStatus, updateProperty, getPropertyDetail } from '../api'

export default {
  name: 'PropertyList',
  setup() {
    const properties = ref([])
    const filterStatus = ref('')
    const filterBuilding = ref('')
    const filterLayout = ref('')
    const showDetail = ref(false)
    const selectedProperty = ref(null)
    const intentions = ref([])
    const editForm = ref({})

    const buildings = computed(() => {
      const set = new Set(properties.value.map(p => p.building_no))
      return Array.from(set).sort()
    })

    const filteredProperties = computed(() => {
      return properties.value.filter(p => {
        if (filterStatus.value && p.status !== filterStatus.value) return false
        if (filterBuilding.value && p.building_no !== filterBuilding.value) return false
        if (filterLayout.value && p.layout_type !== filterLayout.value) return false
        return true
      })
    })

    const getStatusCount = (status) => {
      return properties.value.filter(p => p.status === status).length
    }

    const getStatusLabel = (status) => {
      const map = { 'available': '可售', 'reserved': '已锁定', 'sold': '已售出' }
      return map[status] || status
    }

    const getStatusBadge = (status) => {
      const map = {
        'available': 'badge-green',
        'reserved': 'badge-yellow',
        'sold': 'badge-gray'
      }
      return map[status] || 'badge-gray'
    }

    const getStatusClass = (status) => {
      return `status-${status}`
    }

    const getIntentionTypeLabel = (type) => {
      const map = { 'deposit': '认筹', 'subscription': '认购', 'signing': '签约' }
      return map[type] || type
    }

    const getIntentionTypeClass = (type) => {
      const map = {
        'deposit': 'type-deposit',
        'subscription': 'type-subscription',
        'signing': 'type-signing'
      }
      return map[type] || ''
    }

    const getApprovalLabel = (status) => {
      const map = { 'pending': '待审批', 'approved': '已通过', 'refunded': '已退款', 'rejected': '已拒绝' }
      return map[status] || status
    }

    const getApprovalBadge = (status) => {
      const map = {
        'pending': 'badge-yellow',
        'approved': 'badge-green',
        'refunded': 'badge-gray',
        'rejected': 'badge-red'
      }
      return map[status] || 'badge-gray'
    }

    const formatMoney = (amount) => {
      if (!amount) return '0'
      return (amount / 10000).toFixed(0) + '万'
    }

    const formatDateTime = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN')
    }

    const loadProperties = async () => {
      const res = await getProperties()
      properties.value = res.data
    }

    const openDetail = async (property) => {
      selectedProperty.value = { ...property }
      editForm.value = { ...property }
      showDetail.value = true
      
      try {
        const res = await getPropertyDetail(property.id)
        intentions.value = res.data.intentions
      } catch (e) {
        console.error('加载房源详情失败', e)
      }
    }

    const updateStatus = async (status) => {
      if (!selectedProperty.value) return
      try {
        await updatePropertyStatus(selectedProperty.value.id, { status })
        selectedProperty.value.status = status
        editForm.value.status = status
        const idx = properties.value.findIndex(p => p.id === selectedProperty.value.id)
        if (idx !== -1) {
          properties.value[idx].status = status
        }
        alert('状态更新成功！')
      } catch (e) {
        alert('更新状态失败: ' + e.message)
      }
    }

    const saveProperty = async () => {
      if (!selectedProperty.value) return
      try {
        await updateProperty(selectedProperty.value.id, editForm.value)
        Object.assign(selectedProperty.value, editForm.value)
        const idx = properties.value.findIndex(p => p.id === selectedProperty.value.id)
        if (idx !== -1) {
          Object.assign(properties.value[idx], editForm.value)
        }
        alert('保存成功！')
      } catch (e) {
        alert('保存失败: ' + e.message)
      }
    }

    onMounted(loadProperties)

    return {
      properties,
      filterStatus,
      filterBuilding,
      filterLayout,
      buildings,
      filteredProperties,
      showDetail,
      selectedProperty,
      intentions,
      editForm,
      getStatusCount,
      getStatusLabel,
      getStatusBadge,
      getStatusClass,
      getIntentionTypeLabel,
      getIntentionTypeClass,
      getApprovalLabel,
      getApprovalBadge,
      formatMoney,
      formatDateTime,
      openDetail,
      updateStatus,
      saveProperty
    }
  }
}
</script>

<style scoped>
.property-list { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 0; }
.filters { display: flex; gap: 12px; }
.select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
.stats-bar { display: flex; gap: 24px; background: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; color: #6b7280; }
.stat-value { font-size: 20px; font-weight: 700; color: #1f2937; }
.text-green { color: #16a34a; }
.text-yellow { color: #ca8a04; }
.text-gray { color: #6b7280; }
.property-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.property-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid transparent; transition: all 0.2s; cursor: pointer; }
.property-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.property-card.status-available { border-left-color: #22c55e; }
.property-card.status-reserved { border-left-color: #eab308; }
.property-card.status-sold { border-left-color: #9ca3af; opacity: 0.7; }
.property-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.property-title { font-weight: 600; color: #1f2937; font-size: 15px; }
.property-body { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.property-info { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 12px; color: #9ca3af; }
.info-value { font-size: 14px; color: #374151; font-weight: 500; }
.info-value.price { color: #dc2626; font-weight: 600; }
.property-footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
.click-hint { font-size: 12px; color: #3b82f6; }
.badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-yellow { background: #fef3c7; color: #b45309; }
.badge-gray { background: #f3f4f6; color: #4b5563; }
.badge-red { background: #fee2e2; color: #b91c1c; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: white; border-radius: 12px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-lg { max-width: 800px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #f3f4f6; position: sticky; top: 0; background: white; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
.modal-body { padding: 20px; }
.detail-content { display: flex; flex-direction: column; gap: 24px; }
.detail-section { display: flex; flex-direction: column; gap: 12px; }
.detail-section h4 { margin: 0; font-size: 16px; font-weight: 600; color: #1f2937; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
.detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 12px; color: #6b7280; }
.detail-value { font-size: 14px; color: #1f2937; font-weight: 500; }
.detail-value.price { color: #dc2626; font-size: 16px; }
.status-actions { display: flex; gap: 12px; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
.btn-default { background: #f3f4f6; color: #374151; }
.btn-default:hover { background: #e5e7eb; }
.btn-default:disabled { opacity: 0.5; cursor: not-allowed; }
.record-list { display: flex; flex-direction: column; gap: 12px; }
.record-item { background: #f9fafb; border-radius: 8px; padding: 16px; }
.record-header { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.record-type { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.type-deposit { background: #fef3c7; color: #b45309; }
.type-subscription { background: #fed7aa; color: #c2410c; }
.type-signing { background: #dcfce7; color: #15803d; }
.record-date { font-size: 12px; color: #6b7280; }
.record-body p { margin: 4px 0; font-size: 14px; color: #4b5563; }
.empty-state { text-align: center; padding: 30px; color: #9ca3af; font-size: 14px; }
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 14px; font-weight: 500; color: #374151; }
.input { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; }
.input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.form-actions { display: flex; justify-content: flex-end; padding-top: 8px; }
</style>
