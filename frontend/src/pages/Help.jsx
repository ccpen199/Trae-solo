import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Flag, Phone, HelpCircle, QrCode, Camera, ChevronRight, X } from 'lucide-react'
import { reportApi, bikeApi } from '../services/api'

const HelpPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('fault')
  const [faultTypes, setFaultTypes] = useState([])
  const [reportTypes, setReportTypes] = useState([])
  const [helpInfo, setHelpInfo] = useState(null)
  
  const [bikeCode, setBikeCode] = useState('')
  const [selectedFault, setSelectedFault] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [reportType, setReportType] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [faultRes, reportRes, helpRes] = await Promise.all([
        reportApi.getFaultTypes(),
        reportApi.getReportTypes(),
        reportApi.getHelpInfo()
      ])
      setFaultTypes(faultRes.data.types)
      setReportTypes(reportRes.data.types)
      setHelpInfo(helpRes.data.helpSections)
    } catch (e) {
      console.error('Failed to load help data:', e)
    }
  }

  const handleSubmitFault = async () => {
    if (!bikeCode.trim()) {
      setError('请扫码或输入车辆编号')
      return
    }
    if (!selectedFault) {
      setError('请选择故障类型')
      return
    }
    if (description.length > 100) {
      setError('描述不能超过100字')
      return
    }

    setLoading(true)
    setError('')

    try {
      await reportApi.submitFault({
        bikeCode: bikeCode.toUpperCase(),
        faultType: selectedFault,
        description,
        photos,
      })
      setShowSuccess(true)
    } catch (e) {
      setError(e.response?.data?.error || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!reportType) {
      setError('请选择举报类型')
      return
    }

    setLoading(true)
    setError('')

    try {
      await reportApi.submitReport({
        reportType,
        bikeCode,
        description: reportDescription,
      })
      setShowSuccess(true)
    } catch (e) {
      setError(e.response?.data?.error || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhoto = () => {
    if (photos.length >= 3) return
    const fakePhoto = `photo_${Date.now()}`
    setPhotos([...photos, fakePhoto])
  }

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  if (showSuccess) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>
          <Flag size={40} color="#fff" />
        </div>
        <h2 style={styles.successTitle}>提交成功</h2>
        <p style={styles.successDesc}>感谢您的反馈，我们会尽快处理</p>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={styles.title}>帮助中心</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => { setActiveTab('fault'); setError('') }}
          style={{
            ...styles.tab,
            ...(activeTab === 'fault' ? styles.tabActive : {})
          }}
        >
          <AlertTriangle size={18} />
          <span>上报故障</span>
        </button>
        <button
          onClick={() => { setActiveTab('report'); setError('') }}
          style={{
            ...styles.tab,
            ...(activeTab === 'report' ? styles.tabActive : {})
          }}
        >
          <Flag size={18} />
          <span>举报</span>
        </button>
        <button
          onClick={() => { setActiveTab('help'); setError('') }}
          style={{
            ...styles.tab,
            ...(activeTab === 'help' ? styles.tabActive : {})
          }}
        >
          <HelpCircle size={18} />
          <span>客服帮助</span>
        </button>
      </div>

      {error && (
        <div style={styles.errorBar}>
          <AlertTriangle size={14} color="#FF4D4F" />
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {activeTab === 'fault' && (
        <div style={styles.content}>
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>1. 扫码车辆</h3>
            <div style={styles.scanRow}>
              <button style={styles.scanBtn}>
                <QrCode size={28} color="#FF6B00" />
                <span style={styles.scanBtnText}>扫码</span>
              </button>
              <span style={styles.orText}>或</span>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="输入车辆编号"
                  value={bikeCode}
                  onChange={e => setBikeCode(e.target.value.toUpperCase())}
                  style={styles.codeInput}
                />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>2. 选择故障类型</h3>
            <div style={styles.typeGrid}>
              {faultTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedFault(type.value)}
                  style={{
                    ...styles.typeBtn,
                    ...(selectedFault === type.value ? styles.typeBtnActive : {})
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>3. 问题描述（选填）</h3>
            <textarea
              placeholder="请详细描述问题（最多100字）"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
              style={styles.textArea}
            />
            <div style={styles.charCount}>
              <span style={description.length >= 90 ? styles.charCountWarning : {}}>
                {description.length}/100
              </span>
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>4. 上传照片（选填）</h3>
            <div style={styles.photoRow}>
              {photos.map((photo, index) => (
                <div key={index} style={styles.photoItem}>
                  <div style={styles.photoPlaceholder}>
                    <Camera size={24} color="#999" />
                  </div>
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    style={styles.removePhotoBtn}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button onClick={handleAddPhoto} style={styles.addPhotoBtn}>
                  <Camera size={24} color="#999" />
                  <span style={styles.addPhotoText}>添加照片</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div style={styles.content}>
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>举报类型</h3>
            <div style={styles.typeList}>
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  style={{
                    ...styles.typeListItem,
                    ...(reportType === type.value ? styles.typeListItemActive : {})
                  }}
                >
                  <span style={styles.typeListLabel}>{type.label}</span>
                  <div style={{
                    ...styles.radioCircle,
                    ...(reportType === type.value ? styles.radioCircleActive : {})
                  }} />
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>车辆编号（选填）</h3>
            <input
              type="text"
              placeholder="输入车辆编号"
              value={bikeCode}
              onChange={e => setBikeCode(e.target.value.toUpperCase())}
              style={styles.codeInputFull}
            />
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>问题描述（选填）</h3>
            <textarea
              placeholder="请详细描述问题"
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              style={styles.textArea}
            />
          </div>
        </div>
      )}

      {activeTab === 'help' && helpInfo && (
        <div style={styles.content}>
          {helpInfo.map((section, index) => (
            <div key={index} style={styles.helpSection}>
              <h3 style={styles.helpTitle}>{section.title}</h3>
              {section.items && section.items.map((item, i) => (
                <div key={i} style={styles.faqItem}>
                  <div style={styles.faqQuestion}>
                    <HelpCircle size={16} color="#FF6B00" />
                    <span style={styles.faqQuestionText}>{item.question}</span>
                    <ChevronRight size={16} color="#ccc" />
                  </div>
                  <p style={styles.faqAnswer}>{item.answer}</p>
                </div>
              ))}
              {section.phone && (
                <div style={styles.contactCard}>
                  <Phone size={24} color="#FF6B00" />
                  <div style={styles.contactInfo}>
                    <p style={styles.contactPhone}>{section.phone}</p>
                    <p style={styles.contactTime}>服务时间：{section.serviceTime}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(activeTab === 'fault' || activeTab === 'report') && (
        <div style={styles.footer}>
          <button
            onClick={activeTab === 'fault' ? handleSubmitFault : handleSubmitReport}
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {})
            }}
          >
            {loading ? '提交中...' : '提交'}
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    paddingTop: 40,
    borderBottom: '1px solid #f0f0f0',
  },
  backBtn: {
    padding: 4,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    display: 'flex',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    border: 'none',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#FFF7E6',
    color: '#FF6B00',
  },
  errorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2F0',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#FF4D4F',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scanRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  scanBtn: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scanBtnText: {
    fontSize: 12,
    color: '#FF6B00',
    marginTop: 4,
  },
  orText: {
    fontSize: 14,
    color: '#999',
  },
  inputWrapper: {
    flex: 1,
  },
  codeInput: {
    width: '100%',
    height: 44,
    backgroundColor: '#F7F8FA',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 16,
    outline: 'none',
  },
  codeInputFull: {
    width: '100%',
    height: 44,
    backgroundColor: '#F7F8FA',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: '0 12px',
    fontSize: 16,
    outline: 'none',
  },
  typeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    padding: '10px 16px',
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    border: '2px solid transparent',
    fontSize: 14,
    color: '#666',
    cursor: 'pointer',
  },
  typeBtnActive: {
    backgroundColor: '#FFF7E6',
    borderColor: '#FF6B00',
    color: '#FF6B00',
  },
  textArea: {
    width: '100%',
    height: 100,
    backgroundColor: '#F7F8FA',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 8,
  },
  charCountWarning: {
    color: '#FF4D4F',
  },
  photoRow: {
    display: 'flex',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    border: '2px dashed #d9d9d9',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    color: '#999',
  },
  typeList: {
    gap: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  typeListItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  typeListItemActive: {
    backgroundColor: '#FFF7E6',
    borderColor: '#FF6B00',
  },
  typeListLabel: {
    fontSize: 14,
    color: '#333',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#FF6B00',
  },
  helpSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    paddingLeft: 24,
    lineHeight: 1.5,
  },
  contactCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF7E6',
    borderRadius: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactPhone: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  contactTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 25,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  successContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 40,
  },
  successIcon: {
    width: 72,
    height: 72,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  backBtn: {
    width: 200,
    height: 48,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default HelpPage
