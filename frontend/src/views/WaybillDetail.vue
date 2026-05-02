<template>
  <div class="waybill-detail">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">← 返回</button>
        <div>
          <h2>运单详情</h2>
          <p v-if="waybill">
            主单号: <span class="master-no">{{ waybill.masterNo }}</span>
            <span class="status-badge"
              :style="{
                backgroundColor: getStatusColor(waybill.status) + '20',
                color: getStatusColor(waybill.status),
              }"
            >
              {{ waybill.statusDisplay || getStatusDisplay(waybill.status) }}
            </span>
          </p>
        </div>
      </div>
      <div class="header-actions" v-if="waybill">
        <div v-if="showActionHint && !canSubmit && !canConfirm && !canStartReceiving && !canStartSecurity && !canCompleteSecurity && !canMarkInTransit && !canMarkArrived && !canCompletePickup" class="action-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">{{ showActionHint }}</span>
        </div>
        <button
          class="btn-action"
          v-if="canSubmit"
          @click="handleSubmit"
        >
          提交订舱
        </button>
        <button
          class="btn-action primary"
          v-if="canConfirm"
          @click="handleConfirm"
        >
          确认订舱
        </button>
        <button
          class="btn-action"
          v-if="canStartReceiving"
          @click="handleStartReceiving"
        >
          开始收货
        </button>
        <button
          class="btn-action primary"
          v-if="canStartSecurity"
          @click="handleStartSecurity"
        >
          开始安检
        </button>
        <button
          class="btn-action success"
          v-if="canCompleteSecurity"
          @click="handleSecurityPass"
        >
          安检通过
        </button>
        <button
          class="btn-action danger"
          v-if="canCompleteSecurity"
          @click="handleSecurityReject"
        >
          安检驳回
        </button>
        <button
          class="btn-action primary"
          v-if="canMarkInTransit"
          @click="handleMarkInTransit"
        >
          标记起飞
        </button>
        <button
          class="btn-action primary"
          v-if="canMarkArrived"
          @click="handleMarkArrived"
        >
          标记到港
        </button>
        <button
          class="btn-action success"
          v-if="canCompletePickup"
          @click="handleCompletePickup"
        >
          完成提货
        </button>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <p>加载中...</p>
    </div>

    <div v-else-if="!waybill" class="empty-state">
      <p>运单不存在</p>
    </div>

    <div class="detail-content" v-else>
      <div class="detail-grid">
        <div class="detail-section">
          <div class="section-title">基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">主单号</span>
              <span class="value">{{ waybill.masterNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">订舱号</span>
              <span class="value">{{ waybill.bookingNo || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前状态</span>
              <span class="value">
                <span class="status-badge"
                  :style="{
                    backgroundColor: getStatusColor(waybill.status) + '20',
                    color: getStatusColor(waybill.status),
                  }"
                >
                  {{ waybill.statusDisplay || getStatusDisplay(waybill.status) }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="label">当前节点</span>
              <span class="value">{{ getNodeDisplay(waybill.currentNode) }}</span>
            </div>
            <div class="info-item">
              <span class="label">航线</span>
              <span class="value">{{ waybill.originAirport }} → {{ waybill.destinationAirport }}</span>
            </div>
            <div class="info-item">
              <span class="label">优先级</span>
              <span class="value">{{ getPriorityDisplay(waybill.priority) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">收发件人</div>
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="label">发件人</span>
              <span class="value">{{ waybill.shipperName }}</span>
            </div>
            <div class="info-item">
              <span class="label">发件人电话</span>
              <span class="value">{{ waybill.shipperPhone || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">发件人地址</span>
              <span class="value">{{ waybill.shipperAddress || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">收件人</span>
              <span class="value">{{ waybill.consigneeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">收件人电话</span>
              <span class="value">{{ waybill.consigneePhone || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">收件人地址</span>
              <span class="value">{{ waybill.consigneeAddress || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">货物信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">总件数</span>
              <span class="value">{{ waybill.totalPieces }} 件</span>
            </div>
            <div class="info-item">
              <span class="label">总重量</span>
              <span class="value">{{ waybill.totalWeight }} kg</span>
            </div>
            <div class="info-item">
              <span class="label">总体积</span>
              <span class="value">{{ waybill.totalVolume }} m³</span>
            </div>
            <div class="info-item">
              <span class="label">是否危险品</span>
              <span class="value">{{ waybill.isDangerous ? '是' : '否' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">货物描述</span>
              <span class="value">{{ waybill.goodsDescription || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">备注</span>
              <span class="value">{{ waybill.remark || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">时间节点</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(waybill.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">订舱时间</span>
              <span class="value">{{ waybill.bookingDate ? formatDate(waybill.bookingDate) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">收货时间</span>
              <span class="value">{{ waybill.receivingDate ? formatDate(waybill.receivingDate) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">安检时间</span>
              <span class="value">{{ waybill.securityDate ? formatDate(waybill.securityDate) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">装机时间</span>
              <span class="value">{{ waybill.loadingDate ? formatDate(waybill.loadingDate) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">到港时间</span>
              <span class="value">{{ waybill.arrivalDate ? formatDate(waybill.arrivalDate) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">提货时间</span>
              <span class="value">{{ waybill.pickupDate ? formatDate(waybill.pickupDate) : '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-section" v-if="waybill.details && waybill.details.length > 0">
        <div class="section-title">货物明细</div>
        <div class="detail-table">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>货物名称</th>
                <th>件数</th>
                <th>重量(kg)</th>
                <th>体积(m³)</th>
                <th>是否危险品</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(detail, index) in waybill.details" :key="detail.id">
                <td>{{ index + 1 }}</td>
                <td>{{ detail.goodsName }}</td>
                <td>{{ detail.pieces }}</td>
                <td>{{ detail.weight }}</td>
                <td>{{ detail.volume || '-' }}</td>
                <td>{{ detail.isDangerous ? '是' : '否' }}</td>
                <td>{{ detail.statusDisplay }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="detail-section" v-if="timeline && timeline.length > 0">
        <div class="section-title">状态时间线</div>
        <div class="timeline">
          <div
            v-for="(flow, index) in timeline"
            :key="flow.id"
            class="timeline-item"
          >
            <div
              class="timeline-dot"
              :style="{ backgroundColor: flow.timelineColor || '#667eea' }"
            >
              {{ getTimelineIcon(flow.flowType) }}
            </div>
            <div class="timeline-line" v-if="index < timeline.length - 1"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="flow-type" :style="{ color: flow.timelineColor || '#667eea' }">
                  {{ flow.flowTypeDisplay }}
                </span>
                <span class="flow-node">{{ flow.flowNodeDisplay }}</span>
              </div>
              <div class="timeline-body">
                <p v-if="flow.content" class="flow-content">{{ flow.content }}</p>
                <p v-if="flow.fromStatusDisplay" class="flow-status">
                  {{ flow.fromStatusDisplay }} → {{ flow.toStatusDisplay }}
                </p>
                <p v-if="flow.rejectReason" class="flow-reject">
                  驳回原因: {{ flow.rejectReason }}
                </p>
              </div>
              <div class="timeline-footer">
                <span class="operator">{{ flow.operatorName }} ({{ flow.operatorRoleDisplay }})</span>
                <span class="time">{{ formatDate(flow.flowTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { waybillApi } from '@/api';
import {
  STATUS_DISPLAY_MAP,
  STATUS_COLOR_MAP,
  FLOW_NODE_DISPLAY_MAP,
  WaybillStatus,
  FlowNode,
  FlowType,
  UserRole,
} from '@/types';
import { hasRoleForAction, isCurrentUserResponsible, getCurrentUserRole } from '@/utils/permissions';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const waybill = ref<any>(null);
const timeline = ref<any[]>([]);
const todos = ref<any[]>([]);
const securityChecks = ref<any[]>([]);

const currentUserRole = computed(() => getCurrentUserRole());

const canSubmit = computed(
  () =>
    waybill.value?.status === WaybillStatus.DRAFT &&
    hasRoleForAction(WaybillStatus.DRAFT)
);
const canConfirm = computed(
  () =>
    waybill.value?.status === WaybillStatus.BOOKING_SUBMITTED &&
    hasRoleForAction(WaybillStatus.BOOKING_SUBMITTED)
);
const canStartReceiving = computed(
  () =>
    waybill.value?.status === WaybillStatus.BOOKING_CONFIRMED &&
    hasRoleForAction(WaybillStatus.BOOKING_CONFIRMED)
);
const canStartSecurity = computed(
  () =>
    waybill.value?.status === WaybillStatus.RECEIVED &&
    hasRoleForAction(WaybillStatus.RECEIVED)
);
const canCompleteSecurity = computed(
  () =>
    waybill.value?.status === WaybillStatus.SECURITY_CHECKING &&
    hasRoleForAction(WaybillStatus.SECURITY_CHECKING)
);
const canMarkInTransit = computed(
  () =>
    (waybill.value?.status === WaybillStatus.SECURITY_PASSED ||
      waybill.value?.status === WaybillStatus.LOADING) &&
    (hasRoleForAction(WaybillStatus.SECURITY_PASSED) ||
      hasRoleForAction(WaybillStatus.LOADING))
);
const canMarkArrived = computed(
  () =>
    waybill.value?.status === WaybillStatus.IN_TRANSIT &&
    hasRoleForAction(WaybillStatus.IN_TRANSIT)
);
const canCompletePickup = computed(
  () =>
    (waybill.value?.status === WaybillStatus.ARRIVED ||
      waybill.value?.status === WaybillStatus.PICKING_UP) &&
    (hasRoleForAction(WaybillStatus.ARRIVED) ||
      hasRoleForAction(WaybillStatus.PICKING_UP))
);

const showActionHint = computed(() => {
  if (!waybill.value) return '';
  const status = waybill.value.status;
  const responsibleRole = waybill.value.currentResponsibleRole;

  const roleHints: Record<string, string> = {
    [WaybillStatus.DRAFT]: '当前需货代提交订舱',
    [WaybillStatus.BOOKING_SUBMITTED]: '当前需航司确认订舱',
    [WaybillStatus.BOOKING_CONFIRMED]: '当前需仓库收货',
    [WaybillStatus.RECEIVING]: '当前需仓库处理收货',
    [WaybillStatus.RECEIVED]: '当前需安检处理',
    [WaybillStatus.SECURITY_CHECKING]: '当前需安检处理',
    [WaybillStatus.SECURITY_PASSED]: '当前需航司处理装机',
    [WaybillStatus.SECURITY_REJECTED]: '当前需货代重新提交',
    [WaybillStatus.LOADING]: '当前需航司处理装机',
    [WaybillStatus.IN_TRANSIT]: '当前需航司处理到港',
    [WaybillStatus.ARRIVED]: '当前需收货人提货',
    [WaybillStatus.PICKING_UP]: '当前需收货人提货',
  };

  return roleHints[status] || '';
});

function getStatusDisplay(status: string): string {
  return STATUS_DISPLAY_MAP[status as WaybillStatus] || status;
}

function getStatusColor(status: string): string {
  return STATUS_COLOR_MAP[status as WaybillStatus] || '#8c8c8c';
}

function getNodeDisplay(node?: string): string {
  if (!node) return '-';
  return FLOW_NODE_DISPLAY_MAP[node as FlowNode] || node;
}

function getPriorityDisplay(priority?: string): string {
  const map: Record<string, string> = {
    normal: '普通',
    urgent: '加急',
    express: '特快',
  };
  return map[priority || 'normal'] || '普通';
}

function getTimelineIcon(flowType: string): string {
  const map: Record<string, string> = {
    [FlowType.STATUS_CHANGE]: '↻',
    [FlowType.ACTION]: '✓',
    [FlowType.COMMENT]: '💬',
    [FlowType.APPROVAL]: '☑',
    [FlowType.REJECT]: '✗',
    [FlowType.CANCEL]: '∅',
    [FlowType.EXCEPTION]: '⚠',
    [FlowType.CORRECTION]: '✎',
    [FlowType.REOPEN]: '↺',
  };
  return map[flowType] || '•';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function goBack() {
  router.push('/waybills');
}

async function loadDetail() {
  loading.value = true;
  try {
    const waybillId = route.params.id as string;
    const result = await waybillApi.getDetail(waybillId);
    waybill.value = result?.waybill;
    timeline.value = result?.timeline || [];
    todos.value = result?.todos || [];
    securityChecks.value = result?.securityChecks || [];
  } catch (error) {
    console.error('加载运单详情失败:', error);
    alert('加载运单详情失败');
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!confirm('确定要提交订舱吗？')) return;
  try {
    await waybillApi.submitBooking(waybill.value.id);
    alert('订舱提交成功');
    loadDetail();
  } catch (error: any) {
    alert('提交失败: ' + (error.message || '未知错误'));
  }
}

async function handleConfirm() {
  if (!confirm('确定要确认订舱吗？')) return;
  try {
    await waybillApi.confirmBooking(waybill.value.id);
    alert('订舱确认成功');
    loadDetail();
  } catch (error: any) {
    alert('确认失败: ' + (error.message || '未知错误'));
  }
}

async function handleStartReceiving() {
  if (!confirm('确定要开始收货吗？')) return;
  try {
    await waybillApi.startReceiving(waybill.value.id);
    alert('已开始收货');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleStartSecurity() {
  if (!confirm('确定要开始安检吗？')) return;
  try {
    await waybillApi.startSecurityCheck(waybill.value.id);
    alert('已开始安检');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleSecurityPass() {
  if (!confirm('确定要标记安检通过吗？')) return;
  try {
    await waybillApi.processSecurityCheck({
      waybillId: waybill.value.id,
      result: 'passed',
      checkLevel: 'normal',
    });
    alert('安检通过');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleSecurityReject() {
  const reason = prompt('请输入驳回原因:');
  if (!reason) return;
  try {
    await waybillApi.processSecurityCheck({
      waybillId: waybill.value.id,
      result: 'rejected',
      rejectReason: reason,
    });
    alert('安检已驳回');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleMarkInTransit() {
  if (!confirm('确定要标记航班已起飞吗？')) return;
  try {
    await waybillApi.markInTransit(waybill.value.id);
    alert('已标记为运输中');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleMarkArrived() {
  if (!confirm('确定要标记货物已到港吗？')) return;
  try {
    await waybillApi.markArrived(waybill.value.id);
    alert('已标记为已到港');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

async function handleCompletePickup() {
  if (!confirm('确定要完成提货吗？')) return;
  try {
    await waybillApi.completePickup(waybill.value.id);
    alert('提货完成，运单已结束');
    loadDetail();
  } catch (error: any) {
    alert('操作失败: ' + (error.message || '未知错误'));
  }
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.waybill-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.btn-back {
  margin-top: 4px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
}

.btn-back:hover {
  border-color: #667eea;
  color: #667eea;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.header-left p {
  color: #8c8c8c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.master-no {
  font-family: monospace;
  font-weight: 600;
  color: #667eea;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.action-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  margin-right: 8px;
}

.hint-icon {
  font-size: 16px;
}

.hint-text {
  font-size: 13px;
  color: #fa8c16;
}

.btn-action {
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
}

.btn-action:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-action.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-action.primary:hover {
  opacity: 0.9;
}

.btn-action.success {
  background: #52c41a;
  color: white;
  border: none;
}

.btn-action.success:hover {
  opacity: 0.9;
}

.btn-action.danger {
  background: #ff4d4f;
  color: white;
  border: none;
}

.btn-action.danger:hover {
  opacity: 0.9;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 48px;
  color: #8c8c8c;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.detail-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 12px;
  border-bottom: 2px solid #667eea;
  margin-bottom: 20px;
  display: inline-block;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 13px;
  color: #8c8c8c;
}

.info-item .value {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.detail-table {
  overflow-x: auto;
}

.detail-table table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table th {
  padding: 12px;
  background: #fafafa;
  text-align: left;
  font-weight: 600;
  color: #262626;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #262626;
}

.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-dot {
  position: absolute;
  left: -32px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: -21px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: #e8e8e8;
}

.timeline-content {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  margin-left: 8px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.flow-type {
  font-weight: 600;
  font-size: 14px;
}

.flow-node {
  color: #8c8c8c;
  font-size: 13px;
}

.timeline-body {
  margin-bottom: 8px;
}

.flow-content {
  color: #262626;
  margin: 0 0 4px 0;
}

.flow-status {
  color: #8c8c8c;
  font-size: 13px;
  margin: 0 0 4px 0;
}

.flow-reject {
  color: #ff4d4f;
  font-size: 13px;
  margin: 0;
}

.timeline-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
}

.timeline-footer .operator {
  color: #595959;
  font-size: 13px;
}

.timeline-footer .time {
  color: #8c8c8c;
  font-size: 12px;
}
</style>
