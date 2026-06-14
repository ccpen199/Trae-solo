import { http, HttpResponse } from 'msw';
import {
  mockVerifications,
  successResponse,
  errorResponse,
  mockPlaces,
} from '../data/mockData';
import type {
  VerificationRecord,
  RealNameVerifyParams,
  RealNameVerifyResult,
  LiveVerifyParams,
  LiveVerifyResult,
  MinorInterceptRecord,
  MinorInterceptHandleParams,
} from '../../api/verification';

let verifications = [...mockVerifications];
let minorIntercepts: MinorInterceptRecord[] = [];

const verificationTypeNames: Record<string, string> = {
  id_card: '身份证核验',
  face: '人脸核验',
  ticket: '门票核验',
  terminal: '终端核验',
  manual: '人工核验',
};

const verificationStatusNames: Record<string, string> = {
  success: '核验成功',
  failed: '核验失败',
  pending: '核验中',
};

const verifyMethodNames: Record<string, string> = {
  terminal: '终端',
  manual: '人工',
};

const compareSourceNames: Record<string, string> = {
  police: '公安人口库',
  local: '本地数据库',
};

const minorInterceptStatusNames: Record<string, string> = {
  discovered: '已发现',
  notified: '已通知',
  picked_up: '已接回',
  police_involved: '公安介入',
  closed: '已关闭',
};

const handleResultNames: Record<string, string> = {
  guardian_pickup: '监护人带走',
  police_involved: '公安介入',
  other: '其他',
};

export const verificationHandlers = [
  http.get('/api/verification/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const placeId = url.searchParams.get('placeId') || '';
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = [...verifications];

    if (placeId) filtered = filtered.filter((v) => v.placeId === placeId);
    if (type) filtered = filtered.filter((v) => v.type === type);
    if (status) filtered = filtered.filter((v) => v.status === status);
    if (startDate) filtered = filtered.filter((v) => v.verifyTime >= startDate);
    if (endDate) filtered = filtered.filter((v) => v.verifyTime <= endDate + ' 23:59:59');
    if (keyword) {
      filtered = filtered.filter(
        (v) => v.name.includes(keyword) || v.idCard.includes(keyword) || v.phone.includes(keyword)
      );
    }

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(successResponse({ list, total: filtered.length, page, pageSize }));
  }),

  http.get('/api/verification/:id', ({ params }) => {
    const { id } = params;
    const record = verifications.find((v) => v.id === id);
    if (!record) return HttpResponse.json(errorResponse(404, '核验记录不存在'));
    return HttpResponse.json(successResponse(record));
  }),

  http.post('/api/verification/verify', async ({ request }) => {
    const body = (await request.json()) as RealNameVerifyParams;
    const { placeId, type, name, idCard, phone } = body;
    const place = mockPlaces.find((p) => p.id === placeId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const success = Math.random() > 0.1;
    const isMinor = Math.random() > 0.85;

    const newRecord: VerificationRecord = {
      id: crypto.randomUUID(),
      placeId,
      placeName: place?.name || '未知场所',
      type,
      typeName: verificationTypeNames[type],
      name,
      idCard,
      phone: phone || '',
      status: success ? 'success' : 'failed',
      statusName: success ? '核验成功' : '核验失败',
      verifyTime: now,
      operator: '系统管理员',
      verifyMethod: type === 'face' ? 'terminal' : 'manual',
      verifyMethodName: type === 'face' ? '终端' : '人工',
      compareSource: 'police',
      compareSourceName: '公安人口库',
      confidence: success ? Math.floor(Math.random() * 10 + 88) : Math.floor(Math.random() * 30 + 20),
      interceptResult: isMinor ? '未成年人拦截' : (success ? '放行' : '标记异常'),
      isMinor,
    };

    verifications.unshift(newRecord);

    let interceptRecordId: string | undefined;
    if (isMinor && success) {
      const interceptRecord: MinorInterceptRecord = {
        id: crypto.randomUUID(),
        verificationId: newRecord.id,
        placeId,
        placeName: place?.name || '未知场所',
        minorName: name,
        minorIdCard: idCard,
        minorAge: Math.floor(Math.random() * 4 + 14),
        discoverTime: now,
        discoverer: '系统管理员',
        status: 'discovered',
        statusName: '已发现',
      };
      minorIntercepts.unshift(interceptRecord);
      interceptRecordId = interceptRecord.id;
    }

    const result: RealNameVerifyResult = {
      success,
      message: success ? '核验通过' : '核验失败，请检查信息是否正确',
      recordId: newRecord.id,
      verifyTime: now,
      matchResult: success ? 'matched' : 'unmatched',
      confidence: newRecord.confidence,
      compareSource: 'police',
      comparePhoto: `https://picsum.photos/200/200?random=${Date.now()}`,
      isMinor,
      interceptRecordId,
    };

    return HttpResponse.json(successResponse(result, success ? '核验成功' : '核验失败'));
  }),

  http.post('/api/verification/live-verify', async ({ request }) => {
    const body = (await request.json()) as LiveVerifyParams;
    const { placeId, name, idCard } = body;
    const place = mockPlaces.find((p) => p.id === placeId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const isMatch = Math.random() > 0.15;
    const confidence = isMatch ? Math.floor(Math.random() * 10 + 88) : Math.floor(Math.random() * 30 + 20);
    const isMinor = Math.random() > 0.85;

    const newRecord: VerificationRecord = {
      id: crypto.randomUUID(),
      placeId,
      placeName: place?.name || '未知场所',
      type: 'id_card',
      typeName: '身份证核验',
      name,
      idCard,
      phone: body.phone || '',
      status: isMatch ? 'success' : 'failed',
      statusName: isMatch ? '核验成功' : '核验失败',
      verifyTime: now,
      operator: '系统管理员',
      verifyMethod: body.cardReader ? 'terminal' : 'manual',
      verifyMethodName: body.cardReader ? '终端' : '人工',
      compareSource: 'police',
      compareSourceName: '公安人口库',
      confidence,
      interceptResult: isMinor ? '未成年人拦截' : (isMatch ? '放行' : '标记异常'),
      isMinor,
    };

    verifications.unshift(newRecord);

    let interceptRecordId: string | undefined;
    if (isMinor && isMatch) {
      const interceptRecord: MinorInterceptRecord = {
        id: crypto.randomUUID(),
        verificationId: newRecord.id,
        placeId,
        placeName: place?.name || '未知场所',
        minorName: name,
        minorIdCard: idCard,
        minorAge: Math.floor(Math.random() * 4 + 14),
        discoverTime: now,
        discoverer: '系统管理员',
        status: 'discovered',
        statusName: '已发现',
      };
      minorIntercepts.unshift(interceptRecord);
      interceptRecordId = interceptRecord.id;
    }

    const result: LiveVerifyResult = {
      step: 3,
      matchResult: isMatch ? 'matched' : 'unmatched',
      confidence,
      compareSource: 'police',
      comparePhoto: `https://picsum.photos/200/200?random=${Date.now()}`,
      verifyTime: now,
      isMinor,
      interceptRecordId,
      recordId: newRecord.id,
    };

    return HttpResponse.json(successResponse(result));
  }),

  http.get('/api/verification/statistics', () => {
    const total = verifications.length;
    const successCount = verifications.filter((v) => v.status === 'success').length;
    const minorCount = verifications.filter((v) => v.isMinor).length;
    const passRate = total > 0 ? Number(((successCount / total) * 100).toFixed(1)) : 0;
    const todayTotal = Math.floor(total * 0.15);
    const todaySuccess = Math.floor(successCount * 0.15);
    const todayMinor = Math.floor(minorCount * 0.15);

    return HttpResponse.json(successResponse({
      total,
      success: successCount,
      failed: verifications.filter((v) => v.status === 'failed').length,
      pending: verifications.filter((v) => v.status === 'pending').length,
      passRate,
      minorInterceptCount: minorCount,
      todayTotal,
      todayPassRate: todayTotal > 0 ? Number(((todaySuccess / todayTotal) * 100).toFixed(1)) : 0,
      todayMinorIntercept: todayMinor,
    }));
  }),

  http.post('/api/verification/export', () => {
    return HttpResponse.json(
      successResponse('https://example.com/export/verification-' + Date.now() + '.xlsx', '导出成功')
    );
  }),

  http.get('/api/verification/minor-intercept/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status') || '';

    let filtered = [...minorIntercepts];
    if (status) filtered = filtered.filter((r) => r.status === status);

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return HttpResponse.json(successResponse({ list, total: filtered.length }));
  }),

  http.post('/api/verification/minor-intercept/handle', async ({ request }) => {
    const body = (await request.json()) as MinorInterceptHandleParams;
    const { id, handleResult, handleRemark, handlePhotos, guardianName, guardianPhone } = body;
    const index = minorIntercepts.findIndex((r) => r.id === id);
    if (index === -1) return HttpResponse.json(errorResponse(404, '拦截记录不存在'));

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let newStatus: MinorInterceptRecord['status'] = 'closed';

    if (handleResult === 'guardian_pickup') {
      newStatus = 'picked_up';
    } else if (handleResult === 'police_involved') {
      newStatus = 'police_involved';
    }

    const updated = {
      ...minorIntercepts[index],
      status: newStatus,
      statusName: minorInterceptStatusNames[newStatus],
      handleResult,
      handleResultName: handleResultNames[handleResult],
      handleRemark,
      handlePhotos,
      guardianName,
      guardianPhone,
      closeTime: now,
      closedBy: '系统管理员',
    };

    minorIntercepts[index] = updated;
    return HttpResponse.json(successResponse(updated, '处置成功'));
  }),
];
