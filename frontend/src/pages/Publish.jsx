import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, propertyAPI, carAPI, regionAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function Publish() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [publishType, setPublishType] = useState('job');
  const [templates, setTemplates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [step, setStep] = useState(1);

  const [jobForm, setJobForm] = useState({
    title: '',
    job_type: 'fulltime',
    category: '',
    salary_min: '',
    salary_max: '',
    salary_type: 'monthly',
    hourly_template_id: '',
    description: '',
    requirements: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    benefits: '',
  });

  const [propertyForm, setPropertyForm] = useState({
    title: '',
    property_type: 'rent',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    orientation: '',
    decoration: '',
    address: '',
    description: '',
    property_reg_no: '',
    landlord_id_card: '',
    landlord_name: '',
    contact_phone: '',
  });

  const [carForm, setCarForm] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    vin: '',
    transmission: '自动',
    displacement: '',
    fuel_type: '汽油',
    description: '',
    contact_phone: '',
  });

  const [vinResult, setVinResult] = useState(null);
  const [regResult, setRegResult] = useState(null);
  const [landlordResult, setLandlordResult] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadRegions();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await jobAPI.getTemplates();
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('加载模板失败', err);
    }
  };

  const loadRegions = async () => {
    try {
      const res = await regionAPI.getRegions({ level: 3 });
      setRegions(res.data.data || []);
    } catch (err) {
      console.error('加载区域失败', err);
    }
  };

  const handleParseVIN = async () => {
    if (!carForm.vin) {
      alert('请输入VIN码');
      return;
    }
    try {
      const res = await carAPI.parseVIN({ vin: carForm.vin });
      setVinResult(res.data.data);
      const data = res.data.data;
      setCarForm({
        ...carForm,
        brand: data.brand || carForm.brand,
        model: data.model || carForm.model,
        year: data.model_year || carForm.year,
      });
      alert('VIN解析成功，已自动填充车辆信息');
    } catch (err) {
      alert(err.response?.data?.message || 'VIN解析失败');
    }
  };

  const handleVerifyPropertyReg = async () => {
    if (!propertyForm.property_reg_no) {
      alert('请输入不动产登记编号');
      return;
    }
    try {
      const res = await propertyAPI.verifyPropertyReg({
        property_reg_no: propertyForm.property_reg_no,
        address: propertyForm.address,
      });
      setRegResult(res.data.data);
      alert('不动产登记编号核验通过');
    } catch (err) {
      setRegResult({ passed: false, message: err.response?.data?.message || '核验失败' });
      alert(err.response?.data?.message || '核验失败');
    }
  };

  const handleVerifyLandlord = async () => {
    if (!propertyForm.landlord_id_card || !propertyForm.landlord_name) {
      alert('请填写房东姓名和身份证号');
      return;
    }
    try {
      const res = await propertyAPI.verifyLandlord({
        id_card: propertyForm.landlord_id_card,
        name: propertyForm.landlord_name,
      });
      setLandlordResult(res.data.data);
      alert('房东身份核验通过');
    } catch (err) {
      setLandlordResult({ passed: false, message: err.response?.data?.message || '核验失败' });
      alert(err.response?.data?.message || '核验失败');
    }
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const res = await jobAPI.createJob(jobForm);
      alert('发布成功！');
      navigate(`/jobs/${res.data.data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || '发布失败');
    }
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    if (propertyForm.property_type === 'sale' && !regResult?.passed) {
      alert('二手房源必须通过不动产登记编号核验');
      return;
    }
    if (propertyForm.property_type === 'rent' && !landlordResult?.passed) {
      alert('租房信息必须通过房东身份核验');
      return;
    }
    try {
      const res = await propertyAPI.createProperty(propertyForm);
      alert('发布成功！');
      navigate(`/properties/${res.data.data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || '发布失败');
    }
  };

  const handleSubmitCar = async (e) => {
    e.preventDefault();
    if (!vinResult) {
      alert('请先完成VIN码解析');
      return;
    }
    try {
      const res = await carAPI.createCar(carForm);
      alert('发布成功！');
      navigate(`/cars/${res.data.data.id}`);
    } catch (err) {
      alert(err.response?.data?.message || '发布失败');
    }
  };

  const typeTabs = [
    { key: 'job', label: '发布招聘' },
    { key: 'property', label: '发布房产' },
    { key: 'car', label: '发布二手车' },
  ];

  return (
    <div className="page">
      <h1 className="page-title">发布信息</h1>

      <div className="tabs">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${publishType === tab.key ? 'active' : ''}`}
            onClick={() => { setPublishType(tab.key); setStep(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {publishType === 'job' && (
        <div className="card">
          <form onSubmit={handleSubmitJob}>
            <div className="form-row">
              <div className="form-group">
                <label>招聘类型</label>
                <select value={jobForm.job_type} onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}>
                  <option value="fulltime">企业直招-全职</option>
                  <option value="parttime">企业直招-兼职</option>
                  <option value="hourly">个体用工-小时工</option>
                  <option value="service">家政/维修服务</option>
                </select>
              </div>
              {jobForm.job_type === 'hourly' && (
                <div className="form-group">
                  <label>计薪模板</label>
                  <select value={jobForm.hourly_template_id} onChange={(e) => setJobForm({ ...jobForm, hourly_template_id: e.target.value })}>
                    <option value="">选择计薪模板</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} - ¥{t.hourly_rate}/小时</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>职位名称 *</label>
              <input
                type="text"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                placeholder="如：Java开发工程师、家政保洁"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>薪资类型</label>
                <select value={jobForm.salary_type} onChange={(e) => setJobForm({ ...jobForm, salary_type: e.target.value })}>
                  <option value="monthly">月薪</option>
                  <option value="daily">日薪</option>
                  <option value="hourly">小时薪</option>
                  <option value="piece">计件</option>
                </select>
              </div>
              <div className="form-group">
                <label>薪资范围(元)</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={jobForm.salary_min}
                    onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                    placeholder="最低"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={jobForm.salary_max}
                    onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                    placeholder="最高"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>职位描述 *</label>
              <textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="工作职责、工作内容等"
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>任职要求</label>
              <textarea
                value={jobForm.requirements}
                onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                placeholder="学历、经验、技能要求等"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>福利待遇</label>
              <input
                type="text"
                value={jobForm.benefits}
                onChange={(e) => setJobForm({ ...jobForm, benefits: e.target.value })}
                placeholder="五险一金、包吃住、年终奖等"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>工作地址 *</label>
                <input
                  type="text"
                  value={jobForm.address}
                  onChange={(e) => setJobForm({ ...jobForm, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>联系人 *</label>
                <input
                  type="text"
                  value={jobForm.contact_name}
                  onChange={(e) => setJobForm({ ...jobForm, contact_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>联系电话 *</label>
                <input
                  type="tel"
                  value={jobForm.contact_phone}
                  onChange={(e) => setJobForm({ ...jobForm, contact_phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
              <button type="submit" className="btn btn-primary">发布招聘</button>
            </div>
          </form>
        </div>
      )}

      {publishType === 'property' && (
        <div className="card">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1. 填写房源信息</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2. 真实性核验</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3. 提交发布</div>
          </div>

          {step === 1 && (
            <form>
              <div className="form-row">
                <div className="form-group">
                  <label>房源类型 *</label>
                  <select
                    value={propertyForm.property_type}
                    onChange={(e) => {
                      setPropertyForm({ ...propertyForm, property_type: e.target.value });
                      setRegResult(null);
                      setLandlordResult(null);
                    }}
                  >
                    <option value="rent">租房</option>
                    <option value="sale">二手房</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>价格(元) *</label>
                  <input
                    type="number"
                    value={propertyForm.price}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                    placeholder={propertyForm.property_type === 'rent' ? '月租金' : '总价'}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>房源标题 *</label>
                <input
                  type="text"
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  placeholder="如：精装修两室一厅出租、学区房低价出售"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>面积(㎡) *</label>
                  <input
                    type="number"
                    value={propertyForm.area}
                    onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>居室 *</label>
                  <div className="input-group">
                    <input
                      type="number"
                      value={propertyForm.bedrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })}
                      placeholder="室"
                      required
                    />
                    <span>室</span>
                    <input
                      type="number"
                      value={propertyForm.bathrooms}
                      onChange={(e) => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })}
                      placeholder="厅"
                      required
                    />
                    <span>厅</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>楼层</label>
                  <input
                    type="number"
                    value={propertyForm.floor}
                    onChange={(e) => setPropertyForm({ ...propertyForm, floor: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>朝向</label>
                  <select value={propertyForm.orientation} onChange={(e) => setPropertyForm({ ...propertyForm, orientation: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="南">南</option>
                    <option value="北">北</option>
                    <option value="东">东</option>
                    <option value="西">西</option>
                    <option value="南北">南北通透</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>装修情况</label>
                  <select value={propertyForm.decoration} onChange={(e) => setPropertyForm({ ...propertyForm, decoration: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="毛坯">毛坯</option>
                    <option value="简装">简装</option>
                    <option value="精装">精装</option>
                    <option value="豪装">豪装</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>详细地址 *</label>
                <input
                  type="text"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>房源描述</label>
                <textarea
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>联系电话 *</label>
                  <input
                    type="tel"
                    value={propertyForm.contact_phone}
                    onChange={(e) => setPropertyForm({ ...propertyForm, contact_phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>下一步：核验</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div>
              {propertyForm.property_type === 'sale' && (
                <div className="verify-section card-inner">
                  <h4>二手房不动产登记核验（必填）</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>不动产登记编号 *</label>
                      <input
                        type="text"
                        value={propertyForm.property_reg_no}
                        onChange={(e) => setPropertyForm({ ...propertyForm, property_reg_no: e.target.value })}
                        placeholder="如：京(2024)朝不动产权第001234号"
                      />
                    </div>
                    <div className="form-group">
                      <label>&nbsp;</label>
                      <button type="button" className="btn btn-secondary" onClick={handleVerifyPropertyReg}>核验编号</button>
                    </div>
                  </div>
                  {regResult && (
                    <div className={`verify-result ${regResult.passed ? 'success' : 'error'}`}>
                      {regResult.passed ? '✅ ' : '❌ '}{regResult.message}
                    </div>
                  )}
                </div>
              )}

              {propertyForm.property_type === 'rent' && (
                <div className="verify-section card-inner">
                  <h4>房东身份核验（必填）</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>房东姓名 *</label>
                      <input
                        type="text"
                        value={propertyForm.landlord_name}
                        onChange={(e) => setPropertyForm({ ...propertyForm, landlord_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>房东身份证号 *</label>
                      <input
                        type="text"
                        value={propertyForm.landlord_id_card}
                        onChange={(e) => setPropertyForm({ ...propertyForm, landlord_id_card: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>&nbsp;</label>
                      <button type="button" className="btn btn-secondary" onClick={handleVerifyLandlord}>核验身份</button>
                    </div>
                  </div>
                  {landlordResult && (
                    <div className={`verify-result ${landlordResult.passed ? 'success' : 'error'}`}>
                      {landlordResult.passed ? '✅ ' : '❌ '}{landlordResult.message}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>上一步</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>下一步</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmitProperty}>
              <div className="info-box">
                <h4>请确认以下信息：</h4>
                <p><strong>房源类型：</strong>{propertyForm.property_type === 'rent' ? '租房' : '二手房'}</p>
                <p><strong>房源标题：</strong>{propertyForm.title}</p>
                <p><strong>价格：</strong>¥{propertyForm.price}{propertyForm.property_type === 'rent' ? '/月' : ''}</p>
                <p><strong>面积：</strong>{propertyForm.area}㎡</p>
                <p><strong>户型：</strong>{propertyForm.bedrooms}室{propertyForm.bathrooms}厅</p>
                <p><strong>地址：</strong>{propertyForm.address}</p>
                {propertyForm.property_type === 'sale' && (
                  <p><strong>不动产核验：</strong>{regResult?.passed ? '✅ 已通过' : '❌ 未通过'}</p>
                )}
                {propertyForm.property_type === 'rent' && (
                  <p><strong>房东身份核验：</strong>{landlordResult?.passed ? '✅ 已通过' : '❌ 未通过'}</p>
                )}
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>上一步</button>
                <button type="submit" className="btn btn-primary">确认发布</button>
              </div>
            </form>
          )}
        </div>
      )}

      {publishType === 'car' && (
        <div className="card">
          <form onSubmit={handleSubmitCar}>
            <div className="form-group">
              <label>VIN码 *（车辆识别代号，17位）</label>
              <div className="input-group">
                <input
                  type="text"
                  value={carForm.vin}
                  onChange={(e) => setCarForm({ ...carForm, vin: e.target.value.toUpperCase() })}
                  placeholder="请输入17位VIN码"
                  maxLength={17}
                  required
                />
                <button type="button" className="btn btn-secondary" onClick={handleParseVIN}>解析VIN</button>
              </div>
              {vinResult && (
                <div className="verify-result success">
                  ✅ VIN解析成功：{vinResult.brand} {vinResult.model}，{vinResult.model_year}年款，置信度{vinResult.confidence}%
                </div>
              )}
            </div>

            <div className="form-group">
              <label>车辆标题 *</label>
              <input
                type="text"
                value={carForm.title}
                onChange={(e) => setCarForm({ ...carForm, title: e.target.value })}
                placeholder="如：2020款 大众朗逸 1.5L 自动舒适版"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>品牌 *</label>
                <input
                  type="text"
                  value={carForm.brand}
                  onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>车型 *</label>
                <input
                  type="text"
                  value={carForm.model}
                  onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>年款 *</label>
                <input
                  type="number"
                  value={carForm.year}
                  onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>售价(万元) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={carForm.price}
                  onChange={(e) => setCarForm({ ...carForm, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>里程(万公里) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={carForm.mileage}
                  onChange={(e) => setCarForm({ ...carForm, mileage: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>变速箱</label>
                <select value={carForm.transmission} onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}>
                  <option value="自动">自动</option>
                  <option value="手动">手动</option>
                  <option value="双离合">双离合</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>
              <div className="form-group">
                <label>排量</label>
                <input
                  type="text"
                  value={carForm.displacement}
                  onChange={(e) => setCarForm({ ...carForm, displacement: e.target.value })}
                  placeholder="如：1.5L、2.0T"
                />
              </div>
              <div className="form-group">
                <label>燃料类型</label>
                <select value={carForm.fuel_type} onChange={(e) => setCarForm({ ...carForm, fuel_type: e.target.value })}>
                  <option value="汽油">汽油</option>
                  <option value="柴油">柴油</option>
                  <option value="纯电">纯电</option>
                  <option value="混动">混动</option>
                  <option value="天然气">天然气</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>车辆描述</label>
              <textarea
                value={carForm.description}
                onChange={(e) => setCarForm({ ...carForm, description: e.target.value })}
                placeholder="车况介绍、保养情况、过户次数等"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>联系电话 *</label>
              <input
                type="tel"
                value={carForm.contact_phone}
                onChange={(e) => setCarForm({ ...carForm, contact_phone: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
              <button type="submit" className="btn btn-primary">发布二手车</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Publish;
