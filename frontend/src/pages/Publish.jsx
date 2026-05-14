import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const PROVINCES = [
  '北京', '上海', '广东', '浙江', '江苏', '山东', '四川', '河南', '湖北', '湖南',
  '河北', '福建', '陕西', '安徽', '辽宁', '江西', '重庆', '广西', '山西', '云南',
  '贵州', '天津', '黑龙江', '吉林', '甘肃', '内蒙古', '新疆', '海南', '宁夏', '青海', '西藏'
];

const TEST_SURVEY = {
  title: '用户消费习惯调研',
  description: '感谢您参与本次调研，您的回答对我们非常重要。完成问卷可获得现金奖励！',
  target_gender: '',
  target_province: '',
  target_age_min: 18,
  target_age_max: 60,
  question_count: 5,
  total_surveys: 100,
  reward_per_question: 0.1,
  questions: [
    {
      question_text: '您的月均消费支出约为多少？',
      options: ['2000元以下', '2000-5000元', '5000-10000元', '10000元以上']
    },
    {
      question_text: '您平时主要在哪里购物？',
      options: ['线下实体店', '电商平台', '社交电商', '其他']
    },
    {
      question_text: '您平均每月网购多少次？',
      options: ['1-2次', '3-5次', '6-10次', '10次以上']
    },
    {
      question_text: '您选择购物平台时最看重什么？',
      options: ['价格优惠', '商品质量', '配送速度', '售后服务']
    },
    {
      question_text: '您是否愿意尝试新的购物渠道？',
      options: ['非常愿意', '比较愿意', '不太愿意', '完全不愿意']
    }
  ]
};

const Publish = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem('survey_draft');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Load cache error:', e);
    }
    return {
      title: '',
      description: '',
      target_gender: '',
      target_province: '',
      target_age_min: '',
      target_age_max: '',
      question_count: 5,
      total_surveys: 100,
      reward_per_question: 0.1,
      questions: []
    };
  };

  const [formData, setFormData] = useState(getCachedData);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    try {
      localStorage.setItem('survey_draft', JSON.stringify(formData));
    } catch (e) {
      console.error('Save cache error:', e);
    }
  }, [formData]);

  const loadTestData = () => {
    if (window.confirm('确定要加载测试问卷数据吗？当前内容将被覆盖。')) {
      setFormData({ ...TEST_SURVEY });
      setStep(2);
      showToast('测试数据已加载');
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    const options = [...(newQuestions[qIndex]?.options || ['', '', '', ''])];
    options[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options };
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const initQuestions = () => {
    const count = parseInt(formData.question_count) || 5;
    const questions = Array.from({ length: count }, () => ({
      question_text: '',
      options: ['', '', '', '']
    }));
    setFormData(prev => ({ ...prev, questions }));
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showToast('请输入问卷标题');
      return;
    }

    const validQuestions = formData.questions.filter(
      q => q.question_text.trim() && q.options.filter(o => o.trim()).length >= 2
    );

    if (validQuestions.length === 0) {
      showToast('请至少设置一道有效题目（至少2个选项）');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/surveys', {
        ...formData,
        question_count: validQuestions.length,
        questions: validQuestions
      });

      if (response.success) {
        showToast('🎉 问卷发布成功！');
        try {
          localStorage.removeItem('survey_draft');
        } catch (e) {
          console.error('Clear cache error:', e);
        }
        await refreshUser();
        navigate('/surveys');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedCost = (formData.question_count * formData.total_surveys * formData.reward_per_question).toFixed(2);

  return (
    <div className="container">
      <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>
        🚀 发布问卷
      </h1>

      {step === 1 && (
        <div>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', color: '#166534' }}>
              💡 快速开始：使用测试数据一键填充
            </span>
            <button
              onClick={loadTestData}
              style={{
                padding: '6px 12px',
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🚀 一键填充测试数据
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              问卷标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="请输入问卷标题"
              className="input"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              问卷描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入问卷描述（选填）"
              className="input"
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                目标性别
              </label>
              <select
                value={formData.target_gender}
                onChange={(e) => handleInputChange('target_gender', e.target.value)}
                className="select"
              >
                <option value="">不限</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                目标省份
              </label>
              <select
                value={formData.target_province}
                onChange={(e) => handleInputChange('target_province', e.target.value)}
                className="select"
              >
                <option value="">不限</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                最小年龄
              </label>
              <input
                type="number"
                value={formData.target_age_min}
                onChange={(e) => handleInputChange('target_age_min', e.target.value)}
                placeholder="不限"
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                最大年龄
              </label>
              <input
                type="number"
                value={formData.target_age_max}
                onChange={(e) => handleInputChange('target_age_max', e.target.value)}
                placeholder="不限"
                className="input"
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                题目数量
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.question_count}
                onChange={(e) => handleInputChange('question_count', parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                问卷份数
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_surveys}
                onChange={(e) => handleInputChange('total_surveys', parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                单题奖励（元）
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.reward_per_question}
                onChange={(e) => handleInputChange('reward_per_question', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
          </div>

          <div style={{
            background: '#f8f9ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              💰 预计费用：<strong style={{ color: '#667eea', fontSize: '18px' }}>¥{estimatedCost}</strong>
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
              当前余额：¥{(user?.balance || 0).toFixed(2)}
            </p>
          </div>

          <button
            onClick={initQuestions}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            下一步：设置题目
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              marginBottom: '20px',
              padding: 0
            }}
          >
            ← 返回上一步
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {formData.questions.map((question, qIndex) => (
              <div key={qIndex} style={{
                background: '#fafafa',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>
                  第 {qIndex + 1} 题
                </h4>
                
                <input
                  type="text"
                  value={question.question_text}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  placeholder="请输入题目内容"
                  className="input"
                  style={{ marginBottom: '16px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        lineHeight: '28px',
                        textAlign: 'center',
                        background: '#e0e0e0',
                        borderRadius: '50%',
                        fontSize: '14px',
                        fontWeight: '500',
                        flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + oIndex)}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                        className="input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '24px',
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
            }}
          >
            {submitting ? '发布中...' : `确认发布（扣费 ¥${estimatedCost}）`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Publish;
