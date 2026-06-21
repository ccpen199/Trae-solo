<template>
  <div class="home-page">
    <div class="header">
      <div class="header-bg"></div>
      <div class="user-row">
        <div class="user-info" @click="goToProfile">
          <div class="avatar">
            <span>{{ userInfo?.real_name?.charAt(0) || '用' }}</span>
          </div>
          <div class="user-detail">
            <div class="greeting">{{ greeting }}，{{ userInfo?.real_name || '游客' }}</div>
            <div class="subtitle">
              <van-tag type="success" plain size="mini">已实名</van-tag>
              <span class="cert-count">{{ identityStats.cert_integrated_count || 0 }}/12 证件整合</span>
            </div>
          </div>
          <van-icon name="arrow" color="#fff" />
        </div>
        <div class="header-actions">
          <div class="action-btn" @click="goToVoiceInput">
            <van-icon name="microphone" size="22" />
          </div>
          <div class="action-btn" @click="goToService">
            <van-icon name="service-o" size="22" />
          </div>
        </div>
      </div>

      <div class="search-bar" @click="showSearch = true">
        <van-icon name="search" size="16" color="#999" />
        <span class="search-placeholder">搜索服务事项、网点、证件...</span>
      </div>
    </div>

    <div class="page-content">
      <div class="quick-actions card">
        <div class="action-item" @click="goToCode">
          <div class="action-wrap">
            <div class="action-icon code">
              <van-icon name="qr" size="26" />
            </div>
            <span class="action-label">亮码</span>
          </div>
          <span class="hot-tag">常用</span>
        </div>
        <div class="action-item" @click="goToSmartMatch">
          <div class="action-wrap">
            <div class="action-icon match">
              <van-icon name="balance-o" size="26" />
            </div>
            <span class="action-label">智能匹配</span>
          </div>
        </div>
        <div class="action-item" @click="goToMap">
          <div class="action-wrap">
            <div class="action-icon map">
              <van-icon name="location-o" size="26" />
            </div>
            <span class="action-label">附近网点</span>
          </div>
        </div>
        <div class="action-item" @click="goToAppointment">
          <div class="action-wrap">
            <div class="action-icon appt">
              <van-icon name="calendar-o" size="26" />
            </div>
            <span class="action-label">在线预约</span>
          </div>
          <span class="badge" v-if="overview.today_appointments > 0">{{ overview.today_appointments }}</span>
        </div>
        <div class="action-item" @click="goToARNavWithParams">
          <div class="action-wrap">
            <div class="action-icon ar">
              <span class="ar-icon">AR</span>
            </div>
            <span class="action-label">实景导航</span>
          </div>
          <span class="new-tag">新</span>
        </div>
        <div class="action-item" @click="goToAgent">
          <div class="action-wrap">
            <div class="action-icon agent">
              <van-icon name="friends-o" size="26" />
            </div>
            <span class="action-label">亲友代办</span>
          </div>
          <span class="badge warn" v-if="identityStats.pending_agent_ops_count > 0">{{ identityStats.pending_agent_ops_count }}</span>
        </div>
        <div class="action-item" @click="toggleElderModeLocal">
          <div class="action-wrap">
            <div class="action-icon elder" :class="{ active: isElder }">
              <van-icon name="heart-o" size="26" />
            </div>
            <span class="action-label">长辈版</span>
          </div>
          <van-switch v-model="isElder" size="16px" active-color="#f4511e" @change="onElderChange" />
        </div>
        <div class="action-item" @click="goToAdmin">
          <div class="action-wrap">
            <div class="action-icon admin">
              <van-icon name="chart-trending-o" size="26" />
            </div>
            <span class="action-label">工作台</span>
          </div>
        </div>
      </div>

      <div class="identity-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot blue"></span>
            电子身份码
          </div>
          <span class="section-more" @click="goToCode">立即亮码 <van-icon name="arrow" size="12" /></span>
        </div>

        <div class="code-display" @click="goToCode">
          <div class="qr-area">
            <div class="qr-placeholder">
              <van-icon name="qr" size="56" color="#1976d2" />
            </div>
            <div class="code-status-row">
              <span class="code-type active-dynamic">
                <span class="type-dot green"></span>动态码
              </span>
              <span class="code-type offline" :class="{ active: identityStats.offline_codes_count > 0 }" @click.stop="goToCode">
                <span class="type-dot"></span>离线码
                <span class="offline-count" v-if="identityStats.offline_codes_count > 0">{{ identityStats.offline_codes_count }}张可用</span>
              </span>
            </div>
          </div>

          <div class="code-info">
            <div class="info-row">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ userInfo?.real_name || '***' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">证件号</span>
              <span class="info-value">{{ maskedIdCard }}</span>
            </div>
            <div class="info-row risk-row">
              <span class="info-label">风险评分</span>
              <div class="risk-circle" :class="'risk-circle-' + riskLevel">
                <span class="risk-score">{{ identityStats.risk_score || 0 }}</span>
              </div>
              <span class="risk-tag" :class="'risk-' + riskLevel">{{ riskText }}</span>
            </div>
          </div>
        </div>

        <div class="offline-codes" v-if="identityStats.offline_codes_list && identityStats.offline_codes_list.length > 0">
          <div class="offline-title">
            <van-icon name="shield-o" size="14" color="#ff9800" />
            有效离线码
          </div>
          <div class="offline-list">
            <div v-for="oc in identityStats.offline_codes_list" :key="oc.id" class="offline-item">
              <span class="offline-token">{{ oc.code_token?.slice(0, 8) }}...</span>
              <span class="offline-risk" :class="'risk-' + oc.risk_level">风险{{ oc.risk_score }}</span>
              <span class="offline-expire">有效期至 {{ formatTime(oc.expire_at) }}</span>
            </div>
          </div>
        </div>

        <div class="cert-summary">
          <div class="cert-summary-title">
            <span>12类证件统一承载</span>
            <span class="cert-count-num">{{ identityStats.cert_integrated_count || 0 }}/12</span>
          </div>
          <div class="cert-chips">
            <span
              v-for="c in cert12List"
              :key="c.type"
              class="cert-chip"
              :class="{ done: c.integrated, pending: !c.integrated }"
              @click="goToCerts"
            >
              <van-icon :name="c.integrated ? 'success' : 'warning-o'" size="12" />
              {{ c.name }}
            </span>
          </div>
        </div>

        <div class="code-verify" v-if="identityStats.recent_code_records && identityStats.recent_code_records.length > 0">
          <div class="verify-title">
            <van-icon name="checked" size="14" color="#43a047" />
            动态校验记录
          </div>
          <div class="verify-list">
            <div v-for="r in identityStats.recent_code_records.slice(0, 3)" :key="r.id" class="verify-item">
              <span class="verify-type" :class="r.is_offline ? 'offline' : 'dynamic'">{{ r.is_offline ? '离线' : '动态' }}</span>
              <span class="verify-risk" :class="'risk-' + r.risk_level">风险{{ r.risk_score }}</span>
              <span class="verify-time">{{ formatTime(r.created_at) }}</span>
            </div>
          </div>
        </div>

        <div class="code-actions">
          <div class="code-btn" @click="goToCerts">
            <van-icon name="description" size="16" />
            <span>证件管理</span>
          </div>
          <div class="code-btn" @click="goToRisk">
            <van-icon name="shield-o" size="16" />
            <span>风险详情</span>
          </div>
          <div class="code-btn" @click="goToRecords">
            <van-icon name="clock-o" size="16" />
            <span>亮码留痕{{ identityStats.total_codes_count || 0 }}次</span>
          </div>
        </div>
      </div>

      <div class="service-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot green"></span>
            就近办理
          </div>
          <span class="section-more" @click="goToOutlets">更多网点 <van-icon name="arrow" size="12" /></span>
        </div>

        <div class="nearby-outlet" v-if="nearbyOutlet" @click="goToOutletDetail(nearbyOutlet.id)">
          <div class="outlet-info">
            <div class="outlet-name-row">
              <span class="outlet-name">{{ nearbyOutlet.name }}</span>
              <span class="outlet-distance">{{ formatDistance(nearbyOutlet.distance) }}</span>
            </div>
            <div class="outlet-addr">
              <van-icon name="location-o" size="12" /> {{ nearbyOutlet.address }}
            </div>
            <div class="outlet-status">
              <span class="queue-tag highlight">
                <van-icon name="friends-o" size="12" /> 当前排队{{ nearbyOutlet.total_queue || 0 }}人
              </span>
              <span class="window-tag">
                <van-icon name="shop-o" size="12" /> {{ nearbyOutlet.open_windows || 5 }}/{{ nearbyOutlet.total_windows || 6 }}窗开放
              </span>
              <span class="wait-tag">
                <van-icon name="clock-o" size="12" /> 约{{ nearbyOutlet.avg_wait || 15 }}分钟
              </span>
            </div>
          </div>
          <van-button size="small" type="primary" round @click.stop="goToARNavWithParams">去这里</van-button>
        </div>

        <div class="match-result" v-if="matchResult.length > 0">
          <div class="match-title">
            <van-icon name="balance-o" size="14" color="#9c27b0" />
            智能匹配推荐
            <span class="match-sub">事项×网点×空闲时段三维联动</span>
          </div>
          <div
            v-for="m in matchResult"
            :key="m.outlet_id + '-' + m.slot"
            class="match-item"
            @click="bookFromMatch(m)"
          >
            <div class="match-left">
              <span class="match-item-service">{{ m.service_name }}</span>
              <span class="match-item-outlet">{{ m.outlet_name }} · {{ m.outlet_district }}</span>
              <span class="match-item-queue">排队{{ m.total_queue }}人 / {{ m.open_windows }}窗开放</span>
            </div>
            <div class="match-mid">
              <span class="match-slot">{{ m.slot }}</span>
              <span class="match-wait">等待约{{ m.avg_wait }}分钟</span>
              <span class="match-predict">预测{{ m.predicted_count }}人</span>
            </div>
            <div class="match-right">
              <van-button size="mini" type="primary" round>立即预约</van-button>
            </div>
          </div>
        </div>

        <div class="nearby-actions">
          <div class="nearby-action-item" @click="goToSmartMatch">
            <div class="nearby-action-icon match-icon">
              <van-icon name="balance-o" size="20" />
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">智能匹配</span>
              <span class="nearby-action-desc">事项×网点×时段</span>
            </div>
          </div>
          <div class="nearby-action-item" @click="goToAppointmentWithService">
            <div class="nearby-action-icon appt-icon">
              <van-icon name="calendar-o" size="20" />
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">在线预约</span>
              <span class="nearby-action-desc">今日{{ overview.today_appointments || 0 }}人预约(确认{{ overview.today_confirmed_appointments || 0 }}/待确认{{ overview.today_pending_appointments || 0 }})</span>
            </div>
          </div>
          <div class="nearby-action-item" @click="goToARNavWithParams">
            <div class="nearby-action-icon ar-icon">
              <span style="font-size:14px;font-weight:700;font-style:italic">AR</span>
            </div>
            <div class="nearby-action-text">
              <span class="nearby-action-name">实景导航</span>
              <span class="nearby-action-desc">定位→AR步行引导</span>
            </div>
          </div>
        </div>

        <div class="service-types">
          <div class="type-item" v-for="s in serviceTypes" :key="s.name" @click="bookService(s.name, s.itemId)">
            <span class="type-icon">{{ s.icon }}</span>
            <span class="type-name">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <div class="elder-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot orange"></span>
            暖心服务
          </div>
          <span class="section-more" @click="goToElderHome">
            {{ isElder ? '退出长辈版' : '进入长辈版' }} <van-icon name="arrow" size="12" />
          </span>
        </div>

        <div class="elder-environment">
          <div class="env-row">
            <div class="env-item" :class="{ on: elderSettings.bigFont }">
              <van-icon :name="elderSettings.bigFont ? 'checked' : 'circle'" size="16" />
              <span>大字体高对比度</span>
            </div>
            <div class="env-item" :class="{ on: elderSettings.noAds }">
              <van-icon :name="elderSettings.noAds ? 'checked' : 'circle'" size="16" />
              <span>禁用弹窗广告</span>
            </div>
          </div>
          <div class="env-row">
            <div class="env-item" :class="{ on: elderSettings.voiceAssist }">
              <van-icon :name="elderSettings.voiceAssist ? 'checked' : 'circle'" size="16" />
              <span>语音输入辅助</span>
            </div>
            <div class="env-item" :class="{ on: elderSettings.quickService }">
              <van-icon :name="elderSettings.quickService ? 'checked' : 'circle'" size="16" />
              <span>人工坐席直连</span>
            </div>
          </div>
        </div>

        <div class="elder-features">
          <div class="elder-feature" @click="goToElderHome">
            <div class="feature-icon">🔤</div>
            <div class="feature-body">
              <span class="feature-name">长辈独立环境</span>
              <span class="feature-desc">{{ elderSettings.bigFont ? '已开启' : '未开启' }}：大字体/高对比/禁弹窗/语音辅助</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="elder-feature" @click="goToVoiceInput">
            <div class="feature-icon">🎤</div>
            <div class="feature-body">
              <span class="feature-name">语音办事</span>
              <span class="feature-desc">今日语音办理{{ elderServiceStats.voice_count }}次，最近{{ elderServiceStats.last_call_time }}</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="elder-feature" @click="goToService">
            <div class="feature-icon">👩‍💼</div>
            <div class="feature-body">
              <span class="feature-name">人工坐席直连</span>
              <span class="feature-desc">最近通话{{ elderServiceStats.last_call_time }}，累计{{ elderServiceStats.call_count }}次接入</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
        </div>

        <div class="agent-summary">
          <div class="agent-summary-title">亲友代办 · 授权与留痕</div>
          <div class="agent-summary-row">
            <div class="agent-stat-card" @click="goToAgent">
              <span class="agent-num">{{ identityStats.active_auth_count || 0 }}</span>
              <span class="agent-label">生效授权</span>
            </div>
            <div class="agent-stat-card warn" @click="goToAgentConfirm">
              <span class="agent-num">{{ identityStats.pending_agent_ops_count || 0 }}</span>
              <span class="agent-label">待确认操作</span>
            </div>
            <div class="agent-stat-card ok" @click="goToAgentOps">
              <span class="agent-num">{{ overview.total_agent_ops_count || 0 }}</span>
              <span class="agent-label">历史留痕</span>
            </div>
          </div>
        </div>

        <div class="auth-detail" v-if="identityStats.auth_list && identityStats.auth_list.length > 0">
          <div class="auth-detail-title">
            <van-icon name="shield-o" size="14" color="#ff9800" />
            授权范围与时效
          </div>
          <div v-for="auth in identityStats.auth_list" :key="auth.id" class="auth-item" @click="goToAgent">
            <div class="auth-left">
              <span class="auth-agent">代办人：{{ auth.agent_name }}</span>
              <span class="auth-scope">范围：{{ formatScope(auth.auth_scope) }}</span>
            </div>
            <div class="auth-right">
              <span class="auth-status" :class="auth.status">{{ authStatusText(auth) }}</span>
              <span class="auth-time">{{ formatTime(auth.end_time) }}到期</span>
              <span class="auth-confirm" v-if="auth.require_confirm">需二次确认</span>
            </div>
          </div>
        </div>

        <div class="elder-agent-row">
          <div class="elder-btn" @click="goToAgentCreate">
            <div class="elder-btn-icon auth">👨‍👩‍👧</div>
            <span>创建代办</span>
          </div>
          <div class="elder-btn" @click="goToAgentOps">
            <div class="elder-btn-icon log">📋</div>
            <span>代办记录</span>
          </div>
          <div class="elder-btn" @click="goToAgent">
            <div class="elder-btn-icon scope">🔐</div>
            <span>授权管理</span>
          </div>
          <div class="elder-btn" @click="goToAgentConfirm">
            <div class="elder-btn-icon confirm">✅</div>
            <span>待确认({{ identityStats.pending_agent_ops_count || 0 }})</span>
          </div>
        </div>
      </div>

      <div class="admin-section card">
        <div class="section-header">
          <div class="section-title">
            <span class="title-dot purple"></span>
            运营工作台
          </div>
          <span class="section-more" @click="goToAdmin">进入后台 <van-icon name="arrow" size="12" /></span>
        </div>

        <div class="stats-row">
          <div class="stat-item" @click="goToReport">
            <div class="stat-num">{{ overview.user_count || 0 }}</div>
            <div class="stat-label">注册用户</div>
          </div>
          <div class="stat-item" @click="goToMap">
            <div class="stat-num">{{ overview.outlet_count || 0 }}</div>
            <div class="stat-label">服务网点</div>
          </div>
          <div class="stat-item highlight" @click="goToAppointment">
            <div class="stat-num">{{ overview.today_appointments || 0 }}</div>
            <div class="stat-label">今日预约</div>
            <div class="stat-sub">
              <span class="sub-item ok">确认{{ overview.today_confirmed_appointments || 0 }}</span>
              <span class="sub-item warn">待确认{{ overview.today_pending_appointments || 0 }}</span>
              <span class="sub-item done">完成{{ overview.today_completed_appointments || 0 }}</span>
            </div>
          </div>
          <div class="stat-item" @click="goToCerts">
            <div class="stat-num">{{ overview.cert_count || 0 }}</div>
            <div class="stat-label">电子证件</div>
          </div>
        </div>

        <div class="dispatch-summary">
          <div class="dispatch-summary-title">
            <span class="dispatch-title">窗口调度摘要</span>
            <span class="dispatch-more" @click="goToWindows">查看全部</span>
          </div>
          <div v-if="overview.window_dispatch_summary && overview.window_dispatch_summary.length > 0" class="dispatch-list">
            <div
              v-for="d in overview.window_dispatch_summary"
              :key="d.outlet_id"
              class="dispatch-mini-card"
            >
              <div class="dispatch-mini-top">
                <span class="dispatch-mini-name">{{ d.outlet_name?.replace('政务服务中心', '') }}</span>
                <span class="load-badge" :class="d.load_level">
                  {{ d.load_level === 'high' ? '繁忙' : d.load_level === 'medium' ? '适中' : '空闲' }}
                </span>
              </div>
              <div class="dispatch-mini-body">
                <div class="mini-stat">
                  <span class="mini-val">{{ d.open_windows }}/{{ d.total_windows }}</span>
                  <span class="mini-label">开放/总窗</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-val warn">{{ d.current_queue }}</span>
                  <span class="mini-label">排队人</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-val highlight">→{{ d.suggested_windows }}</span>
                  <span class="mini-label">建议开窗</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="peak-summary" v-if="overview.today_peak">
          <div class="peak-row">
            <div class="peak-left">
              <van-icon name="fire-o" size="16" color="#ff6d00" />
              <span>今日高峰</span>
            </div>
            <div class="peak-mid">
              <span class="peak-slot">{{ overview.today_peak.peak_slot }}</span>
              <span class="peak-outlet">{{ overview.today_peak.outlet_name?.replace('政务服务中心', '') }} · 预测{{ overview.today_peak.peak_count }}人/实际{{ overview.today_peak.peak_actual }}人</span>
            </div>
            <div class="peak-right">
              <span class="peak-count">排队{{ overview.today_peak.current_queue }}人</span>
              <span class="peak-suggest">建议开{{ overview.today_peak.suggested_windows }}窗</span>
            </div>
          </div>
        </div>

        <div class="recent-logs" v-if="overview.recent_logs && overview.recent_logs.length > 0">
          <div class="recent-logs-title">
            <van-icon name="records" size="14" color="#546e7a" />
            最近审计日志
          </div>
          <div v-for="log in overview.recent_logs.slice(0, 3)" :key="log.id" class="log-item" @click="goToLogs">
            <span class="log-module" :class="'mod-' + log.module">{{ log.module }}</span>
            <span class="log-op">{{ log.operation }}</span>
            <span class="log-time">{{ formatTime(log.created_at) }}</span>
          </div>
        </div>

        <div class="admin-shortcuts">
          <div class="shortcut-item" @click="goToHeat">
            <span class="shortcut-icon">📊</span>
            <div class="shortcut-info">
              <span>热度预测</span>
              <span class="shortcut-desc">今日{{ overview.heat_prediction_count || 0 }}条预测数据</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="shortcut-item" @click="goToWindows">
            <span class="shortcut-icon">🪟</span>
            <div class="shortcut-info">
              <span>窗口调度</span>
              <span class="shortcut-desc">{{ overview.outlet_count || 0 }}网点 × {{ overview.window_dispatch_summary?.length || 0 }}调度</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="shortcut-item" @click="goToLogs">
            <span class="shortcut-icon">📜</span>
            <div class="shortcut-info">
              <span>审计日志</span>
              <span class="shortcut-desc">今日{{ overview.today_logs_count || 0 }}条可追溯</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
          <div class="shortcut-item" @click="goToReport">
            <span class="shortcut-icon">📈</span>
            <div class="shortcut-info">
              <span>数据报表</span>
              <span class="shortcut-desc">今日{{ overview.identity_today?.today_codes_count || 0 }}次亮码 / {{ overview.identity_today?.active_offline_count || 0 }}张离线码有效</span>
            </div>
            <van-icon name="arrow" size="14" color="#ccc" />
          </div>
        </div>
      </div>

      <div class="notice-section card">
        <van-notice-bar
          left-icon="volume-o"
          text="身份证补办支持全程网办，最快当日可取 | 长辈模式全新上线，操作更简单 | 亲友代办功能已开放授权范围与时效设置"
          scrollable
          color="#ff9800"
          background="#fff8e1"
        />
      </div>

      <div class="bottom-space"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast } from 'vant'
import { getUserInfo } from '../api/users'
import { getNearbyOutlets, matchService } from '../api/outlets'
import { getAdminOverview, getIdentityStats } from '../api/admin'

const router = useRouter()
const userStore = useUserStore()

const userInfo = ref(null)
const nearbyOutlet = ref(null)
const nearbyList = ref([])
const overview = ref({})
const identityStats = ref({})
const showSearch = ref(false)
const isElder = ref(false)
const matchResult = ref([])

const elderSettings = reactive({
  bigFont: true,
  noAds: true,
  voiceAssist: true,
  quickService: true,
})

const elderServiceStats = reactive({
  voice_count: 3,
  last_call_time: '2小时前',
  call_count: 5,
})

const serviceTypes = [
  { name: '身份证补办', label: '身份证', icon: '🪪', itemId: 1 },
  { name: '社保缴费查询', label: '社保', icon: '💳', itemId: 2 },
  { name: '不动产登记查询', label: '不动产', icon: '🏠', itemId: 3 },
  { name: '营业执照办理', label: '营业执照', icon: '💰', itemId: 4 },
  { name: '驾驶证换证', label: '驾驶证', icon: '🚗', itemId: 6 },
  { name: '公积金提取', label: '公积金', icon: '💴', itemId: 8 },
]

const cert12List = computed(() => {
  const all = [
    { type: 'id_card', name: '身份证', integrated: false },
    { type: 'social_security', name: '社保卡', integrated: false },
    { type: 'driving_license', name: '驾驶证', integrated: false },
    { type: 'vehicle_license', name: '行驶证', integrated: false },
    { type: 'passport', name: '护照', integrated: false },
    { type: 'hk_macau_pass', name: '港澳通行证', integrated: false },
    { type: 'taiwan_pass', name: '台湾通行证', integrated: false },
    { type: 'birth_cert', name: '出生证', integrated: false },
    { type: 'marriage_cert', name: '结婚证', integrated: false },
    { type: 'real_estate', name: '房产证', integrated: false },
    { type: 'business_license', name: '营业执照', integrated: false },
    { type: 'tax_cert', name: '税务登记', integrated: false },
  ]
  const count = identityStats.value.cert_integrated_count || 0
  return all.map((c, i) => ({ ...c, integrated: i < count }))
})

const riskLevel = computed(() => identityStats.value.risk_level || 'low')
const riskText = computed(() => {
  const map = { low: '低风险', medium: '中风险', high: '高风险' }
  return map[riskLevel.value]
})

const maskedIdCard = computed(() => {
  if (userInfo.value?.id_card) {
    return userInfo.value.id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return '***'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

function formatTime(t) {
  if (!t) return '-'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t.slice(0, 16)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatScope(s) {
  try {
    return JSON.parse(s).join('、')
  } catch { return s }
}

function authStatusText(auth) {
  if (auth.status === 'active') return '生效中'
  if (auth.status === 'revoked') return '已撤销'
  return auth.status
}

async function loadAll() {
  try {
    const uid = userStore.currentUserId || 1
    const [userRes, nearbyRes, ovRes, idStatsRes] = await Promise.all([
      getUserInfo(uid).catch(() => null),
      getNearbyOutlets({ lng: 106.5516, lat: 29.5628, radius: 5000 }).catch(() => []),
      getAdminOverview().catch(() => ({})),
      getIdentityStats(uid).catch(() => ({})),
    ])

    userInfo.value = userRes || null
    if (userInfo.value) userStore.setUserInfo(userInfo.value)

    const nearbyData = Array.isArray(nearbyRes) ? nearbyRes : (nearbyRes?.data || [])
    nearbyList.value = nearbyData
    nearbyOutlet.value = nearbyData[0] || null

    overview.value = ovRes || {}

    identityStats.value = idStatsRes || {}

    const serviceItemIds = [1, 2, 3]
    const serviceNames = ['身份证补办', '社保查询', '不动产查询']

    for (let si = 0; si < serviceItemIds.length; si++) {
      try {
        const matchRes = await matchService({
          serviceItemId: serviceItemIds[si],
          date: new Date().toISOString().split('T')[0],
          timePreference: 'morning',
          lng: 106.5516,
          lat: 29.5628,
        }).catch(() => null)

        const recs = matchRes?.recommendations || []
        if (recs.length > 0) {
          const top = recs[0]
          matchResult.value.push({
            outlet_id: top.outlet_id,
            outlet_name: top.outlet_name,
            outlet_district: top.outlet_district,
            service_name: serviceNames[si],
            service_item_id: serviceItemIds[si],
            slot: top.best_slot,
            avg_wait: top.avg_wait,
            total_queue: top.total_queue,
            open_windows: top.open_windows,
            total_windows: top.total_windows,
            predicted_count: top.predicted_count,
          })
        }
      } catch (e) { /* skip */ }

      if (matchResult.value.length >= 3) break
    }
  } catch (e) {
    console.error('loadAll error:', e)
  }
}

function toggleElderModeLocal() {
  isElder.value = !isElder.value
  onElderChange(isElder.value)
}

function onElderChange(val) {
  userStore.toggleElderMode(val)
  showToast(val ? '已进入长辈模式' : '已退出长辈模式')
}

function goToCode() { router.push('/identity/code') }
function goToCerts() { router.push('/identity/certificates') }
function goToRisk() { router.push('/identity/risk') }
function goToRecords() { router.push('/identity/records') }
function goToOutlets() { router.push('/outlets') }
function goToMap() { router.push('/outlets/map') }
function goToSmartMatch() { router.push('/outlets/smart-match') }
function goToAppointment() { router.push('/outlets/appointment') }
function goToAppointmentWithService() {
  router.push({ path: '/outlets/appointment', query: { outletId: nearbyOutlet.value?.id || 1 } })
}
function goToARNavWithParams() {
  router.push({ path: '/outlets/ar-nav', query: { outletId: nearbyOutlet.value?.id || 1 } })
}
function goToOutletDetail(id) { router.push(`/outlets/${id}`) }
function goToElderHome() { router.push('/elder/home') }
function goToVoiceInput() { router.push('/elder/voice') }
function goToService() { router.push('/elder/service') }
function goToAgent() { router.push('/elder/agent') }
function goToAgentCreate() { router.push('/elder/agent/create') }
function goToAgentOps() { router.push('/elder/agent/operations') }
function goToAgentConfirm() { router.push('/elder/agent/confirm') }
function goToProfile() { router.push('/profile') }
function goToAdmin() { router.push('/admin') }
function goToHeat() { router.push('/admin/heat') }
function goToWindows() { router.push('/admin/windows') }
function goToLogs() { router.push('/admin/logs') }
function goToReport() { router.push('/admin/report') }

function bookService(name, itemId) {
  router.push({ path: '/outlets/appointment', query: { service: name, serviceItemId: itemId } })
}

function bookFromMatch(m) {
  router.push({
    path: '/outlets/appointment',
    query: {
      outletId: m.outlet_id,
      service: m.service_name,
      serviceItemId: m.service_item_id,
      slot: m.slot,
    }
  })
}

function formatDistance(m) {
  if (!m) return '定位中'
  if (m < 1000) return `${Math.round(m)}米`
  return `${(m / 1000).toFixed(1)}km`
}

onMounted(() => {
  userStore.initElderMode()
  isElder.value = userStore.isElderMode
  loadAll()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  position: relative;
  padding-bottom: 50px;
}

.header-bg {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 260px;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
  border-radius: 0 0 24px 24px;
}

.user-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 36px 16px 16px;
  color: #fff;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin-right: 12px;
}

.user-detail { flex: 1; }
.greeting { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.subtitle {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; opacity: 0.9;
}
.cert-count { opacity: 0.85; }

.header-actions {
  display: flex; gap: 10px;
}
.action-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}

.search-bar {
  position: relative;
  z-index: 1;
  margin: 0 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 24px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.search-placeholder {
  flex: 1;
  font-size: 14px;
  color: #999;
}

.page-content {
  margin-top: -30px;
  padding: 0 12px;
  position: relative;
  z-index: 2;
}

.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
  padding: 20px 8px 8px;
}
.action-item {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
}
.action-wrap {
  display: flex; flex-direction: column; align-items: center;
}
.action-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  margin-bottom: 6px;
  transition: transform 0.2s;
}
.action-icon.active { transform: scale(1.05); box-shadow: 0 0 0 3px #ffe0b2; }
.action-icon.code { background: linear-gradient(135deg, #1e88e5, #1565c0); }
.action-icon.match { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
.action-icon.map { background: linear-gradient(135deg, #43a047, #2e7d32); }
.action-icon.appt { background: linear-gradient(135deg, #00897b, #00695c); }
.action-icon.ar { background: linear-gradient(135deg, #e53935, #c62828); }
.action-icon.agent { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
.action-icon.elder { background: linear-gradient(135deg, #f4511e, #d84315); }
.action-icon.admin { background: linear-gradient(135deg, #546e7a, #37474f); }
.ar-icon {
  font-size: 16px;
  font-weight: 700;
  font-style: italic;
}
.action-label {
  font-size: 12px;
  color: #333;
}
.hot-tag, .new-tag {
  position: absolute;
  top: -6px; right: 0px;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
}
.hot-tag { background: #ffebee; color: #e53935; }
.new-tag { background: #e8f5e9; color: #43a047; }
.badge {
  position: absolute;
  top: -6px; right: 2px;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: #e53935;
  color: #fff;
  font-weight: 600;
}
.badge.warn { background: #ff9800; }

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.title-dot {
  width: 4px; height: 16px;
  border-radius: 2px;
}
.title-dot.blue { background: #1e88e5; }
.title-dot.green { background: #43a047; }
.title-dot.orange { background: #ff9800; }
.title-dot.purple { background: #9c27b0; }
.section-more {
  font-size: 13px;
  color: #999;
  display: flex; align-items: center;
}

.code-display {
  display: flex;
  padding: 14px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border-radius: 12px;
  margin-bottom: 12px;
}
.qr-area {
  width: 100px; margin-right: 14px;
  display: flex; flex-direction: column; align-items: center;
}
.qr-placeholder {
  width: 80px; height: 80px;
  background: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.code-status-row {
  display: flex;
  gap: 6px;
}
.code-type {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(255,255,255,0.7);
  color: #666;
}
.code-type.active-dynamic {
  background: #e8f5e9;
  color: #43a047;
}
.code-type.offline.active {
  background: #fff3e0;
  color: #ff9800;
}
.type-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #999;
}
.type-dot.green { background: #43a047; }
.offline-count {
  font-size: 9px;
  margin-left: 2px;
}
.code-info { flex: 1; }
.info-row {
  display: flex; justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}
.info-label { color: #666; }
.info-value { color: #333; font-weight: 500; }
.risk-row { align-items: center; }
.risk-circle {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid;
}
.risk-circle-low { border-color: #43a047; color: #43a047; }
.risk-circle-medium { border-color: #ff9800; color: #ff9800; }
.risk-circle-high { border-color: #e53935; color: #e53935; }
.risk-score { font-size: 14px; font-weight: 700; }
.risk-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.risk-low { background: #e8f5e9; color: #43a047; }
.risk-medium { background: #fff3e0; color: #ff9800; }
.risk-high { background: #ffebee; color: #e53935; }

.offline-codes {
  padding: 10px 12px;
  background: #fff8e1;
  border-radius: 10px;
  margin-bottom: 12px;
}
.offline-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 6px;
}
.offline-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.offline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
}
.offline-token { font-family: monospace; }
.offline-risk { font-size: 10px; padding: 1px 4px; border-radius: 4px; }
.offline-expire { color: #999; }

.cert-summary {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 12px;
}
.cert-summary-title {
  display: flex; justify-content: space-between;
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
}
.cert-count-num {
  color: #1976d2;
  font-weight: 700;
}
.cert-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cert-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
}
.cert-chip.done { background: #e8f5e9; color: #2e7d32; }
.cert-chip.pending { background: #fff3e0; color: #e65100; }

.code-verify {
  padding: 10px 12px;
  background: #e8f5e9;
  border-radius: 10px;
  margin-bottom: 12px;
}
.verify-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 6px;
}
.verify-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.verify-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
}
.verify-type {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
}
.verify-type.dynamic { background: #e3f2fd; color: #1976d2; }
.verify-type.offline { background: #fff3e0; color: #ff9800; }
.verify-risk { font-size: 10px; padding: 1px 4px; border-radius: 4px; }
.verify-time { color: #999; }

.code-actions {
  display: flex; justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.code-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
  color: #666;
}

.nearby-outlet {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 12px;
}
.outlet-info { flex: 1; }
.outlet-name-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 6px;
}
.outlet-name {
  font-size: 15px; font-weight: 600; color: #333;
}
.outlet-distance {
  font-size: 12px; color: #1976d2;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 10px;
}
.outlet-addr {
  font-size: 12px; color: #999;
  margin-bottom: 8px;
  display: flex; align-items: center; gap: 4px;
}
.outlet-status {
  display: flex; gap: 12px;
  font-size: 12px;
  color: #666;
  flex-wrap: wrap;
}
.queue-tag.highlight { color: #e53935; font-weight: 600; }
.wait-tag, .window-tag, .queue-tag {
  display: flex; align-items: center; gap: 4px;
}

.match-result {
  margin-bottom: 12px;
}
.match-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.match-sub {
  font-size: 11px;
  color: #999;
  font-weight: 400;
}
.match-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border-radius: 10px;
  margin-bottom: 6px;
}
.match-left { flex: 1; }
.match-item-service {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a148c;
  margin-bottom: 2px;
}
.match-item-outlet {
  display: block;
  font-size: 11px;
  color: #7b1fa2;
  margin-bottom: 2px;
}
.match-item-queue {
  font-size: 10px;
  color: #9c27b0;
}
.match-mid {
  display: flex; flex-direction: column;
  align-items: center;
  margin: 0 10px;
}
.match-slot {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}
.match-wait {
  font-size: 10px;
  color: #666;
}
.match-predict {
  font-size: 10px;
  color: #999;
}

.service-types {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px 8px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}

.nearby-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.nearby-action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

.nearby-action-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.match-icon { background: linear-gradient(135deg, #9c27b0, #7b1fa2); }
.appt-icon { background: linear-gradient(135deg, #00897b, #00695c); }
.ar-icon { background: linear-gradient(135deg, #e53935, #c62828); }

.nearby-action-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nearby-action-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.nearby-action-desc {
  font-size: 10px;
  color: #999;
}
.type-item {
  display: flex; flex-direction: column; align-items: center;
}
.type-icon { font-size: 28px; margin-bottom: 6px; }
.type-name { font-size: 11px; color: #333; }

.elder-environment {
  padding: 12px;
  background: #fff8e1;
  border-radius: 10px;
  margin-bottom: 12px;
}
.env-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.env-row:last-child { margin-bottom: 0; }
.env-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}
.env-item.on {
  color: #e65100;
  font-weight: 500;
}

.elder-features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.elder-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #fff8e1;
  border-radius: 10px;
}

.feature-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.feature-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.feature-desc {
  font-size: 11px;
  color: #999;
}

.agent-summary {
  margin-bottom: 14px;
}
.agent-summary-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.agent-summary-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.agent-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #f5f5f5;
  border-radius: 10px;
}
.agent-stat-card.warn { background: #fff3e0; }
.agent-stat-card.ok { background: #e8f5e9; }
.agent-num {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}
.agent-stat-card.warn .agent-num { color: #ff9800; }
.agent-stat-card.ok .agent-num { color: #43a047; }
.agent-label {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.auth-detail {
  padding: 10px 12px;
  background: #fff3e0;
  border-radius: 10px;
  margin-bottom: 14px;
}
.auth-detail-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 8px;
}
.auth-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.auth-item:last-child { border-bottom: none; }
.auth-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.auth-agent { font-size: 12px; font-weight: 600; color: #333; }
.auth-scope { font-size: 10px; color: #666; }
.auth-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.auth-status { font-size: 10px; padding: 1px 6px; border-radius: 4px; }
.auth-status.active { background: #e8f5e9; color: #43a047; }
.auth-status.revoked { background: #ffebee; color: #e53935; }
.auth-time { font-size: 10px; color: #999; }
.auth-confirm {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
  background: #fff3e0;
  color: #ff9800;
}

.elder-agent-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.elder-btn {
  display: flex; flex-direction: column; align-items: center;
}
.elder-btn-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  margin-bottom: 6px;
  background: #fff8e1;
}
.elder-btn span { font-size: 12px; color: #333; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.stat-item {
  text-align: center;
  padding: 12px 4px;
  background: #f8f9fa;
  border-radius: 10px;
  position: relative;
}
.stat-item.highlight {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}
.stat-num {
  font-size: 20px; font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 11px; color: #999;
}
.stat-sub {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.sub-item {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
}
.sub-item.ok { background: #e8f5e9; color: #43a047; }
.sub-item.warn { background: #fff3e0; color: #ff9800; }
.sub-item.done { background: #e3f2fd; color: #1976d2; }

.dispatch-summary {
  margin-bottom: 12px;
}
.dispatch-summary-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
.dispatch-more {
  font-size: 11px;
  color: #999;
  font-weight: 400;
}
.dispatch-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.dispatch-mini-card {
  padding: 10px 8px;
  background: #f8f9fa;
  border-radius: 8px;
}
.dispatch-mini-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.dispatch-mini-name {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.load-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 6px;
  font-weight: 500;
}
.load-badge.high { background: #ffebee; color: #e53935; }
.load-badge.medium { background: #fff3e0; color: #ff9800; }
.load-badge.low { background: #e8f5e9; color: #43a047; }
.dispatch-mini-body {
  display: flex;
  justify-content: space-between;
}
.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.mini-val {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}
.mini-val.warn { color: #ff9800; }
.mini-val.highlight { color: #1976d2; }
.mini-label {
  font-size: 9px;
  color: #999;
}

.peak-summary {
  padding: 10px 12px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-radius: 10px;
  margin-bottom: 12px;
}
.peak-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.peak-left {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #e65100;
}
.peak-mid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.peak-slot {
  font-size: 13px;
  font-weight: 700;
  color: #e65100;
}
.peak-outlet {
  font-size: 11px;
  color: #ef6c00;
}
.peak-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.peak-count {
  font-size: 15px;
  font-weight: 700;
  color: #d84315;
}
.peak-suggest {
  font-size: 10px;
  color: #e65100;
}

.recent-logs {
  padding: 10px 12px;
  background: #f5f5f5;
  border-radius: 10px;
  margin-bottom: 12px;
}
.recent-logs-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #546e7a;
  margin-bottom: 6px;
}
.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 11px;
  color: #666;
}
.log-module {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
}
.mod-identity { background: #e3f2fd; color: #1976d2; }
.mod-outlet { background: #e8f5e9; color: #43a047; }
.mod-agent { background: #fff3e0; color: #ff9800; }
.mod-window { background: #f3e5f5; color: #9c27b0; }
.log-op { flex: 1; }
.log-time { color: #999; font-size: 10px; }

.admin-shortcuts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.shortcut-item {
  display: flex; align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
  gap: 8px;
}
.shortcut-icon { font-size: 22px; }
.shortcut-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shortcut-info span:first-child {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}
.shortcut-desc {
  font-size: 10px;
  color: #999;
}

.bottom-space {
  height: 30px;
}
</style>
