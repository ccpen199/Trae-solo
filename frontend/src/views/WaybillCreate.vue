<template>
  <div class="waybill-create">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">← 返回</button>
        <div>
          <h2>新建订舱</h2>
          <p>填写订舱信息，创建新的航空货运运单</p>
        </div>
      </div>
    </div>

    <div class="form-container">
      <form @submit.prevent="submitBooking">
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="required">始发机场</label>
              <select v-model="form.originAirport" required>
                <option value="">请选择始发机场</option>
                <option value="PEK">北京首都国际机场 (PEK)</option>
                <option value="SHA">上海虹桥国际机场 (SHA)</option>
                <option value="CAN">广州白云国际机场 (CAN)</option>
                <option value="SZX">深圳宝安国际机场 (SZX)</option>
                <option value="CTU">成都双流国际机场 (CTU)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="required">目的机场</label>
              <select v-model="form.destinationAirport" required>
                <option value="">请选择目的机场</option>
                <option value="PEK">北京首都国际机场 (PEK)</option>
                <option value="SHA">上海虹桥国际机场 (SHA)</option>
                <option value="CAN">广州白云国际机场 (CAN)</option>
                <option value="SZX">深圳宝安国际机场 (SZX)</option>
                <option value="CTU">成都双流国际机场 (CTU)</option>
              </select>
            </div>
            <div class="form-group">
              <label>航空公司</label>
              <select v-model="form.airlineCode">
                <option value="">请选择航空公司</option>
                <option value="CA">中国国际航空 (CA)</option>
                <option value="MU">中国东方航空 (MU)</option>
                <option value="CZ">中国南方航空 (CZ)</option>
                <option value="HU">海南航空 (HU)</option>
              </select>
            </div>
            <div class="form-group">
              <label>优先级</label>
              <select v-model="form.priority">
                <option value="normal">普通</option>
                <option value="urgent">加急</option>
                <option value="express">特快</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">发件人信息</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="required">发件人姓名</label>
              <input type="text" v-model="form.shipperName" placeholder="请输入发件人姓名" required />
            </div>
            <div class="form-group">
              <label>联系电话</label>
              <input type="tel" v-model="form.shipperPhone" placeholder="请输入联系电话" />
            </div>
            <div class="form-group full-width">
              <label>详细地址</label>
              <textarea v-model="form.shipperAddress" placeholder="请输入详细地址" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">收件人信息</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="required">收件人姓名</label>
              <input type="text" v-model="form.consigneeName" placeholder="请输入收件人姓名" required />
            </div>
            <div class="form-group">
              <label>联系电话</label>
              <input type="tel" v-model="form.consigneePhone" placeholder="请输入联系电话" />
            </div>
            <div class="form-group full-width">
              <label>详细地址</label>
              <textarea v-model="form.consigneeAddress" placeholder="请输入详细地址" rows="2"></textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <div class="section-title">货物明细</div>
            <button type="button" class="btn-add" @click="addDetail">
              ➕ 添加货物
            </button>
          </div>
          <div class="detail-table">
            <table>
              <thead>
                <tr>
                  <th style="width: 80px">序号</th>
                  <th style="width: 200px">货物名称</th>
                  <th style="width: 120px">件数</th>
                  <th style="width: 120px">重量(kg)</th>
                  <th style="width: 120px">体积(m³)</th>
                  <th style="width: 100px">是否危险品</th>
                  <th style="width: 80px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in form.details" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>
                    <input
                      type="text"
                      v-model="detail.goodsName"
                      placeholder="货物名称"
                      :required="true"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="detail.pieces"
                      min="1"
                      placeholder="件数"
                      :required="true"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="detail.weight"
                      min="0"
                      step="0.01"
                      placeholder="重量"
                      :required="true"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="detail.volume"
                      min="0"
                      step="0.001"
                      placeholder="体积"
                    />
                  </td>
                  <td>
                    <input type="checkbox" v-model="detail.isDangerous" />
                  </td>
                  <td>
                    <button
                      type="button"
                      class="btn-remove"
                      @click="removeDetail(index)"
                      :disabled="form.details.length <= 1"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="detail-summary">
            <span>共 <strong>{{ form.details.length }}</strong> 项货物</span>
            <span>
              总计: <strong>{{ totalPieces }}</strong> 件 / <strong>{{ totalWeight }}</strong> kg
            </span>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">其他信息</div>
          <div class="form-grid">
            <div class="form-group">
              <label>货物描述</label>
              <textarea
                v-model="form.goodsDescription"
                placeholder="请输入货物描述"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea v-model="form.remark" placeholder="请输入备注信息" rows="3"></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="goBack">取消</button>
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交订舱' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { waybillApi } from '@/api';

const router = useRouter();
const submitting = ref(false);

const form = reactive({
  originAirport: '',
  destinationAirport: '',
  shipperName: '',
  shipperPhone: '',
  shipperAddress: '',
  consigneeName: '',
  consigneePhone: '',
  consigneeAddress: '',
  airlineCode: '',
  priority: 'normal',
  goodsDescription: '',
  isDangerous: false,
  remark: '',
  details: [
    {
      lineNo: 1,
      goodsName: '',
      goodsCode: '',
      pieces: 1,
      weight: 0,
      volume: 0,
      unit: '件',
      isDangerous: false,
      description: '',
    },
  ],
});

const totalPieces = computed(() => {
  return form.details.reduce((sum, d) => sum + (d.pieces || 0), 0);
});

const totalWeight = computed(() => {
  return form.details.reduce((sum, d) => sum + (d.weight || 0), 0);
});

function addDetail() {
  form.details.push({
    lineNo: form.details.length + 1,
    goodsName: '',
    goodsCode: '',
    pieces: 1,
    weight: 0,
    volume: 0,
    unit: '件',
    isDangerous: false,
    description: '',
  });
}

function removeDetail(index: number) {
  if (form.details.length > 1) {
    form.details.splice(index, 1);
    form.details.forEach((d, i) => {
      d.lineNo = i + 1;
    });
  }
}

function goBack() {
  router.push('/waybills');
}

async function submitBooking() {
  if (!form.originAirport) {
    alert('请选择始发机场');
    return;
  }
  if (!form.destinationAirport) {
    alert('请选择目的机场');
    return;
  }
  if (!form.shipperName) {
    alert('请输入发件人姓名');
    return;
  }
  if (!form.consigneeName) {
    alert('请输入收件人姓名');
    return;
  }

  const invalidDetail = form.details.find((d) => !d.goodsName || d.pieces <= 0 || d.weight <= 0);
  if (invalidDetail) {
    alert('请填写完整的货物信息（名称、件数、重量不能为空）');
    return;
  }

  submitting.value = true;
  try {
    const result = await waybillApi.createDraft({
      originAirport: form.originAirport,
      destinationAirport: form.destinationAirport,
      shipperName: form.shipperName,
      shipperPhone: form.shipperPhone,
      shipperAddress: form.shipperAddress,
      consigneeName: form.consigneeName,
      consigneePhone: form.consigneePhone,
      consigneeAddress: form.consigneeAddress,
      airlineCode: form.airlineCode || undefined,
      priority: form.priority,
      goodsDescription: form.goodsDescription || undefined,
      isDangerous: form.details.some((d) => d.isDangerous),
      remark: form.remark || undefined,
      details: form.details.map((d, index) => ({
        lineNo: index + 1,
        goodsName: d.goodsName,
        goodsCode: d.goodsCode || undefined,
        pieces: d.pieces,
        weight: d.weight,
        volume: d.volume || undefined,
        unit: d.unit,
        isDangerous: d.isDangerous,
        description: d.description || undefined,
      })),
    });

    alert('订舱草稿创建成功！即将跳转到运单列表');
    if (result?.waybill?.id) {
      await waybillApi.submitBooking(result.waybill.id);
    }
    router.push('/waybills');
  } catch (error: any) {
    console.error('创建订舱失败:', error);
    alert('创建订舱失败: ' + (error.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.waybill-create {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
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
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  padding-bottom: 12px;
  border-bottom: 2px solid #667eea;
  display: inline-block;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.form-group label.required::after {
  content: ' *';
  color: #ff4d4f;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-add {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  opacity: 0.9;
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
}

.detail-table input[type='text'],
.detail-table input[type='number'] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.detail-table input[type='text']:focus,
.detail-table input[type='number']:focus {
  outline: none;
  border-color: #667eea;
}

.btn-remove {
  padding: 4px 12px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-remove:hover:not(:disabled) {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-summary {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-top: 12px;
  color: #595959;
}

.detail-summary strong {
  color: #262626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 12px 32px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
}

.btn-cancel:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-submit {
  padding: 12px 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
