import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MFAPage() {
  const navigate = useNavigate();
  const { verifyMFA, mfaChallenge, user, token } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (user && token) {
      navigate('/dashboard', { replace: true });
    }
    if (!mfaChallenge) {
      navigate('/login', { replace: true });
    }
  }, [user, token, mfaChallenge, navigate]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    if (value && !/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length < 6) {
      setError('请输入完整的验证码');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyMFA(fullCode);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || '验证失败');
      }
    } catch (err) {
      setError(err.message || '验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  if (!mfaChallenge) {
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-container" style={{ maxWidth: '480px' }}>
        <div className="login-header">
          <h1 style={{ fontSize: '24px' }}>多因素认证</h1>
          <p>请输入验证码完成登录</p>
        </div>
        <div className="login-form">
          <form onSubmit={handleSubmit}>
            <div className="mfa-info">
              <p className="hint">验证码已发送至</p>
              <p className="target">{mfaChallenge.deliveryInfo?.hint || '您的邮箱'}</p>
            </div>

            {mfaChallenge.riskAnalysis && (
              <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
                <p style={{ fontWeight: '500', marginBottom: '8px' }}>风险检测提示</p>
                <p style={{ fontSize: '13px' }}>
                  检测到登录风险（风险等级: {mfaChallenge.riskAnalysis.riskLevel}），
                  本次登录需要额外验证。
                </p>
                {mfaChallenge.riskAnalysis.riskFactors?.length > 0 && (
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '13px' }}>
                    {mfaChallenge.riskAnalysis.riskFactors.slice(0, 3).map((factor, index) => (
                      <li key={index}>{factor.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="form-group">
              <label>验证码</label>
              <div className="code-input">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    required
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="form-error" style={{ marginBottom: '24px' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || code.join('').length < 6}
              >
                {loading ? '验证中...' : '验证并登录'}
              </button>
            </div>

            <div className="mfa-resend">
              <a href="#" onClick={(e) => { e.preventDefault(); handleResend(); }}>
                重新发送验证码
              </a>
              <span style={{ margin: '0 8px', color: '#999' }}>|</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                返回登录
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MFAPage;
