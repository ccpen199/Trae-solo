<template>
  <div>
    <div class="date-filter">
      <label>统计周期：</label>
      <input v-model="startDate" type="date" />
      <span>至</span>
      <input v-model="endDate" type="date" />
      <button class="btn-secondary" @click="loadReports">查询</button>
      <button class="btn-secondary" @click="exportCheckData" style="margin-left: auto;">导出核对</button>
    </div>

    <div class="metrics" style="grid-template-columns: repeat(6, 1fr);">
      <div class="metric">
        <span>历史总营收</span>
        <strong>{{ currency(data.overall?.total_revenue || 0) }}</strong>
        <small>累计收款</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('revenue')">
          {{ showCheckDetail.revenue ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.revenue" class="check-detail">
          <p>所有购课实付金额之和</p>
          <a href="javascript:;" class="drill-link" @click="showDrillModal('purchase')">查看购课明细 →</a>
        </div>
      </div>
      <div class="metric">
        <span>累计退费</span>
        <strong class="refund">{{ currency(data.overall?.total_refunded || 0) }}</strong>
        <small>已审批退费</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('refund')">
          {{ showCheckDetail.refund ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.refund" class="check-detail">
          <p>所有已通过的退费申请金额</p>
          <a href="javascript:;" class="drill-link" @click="showDrillModal('refund')">查看退费明细 →</a>
        </div>
      </div>
      <div class="metric">
        <span>净营收</span>
        <strong class="net">{{ currency(netRevenue) }}</strong>
        <small>营收-退费</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('netRevenue')">
          {{ showCheckDetail.netRevenue ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.netRevenue" class="check-detail">
          <p>总营收 - 累计退费</p>
          <p class="formula-inline">= {{ currency(data.overall?.total_revenue || 0) }} - {{ currency(data.overall?.total_refunded || 0) }}</p>
        </div>
      </div>
      <div class="metric">
        <span>累计课消</span>
        <strong>{{ currency(data.overall?.total_consumed || 0) }}</strong>
        <small>已确认收入</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('consumed')">
          {{ showCheckDetail.consumed ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.consumed" class="check-detail">
          <p>所有正常出勤课消金额之和</p>
          <a href="javascript:;" class="drill-link" @click="showDrillModal('consumption')">查看课消明细 →</a>
        </div>
      </div>
      <div class="metric">
        <span>剩余负债</span>
        <strong>{{ currency(data.overall?.total_liability || 0) }}</strong>
        <small>待消耗预收款</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('liability')">
          {{ showCheckDetail.liability ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.liability" class="check-detail">
          <p>剩余课时 × 单价之和</p>
          <a href="javascript:;" class="drill-link" @click="showDrillModal('packageBalance')">查看课包余额明细 →</a>
        </div>
      </div>
      <div class="metric">
        <span>在读学员</span>
        <strong>{{ data.overall?.active_students || 0 }}</strong>
        <small>活跃学员</small>
        <a href="javascript:;" class="check-link" @click="toggleCheckDetail('students')">
          {{ showCheckDetail.students ? '收起说明' : '核对说明' }}
        </a>
        <div v-if="showCheckDetail.students" class="check-detail">
          <p>状态为active的学员数</p>
          <a href="javascript:;" class="drill-link" @click="showDrillModal('studentList')">查看学员列表 →</a>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top: 16px;">
      <div class="panel-head">
        <h2>数据核对（勾稽关系验证）</h2>
        <span :class="['badge', balanceStatus]">
          {{ balanceStatus === 'balanced' ? '平衡' : '不平衡' }}
        </span>
      </div>
      <div class="check-panel">
        <div class="check-item">
          <div class="check-formula">
            <span class="formula-part">净营收</span>
            <span class="formula-op">=</span>
            <span class="formula-part">总课消</span>
            <span class="formula-op">+</span>
            <span class="formula-part">剩余负债</span>
          </div>
          <div class="check-values">
            <span>{{ currency(netRevenue) }}</span>
            <span class="formula-op">=</span>
            <span>{{ currency(data.overall?.total_consumed || 0) }}</span>
            <span class="formula-op">+</span>
            <span>{{ currency(data.overall?.total_liability || 0) }}</span>
          </div>
          <div class="check-values sub-values">
            <span class="sub-label">其中: 总营收 - 累计退费</span>
            <span class="formula-op">=</span>
            <span class="sub-label">已确认收入 + 待确认收入</span>
          </div>
          <div class="check-result" :class="balanceStatus">
            误差: {{ balanceError }}% (允许±1%)
            <span v-if="balanceStatus === 'balanced'" class="status-icon">✓</span>
            <span v-else class="status-icon error">✗</span>
          </div>
        </div>
        <div class="check-item">
          <div class="check-formula">
            <span class="formula-part">课消与退费链路</span>
          </div>
          <div class="link-check">
            <div class="link-item">
              <div class="link-arrow">购课</div>
              <div class="link-value">{{ currency(data.overall?.total_revenue || 0) }}</div>
            </div>
            <div class="link-arrow">→</div>
            <div class="link-item">
              <div class="link-arrow">课消</div>
              <div class="link-value">{{ currency(data.overall?.total_consumed || 0) }}</div>
            </div>
            <div class="link-arrow">→</div>
            <div class="link-item">
              <div class="link-arrow">负债</div>
              <div class="link-value">{{ currency(data.overall?.total_liability || 0) }}</div>
            </div>
            <div class="link-arrow">+</div>
            <div class="link-item">
              <div class="link-arrow">退费</div>
              <div class="link-value">{{ currency(data.overall?.total_refunded || 0) }}</div>
            </div>
          </div>
          <div class="check-note">
            <span class="note-icon">ℹ</span>
            <span>课消与退费链路可复查：每笔课消关联签到记录，每笔退费关联购课记录</span>
          </div>
        </div>
        <div class="check-item">
          <div class="check-formula">
            <span class="formula-part">平均课单价</span>
            <span class="formula-op">=</span>
            <span class="formula-part">总课消</span>
            <span class="formula-op">/</span>
            <span class="formula-part">课消总课时</span>
          </div>
          <div class="check-values">
            <span class="hours">{{ currency(averageUnitPrice) }}/课时</span>
            <span class="formula-op">=</span>
            <span>{{ currency(data.overall?.total_consumed || 0) }}</span>
            <span class="formula-op">/</span>
            <span>{{ totalConsumedHours?.toFixed(1) || 0 }} 课时</span>
          </div>
        </div>
        <div class="check-item">
          <div class="check-formula">
            <span class="formula-part">续费转化率</span>
            <span class="formula-op">=</span>
            <span class="formula-part">续费线索数</span>
            <span class="formula-op">/</span>
            <span class="formula-part">在读学员数</span>
          </div>
          <div class="check-values">
            <span class="hours">{{ renewalConversionRate }}%</span>
            <span class="formula-op">=</span>
            <span>{{ (data.renewalLeads || []).length }} 人</span>
            <span class="formula-op">/</span>
            <span>{{ data.overall?.active_students || 0 }} 人</span>
          </div>
        </div>
      </div>
    </div>

    <div class="layout" style="margin-top: 16px;">
      <div class="panel">
        <div class="panel-head">
          <h2>课包销售统计</h2>
          <span>按销售额排序</span>
        </div>
        <div class="table-wrap">
          <table v-if="data.revenueByPackage && data.revenueByPackage.length">
            <thead>
              <tr>
                <th>课包名称</th>
                <th>销售数量</th>
                <th>销售课时</th>
                <th>销售金额</th>
                <th>占比</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pkg in data.revenueByPackage" :key="pkg.name">
                <td><strong>{{ pkg.name }}</strong></td>
                <td>{{ pkg.purchase_count }}</td>
                <td>{{ pkg.total_hours || 0 }}</td>
                <td class="hours">{{ currency(pkg.paid_amount || 0) }}</td>
                <td><span class="badge">{{ getPercentage(pkg.paid_amount, totalRevenue) }}%</span></td>
                <td>
                  <button class="btn-link" @click="showPackageStudents(pkg)">查看明细</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无数据</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>学科课消统计</h2>
          <span>按课时排序</span>
        </div>
        <div class="table-wrap">
          <table v-if="data.consumptionBySubject && data.consumptionBySubject.length">
            <thead>
              <tr>
                <th>学科</th>
                <th>课消课时</th>
                <th>课消金额</th>
                <th>学员数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in data.consumptionBySubject" :key="sub.subject">
                <td><strong>{{ sub.subject || '未分类' }}</strong></td>
                <td>{{ sub.hours?.toFixed(1) || 0 }}</td>
                <td class="hours">{{ currency(sub.amount || 0) }}</td>
                <td>{{ sub.student_count || 0 }}</td>
                <td>
                  <button class="btn-link" @click="showSubjectRecords(sub)">查看明细</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无数据</div>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top: 16px;">
      <div class="panel-head">
        <h2>教师课时统计</h2>
        <span>含预估薪酬</span>
      </div>
      <div class="table-wrap">
        <table v-if="data.teacherLoad && data.teacherLoad.length">
          <thead>
            <tr>
              <th>教师</th>
              <th>学科</th>
              <th>课时单价</th>
              <th>排课节数</th>
              <th>授课课时</th>
              <th>预估薪酬</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in data.teacherLoad" :key="t.name">
              <td><strong>{{ t.name }}</strong></td>
              <td>{{ t.subject }}</td>
              <td>{{ currency(t.hourly_rate || 0) }}/课时</td>
              <td>{{ t.scheduled_lessons || 0 }}</td>
              <td>{{ t.taught_hours?.toFixed(1) || 0 }}</td>
              <td class="hours">{{ currency(t.salary || 0) }}</td>
              <td>
                <button class="btn-link" @click="showTeacherRecords(t)">查看明细</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无数据</div>
      </div>
    </div>

    <div class="layout" style="margin-top: 16px;">
      <div class="panel">
        <div class="panel-head">
          <h2>每日课消趋势</h2>
          <span>近30天</span>
        </div>
        <div class="table-wrap">
          <table v-if="data.dailyConsumption && data.dailyConsumption.length">
            <thead>
              <tr>
                <th>日期</th>
                <th>课消课时</th>
                <th>课消金额</th>
                <th>学员数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in data.dailyConsumption.slice().reverse().slice(0, 15)" :key="d.consume_date">
                <td><a href="javascript:;" class="drill-link" @click="showDailyRecords(d)">{{ d.consume_date }}</a></td>
                <td>{{ d.hours?.toFixed(1) || 0 }}</td>
                <td class="hours">{{ currency(d.amount || 0) }}</td>
                <td>{{ d.student_count || 0 }}</td>
                <td>
                  <button class="btn-link" @click="showDailyRecords(d)">查看明细</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无数据</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>续费线索</h2>
          <span class="badge pending">需跟进</span>
        </div>
        <div class="stack" v-if="data.renewalLeads && data.renewalLeads.length">
          <div class="row" v-for="st in data.renewalLeads.slice(0, 12)" :key="st.id">
            <div>
              <strong><a href="javascript:;" class="drill-link" @click="showStudentDetail(st)">{{ st.name }}</a></strong>
              <small>顾问: {{ st.consultant }} | 家长: {{ st.parent_phone }}</small>
            </div>
            <div>
              <span class="hours">{{ st.remaining_hours?.toFixed(1) || 0 }} 课时</span>
              <small style="display:block; text-align:right;">历史消费: {{ currency(st.historical_amount || 0) }}</small>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无续费线索</div>
      </div>
    </div>

    <div v-if="drillModal.show" class="modal-overlay" @click.self="drillModal.show = false">
      <div class="modal large">
        <div class="modal-head">
          <h3>{{ drillModal.title }}</h3>
          <button class="btn-close" @click="drillModal.show = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="drillModal.type === 'refund'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>退费课时</th>
                  <th>退费金额</th>
                  <th>已用课时</th>
                  <th>退费原因</th>
                  <th>审批状态</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in drillModal.data" :key="r.id">
                  <td><strong>{{ r.student_name }}</strong></td>
                  <td>{{ r.refund_hours }}</td>
                  <td class="amount">{{ currency(r.refund_amount || 0) }}</td>
                  <td>{{ r.used_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ r.reason || '-' }}</td>
                  <td><span :class="['badge', r.approval_status]">{{ r.approval_status === 'approved' ? '已通过' : r.approval_status === 'rejected' ? '已拒绝' : '待审批' }}</span></td>
                  <td>{{ r.created_at || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'purchase'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>课包</th>
                  <th>课时</th>
                  <th>单价</th>
                  <th>实付金额</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in drillModal.data" :key="p.id">
                  <td><strong>{{ p.student_name }}</strong></td>
                  <td>{{ p.package_name || '自定义' }}</td>
                  <td>{{ p.total_hours }}</td>
                  <td>{{ currency(p.unit_price || 0) }}</td>
                  <td class="hours">{{ currency(p.paid_amount || 0) }}</td>
                  <td>{{ p.purchase_date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'consumption'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>学科</th>
                  <th>教师</th>
                  <th>课时</th>
                  <th>金额</th>
                  <th>日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in drillModal.data" :key="c.id">
                  <td><strong>{{ c.student_name }}</strong></td>
                  <td>{{ c.subject }}</td>
                  <td>{{ c.teacher_name }}</td>
                  <td>{{ c.hours?.toFixed(1) || 0 }}</td>
                  <td class="hours">{{ currency(c.amount || 0) }}</td>
                  <td>{{ c.consume_date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'packageBalance'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>课包</th>
                  <th>总课时</th>
                  <th>已用</th>
                  <th>剩余</th>
                  <th>单价</th>
                  <th>负债金额</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in drillModal.data" :key="p.id">
                  <td><strong>{{ p.student_name }}</strong></td>
                  <td>{{ p.package_name || '自定义' }}</td>
                  <td>{{ p.total_hours }}</td>
                  <td>{{ p.used_hours?.toFixed(1) || 0 }}</td>
                  <td class="hours">{{ p.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ currency(p.unit_price || 0) }}</td>
                  <td class="hours">{{ currency((p.remaining_hours || 0) * (p.unit_price || 0)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'studentList'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员姓名</th>
                  <th>家长电话</th>
                  <th>状态</th>
                  <th>剩余课时</th>
                  <th>顾问</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in drillModal.data" :key="s.id">
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.parent_phone || s.phone }}</td>
                  <td><span :class="['badge', s.status]">{{ s.status === 'active' ? '在读' : s.status }}</span></td>
                  <td class="hours">{{ s.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ s.consultant || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'purchaseList'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>课包</th>
                  <th>合同号</th>
                  <th>剩余课时</th>
                  <th>实付金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in drillModal.data" :key="p.id">
                  <td><strong>{{ p.student_name }}</strong></td>
                  <td>{{ p.package_name || '自定义' }}</td>
                  <td>{{ p.contract_no || '-' }}</td>
                  <td class="hours">{{ p.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ currency(p.paid_amount || 0) }}</td>
                  <td><span :class="['badge', p.status]">{{ p.status === 'active' ? '有效' : p.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'packageStudents'" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>购买课时</th>
                  <th>已用</th>
                  <th>剩余</th>
                  <th>实付金额</th>
                  <th>购买日期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in drillModal.data" :key="p.id">
                  <td><strong>{{ p.student_name }}</strong></td>
                  <td>{{ p.total_hours }}</td>
                  <td>{{ p.used_hours?.toFixed(1) || 0 }}</td>
                  <td class="hours">{{ p.remaining_hours?.toFixed(1) || 0 }}</td>
                  <td>{{ currency(p.paid_amount || 0) }}</td>
                  <td>{{ p.purchase_date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="drillModal.type === 'studentDetail'" class="student-detail">
            <div class="detail-header">
              <h4>{{ drillModal.data.name }}</h4>
              <p>家长: {{ drillModal.data.parent_phone }} | 顾问: {{ drillModal.data.consultant }}</p>
            </div>
            <div class="detail-section">
              <h5>课包余额</h5>
              <table>
                <thead>
                  <tr>
                    <th>课包</th>
                    <th>总课时</th>
                    <th>已用</th>
                    <th>剩余</th>
                    <th>单价</th>
                    <th>余额价值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in drillModal.data.packages" :key="p.id">
                    <td>{{ p.package_name || '自定义' }}</td>
                    <td>{{ p.total_hours }}</td>
                    <td>{{ p.used_hours?.toFixed(1) || 0 }}</td>
                    <td class="hours">{{ p.remaining_hours?.toFixed(1) || 0 }}</td>
                    <td>{{ currency(p.unit_price || 0) }}</td>
                    <td class="hours">{{ currency((p.remaining_hours || 0) * (p.unit_price || 0)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="detail-section">
              <h5>消费历史</h5>
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>学科</th>
                    <th>教师</th>
                    <th>课时</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in drillModal.data.consumptionHistory" :key="c.id">
                    <td>{{ c.consume_date }}</td>
                    <td>{{ c.subject }}</td>
                    <td>{{ c.teacher_name }}</td>
                    <td>{{ c.hours?.toFixed(1) || 0 }}</td>
                    <td class="hours">{{ currency(c.amount || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="empty">暂无明细数据</div>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" @click="drillModal.show = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';

function dayjs(date) {
  const d = date ? new Date(date) : new Date();
  return {
    format(fmt) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return fmt.replace('YYYY', y).replace('MM', m).replace('DD', day);
    },
    subtract(n, unit) {
      const newDate = new Date(d);
      if (unit === 'day') newDate.setDate(newDate.getDate() - n);
      if (unit === 'month') newDate.setMonth(newDate.getMonth() - n);
      return dayjs(newDate);
    }
  };
}

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  currency: { type: Function, required: true },
  loadData: { type: Function, default: null }
});

const startDate = ref(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
const endDate = ref(dayjs().format('YYYY-MM-DD'));

const showCheckDetail = reactive({
  revenue: false,
  refund: false,
  netRevenue: false,
  consumed: false,
  liability: false,
  students: false,
  purchases: false
});

const drillModal = reactive({
  show: false,
  type: '',
  title: '',
  data: []
});

const totalRevenue = computed(() => {
  return (props.data.revenueByPackage || []).reduce((sum, pkg) => sum + (pkg.paid_amount || 0), 0);
});

const netRevenue = computed(() => {
  const totalRevenue = props.data.overall?.total_revenue || 0;
  const totalRefunded = props.data.overall?.total_refunded || 0;
  return Math.max(0, totalRevenue - totalRefunded);
});

const totalConsumedHours = computed(() => {
  return (props.data.dailyConsumption || []).reduce((sum, d) => sum + (d.hours || 0), 0);
});

const averageUnitPrice = computed(() => {
  const totalConsumed = props.data.overall?.total_consumed || 0;
  const hours = totalConsumedHours.value;
  if (!hours) return 0;
  return Math.round(totalConsumed / hours * 100) / 100;
});

const renewalConversionRate = computed(() => {
  const leads = (props.data.renewalLeads || []).length;
  const students = props.data.overall?.active_students || 0;
  if (!students) return 0;
  return Math.round(leads / students * 1000) / 10;
});

const balanceStatus = computed(() => {
  const netRev = netRevenue.value;
  const consumed = props.data.overall?.total_consumed || 0;
  const liability = props.data.overall?.total_liability || 0;
  if (!netRev) return 'balanced';
  const error = Math.abs(netRev - (consumed + liability)) / netRev * 100;
  return error <= 1 ? 'balanced' : 'unbalanced';
});

const balanceError = computed(() => {
  const netRev = netRevenue.value;
  const consumed = props.data.overall?.total_consumed || 0;
  const liability = props.data.overall?.total_liability || 0;
  if (!netRev) return 0;
  return Math.round(Math.abs(netRev - (consumed + liability)) / netRev * 10000) / 100;
});

function getPercentage(value, total) {
  if (!total) return 0;
  return Math.round(value / total * 1000) / 10;
}

function toggleCheckDetail(key) {
  showCheckDetail[key] = !showCheckDetail[key];
}

function loadReports() {
  if (props.loadData && typeof props.loadData === 'function') {
    props.loadData({ startDate: startDate.value, endDate: endDate.value });
  }
}

function showDrillModal(type) {
  const titles = {
    purchase: '购课明细',
    refund: '退费明细',
    consumption: '课消明细',
    packageBalance: '课包余额明细',
    studentList: '在读学员列表',
    purchaseList: '有效合同列表'
  };
  drillModal.type = type;
  drillModal.title = titles[type] || '明细';
  drillModal.data = getMockDrillData(type);
  drillModal.show = true;
}

function getMockDrillData(type) {
  if (type === 'refund') {
    return (props.data.refunds || []).filter(r => r.approval_status === 'approved');
  }
  if (type === 'purchase') {
    return (props.data.purchases || []).filter(p => p.status === 'active');
  }
  if (type === 'purchaseList') {
    return (props.data.purchases || []).filter(p => p.status === 'active');
  }
  if (type === 'packageBalance') {
    return (props.data.purchases || []).filter(p => p.status === 'active' && (p.remaining_hours || 0) > 0);
  }
  if (type === 'studentList') {
    return (props.data.students || []).filter(s => s.status === 'active');
  }
  return [];
}

function showPackageStudents(pkg) {
  drillModal.type = 'packageStudents';
  drillModal.title = `${pkg.name} - 购课学员名单`;
  drillModal.data = (props.data.purchases || []).filter(p => p.package_name === pkg.name);
  drillModal.show = true;
}

function showSubjectRecords(sub) {
  drillModal.type = 'consumption';
  drillModal.title = `${sub.subject || '未分类'} - 课消记录`;
  drillModal.data = (props.data.consumptionRecords || []).filter(c => c.subject === sub.subject);
  drillModal.show = true;
}

function showTeacherRecords(t) {
  drillModal.type = 'consumption';
  drillModal.title = `${t.name} - 授课记录`;
  drillModal.data = (props.data.consumptionRecords || []).filter(c => c.teacher_name === t.name);
  drillModal.show = true;
}

function showDailyRecords(d) {
  drillModal.type = 'consumption';
  drillModal.title = `${d.consume_date} - 课消记录`;
  drillModal.data = (props.data.consumptionRecords || []).filter(c => c.consume_date === d.consume_date);
  drillModal.show = true;
}

function showStudentDetail(st) {
  drillModal.type = 'studentDetail';
  drillModal.title = `${st.name} - 详细信息`;
  drillModal.data = {
    ...st,
    packages: (props.data.purchases || []).filter(p => p.student_id === st.id),
    consumptionHistory: (props.data.consumptionRecords || []).filter(c => c.student_id === st.id).slice(0, 20)
  };
  drillModal.show = true;
}

function exportCheckData() {
  const exportData = {
    exportTime: new Date().toISOString(),
    period: {
      startDate: startDate.value,
      endDate: endDate.value
    },
    coreMetrics: {
      totalRevenue: props.data.overall?.total_revenue || 0,
      totalRefunded: props.data.overall?.total_refunded || 0,
      netRevenue: netRevenue.value,
      totalConsumed: props.data.overall?.total_consumed || 0,
      totalLiability: props.data.overall?.total_liability || 0,
      activeStudents: props.data.overall?.active_students || 0,
      activePurchases: props.data.overall?.active_purchases || 0
    },
    checkRelations: {
      balanceFormula: '净营收 = 总营收 - 累计退费 = 总课消 + 剩余负债',
      balanceValue: `${netRevenue.value} = ${props.data.overall?.total_revenue || 0} - ${props.data.overall?.total_refunded || 0} = ${props.data.overall?.total_consumed || 0} + ${props.data.overall?.total_liability || 0}`,
      balanceStatus: balanceStatus.value,
      balanceError: balanceError.value + '%',
      averageUnitPrice: averageUnitPrice.value,
      averageUnitPriceFormula: '总课消 / 课消总课时',
      renewalConversionRate: renewalConversionRate.value + '%',
      renewalConversionFormula: '续费线索数 / 在读学员数'
    },
    linkVerification: {
      purchaseToConsumption: '每笔课消关联签到记录和购课记录',
      consumptionToRefund: '每笔退费关联购课记录和审批记录',
      auditTrail: '所有操作可追溯，数据落库可复查'
    },
    details: {
      revenueByPackage: props.data.revenueByPackage || [],
      consumptionBySubject: props.data.consumptionBySubject || [],
      teacherLoad: props.data.teacherLoad || [],
      dailyConsumption: props.data.dailyConsumption || [],
      renewalLeads: props.data.renewalLeads || [],
      approvedRefunds: (props.data.refunds || []).filter(r => r.approval_status === 'approved')
    }
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `报表核对数据_${startDate.value}_${endDate.value}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.date-filter {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: white;
  border: 1px solid #dce3ea;
  border-radius: 8px;
}
.date-filter input {
  padding: 8px 12px;
  border: 1px solid #dce3ea;
  border-radius: 6px;
  font-size: 14px;
}
.hours {
  color: #1677ff;
  font-weight: 800;
}
.refund {
  color: #cf1322;
  font-weight: 800;
}
.net {
  color: #389e0d;
  font-weight: 800;
}
.amount {
  color: #cf1322;
  font-weight: 600;
}
.formula-inline {
  font-family: monospace;
  color: #595959;
  margin: 4px 0 0 0;
}
.sub-values {
  font-size: 12px;
  margin-top: 4px;
}
.sub-label {
  color: #8c8c8c;
}
.link-check {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0;
}
.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #f6f8fa;
  border-radius: 8px;
  min-width: 100px;
}
.link-arrow {
  font-size: 13px;
  color: #687789;
  font-weight: 600;
}
.link-value {
  font-size: 15px;
  font-weight: 700;
  color: #17212b;
}
.check-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #e6f7ff;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: #0050b3;
}
.note-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.badge.approved {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.badge.rejected {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}
.badge.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
.btn-secondary {
  padding: 8px 14px;
  background: #f0f2f5;
  color: #17212b;
  border: 1px solid #dce3ea;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-link {
  background: none;
  border: none;
  color: #1677ff;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 600;
  font-size: 13px;
}
.btn-link:hover {
  text-decoration: underline;
}
.check-link {
  font-size: 12px;
  color: #1677ff;
  cursor: pointer;
  margin-top: 4px;
  display: inline-block;
}
.check-link:hover {
  text-decoration: underline;
}
.check-detail {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f0f7ff;
  border-radius: 6px;
  font-size: 12px;
  border-left: 3px solid #1677ff;
}
.check-detail p {
  margin: 0 0 4px 0;
  color: #17212b;
}
.drill-link {
  color: #1677ff;
  cursor: pointer;
  font-size: 12px;
}
.drill-link:hover {
  text-decoration: underline;
}
.check-panel {
  padding: 16px;
  display: grid;
  gap: 16px;
}
.check-item {
  padding: 16px;
  background: #fafbfc;
  border: 1px solid #edf1f5;
  border-radius: 8px;
}
.check-formula {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.formula-part {
  background: #e6f4ff;
  color: #1677ff;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}
.formula-op {
  color: #687789;
  font-weight: 700;
  font-size: 14px;
}
.check-values {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.check-result {
  font-size: 12px;
  color: #687789;
  display: flex;
  align-items: center;
  gap: 6px;
}
.check-result.balanced {
  color: #52c41a;
}
.check-result.unbalanced {
  color: #ff4d4f;
}
.status-icon {
  font-weight: 700;
}
.status-icon.error {
  color: #ff4d4f;
}
.badge.balanced {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}
.badge.unbalanced {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}
.badge.pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}
.modal.large {
  width: 800px;
  max-width: 95vw;
}
.student-detail {
  display: grid;
  gap: 20px;
}
.detail-header {
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f5;
}
.detail-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}
.detail-header p {
  margin: 0;
  color: #687789;
  font-size: 13px;
}
.detail-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #17212b;
}
.empty {
  text-align: center;
  padding: 40px;
  color: #a9b6c3;
}
</style>
