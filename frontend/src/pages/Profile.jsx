import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import api from '../utils/api';
import Loading from '../components/Loading';

const PROVINCES = [
  '北京', '上海', '广东', '浙江', '江苏', '山东', '四川', '河南', '湖北', '湖南',
  '河北', '福建', '陕西', '安徽', '辽宁', '江西', '重庆', '广西', '山西', '云南',
  '贵州', '天津', '黑龙江', '吉林', '甘肃', '内蒙古', '新疆', '海南', '宁夏', '青海', '西藏'
];

const Profile = () => {
  const { user, updateProfile, bindAlipay, refreshUser, logout } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showAlipayModal, setShowAlipayModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    province: '',
    age: ''
  });

  const [alipayData, setAlipayData] = useState({
    alipay_account: '',
    alipay_name: ''
  });

  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        gender: user.gender || '',
        province: user.province || '',
        age: user.age || ''
      });
      setAlipayData({
        alipay_account: user.alipay_account || '',
        alipay_name: user.alipay_name || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!formData.nickname || !formData.gender || !formData.province || !formData.age) {
      showToast('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        showToast('信息更新成功');
      } else {
        showToast(result.message || '更新失败');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBindAlipay = async () => {
    if (!alipayData.alipay_account || !alipayData.alipay_name) {
      showToast('请填写支付宝账号和真实姓名');
      return;
    }

    setLoading(true);
    try {
      const result = await bindAlipay(alipayData);
      if (result.success) {
        showToast('支付宝绑定成功');
        setShowAlipayModal(false);
      } else {
        showToast(result.message || '绑定失败');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      showToast('请输入有效金额');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/wallet/recharge', { amount: rechargeAmount });
      if (response.success) {
        showToast('充值成功');
        await refreshUser();
        setShowRechargeModal(false);
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      showToast('请输入有效金额');
      return;
    }

    if (amount > (user?.balance || 0)) {
      showToast('余额不足');
      return;
    }

    if (amount < 1) {
      showToast('最低提现金额为1元');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/wallet/withdraw', { amount });
      if (response.success) {
        showToast('提现申请已提交');
        await refreshUser();
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Modal = ({ title, onClose, children }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '400px'
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
        {children}
      </div>
    </div>
  );

  if (!user) {
    return <Loading />;
  }

  const profileComplete = user.gender && user.province && user.age;

  return (
    <div className="container">
      <h1 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>
        👤 个人中心
      </h1>

      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '12px',
        color: '#fff',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{user.nickname}</h2>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>
              {user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>账户余额</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              ¥{(user.balance || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!profileComplete && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffecb5',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#856404'
        }}>
          ⚠️ 请完善个人信息后再参与问卷调查
        </div>
      )}

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600' }}>基本信息</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>昵称</label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
            className="input"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>性别</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            className="select"
          >
            <option value="">请选择</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>省份</label>
          <select
            value={formData.province}
            onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
            className="select"
          >
            <option value="">请选择</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>年龄</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
            className="input"
            placeholder="请输入年龄"
          />
        </div>

        <button
          onClick={handleUpdateProfile}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? '保存中...' : '保存信息'}
        </button>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600' }}>支付宝绑定</h3>

        {user.alipay_account ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>已绑定</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px' }}>{user.alipay_account}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>{user.alipay_name}</p>
            </div>
            <span style={{ color: '#52c41a', fontSize: '14px' }}>✓ 已绑定</span>
          </div>
        ) : (
          <button
            onClick={() => setShowAlipayModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px dashed #d9d9d9',
              background: 'none',
              borderRadius: '8px',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 绑定支付宝
          </button>
        )}
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600' }}>账户操作</h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => setShowRechargeModal(true)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            充值
          </button>
          <button
            onClick={() => {
              if (!user.alipay_account) {
                showToast('请先绑定支付宝');
                return;
              }
              setShowWithdrawModal(true);
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: '#52c41a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            提现
          </button>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: '600' }}>数据统计</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9ff', borderRadius: '8px' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea', margin: 0 }}>
              {user.total_answers || 0}
            </p>
            <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>完成问卷</p>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8fff8', borderRadius: '8px' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', margin: 0 }}>
              {(user.score || 100).toFixed(0)}
            </p>
            <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0 0' }}>信用评分</p>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '12px',
          background: '#fff',
          border: '1px solid #ff4d4f',
          color: '#ff4d4f',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        退出登录
      </button>

      {showAlipayModal && (
        <Modal title="绑定支付宝" onClose={() => setShowAlipayModal(false)}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>支付宝账号</label>
            <input
              type="text"
              value={alipayData.alipay_account}
              onChange={(e) => setAlipayData(prev => ({ ...prev, alipay_account: e.target.value }))}
              placeholder="请输入支付宝账号"
              className="input"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>真实姓名</label>
            <input
              type="text"
              value={alipayData.alipay_name}
              onChange={(e) => setAlipayData(prev => ({ ...prev, alipay_name: e.target.value }))}
              placeholder="请输入真实姓名"
              className="input"
            />
          </div>
          <button
            onClick={handleBindAlipay}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? '绑定中...' : '确认绑定'}
          </button>
        </Modal>
      )}

      {showRechargeModal && (
        <Modal title="充值" onClose={() => setShowRechargeModal(false)}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>充值金额（元）</label>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
              className="input"
              min="0"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[10, 50, 100, 500].map(amount => (
              <button
                key={amount}
                onClick={() => setRechargeAmount(amount)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: rechargeAmount === amount ? '1px solid #667eea' : '1px solid #d9d9d9',
                  background: rechargeAmount === amount ? '#f8f9ff' : '#fff',
                  color: rechargeAmount === amount ? '#667eea' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ¥{amount}
              </button>
            ))}
          </div>
          <button
            onClick={handleRecharge}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', background: '#1890ff' }}
          >
            {loading ? '充值中...' : `确认充值 ¥${rechargeAmount}`}
          </button>
        </Modal>
      )}

      {showWithdrawModal && (
        <Modal title="提现" onClose={() => setShowWithdrawModal(false)}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            当前余额：¥{(user.balance || 0).toFixed(2)}
          </p>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>提现金额（元）</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="最低1元"
              className="input"
              min="1"
            />
          </div>
          <p style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>
            提现申请提交后，预计1-3个工作日到账
          </p>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', background: '#52c41a' }}
          >
            {loading ? '提交中...' : '确认提现'}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default Profile;
