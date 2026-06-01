<template>
  <div>
    <div class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>签到记录</h2>
          <span>{{ data?.length || 0 }} 条</span>
        </div>
        <div class="table-wrap">
          <table v-if="data && data.length">
            <thead>
              <tr>
                <th>日期</th>
                <th>时间</th>
                <th>班级</th>
                <th>学员</th>
                <th>签到时间</th>
                <th>课时</th>
                <th>课消金额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in data.slice(0, 50)" :key="a.id">
                <td>{{ a.course_date }}</td>
                <td>{{ a.start_time }}-{{ a.end_time }}</td>
                <td>{{ a.class_name }}</td>
                <td><strong>{{ a.student_name }}</strong></td>
                <td>{{ a.checkin_time || '-' }}</td>
                <td>{{ a.consume_hours?.toFixed(1) || 0 }}</td>
                <td><span :class="{ amount: a.status === 'normal' || a.status === 'absent' }">{{ shouldShowConsumeAmount(a.status) ? currency(a.consume_amount || 0) : '-' }}</span></td>
                <td><span :class="['badge', statusClass(a.status)]">{{ statusText(a.status) }}</span></td>
                <td>
                  <template v-if="a.status === 'reserved'">
                    <button class="btn-link" @click="showCheckinModal(a)">签到</button>
                  </template>
                  <template v-else>
                    <span class="muted">-</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无签到记录</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>待签到课程</h2>
          <span class="badge pending">{{ pendingCount }}</span>
        </div>
        <div class="stack" v-if="pendingList.length">
          <div class="row" v-for="a in pendingList.slice(0, 15)" :key="a.id">
            <div>
              <strong>{{ a.student_name }}</strong>
              <small>{{ a.course_date }} {{ a.start_time }}-{{ a.end_time }} | {{ a.class_name }}</small>
            </div>
            <button class="btn-link" @click="showCheckinModal(a)">签到</button>
          </div>
        </div>
        <div v-else class="empty">暂无待签到</div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal checkin-modal">
        <div class="modal-head">
          <h3>学员签到</h3>
          <button class="btn-close" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert-error">
            {{ errorMessage }}
          </div>

          <div class="info-section">
            <div class="info-title">学员信息</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">学员姓名：</span>
                <strong>{{ selectedAttendance?.student_name }}</strong>
              </div>
              <div class="info-row">
                <span class="label">联系电话：</span>
                <span>{{ studentInfo?.parent_phone || studentInfo?.phone || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">课程班级：</span>
                <span>{{ selectedAttendance?.class_name }}</span>
              </div>
              <div class="info-row">
                <span class="label">课程时间：</span>
                <span>{{ selectedAttendance?.course_date }} {{ selectedAttendance?.start_time }}-{{ selectedAttendance?.end_time }}</span>
              </div>
            </div>
          </div>

          <div class="info-section" v-if="studentPurchase">
            <div class="info-title">课包信息</div>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">课包名称：</span>
                <span>{{ studentPurchase.package_name || '自定义课包' }}</span>
              </div>
              <div class="info-row">
                <span class="label">课包单价：</span>
                <span>{{ currency(studentPurchase.unit_price || 0) }}/课时</span>
              </div>
            </div>
          </div>

          <div class="balance-section">
            <div class="info-title">课包余额</div>
            <div class="balance-grid">
              <div class="balance-item">
                <div class="balance-label">当前剩余课时</div>
                <div class="balance-value hours">{{ currentBalance?.toFixed(1) || 0 }}</div>
              </div>
              <div class="balance-item">
                <div class="balance-label">本次应扣课时</div>
                <div class="balance-value">{{ consumeHours?.toFixed(1) || 0 }}</div>
              </div>
              <div class="balance-item">
                <div class="balance-label">签到后预计剩余</div>
                <div class="balance-value estimated">{{ estimatedBalance?.toFixed(1) || 0 }}</div>
              </div>
            </div>
          </div>

          <div class="rule-section">
            <div class="info-title">课消规则</div>
            <div class="rule-card" :class="checkinForm.status">
              <div class="rule-status">{{ statusText(checkinForm.status) }}</div>
              <div class="rule-detail">{{ currentRuleDescription }}</div>
            </div>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label>签到状态 *</label>
            <select v-model="checkinForm.status">
              <option value="normal">正常出勤</option>
              <option value="leave">请假（不扣课时）</option>
              <option value="absent">旷课</option>
              <option value="makeup">补课（不扣课时）</option>
              <option value="trial">试听（不扣课时）</option>
            </select>
          </div>
          <div class="form-group">
            <label>签到时间</label>
            <input v-model="checkinForm.checkin_time" type="datetime-local" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="checkinForm.remark" placeholder="签到备注" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="submitCheckin" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认签到' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResultModal" class="modal-overlay" @click.self="showResultModal = false">
      <div class="modal result-modal">
        <div class="modal-head">
          <h3>签到结果</h3>
          <button class="btn-close" @click="showResultModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="result-success">
            <div class="success-icon">✓</div>
            <div class="success-text">签到成功</div>
          </div>

          <div class="result-section">
            <div class="section-title">签到信息</div>
            <div class="result-grid">
              <div class="result-row">
                <span class="result-label">学员姓名：</span>
                <span class="result-value">{{ checkinResult.student_name }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">课程班级：</span>
                <span class="result-value">{{ checkinResult.class_name }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">签到状态：</span>
                <span :class="['badge', statusClass(checkinResult.status)]">{{ statusText(checkinResult.status) }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">课包名称：</span>
                <span class="result-value">{{ checkinResult.package_name || '自定义' }}</span>
              </div>
            </div>
          </div>

          <div class="result-section">
            <div class="section-title">课包余额链路</div>
            <div class="balance-chain">
              <div class="chain-node">
                <div class="chain-value">{{ checkinResult.balanceBefore?.toFixed(1) || 0 }}</div>
                <div class="chain-label">扣课前余额</div>
              </div>
              <div class="chain-operator">−</div>
              <div class="chain-node highlight">
                <div class="chain-value hours">{{ checkinResult.consumedHours?.toFixed(1) || 0 }}</div>
                <div class="chain-label">本次消耗</div>
              </div>
              <div class="chain-operator">=</div>
              <div class="chain-node result">
                <div class="chain-value hours">{{ checkinResult.balanceAfter?.toFixed(1) || 0 }}</div>
                <div class="chain-label">扣课后余额</div>
              </div>
            </div>
            <div class="formula-check">
              <span class="formula">{{ checkinResult.balanceBefore?.toFixed(1) || 0 }} - {{ checkinResult.consumedHours?.toFixed(1) || 0 }} = {{ checkinResult.balanceAfter?.toFixed(1) || 0 }}</span>
              <span class="check valid">✓ 平衡</span>
            </div>
          </div>

          <div class="result-section">
            <div class="section-title">经营数据影响</div>
            <div class="result-grid">
              <div class="result-row">
                <span class="result-label">本次课消金额：</span>
                <span class="result-value amount">{{ currency(checkinResult.consumedAmount || 0) }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">课包剩余价值：</span>
                <span class="result-value amount">{{ currency(checkinResult.remainingValue || 0) }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">累计负债变化：</span>
                <span class="result-value">- {{ currency(checkinResult.consumedAmount || 0) }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">课包单价：</span>
                <span class="result-value">{{ currency(checkinResult.unit_price || 0) }}/课时</span>
              </div>
            </div>
          </div>

          <div class="audit-section">
            <div class="audit-title">📊 可复查入口</div>
            <div class="audit-list">
              <div class="audit-item">
                <span class="audit-icon">📝</span>
                <span>学员管理 → 查看学员完整课包消耗记录</span>
              </div>
              <div class="audit-item">
                <span class="audit-icon">💰</span>
                <span>财务管理 → 课消记录中可核对本笔记录</span>
              </div>
              <div class="audit-item">
                <span class="audit-icon">📈</span>
                <span>经营报表 → 课消金额和负债将实时更新</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="showResultModal = false">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

const props = defineProps({
  data: { type: Array, default: () => [] },
  schedules: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  purchases: { type: Array, default: () => [] },
  currency: { type: Function, default: (val) => '¥' + (val || 0) },
  onCheckin: { type: Function, required: true }
});

const showModal = ref(false);
const showResultModal = ref(false);
const selectedAttendance = ref(null);
const submitting = ref(false);
const errorMessage = ref('');

const checkinForm = reactive({
  status: 'normal',
  checkin_time: '',
  remark: ''
});

const checkinResult = reactive({
  student_name: '',
  class_name: '',
  package_name: '',
  status: '',
  consumedHours: 0,
  consumedAmount: 0,
  balanceBefore: 0,
  balanceAfter: 0,
  remainingValue: 0,
  unit_price: 0
});

const pendingList = computed(() => {
  return (props.data || []).filter(a => a.status === 'reserved').sort((a, b) => {
    const dateA = a.course_date + a.start_time;
    const dateB = b.course_date + b.start_time;
    return dateA.localeCompare(dateB);
  });
});

const pendingCount = computed(() => pendingList.value.length);

const studentInfo = computed(() => {
  if (!selectedAttendance.value) return null;
  return (props.students || []).find(s => s.id === selectedAttendance.value.student_id);
});

const studentPurchase = computed(() => {
  if (!selectedAttendance.value) return null;
  return (props.purchases || []).find(p => p.id === selectedAttendance.value.purchase_id);
});

const currentBalance = computed(() => {
  return studentPurchase.value?.remaining_hours || 0;
});

const consumeHours = computed(() => {
  const status = checkinForm.status;
  if (['leave', 'trial', 'makeup'].includes(status)) {
    return 0;
  }
  return selectedAttendance.value?.consume_hours || 0;
});

const estimatedBalance = computed(() => {
  return Math.max(0, (currentBalance.value || 0) - (consumeHours.value || 0));
});

const consumeAmount = computed(() => {
  const status = checkinForm.status;
  if (['leave', 'trial', 'makeup'].includes(status)) {
    return 0;
  }
  const hours = selectedAttendance.value?.consume_hours || 0;
  const unitPrice = studentPurchase.value?.unit_price || 0;
  return hours * unitPrice;
});

const currentRuleDescription = computed(() => {
  const status = checkinForm.status;
  const hours = selectedAttendance.value?.consume_hours?.toFixed(1) || 0;
  const amount = consumeAmount.value;

  switch (status) {
    case 'normal':
      return `扣${hours}课时，课消金额${props.currency(amount)}`;
    case 'leave':
      return '不扣课时，课消金额¥0';
    case 'absent':
      return `扣${hours}课时，课消金额${props.currency(amount)}`;
    case 'makeup':
      return '不扣课时，课消金额¥0';
    case 'trial':
      return '不扣课时，课消金额¥0';
    default:
      return '';
  }
});

function statusText(status) {
  const map = {
    reserved: '待签到',
    normal: '已出勤',
    leave: '已请假',
    absent: '已旷课',
    makeup: '已补课',
    trial: '已试听'
  };
  return map[status] || status;
}

function statusClass(status) {
  const map = {
    reserved: 'pending',
    normal: 'active',
    leave: 'pending',
    absent: 'absent',
    makeup: 'active',
    trial: 'active'
  };
  return map[status] || '';
}

function shouldShowConsumeAmount(status) {
  return status === 'normal' || status === 'absent';
}

function showCheckinModal(attendance) {
  selectedAttendance.value = attendance;
  checkinForm.status = 'normal';
  checkinForm.checkin_time = new Date().toISOString().slice(0, 16);
  checkinForm.remark = '';
  errorMessage.value = '';
  showModal.value = true;
}

async function submitCheckin() {
  if (!selectedAttendance.value) return;
  
  errorMessage.value = '';
  submitting.value = true;
  
  try {
    const balanceBefore = currentBalance.value;
    
    const result = await props.onCheckin({
      id: selectedAttendance.value.id,
      ...checkinForm
    });
    
    const consumed = result?.hours !== undefined ? result.hours : consumeHours.value;
    const consumedAmount = result?.amount !== undefined ? result.amount : consumeAmount.value;
    const balanceAfter = result?.balanceAfter !== undefined 
      ? result.balanceAfter 
      : Math.max(0, balanceBefore - consumed);
    const unitPrice = result?.unitPrice !== undefined ? result.unitPrice : (studentPurchase.value?.unit_price || 0);
    const remainingValue = balanceAfter * unitPrice;
    
    Object.assign(checkinResult, {
      student_name: selectedAttendance.value.student_name,
      class_name: selectedAttendance.value.class_name,
      package_name: studentPurchase.value?.package_name || '自定义课包',
      status: checkinForm.status,
      consumedHours: consumed,
      consumedAmount: consumedAmount,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      remainingValue: remainingValue,
      unit_price: unitPrice
    });
    
    showModal.value = false;
    showResultModal.value = true;
  } catch (e) {
    errorMessage.value = e.message || '签到失败';
  } finally {
    submitting.value = false;
  }
}

watch(() => checkinForm.status, () => {
  errorMessage.value = '';
});
</script>

<style scoped>
.btn-link {
  background: none;
  border: none;
  color: #1677ff;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 600;
}
.btn-link:hover { text-decoration: underline; }
.muted { color: #a9b6c3; }
.amount { color: #d46b08; font-weight: 600; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1000;
}
.modal {
  background: white;
  border-radius: 10px;
  width: 520px;
  max-width: 90vw;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.checkin-modal {
  width: 560px;
}
.result-modal {
  width: 480px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #edf1f5;
  flex-shrink: 0;
}
.modal-head h3 { margin: 0; font-size: 18px; }
.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #687789;
  padding: 0 8px;
  line-height: 1;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #edf1f5;
  background: #fafbfc;
  flex-shrink: 0;
}
.btn-secondary {
  padding: 10px 16px;
  background: #f0f2f5;
  color: #17212b;
  border: 1px solid #dce3ea;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary {
  padding: 10px 16px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.info-row {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  align-items: center;
}
.info-row .label {
  color: #687789;
  min-width: 90px;
  flex-shrink: 0;
}
.form-group {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}
.form-group label {
  font-size: 13px;
  color: #657789;
  font-weight: 600;
}
.form-group input,
.form-group select,
.form-group textarea {
  padding: 9px 12px;
  border: 1px solid #dce3ea;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1677ff;
}
.hours {
  color: #1677ff;
  font-weight: 800;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.info-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf1f5;
}
.info-section:last-of-type {
  border-bottom: none;
}
.info-title {
  font-size: 14px;
  font-weight: 700;
  color: #17212b;
  margin-bottom: 8px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.balance-section {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.balance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.balance-item {
  text-align: center;
}
.balance-label {
  font-size: 12px;
  color: #687789;
  margin-bottom: 4px;
}
.balance-value {
  font-size: 20px;
  font-weight: 700;
  color: #17212b;
}
.balance-value.hours {
  color: #1677ff;
}
.balance-value.estimated {
  color: #0f7f5a;
}

.rule-section {
  margin-bottom: 16px;
}
.rule-card {
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #dce3ea;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}
.rule-card.normal {
  background: #f0f7ff;
  border-color: #91caff;
}
.rule-card.leave {
  background: #fff7e6;
  border-color: #ffd591;
}
.rule-card.absent {
  background: #fff2f0;
  border-color: #ffccc7;
}
.rule-card.makeup {
  background: #f6ffed;
  border-color: #b7eb8f;
}
.rule-card.trial {
  background: #f9f0ff;
  border-color: #d3adf7;
}
.rule-status {
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  background: white;
  flex-shrink: 0;
}
.rule-card.normal .rule-status { color: #1677ff; }
.rule-card.leave .rule-status { color: #d46b08; }
.rule-card.absent .rule-status { color: #cf1322; }
.rule-card.makeup .rule-status { color: #389e0d; }
.rule-card.trial .rule-status { color: #722ed1; }
.rule-detail {
  font-size: 14px;
  color: #17212b;
}

.result-success {
  text-align: center;
  padding: 24px 0 16px;
}
.success-icon {
  width: 64px;
  height: 64px;
  line-height: 64px;
  border-radius: 50%;
  background: #0f7f5a;
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0 auto 12px;
}
.success-text {
  font-size: 18px;
  font-weight: 700;
  color: #0f7f5a;
}
.result-section {
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.result-label {
  color: #687789;
  font-size: 14px;
}
.result-value {
  font-weight: 600;
  color: #17212b;
}
.result-value.hours {
  color: #1677ff;
  font-size: 16px;
}
.result-value.amount {
  color: #d46b08;
  font-size: 16px;
}
.divider {
  height: 1px;
  background: #e8ecef;
  margin: 8px 0;
}
.result-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  font-size: 13px;
  color: #0050b3;
}
.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.badge.pending {
  background: #fff7e6;
  color: #d46b08;
}
.badge.active {
  background: #f0f7ff;
  color: #1677ff;
}
.badge.absent {
  background: #fff2f0;
  color: #cf1322;
}

.result-modal {
  width: 520px;
}
.section-title {
  font-size: 13px;
  font-weight: 700;
  color: #17212b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8edf2;
}
.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}

.balance-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 16px 0;
}
.chain-node {
  background: white;
  border: 1px solid #dce3ea;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  min-width: 90px;
}
.chain-node.highlight {
  background: #f0f7ff;
  border-color: #91caff;
}
.chain-node.result {
  background: #f6ffed;
  border-color: #b7eb8f;
}
.chain-value {
  font-size: 18px;
  font-weight: 700;
  color: #17212b;
}
.chain-value.hours {
  color: #1677ff;
}
.chain-label {
  font-size: 11px;
  color: #687789;
  margin-top: 4px;
}
.chain-operator {
  font-size: 16px;
  font-weight: 700;
  color: #687789;
}
.formula-check {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
}
.formula {
  color: #687789;
  font-family: monospace;
}
.check {
  font-weight: 700;
}
.check.valid {
  color: #52c41a;
}

.audit-section {
  background: #e6f7ff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}
.audit-title {
  font-size: 14px;
  font-weight: 700;
  color: #0050b3;
  margin-bottom: 12px;
}
.audit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.audit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #0050b3;
}
.audit-icon {
  font-size: 16px;
  flex-shrink: 0;
}
</style>
