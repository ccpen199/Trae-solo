<template>
  <div class="admin-page">
    <div class="breadcrumb">
      <router-link to="/dashboard">首页</router-link>
      <span class="separator">/</span>
      <span>后台运营管理</span>
    </div>

    <div class="page-header">
      <h2>后台运营管理</h2>
      <p>资格复查、医保结算、HR申报、基金预警和离线同步统一台账</p>
    </div>

    <div class="grid grid-5 mb-20">
      <div class="metric-card">
        <div class="metric-value">{{ overview.workbench.pendingQualificationReviews || 0 }}</div>
        <div class="metric-label">资格待复查</div>
      </div>
      <div class="metric-card success">
        <div class="metric-value">{{ overview.workbench.completedMedicalPayments || 0 }}</div>
        <div class="metric-label">医保已结算</div>
      </div>
      <div class="metric-card warning">
        <div class="metric-value">{{ overview.workbench.pendingHrDeclarations || 0 }}</div>
        <div class="metric-label">HR申报待核定</div>
      </div>
      <div class="metric-card danger">
        <div class="metric-value">{{ overview.workbench.fundWarnings || 0 }}</div>
        <div class="metric-label">基金预警</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">{{ overview.workbench.offlinePendingRecords || 0 }}</div>
        <div class="metric-label">离线待同步</div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title flex-between">
          <span>待遇资格复查台账</span>
          <button class="btn btn-default" @click="$router.push('/qualification')">查看认证页</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>方式</th>
              <th>结论</th>
              <th>置信度</th>
              <th>复查</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in overview.verifications" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.method === 'behavior' ? '行为轨迹' : '生物特征' }}</td>
              <td>
                <span :class="['tag', item.result === 'pass' ? 'tag-success' : 'tag-danger']">
                  {{ item.result === 'pass' ? '通过' : '未通过' }}
                </span>
              </td>
              <td>{{ formatPercent(item.confidence) }}</td>
              <td>
                <span :class="['tag', needsReview(item) ? 'tag-warning' : 'tag-success']">
                  {{ needsReview(item) ? '待人工复核' : '自动归档' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title flex-between">
          <span>医保支付结算台账</span>
          <button class="btn btn-primary" @click="$router.push('/medical/pay')">发起支付</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>机构</th>
              <th>总金额</th>
              <th>医保支付</th>
              <th>个人支付</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in overview.payments" :key="item.id">
              <td>{{ item.merchant_name }}</td>
              <td>{{ formatMoney(item.total_amount) }}</td>
              <td>{{ formatMoney(item.insurance_payment) }}</td>
              <td>{{ formatMoney(item.personal_payment) }}</td>
              <td><span class="tag tag-success">已完成</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title flex-between">
          <span>HR批量申报与缴费核定</span>
          <button class="btn btn-default" @click="$router.push('/hr/declare')">提交申报</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>单位</th>
              <th>月份</th>
              <th>人数</th>
              <th>核定金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in overview.declarations" :key="item.id">
              <td>{{ item.company_name }}</td>
              <td>{{ item.month }}</td>
              <td>{{ item.employee_count }}人</td>
              <td>{{ formatMoney(item.total_amount) }}</td>
              <td><span class="tag tag-warning">待缴费核定</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title">基金运行与离线同步</div>
        <div class="ops-list">
          <div class="ops-item">
            <span>基金收入</span>
            <strong>{{ formatMoney(overview.fund?.total_income) }}</strong>
          </div>
          <div class="ops-item">
            <span>基金支出</span>
            <strong>{{ formatMoney(overview.fund?.total_expense) }}</strong>
          </div>
          <div class="ops-item">
            <span>异常报销识别</span>
            <strong>{{ overview.fund?.abnormal_count || 0 }} 条</strong>
          </div>
          <div class="ops-item">
            <span>跨省结算平均时效</span>
            <strong>{{ overview.fund?.cross_province_avg_days || 0 }} 天</strong>
          </div>
        </div>
        <div class="sync-log">
          <div class="sync-item" v-for="log in overview.syncLogs" :key="log.id">
            <span>{{ log.center_id }}</span>
            <span>{{ log.record_count }}条</span>
            <span :class="['tag', log.status === 'success' ? 'tag-success' : 'tag-warning']">
              {{ log.status === 'success' ? '同步成功' : '待重试' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">审计日志</div>
      <table class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>角色</th>
            <th>模块</th>
            <th>操作</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in overview.operationLogs" :key="log.id">
            <td>{{ log.created_at }}</td>
            <td>{{ log.user_type }}</td>
            <td>{{ log.module }}</td>
            <td>{{ log.operation }}</td>
            <td>{{ log.ip || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const overview = ref({
  workbench: {},
  verifications: [],
  payments: [],
  declarations: [],
  fund: {},
  syncLogs: [],
  operationLogs: []
});

onMounted(loadOverview);

async function loadOverview() {
  try {
    const res = await axios.get('/api/admin/overview');
    if (res.data.success) {
      overview.value = {
        workbench: {},
        verifications: [],
        payments: [],
        declarations: [],
        fund: {},
        syncLogs: [],
        operationLogs: [],
        ...res.data.data
      };
    }
  } catch (error) {
    console.error('加载后台运营管理数据失败:', error);
  }
}

function needsReview(item) {
  return item.result !== 'pass' || (item.confidence || 0) < 0.9;
}

function formatPercent(value) {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '-';
}

function formatMoney(value) {
  return `¥${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
</script>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  margin-bottom: 4px;
}

.page-header p {
  color: #666;
  font-size: 14px;
}

.grid-5 {
  grid-template-columns: repeat(5, 1fr);
}

.metric-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 20px;
  border-left: 4px solid #1890ff;
}

.metric-card.success {
  border-left-color: #52c41a;
}

.metric-card.warning {
  border-left-color: #faad14;
}

.metric-card.danger {
  border-left-color: #ff4d4f;
}

.metric-value {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 6px;
}

.metric-label {
  color: #666;
  font-size: 13px;
}

.ops-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.ops-item,
.sync-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.ops-item span,
.sync-item span {
  font-size: 13px;
  color: #666;
}

.sync-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
