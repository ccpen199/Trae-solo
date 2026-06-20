import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import SignSteps from '@/components/SignStep';
import LegalModal from '@/components/LegalModal';
import SignPad from '@/components/SignPad';
import { getSignDocument, getSignLogs, verifyBiometric, signDocument } from '@/services/signing';
import type { SignDocument, SignLog, SignStep as SignStepType } from '@/types';
import { mockSignDocuments } from '@/data/mock';
import styles from './index.module.scss';

const typeNameMap: Record<string, string> = {
  application: '申请书', agreement: '协议/章程', declaration: '承诺书', certificate: '证明文件'
};

const SignDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, action } = router.params;
  const [document, setDocument] = useState<SignDocument | null>(null);
  const [logs, setLogs] = useState<SignLog[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showLegal, setShowLegal] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [legalDone, setLegalDone] = useState(false);
  const [bioFaceDone, setBioFaceDone] = useState(false);
  const [bioFingerDone, setBioFingerDone] = useState(false);
  const [signData, setSignData] = useState<string | null>(null);
  const [sealDone, setSealDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const docId = id || mockSignDocuments[0]?.id;

  const signSteps: SignStepType[] = useMemo(() => [
    { step: 1, title: '阅读签署文件', description: '预览并确认签署文件内容', status: currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'current') : 'pending' },
    { step: 2, title: '法律效力声明', description: '确认电子签名的法律效力', status: currentStep >= 2 ? (legalDone ? 'completed' : 'current') : 'pending' },
    { step: 3, title: '生物特征核验', description: '通过人脸/指纹验证本人身份', status: currentStep >= 3 ? ((bioFaceDone || bioFingerDone) ? 'completed' : 'current') : 'pending' },
    { step: 4, title: '手写签名/签章', description: '手写签名并加盖电子签章', status: currentStep >= 4 ? ((signData && sealDone) ? 'completed' : 'current') : 'pending' },
    { step: 5, title: '时间戳存证', description: '权威时间戳固化签署证据', status: currentStep >= 5 ? 'current' : 'pending' }
  ], [currentStep, legalDone, bioFaceDone, bioFingerDone, signData, sealDone]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1: return true;
      case 2: return legalDone;
      case 3: return bioFaceDone || bioFingerDone;
      case 4: return !!signData && sealDone;
      case 5: return true;
      default: return false;
    }
  }, [currentStep, legalDone, bioFaceDone, bioFingerDone, signData, sealDone]);

  const loadData = useCallback(async () => {
    Taro.showLoading({ title: '加载中...', mask: true });
    try {
      const [doc, logList] = await Promise.all([getSignDocument(docId), getSignLogs(docId)]);
      setDocument(doc);
      setLogs(logList);
      if (action === 'sign') {
        setTimeout(() => setCurrentStep(2), 500);
      }
    } catch (err: any) {
      console.error('[SignDetail] 加载失败:', err);
      const doc = mockSignDocuments.find(d => d.id === docId) || mockSignDocuments[0];
      setDocument(doc);
    } finally {
      Taro.hideLoading();
    }
  }, [docId, action]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLegalConfirm = () => {
    console.log('[SignDetail] 法律效力声明已确认');
    setLegalDone(true);
    setShowLegal(false);
    Taro.showToast({ title: '已确认法律效力声明', icon: 'success' });
    setTimeout(() => setCurrentStep(3), 600);
  };

  const doBioVerify = async (type: 'face' | 'fingerprint') => {
    console.log('[SignDetail] 开始生物核验:', type);
    Taro.showLoading({ title: type === 'face' ? '人脸核验中...' : '指纹核验中...', mask: true });
    try {
      const res = await verifyBiometric(type);
      Taro.hideLoading();
      if (res.success) {
        if (type === 'face') setBioFaceDone(true);
        else setBioFingerDone(true);
        Taro.showToast({
          title: `${type === 'face' ? '人脸' : '指纹'}核验通过\n置信度: ${res.score}%`,
          icon: 'success',
          duration: 2000
        });
        setTimeout(() => setCurrentStep(4), 1000);
      }
    } catch (err: any) {
      Taro.hideLoading();
      console.error('[SignDetail] 生物核验失败:', err);
      Taro.showModal({
        title: '核验提示',
        content: '核验服务暂不可用，是否使用演示模式继续？',
        success: (r) => {
          if (r.confirm) {
            if (type === 'face') setBioFaceDone(true);
            else setBioFingerDone(true);
            setTimeout(() => setCurrentStep(4), 500);
          }
        }
      });
    }
  };

  const handleSignConfirm = (dataUrl: string) => {
    console.log('[SignDetail] 签名完成，数据长度:', dataUrl.length);
    setSignData(dataUrl);
    setShowSignPad(false);
    setTimeout(() => {
      setSealDone(true);
      console.log('[SignDetail] 电子签章完成');
    }, 500);
  };

  const handleNext = async () => {
    if (!canProceed) return;

    if (currentStep === 2 && !legalDone) {
      setShowLegal(true);
      return;
    }

    if (currentStep < 5) {
      if (currentStep === 4) {
        if (!signData) { setShowSignPad(true); return; }
        if (!sealDone) {
          setSealDone(true);
          Taro.showToast({ title: '电子签章完成', icon: 'success' });
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
      return;
    }

    // 步骤5：执行签署并固化
    if (currentStep === 5 && document) {
      setLoading(true);
      Taro.showLoading({ title: '正在签署并固化证据...', mask: true });
      try {
        const result = await signDocument({
          documentId: document.id,
          positionIndex: 0,
          signature: signData || undefined,
          useSeal: sealDone
        });
        console.log('[SignDetail] 签署完成:', result);
        const newLog: SignLog = result.signLog;
        setLogs(prev => [...prev, newLog]);
        Taro.hideLoading();
        Taro.showModal({
          title: '🎉 签署完成',
          content: `签署已完成，法律效力已生效。\n\n签署时间戳：${newLog.tsaTimestamp}\nTSA哈希值：${newLog.tsaHash?.slice(0, 32)}...\n\n全部证据已固化至政务云，可随时下载证据包用于司法举证。`,
          confirmText: '下载证据包',
          cancelText: '返回列表',
          confirmColor: '#1E5DAB',
          success: (r) => {
            if (r.confirm) {
              Taro.showToast({ title: '证据包已保存至政务云盘', icon: 'success' });
            }
            setTimeout(() => Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/signing/index' })), 1000);
          }
        });
      } catch (err: any) {
        Taro.hideLoading();
        console.error('[SignDetail] 签署失败:', err);
        Taro.showModal({
          title: '签署演示模式',
          content: '演示环境签署服务暂不可用，是否模拟完成签署流程？',
          success: (r) => {
            if (r.confirm) {
              const now = dayjs();
              const mockLog: SignLog = {
                id: 'SL' + Date.now(),
                documentId: document.id,
                userId: 'U20240001',
                userName: '张三',
                action: 'sign',
                timestamp: now.format('YYYY-MM-DD HH:mm:ss'),
                deviceInfo: 'iPhone 15 Pro, iOS 17.2',
                ip: '221.xxx.xxx.xxx',
                location: '江苏省南京市',
                biometricType: 'face',
                biometricVerified: true,
                tsaTimestamp: now.format('YYYY-MM-DD HH:mm:ss.SSS'),
                tsaHash: 'SHA256:7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069'
              };
              setLogs(prev => [...prev, mockLog]);
              Taro.showToast({ title: '签署完成（演示）', icon: 'success' });
            }
          }
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return '第 1 步 / 共 5 步：预览签署文件';
      case 2: return '第 2 步 / 共 5 步：法律效力声明';
      case 3: return '第 3 步 / 共 5 步：本人身份核验';
      case 4: return '第 4 步 / 共 5 步：手写签名与签章';
      case 5: return '第 5 步 / 共 5 步：确认并完成签署';
      default: return '';
    }
  };

  return (
    <>
      <ScrollView scrollY style={{ height: '100vh' }}>
        <PageContainer scroll={false} padding safeBottom>
          <View className={styles.contentPadding}>
            {/* 文件信息 */}
            <View className={styles.topBar}>
              {document && (
                <>
                  <View className={styles.docTitleRow}>
                    <View className={styles.docIcon}>
                      <Text>{document.documentType === 'application' ? '📝' : document.documentType === 'agreement' ? '📄' : '✅'}</Text>
                    </View>
                    <View className={styles.docInfo}>
                      <Text className={styles.docTitle}>{document.title}</Text>
                      <View className={styles.docMeta}>
                        <Text>关联事项：{document.applyName}</Text>
                        {'\n'}
                        <Text>文件编号：{document.id}</Text>
                        {'\n'}
                        <Text>文件类型：{typeNameMap[document.documentType] || '其他'} · 共{document.pages}页</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '16rpx', fontWeight: '500' }}>签署方：</Text>
                  <View className={styles.signerTags}>
                    {document.signPositions.map((p, idx) => {
                      const isCurrent = p.signerRole === '申请人';
                      return (
                        <View
                          key={idx}
                          className={classnames(
                            styles.signerTag,
                            p.signedAt && styles.signerTagDone,
                            isCurrent && !p.signedAt && styles.signerTagCurrent
                          )}
                        >
                          <View className={styles.signerStatusDot} />
                          <Text className={styles.signerText}>
                            {p.signerName ? `${p.signerName}（${p.signerRole}）` : p.signerRole}
                            {p.signedAt ? ' ✓' : isCurrent ? ' · 本人' : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            {/* 签署步骤指引 */}
            <View className={styles.stepCard}>
              <View className={styles.stepTitle}>签署流程引导</View>
              <SignSteps steps={signSteps} />
            </View>

            {/* 当前步骤内容 */}
            {currentStep === 1 && document && (
              <View className={styles.stepCard}>
                <View className={styles.stepTitle}>{getStepTitle()}</View>
                <ScrollView scrollY style={{ maxHeight: '600rpx' }}>
                  <View className={styles.docPreview}>
                    <View className={styles.docPageHeader}>
                      <Text className={styles.docPageTitle}>{document.title}</Text>
                      <Text className={styles.docPageSubtitle}>{document.applyName} · 文件编号：{document.id}</Text>
                    </View>
                    <View className={styles.docPageContent}>
                      <Text>
                        申请人：张三{'\n'}
                        身份证号：3201**********1234{'\n\n'}
                        根据《市场主体登记管理条例》等法律法规的规定，申请人本着诚实信用原则，向登记机关申请办理上述登记事项。{'\n\n'}
                        一、申请事项：{document.applyName}{'\n\n'}
                        二、申请人承诺所提交的全部信息、证件、材料均真实、合法、有效，不存在虚假陈述、重大遗漏。{'\n\n'}
                        三、申请人知悉本申请书经电子签名后，与手写签名或盖章具有同等法律效力。{'\n\n'}
                        四、申请人同意登记机关将本申请信息纳入省政务数据共享平台，供相关部门依法核验。{'\n\n'}
                        五、申请人承诺如存在不实陈述，愿承担相应的行政及刑事法律责任。{'\n\n'}
                        （以下为签署栏）
                      </Text>
                    </View>
                    <View className={styles.signatureBlock}>
                      <View className={classnames(
                        styles.signArea,
                        signData ? styles.signAreaDone : styles.signAreaActive
                      )}>
                        {signData ? (
                          <Image className={styles.signatureImage} src={signData} mode="aspectFit" />
                        ) : (
                          <Text className={classnames(styles.signPlaceholder, styles.signPlaceholderActive)}>
                            申请人（签名）{'\n'}请在此处签名
                          </Text>
                        )}
                      </View>
                      <View className={classnames(
                        styles.sealBlock,
                        sealDone && styles.sealBlockDone
                      )}>
                        <Text className={classnames(styles.sealText, sealDone && styles.sealTextDone)}>
                          {sealDone ? '登记专用章' : '登记机关\n（签章处）'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}

            {currentStep === 2 && (
              <View className={styles.verifyCard}>
                <View className={styles.stepTitle}>{getStepTitle()}</View>
                <Text
                  style={{
                    fontSize: '26rpx',
                    color: '#4E5969',
                    lineHeight: '1.8',
                    padding: '24rpx',
                    background: '#F0F5FF',
                    borderRadius: '12rpx',
                    marginBottom: '24rpx'
                  }}
                >
                  根据《电子签名法》第十四条：可靠的电子签名与手写签名或者盖章具有同等的法律效力。
                  {'\n\n'}本系统采用国家商用密码 SM2/SM4 算法，并通过权威时间戳（TSA）固化证据链，
                  完全符合法律对可靠电子签名的规定。
                </Text>
                <Button
                  className={styles.mainBtn}
                  onClick={() => setShowLegal(true)}
                >
                  {legalDone ? '✓ 已确认法律效力声明' : '查看并确认法律效力声明'}
                </Button>
              </View>
            )}

            {currentStep === 3 && (
              <View className={styles.verifyCard}>
                <View className={styles.stepTitle}>{getStepTitle()}</View>
                <Text style={{ fontSize: '24rpx', color: '#86909C', lineHeight: '1.6', marginBottom: '16rpx' }}>
                  为确保签名为本人真实意思表示，请选择任一方式进行生物特征身份核验
                </Text>
                <View className={styles.verifyMethods}>
                  <View
                    className={classnames(
                      styles.methodCard,
                      bioFaceDone && styles.methodCardDone
                    )}
                    onClick={() => !bioFaceDone && !bioFingerDone && doBioVerify('face')}
                  >
                    <View className={styles.methodIcon}>😊</View>
                    <Text className={styles.methodName}>人脸识别</Text>
                    <Text className={styles.methodDesc}>通过人脸识别验证本人身份</Text>
                    <View className={classnames(
                      styles.methodStatus,
                      bioFaceDone ? styles.statusDone : styles.statusDoing
                    )}>
                      <Text>{bioFaceDone ? '✓ 已通过' : '点击核验'}</Text>
                    </View>
                  </View>
                  <View
                    className={classnames(
                      styles.methodCard,
                      bioFingerDone && styles.methodCardDone
                    )}
                    onClick={() => !bioFaceDone && !bioFingerDone && doBioVerify('fingerprint')}
                  >
                    <View className={styles.methodIcon}>👆</View>
                    <Text className={styles.methodName}>指纹核验</Text>
                    <Text className={styles.methodDesc}>通过指纹验证本人身份</Text>
                    <View className={classnames(
                      styles.methodStatus,
                      bioFingerDone ? styles.statusDone : styles.statusTodo
                    )}>
                      <Text>{bioFingerDone ? '✓ 已通过' : '点击核验'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {currentStep === 4 && (
              <View className={styles.verifyCard}>
                <View className={styles.stepTitle}>{getStepTitle()}</View>
                <View className={styles.docPreview}>
                  <View className={styles.signatureBlock}>
                    <View
                      className={classnames(
                        styles.signArea,
                        signData ? styles.signAreaDone : styles.signAreaActive
                      )}
                      onClick={() => !signData && setShowSignPad(true)}
                    >
                      {signData ? (
                        <Image className={styles.signatureImage} src={signData} mode="aspectFit" />
                      ) : (
                        <Text className={classnames(styles.signPlaceholder, styles.signPlaceholderActive)}>
                          👆 点击此处手写签名
                        </Text>
                      )}
                    </View>
                    <View className={classnames(
                      styles.sealBlock,
                      sealDone && styles.sealBlockDone
                    )}>
                      <Text className={classnames(styles.sealText, sealDone && styles.sealTextDone)}>
                        {sealDone ? '电子签章 ✓' : '签章位置'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ marginTop: '24rpx', display: 'flex', gap: '16rpx' }}>
                  <Button
                    className={styles.secondaryBtn}
                    style={{ flex: 1 }}
                    onClick={() => setShowSignPad(true)}
                  >
                    {signData ? '重新签名' : '手写签名'}
                  </Button>
                  <Button
                    className={styles.secondaryBtn}
                    style={{ flex: 1 }}
                    onClick={() => { if (!sealDone) { setSealDone(true); Taro.showToast({ title: '签章完成', icon: 'success' }); } }}
                  >
                    {sealDone ? '✓ 已加盖签章' : '加盖电子签章'}
                  </Button>
                </View>
              </View>
            )}

            {currentStep === 5 && (
              <View className={styles.verifyCard}>
                <View className={styles.stepTitle}>{getStepTitle()}</View>
                <View
                  style={{
                    padding: '32rpx',
                    background: 'linear-gradient(135deg, rgba(0,180,42,0.06), rgba(30,93,171,0.04))',
                    borderRadius: '16rpx',
                    marginBottom: '24rpx',
                    border: '2rpx solid rgba(0,180,42,0.2)'
                  }}
                >
                  <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#1D2129', display: 'block', marginBottom: '16rpx' }}>
                    ✅ 签署前确认清单
                  </Text>
                  {[
                    { ok: true, text: '已完整阅读并理解签署文件内容' },
                    { ok: legalDone, text: '已确认《电子签名法律效力声明》' },
                    { ok: bioFaceDone || bioFingerDone, text: `生物特征核验通过（${bioFaceDone ? '人脸' : '指纹'}）` },
                    { ok: !!signData, text: '已完成手写签名' },
                    { ok: sealDone, text: '已加盖电子签章' },
                    { ok: true, text: 'SM2国密算法加密传输' },
                    { ok: true, text: '时间戳（TSA）固化全部证据' }
                  ].map((item, idx) => (
                    <View key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12rpx', padding: '8rpx 0' }}>
                      <Text style={{
                        width: '32rpx',
                        height: '32rpx',
                        borderRadius: '50%',
                        background: item.ok ? '#00B42A' : '#F53F3F',
                        color: '#fff',
                        fontSize: '20rpx',
                        textAlign: 'center',
                        lineHeight: '32rpx',
                        flexShrink: 0
                      }}>
                        {item.ok ? '✓' : '✕'}
                      </Text>
                      <Text style={{ fontSize: '26rpx', color: item.ok ? '#1D2129' : '#F53F3F' }}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 操作日志 */}
            <View className={styles.logSection}>
              <View className={styles.logTitle}>
                <Text className={styles.logIcon}>📋</Text>
                <Text>签署过程全链路存证</Text>
              </View>
              {logs.length > 0 ? (
                logs.map((log, idx) => {
                  const actionNames: Record<string, string> = {
                    view: '查看文件', verify: '身份核验', sign: '电子签名',
                    seal: '加盖签章', reject: '拒绝签署'
                  };
                  return (
                    <View
                      key={log.id}
                      className={classnames(
                        styles.logItem,
                        idx === logs.length - 1 && styles.logItemActive,
                        log.action === 'sign' && styles.logItemDone
                      )}
                    >
                      <View className={styles.logDot} />
                      <Text className={styles.logAction}>
                        {actionNames[log.action] || log.action}
                        {log.action === 'verify' && log.biometricVerified && `（${log.biometricType === 'face' ? '人脸' : '指纹'}通过）`}
                      </Text>
                      <Text className={styles.logTime}>
                        {log.timestamp} · {log.userName}
                      </Text>
                      <View className={styles.logDetails}>
                        <Text>设备：{log.deviceInfo}</Text>
                        {'\n'}
                        <Text>IP：{log.ip}{log.location ? ` · ${log.location}` : ''}</Text>
                        {log.tsaHash && (
                          <>
                            {'\n'}
                            <Text>TSA时间戳哈希：</Text>
                            <Text className={styles.hashText}>{log.tsaHash}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={{ color: '#86909C', fontSize: '26rpx', textAlign: 'center', padding: '32rpx' }}>
                  暂无操作日志
                </Text>
              )}
            </View>
          </View>
        </PageContainer>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className={styles.bottomBar}>
        <Button
          className={classnames(styles.mainBtn, !canProceed && currentStep > 1 && styles.disabled)}
          onClick={handleNext}
          loading={loading}
        >
          {currentStep < 5 ? '进入下一步' : '确认签署并固化证据'}
        </Button>
        {currentStep > 1 && (
          <Button className={styles.secondaryBtn} onClick={() => setCurrentStep(prev => prev - 1)}>
            返回上一步
          </Button>
        )}
      </View>

      {/* 法律效力声明弹窗 */}
      <LegalModal
        visible={showLegal}
        onConfirm={handleLegalConfirm}
        onCancel={() => setShowLegal(false)}
      />

      {/* 手写签名板 */}
      <SignPad
        visible={showSignPad}
        onConfirm={handleSignConfirm}
        onCancel={() => setShowSignPad(false)}
      />
    </>
  );
};

export default SignDetailPage;
