"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPES = exports.STORAGE_KEYS = exports.RATING_TAGS = exports.GOVERNMENT_DEPARTMENTS = exports.ZHENGZHOU_DISTRICTS = exports.SERVICE_CATEGORIES = exports.API_BASE_URL = void 0;
exports.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
exports.SERVICE_CATEGORIES = [
    { key: 'housing', name: '住房公积金', icon: '🏠', color: '#1890ff' },
    { key: 'social-security', name: '社会保障', icon: '🛡️', color: '#52c41a' },
    { key: 'education', name: '教育服务', icon: '📚', color: '#722ed1' },
    { key: 'medical', name: '医疗卫生', icon: '💊', color: '#f5222d' },
    { key: 'household', name: '户籍管理', icon: '📋', color: '#fa8c16' },
    { key: 'tax', name: '税务服务', icon: '💰', color: '#eb2f96' },
    { key: 'traffic', name: '交通出行', icon: '🚗', color: '#13c2c2' },
    { key: 'business', name: '企业开办', icon: '🏢', color: '#2f54eb' },
    { key: 'civil-affairs', name: '民政事务', icon: '❤️', color: '#ff4d4f' },
    { key: 'environment', name: '环保服务', icon: '🌿', color: '#a0d911' },
    { key: 'culture', name: '文化旅游', icon: '🎭', color: '#faad14' },
    { key: 'other', name: '其他事项', icon: '📌', color: '#8c8c8c' }
];
exports.ZHENGZHOU_DISTRICTS = [
    '中原区', '二七区', '管城区', '金水区', '上街区', '惠济区',
    '中牟县', '巩义市', '荥阳市', '新密市', '新郑市', '登封市',
    '郑州航空港经济综合实验区', '郑东新区', '郑州高新技术产业开发区', '郑州经济技术开发区'
];
exports.GOVERNMENT_DEPARTMENTS = [
    { code: 'gjj', name: '郑州住房公积金管理中心', category: 'housing' },
    { code: 'sbj', name: '郑州市人力资源和社会保障局', category: 'social-security' },
    { code: 'jyj', name: '郑州市教育局', category: 'education' },
    { code: 'wjw', name: '郑州市卫生健康委员会', category: 'medical' },
    { code: 'gaj', name: '郑州市公安局', category: 'household' },
    { code: 'swj', name: '国家税务总局郑州市税务局', category: 'tax' },
    { code: 'jtj', name: '郑州市交通运输局', category: 'traffic' },
    { code: 'scjgj', name: '郑州市市场监督管理局', category: 'business' },
    { code: 'mzj', name: '郑州市民政局', category: 'civil-affairs' },
    { code: 'hbj', name: '郑州市生态环境局', category: 'environment' },
    { code: 'wglj', name: '郑州市文化广电和旅游局', category: 'culture' },
    { code: 'dsj', name: '郑州市大数据管理局', category: 'other' },
    { code: 'zrzyj', name: '郑州市自然资源和规划局', category: 'housing' },
    { code: 'zfcgj', name: '郑州市城市管理局', category: 'other' },
    { code: 'nyj', name: '郑州市农业农村工作委员会', category: 'other' },
    { code: 'shuili', name: '郑州市水利局', category: 'other' },
    { code: 'linye', name: '郑州市林业局', category: 'environment' },
    { code: 'shbj', name: '郑州市社会保险中心', category: 'social-security' },
    { code: 'ybj', name: '郑州市医疗保障局', category: 'medical' },
    { code: 'tjj', name: '郑州市统计局', category: 'other' }
];
exports.RATING_TAGS = {
    positive: ['办事效率高', '服务态度好', '流程简单', '材料齐全', '指引清晰', '一次办好', '网上办理方便'],
    negative: ['办事效率低', '态度不好', '流程复杂', '材料过多', '指引不清', '多次跑趟', '系统故障', '电话打不通']
};
exports.STORAGE_KEYS = {
    USER_PROFILE: 'zz_gov_user_profile',
    USER_TOKEN: 'zz_gov_user_token',
    OFFLINE_PACKAGE: 'zz_gov_offline_package',
    ACCESSIBILITY_CONFIG: 'zz_gov_accessibility',
    RECENT_SERVICES: 'zz_gov_recent_services',
    FAVORITE_SERVICES: 'zz_gov_favorite_services',
    CACHED_PROOFS: 'zz_gov_cached_proofs',
    VIEWED_POLICIES: 'zz_gov_viewed_policies',
    BEHAVIOR_LOG: 'zz_gov_behavior_log'
};
exports.NOTIFICATION_TYPES = {
    ID_CARD_EXPIRY: 'id_card_expiry',
    DRIVER_LICENSE_EXPIRY: 'driver_license_expiry',
    SOCIAL_SECURITY_PAYMENT: 'social_security_payment',
    HOUSING_FUND_EXTRACTION: 'housing_fund_extraction',
    MEDICAL_INSPECTION: 'medical_inspection',
    CHILD_EDUCATION: 'child_education',
    TAX_DECLARATION: 'tax_declaration',
    LICENSE_RENEWAL: 'license_renewal',
    POLICY_MATCH: 'policy_match',
    SERVICE_REMINDER: 'service_reminder',
    APPLICATION_STATUS: 'application_status',
    WORK_ORDER_UPDATE: 'work_order_update'
};
//# sourceMappingURL=index.js.map