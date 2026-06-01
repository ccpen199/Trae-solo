<template>
  <div>
    <div class="metrics">
      <div class="metric clickable" v-for="card in statCards" :key="card.key" @click="showDetail(card.key)">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small>{{ card.sub }}</small>
        <span class="drill-hint">点击查看明细 →</span>
      </div>
    </div>

    <div class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>即将开课</h2>
          <span class="badge">{{ data.upcoming?.length || 0 }} 节</span>
        </div>
        <div class="table-wrap">
          <table v-if="data.upcoming && data.upcoming.length">
            <thead>
              <tr>
                <th>日期</th>
                <th>时间</th>
                <th>班级</th>
                <th>科目</th>
                <th>教师</th>
                <th>教室</th>
                <th>人数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in data.upcoming.slice(0, 8)" :key="s.id">
                <td>{{ s.course_date }}</td>
                <td>{{ s.start_time }}-{{ s.end_time }}</td>
                <td><strong>{{ s.class_name }}</strong></td>
                <td>{{ s.subject }}</td>
                <td>{{ s.teacher_name }}</td>
                <td>{{ s.classroom_name }}</td>
                <td><span class="badge">{{ s.enrolled_count || 0 }}/{{ s.capacity }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无课程安排</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>课时不足预警</h2>
          <span class="badge warning">续费线索</span>
        </div>
        <div class="stack" v-if="data.lowBalance && data.lowBalance.length">
          <div class="row clickable" v-for="st in data.lowBalance.slice(0, 10)" :key="st.id" @click="showStudentDetail(st)">
            <div>
              <strong>{{ st.name }}</strong>
              <small>
                顾问: {{ st.consultant }} | 
                家长: {{ st.parent_phone }} | 
                已用: {{ st.total_used_hours?.toFixed(1) || 0 }}课时
              </small>
              <div class="goal-tags" v-if="st.learning_goal">
                <span class="tag goal">🎯 {{ st.learning_goal }}</span>
                <span class="tag contract" v-if="st.contract_attachment">📄 有合同</span>
              </div>
            </div>
            <div class="hours-wrap">
              <div class="hours remaining">{{ st.remaining_hours.toFixed(1) }}</div>
              <div class="hours-label">课时</div>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无预警</div>
      </div>
    </div>

    <div class="panel wide" style="margin-top: 16px;">
      <div class="panel-head">
        <h2>经营概览</h2>
        <span class="badge">实时数据 · 可追溯</span>
      </div>
      <div class="metrics" style="grid-template-columns: repeat(3, 1fr);">
        <div class="metric clickable" @click="showDetail('todayConsumption')">
          <span>今日课消</span>
          <strong>{{ (data.stats?.todayConsumedHours || 0).toFixed(1) }} 课时</strong>
          <small>{{ currency(data.stats?.todayConsumedAmount || 0) }}</small>
          <span class="drill-hint">按签到状态查看 →</span>
        </div>
        <div class="metric clickable" @click="showDetail('remainingHours')">
          <span>剩余课时</span>
          <strong>{{ data.stats?.remainingHours || 0 }} 课时</strong>
          <small>在读学员: {{ data.stats?.students || 0 }}</small>
          <span class="drill-hint">按课包查看 →</span>
        </div>
        <div class="metric clickable" @click="showDetail('liability')">
          <span>剩余负债</span>
          <strong>{{ currency(data.stats?.totalLiability || 0) }}</strong>
          <small>待消耗预收款</small>
          <span class="drill-hint">财务复查 →</span>
        </div>
      </div>
      <div class="audit-trail">
        <div class="trail-title">📊 经营数据追溯链路</div>
        <div class="trail-flow">
          <div class="trail-node">
            <div class="trail-value">{{ currency(data.stats?.paidAmount || 0) }}</div>
            <div class="trail-label">实收金额</div>
            <div class="trail-sub">按课包统计</div>
          </div>
          <div class="trail-arrow">=</div>
          <div class="trail-node">
            <div class="trail-value">{{ currency(data.stats?.totalConsumedAmount || 0) }}</div>
            <div class="trail-label">累计课消</div>
            <div class="trail-sub">{{ data.stats?.totalConsumedHours || 0 }}课时</div>
          </div>
          <div class="trail-arrow">+</div>
          <div class="trail-node">
            <div class="trail-value">{{ currency(data.stats?.totalLiability || 0) }}</div>
            <div class="trail-label">剩余负债</div>
            <div class="trail-sub">未消耗课时</div>
          </div>
          <div class="trail-arrow">+</div>
          <div class="trail-node refund">
            <div class="trail-value">{{ currency(data.stats?.totalRefunded || 0) }}</div>
            <div class="trail-label">累计退费</div>
            <div class="trail-sub">已审批</div>
          </div>
        </div>
        <div class="trail-formula">
          勾稽关系: 实收金额 = 累计课消 + 剩余负债 + 累计退费
        </div>
      </div>
    </div>

    <div class="modal" v-if="detailModal.show" @click.self="detailModal.show = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ detailModal.title }}</h3>
          <button class="btn-close" @click="detailModal.show = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="detailModal.type === 'students'">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>学员</th>
                  <th>顾问</th>
                  <th>学习目标</th>
                  <th>剩余课时</th>
                  <th>剩余负债</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in detailModal.data" :key="s.id">
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.consultant }}</td>
                  <td>{{ s.learning_goal || '-' }}</td>
                  <td class="hours">{{ s.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td class="amount">{{ currency(s.liability || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="detailModal.type === 'revenue'">
            <div class="section-title">按课包统计收入</div>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>课包名称</th>
                  <th>购买人数</th>
                  <th>实收金额</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pkg in data.revenueByPackage" :key="pkg.name">
                  <td><strong>{{ pkg.name }}</strong></td>
                  <td>{{ pkg.count }} 人</td>
                  <td class="amount">{{ currency(pkg.amount || 0) }}</td>
                  <td>{{ getPercentage(pkg.amount, data.stats?.paidAmount) }}%</td>
                </tr>
              </tbody>
            </table>
            <div class="section-title" style="margin-top: 20px;">退费与转课汇总</div>
            <div class="summary-cards">
              <div class="sum-card">
                <div class="sum-value">{{ currency(data.refundSummary?.approved_amount || 0) }}</div>
                <div class="sum-label">已审批退费</div>
              </div>
              <div class="sum-card">
                <div class="sum-value">{{ currency(data.refundSummary?.pending_amount || 0) }}</div>
                <div class="sum-label">待审批退费</div>
              </div>
              <div class="sum-card">
                <div class="sum-value">{{ currency(data.transferSummary?.approved_amount || 0) }}</div>
                <div class="sum-label">已审批转课</div>
              </div>
            </div>
          </div>
          <div v-else-if="detailModal.type === 'consumption'">
            <div class="section-title">按出勤状态统计</div>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>签到状态</th>
                  <th>次数</th>
                  <th>消耗课时</th>
                  <th>课消金额</th>
                  <th>是否扣课时</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.consumptionByStatus" :key="c.status">
                  <td><span :class="['status-badge', c.status]">{{ c.status_name }}</span></td>
                  <td>{{ c.count }} 次</td>
                  <td class="hours">{{ c.hours?.toFixed(1) || 0 }}</td>
                  <td class="amount">{{ currency(c.amount || 0) }}</td>
                  <td>
                    <span v-if="c.status === 'normal' || c.status === 'absent'" class="badge yes">是</span>
                    <span v-else class="badge no">否</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="audit-note">
              <strong>💡 课消规则说明：</strong>
              <ul>
                <li>正常出勤：扣除课时，产生课消</li>
                <li>旷课：扣除课时，产生课消</li>
                <li>请假：不扣课时，不产生课消</li>
                <li>补课：不扣课时，不产生课消</li>
                <li>试听：不扣课时，不产生课消</li>
              </ul>
            </div>
          </div>
          <div v-else-if="detailModal.type === 'liability'">
            <div class="section-title">负债构成明细</div>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>课包名称</th>
                  <th>剩余课时</th>
                  <th>单价</th>
                  <th>负债金额</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pkg in detailModal.data" :key="pkg.name">
                  <td><strong>{{ pkg.name }}</strong></td>
                  <td class="hours">{{ pkg.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ currency(pkg.unit_price || 0) }}</td>
                  <td class="amount">{{ currency(pkg.liability || 0) }}</td>
                  <td>{{ getPercentage(pkg.liability, data.stats?.totalLiability) }}%</td>
                </tr>
              </tbody>
            </table>
            <div class="audit-note">
              <strong>✅ 财务复查说明：</strong>
              <ul>
                <li>负债 = 剩余课时 × 单价</li>
                <li>每笔负债对应具体学员的购课记录</li>
                <li>可在财务管理中查看每笔购课的合同</li>
              </ul>
            </div>
          </div>
          <div v-else-if="detailModal.type === 'studentDetail'">
            <div class="student-detail">
              <div class="detail-header">
                <strong class="student-name">{{ detailModal.data?.name }}</strong>
                <span class="badge consultant">顾问: {{ detailModal.data?.consultant }}</span>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>学习目标</label>
                  <div class="value">{{ detailModal.data?.learning_goal || '未设置' }}</div>
                </div>
                <div class="detail-item">
                  <label>家长电话</label>
                  <div class="value">{{ detailModal.data?.parent_phone }}</div>
                </div>
                <div class="detail-item">
                  <label>合同附件</label>
                  <div class="value">
                    <span v-if="detailModal.data?.contract_attachment">📄 已上传</span>
                    <span v-else class="text-muted">未上传</span>
                  </div>
                </div>
                <div class="detail-item">
                  <label>已用课时</label>
                  <div class="value used">{{ detailModal.data?.total_used_hours?.toFixed(1) || 0 }} 课时</div>
                </div>
                <div class="detail-item">
                  <label>剩余课时</label>
                  <div class="value remaining">{{ detailModal.data?.remaining_hours?.toFixed(1) || 0 }} 课时</div>
                </div>
                <div class="detail-item">
                  <label>累计消费</label>
                  <div class="value amount">{{ currency(detailModal.data?.total_paid || 0) }}</div>
                </div>
              </div>
              <div class="audit-actions">
                <div class="action-hint">
                  <strong>🔍 复查入口：</strong>
                </div>
                <ul>
                  <li>学员管理 → 查看学员完整档案和购课记录</li>
                  <li>考勤签到 → 查看该学员所有出勤和课消明细</li>
                  <li>财务管理 → 查看合同、发票和退费记录</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';

const props = defineProps({
  data: { type: Object, default: () => ({ stats: {}, upcoming: [], lowBalance: [], revenueByPackage: [], consumptionByStatus: [] }) },
  currency: { type: Function, required: true }
});

const emit = defineEmits(['viewStudent', 'viewFinance']);

const detailModal = reactive({
  show: false,
  type: '',
  title: '',
  data: []
});

const statCards = computed(() => [
  { key: 'students', label: '在读学员', value: props.data.stats?.students || 0, sub: '活跃学员' },
  { key: 'teachers', label: '授课教师', value: props.data.stats?.teachers || 0, sub: '在职教师' },
  { key: 'classes', label: '开设班级', value: props.data.stats?.classes || 0, sub: '进行中' },
  { key: 'schedules', label: '今日课程', value: props.data.stats?.todaySchedules || 0, sub: '待上课' },
  { key: 'revenue', label: '实收金额', value: props.currency(props.data.stats?.paidAmount || 0), sub: '累计收入' },
  { key: 'refund', label: '累计退费', value: props.currency(props.data.stats?.totalRefunded || 0), sub: '已审批' }
]);

function getPercentage(value, total) {
  if (!total) return 0;
  return Math.round(value / total * 1000) / 10;
}

function showDetail(type) {
  const titles = {
    students: '在读学员明细',
    teachers: '授课教师明细',
    classes: '开设班级明细',
    schedules: '今日课程明细',
    revenue: '实收金额来源明细',
    refund: '退费明细',
    todayConsumption: '课消统计明细',
    remainingHours: '剩余课时明细',
    liability: '剩余负债明细'
  };
  detailModal.type = type;
  detailModal.title = titles[type] || '明细';
  detailModal.data = getDetailData(type);
  detailModal.show = true;
}

function getDetailData(type) {
  if (type === 'students') {
    return (props.data.lowBalance || []).map(s => ({
      ...s,
      liability: s.remaining_hours * 100
    }));
  }
  if (type === 'liability') {
    return (props.data.revenueByPackage || []).map(pkg => ({
      ...pkg,
      unit_price: pkg.amount / pkg.count / 30,
      remaining_hours: pkg.count * 30,
      liability: pkg.amount
    }));
  }
  return [];
}

function showStudentDetail(student) {
  detailModal.type = 'studentDetail';
  detailModal.title = `${student.name} - 续费线索复查`;
  detailModal.data = student;
  detailModal.show = true;
}
</script>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.metric {
  background: white;
  border: 1px solid #dce3ea;
  border-radius: 8px;
  padding: 14px 16px;
  position: relative;
}
.metric.clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.metric.clickable:hover {
  border-color: #1677ff;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.1);
}
.metric span {
  font-size: 12px;
  color: #687789;
  display: block;
}
.metric strong {
  font-size: 22px;
  color: #17212b;
  display: block;
  margin: 6px 0;
}
.metric small {
  font-size: 11px;
  color: #8c8c8c;
}
.drill-hint {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 10px !important;
  color: #1677ff !important;
  opacity: 0.7;
}
.metric:hover .drill-hint {
  opacity: 1;
}

.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.panel {
  background: white;
  border: 1px solid #dce3ea;
  border-radius: 8px;
}
.panel.wide {
  grid-column: 1 / -1;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8edf2;
}
.panel-head h2 {
  margin: 0;
  font-size: 15px;
  color: #17212b;
}

.table-wrap {
  padding: 12px 16px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th, td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f2f5;
}
th {
  color: #687789;
  font-weight: 600;
  font-size: 12px;
}
.badge {
  display: inline-block;
  padding: 2px 8px;
  background: #f6f8fa;
  color: #687789;
  border-radius: 4px;
  font-size: 11px;
}
.badge.warning {
  background: #fff7e6;
  color: #fa8c16;
}
.badge.consultant {
  background: #e6f7ff;
  color: #1890ff;
}
.badge.yes {
  background: #f6ffed;
  color: #52c41a;
}
.badge.no {
  background: #f5f5f5;
  color: #8c8c8c;
}

.stack {
  padding: 8px 16px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}
.row:last-child {
  border-bottom: none;
}
.row.clickable {
  cursor: pointer;
  transition: background 0.2s;
  margin: 0 -16px;
  padding: 10px 16px;
}
.row.clickable:hover {
  background: #f6f8fa;
}
.row strong {
  font-size: 14px;
  color: #17212b;
  display: block;
}
.row small {
  font-size: 11px;
  color: #8c8c8c;
}
.hours-wrap {
  text-align: right;
}
.hours {
  font-size: 18px;
  font-weight: 700;
  color: #1677ff;
}
.hours.remaining {
  color: #cf1322;
}
.hours-label {
  font-size: 11px;
  color: #8c8c8c;
}

.goal-tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
}
.tag.goal {
  background: #e6f7ff;
  color: #1890ff;
}
.tag.contract {
  background: #f6ffed;
  color: #52c41a;
}

.audit-trail {
  padding: 16px;
  background: #fafafa;
  border-top: 1px solid #e8edf2;
}
.trail-title {
  font-size: 13px;
  font-weight: 600;
  color: #17212b;
  margin-bottom: 12px;
}
.trail-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.trail-node {
  background: white;
  border: 1px solid #dce3ea;
  border-radius: 8px;
  padding: 12px 20px;
  text-align: center;
  min-width: 100px;
}
.trail-node.refund {
  border-color: #ffccc7;
  background: #fff2f0;
}
.trail-value {
  font-size: 16px;
  font-weight: 700;
  color: #17212b;
}
.trail-label {
  font-size: 11px;
  color: #687789;
  margin-top: 4px;
}
.trail-sub {
  font-size: 10px;
  color: #8c8c8c;
  margin-top: 2px;
}
.trail-arrow {
  font-size: 14px;
  color: #687789;
  font-weight: 600;
}
.trail-formula {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: #687789;
  font-family: monospace;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e8edf2;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
}
.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #17212b;
  margin-bottom: 12px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.detail-table th {
  background: #f6f8fa;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #687789;
  border-bottom: 1px solid #e8edf2;
}
.detail-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f0f2f5;
}
.amount {
  color: #cf1322;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.normal {
  background: #f6ffed;
  color: #52c41a;
}
.status-badge.leave {
  background: #e6f7ff;
  color: #1890ff;
}
.status-badge.absent {
  background: #fff2f0;
  color: #ff4d4f;
}
.status-badge.makeup {
  background: #fff7e6;
  color: #fa8c16;
}
.status-badge.trial {
  background: #f9f0ff;
  color: #722ed1;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.sum-card {
  background: #f6f8fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.sum-value {
  font-size: 18px;
  font-weight: 700;
  color: #cf1322;
}
.sum-label {
  font-size: 12px;
  color: #687789;
  margin-top: 4px;
}

.audit-note {
  margin-top: 16px;
  padding: 12px 16px;
  background: #e6f7ff;
  border-radius: 6px;
  font-size: 12px;
  color: #0050b3;
}
.audit-note ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}
.audit-note li {
  margin: 4px 0;
}

.student-detail {
  font-size: 13px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8edf2;
}
.student-name {
  font-size: 18px;
  color: #17212b;
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.detail-item label {
  display: block;
  font-size: 11px;
  color: #687789;
  margin-bottom: 4px;
}
.detail-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #17212b;
}
.detail-item .value.used {
  color: #52c41a;
}
.detail-item .value.remaining {
  color: #cf1322;
}
.detail-item .value.amount {
  color: #cf1322;
}
.text-muted {
  color: #8c8c8c;
  font-weight: 400;
}

.audit-actions {
  padding: 16px;
  background: #f6f8fa;
  border-radius: 8px;
}
.action-hint {
  margin-bottom: 8px;
}
.audit-actions ul {
  margin: 0;
  padding-left: 20px;
}
.audit-actions li {
  margin: 6px 0;
  color: #17212b;
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #8c8c8c;
}
</style>
