<template>
  <div class="waybill-detail" v-loading="loading">
    <div v-if="permissionError" class="permission-error">
      <el-result icon="warning" title="您暂无权限查看此运单详情">
        <template #sub-title>
          如需查看，请联系系统管理员获取相关权限
        </template>
        <template #extra>
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon> 返回
          </el-button>
        </template>
      </el-result>
    </div>

    <template v-else>
      <div class="page-header">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h2 class="page-title">运单详情</h2>
        <el-tag :type="getStatusType(waybill?.status)" size="large" effect="light">
          {{ getStatusText(waybill?.status) }}
        </el-tag>
      </div>

      <el-card class="detail-card flow-timeline-card">
        <template #header>
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon> 运单流程
          </div>
        </template>
        <el-steps :active="getFlowStepIndex(waybill?.status)" finish-status="success" align-center class="flow-steps">
          <el-step title="货源发布">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><DocumentAdd /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="司机报价">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><ChatDotRound /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="接受报价">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><CircleCheck /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="签约生成运单">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><Tickets /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="开始装货">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><Box /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="运输中">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><Van /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="到达签收">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><Place /></el-icon>
              </div>
            </template>
          </el-step>
          <el-step title="资金结算">
            <template #icon="{ status }">
              <div class="flow-step-icon" :class="status">
                <el-icon><Wallet /></el-icon>
              </div>
            </template>
          </el-step>
        </el-steps>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Document /></el-icon> 运单基本信息
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="运单号">
                <span class="waybill-no">{{ waybill?.waybill_no }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDate(waybill?.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="协议价格">
                <span class="price">¥{{ waybill?.agreed_price }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="预计到达">
                {{ formatDate(waybill?.estimated_arrival) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="detail-card" v-if="splitData">
            <template #header>
              <div class="card-title">
                <el-icon><Money /></el-icon> 价格分账明细
              </div>
            </template>
            <div class="split-list">
              <div class="split-item">
                <span class="split-label">协议总价</span>
                <span class="split-value">¥{{ splitData.agreedPrice }}</span>
              </div>
              <div class="split-item">
                <span class="split-label">平台佣金 ({{ (splitData.commissionRate * 100).toFixed(1) }}%)</span>
                <span class="split-value deduction">-¥{{ splitData.platformCommission }}</span>
              </div>
              <div class="split-item">
                <span class="split-label">保险费 ({{ (splitData.insuranceRate * 100).toFixed(2) }}%)</span>
                <span class="split-value deduction">-¥{{ splitData.insuranceFee }}</span>
              </div>
              <div class="split-item total">
                <span class="split-label">司机应收</span>
                <span class="split-value final">¥{{ splitData.driverReceivable }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Goods /></el-icon> 货物信息与路线
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="货物名称">{{ waybill?.cargo_name }}</el-descriptions-item>
              <el-descriptions-item label="货物重量">{{ waybill?.weight }} 吨</el-descriptions-item>
              <el-descriptions-item label="运输距离">{{ waybill?.distance }} km</el-descriptions-item>
              <el-descriptions-item label="车辆要求">{{ waybill?.vehicle_type_required }}</el-descriptions-item>
            </el-descriptions>
            <div class="route-display">
              <div class="route-point start">
                <el-icon class="point-icon start-icon"><LocationFilled /></el-icon>
                <div class="point-info">
                  <div class="point-city">{{ waybill?.start_city }}</div>
                  <div class="point-time">装货时间: {{ formatDate(waybill?.loading_time) }}</div>
                </div>
              </div>
              <div class="route-line">
                <el-icon><Van /></el-icon>
              </div>
              <div class="route-point end">
                <el-icon class="point-icon end-icon"><Place /></el-icon>
                <div class="point-info">
                  <div class="point-city">{{ waybill?.end_city }}</div>
                  <div class="point-time">预计到达: {{ formatDate(waybill?.estimated_arrival) }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Timer /></el-icon> 运单状态流程
              </div>
            </template>
            <el-steps :active="getStepIndex(waybill?.status)" finish-status="success" align-center>
              <el-step title="待创建" description="等待生成运单" />
              <el-step title="已创建" description="运单已生成" />
              <el-step title="装货中" description="司机正在装货" />
              <el-step title="运输中" description="货物运输中" />
              <el-step title="已完成" description="运输已完成" />
            </el-steps>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Picture /></el-icon> 运单照片与OCR
              </div>
            </template>
            <template v-if="waybill?.waybill_photo || waybill?.ocr_result">
              <el-row :gutter="20">
                <el-col :span="12" v-if="waybill?.waybill_photo">
                  <div class="photo-wrapper">
                    <img :src="waybill.waybill_photo" alt="运单照片" class="waybill-photo" @click="previewImage(waybill.waybill_photo)" />
                  </div>
                </el-col>
                <el-col :span="waybill?.waybill_photo ? 12 : 24" v-if="waybill?.ocr_result">
                  <div class="ocr-result">
                    <div class="ocr-title">OCR识别结果</div>
                    <div class="ocr-content">{{ waybill.ocr_result }}</div>
                  </div>
                </el-col>
              </el-row>
              <div class="photo-upload-footer" v-if="isDriver && isActiveStatus(waybill?.status)">
                <el-upload
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  @change="handleOcrUpload"
                >
                  <el-button type="primary" size="small" :loading="ocrLoading">
                    <el-icon><Camera /></el-icon> 重新上传
                  </el-button>
                </el-upload>
              </div>
            </template>
            <template v-else>
              <div class="upload-area" v-if="isDriver && isActiveStatus(waybill?.status)">
                <div class="upload-prompt">
                  <div class="upload-icon-wrapper">
                    <el-icon class="upload-icon"><Picture /></el-icon>
                    <el-icon class="upload-plus-icon"><Plus /></el-icon>
                  </div>
                  <p class="upload-title">点击上传运单照片</p>
                  <p class="upload-desc">上传后将自动进行OCR识别，提取运单关键信息</p>
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*"
                    @change="handleOcrUpload"
                  >
                    <el-button type="primary" :loading="ocrLoading">
                      <el-icon><Camera /></el-icon> 点击上传运单照片
                    </el-button>
                  </el-upload>
                </div>
              </div>
              <div v-else class="no-photo-prompt">
                <el-icon class="no-photo-icon"><Picture /></el-icon>
                <p class="no-photo-text">暂无运单照片</p>
                <p class="no-photo-hint" v-if="!isDriver">等待司机上传运单照片</p>
                <p class="no-photo-hint" v-else>运单已完成，无法继续上传</p>
              </div>
            </template>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><MapLocation /></el-icon> 实时运输轨迹
                <router-link
                  :to="`/waybill/${waybill.id}/tracking`"
                  class="tracking-link"
                >
                  查看完整轨迹 <el-icon><Right /></el-icon>
                </router-link>
              </div>
            </template>
            <template v-if="waybill?.tracking?.length">
              <div class="trip-stats" v-if="tripStats">
                <div class="stat-item">
                  <div class="stat-icon distance">
                    <el-icon><Position /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ tripStats.totalDistance }} km</div>
                    <div class="stat-label">总距离</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon duration">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ tripStats.totalDuration }}</div>
                    <div class="stat-label">总时长</div>
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-icon speed">
                    <el-icon><Odometer /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ tripStats.avgSpeed }} km/h</div>
                    <div class="stat-label">平均速度</div>
                  </div>
                </div>
              </div>
              <div class="current-position" v-if="latestTracking">
                <span class="position-label">最新位置:</span>
                <span class="position-value">
                  经度 {{ latestTracking.lng }}, 纬度 {{ latestTracking.lat }}
                </span>
                <span class="position-speed" v-if="latestTracking.speed">
                  速度: {{ latestTracking.speed }} km/h
                </span>
              </div>
              <el-timeline class="tracking-timeline">
                <el-timeline-item
                  v-for="(record, index) in waybill.tracking"
                  :key="index"
                  :timestamp="formatDate(record.recorded_at || record.created_at)"
                  :type="getTrackingColor(record)"
                  :hollow="false"
                  placement="top"
                >
                  <div class="tracking-entry">
                    <div class="tracking-position">
                      经度 {{ record.lng }}, 纬度 {{ record.lat }}
                    </div>
                    <div class="tracking-meta">
                      <span v-if="record.speed">速度: {{ record.speed }} km/h</span>
                      <el-tag v-if="record.is_off_route" type="danger" size="small" effect="light" class="tracking-tag">偏离路线</el-tag>
                      <el-tag v-if="record.is_stationary || (record.stationary_minutes && record.stationary_minutes > 60)" type="warning" size="small" effect="light" class="tracking-tag">
                        <el-icon><Warning /></el-icon>
                        静止{{ record.stationary_minutes || 90 }}分钟
                      </el-tag>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </template>
            <template v-else>
              <el-empty description="暂无轨迹数据" :image-size="80" />
            </template>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Bell /></el-icon> 异常预警
                <el-badge :value="pendingAlertsCount" type="danger" class="alert-badge" v-if="pendingAlertsCount > 0"></el-badge>
              </div>
            </template>
            <div class="alert-tabs">
              <el-tabs v-model="activeAlertTab">
                <el-tab-pane label="当前告警" name="current">
                  <template v-if="currentAlerts.length">
                    <el-timeline class="alert-timeline">
                      <el-timeline-item
                        v-for="(alert, index) in currentAlerts"
                        :key="index"
                        :type="getAlertTimelineType(alert.alert_level)"
                        :hollow="false"
                        placement="top"
                      >
                        <div class="alert-card" :class="`alert-${alert.alert_level}`">
                          <div class="alert-header">
                            <div class="alert-type">
                              <el-icon class="alert-icon">{{ getAlertIcon(alert.alert_type) }}</el-icon>
                              <span class="alert-title">{{ getAlertTypeText(alert.alert_type) }}</span>
                            </div>
                            <el-tag
                              :type="alert.is_handled ? 'success' : 'danger'"
                              size="small"
                              effect="light"
                            >
                              {{ alert.is_handled ? '已处理' : '待处理' }}
                            </el-tag>
                          </div>
                          <div class="alert-message">{{ alert.alert_message }}</div>
                          <div class="alert-footer">
                            <span class="alert-time">
                              <el-icon><Timer /></el-icon>
                              {{ formatDate(alert.created_at) }}
                            </span>
                            <el-button
                              v-if="isAdmin && !alert.is_handled"
                              type="primary"
                              size="small"
                              link
                              @click="handleMarkAlert(alert)"
                            >
                              标记已处理
                            </el-button>
                          </div>
                        </div>
                      </el-timeline-item>
                    </el-timeline>
                  </template>
                  <template v-else>
                    <div class="no-alerts">
                      <el-icon class="no-alerts-icon"><CircleCheck /></el-icon>
                      <p class="no-alerts-text">暂无当前告警，运输状态良好</p>
                    </div>
                  </template>
                </el-tab-pane>
                <el-tab-pane label="查看历史告警" name="history">
                  <template v-if="allAlerts.length">
                    <el-timeline class="alert-timeline">
                      <el-timeline-item
                        v-for="(alert, index) in allAlerts"
                        :key="index"
                        :type="getAlertTimelineType(alert.alert_level)"
                        :hollow="false"
                        placement="top"
                      >
                        <div class="alert-card" :class="`alert-${alert.alert_level}`">
                          <div class="alert-header">
                            <div class="alert-type">
                              <el-icon class="alert-icon">{{ getAlertIcon(alert.alert_type) }}</el-icon>
                              <span class="alert-title">{{ getAlertTypeText(alert.alert_type) }}</span>
                            </div>
                            <el-tag
                              :type="alert.is_handled ? 'success' : 'danger'"
                              size="small"
                              effect="light"
                            >
                              {{ alert.is_handled ? '已处理' : '待处理' }}
                            </el-tag>
                          </div>
                          <div class="alert-message">{{ alert.alert_message }}</div>
                          <div class="alert-footer">
                            <span class="alert-time">
                              <el-icon><Timer /></el-icon>
                              {{ formatDate(alert.created_at) }}
                            </span>
                            <el-button
                              v-if="isAdmin && !alert.is_handled"
                              type="primary"
                              size="small"
                              link
                              @click="handleMarkAlert(alert)"
                            >
                              标记已处理
                            </el-button>
                          </div>
                        </div>
                      </el-timeline-item>
                    </el-timeline>
                  </template>
                  <template v-else>
                    <div class="no-alerts">
                      <el-icon class="no-alerts-icon"><CircleCheck /></el-icon>
                      <p class="no-alerts-text">暂无历史告警记录</p>
                    </div>
                  </template>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><CreditCard /></el-icon> 担保资金池
                <el-link type="primary" @click="goToWallet" class="card-link">
                  查看资金流水 <el-icon><Right /></el-icon>
                </el-link>
              </div>
            </template>
            <el-steps :active="getEscrowStep()" finish-status="success" align-center class="escrow-steps">
              <el-step title="资金冻结" description="货主担保资金冻结" />
              <el-step title="运输中" description="资金担保中" />
              <el-step title="确认收货" description="货主确认收货" />
              <el-step title="资金解冻" description="分账释放" />
            </el-steps>
            <div class="escrow-info" v-if="waybill?.escrow">
              <el-descriptions :column="2" border size="small" class="escrow-descriptions">
                <el-descriptions-item label="担保状态">
                  <el-tag :type="getEscrowStatusType(waybill.escrow.status)" effect="light">
                    {{ getEscrowStatusText(waybill.escrow.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="冻结金额">
                  <span class="price">¥{{ waybill.escrow.frozen_amount || waybill.escrow.amount }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="冻结时间">
                  {{ formatDate(waybill.escrow.frozen_at) }}
                </el-descriptions-item>
                <el-descriptions-item label="释放时间">
                  {{ formatDate(waybill.escrow.released_at) }}
                </el-descriptions-item>
              </el-descriptions>
              <div class="fund-flow">
                <div class="fund-flow-title">资金流向</div>
                <div class="fund-flow-steps">
                  <div class="fund-flow-step">
                    <div class="fund-flow-icon shipper-icon">
                      <el-icon><OfficeBuilding /></el-icon>
                    </div>
                    <div class="fund-flow-label">货主余额</div>
                  </div>
                  <div class="fund-flow-arrow">
                    <el-icon><Right /></el-icon>
                  </div>
                  <div class="fund-flow-step">
                    <div class="fund-flow-icon freeze-icon">
                      <el-icon><Lock /></el-icon>
                    </div>
                    <div class="fund-flow-label">担保冻结</div>
                  </div>
                  <div class="fund-flow-arrow">
                    <el-icon><Right /></el-icon>
                  </div>
                  <div class="fund-flow-step">
                    <div class="fund-flow-icon transport-icon">
                      <el-icon><Van /></el-icon>
                    </div>
                    <div class="fund-flow-label">运输完成</div>
                  </div>
                  <div class="fund-flow-arrow">
                    <el-icon><Right /></el-icon>
                  </div>
                  <div class="fund-flow-step">
                    <div class="fund-flow-icon release-icon">
                      <el-icon><Unlock /></el-icon>
                    </div>
                    <div class="fund-flow-label">分账释放</div>
                  </div>
                </div>
              </div>
              <div class="escrow-note" v-if="waybill.escrow.status === 'released'">
                <el-icon><InfoFilled /></el-icon>
                资金已释放，T+0 到账，司机可申请提现
              </div>
            </div>
            <div v-else class="escrow-empty">
              <el-empty description="暂无担保资金记录" :image-size="60" />
            </div>
          </el-card>

          <el-card class="detail-card" v-if="cargoPricing">
            <template #header>
              <div class="card-title">
                <el-icon><DataLine /></el-icon> 定价依据
              </div>
            </template>
            <div class="pricing-breakdown">
              <div class="pricing-row">
                <span class="pricing-label">基础价 (base_price)</span>
                <span class="pricing-value">¥{{ cargoPricing.base_price }}</span>
              </div>
              <div class="pricing-row" v-if="cargoPricing.distanceFactor != null">
                <span class="pricing-label">距离费用: {{ waybill?.distance }} km × {{ cargoPricing.distanceFactor }}</span>
                <span class="pricing-value">¥{{ ((waybill?.distance || 0) * cargoPricing.distanceFactor).toFixed(2) }}</span>
              </div>
              <div class="pricing-row" v-if="cargoPricing.vehicleFactor != null">
                <span class="pricing-label">车辆系数 (vehicleFactor)</span>
                <span class="pricing-value">×{{ cargoPricing.vehicleFactor }}</span>
              </div>
              <div class="pricing-row" v-if="cargoPricing.timeFactor != null">
                <span class="pricing-label">时间系数 (timeFactor)</span>
                <span class="pricing-value">×{{ cargoPricing.timeFactor }}</span>
              </div>
              <div class="pricing-divider"></div>
              <div class="pricing-row">
                <span class="pricing-label">系统建议价 (suggested_price)</span>
                <span class="pricing-value suggested">¥{{ cargoPricing.suggested_price }}</span>
              </div>
              <div class="pricing-row">
                <span class="pricing-label">协议成交价 (agreed_price)</span>
                <span class="pricing-value agreed">¥{{ waybill?.agreed_price }}</span>
              </div>
            </div>
            <div class="pricing-formula" v-if="cargoPricing.base_price">
              <div class="formula-title">定价公式</div>
              <div class="formula-content">
                基础价 + (距离 × 距离系数) × 车辆系数 × 时间系数 = 建议价
              </div>
            </div>
          </el-card>

          <el-card class="detail-card" v-if="bids.length">
            <template #header>
              <div class="card-title">
                <el-icon><ChatDotRound /></el-icon> 报价议价记录
              </div>
            </template>
            <div class="bid-list">
              <div
                v-for="(bid, index) in bids"
                :key="index"
                :class="['bid-item', { 'bid-accepted': bid.status === 'accepted' }]"
              >
                <div class="bid-header">
                  <span class="bid-driver">{{ bid.driver_name || `司机#${bid.driver_id}` }}</span>
                  <span :class="['bid-price', { 'bid-price-accepted': bid.status === 'accepted' }]">
                    ¥{{ bid.bid_price }}
                  </span>
                </div>
                <div class="bid-message" v-if="bid.message">{{ bid.message }}</div>
                <div class="bid-footer">
                  <span class="bid-time">{{ formatDate(bid.bid_time || bid.created_at) }}</span>
                  <el-tag
                    :type="bid.status === 'accepted' ? 'success' : bid.status === 'rejected' ? 'danger' : 'info'"
                    size="small"
                    effect="light"
                  >
                    {{ getBidStatusText(bid.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><UserFilled /></el-icon> 司机信息
              </div>
            </template>
            <div class="user-info">
              <el-avatar :size="60" class="avatar">{{ waybill?.driver_name?.charAt(0) }}</el-avatar>
              <div class="info-content">
                <div class="name">{{ waybill?.driver_name }}</div>
                <div class="phone">{{ waybill?.driver_phone }}</div>
                <div class="sub-info">{{ waybill?.vehicle_type }} · {{ waybill?.vehicle_no }}</div>
                <div class="sub-info">信誉分: {{ waybill?.credit_score || '-' }}/100</div>
              </div>
            </div>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><OfficeBuilding /></el-icon> 货主信息
              </div>
            </template>
            <div class="user-info">
              <el-avatar :size="60" class="avatar">{{ waybill?.shipper_name?.charAt(0) }}</el-avatar>
              <div class="info-content">
                <div class="name">{{ waybill?.shipper_name }}</div>
                <div class="phone">{{ waybill?.shipper_phone }}</div>
                <div class="sub-info">{{ waybill?.company_name }}</div>
              </div>
            </div>
          </el-card>

          <el-card class="detail-card">
            <template #header>
              <div class="card-title">
                <el-icon><Operation /></el-icon> 操作区
              </div>
            </template>
            <div class="action-buttons">
              <template v-if="isDriver">
                <el-button type="primary" size="large" block @click="handleStartLoading" :loading="actionLoading" v-if="waybill?.status === 'created'">
                  <el-icon><Loading /></el-icon> 开始装货
                </el-button>
                <el-button type="success" size="large" block @click="handleStartTransport" :loading="actionLoading" v-if="waybill?.status === 'loading' && waybill?.waybill_photo">
                  <el-icon><Van /></el-icon> 开始运输
                </el-button>
                <el-button type="warning" size="large" block @click="handleReportLocation" :loading="actionLoading" v-if="waybill?.status === 'in_transit'">
                  <el-icon><Location /></el-icon> 上报位置
                </el-button>
                <el-button type="success" size="large" block @click="handleComplete" :loading="actionLoading" v-if="waybill?.status === 'in_transit'">
                  <el-icon><CircleCheck /></el-icon> 完成运输
                </el-button>
              </template>
              <template v-if="isShipper">
                <el-button type="warning" size="large" block @click="handleFreezeEscrow" :loading="actionLoading" v-if="waybill?.status === 'created' && !waybill?.escrow">
                  <el-icon><Lock /></el-icon> 担保资金冻结
                </el-button>
                <el-button type="success" size="large" block :loading="actionLoading" disabled v-if="waybill?.escrow?.status === 'frozen'">
                  <el-icon><CircleCheck /></el-icon> 资金已冻结
                </el-button>
                <el-button type="info" size="large" block @click="handleReleaseEscrow" :loading="actionLoading" v-if="waybill?.status === 'completed' && waybill?.escrow?.status === 'frozen'">
                  <el-icon><Unlock /></el-icon> 资金解冻
                </el-button>
                <el-button type="primary" size="large" block @click="openConfirmDialog" v-if="waybill?.status === 'completed' && (!waybill?.escrow || waybill?.escrow?.status === 'released')">
                  <el-icon><Star /></el-icon> 确认收货并评价
                </el-button>
                <el-button type="success" size="large" block disabled v-if="waybill?.status === 'completed' && waybill?.escrow?.status === 'released'">
                  <el-icon><CircleCheck /></el-icon> 交易已完成
                </el-button>
              </template>
              <el-alert
                title="请按流程顺序操作"
                type="info"
                :closable="false"
                class="alert-tip"
                v-if="!hasAvailableAction"
              />
            </div>
          </el-card>

          <el-card class="detail-card" v-if="waybill?.insurance">
            <template #header>
              <div class="card-title">
                <el-icon><Warning /></el-icon> 保险信息
                <el-link type="primary" @click="goToInsurance" class="card-link" v-if="isAdmin">
                  查看所有保单 <el-icon><Right /></el-icon>
                </el-link>
              </div>
            </template>
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="保单号">{{ waybill.insurance.policy_no }}</el-descriptions-item>
              <el-descriptions-item label="保险公司">{{ waybill.insurance.insurance_company }}</el-descriptions-item>
              <el-descriptions-item label="保额">¥{{ waybill.insurance.insured_amount }}</el-descriptions-item>
              <el-descriptions-item label="保费">¥{{ waybill.insurance.premium }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag type="success" size="small" effect="light">{{ waybill.insurance.status === 'valid' ? '有效' : '无效' }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-dialog v-model="confirmDialogVisible" title="确认收货并评价" width="500px">
        <el-form :model="reviewForm" :rules="reviewRules" ref="reviewFormRef" label-width="100px">
          <el-form-item label="评分" prop="rating">
            <el-rate v-model="reviewForm.rating" show-text />
          </el-form-item>
          <el-form-item label="评价" prop="comment">
            <el-input v-model="reviewForm.comment" type="textarea" :rows="4" placeholder="请输入您的评价（选填）" maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmReceipt" :loading="actionLoading">确认提交</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="imageViewerVisible" title="运单照片预览" width="800px">
        <img :src="previewImageUrl" alt="预览" class="preview-image" />
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Document, Money, Goods, LocationFilled, Place, Van, Timer, Picture,
  UserFilled, OfficeBuilding, Operation, Loading, Camera, Location, CircleCheck,
  Lock, Unlock, Star, Warning, MapLocation, Right, Bell, CreditCard, DataLine,
  ChatDotRound, InfoFilled, Plus, TrendCharts, DocumentAdd, Tickets, Box, Wallet,
  Position, Clock, Odometer
} from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { waybillApi, paymentApi, driverApi, shipperApi, adminApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const actionLoading = ref(false)
const ocrLoading = ref(false)
const waybill = ref(null)
const splitData = ref(null)
const confirmDialogVisible = ref(false)
const reviewFormRef = ref()
const imageViewerVisible = ref(false)
const previewImageUrl = ref('')
const cargoDetail = ref(null)
const permissionError = ref(false)
const activeAlertTab = ref('current')

const isDriver = computed(() => userStore.isDriver)
const isShipper = computed(() => userStore.isShipper)
const isAdmin = computed(() => userStore.isAdmin)

const reviewForm = reactive({
  rating: 5,
  comment: ''
})

const reviewRules = {
  rating: [{ required: true, message: '请选择评分', trigger: 'change' }]
}

const demoAlerts = computed(() => {
  if (!waybill.value) return []
  const alerts = []
  const now = new Date()
  
  if (waybill.value.status === 'in_transit' || waybill.value.status === 'loading') {
    alerts.push({
      id: 'demo-1',
      alert_type: 'stationary',
      alert_level: 'medium',
      alert_message: '车辆在当前位置已停留约95分钟，超出正常休息时间范围，建议确认司机状态。',
      created_at: new Date(now.getTime() - 95 * 60000).toISOString(),
      is_handled: false,
      is_demo: true
    })
  }
  
  alerts.push({
    id: 'demo-2',
    alert_type: 'off_route',
    alert_level: 'high',
    alert_message: '检测到车辆偏离规划路线约3.2公里，已自动记录偏离信息。',
    created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
    is_handled: true,
    is_demo: true
  })
  
  return alerts
})

const allAlerts = computed(() => {
  const existingAlerts = waybill.value?.alerts || []
  if (existingAlerts.length === 0) {
    return demoAlerts.value
  }
  return [...existingAlerts, ...demoAlerts.value.filter(d => !existingAlerts.some(e => e.id === d.id))]
})

const currentAlerts = computed(() => {
  return allAlerts.value.filter(a => !a.is_handled)
})

const pendingAlertsCount = computed(() => {
  return currentAlerts.value.length
})

const latestTracking = computed(() => {
  if (!waybill.value?.tracking?.length) return null
  return waybill.value.tracking[waybill.value.tracking.length - 1]
})

const tripStats = computed(() => {
  if (!waybill.value?.tracking?.length || waybill.value.tracking.length < 2) return null
  
  const tracking = waybill.value.tracking
  const first = tracking[0]
  const last = tracking[tracking.length - 1]
  
  const totalDistance = calculateDistance(
    parseFloat(first.lat), parseFloat(first.lng),
    parseFloat(last.lat), parseFloat(last.lng)
  )
  
  const startTime = new Date(first.recorded_at || first.created_at)
  const endTime = new Date(last.recorded_at || last.created_at)
  const durationMs = endTime - startTime
  const hours = Math.floor(durationMs / 3600000)
  const minutes = Math.floor((durationMs % 3600000) / 60000)
  const totalDuration = `${hours}小时${minutes}分钟`
  
  const durationHours = durationMs / 3600000
  const avgSpeed = durationHours > 0 ? Math.round(totalDistance / durationHours) : 0
  
  return {
    totalDistance: totalDistance.toFixed(1),
    totalDuration,
    avgSpeed
  }
})

const cargoPricing = computed(() => {
  if (!cargoDetail.value) return null
  const cargo = cargoDetail.value
  if (cargo.base_price == null && cargo.suggested_price == null) return null
  return {
    base_price: cargo.base_price,
    distanceFactor: cargo.distanceFactor ?? cargo.distance_factor,
    vehicleFactor: cargo.vehicleFactor ?? cargo.vehicle_factor,
    timeFactor: cargo.timeFactor ?? cargo.time_factor,
    suggested_price: cargo.suggested_price ?? cargo.suggestedPrice
  }
})

const bids = computed(() => {
  if (!cargoDetail.value?.bids?.length) return []
  return cargoDetail.value.bids
})

const hasAvailableAction = computed(() => {
  const status = waybill.value?.status
  if (isDriver.value) {
    return ['created', 'loading', 'in_transit'].includes(status)
  }
  if (isShipper.value) {
    return ['created', 'completed'].includes(status)
  }
  return false
})

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function getStatusType(status) {
  const types = {
    created: 'info',
    loading: 'warning',
    in_transit: 'primary',
    completed: 'success',
    exception: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    created: '待装货',
    loading: '装货中',
    in_transit: '运输中',
    completed: '已完成',
    exception: '异常'
  }
  return texts[status] || status
}

function getStepIndex(status) {
  const steps = {
    created: 1,
    loading: 2,
    in_transit: 3,
    completed: 4
  }
  return steps[status] || 0
}

function getFlowStepIndex(status) {
  const steps = {
    created: 3,
    loading: 4,
    in_transit: 5,
    completed: 6
  }
  if (waybill.value?.escrow?.status === 'released') {
    return 7
  }
  return steps[status] || 0
}

function isActiveStatus(status) {
  return ['created', 'loading', 'in_transit'].includes(status)
}

function getTrackingColor(record) {
  if (record.is_off_route) return 'danger'
  if (record.is_stationary || (record.stationary_minutes && record.stationary_minutes > 60)) return 'warning'
  return 'primary'
}

function getAlertTypeText(type) {
  const texts = {
    off_route: '偏离路线',
    stationary: '长时间静止',
    timeout: '超时未签收',
    speed_violation: '超速告警'
  }
  return texts[type] || type
}

function getAlertIcon(type) {
  const icons = {
    off_route: 'Position',
    stationary: 'Clock',
    timeout: 'Timer',
    speed_violation: 'Odometer'
  }
  return icons[type] || Warning
}

function getAlertTimelineType(level) {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return types[level] || 'warning'
}

function getAlertLevelType(level) {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'error'
  }
  return types[level] || 'warning'
}

function getEscrowStep() {
  const status = waybill.value?.escrow?.status
  const waybillStatus = waybill.value?.status
  if (status === 'released') return 4
  if (status === 'frozen' && waybillStatus === 'completed') return 3
  if (status === 'frozen' && waybillStatus === 'in_transit') return 2
  if (status === 'frozen') return 1
  return 0
}

function getEscrowStatusType(status) {
  const types = {
    frozen: 'warning',
    released: 'success'
  }
  return types[status] || 'info'
}

function getEscrowStatusText(status) {
  const texts = {
    frozen: '已冻结',
    released: '已释放'
  }
  return texts[status] || '未冻结'
}

function getBidStatusText(status) {
  const texts = {
    pending: '待回应',
    accepted: '已接受',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

async function loadDetail() {
  loading.value = true
  permissionError.value = false
  try {
    const id = route.params.id || route.query.id
    if (!id) {
      ElMessage.error('运单ID不存在')
      return
    }
    const [detailRes, splitRes] = await Promise.all([
      waybillApi.getDetail(id),
      waybillApi.getSplit(id)
    ])
    waybill.value = detailRes.data
    splitData.value = splitRes.data

    if (waybill.value?.cargo_id) {
      try {
        const cargoRes = await shipperApi.getCargoDetail(waybill.value.cargo_id)
        cargoDetail.value = cargoRes.data
      } catch (err) {
        console.error('Failed to load cargo detail:', err)
      }
    }
  } catch (err) {
    console.error(err)
    if (err.response?.status === 403 || err.response?.status === 401) {
      permissionError.value = true
    } else {
      ElMessage.error(err.response?.data?.message || '加载运单详情失败')
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  if (isShipper.value) {
    router.push('/shipper/cargo')
  } else if (isDriver.value) {
    router.push('/driver/cargo-pool')
  } else if (isAdmin.value) {
    router.push('/admin/waybills')
  } else {
    router.back()
  }
}

function goToWallet() {
  router.push('/wallet')
}

function goToInsurance() {
  router.push('/admin/insurance')
}

function previewImage(url) {
  previewImageUrl.value = url
  imageViewerVisible.value = true
}

async function handleStartLoading() {
  try {
    await ElMessageBox.confirm('确认开始装货吗？', '提示', { type: 'warning' })
    actionLoading.value = true
    await waybillApi.startLoading(waybill.value.id)
    ElMessage.success('已开始装货')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  } finally {
    actionLoading.value = false
  }
}

async function handleOcrUpload(file) {
  try {
    ocrLoading.value = true
    const res = await waybillApi.ocrWaybill(waybill.value.id, file.file)
    ElMessage.success(res.message || 'OCR识别完成')
    loadDetail()
  } catch (err) {
    console.error(err)
  } finally {
    ocrLoading.value = false
  }
}

async function handleStartTransport() {
  try {
    await ElMessageBox.confirm('确认开始运输吗？', '提示', { type: 'warning' })
    actionLoading.value = true
    await waybillApi.startTransport(waybill.value.id)
    ElMessage.success('已开始运输')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  } finally {
    actionLoading.value = false
  }
}

async function handleReportLocation() {
  try {
    if (!navigator.geolocation) {
      ElMessage.error('浏览器不支持定位功能')
      return
    }
    actionLoading.value = true
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
    })
    const location = {
      lng: position.coords.longitude,
      lat: position.coords.latitude
    }
    await driverApi.updateLocation(location)
    await waybillApi.track(waybill.value.id, location)
    ElMessage.success('位置已上报')
  } catch (err) {
    console.error(err)
    ElMessage.error('获取位置失败，请检查定位权限')
  } finally {
    actionLoading.value = false
  }
}

async function handleComplete() {
  try {
    await ElMessageBox.confirm('确认完成运输吗？完成后将通知货主确认收货。', '提示', { type: 'warning' })
    actionLoading.value = true
    await waybillApi.complete(waybill.value.id)
    ElMessage.success('运输已完成，等待收货确认')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  } finally {
    actionLoading.value = false
  }
}

async function handleFreezeEscrow() {
  try {
    await ElMessageBox.confirm(`确认冻结担保资金 ¥${waybill.value?.agreed_price} 吗？`, '提示', { type: 'warning' })
    actionLoading.value = true
    await paymentApi.freezeEscrow({
      waybill_id: waybill.value.id,
      amount: waybill.value.agreed_price
    })
    ElMessage.success('担保资金已冻结')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  } finally {
    actionLoading.value = false
  }
}

async function handleReleaseEscrow() {
  try {
    await ElMessageBox.confirm(`确认解冻担保资金 ¥${waybill.value?.agreed_price} 吗？`, '提示', { type: 'warning' })
    actionLoading.value = true
    await paymentApi.releaseEscrow({
      waybill_id: waybill.value.id,
      amount: waybill.value.agreed_price
    })
    ElMessage.success('担保资金已解冻')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  } finally {
    actionLoading.value = false
  }
}

async function handleMarkAlert(alert) {
  if (alert.is_demo) {
    ElMessage.info('这是演示数据，无法标记处理')
    return
  }
  try {
    await ElMessageBox.confirm('确认将此预警标记为已处理吗？', '提示', { type: 'warning' })
    await adminApi.handleAlert(alert.id, { is_handled: true })
    ElMessage.success('预警已标记为已处理')
    loadDetail()
  } catch (err) {
    if (err !== 'cancel') console.error(err)
  }
}

function openConfirmDialog() {
  reviewForm.rating = 5
  reviewForm.comment = ''
  confirmDialogVisible.value = true
}

async function handleConfirmReceipt() {
  if (!reviewFormRef.value) return
  try {
    await reviewFormRef.value.validate()
    actionLoading.value = true
    await waybillApi.confirmReceipt(waybill.value.id, reviewForm)
    ElMessage.success('已确认收货，感谢您的评价')
    confirmDialogVisible.value = false
    loadDetail()
  } catch (err) {
    console.error(err)
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.waybill-detail {
  padding: 20px;
}
.permission-error {
  padding: 60px 20px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.detail-card {
  margin-bottom: 20px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.card-link {
  margin-left: auto;
  font-size: 13px;
}
.waybill-no {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #409eff;
}
.price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}
.split-list {
  padding: 10px 0;
}
.split-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #e4e7ed;
}
.split-item:last-child {
  border-bottom: none;
}
.split-item.total {
  padding-top: 16px;
  border-top: 2px solid #e4e7ed;
  border-bottom: none;
  margin-top: 4px;
}
.split-label {
  color: #606266;
}
.split-value {
  font-weight: 600;
  color: #303133;
}
.split-value.deduction {
  color: #f56c6c;
}
.split-value.final {
  color: #67c23a;
  font-size: 18px;
}
.route-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 20px;
  margin-top: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}
.route-point {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.point-icon {
  font-size: 24px;
}
.start-icon {
  color: #67c23a;
}
.end-icon {
  color: #f56c6c;
}
.point-city {
  font-size: 16px;
  font-weight: 600;
}
.point-time {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
.route-line {
  flex: 1;
  display: flex;
  justify-content: center;
  color: #409eff;
  font-size: 32px;
  position: relative;
}
.route-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, #67c23a, #409eff, #f56c6c);
  z-index: 0;
}
.route-line .el-icon {
  background: #f5f7fa;
  padding: 0 10px;
  z-index: 1;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.info-content .name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.info-content .phone {
  color: #606266;
  margin-bottom: 4px;
}
.info-content .sub-info {
  color: #909399;
  font-size: 13px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.alert-tip {
  margin-top: 12px;
}
.photo-wrapper {
  text-align: center;
}
.waybill-photo {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}
.waybill-photo:hover {
  transform: scale(1.02);
}
.photo-upload-footer {
  margin-top: 16px;
  text-align: center;
}
.ocr-result {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  height: 100%;
}
.ocr-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}
.ocr-content {
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
  line-height: 1.6;
}
.preview-image {
  width: 100%;
  border-radius: 4px;
}

.upload-area {
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}
.upload-area:hover {
  border-color: #409eff;
  background: #ecf5ff;
}
.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.upload-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-icon {
  font-size: 64px;
  color: #c0c4cc;
}
.upload-plus-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 24px;
  color: #409eff;
  background: white;
  border-radius: 50%;
  padding: 4px;
}
.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}
.upload-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.no-photo-prompt {
  text-align: center;
  padding: 30px 0;
}
.no-photo-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.no-photo-text {
  color: #909399;
  margin: 8px 0;
  font-size: 14px;
}
.no-photo-hint {
  color: #c0c4cc;
  font-size: 13px;
  margin: 0;
}

.tracking-link {
  margin-left: auto;
  font-size: 13px;
  font-weight: 400;
  color: #409eff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tracking-link:hover {
  color: #66b1ff;
}

.trip-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}
.stat-icon.distance {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.stat-icon.duration {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.stat-icon.speed {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.stat-info .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.stat-info .stat-label {
  font-size: 12px;
  color: #909399;
}

.current-position {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #ecf5ff;
  border-radius: 6px;
  margin-bottom: 16px;
}
.position-label {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}
.position-value {
  color: #409eff;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
.position-speed {
  color: #67c23a;
  font-size: 13px;
  margin-left: auto;
}

.tracking-timeline {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}
.tracking-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tracking-position {
  font-size: 13px;
  color: #303133;
  font-family: 'Courier New', monospace;
}
.tracking-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tracking-meta span {
  font-size: 12px;
  color: #909399;
}
.tracking-tag {
  margin-left: 4px;
}

.alert-badge {
  margin-left: 8px;
}
.alert-tabs {
  margin-top: -8px;
}
.alert-timeline {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}
.alert-card {
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fa;
}
.alert-card.alert-high {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}
.alert-card.alert-medium {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}
.alert-card.alert-low {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}
.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.alert-type {
  display: flex;
  align-items: center;
  gap: 6px;
}
.alert-icon {
  font-size: 16px;
}
.alert-high .alert-icon {
  color: #f56c6c;
}
.alert-medium .alert-icon {
  color: #e6a23c;
}
.alert-low .alert-icon {
  color: #409eff;
}
.alert-title {
  font-weight: 600;
  font-size: 14px;
}
.alert-message {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}
.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.alert-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}
.no-alerts {
  text-align: center;
  padding: 40px 20px;
}
.no-alerts-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 12px;
}
.no-alerts-text {
  color: #909399;
  margin: 0;
}

.escrow-steps {
  margin-bottom: 24px;
}
.escrow-descriptions {
  margin-bottom: 20px;
}
.escrow-empty {
  padding: 10px 0;
}

.fund-flow {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}
.fund-flow-title {
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
  font-size: 14px;
}
.fund-flow-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fund-flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.fund-flow-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
}
.shipper-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.freeze-icon {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.transport-icon {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.release-icon {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}
.fund-flow-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}
.fund-flow-arrow {
  color: #c0c4cc;
  font-size: 20px;
  flex-shrink: 0;
}
.escrow-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 14px;
  background: #f0f9eb;
  border-radius: 4px;
  color: #67c23a;
  font-size: 13px;
}

.pricing-breakdown {
  padding: 10px 0;
}
.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed #e4e7ed;
}
.pricing-row:last-child {
  border-bottom: none;
}
.pricing-label {
  color: #606266;
  font-size: 14px;
}
.pricing-value {
  font-weight: 600;
  color: #303133;
}
.pricing-value.suggested {
  color: #409eff;
}
.pricing-value.agreed {
  color: #f56c6c;
  font-size: 16px;
}
.pricing-divider {
  height: 2px;
  background: #e4e7ed;
  margin: 8px 0;
}
.pricing-formula {
  margin-top: 16px;
  padding: 14px;
  background: #f5f7fa;
  border-radius: 6px;
}
.formula-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
  font-size: 13px;
}
.formula-content {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #409eff;
  line-height: 1.6;
}

.bid-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bid-item {
  padding: 14px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: border-color 0.2s;
}
.bid-item:hover {
  border-color: #c0c4cc;
}
.bid-accepted {
  border-color: #67c23a;
  background: #f0f9eb;
}
.bid-accepted:hover {
  border-color: #67c23a;
}
.bid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.bid-driver {
  font-weight: 600;
  color: #303133;
}
.bid-price {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}
.bid-price-accepted {
  color: #67c23a;
}
.bid-message {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
.bid-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bid-time {
  color: #909399;
  font-size: 12px;
}

.flow-timeline-card {
  margin-bottom: 20px;
}
.flow-steps {
  padding: 10px 0;
}
.flow-step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #c0c4cc;
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
}
.flow-step-icon.wait {
  color: #c0c4cc;
  background: #f5f7fa;
  border-color: #e4e7ed;
}
.flow-step-icon.process {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}
.flow-step-icon.finish {
  color: #fff;
  background: #67c23a;
  border-color: #67c23a;
}
.flow-step-icon.error {
  color: #fff;
  background: #f56c6c;
  border-color: #f56c6c;
}
.flow-step-icon.success {
  color: #fff;
  background: #67c23a;
  border-color: #67c23a;
}
</style>