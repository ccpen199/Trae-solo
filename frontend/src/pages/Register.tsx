import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Home, Store, Wrench, ArrowLeft, Phone, Mail, Building2, FileText, MapPin, Cpu, Shield, Award } from 'lucide-react'
import { authAPI } from '../api'

type IdentityType = 'home' | 'channel' | 'engineer'
type Step = 1 | 2 | 3

interface FormState {
  username: string
  password: string
  confirmPassword: string
  phone: string
  email: string
  device_serial: string
  company_name: string
  business_license: string
  partner_type: string
  real_name: string
  certification_no: string
  service_area: string
}

interface BlurredState {
  username: boolean
  password: boolean
  confirmPassword: boolean
  phone: boolean
  company_name: boolean
  business_license: boolean
  real_name: boolean
  certification_no: boolean
}

const identityDefs = [
  {
    key: 'home' as const,
    label: '家庭用户',
    icon: Home,
    color: '#1890ff',
    desc: '注册后自动加入会员体系，享受设备绑定、场景联动、绿色积分等专属权益',
    tags: ['设备绑定', '场景联动', '能耗报告', '积分兑换'],
  },
  {
    key: 'channel' as const,
    label: '渠道商/合作伙伴',
    icon: Store,
    color: '#722ed1',
    desc: '入驻后获得工单管理、商城分销、渠道数据分析等运营权限',
    tags: ['工单管理', '商城分销', '渠道数据', '以旧换新'],
  },
  {
    key: 'engineer' as const,
    label: '售后工程师',
    icon: Wrench,
    color: '#52c41a',
    desc: '认证后可使用固件升级、设备健康诊断、红外桥接等专业工具',
    tags: ['固件升级', '健康诊断', '红外桥接', '远程运维'],
  },
]

const rolePermissions: Record<IdentityType, string[]> = {
  home: ['设备管理与控制', '场景引擎联动', '能耗监控与报告', '绿色积分兑换', '以旧换新评估'],
  channel: ['服务工单管理', '智家商城分销', '渠道数据分析', '以旧换新管理', '设备查看权限'],
  engineer: ['固件版本管理', '设备健康诊断', '红外网关桥接', '远程运维工具', '服务工单处理'],
}

const roleNames: Record<IdentityType, string> = {
  home: '家庭用户',
  channel: '渠道商/合作伙伴',
  engineer: '售后工程师',
}

const container: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
  padding: 20,
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '36px 32px',
  width: '100%',
  maxWidth: 520,
  maxHeight: 'calc(100vh - 40px)',
  overflowY: 'auto',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
}

const logo: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 8,
}

const logoIcon: React.CSSProperties = {
  width: 56,
  height: 56,
  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 12px',
  color: '#fff',
  fontSize: 24,
  fontWeight: 700,
}

const title: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: 6,
  color: '#1a1a2e',
}

const subtitle: React.CSSProperties = {
  fontSize: 14,
  textAlign: 'center',
  color: '#8c8c8c',
  marginBottom: 24,
}

const backLink: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: '#1890ff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 20,
}

const identityCol: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 20,
}

const identityCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  border: '2px solid #f0f0f0',
  cursor: 'pointer',
  transition: 'all 0.25s',
  background: '#fafafa',
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
}

const formGroup: React.CSSProperties = {
  marginBottom: 18,
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#595959',
  marginBottom: 8,
}

const inputWrapper: React.CSSProperties = {
  position: 'relative',
}

const inputIcon: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#bfbfbf',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px 12px 44px',
  border: '1px solid #d9d9d9',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  background: '#fafafa',
}

const inputError: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px 12px 44px',
  border: '1px solid #ff4d4f',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  background: '#fff2f0',
}

const inputCheck: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
}

const helperText: React.CSSProperties = {
  fontSize: 12,
  color: '#ff4d4f',
  marginTop: 4,
  paddingLeft: 4,
}

const eyeBtn: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#bfbfbf',
  padding: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px 12px 44px',
  border: '1px solid #d9d9d9',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  background: '#fafafa',
  appearance: 'none',
  cursor: 'pointer',
}

const btn: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.2s',
}

const primaryBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  color: '#fff',
  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
}

const divider: React.CSSProperties = {
  height: 1,
  background: '#f0f0f0',
  margin: '20px 0',
}

const strengthBar: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  marginTop: 6,
}

const strengthSegment: (color: string) => React.CSSProperties = (color) => ({
  flex: 1,
  height: 4,
  borderRadius: 2,
  background: color,
  transition: 'all 0.3s',
})

const tagStyle: (color: string) => React.CSSProperties = (color) => ({
  display: 'inline-block',
  padding: '2px 10px',
  fontSize: 11,
  borderRadius: 4,
  background: `${color}10`,
  color,
  fontWeight: 500,
})

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  background: '#fffbe6',
  color: '#d48806',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
}

const successContainer: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px 0',
}

const successIconWrap: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: '#f6ffed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
}

const permissionList: React.CSSProperties = {
  textAlign: 'left',
  maxWidth: 320,
  margin: '0 auto',
}

const permissionItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 0',
  borderBottom: '1px solid #f5f5f5',
  fontSize: 14,
  color: '#595959',
}

const errorBox: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  marginBottom: 16,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  background: '#fff2f0',
  border: '1px solid #ffccc7',
}

const errorText: React.CSSProperties = {
  fontSize: 13,
  color: '#cf1322',
  lineHeight: 1.6,
}

function getPasswordStrength(password: string) {
  if (!password || password.length < 6) return { level: 'weak', score: 0, color: '#ff4d4f', label: '弱' }
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)
  if (password.length >= 8 && hasLetter && hasNumber && hasSpecial) {
    return { level: 'strong', score: 3, color: '#52c41a', label: '强' }
  }
  if (password.length >= 6 && hasLetter && hasNumber) {
    return { level: 'medium', score: 2, color: '#faad14', label: '中' }
  }
  return { level: 'weak', score: 1, color: '#ff4d4f', label: '弱' }
}

function validatePhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone)
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState('/dashboard')
  const [countdown, setCountdown] = useState(3)

  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    device_serial: '',
    company_name: '',
    business_license: '',
    partner_type: '',
    real_name: '',
    certification_no: '',
    service_area: '',
  })

  const [blurred, setBlurred] = useState<BlurredState>({
    username: false,
    password: false,
    confirmPassword: false,
    phone: false,
    company_name: false,
    business_license: false,
    real_name: false,
    certification_no: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            const token = localStorage.getItem('token')
            if (token) navigate(redirectPath, { replace: true })
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, countdown, navigate, redirectPath])

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const blurField = (field: keyof BlurredState) => {
    setBlurred((prev) => ({ ...prev, [field]: true }))
  }

  const getFieldStyle = (field: keyof BlurredState, value: string, validate: () => string | null) => {
    if (!blurred[field]) return input
    return value && !validate() ? input : (value ? inputError : inputError)
  }

  const renderFieldStatus = (field: keyof BlurredState, value: string, validate: () => string | null) => {
    if (!blurred[field] || !value) return null
    const err = validate()
    if (err) {
      return <AlertCircle size={16} color="#ff4d4f" style={inputCheck} />
    }
    return <CheckCircle size={16} color="#52c41a" style={inputCheck} />
  }

  const renderFieldError = (field: keyof BlurredState, validate: () => string | null) => {
    if (!blurred[field]) return null
    const err = validate()
    if (err) return <div style={helperText}>{err}</div>
    return null
  }

  const validateUsername = () => !form.username.trim() ? '请输入用户名' : null
  const validatePassword = () => {
    if (!form.password) return '请输入密码'
    if (form.password.length < 6) return '密码长度至少6位'
    return null
  }
  const validateConfirmPassword = () => {
    if (!form.confirmPassword) return '请确认密码'
    if (form.confirmPassword !== form.password) return '两次密码输入不一致'
    return null
  }
  const validatePhone = () => {
    if (!form.phone) return '请输入手机号'
    if (!/^1[3-9]\d{9}$/.test(form.phone)) return '手机号格式不正确'
    return null
  }
  const validateCompanyName = () => !form.company_name.trim() ? '请输入公司名称' : null
  const validateBusinessLicense = () => !form.business_license.trim() ? '请输入营业执照号' : null
  const validateRealName = () => !form.real_name.trim() ? '请输入真实姓名' : null
  const validateCertificationNo = () => !form.certification_no.trim() ? '请输入认证编号' : null

  const isFormValid = () => {
    if (validateUsername() || validatePassword() || validateConfirmPassword() || validatePhone()) return false
    if (selectedIdentity === 'channel') {
      if (validateCompanyName() || validateBusinessLicense()) return false
    }
    if (selectedIdentity === 'engineer') {
      if (validateRealName() || validateCertificationNo()) return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!selectedIdentity || !isFormValid()) return
    setError(null)
    setLoading(true)

    try {
      const data: Record<string, any> = {
        username: form.username,
        password: form.password,
        phone: form.phone,
        email: form.email || undefined,
        identity_type: selectedIdentity,
      }

      if (selectedIdentity === 'home') {
        data.device_serial = form.device_serial || undefined
      }
      if (selectedIdentity === 'channel') {
        data.company_name = form.company_name
        data.business_license = form.business_license
        data.partner_type = form.partner_type || undefined
      }
      if (selectedIdentity === 'engineer') {
        data.real_name = form.real_name
        data.certification_no = form.certification_no
        data.service_area = form.service_area || undefined
      }

      const res = await authAPI.register(data)
      const resData = res.data?.data || res.data
      const token = resData?.token
      const user = resData?.user

      if (token) {
        localStorage.setItem('token', token)
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        setRedirectPath(resData?.redirect_path || '/dashboard')
        setStep(3)
      } else {
        setError('注册返回数据异常')
      }
    } catch (err: any) {
      const errorData = err.response?.data
      setError(errorData?.message || errorData?.error?.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <>
      <div style={logo}>
        <div style={logoIcon}>海</div>
        <h1 style={title}>海尔智家IoT控制平台</h1>
        <p style={subtitle}>选择您的身份类型，开始注册</p>
      </div>

      <div style={identityCol}>
        {identityDefs.map((def) => {
          const Icon = def.icon
          const isSelected = selectedIdentity === def.key
          return (
            <div
              key={def.key}
              style={{
                ...identityCard,
                borderColor: isSelected ? def.color : '#f0f0f0',
                background: isSelected ? `${def.color}08` : '#fafafa',
                boxShadow: isSelected
                  ? `0 0 0 1px ${def.color}, 0 4px 12px ${def.color}30`
                  : 'none',
              }}
              onClick={() => setSelectedIdentity(def.key)}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: `${def.color}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color={def.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 4 }}>{def.label}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1.6, marginBottom: 8 }}>{def.desc}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {def.tags.map((tag) => (
                    <span key={tag} style={tagStyle(def.color)}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        style={{
          ...btn,
          ...primaryBtn,
          opacity: !selectedIdentity ? 0.5 : 1,
          cursor: !selectedIdentity ? 'not-allowed' : 'pointer',
        }}
        disabled={!selectedIdentity}
        onClick={() => selectedIdentity && setStep(2)}
      >
        下一步：填写注册信息
      </button>
    </>
  )

  const renderCommonFields = () => (
    <>
      <div style={formGroup}>
        <label style={label}>用户名 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <User size={18} style={inputIcon} />
          <input
            style={blurred.username && validateUsername() ? inputError : input}
            value={form.username}
            onChange={(e) => updateForm('username', e.target.value)}
            onBlur={() => blurField('username')}
            placeholder="请输入用户名"
          />
          {renderFieldStatus('username', form.username, validateUsername)}
        </div>
        {renderFieldError('username', validateUsername)}
      </div>

      <div style={formGroup}>
        <label style={label}>密码 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <Lock size={18} style={inputIcon} />
          <input
            style={blurred.password && validatePassword() ? inputError : input}
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => updateForm('password', e.target.value)}
            onBlur={() => blurField('password')}
            placeholder="请输入密码（至少6位）"
          />
          <button
            type="button"
            style={{ ...eyeBtn, right: form.password ? 40 : 12 }}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {form.password && !validatePassword() && (
            <span style={inputCheck}>
              <CheckCircle size={16} color="#52c41a" />
            </span>
          )}
        </div>
        {renderFieldError('password', validatePassword)}
        {form.password && (
          <div>
            <div style={strengthBar}>
              {[1, 2, 3].map((i) => {
                const strength = getPasswordStrength(form.password)
                return (
                  <div
                    key={i}
                    style={strengthSegment(i <= strength.score ? strength.color : '#f0f0f0')}
                  />
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: getPasswordStrength(form.password).color, marginTop: 4 }}>
              密码强度：{getPasswordStrength(form.password).label}
            </div>
          </div>
        )}
      </div>

      <div style={formGroup}>
        <label style={label}>确认密码 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <Lock size={18} style={inputIcon} />
          <input
            style={blurred.confirmPassword && validateConfirmPassword() ? inputError : input}
            type={showConfirmPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => updateForm('confirmPassword', e.target.value)}
            onBlur={() => blurField('confirmPassword')}
            placeholder="请再次输入密码"
          />
          <button
            type="button"
            style={{ ...eyeBtn, right: form.confirmPassword ? 40 : 12 }}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {form.confirmPassword && !validateConfirmPassword() && (
            <span style={inputCheck}>
              <CheckCircle size={16} color="#52c41a" />
            </span>
          )}
        </div>
        {renderFieldError('confirmPassword', validateConfirmPassword)}
      </div>

      <div style={formGroup}>
        <label style={label}>手机号 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <Phone size={18} style={inputIcon} />
          <input
            style={blurred.phone && validatePhone() ? inputError : input}
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            onBlur={() => blurField('phone')}
            placeholder="请输入手机号"
          />
          {renderFieldStatus('phone', form.phone, validatePhone)}
        </div>
        {renderFieldError('phone', validatePhone)}
      </div>

      <div style={formGroup}>
        <label style={label}>邮箱</label>
        <div style={inputWrapper}>
          <Mail size={18} style={inputIcon} />
          <input
            style={input}
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="请输入邮箱（选填）"
          />
        </div>
      </div>
    </>
  )

  const renderHomeFields = () => (
    <>
      <div style={formGroup}>
        <label style={label}>会员等级</label>
        <div style={badgeStyle}>
          <Award size={16} />
          普通会员
        </div>
      </div>
      <div style={formGroup}>
        <label style={label}>初始设备绑定</label>
        <div style={inputWrapper}>
          <Cpu size={18} style={inputIcon} />
          <input
            style={input}
            value={form.device_serial}
            onChange={(e) => updateForm('device_serial', e.target.value)}
            placeholder="设备序列号（选填）"
          />
        </div>
      </div>
    </>
  )

  const renderChannelFields = () => (
    <>
      <div style={formGroup}>
        <label style={label}>公司名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <Building2 size={18} style={inputIcon} />
          <input
            style={blurred.company_name && validateCompanyName() ? inputError : input}
            value={form.company_name}
            onChange={(e) => updateForm('company_name', e.target.value)}
            onBlur={() => blurField('company_name')}
            placeholder="请输入公司名称"
          />
          {renderFieldStatus('company_name', form.company_name, validateCompanyName)}
        </div>
        {renderFieldError('company_name', validateCompanyName)}
      </div>
      <div style={formGroup}>
        <label style={label}>营业执照号 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <FileText size={18} style={inputIcon} />
          <input
            style={blurred.business_license && validateBusinessLicense() ? inputError : input}
            value={form.business_license}
            onChange={(e) => updateForm('business_license', e.target.value)}
            onBlur={() => blurField('business_license')}
            placeholder="请输入营业执照号"
          />
          {renderFieldStatus('business_license', form.business_license, validateBusinessLicense)}
        </div>
        {renderFieldError('business_license', validateBusinessLicense)}
      </div>
      <div style={formGroup}>
        <label style={label}>合作类型</label>
        <div style={inputWrapper}>
          <Shield size={18} style={inputIcon} />
          <select
            style={selectStyle}
            value={form.partner_type}
            onChange={(e) => updateForm('partner_type', e.target.value)}
          >
            <option value="">请选择合作类型</option>
            <option value="dealer">经销商</option>
            <option value="service">服务商</option>
            <option value="installer">安装商</option>
          </select>
        </div>
      </div>
    </>
  )

  const renderEngineerFields = () => (
    <>
      <div style={formGroup}>
        <label style={label}>真实姓名 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <User size={18} style={inputIcon} />
          <input
            style={blurred.real_name && validateRealName() ? inputError : input}
            value={form.real_name}
            onChange={(e) => updateForm('real_name', e.target.value)}
            onBlur={() => blurField('real_name')}
            placeholder="请输入真实姓名"
          />
          {renderFieldStatus('real_name', form.real_name, validateRealName)}
        </div>
        {renderFieldError('real_name', validateRealName)}
      </div>
      <div style={formGroup}>
        <label style={label}>认证编号 <span style={{ color: '#ff4d4f' }}>*</span></label>
        <div style={inputWrapper}>
          <FileText size={18} style={inputIcon} />
          <input
            style={blurred.certification_no && validateCertificationNo() ? inputError : input}
            value={form.certification_no}
            onChange={(e) => updateForm('certification_no', e.target.value)}
            onBlur={() => blurField('certification_no')}
            placeholder="请输入认证编号"
          />
          {renderFieldStatus('certification_no', form.certification_no, validateCertificationNo)}
        </div>
        {renderFieldError('certification_no', validateCertificationNo)}
      </div>
      <div style={formGroup}>
        <label style={label}>服务区域</label>
        <div style={inputWrapper}>
          <MapPin size={18} style={inputIcon} />
          <select
            style={selectStyle}
            value={form.service_area}
            onChange={(e) => updateForm('service_area', e.target.value)}
          >
            <option value="">请选择服务区域</option>
            <option value="north">华北</option>
            <option value="east">华东</option>
            <option value="south">华南</option>
            <option value="southwest">西南</option>
            <option value="nationwide">全国</option>
          </select>
        </div>
      </div>
    </>
  )

  const renderStep2 = () => {
    if (!selectedIdentity) return null
    const def = identityDefs.find((d) => d.key === selectedIdentity)!
    const Icon = def.icon

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${def.color}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} color={def.color} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>{def.label}注册</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>请填写以下信息完成注册</div>
          </div>
        </div>

        {error && (
          <div style={errorBox}>
            <AlertCircle size={18} color="#cf1322" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={errorText}>{error}</div>
          </div>
        )}

        {renderCommonFields()}

        <div style={divider} />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#595959', marginBottom: 14 }}>
          {selectedIdentity === 'home' ? '会员信息' : selectedIdentity === 'channel' ? '企业信息' : '工程师认证'}
        </div>

        {selectedIdentity === 'home' && renderHomeFields()}
        {selectedIdentity === 'channel' && renderChannelFields()}
        {selectedIdentity === 'engineer' && renderEngineerFields()}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            style={{
              ...btn,
              flex: 1,
              background: '#f5f5f5',
              color: '#595959',
            }}
            onClick={() => { setStep(1); setError(null) }}
          >
            <ArrowLeft size={16} />
            返回选择
          </button>
          <button
            style={{
              ...btn,
              ...primaryBtn,
              flex: 2,
              opacity: !isFormValid() || loading ? 0.5 : 1,
              cursor: !isFormValid() || loading ? 'not-allowed' : 'pointer',
            }}
            disabled={!isFormValid() || loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                注册中...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                立即注册
              </>
            )}
          </button>
        </div>
      </>
    )
  }

  const renderStep3 = () => {
    if (!selectedIdentity) return null
    const def = identityDefs.find((d) => d.key === selectedIdentity)!
    const permissions = rolePermissions[selectedIdentity]

    return (
      <div style={successContainer}>
        <div style={successIconWrap}>
          <CheckCircle size={40} color="#52c41a" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#262626', marginBottom: 8 }}>
          注册成功！
        </h2>
        <p style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 24 }}>
          欢迎加入海尔智家IoT平台，{roleNames[selectedIdentity]}
        </p>

        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          padding: '10px 16px',
          background: `${def.color}08`,
          borderRadius: 10,
          border: `1px solid ${def.color}20`,
        }}>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>身份类型</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: def.color }}>{def.label}</div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 12, textAlign: 'left' }}>
          您已获得以下权限：
        </div>
        <div style={permissionList}>
          {permissions.map((perm) => (
            <div key={perm} style={permissionItem}>
              <CheckCircle size={16} color={def.color} />
              {perm}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            style={{ ...btn, ...primaryBtn }}
            onClick={() => navigate(redirectPath, { replace: true })}
          >
            立即进入
          </button>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 12 }}>
            {countdown}秒后自动跳转...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={card}>
        {step !== 3 && (
          <div style={backLink} onClick={() => navigate('/login')}>
            <ArrowLeft size={14} />
            返回登录
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
