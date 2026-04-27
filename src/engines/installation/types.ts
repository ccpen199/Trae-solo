import { 
  InstallationAssignmentContext, 
  InstallerInfo, 
  Address,
  InstallationItem,
  DifficultyLevel
} from '../../types';

export interface AssignmentInput {
  orderId: string;
  context: InstallationAssignmentContext;
  availableInstallers: InstallerInfo[];
  assignmentRules?: AssignmentRule[];
  optimizationStrategy?: OptimizationStrategy;
}

export type OptimizationStrategy = 
  | 'FASTEST_COMPLETION'
  | 'LOWEST_COST'
  | 'HIGHEST_RATING'
  | 'BALANCED_WORKLOAD'
  | 'CUSTOMER_PREFERENCE';

export interface AssignmentRule {
  id: string;
  name: string;
  type: AssignmentRuleType;
  priority: number;
  weight: number;
  conditions: AssignmentRuleCondition[];
  actions: AssignmentRuleAction[];
  isEnabled: boolean;
}

export type AssignmentRuleType = 
  | 'AREA_PREFERENCE'
  | 'SKILL_MATCH'
  | 'WORKLOAD_LIMIT'
  | 'RATING_THRESHOLD'
  | 'TIME_PREFERENCE'
  | 'DIFFICULTY_MATCH'
  | 'EQUIPMENT_REQUIREMENT'
  | 'CUSTOMER_HISTORY';

export interface AssignmentRuleCondition {
  field: string;
  operator: '>' | '>=' | '<' | '<=' | '==' | '!=' | 'in' | 'contains';
  value: any;
}

export interface AssignmentRuleAction {
  action: 'INCREASE_SCORE' | 'DECREASE_SCORE' | 'EXCLUDE' | 'SET_PREFERRED';
  parameters: Record<string, any>;
}

export interface AssignmentResult {
  orderId: string;
  success: boolean;
  primaryAssignment: AssignmentCandidate | null;
  backupAssignments: AssignmentCandidate[];
  scoreBreakdown: ScoreBreakdown[];
  metadata: AssignmentMetadata;
  warnings: string[];
}

export interface AssignmentCandidate {
  installerId: string;
  installerName: string;
  score: number;
  normalizedScore: number;
  rank: number;
  scheduledDate: Date;
  timeSlot: string;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  reasoning: string;
  scoreComponents: ScoreComponent[];
}

export interface ScoreComponent {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
}

export interface ScoreBreakdown {
  installerId: string;
  installerName: string;
  totalScore: number;
  components: ScoreComponent[];
}

export interface AssignmentMetadata {
  assignedAt: Date;
  engineVersion: string;
  optimizationStrategy: OptimizationStrategy;
  rulesApplied: string[];
  totalInstallersConsidered: number;
  totalTimeSlotsConsidered: number;
  calculationTimeMs: number;
}

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  constraints: TimeSlotConstraint[];
}

export interface TimeSlotConstraint {
  type: 'MAX_DISTANCE' | 'MIN_REST_TIME' | 'PEAK_HOUR' | 'EQUIPMENT';
  parameters: Record<string, any>;
}

export interface TravelInfo {
  fromAddress: Address;
  toAddress: Address;
  distance: number;
  distanceUnit: 'km' | 'm';
  estimatedTime: number;
  timeUnit: 'minutes' | 'hours';
  route: RoutePoint[];
}

export interface RoutePoint {
  address: string;
  longitude: number;
  latitude: number;
  arrivalTime: Date;
  departureTime: Date;
  orderId?: string;
}

export interface WorkloadInfo {
  installerId: string;
  currentDate: Date;
  assignedOrders: number;
  assignedDuration: number;
  maxDailyCapacity: number;
  maxWeeklyCapacity: number;
  remainingCapacity: number;
  utilizationRate: number;
}

export interface SkillMatchInfo {
  installerSkills: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

export interface DistanceMatrix {
  [installerId: string]: {
    [locationKey: string]: {
      distance: number;
      estimatedTime: number;
    };
  };
}

export interface AssignmentConstraint {
  type: 'TIME' | 'LOCATION' | 'SKILL' | 'WORKLOAD' | 'CUSTOMER';
  strictness: 'MUST' | 'SHOULD' | 'PREFER';
  parameters: Record<string, any>;
}

export interface AssignmentConflict {
  type: 'TIME_CONFLICT' | 'WORKLOAD_EXCEEDED' | 'SKILL_MISMATCH' | 'DISTANCE_EXCEEDED';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  installerId: string;
  affectedOrders: string[];
}

export interface AssignmentHistory {
  orderId: string;
  installerId: string;
  assignedAt: Date;
  completedAt?: Date;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  customerRating?: number;
  actualDuration?: number;
  notes?: string;
}

export interface InstallerScore {
  installerId: string;
  totalScore: number;
  breakdown: {
    availability: number;
    distance: number;
    skills: number;
    workload: number;
    rating: number;
    history: number;
    specialRequirements: number;
  };
}

export interface AssignmentOptimizationResult {
  bestAssignment: AssignmentCandidate | null;
  alternatives: AssignmentCandidate[];
  conflicts: AssignmentConflict[];
  optimizationDetails: {
    objective: string;
    constraintsApplied: string[];
    improvements: string[];
  };
}
