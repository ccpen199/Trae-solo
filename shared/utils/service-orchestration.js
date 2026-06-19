"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrchestrations = getAllOrchestrations;
exports.findOrchestrationsByTrigger = findOrchestrationsByTrigger;
exports.executeOrchestration = executeOrchestration;
const BUILTIN_ORCHESTRATIONS = [
    {
        id: 'newborn-auto-flow',
        name: '新生儿落户自动触发医保参保',
        version: '1.0.0',
        status: 'active',
        triggerEvent: {
            type: 'service-complete',
            serviceId: 'newborn-household'
        },
        steps: [
            {
                step: 1,
                name: '获取新生儿户籍信息',
                type: 'api-call',
                action: 'gaj.getCitizenInfo',
                params: { relation: '新生儿' },
                timeout: 5000,
                retryCount: 3,
                onFailure: 'stop'
            },
            {
                step: 2,
                name: '校验参保资格',
                type: 'api-call',
                action: 'ybj.checkInsuranceEligibility',
                params: { ageRange: '0-18', autoEnroll: true },
                timeout: 3000,
                retryCount: 2,
                onFailure: 'stop'
            },
            {
                step: 3,
                name: '自动发起参保登记',
                type: 'api-call',
                action: 'ybj.createInsuranceRegistration',
                params: { insuranceType: '居民医保', source: '新生儿自动登记' },
                timeout: 8000,
                retryCount: 3,
                onFailure: 'rollback'
            },
            {
                step: 4,
                name: '同步至社保系统',
                type: 'data-sync',
                action: 'syncToSocialSecurity',
                timeout: 10000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 5,
                name: '发送参保成功通知',
                type: 'notification',
                action: 'sendInsuranceSuccessNotice',
                params: { channels: ['push', 'sms', 'wechat'] },
                timeout: 3000,
                retryCount: 1,
                onFailure: 'continue'
            }
        ]
    },
    {
        id: 'retirement-auto-cert',
        name: '退休人员社保待遇自动认证',
        version: '1.0.0',
        status: 'active',
        triggerEvent: {
            type: 'time-based',
            cronExpression: '0 0 8 1 * *'
        },
        steps: [
            {
                step: 1,
                name: '筛选到期待认证人员',
                type: 'api-call',
                action: 'sbj.getPendingCertificationList',
                params: { period: 'quarterly' },
                timeout: 15000,
                retryCount: 2,
                onFailure: 'stop'
            },
            {
                step: 2,
                name: '查询医保报销记录',
                type: 'api-call',
                action: 'ybj.getRecentMedicalRecords',
                params: { days: 90 },
                timeout: 8000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 3,
                name: '大数据交叉核验',
                type: 'condition',
                action: 'crossVerifyLivingStatus',
                timeout: 5000,
                retryCount: 1,
                onFailure: 'continue'
            },
            {
                step: 4,
                name: '自动完成认证',
                type: 'api-call',
                action: 'sbj.completeCertification',
                params: { method: '大数据静默认证' },
                timeout: 5000,
                retryCount: 3,
                onFailure: 'stop'
            },
            {
                step: 5,
                name: '通知认证结果',
                type: 'notification',
                action: 'sendCertificationResult',
                timeout: 3000,
                retryCount: 1,
                onFailure: 'continue'
            }
        ]
    },
    {
        id: 'house-transfer-tax',
        name: '房产过户税费自动核算',
        version: '1.0.0',
        status: 'active',
        triggerEvent: {
            type: 'service-complete',
            serviceId: 'property-transfer-application'
        },
        steps: [
            {
                step: 1,
                name: '获取房屋评估信息',
                type: 'api-call',
                action: 'zrzyj.getPropertyAssessment',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'stop'
            },
            {
                step: 2,
                name: '查询首套房资格',
                type: 'api-call',
                action: 'zrzyj.checkFirstHouseQualification',
                timeout: 3000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 3,
                name: '核算契税',
                type: 'api-call',
                action: 'swj.calculateDeedTax',
                timeout: 4000,
                retryCount: 2,
                onFailure: 'stop'
            },
            {
                step: 4,
                name: '核算个人所得税',
                type: 'api-call',
                action: 'swj.calculateIncomeTax',
                timeout: 4000,
                retryCount: 2,
                onFailure: 'stop'
            },
            {
                step: 5,
                name: '生成缴费通知单',
                type: 'api-call',
                action: 'swj.generatePaymentNotice',
                timeout: 3000,
                retryCount: 3,
                onFailure: 'stop'
            },
            {
                step: 6,
                name: '推送缴费提醒',
                type: 'notification',
                action: 'sendTaxPaymentNotice',
                params: { channels: ['push', 'sms'] },
                timeout: 3000,
                retryCount: 1,
                onFailure: 'continue'
            }
        ]
    },
    {
        id: 'business-registration-flow',
        name: '企业开办一窗通全流程',
        version: '1.1.0',
        status: 'active',
        triggerEvent: {
            type: 'service-complete',
            serviceId: 'business-name-approval'
        },
        steps: [
            {
                step: 1,
                name: '工商注册登记',
                type: 'api-call',
                action: 'scjgj.businessRegistration',
                timeout: 10000,
                retryCount: 3,
                onFailure: 'stop'
            },
            {
                step: 2,
                name: '刻制公章备案',
                type: 'api-call',
                action: 'gaj.sealEngravingFiling',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 3,
                name: '申领发票',
                type: 'api-call',
                action: 'swj.applyInvoice',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 4,
                name: '社保单位登记',
                type: 'api-call',
                action: 'sbj.companySocialSecurityRegister',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 5,
                name: '公积金单位登记',
                type: 'api-call',
                action: 'gjj.companyHousingFundRegister',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 6,
                name: '银行预约开户',
                type: 'api-call',
                action: 'bank.reserveAccountOpening',
                timeout: 5000,
                retryCount: 2,
                onFailure: 'continue'
            },
            {
                step: 7,
                name: '开办完成通知',
                type: 'notification',
                action: 'sendBusinessCompletionNotice',
                params: { includeElink: true },
                timeout: 3000,
                retryCount: 1,
                onFailure: 'continue'
            }
        ]
    }
];
function getAllOrchestrations() {
    return BUILTIN_ORCHESTRATIONS;
}
function findOrchestrationsByTrigger(triggerType, serviceId) {
    return BUILTIN_ORCHESTRATIONS.filter(o => {
        if (o.status !== 'active')
            return false;
        if (o.triggerEvent.type !== triggerType)
            return false;
        if (serviceId && o.triggerEvent.serviceId !== serviceId)
            return false;
        return true;
    });
}
async function executeOrchestration(orchestration, context, stepExecutor) {
    const startTime = Date.now();
    const results = {};
    const errors = [];
    let completedSteps = 0;
    let shouldStop = false;
    for (const step of orchestration.steps) {
        if (shouldStop)
            break;
        try {
            const stepResult = await executeWithRetry(step, context, stepExecutor);
            results[step.step] = stepResult;
            context.executionHistory.push({
                step: step.step,
                result: stepResult,
                timestamp: new Date().toISOString()
            });
            if (stepResult && typeof stepResult === 'object' && 'variables' in stepResult) {
                Object.assign(context.variables, stepResult.variables);
            }
            completedSteps++;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({
                step: step.step,
                message: errorMessage,
                code: error instanceof Error && 'code' in error ? error.code : undefined
            });
            switch (step.onFailure) {
                case 'stop':
                    shouldStop = true;
                    break;
                case 'rollback':
                    await rollbackSteps(orchestration, completedSteps, context, stepExecutor);
                    shouldStop = true;
                    break;
                case 'continue':
                default:
                    break;
            }
        }
    }
    return {
        orchestrationId: orchestration.id,
        success: errors.length === 0 && completedSteps === orchestration.steps.length,
        completedSteps,
        totalSteps: orchestration.steps.length,
        results,
        errors,
        executionTime: Date.now() - startTime
    };
}
async function executeWithRetry(step, context, executor) {
    const maxRetries = step.retryCount || 0;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (step.timeout) {
                return await Promise.race([
                    executor(step, context),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Step ${step.step} timeout after ${step.timeout}ms`)), step.timeout))
                ]);
            }
            return await executor(step, context);
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}
async function rollbackSteps(orchestration, completedCount, context, executor) {
    const completedSteps = orchestration.steps
        .filter(s => s.step <= completedCount)
        .sort((a, b) => b.step - a.step);
    for (const step of completedSteps) {
        try {
            await executor({ ...step, action: `${step.action}:rollback`, step: -step.step }, context);
        }
        catch (e) {
            console.error(`Rollback failed for step ${step.step}:`, e);
        }
    }
}
//# sourceMappingURL=service-orchestration.js.map