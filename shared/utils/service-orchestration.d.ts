import type { ServiceOrchestration, OrchestrationStep } from '../types';
export interface OrchestrationContext {
    citizenId: string;
    applicationId: string;
    serviceId: string;
    triggerData: Record<string, unknown>;
    executionHistory: {
        step: number;
        result: unknown;
        timestamp: string;
    }[];
    variables: Record<string, unknown>;
}
export interface OrchestrationResult {
    orchestrationId: string;
    success: boolean;
    completedSteps: number;
    totalSteps: number;
    results: Record<number, unknown>;
    errors: {
        step: number;
        message: string;
        code?: string;
    }[];
    executionTime: number;
}
export declare function getAllOrchestrations(): ServiceOrchestration[];
export declare function findOrchestrationsByTrigger(triggerType: string, serviceId?: string): ServiceOrchestration[];
export declare function executeOrchestration(orchestration: ServiceOrchestration, context: OrchestrationContext, stepExecutor: (step: OrchestrationStep, ctx: OrchestrationContext) => Promise<unknown>): Promise<OrchestrationResult>;
//# sourceMappingURL=service-orchestration.d.ts.map