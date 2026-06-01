<template>
  <div>
    <div class="metrics" style="grid-template-columns: repeat(4, 1fr);">
      <div class="metric">
        <span>累计营收</span>
        <strong>{{ currency(data.summary?.totalRevenue || 0) }}</strong>
        <small>已收款</small>
      </div>
      <div class="metric">
        <span>累计课消</span>
        <strong>{{ currency(data.summary?.totalConsumed || 0) }}</strong>
        <small>已确认收入</small>
      </div>
      <div class="metric">
        <span>剩余负债</span>
        <strong>{{ currency(data.summary?.totalLiability || 0) }}</strong>
        <small>待消耗预收款</small>
      </div>
      <div class="metric">
        <span>待审批退费</span>
        <strong>{{ currency(data.summary?.pendingRefunds || 0) }}</strong>
        <small>待处理</small>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'purchases' }" @click="activeTab = 'purchases'">购课记录</button>
      <button :class="{ active: activeTab === 'refunds' }" @click="activeTab = 'refunds'">退费管理</button>
      <button :class="{ active: activeTab === 'transfers' }" @click="activeTab = 'transfers'">转课管理</button>
      <button :class="{ active: activeTab === 'add' }" @click="activeTab = 'add'">新增购课</button>
    </div>

    <div v-if="activeTab === 'purchases'" class="panel">
      <div class="panel-head">
        <h2>购课记录</h2>
        <span>{{ data.purchases?.length || 0 }} 条</span>
      </div>
      <div class="table-wrap">
        <table v-if="data.purchases && data.purchases.length">
          <thead>
            <tr>
              <th>学员</th>
              <th>课包</th>
              <th>总课时</th>
              <th>赠课</th>
              <th>已用</th>
              <th>剩余</th>
              <th>单价</th>
              <th>实付</th>
              <th>合同号</th>
              <th>发票</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in data.purchases" :key="p.id">
              <td><strong>{{ p.student_name }}</strong></td>
              <td>{{ p.package_name || '自定义' }}</td>
              <td>{{ p.total_hours }}</td>
              <td>{{ p.gift_hours || 0 }}</td>
              <td>{{ p.used_hours?.toFixed(1) || 0 }}</td>
              <td><span class="hours">{{ p.remaining_hours?.toFixed(1) || 0 }}</span></td>
              <td>{{ currency(p.unit_price || 0) }}</td>
              <td>{{ currency(p.paid_amount || 0) }}</td>
              <td>{{ p.contract_no || '-' }}</td>
              <td>{{ p.has_invoice ? '已开' : '未开' }}</td>
              <td><span :class="['badge', p.status]">{{ p.status === 'active' ? '有效' : p.status }}</span></td>
              <td>
                <button class="btn-link" @click="showPurchaseDetail(p)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无购课记录</div>
      </div>
    </div>

    <div v-if="activeTab === 'refunds'" class="panel">
      <div class="panel-head">
        <h2>退费申请</h2>
        <span>{{ data.refunds?.length || 0 }} 条</span>
      </div>
      <div class="table-wrap">
        <table v-if="data.refunds && data.refunds.length">
          <thead>
            <tr>
              <th>学员</th>
              <th>退费课时</th>
              <th>退费金额</th>
              <th>已用课时</th>
              <th>发票</th>
              <th>原因</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in data.refunds" :key="r.id">
              <td><strong>{{ r.student_name }}</strong></td>
              <td>{{ r.refund_hours }}</td>
              <td class="hours">{{ currency(r.refund_amount || 0) }}</td>
              <td>{{ r.used_hours?.toFixed(1) || 0 }}</td>
              <td>{{ r.has_invoice ? '已退' : '未开' }}</td>
              <td>{{ r.reason || '-' }}</td>
              <td><span :class="['badge', r.approval_status]">{{ r.approval_status === 'pending' ? '待审批' : r.approval_status === 'approved' ? '已通过' : '已拒绝' }}</span></td>
              <td>
                <template v-if="r.approval_status === 'pending'">
                  <button class="btn-link" @click="approveRefund(r.id)">通过</button>
                </template>
                <template v-else>
                  <span class="muted">-</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无退费申请</div>
      </div>
      <div style="margin-top: 20px;">
        <button class="btn-secondary" @click="showRefundModal = true">提交退费申请</button>
      </div>
    </div>

    <div v-if="activeTab === 'transfers'" class="panel">
      <div class="panel-head">
        <h2>转课申请</h2>
        <span>{{ data.transfers?.length || 0 }} 条</span>
      </div>
      <div class="table-wrap">
        <table v-if="data.transfers && data.transfers.length">
          <thead>
            <tr>
              <th>转出学员</th>
              <th>转入学员</th>
              <th>转课时数</th>
              <th>金额</th>
              <th>原因</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in data.transfers" :key="t.id">
              <td><strong>{{ t.from_student_name }}</strong></td>
              <td><strong>{{ t.to_student_name }}</strong></td>
              <td>{{ t.transfer_hours }}</td>
              <td>{{ currency(t.transfer_amount || 0) }}</td>
              <td>{{ t.reason || '-' }}</td>
              <td><span :class="['badge', t.approval_status]">{{ t.approval_status === 'pending' ? '待审批' : t.approval_status === 'approved' ? '已通过' : '已拒绝' }}</span></td>
              <td>
                <template v-if="t.approval_status === 'pending'">
                  <button class="btn-link" @click="approveTransfer(t.id)">通过</button>
                </template>
                <template v-else>
                  <span class="muted">-</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无转课申请</div>
      </div>
      <div style="margin-top: 20px;">
        <button class="btn-secondary" @click="showTransferModal = true">提交转课申请</button>
      </div>
    </div>

    <div v-if="activeTab === 'add'" class="panel">
      <div class="panel-head">
        <h2>新增购课</h2>
      </div>
      <div class="form-stack" style="max-width: 600px;">
        <div class="form-group">
          <label>选择学员 *</label>
          <select v-model="purchaseForm.student_id">
            <option :value="null">请选择学员</option>
            <option v-for="s in students" :key="s.id" :value="s.id">
              {{ s.name }} ({{ s.parent_phone || s.phone }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择课包</label>
          <select v-model="purchaseForm.package_id" @change="onPackageChange">
            <option :value="null">自定义</option>
            <option v-for="p in packages" :key="p.id" :value="p.id">
              {{ p.name }} - {{ p.total_hours }}课时 {{ currency(p.price) }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>购买课时 *</label>
            <input v-model.number="purchaseForm.total_hours" type="number" min="1" step="0.5" />
          </div>
          <div class="form-group">
            <label>赠送课时</label>
            <input v-model.number="purchaseForm.gift_hours" type="number" min="0" step="0.5" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>单价（元/课时）</label>
            <input v-model.number="purchaseForm.unit_price" type="number" min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>优惠金额</label>
            <input v-model.number="purchaseForm.discount_amount" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>应付金额</label>
            <input :value="calculatedTotal" type="text" readonly />
          </div>
          <div class="form-group">
            <label>实付金额 *</label>
            <input v-model.number="purchaseForm.paid_amount" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>合同号</label>
            <input v-model="purchaseForm.contract_no" type="text" placeholder="自动生成或手动输入" />
          </div>
          <div class="form-group">
            <label>生效日期</label>
            <input v-model="purchaseForm.effective_date" type="date" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>是否已开票</label>
            <select v-model="purchaseForm.has_invoice">
              <option :value="0">否</option>
              <option :value="1">是</option>
            </select>
          </div>
          <div class="form-group">
            <label>开票金额</label>
            <input v-model.number="purchaseForm.invoice_amount" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="purchaseForm.remark" rows="2" placeholder="购课备注"></textarea>
        </div>
        <button class="btn-primary" @click="submitPurchase">确认购课</button>
      </div>
    </div>

    <div v-if="showRefundModal" class="modal-overlay" @click.self="closeRefundModal">
      <div class="modal modal-large">
        <div class="modal-head">
          <h3>退费申请</h3>
          <button class="btn-close" @click="closeRefundModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>选择学员 *</label>
            <select v-model="refundForm.student_id" @change="onStudentChange">
              <option :value="null">请选择学员</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.name }} (剩余: {{ s.remaining_hours?.toFixed(1) || 0 }}课时)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>选择购课记录 *</label>
            <select v-model="refundForm.purchase_id">
              <option :value="null">请选择购课记录</option>
              <option v-for="p in studentPurchases" :key="p.id" :value="p.id">
                {{ p.package_name || '自定义' }} - 剩余{{ p.remaining_hours?.toFixed(1) }}课时
              </option>
            </select>
          </div>

          <div v-if="selectedPurchase" class="purchase-info">
            <h4>购课信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">购课课包：</span>
                <span class="info-value">{{ selectedPurchase.package_name || '自定义' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">总课时：</span>
                <span class="info-value">{{ selectedPurchase.total_hours }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">赠课：</span>
                <span class="info-value">{{ selectedPurchase.gift_hours || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">已用课时：</span>
                <span class="info-value">{{ (selectedPurchase.used_hours || 0).toFixed(1) }}（付费课时{{ usedPaidHours.toFixed(1) }} + 赠课{{ usedGiftHours.toFixed(1) }}）</span>
              </div>
              <div class="info-item">
                <span class="info-label">剩余课时：</span>
                <span class="info-value">{{ (selectedPurchase.remaining_hours || 0).toFixed(1) }}（付费课时{{ remainingPaidHours.toFixed(1) }} + 赠课{{ remainingGiftHours.toFixed(1) }}）</span>
              </div>
              <div class="info-item">
                <span class="info-label">原单价：</span>
                <span class="info-value">{{ currency(selectedPurchase.unit_price || 0) }}/课时</span>
              </div>
              <div class="info-item">
                <span class="info-label">优惠折扣：</span>
                <span class="info-value">{{ discountRate }}折</span>
              </div>
              <div class="info-item">
                <span class="info-label">实付金额：</span>
                <span class="info-value">{{ currency(selectedPurchase.paid_amount || 0) }}</span>
              </div>
              <div class="info-item info-item-full">
                <span class="info-label">是否已开票：</span>
                <span class="info-value">{{ selectedPurchase.has_invoice ? '是，开票金额' + currency(selectedPurchase.invoice_amount || 0) : '否' }}</span>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>退费课时 *</label>
              <input v-model.number="refundForm.refund_hours" type="number" min="0" step="0.5" :class="{ 'input-error': refundErrors.hours }" />
              <div v-if="refundErrors.hours" class="error-text">{{ refundErrors.hours }}</div>
            </div>
            <div class="form-group">
              <label>发票是否已退回</label>
              <select v-model="refundForm.has_invoice" :class="{ 'input-error': refundErrors.invoice }">
                <option :value="0">否/未开票</option>
                <option :value="1">是</option>
              </select>
              <div v-if="refundErrors.invoice" class="error-text">{{ refundErrors.invoice }}</div>
            </div>
          </div>

          <div v-if="selectedPurchase && refundForm.refund_hours >= 0" class="refund-calc">
            <h4>退费计算</h4>
            <div class="calc-grid">
              <div class="calc-item">
                <span class="calc-label">可退最大课时：</span>
                <span class="calc-value">{{ maxRefundableHours.toFixed(1) }}（仅付费课时可退，赠课不退）</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">申请退费课时：</span>
                <span class="calc-value">{{ refundForm.refund_hours || 0 }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">预计退费金额：</span>
                <span class="calc-value">{{ currency(expectedRefundAmount) }}</span>
              </div>
              <div class="calc-item" v-if="selectedPurchase.has_invoice">
                <span class="calc-label">需扣除已开票税额：</span>
                <span class="calc-value">{{ currency(invoiceTaxAmount) }}</span>
              </div>
              <div class="calc-item calc-total">
                <span class="calc-label">实际可退金额：</span>
                <span class="calc-value">{{ currency(actualRefundAmount) }}</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>退费原因 *</label>
            <textarea v-model="refundForm.reason" rows="2" placeholder="请说明退费原因" :class="{ 'input-error': refundErrors.reason }"></textarea>
            <div v-if="refundErrors.reason" class="error-text">{{ refundErrors.reason }}</div>
          </div>

          <div v-if="actualRefundAmount > 0" class="approval-info">
            <h4>审批要求</h4>
            <div class="approval-item" :class="{ 'approval-active': actualRefundAmount > 5000 }">
              <span class="approval-icon">{{ actualRefundAmount > 5000 ? '✓' : '○' }}</span>
              <span>退费金额 > ¥5000：需校长审批</span>
            </div>
            <div class="approval-item" :class="{ 'approval-active': actualRefundAmount > 2000 && actualRefundAmount <= 5000 }">
              <span class="approval-icon">{{ actualRefundAmount > 2000 && actualRefundAmount <= 5000 ? '✓' : '○' }}</span>
              <span>退费金额 > ¥2000：需教务主管审批</span>
            </div>
            <div class="approval-item" :class="{ 'approval-active': actualRefundAmount <= 2000 }">
              <span class="approval-icon">{{ actualRefundAmount <= 2000 ? '✓' : '○' }}</span>
              <span>退费金额 ≤ ¥2000：需顾问审批</span>
            </div>
          </div>

          <div class="checklist">
            <h4>核对清单</h4>
            <div class="checklist-item" :class="{ 'check-ok': checklist.selectedPurchase, 'check-no': !checklist.selectedPurchase }">
              <span class="check-icon">{{ checklist.selectedPurchase ? '✓' : '✗' }}</span>
              <span>已选择购课记录</span>
            </div>
            <div class="checklist-item" :class="{ 'check-ok': checklist.validHours, 'check-no': !checklist.validHours }">
              <span class="check-icon">{{ checklist.validHours ? '✓' : '✗' }}</span>
              <span>退费课时有效（大于0且不超过剩余付费课时）</span>
            </div>
            <div class="checklist-item" :class="{ 'check-ok': checklist.invoiceOk, 'check-no': !checklist.invoiceOk }">
              <span class="check-icon">{{ checklist.invoiceOk ? '✓' : '✗' }}</span>
              <span>发票已处理（已开票订单需退回发票）</span>
            </div>
            <div class="checklist-item" :class="{ 'check-ok': checklist.hasReason, 'check-no': !checklist.hasReason }">
              <span class="check-icon">{{ checklist.hasReason ? '✓' : '✗' }}</span>
              <span>已填写退费原因</span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" @click="closeRefundModal">取消</button>
          <button class="btn-primary" @click="submitRefund" :disabled="!canSubmit">提交申请</button>
        </div>
      </div>
    </div>

    <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
      <div class="modal">
        <div class="modal-head">
          <h3>转课申请</h3>
          <button class="btn-close" @click="showTransferModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>转出学员 *</label>
            <select v-model="transferForm.from_student_id" @change="onFromStudentChange">
              <option :value="null">请选择转出学员</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.name }} (剩余: {{ s.remaining_hours?.toFixed(1) || 0 }}课时)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>选择购课记录 *</label>
            <select v-model="transferForm.purchase_id">
              <option :value="null">请选择购课记录</option>
              <option v-for="p in fromStudentPurchases" :key="p.id" :value="p.id">
                {{ p.package_name || '自定义' }} - 剩余{{ p.remaining_hours?.toFixed(1) }}课时
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>转入学员 *</label>
            <select v-model="transferForm.to_student_id">
              <option :value="null">请选择转入学员</option>
              <option v-for="s in availableToStudents" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>转课时数 *</label>
              <input v-model.number="transferForm.transfer_hours" type="number" min="0" step="0.5" />
            </div>
            <div class="form-group">
              <label>转账金额</label>
              <input v-model.number="transferForm.transfer_amount" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-group">
            <label>转课原因 *</label>
            <textarea v-model="transferForm.reason" rows="2" placeholder="请说明转课原因"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-secondary" @click="showTransferModal = false">取消</button>
          <button class="btn-primary" @click="submitTransfer">提交申请</button>
        </div>
      </div>
    </div>

    <div v-if="showRefundResultModal" class="modal-overlay" @click.self="showRefundResultModal = false">
      <div class="modal result-modal">
        <div class="modal-head">
          <h3>退费申请提交成功</h3>
          <button class="btn-close" @click="showRefundResultModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="result-success">
            <div class="success-icon">✓</div>
            <div class="success-text">退费申请已提交</div>
          </div>

          <div class="result-section">
            <div class="result-title">学员信息</div>
            <div class="result-row">
              <span class="result-label">学员姓名：</span>
              <span class="result-value">{{ refundResult.student_name }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">购课课包：</span>
              <span class="result-value">{{ refundResult.package_name || '自定义' }}</span>
            </div>
          </div>

          <div class="result-section">
            <div class="result-title">课时校验结果</div>
            <div class="result-row">
              <span class="result-label">总购课时：</span>
              <span class="result-value">{{ refundResult.total_hours }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">赠课课时：</span>
              <span class="result-value">{{ refundResult.gift_hours || 0 }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">已用课时：</span>
              <span class="result-value">{{ refundResult.used_hours?.toFixed(1) || 0 }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">剩余付费课时：</span>
              <span class="result-value valid">{{ refundResult.remaining_paid_hours?.toFixed(1) || 0 }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">申请退费课时：</span>
              <span class="result-value highlight">{{ refundResult.refund_hours }}</span>
            </div>
            <div class="result-check" :class="refundResult.hours_valid ? 'check-pass' : 'check-fail'">
              <span class="check-icon">{{ refundResult.hours_valid ? '✓' : '✗' }}</span>
              <span>退费课时校验：{{ refundResult.hours_valid ? '通过' : '不通过' }}（不超过剩余付费课时）</span>
            </div>
          </div>

          <div class="result-section">
            <div class="result-title">优惠与金额校验</div>
            <div class="result-row">
              <span class="result-label">原单价：</span>
              <span class="result-value">{{ currency(refundResult.unit_price || 0) }}/课时</span>
            </div>
            <div class="result-row">
              <span class="result-label">优惠折扣：</span>
              <span class="result-value">{{ refundResult.discount_rate }}折</span>
            </div>
            <div class="result-row">
              <span class="result-label">实付金额：</span>
              <span class="result-value">{{ currency(refundResult.paid_amount || 0) }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">预计退费金额：</span>
              <span class="result-value highlight">{{ currency(refundResult.expected_refund_amount || 0) }}</span>
            </div>
            <div class="result-row" v-if="refundResult.has_invoice">
              <span class="result-label">已开票税额（6%）：</span>
              <span class="result-value deduct">-{{ currency(refundResult.tax_deducted || 0) }}</span>
            </div>
            <div class="result-row total">
              <span class="result-label">实际可退金额：</span>
              <span class="result-value total">{{ currency(refundResult.refund_amount || 0) }}</span>
            </div>
          </div>

          <div class="result-section">
            <div class="result-title">发票状态校验</div>
            <div class="result-row">
              <span class="result-label">发票状态：</span>
              <span class="result-value">{{ refundResult.has_invoice ? '已开票' : '未开票' }}</span>
            </div>
            <div class="result-row" v-if="refundResult.has_invoice">
              <span class="result-label">发票是否退回：</span>
              <span class="result-value">{{ refundResult.invoice_returned ? '已退回' : '未退回' }}</span>
            </div>
            <div class="result-check" :class="refundResult.invoice_valid ? 'check-pass' : 'check-fail'">
              <span class="check-icon">{{ refundResult.invoice_valid ? '✓' : '✗' }}</span>
              <span>发票校验：{{ refundResult.invoice_valid ? '通过' : '不通过' }}{{ refundResult.has_invoice ? '（已开票需退回）' : '（无需处理）' }}</span>
            </div>
          </div>

          <div class="result-section">
            <div class="result-title">审批要求</div>
            <div class="approval-result" :class="refundResult.approval_level">
              <div class="approval-item" :class="{ active: refundResult.approval_level === 'principal' }">
                <span class="approval-icon">{{ refundResult.approval_level === 'principal' ? '→' : '○' }}</span>
                <span>校长审批（退费 > ¥5000）</span>
              </div>
              <div class="approval-item" :class="{ active: refundResult.approval_level === 'director' }">
                <span class="approval-icon">{{ refundResult.approval_level === 'director' ? '→' : '○' }}</span>
                <span>教务主管审批（¥2000 < 退费 ≤ ¥5000）</span>
              </div>
              <div class="approval-item" :class="{ active: refundResult.approval_level === 'consultant' }">
                <span class="approval-icon">{{ refundResult.approval_level === 'consultant' ? '→' : '○' }}</span>
                <span>顾问审批（退费 ≤ ¥2000）</span>
              </div>
            </div>
          </div>

          <div class="result-tip">
            <span class="tip-icon">ℹ</span>
            <span>申请已记录，待审批后可复查退费链路</span>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="showRefundResultModal = false">确定</button>
        </div>
      </div>
    </div>

    <div v-if="showPurchaseDetailModal" class="modal-overlay" @click.self="closePurchaseDetail">
      <div class="modal modal-xl">
        <div class="modal-head">
          <h3>购课记录详情</h3>
          <button class="btn-close" @click="closePurchaseDetail">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedPurchaseDetail" class="detail-content">
            <div class="detail-section">
              <div class="section-title">基础信息</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">学员姓名：</span>
                  <span class="detail-value"><strong>{{ selectedPurchaseDetail.student_name }}</strong></span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">课包名称：</span>
                  <span class="detail-value">{{ selectedPurchaseDetail.package_name || '自定义' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">合同编号：</span>
                  <span class="detail-value">{{ selectedPurchaseDetail.contract_no || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">购买日期：</span>
                  <span class="detail-value">{{ selectedPurchaseDetail.created_at }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">课时与金额闭环</div>
              <div class="balance-chain">
                <div class="chain-node">
                  <div class="chain-value">{{ selectedPurchaseDetail.total_hours }} + {{ selectedPurchaseDetail.gift_hours || 0 }}</div>
                  <div class="chain-label">总购课时（付费+赠课）</div>
                </div>
                <div class="chain-operator">−</div>
                <div class="chain-node highlight">
                  <div class="chain-value hours">{{ selectedPurchaseDetail.used_hours?.toFixed(1) || 0 }}</div>
                  <div class="chain-label">已消耗课时</div>
                </div>
                <div class="chain-operator">=</div>
                <div class="chain-node result">
                  <div class="chain-value hours">{{ selectedPurchaseDetail.remaining_hours?.toFixed(1) || 0 }}</div>
                  <div class="chain-label">剩余课时</div>
                </div>
              </div>
              <div class="formula-check">
                <span class="formula">{{ selectedPurchaseDetail.total_hours }} + {{ selectedPurchaseDetail.gift_hours || 0 }} - {{ selectedPurchaseDetail.used_hours?.toFixed(1) || 0 }} = {{ (selectedPurchaseDetail.total_hours + (selectedPurchaseDetail.gift_hours || 0) - (selectedPurchaseDetail.used_hours || 0)).toFixed(1) }}</span>
                <span v-if="Math.abs((selectedPurchaseDetail.total_hours + (selectedPurchaseDetail.gift_hours || 0) - (selectedPurchaseDetail.used_hours || 0)) - (selectedPurchaseDetail.remaining_hours || 0)) < 0.01" class="check valid">✓ 平衡</span>
                <span v-else class="check invalid">✗ 不平衡 (剩余: {{ selectedPurchaseDetail.remaining_hours?.toFixed(1) || 0 }})</span>
              </div>
              <div class="amount-info">
                <div class="amount-row">
                  <span class="amount-label">单价：</span>
                  <span class="amount-value">{{ currency(selectedPurchaseDetail.unit_price || 0) }}/课时</span>
                </div>
                <div class="amount-row">
                  <span class="amount-label">实付金额：</span>
                  <span class="amount-value highlight">{{ currency(selectedPurchaseDetail.paid_amount || 0) }}</span>
                </div>
                <div class="amount-row">
                  <span class="amount-label">剩余价值：</span>
                  <span class="amount-value">{{ currency((selectedPurchaseDetail.remaining_hours || 0) * (selectedPurchaseDetail.unit_price || 0)) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">关联记录</div>
              <div class="relation-tabs">
                <button :class="{ active: relationTab === 'refunds' }" @click="relationTab = 'refunds'">
                  退费记录 ({{ getPurchaseRefunds(selectedPurchaseDetail.id).length }})
                </button>
                <button :class="{ active: relationTab === 'transfers' }" @click="relationTab = 'transfers'">
                  转课记录 ({{ getPurchaseTransfers(selectedPurchaseDetail.id).length }})
                </button>
                <button :class="{ active: relationTab === 'consumptions' }" @click="relationTab = 'consumptions'">
                  课消记录 ({{ getPurchaseConsumptions(selectedPurchaseDetail.id).length }})
                </button>
              </div>

              <div v-if="relationTab === 'refunds'" class="relation-content">
                <div v-if="getPurchaseRefunds(selectedPurchaseDetail.id).length" class="table-wrap">
                  <table class="inner-table">
                    <thead>
                      <tr>
                        <th>申请时间</th>
                        <th>退费课时</th>
                        <th>退费金额</th>
                        <th>审批状态</th>
                        <th>审批人</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in getPurchaseRefunds(selectedPurchaseDetail.id)" :key="r.id">
                        <td>{{ r.created_at }}</td>
                        <td>{{ r.refund_hours }}</td>
                        <td class="amount">{{ currency(r.refund_amount || 0) }}</td>
                        <td><span :class="['badge', r.approval_status]">{{ r.approval_status === 'approved' ? '已通过' : r.approval_status === 'rejected' ? '已拒绝' : '待审批' }}</span></td>
                        <td>{{ r.approved_by || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="empty">暂无退费记录</div>
              </div>

              <div v-if="relationTab === 'transfers'" class="relation-content">
                <div v-if="getPurchaseTransfers(selectedPurchaseDetail.id).length" class="table-wrap">
                  <table class="inner-table">
                    <thead>
                      <tr>
                        <th>申请时间</th>
                        <th>转入学员</th>
                        <th>转课时数</th>
                        <th>状态</th>
                        <th>审批人</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="t in getPurchaseTransfers(selectedPurchaseDetail.id)" :key="t.id">
                        <td>{{ t.created_at }}</td>
                        <td>{{ t.to_student_name || '-' }}</td>
                        <td>{{ t.transfer_hours }}</td>
                        <td><span :class="['badge', t.approval_status]">{{ t.approval_status === 'approved' ? '已通过' : t.approval_status === 'rejected' ? '已拒绝' : '待审批' }}</span></td>
                        <td>{{ t.approved_by || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="empty">暂无转课记录</div>
              </div>

              <div v-if="relationTab === 'consumptions'" class="relation-content">
                <div v-if="getPurchaseConsumptions(selectedPurchaseDetail.id).length" class="table-wrap">
                  <table class="inner-table">
                    <thead>
                      <tr>
                        <th>消耗日期</th>
                        <th>课程班级</th>
                        <th>签到状态</th>
                        <th>消耗课时</th>
                        <th>课消金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="c in getPurchaseConsumptions(selectedPurchaseDetail.id)" :key="c.id">
                        <td>{{ c.consume_date }}</td>
                        <td>{{ c.class_name || '-' }}</td>
                        <td><span :class="['badge', c.status]">{{ getConsumptionStatusName(c.status) }}</span></td>
                        <td>{{ c.hours?.toFixed(1) || 0 }}</td>
                        <td class="amount">{{ currency(c.amount || 0) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="empty">暂无课消记录</div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">发票与审批</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">发票状态：</span>
                  <span class="detail-value">
                    <span :class="['badge', selectedPurchaseDetail.has_invoice ? 'issued' : 'pending']">
                      {{ selectedPurchaseDetail.has_invoice ? '已开票' : '未开票' }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">开票金额：</span>
                  <span class="detail-value">{{ currency(selectedPurchaseDetail.invoice_amount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">合同状态：</span>
                  <span class="detail-value">
                    <span :class="['badge', selectedPurchaseDetail.contract_no ? 'issued' : 'pending']">
                      {{ selectedPurchaseDetail.contract_no ? '已签' : '待签' }}
                    </span>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">购课状态：</span>
                  <span class="detail-value">
                    <span :class="['badge', selectedPurchaseDetail.status]">
                      {{ selectedPurchaseDetail.status === 'active' ? '有效' : selectedPurchaseDetail.status }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div class="audit-tip">
              <span class="tip-icon">📊</span>
              <span>本购课记录可追溯：购课 → 课消 → 退费/转课，所有操作均有记录可复查</span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="closePurchaseDetail">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';

const props = defineProps({
  data: { type: Object, default: () => ({ purchases: [], refunds: [], transfers: [], summary: {} }) },
  students: { type: Array, default: () => [] },
  packages: { type: Array, default: () => [] },
  currency: { type: Function, required: true }
});

const emit = defineEmits(['add-purchase', 'approve-refund', 'approve-transfer', 'submit-refund', 'submit-transfer']);

const activeTab = ref('purchases');
const showRefundModal = ref(false);
const showTransferModal = ref(false);
const showRefundResultModal = ref(false);
const showPurchaseDetailModal = ref(false);
const selectedPurchaseDetail = ref(null);
const relationTab = ref('refunds');

const refundResult = reactive({
  student_name: '',
  package_name: '',
  total_hours: 0,
  gift_hours: 0,
  used_hours: 0,
  remaining_paid_hours: 0,
  refund_hours: 0,
  hours_valid: false,
  unit_price: 0,
  discount_rate: '--',
  paid_amount: 0,
  expected_refund_amount: 0,
  tax_deducted: 0,
  refund_amount: 0,
  has_invoice: false,
  invoice_returned: false,
  invoice_valid: false,
  approval_level: 'consultant'
});

const purchaseForm = reactive({
  student_id: null,
  package_id: null,
  total_hours: 0,
  gift_hours: 0,
  unit_price: 0,
  discount_amount: 0,
  paid_amount: 0,
  total_amount: 0,
  contract_no: '',
  effective_date: '',
  has_invoice: 0,
  invoice_amount: 0,
  remark: ''
});

const refundForm = reactive({
  student_id: null,
  purchase_id: null,
  refund_hours: 0,
  has_invoice: 0,
  invoice_return_amount: 0,
  reason: '',
  remark: ''
});

const refundErrors = reactive({
  hours: '',
  invoice: '',
  reason: ''
});

const transferForm = reactive({
  from_student_id: null,
  to_student_id: null,
  purchase_id: null,
  transfer_hours: 0,
  transfer_amount: 0,
  reason: '',
  remark: ''
});

const calculatedTotal = computed(() => {
  const total = (purchaseForm.total_hours || 0) * (purchaseForm.unit_price || 0);
  return props.currency(total - (purchaseForm.discount_amount || 0));
});

const selectedPurchase = computed(() => {
  return (props.data.purchases || []).find(p => p.id === refundForm.purchase_id);
});

const totalPaidHours = computed(() => {
  const p = selectedPurchase.value;
  if (!p) return 0;
  return p.total_hours - (p.gift_hours || 0);
});

const usedGiftHours = computed(() => {
  const p = selectedPurchase.value;
  if (!p) return 0;
  const usedHours = p.used_hours || 0;
  const giftHours = p.gift_hours || 0;
  return Math.min(usedHours, giftHours);
});

const usedPaidHours = computed(() => {
  const p = selectedPurchase.value;
  if (!p) return 0;
  return (p.used_hours || 0) - usedGiftHours.value;
});

const remainingPaidHours = computed(() => {
  return totalPaidHours.value - usedPaidHours.value;
});

const remainingGiftHours = computed(() => {
  const p = selectedPurchase.value;
  if (!p) return 0;
  return (p.gift_hours || 0) - usedGiftHours.value;
});

const discountRate = computed(() => {
  const p = selectedPurchase.value;
  if (!p || !p.unit_price || !p.paid_amount || !totalPaidHours.value) return '--';
  const originalTotal = p.unit_price * totalPaidHours.value;
  if (originalTotal <= 0) return '--';
  const rate = (p.paid_amount / originalTotal) * 10;
  return rate.toFixed(1);
});

const maxRefundableHours = computed(() => {
  return Math.max(0, remainingPaidHours.value);
});

const expectedRefundAmount = computed(() => {
  const p = selectedPurchase.value;
  if (!p || !refundForm.refund_hours || refundForm.refund_hours <= 0) return 0;
  if (totalPaidHours.value <= 0) return 0;
  const ratio = refundForm.refund_hours / totalPaidHours.value;
  return Math.round((p.paid_amount || 0) * ratio * 100) / 100;
});

const invoiceTaxAmount = computed(() => {
  const p = selectedPurchase.value;
  if (!p || !p.has_invoice) return 0;
  const invoiceAmount = p.invoice_amount || p.paid_amount || 0;
  const ratio = totalPaidHours.value > 0 ? refundForm.refund_hours / totalPaidHours.value : 0;
  const refundInvoiceAmount = invoiceAmount * ratio;
  return Math.round(refundInvoiceAmount * 0.06 * 100) / 100;
});

const actualRefundAmount = computed(() => {
  return Math.max(0, expectedRefundAmount.value - invoiceTaxAmount.value);
});

const checklist = computed(() => {
  const p = selectedPurchase.value;
  const hasInvoice = p?.has_invoice || false;
  const invoiceReturned = refundForm.has_invoice === 1;
  
  return {
    selectedPurchase: !!p,
    validHours: refundForm.refund_hours > 0 && refundForm.refund_hours <= remainingPaidHours.value,
    invoiceOk: !hasInvoice || invoiceReturned,
    hasReason: !!refundForm.reason && refundForm.reason.trim().length > 0
  };
});

const canSubmit = computed(() => {
  return checklist.value.selectedPurchase &&
         checklist.value.validHours &&
         checklist.value.invoiceOk &&
         checklist.value.hasReason;
});

watch([() => refundForm.refund_hours, () => refundForm.purchase_id], () => {
  validateRefundHours();
});

watch([() => refundForm.has_invoice, () => refundForm.purchase_id], () => {
  validateInvoice();
});

watch(() => refundForm.reason, () => {
  validateReason();
});

function validateRefundHours() {
  const p = selectedPurchase.value;
  if (!p) {
    refundErrors.hours = '';
    return;
  }
  if (refundForm.refund_hours === 0 || refundForm.refund_hours === null || refundForm.refund_hours === undefined) {
    refundErrors.hours = '请输入退费课时';
  } else if (refundForm.refund_hours > remainingPaidHours.value) {
    refundErrors.hours = '退费课时不能超过剩余付费课时（赠课不可退）';
  } else if (refundForm.refund_hours < 0) {
    refundErrors.hours = '退费课时不能为负数';
  } else {
    refundErrors.hours = '';
  }
}

function validateInvoice() {
  const p = selectedPurchase.value;
  if (!p || !p.has_invoice) {
    refundErrors.invoice = '';
    return;
  }
  if (refundForm.has_invoice !== 1) {
    refundErrors.invoice = '已开票订单需先退回发票才能退费';
  } else {
    refundErrors.invoice = '';
  }
}

function validateReason() {
  if (!refundForm.reason || refundForm.reason.trim().length === 0) {
    refundErrors.reason = '请填写退费原因';
  } else {
    refundErrors.reason = '';
  }
}

function validateAll() {
  validateRefundHours();
  validateInvoice();
  validateReason();
}

const studentPurchases = computed(() => {
  return (props.data.purchases || []).filter(p => p.student_id === refundForm.student_id && p.status === 'active');
});

const fromStudentPurchases = computed(() => {
  return (props.data.purchases || []).filter(p => p.student_id === transferForm.from_student_id && p.status === 'active');
});

const availableToStudents = computed(() => {
  return (props.students || []).filter(s => s.id !== transferForm.from_student_id);
});

function onPackageChange() {
  const pkg = (props.packages || []).find(p => p.id === purchaseForm.package_id);
  if (pkg) {
    purchaseForm.total_hours = pkg.total_hours;
    purchaseForm.gift_hours = pkg.gift_hours || 0;
    purchaseForm.unit_price = Math.round(pkg.price / pkg.total_hours * 100) / 100;
    purchaseForm.total_amount = pkg.price;
    purchaseForm.discount_amount = Math.round(pkg.price * (1 - pkg.discount) * 100) / 100;
    purchaseForm.paid_amount = Math.round(pkg.price * pkg.discount * 100) / 100;
  }
}

function onStudentChange() {
  refundForm.purchase_id = null;
  refundForm.refund_hours = 0;
  refundForm.has_invoice = 0;
  refundForm.reason = '';
  clearRefundErrors();
}

function clearRefundErrors() {
  refundErrors.hours = '';
  refundErrors.invoice = '';
  refundErrors.reason = '';
}

function resetRefundForm() {
  refundForm.student_id = null;
  refundForm.purchase_id = null;
  refundForm.refund_hours = 0;
  refundForm.has_invoice = 0;
  refundForm.invoice_return_amount = 0;
  refundForm.reason = '';
  refundForm.remark = '';
  clearRefundErrors();
}

function closeRefundModal() {
  showRefundModal.value = false;
  resetRefundForm();
}

function onFromStudentChange() {
  transferForm.purchase_id = null;
  transferForm.to_student_id = null;
}

async function submitPurchase() {
  if (!purchaseForm.student_id || !purchaseForm.total_hours || !purchaseForm.paid_amount) {
    alert('请填写必填项');
    return;
  }
  try {
    await emit('add-purchase', { ...purchaseForm });
    activeTab.value = 'purchases';
    resetPurchaseForm();
  } catch (e) {
    alert(e.message || '录入失败');
  }
}

function resetPurchaseForm() {
  Object.assign(purchaseForm, {
    student_id: null, package_id: null, total_hours: 0, gift_hours: 0,
    unit_price: 0, discount_amount: 0, paid_amount: 0, total_amount: 0,
    contract_no: '', effective_date: '', has_invoice: 0, invoice_amount: 0, remark: ''
  });
}

function showPurchaseDetail(purchase) {
  selectedPurchaseDetail.value = purchase;
  relationTab.value = 'refunds';
  showPurchaseDetailModal.value = true;
}

function closePurchaseDetail() {
  showPurchaseDetailModal.value = false;
  selectedPurchaseDetail.value = null;
}

function getPurchaseRefunds(purchaseId) {
  return (props.data.refunds || []).filter(r => r.purchase_id === purchaseId);
}

function getPurchaseTransfers(purchaseId) {
  return (props.data.transfers || []).filter(t => t.from_purchase_id === purchaseId);
}

function getPurchaseConsumptions(purchaseId) {
  return (props.data.consumptions || []).filter(c => c.purchase_id === purchaseId);
}

function getConsumptionStatusName(status) {
  const names = {
    normal: '正常',
    leave: '请假',
    absent: '旷课',
    makeup: '补课',
    trial: '试听'
  };
  return names[status] || status;
}

async function submitRefund() {
  validateAll();
  
  if (!canSubmit.value) {
    return;
  }
  
  try {
    const p = selectedPurchase.value;
    const student = (props.students || []).find(s => s.id === refundForm.student_id);
    const amount = actualRefundAmount.value;
    let approvalLevel = 'consultant';
    if (amount > 5000) {
      approvalLevel = 'principal';
    } else if (amount > 2000) {
      approvalLevel = 'director';
    }
    
    Object.assign(refundResult, {
      student_name: student?.name || '',
      package_name: p?.package_name || '自定义',
      total_hours: p?.total_hours || 0,
      gift_hours: p?.gift_hours || 0,
      used_hours: p?.used_hours || 0,
      remaining_paid_hours: remainingPaidHours.value,
      refund_hours: refundForm.refund_hours,
      hours_valid: checklist.value.validHours,
      unit_price: p?.unit_price || 0,
      discount_rate: discountRate.value,
      paid_amount: p?.paid_amount || 0,
      expected_refund_amount: expectedRefundAmount.value,
      tax_deducted: invoiceTaxAmount.value,
      refund_amount: amount,
      has_invoice: !!p?.has_invoice,
      invoice_returned: refundForm.has_invoice === 1,
      invoice_valid: checklist.value.invoiceOk,
      approval_level: approvalLevel
    });
    
    await emit('submit-refund', { 
      ...refundForm,
      refund_amount: actualRefundAmount.value,
      expected_refund_amount: expectedRefundAmount.value,
      tax_deducted: invoiceTaxAmount.value
    });
    showRefundModal.value = false;
    resetRefundForm();
    showRefundResultModal.value = true;
  } catch (e) {
    alert(e.message || '提交失败');
  }
}

async function submitTransfer() {
  if (!transferForm.from_student_id || !transferForm.to_student_id || !transferForm.purchase_id || !transferForm.transfer_hours || !transferForm.reason) {
    alert('请填写必填项');
    return;
  }
  try {
    await emit('submit-transfer', { ...transferForm });
    showTransferModal.value = false;
    transferForm.from_student_id = null;
    transferForm.to_student_id = null;
    transferForm.purchase_id = null;
    transferForm.transfer_hours = 0;
    transferForm.reason = '';
  } catch (e) {
    alert(e.message || '提交失败');
  }
}

async function approveRefund(id) {
  if (!confirm('确认通过该退费申请？')) return;
  try {
    await emit('approve-refund', { id, approved_by: '教务主管', status: 'approved' });
  } catch (e) {
    alert(e.message || '审批失败');
  }
}

async function approveTransfer(id) {
  if (!confirm('确认通过该转课申请？')) return;
  try {
    await emit('approve-transfer', { id, approved_by: '教务主管', status: 'approved' });
  } catch (e) {
    alert(e.message || '审批失败');
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 2px solid #edf1f5;
}
.tabs button {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  color: #687789;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tabs button.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
}
.form-stack { display: grid; gap: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: grid; gap: 6px; }
.form-group label { font-size: 13px; color: #657789; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea {
  padding: 9px 12px; border: 1px solid #dce3ea; border-radius: 6px; font-size: 14px; background: white;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #1677ff;
}
.form-group input[readonly] { background: #f5f7fa; color: #687789; }
.form-group input.input-error, .form-group select.input-error, .form-group textarea.input-error {
  border-color: #ff4d4f;
}
.error-text {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 2px;
}
.btn-primary {
  margin-top: 8px; padding: 11px 16px; background: #1677ff; color: white;
  border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;
}
.btn-primary:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}
.btn-secondary {
  padding: 10px 16px; background: #f0f2f5; color: #17212b;
  border: 1px solid #dce3ea; border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-link {
  background: none; border: none; color: #1677ff; cursor: pointer; padding: 4px 8px; font-weight: 600;
}
.btn-link:hover { text-decoration: underline; }
.muted { color: #a9b6c3; }
.hours { color: #1677ff; font-weight: 800; }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: grid; place-items: center; z-index: 1000;
}
.modal {
  background: white; border-radius: 10px; width: 520px; max-width: 90vw; overflow: hidden;
}
.modal-large {
  width: 680px;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 20px; border-bottom: 1px solid #edf1f5;
}
.modal-head h3 { margin: 0; }
.btn-close {
  background: none; border: none; font-size: 24px; cursor: pointer; color: #687789; padding: 0 8px;
}
.modal-body { padding: 20px; }
.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 20px; border-top: 1px solid #edf1f5; background: #fafbfc;
}
.purchase-info, .refund-calc, .approval-info, .checklist {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}
.purchase-info h4, .refund-calc h4, .approval-info h4, .checklist h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #17212b;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}
.info-item {
  display: flex;
  font-size: 13px;
  line-height: 1.5;
}
.info-item-full {
  grid-column: 1 / -1;
}
.info-label {
  color: #687789;
  flex-shrink: 0;
}
.info-value {
  color: #17212b;
  font-weight: 600;
  margin-left: 4px;
}
.calc-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.calc-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.calc-label {
  color: #687789;
}
.calc-value {
  color: #17212b;
  font-weight: 600;
}
.calc-total {
  padding-top: 10px;
  border-top: 1px dashed #cbd5e0;
  font-size: 15px;
}
.calc-total .calc-label,
.calc-total .calc-value {
  color: #f5222d;
  font-weight: 700;
}
.approval-info {
  background: #fff7e6;
  border-color: #ffd591;
}
.approval-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 6px 0;
  color: #8c6a2f;
}
.approval-item.approval-active {
  color: #d46b08;
  font-weight: 600;
}
.approval-icon {
  font-size: 14px;
}
.checklist {
  background: #f6ffed;
  border-color: #b7eb8f;
}
.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 6px 0;
}
.check-icon {
  font-size: 14px;
  font-weight: 700;
  width: 18px;
  text-align: center;
}
.checklist-item.check-ok {
  color: #389e0d;
}
.checklist-item.check-ok .check-icon {
  color: #52c41a;
}
.checklist-item.check-no {
  color: #a8071a;
}
.checklist-item.check-no .check-icon {
  color: #ff4d4f;
}

.result-modal {
  width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}
.result-success {
  text-align: center;
  padding: 20px 0 16px;
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
  margin-bottom: 16px;
}
.result-title {
  font-size: 14px;
  font-weight: 700;
  color: #17212b;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8ecef;
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.result-row.total {
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px dashed #cbd5e0;
}
.result-label {
  color: #687789;
  font-size: 13px;
}
.result-value {
  font-weight: 600;
  color: #17212b;
  font-size: 13px;
}
.result-value.valid { color: #1677ff; }
.result-value.highlight { color: #d46b08; font-size: 14px; }
.result-value.deduct { color: #cf1322; }
.result-value.total { color: #cf1322; font-size: 16px; font-weight: 700; }
.result-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
}
.result-check.check-pass {
  background: #f6ffed;
  color: #389e0d;
}
.result-check.check-fail {
  background: #fff2f0;
  color: #cf1322;
}
.check-icon {
  font-size: 14px;
}
.approval-result {
  display: grid;
  gap: 6px;
}
.approval-result .approval-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #fff7e6;
  border-radius: 6px;
  font-size: 13px;
  color: #8c6a2f;
}
.approval-result .approval-item.active {
  background: #e6f7ff;
  color: #0050b3;
  font-weight: 600;
}
.approval-result .approval-icon {
  font-size: 14px;
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

.modal-xl {
  width: 850px;
  max-width: 95vw;
}

.detail-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf1f5;
}
.detail-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #17212b;
  margin-bottom: 12px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
}
.detail-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  align-items: center;
}
.detail-label {
  color: #687789;
  min-width: 90px;
  font-size: 13px;
}
.detail-value {
  font-size: 13px;
  color: #17212b;
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
  min-width: 100px;
}
.chain-node.highlight {
  background: #fff7e6;
  border-color: #ffd591;
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
  background: #f6f8fa;
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
.check.valid { color: #52c41a; }
.check.invalid { color: #cf1322; }

.amount-info {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.amount-row {
  padding: 8px 12px;
  background: #f6f8fa;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.amount-label {
  color: #687789;
}
.amount-value {
  font-weight: 600;
  color: #17212b;
}
.amount-value.highlight {
  color: #d46b08;
}

.relation-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8edf2;
}
.relation-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 14px;
  cursor: pointer;
  color: #687789;
  margin-bottom: -1px;
}
.relation-tabs button.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
  font-weight: 600;
}
.relation-content {
  min-height: 150px;
}

.inner-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.inner-table th {
  background: #f6f8fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #687789;
  border-bottom: 1px solid #e8edf2;
}
.inner-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f2f5;
}
.inner-table .amount {
  color: #cf1322;
  font-weight: 600;
}

.badge.issued {
  background: #e6f7ff;
  color: #1890ff;
}
.badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.audit-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f6ffed;
  border-radius: 6px;
  font-size: 13px;
  color: #389e0d;
  margin-top: 16px;
}
</style>
