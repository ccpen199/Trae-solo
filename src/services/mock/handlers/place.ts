import { http, HttpResponse } from 'msw';
import {
  mockPlaces,
  successResponse,
  errorResponse,
} from '../data/mockData';
import type { Place, PlaceCreateParams, PlaceReviewParams } from '../../api/place';

let places = [...mockPlaces];

const placeTypeNames: Record<string, string> = {
  internet_cafe: '网吧',
  arcade: '游戏厅',
  ktv: 'KTV',
  other: '其他场所',
};

const placeStatusNames: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  closed: '已注销',
};

const issueOrgs = ['山东省消防救援总队', '济南市公安局', '青岛市公安局', '烟台市公安局', '淄博市公安局'];
const certNoPrefix: Record<string, string> = { fire: 'XF', security: 'ZA', business: 'YY' };

function generateCertificateDetails(placeId: string, placeStatus: string) {
  const types: Array<'fire' | 'security' | 'business'> = ['fire', 'security', 'business'];
  const typeNames: Record<string, string> = { fire: '消防许可证', security: '治安许可证', business: '营业执照' };

  return types.map((type) => {
    const hasCert = placeStatus === 'approved' || (placeStatus !== 'closed' && Math.random() > 0.2);
    const year = 2023 + Math.floor(Math.random() * 3);
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const expYear = year + 1;
    const statusRoll = Math.random();
    let certStatus: 'valid' | 'expiring_soon' | 'expired' | 'not_uploaded';
    if (!hasCert) {
      certStatus = 'not_uploaded';
    } else if (statusRoll < 0.6) {
      certStatus = 'valid';
    } else if (statusRoll < 0.8) {
      certStatus = 'expiring_soon';
    } else {
      certStatus = 'expired';
    }

    return {
      type,
      typeName: typeNames[type],
      certNo: hasCert ? `${certNoPrefix[type]}${year}${month}${day}${placeId.padStart(4, '0')}` : '',
      issueOrg: hasCert ? issueOrgs[Math.floor(Math.random() * issueOrgs.length)] : '',
      issueDate: hasCert ? `${year}-${month}-${day}` : '',
      expiryDate: hasCert ? `${expYear}-${month}-${day}` : '',
      url: hasCert ? `https://picsum.photos/400/300?random=${type}${placeId}` : '',
      name: hasCert ? `${typeNames[type]}_${placeId}.jpg` : '',
      status: certStatus,
    };
  });
}

function generateAuditRecords(placeId: string, placeStatus: string) {
  const records: Array<{
    id: string;
    action: 'submit' | 'material_review' | 'site_inspection' | 'approve' | 'reject' | 'revoke' | 'edit' | 'supplement';
    actionName: string;
    operator: string;
    remark?: string;
    attachments?: string[];
    result?: 'approved' | 'rejected' | 'supplement_required';
    time: string;
  }> = [];

  const operators = ['张审核', '李审查', '王核查', '赵主管', '刘管理'];
  const now = new Date();

  records.push({
    id: `${placeId}-a1`,
    action: 'submit',
    actionName: '提交备案',
    operator: '场所管理员',
    remark: '首次提交场所备案申请',
    time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  });

  records.push({
    id: `${placeId}-a2`,
    action: 'material_review',
    actionName: '材料审查',
    operator: operators[0],
    remark: placeStatus === 'rejected' ? '材料不完整，缺少消防许可证明' : '材料齐全，审查通过',
    result: placeStatus === 'rejected' ? 'supplement_required' : 'approved',
    attachments: placeStatus !== 'rejected' ? [`审查报告_${placeId}.pdf`] : undefined,
    time: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  });

  if (placeStatus === 'rejected') {
    records.push({
      id: `${placeId}-a3`,
      action: 'supplement',
      actionName: '补充材料',
      operator: '场所管理员',
      remark: '已补充消防许可证扫描件',
      attachments: ['消防许可证补充.pdf'],
      time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    });
  }

  records.push({
    id: `${placeId}-a4`,
    action: 'site_inspection',
    actionName: '现场核查',
    operator: operators[1],
    remark: placeStatus === 'approved' ? '现场核查合格，消防设施齐全，安全出口畅通' : '现场核查发现消防通道被占用，需整改',
    result: placeStatus === 'approved' ? 'approved' : 'rejected',
    attachments: [`现场核查照片_${placeId}.jpg`, `核查报告_${placeId}.pdf`],
    time: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  });

  if (placeStatus === 'approved') {
    records.push({
      id: `${placeId}-a5`,
      action: 'approve',
      actionName: '审核通过',
      operator: operators[2],
      remark: '审核通过，准予备案',
      result: 'approved',
      time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    });
  }

  if (placeStatus === 'rejected') {
    records.push({
      id: `${placeId}-a5`,
      action: 'reject',
      actionName: '审核驳回',
      operator: operators[2],
      remark: '消防通道不畅通，安全出口标识不清晰，需整改后重新提交',
      result: 'rejected',
      time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    });
  }

  return records;
}

function generateRectificationRecords(placeId: string, placeStatus: string) {
  if (placeStatus === 'approved' && Math.random() > 0.4) return [];
  if (placeStatus === 'closed') return [];

  const sources: Array<{ source: 'audit_reject' | 'inspection' | 'alarm'; sourceName: string }> = [
    { source: 'audit_reject', sourceName: '审核驳回' },
    { source: 'inspection', sourceName: '巡检发现' },
    { source: 'alarm', sourceName: '告警联动' },
  ];
  const picked = sources[Math.floor(Math.random() * sources.length)];

  const statuses: Array<'pending' | 'submitted' | 'recheck_passed' | 'recheck_failed'> = ['pending', 'submitted', 'recheck_passed', 'recheck_failed'];
  const statusNames: Record<string, string> = { pending: '待整改', submitted: '已提交', recheck_passed: '复查通过', recheck_failed: '复查不通过' };
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const now = new Date();
  const record: {
    id: string;
    source: 'audit_reject' | 'inspection' | 'alarm';
    sourceName: string;
    content: string;
    requirement: string;
    deadline: string;
    status: 'pending' | 'submitted' | 'recheck_passed' | 'recheck_failed';
    statusName: string;
    submitMaterial?: { photos: string[]; description: string; submitTime: string };
    recheckRecord?: { rechecker: string; recheckTime: string; result: 'passed' | 'failed'; opinion: string };
    createdAt: string;
  } = {
    id: `rect-${placeId}`,
    source: picked.source,
    sourceName: picked.sourceName,
    content: picked.source === 'audit_reject'
      ? '消防通道被占用，安全出口标识不清晰'
      : picked.source === 'inspection'
        ? '灭火器过期未更换，应急照明设施损坏'
        : '烟雾探测器报警未及时处理',
    requirement: '请在规定期限内完成整改，确保消防设施正常运行',
    deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status,
    statusName: statusNames[status],
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
  };

  if (status === 'submitted' || status === 'recheck_passed' || status === 'recheck_failed') {
    record.submitMaterial = {
      photos: [`整改照片1_${placeId}.jpg`, `整改照片2_${placeId}.jpg`],
      description: '已完成整改，消防通道已清理，安全出口标识已更换，灭火器已更新',
      submitTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    };
  }

  if (status === 'recheck_passed' || status === 'recheck_failed') {
    record.recheckRecord = {
      rechecker: '赵主管',
      recheckTime: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
      result: status === 'recheck_passed' ? 'passed' : 'failed',
      opinion: status === 'recheck_passed' ? '整改到位，复查通过' : '整改不到位，需继续整改',
    };
  }

  return [record];
}

function generateChangeRecords(placeId: string) {
  if (Math.random() > 0.5) return [];
  const now = new Date();
  return [
    {
      id: `chg-${placeId}-1`,
      field: 'phone',
      fieldName: '联系电话',
      oldValue: '138****1234',
      newValue: '139****5678',
      operator: '场所管理员',
      time: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    },
    {
      id: `chg-${placeId}-2`,
      field: 'businessHours',
      fieldName: '营业时间',
      oldValue: '08:00-22:00',
      newValue: '09:00-23:00',
      operator: '场所管理员',
      time: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    },
  ];
}

function enrichPlace(place: any): Place {
  const certificateDetails = generateCertificateDetails(place.id, place.status);
  const auditRecords = generateAuditRecords(place.id, place.status);
  const rectificationRecords = generateRectificationRecords(place.id, place.status);
  const changeRecords = generateChangeRecords(place.id);

  const fireCert = certificateDetails.find(c => c.type === 'fire');
  const securityCert = certificateDetails.find(c => c.type === 'security');

  const rectStatusList = rectificationRecords.map(r => r.status);
  let rectificationStatus: 'none' | 'pending' | 'submitted' | 'recheck_passed' | 'recheck_failed' = 'none';
  if (rectStatusList.includes('pending')) rectificationStatus = 'pending';
  else if (rectStatusList.includes('submitted')) rectificationStatus = 'submitted';
  else if (rectStatusList.includes('recheck_failed')) rectificationStatus = 'recheck_failed';
  else if (rectStatusList.includes('recheck_passed')) rectificationStatus = 'recheck_passed';

  const lastAuditTime = auditRecords.length > 0
    ? auditRecords[auditRecords.length - 1].time
    : undefined;

  return {
    ...place,
    certificates: certificateDetails.filter(c => c.status !== 'not_uploaded').map(c => ({
      type: c.type,
      typeName: c.typeName,
      url: c.url,
      name: c.name,
    })),
    certificateDetails,
    auditRecords,
    rectificationRecords,
    changeRecords,
    fireLicenseStatus: fireCert?.status || 'not_uploaded',
    securityLicenseStatus: securityCert?.status || 'not_uploaded',
    lastAuditTime,
    rectificationStatus,
  };
}

enrichPlace(places[0]);

export const placeHandlers = [
  http.get('/api/place/list', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const name = url.searchParams.get('name') || '';
    const type = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const city = url.searchParams.get('city') || '';
    const fireLicenseStatus = url.searchParams.get('fireLicenseStatus') || '';
    const securityLicenseStatus = url.searchParams.get('securityLicenseStatus') || '';
    const rectificationStatus = url.searchParams.get('rectificationStatus') || '';

    let filtered = [...places];

    if (name) {
      filtered = filtered.filter((p) => p.name.includes(name));
    }
    if (type) {
      filtered = filtered.filter((p) => p.type === type);
    }
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }
    if (city) {
      filtered = filtered.filter((p) => p.city.includes(city));
    }

    const enriched = filtered.map(enrichPlace);

    if (fireLicenseStatus) {
      const result = enriched.filter((p) => p.fireLicenseStatus === fireLicenseStatus);
      filtered.splice(0, filtered.length, ...result.map((_, i) => filtered[enriched.indexOf(result[i])]).filter(Boolean));
    }
    if (securityLicenseStatus) {
      const result = enriched.filter((p) => p.securityLicenseStatus === securityLicenseStatus);
      filtered.splice(0, filtered.length, ...result.map((_, i) => filtered[enriched.indexOf(result[i])]).filter(Boolean));
    }
    if (rectificationStatus) {
      const result = enriched.filter((p) => p.rectificationStatus === rectificationStatus);
      filtered.splice(0, filtered.length, ...result.map((_, i) => filtered[enriched.indexOf(result[i])]).filter(Boolean));
    }

    const finalList = (fireLicenseStatus || securityLicenseStatus || rectificationStatus)
      ? enriched.filter((p) => {
          if (fireLicenseStatus && p.fireLicenseStatus !== fireLicenseStatus) return false;
          if (securityLicenseStatus && p.securityLicenseStatus !== securityLicenseStatus) return false;
          if (rectificationStatus && p.rectificationStatus !== rectificationStatus) return false;
          return true;
        })
      : enriched;

    const start = (page - 1) * pageSize;
    const list = finalList.slice(start, start + pageSize);

    return HttpResponse.json(
      successResponse({
        list,
        total: finalList.length,
        page,
        pageSize,
      })
    );
  }),

  http.get('/api/place/:id', ({ params }) => {
    const { id } = params;
    const place = places.find((p) => p.id === id);

    if (!place) {
      return HttpResponse.json(errorResponse(404, '场所不存在'));
    }

    return HttpResponse.json(successResponse(enrichPlace(place)));
  }),

  http.post('/api/place', async ({ request }) => {
    const body = (await request.json()) as PlaceCreateParams;

    const newPlace: Place = {
      id: String(places.length + 1),
      ...body,
      typeName: placeTypeNames[body.type] || '其他场所',
      currentCount: 0,
      auditRecords: [],
      rectificationRecords: [],
      changeRecords: [],
      certificateDetails: body.certificateDetails || [],
      fireLicenseStatus: 'not_uploaded',
      securityLicenseStatus: 'not_uploaded',
      rectificationStatus: 'none',
      status: 'pending',
      statusName: '待审核',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    places.unshift(newPlace);

    return HttpResponse.json(successResponse(newPlace, '创建成功'));
  }),

  http.put('/api/place/:id', async ({ request, params }) => {
    const { id } = params;
    const body = await request.json();
    const index = places.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '场所不存在'));
    }

    const updated = {
      ...places[index],
      ...body,
      typeName: (body as any).type ? placeTypeNames[(body as any).type] : places[index].typeName,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    places[index] = updated;

    return HttpResponse.json(successResponse(updated, '更新成功'));
  }),

  http.delete('/api/place/:id', ({ params }) => {
    const { id } = params;
    const index = places.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '场所不存在'));
    }

    places.splice(index, 1);

    return HttpResponse.json(successResponse(null, '删除成功'));
  }),

  http.post('/api/place/review', async ({ request }) => {
    const body = (await request.json()) as PlaceReviewParams;
    const { id, status, reason } = body;

    const index = places.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '场所不存在'));
    }

    const updated = {
      ...places[index],
      status,
      statusName: placeStatusNames[status],
      approvedAt: status === 'approved'
        ? new Date().toISOString().replace('T', ' ').substring(0, 19)
        : undefined,
      approvedBy: status === 'approved' ? '系统管理员' : undefined,
      rejectReason: status === 'rejected' ? reason : undefined,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    places[index] = updated;

    return HttpResponse.json(successResponse(updated, '审核完成'));
  }),

  http.post('/api/place/revoke', async ({ request }) => {
    const body = (await request.json()) as { id: string; reason: string };
    const { id, reason } = body;
    const index = places.findIndex((p) => p.id === id);

    if (index === -1) {
      return HttpResponse.json(errorResponse(404, '场所不存在'));
    }

    const updated: typeof places[number] = {
      ...places[index],
      status: 'closed' as const,
      statusName: '已注销',
      rejectReason: reason,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    places[index] = updated;

    return HttpResponse.json(successResponse(updated, '注销成功'));
  }),

  http.post('/api/place/batch-review', async ({ request }) => {
    const body = (await request.json()) as { ids: string[]; status: 'approved' | 'rejected'; reason?: string };
    const { ids, status, reason } = body;

    ids.forEach(id => {
      const index = places.findIndex((p) => p.id === id);
      if (index !== -1) {
        places[index] = {
          ...places[index],
          status,
          statusName: placeStatusNames[status],
          approvedAt: status === 'approved' ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
          approvedBy: status === 'approved' ? '系统管理员' : undefined,
          rejectReason: status === 'rejected' ? reason : undefined,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
      }
    });

    return HttpResponse.json(successResponse(null, '批量审核完成'));
  }),

  http.post('/api/place/batch-urge', async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    return HttpResponse.json(successResponse(null, `已催报 ${body.ids.length} 个场所`));
  }),

  http.post('/api/place/rectification/recheck', async () => {
    return HttpResponse.json(successResponse(null, '复查结果已提交'));
  }),

  http.get('/api/place/statistics', () => {
    const stats = {
      total: places.length,
      pending: places.filter((p) => p.status === 'pending').length,
      approved: places.filter((p) => p.status === 'approved').length,
      rejected: places.filter((p) => p.status === 'rejected').length,
      closed: places.filter((p) => p.status === 'closed').length,
      internet_cafe: places.filter((p) => p.type === 'internet_cafe').length,
      arcade: places.filter((p) => p.type === 'arcade').length,
      ktv: places.filter((p) => p.type === 'ktv').length,
      other: places.filter((p) => p.type === 'other').length,
    };

    return HttpResponse.json(successResponse(stats));
  }),
];
