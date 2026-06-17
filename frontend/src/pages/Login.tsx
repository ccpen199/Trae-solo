import { Form, Input, Button, Typography, Spin, Alert, Divider, Tag, Space, Tooltip, Steps } from 'antd';
import { UserOutlined, LockOutlined, DashboardOutlined, ShoppingOutlined, TeamOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined, SafetyCertificateOutlined, GlobalOutlined, EnvironmentOutlined, ApiOutlined, InfoCircleOutlined, EyeInvisibleOutlined, EyeOutlined, ArrowRightOutlined, CheckCircleOutlined, CloseCircleOutlined, ScanOutlined, LineChartOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

type Step = 'idle' | 'loading' | 'ok' | 'fail';

type ErrorCategory = 'empty' | 'format' | 'credential' | 'permission' | 'network' | 'server' | 'unknown';

interface AccountDef {
  user: string;
  pwd: string;
  label: string;
  role: 'admin' | 'user' | 'courier';
  icon: any;
  color: string;
  bg: string;
  desc: string;
  target: string;
  features: string[];
  canAccess: string[];
  cannotAccess: string[];
  workflow: string[];
  afterEntry: string;
}

const ACCOUNTS: AccountDef[] = [
  {
    user: 'admin', pwd: '123456', label: '平台管理员', role: 'admin',
    icon: <DashboardOutlined />, color: '#1677ff', bg: '#e6f4ff',
    target: '/',
    desc: '全局运营管控、品牌资源调度、网络拓扑监控与开放接口管理，异常地址复核审计全流程',
    features: ['运营概览仪表盘', '品牌服务质量钻取', '网点吞吐拓扑图', 'API开放中心', '异常地址复核'],
    canAccess: ['全部 9 个功能模块', 'API 调用审计日志', '所有角色运单数据', '品牌增删与评级调整', '网点拓扑配置'],
    cannotAccess: ['快递员电子签收板', '用户个人包裹地图'],
    workflow: ['登录→运营概览', '查看异常地址预警卡片', '执行复核操作（确认/修正/正常）', '状态与处理人实时回写', '审计复查可追溯'],
    afterEntry: '进入后展示 4 大 Tab：运营概览 / 品牌质量 / 网络拓扑 / API中心，今日新单、时效达标率、异常包裹数实时呈现'
  },
  {
    user: 'user1', pwd: '123456', label: '普通用户（发件方）', role: 'user',
    icon: <ShoppingOutlined />, color: '#52c41a', bg: '#f6ffed',
    target: '/orders',
    desc: '包裹生命周期全链路跟踪、智能发件多维度比价、面单扫码一键录入与异常拦截',
    features: ['运单筛选追踪', '面单扫码/电商同步', '智能比价下单', '人脸核验签收', '异常地址拦截'],
    canAccess: ['运单管理（仅本人）', '智能发件·比价引擎', '品牌资源池查看', '快递员池查看', '异常事件推送接收'],
    cannotAccess: ['运营概览仪表盘', 'API 开放中心', '其他用户运单数据', '异常地址复核权', '品牌/网点配置'],
    workflow: ['登录→运单管理', '面单扫码/电商同步', '智能比价（价格+时效+覆盖）', '确认下单生成运单', '轨迹追踪·异常推送·签收核验'],
    afterEntry: '进入后展示运单统计卡：总运单 / 运输中 / 异常 / 未读推送，右侧抽屉串联生命周期 7 节点 + 轨迹时间轴'
  },
  {
    user: 'courier1', pwd: '123456', label: '品牌快递员', role: 'courier',
    icon: <TeamOutlined />, color: '#fa8c16', bg: '#fff7e6',
    target: '/couriers',
    desc: '待派单聚合与优先排序、上门时间协商、电子签收回传与投诉 SLA 8 小时响应',
    features: ['待派单聚合', '上门时间协商', 'Canvas 电子签收', '投诉 SLA 8h 倒计时', '复查异常记录'],
    canAccess: ['个人派件工作台', '待派单 / 派送中 / 已签收', '投诉工单响应', '电子签收回传板', '异常事件上报'],
    cannotAccess: ['运营概览仪表盘', 'API 开放中心', '品牌资源配置', '其他快递员派件数据', '异常地址复核权'],
    workflow: ['登录→快递员工作台', '待派单列表优先排序', '协商上门时间', '电子签收（Canvas）', '投诉 SLA 倒计时响应与复查'],
    afterEntry: '进入后展示 4 大标签页：待派单聚合 / 投诉响应 SLA / 电子签收回传 / 复查记录，工作台统计一目了然'
  },
];

const RULES_HINT = [
  { field: '用户名', rule: '字母/数字/下划线，2-20 字符', check: /^[a-zA-Z0-9_]{2,20}$/ },
  { field: '密码', rule: '至少 4 个字符，默认 123456', check: /^.{4,}$/ },
];

export default function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('idle');
  const [msg, setMsg] = useState('');
  const [detail, setDetail] = useState('');
  const [errCategory, setErrCategory] = useState<ErrorCategory | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form] = Form.useForm();
  const [jumpCountdown, setJumpCountdown] = useState<number | null>(null);
  const [nextJumpPath, setNextJumpPath] = useState<string>('/');
  const [nextRole, setNextRole] = useState<string>('');

  const go = (role: string) => {
    let path = '/';
    if (role === 'courier') path = '/couriers';
    else if (role === 'user') path = '/orders';
    window.location.href = path;
  };

  const classifyError = (err: any, username: string, password: string): { msg: string; detail: string; cat: ErrorCategory } => {
    const em = err?.message || err?.msg || String(err || '');
    const ec = err?.code || '';
    const innerMsg = err?.data?.message || err?.data?.msg || '';
    const combinedMsg = (em + ' ' + innerMsg).trim();

    if (!username?.trim() || !password?.trim()) {
      return { msg: '必填项不能为空', detail: `用户名和密码都是必填字段，请完整填写后重试。当前用户名长度：${username?.length || 0}，密码长度：${password?.length || 0}`, cat: 'empty' };
    }
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(username.trim())) {
      return { msg: '用户名格式不符合规则', detail: '仅支持字母、数字、下划线，长度 2-20 字符。请检查是否输入了中文、空格或其他特殊字符。', cat: 'format' };
    }
    if (password.length < 4) {
      return { msg: '密码长度不足', detail: '密码至少需要 4 个字符。默认演示密码为 123456。', cat: 'format' };
    }
    if (ec === 'ERR_NETWORK' || combinedMsg.includes('Network Error') || combinedMsg.includes('ECONNREFUSED') || combinedMsg.includes('网络') || combinedMsg.includes('connect ECONNREFUSED')) {
      return { msg: '后端服务连接失败', detail: `无法连接到后端 API（127.0.0.1:59219）。请确认后端服务已启动，可在浏览器访问 /api/health 检查健康状态。调试信息：${combinedMsg || ec}`, cat: 'network' };
    }
    if (combinedMsg.includes('用户名或密码错误') || combinedMsg.includes('INVALID_CREDENTIALS') || combinedMsg.includes('401') || ec === 'ERR_BAD_REQUEST') {
      const valid = ACCOUNTS.map(a => a.user).join(' / ');
      return { msg: '账号或密码验证未通过', detail: `用户名 "${username}" 与密码组合无法通过验证。可直接点击下方演示账号卡片一键填入。有效账号：${valid}，默认密码：123456。注意大小写和前后空格。服务器返回：${combinedMsg}`, cat: 'credential' };
    }
    if (combinedMsg.includes('请输入用户名和密码') || combinedMsg.includes('BAD_REQUEST') || combinedMsg.includes('400')) {
      return { msg: '请求参数校验失败', detail: `服务器返回：${combinedMsg || '参数不完整'}. 请完整填写用户名和密码。`, cat: 'empty' };
    }
    if (combinedMsg.includes('权限') || combinedMsg.includes('403') || combinedMsg.includes('FORBIDDEN') || combinedMsg.includes('role')) {
      return { msg: '账号权限与访问角色不匹配', detail: `当前账号不具备所请求角色的访问权限，请确认你使用的演示账号对应了正确的角色入口。服务端信息：${combinedMsg}`, cat: 'permission' };
    }
    if (combinedMsg.includes('500') || combinedMsg.includes('内部错误') || combinedMsg.includes('Internal Server Error')) {
      return { msg: '服务器内部错误', detail: `后端运行时异常：${combinedMsg}. 请查看后端日志定位堆栈。`, cat: 'server' };
    }
    if (ec === 'ECONNABORTED' || combinedMsg.includes('timeout') || combinedMsg.includes('超时')) {
      return { msg: '请求超时', detail: '后端在 30 秒内未响应，请稍后重试或检查后端健康状态。', cat: 'network' };
    }
    return { msg: '登录失败', detail: combinedMsg || ec || '未知错误，请重试或点击下方演示账号卡片快速进入。', cat: 'unknown' };
  };

  const doLogin = async (username: string, password: string) => {
    const preCheck = classifyError(null, username, password);
    if (preCheck.cat === 'empty' || preCheck.cat === 'format') {
      setStep('fail'); setMsg(preCheck.msg); setDetail(preCheck.detail); setErrCategory(preCheck.cat);
      return;
    }

    setStep('loading');
    setMsg('正在验证身份与加载权限范围...');
    setDetail(`正在调用 /api/auth/login，请求参数已准备完毕...`);
    setErrCategory(null);
    const t0 = Date.now();

    try {
      const res: any = await api.auth.login({ username: username.trim(), password });
      const elapsed = Date.now() - t0;

      if (!res?.token) {
        const c: ErrorCategory = 'server';
        setStep('fail'); setErrCategory(c);
        setMsg('服务器响应异常：未返回 token');
        setDetail(`登录接口 ${elapsed}ms 响应但缺少 token 字段。返回：${res ? Object.keys(res).join(', ') : '空'}`);
        return;
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user || {}));

      const role = res.user?.role || '';
      const name = res.user?.name || res.user?.username || username;
      const label = role === 'admin' ? '平台管理员' : role === 'courier' ? '品牌快递员' : '普通用户（发件方）';

      const targetPath = role === 'courier' ? '/couriers' : role === 'user' ? '/orders' : '/';
      const targetLabel = role === 'courier' ? '派件工作台' : role === 'user' ? '运单管理台' : '运营管理台';

      setStep('ok');
      setErrCategory(null);
      setJumpCountdown(3);
      setNextJumpPath(targetPath);
      setNextRole(role);
      setMsg(`✅ 身份确认通过！欢迎 ${name}（${label}） — 即将进入【${targetLabel}】`);
      setDetail(`Token 已持久化 · 角色定向 ${targetPath} · 耗时 ${elapsed}ms · 3 秒后自动跳转`);

      let sec = 3;
      const tickTimer = setInterval(() => {
        sec--;
        setJumpCountdown(sec);
        setDetail(`Token 已持久化 · 角色定向 ${targetPath} · 耗时 ${elapsed}ms · ${sec > 0 ? sec + ' 秒后自动跳转' : '正在跳转...'}`);
        if (sec <= 0) {
          clearInterval(tickTimer);
          try {
            window.location.href = targetPath;
          } catch (_e) {
            location.replace(targetPath);
          }
        }
      }, 1000);

      setTimeout(() => {
        if (sec > 0) {
          clearInterval(tickTimer);
          try { window.location.href = targetPath; } catch { location.replace(targetPath); }
        }
      }, 4000);

      setDetail(prev => prev + '（如未自动跳转，请点击下方「立即进入」）');

    } catch (err: any) {
      const elapsed = Date.now() - t0;
      const result = classifyError(err, username, password);
      result.detail += ` · 请求耗时 ${elapsed}ms`;
      setStep('fail');
      setMsg(result.msg);
      setDetail(result.detail);
      setErrCategory(result.cat);
    }
  };

  const statusIcon = step === 'ok' ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} /> :
                     step === 'fail' ? <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 20 }} /> :
                     step === 'loading' ? <Spin indicator={<LoadingOutlined style={{ fontSize: 20, color: '#1677ff' }} spin />} /> :
                     null;

  const statusBg = step === 'ok' ? '#f6ffed' : step === 'fail' ? '#fff2f0' : step === 'loading' ? '#e6f4ff' : '#fafafa';
  const statusBorder = step === 'ok' ? '#b7eb8f' : step === 'fail' ? '#ffccc7' : step === 'loading' ? '#91caff' : '#d9d9d9';

  const errorCatMeta: Record<ErrorCategory, { icon: React.ReactNode; color: string; label: string; suggestions: string[] }> = {
    empty:       { icon: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />, color: '#fa8c16', label: '必填项缺失', suggestions: ['补全用户名和密码后重试', '可直接点击下方演示账号卡片一键登录'] },
    format:      { icon: <InfoCircleOutlined style={{ color: '#1677ff' }} />,       color: '#1677ff', label: '格式校验失败', suggestions: ['用户名仅限字母/数字/下划线（2-20 字符）', '密码长度不低于 4 个字符'] },
    credential:  { icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,      color: '#ff4d4f', label: '凭据不匹配',   suggestions: ['确认使用正确的演示账号：admin / user1 / courier1', '默认密码均为 123456', '注意大小写和空格'] },
    permission:  { icon: <WarningOutlined style={{ color: '#722ed1' }} />,          color: '#722ed1', label: '权限边界不匹配', suggestions: ['确认账号角色与访问目标一致', '管理员账号仅对应 admin 入口'] },
    network:     { icon: <ExclamationCircleOutlined style={{ color: '#d48806' }} />, color: '#d48806', label: '网络连接异常', suggestions: ['确认后端服务（59219 端口）已启动', '可在终端执行健康检查 /api/health'] },
    server:      { icon: <ExclamationCircleOutlined style={{ color: '#cf1322' }} />, color: '#cf1322', label: '服务器异常',   suggestions: ['后端出现运行时错误', '请查看后端日志定位堆栈'] },
    unknown:     { icon: <InfoCircleOutlined style={{ color: '#8c8c8c' }} />,       color: '#8c8c8c', label: '未知错误',     suggestions: ['稍后重试', '如持续出现请联系管理员'] },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 50%, #003eb3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 1280, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 0, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* ========== 左侧品牌 + 能力展示 ========== */}
        <div style={{ padding: 40, background: 'linear-gradient(160deg, #001529 0%, #003a8c 100%)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(22,119,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GlobalOutlined style={{ fontSize: 24, color: '#69b1ff' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>快递全链路协同平台</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Express Open Platform · v2.0</div>
            </div>
          </div>

          <Title level={3} style={{ color: '#fff', marginBottom: 10 }}>连接 30+ 快递品牌<br />一站式智能物流协同</Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
            面向快递全链路协同的开放平台，覆盖快递员资源池、包裹生命周期跟踪、智能发件决策三大核心能力。
          </Paragraph>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { icon: <TeamOutlined style={{ fontSize: 18 }} />, t: '快递员资源池', d: '统一认证·服务评级' },
              { icon: <SafetyCertificateOutlined style={{ fontSize: 18 }} />, t: '30+ 品牌 API', d: '申通/中通/顺丰等' },
              { icon: <EnvironmentOutlined style={{ fontSize: 18 }} />, t: '实时地图追踪', d: '位置·倒计时·语音' },
              { icon: <ApiOutlined style={{ fontSize: 18 }} />, t: '开放接口中心', d: '电商/ERP 集成调用' },
            ].map((f, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#69b1ff', marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{f.t}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{f.d}</div>
              </div>
            ))}
          </div>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '16px 0 14px' }} />

          {/* 角色分流说明 */}
          <div style={{ fontSize: 13, marginBottom: 10, color: '#69b1ff', fontWeight: 600 }}>
            🏷️ 三类角色 · 权限边界分流
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { role: '管理员', color: '#1677ff', path: '运营仪表盘 → 异常复核 → 审计日志' },
              { role: '用户', color: '#52c41a', path: '运单列表 → 比价下单 → 轨迹追踪 → 签收核验' },
              { role: '快递员', color: '#fa8c16', path: '待派单聚合 → 上门协商 → 电子签收 → SLA 响应' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                <Tag color={r.color} style={{ margin: 0, fontSize: 11 }}>{r.role}工作台</Tag>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{r.path}</Text>
              </div>
            ))}
          </div>

          {/* 校验规则明示 */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.12)' }}>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
              <InfoCircleOutlined /> 输入校验规则（登录前可确认）
            </div>
            {RULES_HINT.map((r, i) => (
              <div key={i}>· <b style={{ color: 'rgba(255,255,255,0.65)' }}>{r.field}</b>：{r.rule}</div>
            ))}
          </div>
        </div>

        {/* ========== 右侧登录表单 + 三角色卡片 ========== */}
        <div style={{ padding: 36, display: 'flex', flexDirection: 'column', maxHeight: '100vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <Title level={3} style={{ margin: 0, marginBottom: 4 }}>账号登录</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                输入账号密码或点击下方演示账号卡片快速进入对应角色工作台
              </Text>
            </div>
            <Tooltip title="演示账号：admin / user1 / courier1，密码均为 123456">
              <Tag icon={<InfoCircleOutlined />} color="blue">规则提示</Tag>
            </Tooltip>
          </div>

          {/* 状态条（4 状态机） */}
          {step !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, marginBottom: 14, borderRadius: 10, border: `1px solid ${statusBorder}`, background: statusBg }}>
              {statusIcon}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: step === 'ok' ? '#389e0d' : step === 'fail' ? '#cf1322' : '#1677ff' }}>{msg}</div>
                {detail && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4, lineHeight: 1.6 }}>{detail}</div>}
                {step === 'ok' && jumpCountdown !== null && jumpCountdown > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#52c41a' }}>
                        <span>跳转进度</span>
                        <span>{jumpCountdown}s 后自动进入</span>
                      </div>
                      <div style={{ height: 6, background: '#f6ffed', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #95de64, #52c41a)',
                          width: `${Math.max(10, 100 - jumpCountdown * 30)}%`,
                          transition: 'width 0.7s ease',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={() => {
                        try { window.location.href = nextJumpPath; }
                        catch { location.replace(nextJumpPath); }
                      }}
                      style={{ fontWeight: 600 }}
                    >
                      立即进入 →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 错误分类建议 */}
          {step === 'fail' && errCategory && errorCatMeta[errCategory] && (
            <Alert
              type="error"
              showIcon
              icon={errorCatMeta[errCategory].icon}
              message={
                <Space>
                  <Tag color={errorCatMeta[errCategory].color} style={{ margin: 0 }}>
                    {errorCatMeta[errCategory].label}
                  </Tag>
                  <span style={{ fontWeight: 500 }}>{msg}</span>
                </Space>
              }
              description={
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div style={{ marginBottom: 4 }}><b>技术详情：</b>{detail}</div>
                  <div><b>建议处理：</b></div>
                  <ol style={{ margin: '4px 0 0 18px', padding: 0 }}>
                    {errorCatMeta[errCategory].suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  <div style={{ marginTop: 6 }}>
                    <b>快捷入口：</b>点击下方演示账号卡片可自动填入并完成登录。
                  </div>
                </div>
              }
              style={{ marginTop: 0, marginBottom: 14 }}
            />
          )}

          {/* 账号密码表单 */}
          <Form form={form} layout="vertical" onFinish={(v) => doLogin(v.username, v.password)} size="large" disabled={step === 'loading'}>
            <Form.Item
              name="username"
              label={
                <Space>
                  <span>用户名</span>
                  <Tooltip title="字母/数字/下划线，长度 2-20 字符">
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                  </Tooltip>
                </Space>
              }
              rules={[
                { required: true, message: '请输入用户名（必填项）' },
                { min: 2, max: 20, message: '用户名长度需在 2-20 字符之间' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字和下划线，不可含中文或特殊符号' }
              ]}
              validateStatus={errCategory === 'empty' || errCategory === 'format' ? 'error' : undefined}
              help={
                (errCategory === 'empty' || errCategory === 'format') ? detail :
                <Text type="secondary" style={{ fontSize: 11 }}>
                  演示账号：<Text code style={{ cursor: 'pointer' }} onClick={() => form.setFieldsValue({ username: 'admin' })}>admin</Text> /&nbsp;
                  <Text code style={{ cursor: 'pointer' }} onClick={() => form.setFieldsValue({ username: 'user1' })}>user1</Text> /&nbsp;
                  <Text code style={{ cursor: 'pointer' }} onClick={() => form.setFieldsValue({ username: 'courier1' })}>courier1</Text>
                  ，点击可快速填入
                </Text>
              }
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="password"
              label={
                <Space>
                  <span>密码</span>
                  <Tooltip title="至少 4 个字符，默认密码 123456">
                    <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                  </Tooltip>
                </Space>
              }
              rules={[
                { required: true, message: '请输入密码（必填项）' },
                { min: 4, message: '密码长度至少 4 个字符' }
              ]}
              validateStatus={errCategory === 'empty' || errCategory === 'format' || errCategory === 'credential' ? 'error' : undefined}
              help={
                errCategory === 'credential' ? <span style={{ color: '#ff4d4f' }}>账号或密码验证未通过，请检查后重试（默认密码：123456）</span> :
                <Text type="secondary" style={{ fontSize: 11 }}>
                  默认密码均为 <Text code style={{ cursor: 'pointer' }} onClick={() => form.setFieldsValue({ password: '123456' })}>123456</Text>，点击可快速填入
                </Text>
              }
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                iconRender={(v) => v ? <EyeOutlined onClick={() => setShowPwd(false)} /> : <EyeInvisibleOutlined onClick={() => setShowPwd(true)} />}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={step === 'loading'} style={{ height: 46, fontSize: 15, fontWeight: 600 }}>
              {step === 'loading' ? '正在验证身份与加载权限...' : '登 录 并 进 入 工 作 台'}
            </Button>
          </Form>

          <Divider style={{ margin: '20px 0 14px', color: '#bfbfbf', fontSize: 12 }}>
            三角色演示账号 · 点击卡片直接登录进入对应工作台
          </Divider>

          {/* 三角色入口卡片（含权限边界 + 闭环线索） */}
          {ACCOUNTS.map((a, i) => (
            <div
              key={i}
              onClick={() => { if (step !== 'loading') { setSelectedRole(a.role); doLogin(a.user, a.pwd); } }}
              style={{
                cursor: step === 'loading' ? 'not-allowed' : 'pointer',
                padding: 14, marginBottom: i < 2 ? 10 : 0,
                borderRadius: 12,
                border: `2px solid ${selectedRole === a.role ? a.color : step === 'loading' ? '#f0f0f0' : '#e5eaf1'}`,
                opacity: step === 'loading' ? 0.55 : 1,
                transition: 'all 0.2s', userSelect: 'none',
                background: selectedRole === a.role ? a.bg : '#fafafa',
                boxShadow: selectedRole === a.role ? `0 0 0 3px ${a.color}22` : 'none',
              }}
              onMouseEnter={e => { if (step !== 'loading' && selectedRole !== a.role) { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = a.color + '88'; } }}
              onMouseLeave={e => { if (selectedRole !== a.role) { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e5eaf1'; } }}
            >
              {/* 卡片头 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: a.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <Space size={6} wrap>
                    <Text strong style={{ fontSize: 15 }}>{a.label}</Text>
                    <Tag color={a.color} style={{ margin: 0, fontWeight: 600 }}>{a.user} / 123456</Tag>
                    <Tag icon={<ArrowRightOutlined />} color="geekblue" style={{ margin: 0 }}>
                      定向进入 → {a.target === '/' ? '运营管理台' : a.target === '/orders' ? '运单管理' : '快递员工作台'}
                    </Tag>
                  </Space>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, paddingLeft: 50, lineHeight: 1.6 }}>{a.desc}</div>

              {/* 功能标签 */}
              <div style={{ paddingLeft: 50, display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {a.features.map((f, fi) => (
                  <Tag key={fi} style={{ margin: 0, fontSize: 11, background: a.bg, color: a.color, border: 'none' }}>{f}</Tag>
                ))}
              </div>

              {/* 进入后的工作台承接线索 */}
              <div style={{ marginLeft: 50, padding: '10px 12px', background: '#fff', borderRadius: 8, border: `1px dashed ${a.color}55` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: a.color }}>🔍 进入后工作台承接</span>
                  <Tooltip title="登录进入后将看到的页面结构与核心数据">
                    <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
                  </Tooltip>
                </div>
                <div style={{ fontSize: 11, color: '#595959', lineHeight: 1.7 }}>{a.afterEntry}</div>
              </div>

              {/* 权限边界 + 闭环线索 */}
              <div style={{ marginLeft: 50, marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 10 }}>
                {/* 权限边界 */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 11 }} />
                    <span style={{ color: '#389e0d' }}>可访问范围</span>
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#595959', lineHeight: 1.7 }}>
                    {a.canAccess.map((c, ci) => <li key={ci}>{c}</li>)}
                  </ul>
                  <div style={{ fontSize: 11, fontWeight: 600, margin: '6px 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 11 }} />
                    <span style={{ color: '#cf1322' }}>权限边界</span>
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 11, color: '#8c8c8c', lineHeight: 1.7 }}>
                    {a.cannotAccess.map((c, ci) => <li key={ci}>{c}</li>)}
                  </ul>
                </div>

                {/* 典型闭环线索 */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ScanOutlined style={{ color: a.color, fontSize: 11 }} />
                    <span style={{ color: a.color }}>典型业务闭环</span>
                    <Tooltip title="此角色端到端可验收的一条完整操作链路">
                      <InfoCircleOutlined style={{ color: '#bfbfbf', fontSize: 11 }} />
                    </Tooltip>
                  </div>
                  <Steps
                    direction="vertical"
                    size="small"
                    current={a.workflow.length}
                    style={{ paddingLeft: 0 }}
                  >
                    {a.workflow.map((w, wi) => (
                      <Step key={wi} title={<span style={{ fontSize: 11, color: '#595959' }}>{w}</span>} />
                    ))}
                  </Steps>
                </div>
              </div>

              {/* 可确认线索底部 */}
              <div style={{ marginLeft: 50, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={4}>
                  <Tag icon={<LineChartOutlined />} color="default" style={{ margin: 0, fontSize: 11 }}>
                    可验收 · 端到端闭环
                  </Tag>
                </Space>
                <Button type="link" style={{ color: a.color, padding: 0, fontWeight: 600, fontSize: 13 }}>
                  {selectedRole === a.role && step === 'loading' ? '正在进入...' : selectedRole === a.role && step === 'ok' ? '进入成功 ✓' : `点击登录进入 ${a.label} →`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
