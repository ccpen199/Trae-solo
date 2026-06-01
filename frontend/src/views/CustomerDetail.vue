<template>
  <div class="customer-detail">
    <div class="page-header">
      <div>
        <button class="btn-link" @click="$router.back()">← 返回</button>
        <h2 class="page-title">{{ customer?.name || '客户详情' }}</h2>
      </div>
      <div class="header-actions">
        <button class="btn btn-default" @click="showTransferModal = true">转派顾问</button>
        <button class="btn btn-default" @click="showEditModal = true">编辑资料</button>
      </div>
    </div>

    <div v-if="customer" class="info-card">
      <div class="info-row">
        <div class="info-item"><span class="info-label">手机号</span><span class="info-value">{{ customer.phone }}</span></div>
        <div class="info-item"><span class="info-label">身份证号</span><span class="info-value">{{ customer.id_card || '-' }}</span></div>
        <div class="info-item"><span class="info-label">来源渠道</span><span class="info-value">{{ customer.channel_name || '-' }}</span></div>
        <div class="info-item"><span class="info-label">置业顾问</span><span class="info-value">{{ customer.agent_name || '-' }}</span></div>
      </div>
      <div class="info-row">
        <div class="info-item"><span class="info-label">意向户型</span><span class="info-value">{{ customer.intended_layout || '-' }}</span></div>
        <div class="info-item"><span class="info-label">预算范围</span><span class="info-value">{{ formatBudget(customer.budget_min, customer.budget_max) }}</span></div>
        <div class="info-item"><span class="info-label">家庭结构</span><span class="info-value">{{ customer.family_structure || '-' }}</span></div>
        <div class="info-item"><span class="info-label">当前阶段</span><span :class="['badge', getStageBadge(customer.stage)]">{{ getStageLabel(customer.stage) }}</span></div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.value" :class="['tab', activeTab === t.value ? 'active' : '']" @click="activeTab = t.value">{{ t.label }}</button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'visits'" class="tab-panel">
      <div class="panel-header">
        <h3>来访/带看记录</h3>
        <button class="btn btn-primary btn-sm" @click="openVisitModal">+ 记录来访</button>
      </div>
      <div class="timeline">
        <div v-for="v in visits" :key="v.id" class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-type">{{ v.visit_type === 'visit' ? '来访' : '带看' }}</span>
              <span class="timeline-date">{{ formatDateTime(v.visit_date) }}</span>
            </div>
            <div class="timeline-body">
              <p v-if="v.route"><strong>接待人：</strong>{{ v.receiver_name || '-' }}</p>
              <p v-if="v.route"><strong>参观路线：</strong>{{ v.route }}</p>
              <p v-if="v.showrooms"><strong>样板间：</strong>{{ v.showrooms }}</p>
              <p v-if="v.feedback"><strong>客户反馈：</strong>{{ v.feedback }}</p>
              <p v-if="v.next_follow_date"><strong>下次跟进：</strong>{{ formatDate(v.next_follow_date) }} - {{ v.next_follow_content }}</p>
            </div>
          </div>
        </div>
        <div v-if="visits.length === 0" class="empty-state">暂无数记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'followups'" class="tab-panel">
      <div class="panel-header">
        <h3>跟进记录</h3>
        <button class="btn btn-primary btn-sm" @click="openFollowModal">+ 新增跟进</button>
      </div>
      <div class="record-list">
        <div v-for="f in followUps" :key="f.id" class="record-item">
          <div class="record-header">
            <span class="record-method">{{ f.method }}</span>
            <span class="record-date">{{ formatDateTime(f.follow_date) }}</span>
            <span class="record-agent">{{ f.agent_name || '-' }}</span>
          </div>
          <div class="record-body">
            <p><strong>跟进内容：</strong>{{ f.content }}</p>
            <p><strong>跟进结果：</strong>{{ f.result || '-' }}</p>
            <p v-if="f.next_follow_date"><strong>下次跟进：</strong>{{ formatDate(f.next_follow_date) }}</p>
          </div>
        </div>
        <div v-if="followUps.length === 0" class="empty-state">暂无跟进记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'intentions'" class="tab-panel">
      <div class="panel-header">
        <h3>认筹/认购/签约</h3>
        <button class="btn btn-primary btn-sm" @click="openIntentionModal">+ 新增记录</button>
      </div>
      <div class="record-list">
        <div v-for="i in intentions" :key="i.id" class="record-item">
          <div class="record-header">
            <span :class="['record-type', getIntentionTypeClass(i.type)]">{{ getIntentionTypeLabel(i.type) }}</span>
            <span class="record-date">{{ formatDateTime(i.created_at) }}</span>
            <span :class="['badge', getApprovalBadge(i.approval_status)]">{{ getApprovalLabel(i.approval_status) }}</span>
          </div>
          <div class="record-body">
            <p v-if="i.building_no"><strong>房源：</strong>{{ i.building_no }}号楼{{ i.unit_no }}单元{{ i.room_no }}室 ({{ i.layout_type }} {{ i.area }}㎡)</p>
            <p v-if="i.deposit_amount"><strong>定金：</strong>¥{{ formatMoney(i.deposit_amount) }}</p>
            <p v-if="i.discount_amount"><strong>优惠：</strong>¥{{ formatMoney(i.discount_amount) }}</p>
            <p v-if="i.payment_method"><strong>付款方式：</strong>{{ i.payment_method }}</p>
            <p v-if="i.approver_name"><strong>审批人：</strong>{{ i.approver_name }}</p>
            <p v-if="i.remarks"><strong>备注：</strong>{{ i.remarks }}</p>
            <div class="record-actions" v-if="i.approval_status === 'pending'">
              <button class="btn-link" @click="handleApproveIntention(i.id)">审批通过</button>
              <button class="btn-link text-red" @click="handleRefundIntention(i.id)">申请退款</button>
            </div>
          </div>
        </div>
        <div v-if="intentions.length === 0" class="empty-state">暂无交易记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'churns'" class="tab-panel">
      <div class="panel-header">
        <h3>流失/复访记录</h3>
        <div class="action-group">
          <button class="btn btn-default btn-sm" @click="openRevisitModal">+ 复访登记</button>
          <button class="btn btn-danger btn-sm" @click="openChurnModal">+ 流失登记</button>
        </div>
      </div>
      <div class="record-list">
        <div v-for="c in churns" :key="c.id" class="record-item">
          <div class="record-header">
            <span class="record-type type-churn">流失</span>
            <span class="record-date">{{ formatDateTime(c.churn_date) }}</span>
          </div>
          <div class="record-body">
            <p v-if="c.reason"><strong>流失原因：</strong>{{ c.reason }}</p>
            <p v-if="c.competitor"><strong>竞品项目：</strong>{{ c.competitor }}</p>
            <p v-if="c.price_sensitivity"><strong>价格敏感点：</strong>{{ c.price_sensitivity }}</p>
            <p v-if="c.recontact_plan"><strong>再触达计划：</strong>{{ c.recontact_plan }}</p>
            <p v-if="c.recontact_date"><strong>再触达时间：</strong>{{ formatDate(c.recontact_date) }}</p>
            <p v-if="c.remarks"><strong>备注：</strong>{{ c.remarks }}</p>
          </div>
        </div>
        <div v-for="r in revisits" :key="r.id" class="record-item">
          <div class="record-header">
            <span class="record-type type-revisit">复访</span>
            <span class="record-date">{{ formatDateTime(r.revisit_date) }}</span>
          </div>
          <div class="record-body">
            <p v-if="r.purpose"><strong>复访目的：</strong>{{ r.purpose }}</p>
            <p v-if="r.feedback"><strong>反馈：</strong>{{ r.feedback }}</p>
            <p v-if="r.next_follow_date"><strong>下次跟进：</strong>{{ formatDate(r.next_follow_date) }}</p>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div v-if="showVisitModal" class="modal-overlay" @click.self="showVisitModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>记录来访/带看</h3>
          <button class="modal-close" @click="showVisitModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>类型</label>
            <select v-model="visitForm.visit_type" class="select">
              <option value="visit">来访</option>
              <option value="showing">带看</option>
            </select>
          </div>
          <div class="form-group">
            <label>接待人</label>
            <select v-model="visitForm.receiver_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>参观路线</label>
            <input v-model="visitForm.route" type="text" class="input" placeholder="例如：沙盘 → 样板间 → 洽谈区" />
          </div>
          <div class="form-group">
            <label>参观样板间</label>
            <input v-model="visitForm.showrooms" type="text" class="input" placeholder="例如：A户型、B户型" />
          </div>
          <div class="form-group">
            <label>客户反馈</label>
            <textarea v-model="visitForm.feedback" class="textarea" rows="3"></textarea>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>下次跟进日期</label>
              <input v-model="visitForm.next_follow_date" type="date" class="input" />
            </div>
            <div class="form-group">
              <label>下次跟进内容</label>
              <input v-model="visitForm.next_follow_content" type="text" class="input" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showVisitModal = false">取消</button>
          <button class="btn btn-primary" @click="submitVisit">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showFollowModal" class="modal-overlay" @click.self="showFollowModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新增跟进记录</h3>
          <button class="modal-close" @click="showFollowModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>跟进方式</label>
            <select v-model="followForm.method" class="select">
              <option value="电话">电话</option>
              <option value="微信">微信</option>
              <option value="短信">短信</option>
              <option value="面谈">面谈</option>
            </select>
          </div>
          <div class="form-group">
            <label>跟进人</label>
            <select v-model="followForm.agent_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="u in users.filter(u => u.role === 'agent')" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>跟进内容</label>
            <textarea v-model="followForm.content" class="textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>跟进结果</label>
            <textarea v-model="followForm.result" class="textarea" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>下次跟进日期</label>
            <input v-model="followForm.next_follow_date" type="date" class="input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showFollowModal = false">取消</button>
          <button class="btn btn-primary" @click="submitFollow">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showIntentionModal" class="modal-overlay" @click.self="showIntentionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>认筹/认购/签约</h3>
          <button class="modal-close" @click="showIntentionModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>类型</label>
            <select v-model="intentionForm.type" class="select">
              <option value="deposit">认筹</option>
              <option value="subscription">认购</option>
              <option value="signing">签约</option>
            </select>
          </div>
          <div class="form-group">
            <label>选择房源</label>
            <select v-model="intentionForm.property_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="p in availableProperties" :key="p.id" :value="p.id">
                {{ p.building_no }}号楼{{ p.unit_no }}单元{{ p.room_no }}室 - {{ p.layout_type }} {{ p.area }}㎡ - ¥{{ formatMoney(p.price) }}
              </option>
            </select>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>定金金额 (元)</label>
              <input v-model.number="intentionForm.deposit_amount" type="number" class="input" />
            </div>
            <div class="form-group">
              <label>优惠金额 (元)</label>
              <input v-model.number="intentionForm.discount_amount" type="number" class="input" />
            </div>
          </div>
          <div class="form-group">
            <label>付款方式</label>
            <select v-model="intentionForm.payment_method" class="select">
              <option value="一次性付款">一次性付款</option>
              <option value="商业贷款">商业贷款</option>
              <option value="公积金贷款">公积金贷款</option>
              <option value="组合贷款">组合贷款</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="intentionForm.remarks" class="textarea" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showIntentionModal = false">取消</button>
          <button class="btn btn-primary" @click="submitIntention">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showChurnModal" class="modal-overlay" @click.self="showChurnModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>流失登记</h3>
          <button class="modal-close" @click="showChurnModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>流失原因</label>
            <select v-model="churnForm.reason" class="select">
              <option value="价格过高">价格过高</option>
              <option value="位置不满意">位置不满意</option>
              <option value="户型不满意">户型不满意</option>
              <option value="选择竞品">选择竞品</option>
              <option value="资金问题">资金问题</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>竞品项目</label>
            <input v-model="churnForm.competitor" type="text" class="input" />
          </div>
          <div class="form-group">
            <label>价格敏感点</label>
            <textarea v-model="churnForm.price_sensitivity" class="textarea" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>再触达计划</label>
            <textarea v-model="churnForm.recontact_plan" class="textarea" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>再触达时间</label>
            <input v-model="churnForm.recontact_date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="churnForm.remarks" class="textarea" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showChurnModal = false">取消</button>
          <button class="btn btn-primary" @click="submitChurn">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showRevisitModal" class="modal-overlay" @click.self="showRevisitModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>复访登记</h3>
          <button class="modal-close" @click="showRevisitModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>接待人</label>
            <select v-model="revisitForm.receiver_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>复访目的</label>
            <input v-model="revisitForm.purpose" type="text" class="input" />
          </div>
          <div class="form-group">
            <label>反馈</label>
            <textarea v-model="revisitForm.feedback" class="textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>下次跟进日期</label>
            <input v-model="revisitForm.next_follow_date" type="date" class="input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showRevisitModal = false">取消</button>
          <button class="btn btn-primary" @click="submitRevisit">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>转派置业顾问</h3>
          <button class="modal-close" @click="showTransferModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>转派给</label>
            <select v-model="transferForm.to_agent_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="u in users.filter(u => u.role === 'agent')" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>转派原因</label>
            <input v-model="transferForm.reason" type="text" class="input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showTransferModal = false">取消</button>
          <button class="btn btn-primary" @click="submitTransfer">确认转派</button>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>编辑客户资料</h3>
          <button class="modal-close" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
            <label>客户姓名</label>
            <input v-model="editForm.name" type="text" class="input" />
          </div>
            <div class="form-group">
            <label>手机号</label>
            <input v-model="editForm.phone" type="text" class="input" />
          </div>
            <div class="form-group">
            <label>身份证号</label>
            <input v-model="editForm.id_card" type="text" class="input" />
          </div>
            <div class="form-group">
            <label>来源渠道</label>
            <select v-model="editForm.channel_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.name }}</option>
            </select>
          </div>
            <div class="form-group">
            <label>意向户型</label>
            <select v-model="editForm.intended_layout" class="select">
              <option value="">请选择</option>
              <option value="两室一厅">两室一厅</option>
              <option value="三室两厅">三室两厅</option>
              <option value="四室两厅">四室两厅</option>
            </select>
          </div>
            <div class="form-group">
            <label>置业顾问</label>
            <select v-model="editForm.agent_id" class="select">
              <option :value="null">请选择</option>
              <option v-for="u in users.filter(u => u.role === 'agent')" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="submitEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCustomerDetail,
  getUsers,
  getChannels,
  getProperties,
  createVisit,
  createFollowUp,
  createIntention,
  approveIntention,
  refundIntention,
  createChurn,
  createRevisit,
  transferCustomer,
  updateCustomer
} from '../api'

export default {
  name: 'CustomerDetail',
  setup() {
    const route = useRoute()
    const customer = ref(null)
    const visits = ref([])
    const followUps = ref([])
    const intentions = ref([])
    const churns = ref([])
    const revisits = ref([])
    const users = ref([])
    const channels = ref([])
    const properties = ref([])
    const activeTab = ref('visits')

    const showVisitModal = ref(false)
    const showFollowModal = ref(false)
    const showIntentionModal = ref(false)
    const showChurnModal = ref(false)
    const showRevisitModal = ref(false)
    const showTransferModal = ref(false)
    const showEditModal = ref(false)

    const visitForm = ref({})
    const followForm = ref({})
    const intentionForm = ref({})
    const churnForm = ref({})
    const revisitForm = ref({})
    const transferForm = ref({})
    const editForm = ref({})

    const tabs = [
      { value: 'visits', label: '来访带看' },
      { value: 'followups', label: '跟进记录' },
      { value: 'intentions', label: '认筹签约' },
      { value: 'churns', label: '流失复访' }
    ]

    const stages = [
      { value: 'lead', label: '新线索' },
      { value: 'visited', label: '已到访' },
      { value: 'deposit', label: '已认筹' },
      { value: 'subscription', label: '已认购' },
      { value: 'signed', label: '已签约' },
      { value: 'churned', label: '已流失' }
    ]

    const availableProperties = computed(() => {
      return properties.value.filter(p => p.status === 'available')
    })

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

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('zh-CN')
    }

    const formatDateTime = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleString('zh-CN')
    }

    const formatBudget = (min, max) => {
      if (!min && !max) return '-'
      const m = (v) => v ? (v / 10000).toFixed(0) + '万' : ''
      return `${m(min)} - ${m(max)}`
    }

    const formatMoney = (amount) => {
      if (!amount) return '0'
      return amount.toLocaleString('zh-CN')
    }

    const loadData = async () => {
      const res = await getCustomerDetail(route.params.id)
      customer.value = res.data.customer
      visits.value = res.data.visits
      followUps.value = res.data.followUps
      intentions.value = res.data.intentions
      churns.value = res.data.churns
      revisits.value = res.data.revisits
    }

    const resetForms = () => {
      visitForm.value = { visit_type: 'visit', receiver_id: null, route: '', showrooms: '', feedback: '', next_follow_date: '', next_follow_content: '' }
      followForm.value = { method: '电话', agent_id: null, content: '', result: '', next_follow_date: '' }
      intentionForm.value = { type: 'deposit', property_id: null, deposit_amount: 0, discount_amount: 0, payment_method: '', remarks: '' }
      churnForm.value = { reason: '', competitor: '', price_sensitivity: '', recontact_plan: '', recontact_date: '', remarks: '' }
      revisitForm.value = { receiver_id: null, purpose: '', feedback: '', next_follow_date: '' }
      transferForm.value = { to_agent_id: null, reason: '' }
    }

    const openVisitModal = () => { resetForms(); showVisitModal.value = true }
    const openFollowModal = () => { resetForms(); showFollowModal.value = true }
    const openIntentionModal = () => { resetForms(); showIntentionModal.value = true }
    const openChurnModal = () => { resetForms(); showChurnModal.value = true }
    const openRevisitModal = () => { resetForms(); showRevisitModal.value = true }

    const submitVisit = async () => {
      try {
        const data = {
          customer_id: route.params.id,
          visit_type: visitForm.value.visit_type,
          receiver_id: visitForm.value.receiver_id || null,
          route: visitForm.value.route || '',
          showrooms: visitForm.value.showrooms || '',
          feedback: visitForm.value.feedback || '',
          next_follow_date: visitForm.value.next_follow_date || null,
          next_follow_content: visitForm.value.next_follow_content || ''
        }
        await createVisit(data)
        showVisitModal.value = false
        alert('来访记录保存成功！')
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        alert('保存失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitFollow = async () => {
      try {
        await createFollowUp({ customer_id: route.params.id, ...followForm.value })
        showFollowModal.value = false
        alert('跟进记录保存成功！')
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        alert('保存失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitIntention = async () => {
      try {
        await createIntention({ customer_id: route.params.id, ...intentionForm.value })
        showIntentionModal.value = false
        alert('交易记录保存成功！')
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        alert('保存失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitChurn = async () => {
      try {
        await createChurn({ customer_id: route.params.id, ...churnForm.value })
        showChurnModal.value = false
        alert('流失登记成功！')
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        alert('保存失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitRevisit = async () => {
      try {
        await createRevisit({ customer_id: route.params.id, ...revisitForm.value })
        showRevisitModal.value = false
        alert('复访登记成功！')
        loadData()
      } catch (e) {
        console.error('保存失败:', e)
        alert('保存失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const handleApproveIntention = async (id) => {
      if (!confirm('确认审批通过？')) return
      try {
        await approveIntention(id, { approver_id: 1, status: 'approved' })
        alert('审批成功！')
        loadData()
      } catch (e) {
        console.error('审批失败:', e)
        alert('审批失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const handleRefundIntention = async (id) => {
      if (!confirm('确认申请退款？')) return
      try {
        await refundIntention(id, { reason: '客户申请', operator_id: 1 })
        alert('退款申请已提交！')
        loadData()
      } catch (e) {
        console.error('申请失败:', e)
        alert('申请失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitTransfer = async () => {
      try {
        await transferCustomer(route.params.id, { ...transferForm.value, operator_id: 1 })
        showTransferModal.value = false
        alert('转派成功！')
        loadData()
      } catch (e) {
        console.error('转派失败:', e)
        alert('转派失败: ' + (e.response?.data?.error || e.message))
      }
    }

    const submitEdit = async () => {
      try {
        await updateCustomer(route.params.id, editForm.value)
        showEditModal.value = false
        alert('客户资料更新成功！')
        loadData()
      } catch (e) {
        console.error('更新失败:', e)
        alert('更新失败: ' + (e.response?.data?.error || e.message))
      }
    }

    onMounted(async () => {
      await loadData()
      users.value = (await getUsers()).data
      channels.value = (await getChannels()).data
      properties.value = (await getProperties()).data
      if (customer.value) {
        editForm.value = { ...customer.value }
      }
    })

    return {
      customer,
      visits,
      followUps,
      intentions,
      churns,
      revisits,
      users,
      channels,
      properties,
      availableProperties,
      activeTab,
      tabs,
      showVisitModal,
      showFollowModal,
      showIntentionModal,
      showChurnModal,
      showRevisitModal,
      showTransferModal,
      showEditModal,
      visitForm,
      followForm,
      intentionForm,
      churnForm,
      revisitForm,
      transferForm,
      editForm,
      getStageLabel,
      getStageBadge,
      getIntentionTypeLabel,
      getIntentionTypeClass,
      getApprovalLabel,
      getApprovalBadge,
      formatDate,
      formatDateTime,
      formatBudget,
      formatMoney,
      openVisitModal,
      openFollowModal,
      openIntentionModal,
      openChurnModal,
      openRevisitModal,
      submitVisit,
      submitFollow,
      submitIntention,
      submitChurn,
      submitRevisit,
      handleApproveIntention,
      handleRefundIntention,
      submitTransfer,
      submitEdit
    }
  }
}
</script>

<style scoped>
.customer-detail { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 8px 0 0 0; }
.header-actions { display: flex; gap: 12px; }
.info-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.info-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 12px; color: #6b7280; }
.info-value { font-size: 14px; color: #1f2937; font-weight: 500; }
.tabs { display: flex; gap: 4px; background: white; padding: 8px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.tab { flex: 1; padding: 10px 16px; border: none; background: transparent; border-radius: 8px; font-size: 14px; color: #6b7280; cursor: pointer; }
.tab.active { background: #3b82f6; color: white; }
.tab-content { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.tab-panel { padding: 20px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
.action-group { display: flex; gap: 8px; }
.timeline { position: relative; padding-left: 24px; }
.timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: #e5e7eb; }
.timeline-item { position: relative; padding-bottom: 20px; }
.timeline-dot { position: absolute; left: -21px; top: 4px; width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #dbeafe; }
.timeline-content { background: #f9fafb; border-radius: 8px; padding: 12px 16px; }
.timeline-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.timeline-type { font-weight: 600; color: #1f2937; }
.timeline-date { font-size: 12px; color: #6b7280; }
.timeline-body p { margin: 4px 0; font-size: 14px; color: #4b5563; }
.record-list { display: flex; flex-direction: column; gap: 12px; }
.record-item { background: #f9fafb; border-radius: 8px; padding: 16px; }
.record-header { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.record-type { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.type-deposit { background: #fef3c7; color: #b45309; }
.type-subscription { background: #fed7aa; color: #c2410c; }
.type-signing { background: #dcfce7; color: #15803d; }
.type-churn { background: #fee2e2; color: #b91c1c; }
.type-revisit { background: #dbeafe; color: #1d4ed8; }
.record-date { font-size: 12px; color: #6b7280; }
.record-agent { margin-left: auto; font-size: 12px; color: #6b7280; }
.record-body p { margin: 4px 0; font-size: 14px; color: #4b5563; }
.record-actions { margin-top: 12px; display: flex; gap: 16px; }
.empty-state { text-align: center; padding: 40px; color: #9ca3af; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.text-red { color: #ef4444 !important; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
.modal-sm { max-width: 400px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #f3f4f6; }
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
.modal-body { padding: 20px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 1px solid #f3f4f6; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input, .select { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; background: white; box-sizing: border-box; }
.input:focus, .select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.textarea { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; box-sizing: border-box; }
.btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-default { background: #f3f4f6; color: #374151; }
.btn-default:hover { background: #e5e7eb; }
.btn-link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 14px; }
.btn-link:hover { text-decoration: underline; }
.badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.badge-gray { background: #f3f4f6; color: #4b5563; }
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-yellow { background: #fef3c7; color: #b45309; }
.badge-orange { background: #fed7aa; color: #c2410c; }
.badge-green { background: #dcfce7; color: #15803d; }
.badge-red { background: #fee2e2; color: #b91c1c; }
</style>
