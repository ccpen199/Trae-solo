<template>
  <div class="passenger-track">
    <div class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">机场行李追踪系统</h1>
          <p class="hero-subtitle">实时追踪您的行李状态，让旅行更安心</p>
          <div class="search-box">
            <el-input
              v-model="baggageTag"
              placeholder="请输入行李牌号码，例如 BN000001"
              size="large"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
              <template #append>
                <el-button type="primary" size="large" @click="handleSearch" :loading="loading">
                  查询
                </el-button>
              </template>
            </el-input>
          </div>
          <div class="quick-links">
            <el-tag type="info" size="large" effect="dark">示例行李牌：BN000001 / BN000002</el-tag>
            <el-tag type="success" size="large" effect="dark">24小时服务热线：400-888-8888</el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <div v-if="error" class="alert-banner" :class="errorType">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <el-icon style="margin-top:2px;"><WarningFilled /></el-icon>
          <div>
            <div style="font-weight:600;margin-bottom:4px;">{{ errorTitle }}</div>
            <div>{{ errorMessage }}</div>
            <div v-if="errorSuggestion" style="margin-top:6px;font-size:13px;opacity:0.85;">
              {{ errorSuggestion }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="result" class="query-result">
        <div class="baggage-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="baggage-tag">{{ result.baggage.baggage_tag }}</div>
              <div style="margin-top:8px;">
                <el-tag :type="getStatusType(result.baggage.status)" size="large" effect="dark">
                  {{ getStatusText(result.baggage.status) }}
                </el-tag>
              </div>
            </div>
            <div style="text-align:right;color:rgba(255,255,255,0.8);font-size:14px;">
              <div>更新时间：{{ formatTime(result.baggage.updated_at) }}</div>
            </div>
          </div>
          <div class="baggage-info">
            <div class="baggage-info-item">
              <div class="baggage-info-label">旅客姓名</div>
              <div class="baggage-info-value">{{ result.baggage.passenger_name }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">联系电话</div>
              <div class="baggage-info-value">{{ result.baggage.passenger_phone || '-' }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">航班号</div>
              <div class="baggage-info-value">{{ result.baggage.flight_no }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">航班日期</div>
              <div class="baggage-info-value">{{ result.baggage.flight_date }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">航线</div>
              <div class="baggage-info-value">{{ result.baggage.departure }} → {{ result.baggage.destination }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">件数 / 重量</div>
              <div class="baggage-info-value">{{ result.baggage.pieces }} 件 / {{ result.baggage.weight }} kg</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">托运时间</div>
              <div class="baggage-info-value">{{ formatTime(result.baggage.check_in_time) }}</div>
            </div>
            <div class="baggage-info-item">
              <div class="baggage-info-label">当前状态</div>
              <div class="baggage-info-value">{{ getStatusText(result.baggage.status) }}</div>
            </div>
          </div>
        </div>

        <div v-if="latestNode" class="card" style="border-left:4px solid #409eff;">
          <h3 style="font-size:18px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;">
            <el-icon style="color:#409eff;margin-right:8px;"><Location /></el-icon>
            最新位置
          </h3>
          <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
            <div>
              <div style="font-size:24px;font-weight:700;color:#303133;">{{ latestNode.node_name }}</div>
              <div style="font-size:14px;color:#909399;margin-top:4px;">{{ formatTime(latestNode.node_time) }}</div>
            </div>
            <div v-if="latestNode.location" style="font-size:14px;color:#606266;">
              位置：{{ latestNode.location }}
            </div>
            <div v-if="latestNode.operator" style="font-size:14px;color:#606266;">
              操作员：{{ latestNode.operator }}
            </div>
          </div>
        </div>

        <div v-if="result.has_missing_nodes" class="alert-banner warning">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <el-icon style="margin-top:2px;"><WarningFilled /></el-icon>
            <div>
              <div style="font-weight:600;margin-bottom:4px;">节点缺失告警</div>
              <div>以下环节信息缺失，行李可能在运输途中出现问题：
                <span v-for="(n, idx) in result.missing_nodes" :key="n">
                  {{ getNodeName(n) }}<span v-if="idx < result.missing_nodes.length - 1">、</span>
                </span>
              </div>
              <div style="margin-top:6px;font-size:13px;opacity:0.85;">
                请前往行李查询柜台（T2航站楼1层）或拨打 400-888-8888 咨询
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;">
            <el-icon style="color:#409eff;margin-right:8px;"><Timer /></el-icon>
            行李追踪节点（托运 → 领取）
          </h3>
          <div class="timeline">
            <div
              v-for="node in expectedNodes"
              :key="node.type"
              :class="['timeline-node', getNodeStatusClass(node.type)]"
            >
              <div class="node-title">{{ node.name }}</div>
              <template v-if="getNodeByType(node.type)">
                <div class="node-time">{{ formatTime(getNodeByType(node.type).node_time) }}</div>
                <div v-if="getNodeByType(node.type).location" class="node-location">
                  位置：{{ getNodeByType(node.type).location }}
                </div>
                <div v-if="getNodeByType(node.type).operator" class="node-location">
                  操作员：{{ getNodeByType(node.type).operator }}
                </div>
                <div v-if="getNodeByType(node.type).remark" class="node-location">
                  备注：{{ getNodeByType(node.type).remark }}
                </div>
              </template>
              <template v-else>
                <div class="node-time" style="color:#c0c4cc;">待处理</div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="result.exceptions && result.exceptions.length > 0" class="card">
          <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;">
            <el-icon style="color:#f56c6c;margin-right:8px;"><WarningFilled /></el-icon>
            异常记录与处理进度
          </h3>
          <div v-for="ex in result.exceptions" :key="ex.id" class="exception-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div class="exception-type">{{ ex.exception_name }}</div>
                <div class="exception-description">{{ ex.description || '暂无详细描述' }}</div>
              </div>
              <el-tag :type="getExceptionStatusType(ex.status)" size="small">
                {{ getExceptionStatus(ex.status) }}
              </el-tag>
            </div>
            <div class="exception-meta">
              查询单号：<strong>{{ ex.inquiry_no }}</strong> · 上报时间：{{ formatTime(ex.report_time) }}
              <span v-if="ex.reporter"> · 上报人：{{ ex.reporter }}</span>
            </div>
            <div v-if="getExceptionProgress(ex.id).length > 0" style="margin-top:12px;">
              <div style="font-size:13px;color:#909399;margin-bottom:8px;">处理进度：</div>
              <div v-for="item in getExceptionProgress(ex.id)" :key="item.id" class="progress-item" :class="item.status">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="font-weight:600;">{{ getProgressStatus(item.status) }}</div>
                  <div style="font-size:12px;color:#909399;">{{ formatTime(item.created_at) }}</div>
                </div>
                <div style="color:#606266;margin:4px 0;">{{ item.remark || '无备注' }}</div>
                <div style="font-size:12px;color:#909399;">操作人：{{ item.operator || '系统' }}</div>
              </div>
            </div>
            <div v-else style="margin-top:8px;">
              <div style="font-size:13px;color:#909399;">暂无处理进度，请联系行李查询柜台了解详情</div>
            </div>
          </div>
        </div>

        <div v-if="result.compensations && result.compensations.length > 0" class="card">
          <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;">
            <el-icon style="color:#e6a23c;margin-right:8px;"><Money /></el-icon>
            赔付审批记录
          </h3>
          <div v-for="comp in result.compensations" :key="comp.id" class="compensation-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div style="font-size:20px;font-weight:700;color:#e6a23c;">¥{{ comp.amount }}</div>
              <el-tag :type="getCompStatusType(comp.approval_status)" size="small">
                {{ getCompStatus(comp.approval_status) }}
              </el-tag>
            </div>
            <div class="comp-detail">
              <div class="comp-detail-item">
                <span class="comp-label">责任方：</span>{{ comp.responsible_party }}
              </div>
              <div v-if="comp.compensation_standard" class="comp-detail-item">
                <span class="comp-label">赔付标准：</span>{{ comp.compensation_standard }}
              </div>
              <div v-if="comp.applicant" class="comp-detail-item">
                <span class="comp-label">申请人：</span>{{ comp.applicant }}
              </div>
              <div v-if="comp.approver" class="comp-detail-item">
                <span class="comp-label">审批人：</span>{{ comp.approver }}
              </div>
              <div v-if="comp.approval_time" class="comp-detail-item">
                <span class="comp-label">审批时间：</span>{{ formatTime(comp.approval_time) }}
              </div>
              <div v-if="comp.close_reason" class="comp-detail-item">
                <span class="comp-label">关闭原因：</span>{{ comp.close_reason }}
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:18px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;">
            <el-icon style="color:#67c23a;margin-right:8px;"><Phone /></el-icon>
            联系方式
          </h3>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
            <div style="background:#f5f7fa;padding:16px;border-radius:8px;text-align:center;">
              <div style="font-size:13px;color:#909399;margin-bottom:4px;">行李查询柜台</div>
              <div style="font-size:20px;font-weight:700;color:#303133;">400-888-8888</div>
              <div style="font-size:12px;color:#909399;margin-top:4px;">24小时服务</div>
            </div>
            <div style="background:#f5f7fa;padding:16px;border-radius:8px;text-align:center;">
              <div style="font-size:13px;color:#909399;margin-bottom:4px;">航空公司服务</div>
              <div style="font-size:20px;font-weight:700;color:#303133;">95530</div>
              <div style="font-size:12px;color:#909399;margin-top:4px;">航班相关问题</div>
            </div>
            <div style="background:#f5f7fa;padding:16px;border-radius:8px;text-align:center;">
              <div style="font-size:13px;color:#909399;margin-bottom:4px;">机场服务热线</div>
              <div style="font-size:20px;font-weight:700;color:#303133;">021-96990</div>
              <div style="font-size:12px;color:#909399;margin-top:4px;">综合咨询</div>
            </div>
          </div>
          <div v-if="result.baggage.passenger_phone" style="margin-top:12px;padding:12px;background:#ecf5ff;border-radius:8px;font-size:14px;color:#409eff;">
            <el-icon style="margin-right:4px;"><Phone /></el-icon>
            旅客预留电话：{{ result.baggage.passenger_phone }}
          </div>
        </div>

        <div class="card" style="text-align:center;">
          <el-divider>管理与运营入口</el-divider>
          <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">
            <el-button type="primary" size="large" @click="$router.push('/admin/dashboard')">
              <el-icon><DataAnalysis /></el-icon> 运营概览
            </el-button>
            <el-button size="large" @click="$router.push('/admin/baggage')">
              <el-icon><Suitcase /></el-icon> 行李档案
            </el-button>
            <el-button size="large" @click="$router.push('/admin/exceptions')">
              <el-icon><Warning /></el-icon> 异常处理
            </el-button>
            <el-button size="large" @click="$router.push('/admin/compensation')">
              <el-icon><Money /></el-icon> 赔付管理
            </el-button>
            <el-button size="large" @click="$router.push('/admin/stats')">
              <el-icon><TrendCharts /></el-icon> 统计分析
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="!result && !error && !loading" class="empty-state">
        <el-icon class="empty-icon"><Search /></el-icon>
        <div class="empty-text">输入行李牌号码查询行李状态</div>
        <div class="empty-desc">行李牌号码通常打印在行李托运凭证上</div>
        <div style="margin-top:24px;">
          <el-button type="primary" @click="$router.push('/admin/dashboard')">
            <el-icon><Setting /></el-icon> 进入管理后台
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { baggageApi } from '../api'

const baggageTag = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')
const errorType = ref('')
const errorTitle = ref('')
const errorMessage = ref('')
const errorSuggestion = ref('')

const expectedNodes = [
  { type: 'check_in', name: '托运' },
  { type: 'security', name: '安检' },
  { type: 'loading', name: '装机' },
  { type: 'transfer', name: '中转' },
  { type: 'unloading', name: '卸机' },
  { type: 'carousel', name: '转盘' },
  { type: 'pickup', name: '领取' }
]

const latestNode = computed(() => {
  if (!result.value?.nodes?.length) return null
  return result.value.nodes[result.value.nodes.length - 1]
})

function clearError() {
  error.value = ''
  errorType.value = ''
  errorTitle.value = ''
  errorMessage.value = ''
  errorSuggestion.value = ''
}

function showError(type, title, message, suggestion) {
  error.value = title
  errorType.value = type
  errorTitle.value = title
  errorMessage.value = message
  errorSuggestion.value = suggestion || ''
}

async function handleSearch() {
  if (!baggageTag.value.trim()) {
    ElMessage.warning('请输入行李牌号码')
    return
  }
  loading.value = true
  clearError()
  result.value = null
  const tag = baggageTag.value.trim().toUpperCase()

  try {
    const data = await baggageApi.getFull(tag)
    if (!data || !data.baggage) {
      showError(
        'warning',
        '行李记录不完整',
        `行李牌 "${tag}" 的查询结果数据不完整，无法显示完整信息。`,
        '请联系行李查询柜台（T2航站楼1层），或拨打 400-888-8888 获取帮助。'
      )
      return
    }
    result.value = {
      baggage: data.baggage,
      nodes: data.nodes || [],
      exceptions: data.exceptions || [],
      compensations: data.compensations || [],
      progress: data.progress || [],
      missing_nodes: data.missing_nodes || [],
      has_missing_nodes: data.has_missing_nodes || false
    }
  } catch (err) {
    const status = err?.response?.status
    if (status === 404) {
      showError(
        'danger',
        '未找到行李记录',
        `行李牌 "${tag}" 不存在于系统中。请检查行李牌号码是否正确（注意字母和数字），确认是否为本次航班托运行李。`,
        '如确认行李牌无误，请前往行李查询柜台（T2航站楼1层）办理人工查询，或拨打 400-888-8888。'
      )
    } else if (status === 0 || !err?.response) {
      showError(
        'danger',
        '网络连接失败',
        '无法连接到查询服务器，请检查网络连接后重试。',
        '如持续无法查询，请前往行李查询柜台（T2航站楼1层）或拨打 400-888-8888 获取帮助。'
      )
    } else if (status >= 500) {
      showError(
        'danger',
        '服务器异常',
        '查询服务暂时不可用，请稍后重试。',
        '如急需查询行李状态，请前往行李查询柜台（T2航站楼1层）或拨打 400-888-8888。'
      )
    } else {
      showError(
        'warning',
        '查询失败',
        `查询行李牌 "${tag}" 时发生错误（错误码：${status || '未知'}），请稍后重试。`,
        '如问题持续，请联系行李查询柜台（400-888-8888）转人工服务处理。'
      )
    }
  } finally {
    loading.value = false
  }
}

function getExceptionProgress(exceptionId) {
  if (!result.value?.progress) return []
  return result.value.progress.filter(p => p.exception_id === exceptionId)
}

function getNodeByType(type) {
  return result.value?.nodes?.find(n => n.node_type === type)
}

function getNodeStatusClass(type) {
  const node = getNodeByType(type)
  if (node) return 'completed'
  const existingTypes = result.value?.nodes?.map(n => n.node_type) || []
  const currentIndex = expectedNodes.findIndex(n => n.type === type)
  const hasLater = expectedNodes.slice(currentIndex + 1).some(n => existingTypes.includes(n.type))
  if (hasLater) return 'missing'
  return 'pending'
}

function getNodeName(type) {
  const node = expectedNodes.find(n => n.type === type)
  return node?.name || type
}

function getStatusType(status) {
  return { in_transit: 'primary', arrived: 'success', picked_up: 'success', exception: 'danger', lost: 'danger' }[status] || 'info'
}

function getStatusText(status) {
  return { in_transit: '运输中', arrived: '已到达', picked_up: '已领取', exception: '异常', lost: '遗失' }[status] || status
}

function getExceptionStatus(status) {
  return { open: '处理中', in_progress: '调查中', resolved: '已解决', closed: '已关闭' }[status] || status
}

function getExceptionStatusType(status) {
  return { open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'info' }[status] || 'info'
}

function getProgressStatus(status) {
  return { open: '处理中', in_progress: '调查中', resolved: '已解决', closed: '已关闭' }[status] || status
}

function getCompStatus(status) {
  return { pending: '待审批', approved: '已批准', rejected: '已拒绝', paid: '已支付' }[status] || status
}

function getCompStatusType(status) {
  return { pending: 'warning', approved: 'success', rejected: 'danger', paid: 'success' }[status] || 'info'
}

function formatTime(time) {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  } catch { return time }
}
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60px 0;
  margin-bottom: 40px;
}
.hero-content { text-align: center; color: #fff; }
.hero-title { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
.hero-subtitle { font-size: 18px; opacity: 0.9; margin-bottom: 32px; }
.search-box { max-width: 600px; margin: 0 auto 24px; }
.search-box :deep(.el-input__wrapper) { border-radius: 8px 0 0 8px; }
.search-box :deep(.el-input-group__append) { border-radius: 0 8px 8px 0; }
.quick-links { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

.progress-item {
  background: #f5f7fa; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;
  border-left: 3px solid #409eff;
}
.progress-item.resolved { border-left-color: #67c23a; }
.progress-item.closed { border-left-color: #909399; }
.progress-item.in_progress { border-left-color: #e6a23c; }

.compensation-card {
  background: #fffbf0; border: 1px solid #fae0b5; border-radius: 8px;
  padding: 16px; margin-bottom: 12px;
}
.comp-detail { font-size: 14px; color: #606266; }
.comp-detail-item { margin-top: 4px; }
.comp-label { color: #909399; }
</style>
