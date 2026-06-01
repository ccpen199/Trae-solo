<template>
  <div>
    <div class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>学员列表</h2>
          <span>{{ data?.length || 0 }} 人</span>
        </div>
        <div class="table-wrap">
          <table v-if="data && data.length">
            <thead>
              <tr>
                <th>姓名</th>
                <th>性别</th>
                <th>家长</th>
                <th>联系方式</th>
                <th>顾问</th>
                <th>购课</th>
                <th>已用</th>
                <th>剩余</th>
                <th>已付</th>
                <th>班级</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="st in data" :key="st.id">
                <td><strong>{{ st.name }}</strong></td>
                <td>{{ st.gender || '-' }}</td>
                <td>{{ st.parent_name || '-' }}</td>
                <td>{{ st.parent_phone || '-' }}</td>
                <td>{{ st.consultant || '-' }}</td>
                <td>{{ st.purchased_hours?.toFixed(1) || 0 }}</td>
                <td>{{ st.used_hours?.toFixed(1) || 0 }}</td>
                <td>
                  <span :class="{ hours: st.remaining_hours > 0, 'badge': true, 'pending': st.remaining_hours <= 10 }">
                    {{ st.remaining_hours?.toFixed(1) || 0 }}
                  </span>
                </td>
                <td>{{ currency(st.paid_amount || 0) }}</td>
                <td>{{ st.class_names || '-' }}</td>
                <td><span :class="['badge', st.status]">{{ st.status === 'active' ? '在读' : '已结' }}</span></td>
                <td>
                  <button class="btn-link" @click="showStudentDetail(st)">详情</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无学员数据</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增学员</h2>
        </div>
        <div class="form-stack">
          <div class="form-group">
            <label>学员姓名 *</label>
            <input v-model="newStudent.name" type="text" placeholder="请输入姓名" @blur="validateField('name')" @input="clearError('name')" />
            <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>性别</label>
              <select v-model="newStudent.gender">
                <option value="">请选择</option>
                <option value="女">女</option>
                <option value="男">男</option>
              </select>
            </div>
            <div class="form-group">
              <label>生日</label>
              <input v-model="newStudent.birthday" type="date" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>学员电话</label>
              <input v-model="newStudent.phone" type="tel" placeholder="学员手机号" @blur="validateField('phone')" @input="clearError('phone')" />
              <div v-if="errors.phone" class="error-text">{{ errors.phone }}</div>
            </div>
            <div class="form-group">
              <label>家长姓名</label>
              <input v-model="newStudent.parent_name" type="text" placeholder="家长姓名" />
            </div>
          </div>
          <div class="form-group">
            <label>家长电话 *</label>
            <input v-model="newStudent.parent_phone" type="tel" placeholder="家长联系电话" @blur="validateField('parent_phone')" @input="clearError('parent_phone')" />
            <div v-if="errors.parent_phone" class="error-text">{{ errors.parent_phone }}</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>课程顾问</label>
              <input v-model="newStudent.consultant" type="text" placeholder="顾问姓名" />
            </div>
          </div>
          <div class="form-group">
            <label>报名课程</label>
            <select v-model="newStudent.class_id">
              <option value="">请选择课程（可选）</option>
              <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>选择课包</label>
            <select v-model="selectedPackageId">
              <option value="">请选择课包（可选）</option>
              <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">{{ pkg.name }}</option>
            </select>
            <div v-if="selectedPackage" class="package-detail">
              <div class="package-detail-title">课包详情</div>
              <div class="package-detail-item">名称：{{ selectedPackage.name }}</div>
              <div class="package-detail-item">课时：{{ selectedPackage.hours }} 课时</div>
              <div class="package-detail-item">价格：{{ currency(selectedPackage.price || 0) }}</div>
              <div v-if="selectedPackage.description" class="package-detail-item">说明：{{ selectedPackage.description }}</div>
            </div>
          </div>
          <div class="form-group">
            <label>合同附件</label>
            <div class="file-upload">
              <label class="file-input-label">
                <input type="file" accept=".pdf,image/*" @change="handleFileUpload" />
                <span>选择文件（PDF/图片）</span>
              </label>
              <div v-if="contractFile" class="file-name">
                <span class="file-icon">📄</span>
                <span>{{ contractFile.name }}</span>
                <button type="button" class="remove-file" @click="removeFile">×</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>学习目标</label>
            <textarea v-model="newStudent.learning_goal" placeholder="学习目标与备注" rows="2" @blur="validateField('learning_goal')" @input="clearError('learning_goal')"></textarea>
            <div v-if="errors.learning_goal" class="error-text">{{ errors.learning_goal }}</div>
            <div class="char-count">{{ (newStudent.learning_goal || '').length }}/500</div>
          </div>
          <div class="validation-summary">
            <div class="validation-title">校验结果</div>
            <div class="validation-list">
              <div :class="['validation-item', validationStatus.name ? 'valid' : 'invalid']">
                <span class="validation-icon">{{ validationStatus.name ? '✓' : '○' }}</span>
                <span>学员姓名 {{ validationStatus.name ? '已填' : '（必填）未填' }}</span>
              </div>
              <div :class="['validation-item', validationStatus.parent_phone ? 'valid' : 'invalid']">
                <span class="validation-icon">{{ validationStatus.parent_phone ? '✓' : '○' }}</span>
                <span>家长电话 {{ validationStatus.parent_phone ? '已填' : '（必填）未填' }}</span>
              </div>
              <div :class="['validation-item', newStudent.phone ? 'valid' : 'optional']">
                <span class="validation-icon">{{ newStudent.phone ? '✓' : '○' }}</span>
                <span>学员电话 {{ newStudent.phone ? '已填' : '（可选）未填' }}</span>
              </div>
              <div :class="['validation-item', newStudent.parent_name ? 'valid' : 'optional']">
                <span class="validation-icon">{{ newStudent.parent_name ? '✓' : '○' }}</span>
                <span>家长姓名 {{ newStudent.parent_name ? '已填' : '（可选）未填' }}</span>
              </div>
              <div :class="['validation-item', newStudent.class_id ? 'valid' : 'optional']">
                <span class="validation-icon">{{ newStudent.class_id ? '✓' : '○' }}</span>
                <span>报名课程 {{ newStudent.class_id ? '已选' : '（可选）未选' }}</span>
              </div>
              <div :class="['validation-item', selectedPackageId ? 'valid' : 'optional']">
                <span class="validation-icon">{{ selectedPackageId ? '✓' : '○' }}</span>
                <span>选择课包 {{ selectedPackageId ? '已选' : '（可选）未选' }}</span>
              </div>
              <div :class="['validation-item', contractFile ? 'valid' : 'optional']">
                <span class="validation-icon">{{ contractFile ? '✓' : '○' }}</span>
                <span>合同附件 {{ contractFile ? '已上传' : '（可选）未上传' }}</span>
              </div>
            </div>
          </div>
          <button class="btn-primary" @click="handleSubmit">
            新增学员
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal detail-modal">
        <div class="modal-head">
          <h3>学员档案详情</h3>
          <button class="btn-close" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedStudent" class="detail-content">
            <div class="detail-section">
              <div class="section-title">基础信息</div>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">学员姓名：</span>
                  <strong>{{ selectedStudent.name }}</strong>
                </div>
                <div class="detail-row">
                  <span class="label">性别：</span>
                  <span>{{ selectedStudent.gender || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">生日：</span>
                  <span>{{ selectedStudent.birthday || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">学员电话：</span>
                  <span>{{ selectedStudent.phone || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">家长姓名：</span>
                  <span>{{ selectedStudent.parent_name || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">家长电话：</span>
                  <span>{{ selectedStudent.parent_phone || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">课程顾问：</span>
                  <span>{{ selectedStudent.consultant || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">学习状态：</span>
                  <span :class="['badge', selectedStudent.status]">{{ selectedStudent.status === 'active' ? '在读' : '已结' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section" v-if="selectedStudent.learning_goal">
              <div class="section-title">学习目标</div>
              <div class="learning-goal">{{ selectedStudent.learning_goal }}</div>
            </div>

            <div class="detail-section">
              <div class="section-title">课时余额闭环</div>
              <div class="balance-card">
                <div class="balance-grid">
                  <div class="balance-item">
                    <div class="balance-label">总购课时</div>
                    <div class="balance-value">{{ selectedStudent.purchased_hours?.toFixed(1) || 0 }}</div>
                  </div>
                  <div class="balance-item">
                    <div class="balance-label">已用课时</div>
                    <div class="balance-value used">{{ selectedStudent.used_hours?.toFixed(1) || 0 }}</div>
                  </div>
                  <div class="balance-item">
                    <div class="balance-label">剩余课时</div>
                    <div class="balance-value remaining">{{ selectedStudent.remaining_hours?.toFixed(1) || 0 }}</div>
                  </div>
                  <div class="balance-item">
                    <div class="balance-label">累计已付</div>
                    <div class="balance-value amount">{{ currency(selectedStudent.paid_amount || 0) }}</div>
                  </div>
                </div>
                <div class="balance-formula">
                  <span class="formula-label">公式核对：</span>
                  <span class="formula-content">总购课时({{ selectedStudent.purchased_hours?.toFixed(1) || 0 }}) - 已用课时({{ selectedStudent.used_hours?.toFixed(1) || 0 }}) = 剩余课时({{ selectedStudent.remaining_hours?.toFixed(1) || 0 }})</span>
                  <span v-if="Math.abs((selectedStudent.purchased_hours || 0) - (selectedStudent.used_hours || 0) - (selectedStudent.remaining_hours || 0)) < 0.01" class="formula-check valid">✓ 平衡</span>
                  <span v-else class="formula-check invalid">✗ 不平衡</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">报名课程</div>
              <div v-if="selectedStudent.class_names" class="class-info">{{ selectedStudent.class_names }}</div>
              <div v-else class="empty-text">暂无报名课程</div>
            </div>

            <div class="detail-section">
              <div class="section-title">合同附件 <span class="review-tag">复查入口</span></div>
              <div v-if="selectedStudent.contract_attachment" class="contract-info">
                <div class="contract-item">
                  <span class="contract-icon">📄</span>
                  <span class="contract-name">{{ selectedStudent.contract_attachment }}</span>
                  <button class="btn-link" @click="viewContract(selectedStudent.contract_attachment)">查看</button>
                </div>
                <div class="contract-tip">
                  <span class="tip-icon">ℹ</span>
                  <span>合同已存档，可用于报名依据复核</span>
                </div>
              </div>
              <div v-else class="empty-text">暂无合同附件</div>
            </div>

            <div class="detail-section" v-if="selectedStudent.purchases && selectedStudent.purchases.length">
              <div class="section-title">课包与签到追溯 <span class="review-tag">可复查</span></div>
              <div v-for="purchase in selectedStudent.purchases" :key="purchase.id" class="purchase-trace">
                <div class="purchase-header">
                  <strong class="package-name">{{ purchase.package_name }}</strong>
                  <span :class="['badge', purchase.status]">{{ purchase.status === 'active' ? '有效' : '已结' }}</span>
                </div>
                <div class="purchase-stats">
                  <div class="stat-item">
                    <span class="stat-label">合同编号</span>
                    <span class="stat-value">{{ purchase.contract_no || '-' }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">总课时</span>
                    <span class="stat-value">{{ purchase.total_hours }} + {{ purchase.gift_hours }}(赠)</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">已用</span>
                    <span class="stat-value used">{{ purchase.used_hours?.toFixed(1) || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">剩余</span>
                    <span class="stat-value remaining">{{ purchase.remaining_hours?.toFixed(1) || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">单价</span>
                    <span class="stat-value">{{ currency(purchase.unit_price || 0) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">实付</span>
                    <span class="stat-value amount">{{ currency(purchase.paid_amount || 0) }}</span>
                  </div>
                </div>
                <div class="formula-check">
                  <span class="formula">课时核对: {{ purchase.total_hours }} + {{ purchase.gift_hours }} - {{ purchase.used_hours?.toFixed(1) || 0 }} = {{ (purchase.total_hours + purchase.gift_hours - (purchase.used_hours || 0)).toFixed(1) }}</span>
                  <span v-if="Math.abs((purchase.total_hours + purchase.gift_hours) - (purchase.used_hours || 0) - (purchase.remaining_hours || 0)) < 0.01" class="check-result valid">✓ 平衡</span>
                  <span v-else class="check-result invalid">✗ 不平衡 ({{ purchase.remaining_hours?.toFixed(1) || 0 }})</span>
                </div>
                <div class="attendance-trace" v-if="getPurchaseAttendances(purchase.id).length">
                  <div class="trace-title">签到与课消明细</div>
                  <table class="trace-table">
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>班级</th>
                        <th>状态</th>
                        <th>消耗课时</th>
                        <th>课消金额</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="a in getPurchaseAttendances(purchase.id)" :key="a.id">
                        <td>{{ a.course_date }}</td>
                        <td>{{ a.class_name }}</td>
                        <td><span :class="['status-badge', a.status]">{{ getStatusName(a.status) }}</span></td>
                        <td>{{ shouldCountConsume(a.status) ? a.consume_hours?.toFixed(1) : '-' }}</td>
                        <td class="amount">{{ shouldCountConsume(a.status) ? currency(a.consume_amount || 0) : '-' }}</td>
                        <td>{{ a.remark || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="empty-text" style="margin-top: 12px;">暂无签到记录</div>
              </div>
            </div>

            <div class="detail-section">
              <div class="section-title">档案复查</div>
              <div class="review-list">
                <div class="review-item">
                  <span class="review-icon">{{ selectedStudent.name ? '✓' : '○' }}</span>
                  <span>学员姓名 {{ selectedStudent.name ? '已填' : '未填' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-icon">{{ selectedStudent.parent_phone ? '✓' : '○' }}</span>
                  <span>家长联系方式 {{ selectedStudent.parent_phone ? '已填' : '未填' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-icon">{{ selectedStudent.purchased_hours > 0 ? '✓' : '○' }}</span>
                  <span>购课记录 {{ selectedStudent.purchased_hours > 0 ? '有' : '无' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-icon">{{ selectedStudent.contract_attachment ? '✓' : '○' }}</span>
                  <span>合同附件 {{ selectedStudent.contract_attachment ? '已上传' : '未上传' }}</span>
                </div>
                <div class="review-item">
                  <span class="review-icon">{{ selectedStudent.learning_goal ? '✓' : '○' }}</span>
                  <span>学习目标 {{ selectedStudent.learning_goal ? '已设置' : '未设置' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-primary" @click="showDetailModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const props = defineProps({
  data: { type: Array, default: () => [] },
  currency: { type: Function, required: true },
  newStudent: { type: Object, required: true },
  classes: { type: Array, default: () => [] },
  packages: { type: Array, default: () => [] }
});

const emit = defineEmits(['add-student', 'upload-contract']);

const errors = reactive({
  name: '',
  phone: '',
  parent_phone: '',
  learning_goal: '',
  contract: ''
});

const selectedPackageId = ref('');
const contractFile = ref(null);
const showDetailModal = ref(false);
const selectedStudent = ref(null);

const selectedPackage = computed(() => {
  if (!selectedPackageId.value) return null;
  return props.packages.find(p => p.id === selectedPackageId.value) || null;
});

const validationStatus = computed(() => {
  const name = validateName(props.newStudent.name) === '';
  const parent_phone = validatePhone(props.newStudent.parent_phone) === '';
  return { name, parent_phone };
});

const isFormValid = computed(() => {
  return validationStatus.value.name && validationStatus.value.parent_phone;
});

function validateName(value) {
  if (!value || !value.trim()) return '请输入学员姓名';
  const len = value.trim().length;
  if (len < 2 || len > 20) return '姓名长度必须在2-20个字符之间';
  return '';
}

function validatePhone(value) {
  if (!value || !value.trim()) return '请输入家长电话';
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value.trim())) return '请输入正确的11位手机号码';
  return '';
}

function validateOptionalPhone(value) {
  if (!value || !value.trim()) return '';
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value.trim())) return '请输入正确的11位手机号码';
  return '';
}

function validateLearningGoal(value) {
  if (!value) return '';
  if (value.length > 500) return '学习目标不能超过500字';
  return '';
}

function validateField(field) {
  switch (field) {
    case 'name':
      errors.name = validateName(props.newStudent.name);
      break;
    case 'phone':
      errors.phone = validateOptionalPhone(props.newStudent.phone);
      break;
    case 'parent_phone':
      errors.parent_phone = validatePhone(props.newStudent.parent_phone);
      break;
    case 'learning_goal':
      errors.learning_goal = validateLearningGoal(props.newStudent.learning_goal);
      break;
  }
}

function clearError(field) {
  if (errors[field]) {
    errors[field] = '';
  }
}

function validateAllFields() {
  validateField('name');
  validateField('phone');
  validateField('parent_phone');
  validateField('learning_goal');
  return isFormValid.value && !errors.name && !errors.phone && !errors.parent_phone && !errors.learning_goal && !errors.contract;
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.contract = '请上传PDF文件或图片文件';
      return;
    }
    contractFile.value = file;
    emit('upload-contract', file);
  }
}

function removeFile() {
  contractFile.value = null;
  if (errors.contract) {
    errors.contract = '';
  }
}

function handleSubmit() {
  if (!validateAllFields()) {
    return;
  }
  emit('add-student');
}

function showStudentDetail(student) {
  selectedStudent.value = student;
  showDetailModal.value = true;
}

function viewContract(path) {
  window.open(path, '_blank');
}

function getPurchaseAttendances(purchaseId) {
  if (!selectedStudent.value?.attendances) return [];
  return selectedStudent.value.attendances.filter(a => a.purchase_id === purchaseId);
}

function getStatusName(status) {
  const names = {
    normal: '正常',
    leave: '请假',
    absent: '旷课',
    makeup: '补课',
    trial: '试听',
    reserved: '待签到'
  };
  return names[status] || status;
}

function shouldCountConsume(status) {
  return status === 'normal' || status === 'absent';
}
</script>

<style scoped>
.form-stack {
  display: grid;
  gap: 12px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.form-group {
  display: grid;
  gap: 6px;
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
.error-text {
  color: #ff4d4f;
  font-size: 12px;
  line-height: 1.4;
}
.char-count {
  font-size: 12px;
  color: #8c8c8c;
  text-align: right;
}
.file-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-input-label {
  display: inline-block;
  padding: 9px 16px;
  background: #f0f5ff;
  border: 1px dashed #1677ff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #1677ff;
  text-align: center;
  transition: all 0.2s;
}
.file-input-label:hover {
  background: #e6f0ff;
}
.file-input-label input {
  display: none;
}
.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 14px;
}
.file-icon {
  font-size: 16px;
}
.remove-file {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #8c8c8c;
  line-height: 1;
}
.remove-file:hover {
  color: #ff4d4f;
}
.package-detail {
  padding: 12px;
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 13px;
}
.package-detail-title {
  font-weight: 600;
  color: #1677ff;
  margin-bottom: 8px;
}
.package-detail-item {
  color: #657789;
  margin-bottom: 4px;
}
.validation-summary {
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}
.validation-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}
.validation-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
}
.validation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.validation-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
}
.validation-item.valid {
  color: #52c41a;
}
.validation-item.invalid {
  color: #ff4d4f;
}
.validation-item.optional {
  color: #8c8c8c;
}
.btn-primary {
  margin-top: 8px;
  padding: 11px 16px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:hover {
  background: #0958d9;
}
.hours {
  color: #1677ff;
  font-weight: 800;
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
.btn-link:hover { text-decoration: underline; }

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
  width: 640px;
  max-width: 90vw;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.detail-modal {
  width: 680px;
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
.btn-primary {
  padding: 10px 16px;
  background: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
}

.detail-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf1f5;
}
.detail-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #17212b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.review-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  background: #e6f7ff;
  color: #0050b3;
  border-radius: 4px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}
.detail-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}
.detail-row .label {
  color: #687789;
  min-width: 90px;
  flex-shrink: 0;
  font-size: 13px;
}
.learning-goal {
  padding: 12px 16px;
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.balance-card {
  background: #f0f7ff;
  border-radius: 8px;
  padding: 16px;
}
.balance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
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
.balance-value.used { color: #cf1322; }
.balance-value.remaining { color: #1677ff; }
.balance-value.amount { color: #d46b08; font-size: 18px; }
.balance-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  flex-wrap: wrap;
}
.formula-label {
  color: #687789;
  font-weight: 600;
}
.formula-content {
  color: #333;
  font-family: monospace;
}
.formula-check {
  margin-left: auto;
  font-weight: 700;
}
.formula-check.valid { color: #52c41a; }
.formula-check.invalid { color: #cf1322; }

.class-info {
  padding: 10px 14px;
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
}
.empty-text {
  padding: 10px 14px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 14px;
  color: #8c8c8c;
}

.contract-info {
  padding: 12px 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
}
.contract-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.contract-icon { font-size: 20px; }
.contract-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}
.contract-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #389e0d;
  padding-top: 8px;
  border-top: 1px dashed #d9f7be;
}
.tip-icon { font-size: 14px; }

.review-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.review-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 13px;
}
.review-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  color: #52c41a;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.badge.active {
  background: #f0f7ff;
  color: #1677ff;
}
.badge.inactive {
  background: #fafafa;
  color: #8c8c8c;
}

.purchase-trace {
  background: #fafbfc;
  border: 1px solid #e8edf2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}
.purchase-trace:last-child {
  margin-bottom: 0;
}
.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.package-name {
  font-size: 15px;
  color: #17212b;
}
.purchase-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 11px;
  color: #8c8c8c;
}
.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #17212b;
}
.stat-value.used { color: #cf1322; }
.stat-value.remaining { color: #1677ff; }
.stat-value.amount { color: #d46b08; }

.formula-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  flex-wrap: wrap;
}
.formula {
  color: #687789;
  font-family: monospace;
}
.check-result {
  margin-left: auto;
  font-weight: 700;
}
.check-result.valid { color: #52c41a; }
.check-result.invalid { color: #cf1322; }

.attendance-trace {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e8edf2;
}
.trace-title {
  font-size: 12px;
  font-weight: 600;
  color: #687789;
  margin-bottom: 8px;
}
.trace-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.trace-table th,
.trace-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f2f5;
}
.trace-table th {
  color: #8c8c8c;
  font-weight: 600;
  background: #fafafa;
}
.trace-table tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
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
.status-badge.reserved {
  background: #f5f5f5;
  color: #8c8c8c;
}
</style>
