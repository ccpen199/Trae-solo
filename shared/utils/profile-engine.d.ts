import type { CitizenProfile, CitizenTag, BehaviorStats, ServicePreferences } from '../types';
export declare function generateCitizenTags(profile: CitizenProfile): CitizenTag[];
export declare function recommendPersonalizedServices(profile: CitizenProfile): string[];
export declare function generateReminders(profile: CitizenProfile): {
    type: string;
    title: string;
    content: string;
    priority: string;
}[];
export declare function updateBehaviorStats(current: BehaviorStats, action: {
    type: 'service' | 'click' | 'payment';
    key: string;
    success?: boolean;
}): BehaviorStats;
export declare function mergePreferences(current: ServicePreferences, updates: Partial<ServicePreferences>): ServicePreferences;
//# sourceMappingURL=profile-engine.d.ts.map