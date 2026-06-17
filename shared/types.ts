export type Species = "dog" | "cat";
export type Gender = "male" | "female";
export type Role = "user" | "vet" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  type: "vaccination" | "checkup" | "illness" | "surgery";
  date: string;
  description: string;
}

export interface Pet {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string;
  age: number;
  gender: Gender;
  personalityTags: string[];
  avatar: string;
  healthRecords: HealthRecord[];
  createdAt: string;
}

export type Emotion =
  | "happy"
  | "angry"
  | "hungry"
  | "anxious"
  | "curious"
  | "sleepy"
  | "playful"
  | "lonely";

export interface VoiceprintReport {
  frequency: number;
  duration: number;
  intensity: number;
  pattern: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected" | "resampled";

export interface VoiceprintAnalysis {
  id: string;
  petId: string;
  audioUrl: string;
  emotion: Emotion;
  emotionLabel: string;
  confidence: number;
  semanticText: string;
  voiceprintReport: VoiceprintReport;
  createdAt: string;
  isReverse?: boolean;
  reverseSource?: {
    ownerText: string;
    petSound: string;
    playedDuration?: number;
    played?: boolean;
    templateSource: "quick-phrase" | "manual-input";
    matchedKeyword?: string;
    soundPattern: {
      baseFreq: number;
      duration: number;
      intensity: number;
      pattern: string;
    };
    modelVersion: string;
    generatedAt: string;
  };
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  reviewHistory?: { status: ReviewStatus; note?: string; at: string; by?: string }[];
}

export type PhotoTag = "playing" | "eating" | "sleeping" | "walking" | "bathing";

export interface Photo {
  id: string;
  petId: string;
  imageUrl: string;
  thumbnailUrl: string;
  autoTags: PhotoTag[];
  userTags: string[];
  filterApplied: string | null;
  bubbleTemplate: string | null;
  bubbleText: string | null;
  createdAt: string;
  tagEvidence?: Partial<Record<PhotoTag, string>>;
  availableFilters?: string[];
  aiReport?: {
    tagConfidence: Partial<Record<PhotoTag, number>>;
    detectionObjects: string[];
    sceneDetection: string;
    emotionDetection: string;
    filterRecommendation: string;
    filterReason: string;
    bubbleTemplateSuggestion: string;
    bubbleTemplateReason: string;
    bubbleTextSuggestion: string;
    bubbleTextReason: string;
    modelVersion: string;
    processedAt: string;
  };
}

export type PostCategory = "knowledge" | "story" | "question" | "vet-article";

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isVetCertified: boolean;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
}

export type Severity = "mild" | "moderate" | "severe";

export interface Diagnosis {
  possibleConditions: string[];
  severity: Severity;
  suggestions: string[];
  recommendVisit: boolean;
}

export interface SymptomOption {
  label: string;
  nextNodeId: string | null;
}

export interface SymptomNode {
  id: string;
  question?: string;
  options: SymptomOption[];
  diagnosis?: Diagnosis;
}

export interface TrainingRecord {
  id: string;
  petId: string;
  userId: string;
  trainingType: string;
  date: string;
  duration: number;
  improvement: number;
  notes: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalSessions: number;
  totalDuration: number;
  averageImprovement: number;
  improvements: { category: string; score: number }[];
  suggestions: string[];
}

export type SampleStatus = "pending" | "auto-annotated" | "reviewed" | "rejected";

export interface VoiceprintSample {
  id: string;
  userId: string;
  userName: string;
  audioUrl: string;
  petType: Species;
  status: SampleStatus;
  autoAnnotation: string | null;
  finalAnnotation: string | null;
  submittedAt: string;
}

export type ModelStatus = "training" | "completed" | "deployed";

export interface ModelVersion {
  id: string;
  version: string;
  accuracy: number;
  trainingSamples: number;
  status: ModelStatus;
  createdAt: string;
}

export type ContentType = "text" | "image" | "post";

export interface ContentReviewItem {
  id: string;
  contentType: ContentType;
  content: string;
  status: ReviewStatus;
  flaggedReason: string[];
  submitterName: string;
  submittedAt: string;
}

export interface FeedingPlan {
  id: string;
  petName: string;
  dailyCalories: number;
  mealsPerDay: number;
  recommendedFoods: string[];
  avoidFoods: string[];
  supplements: string[];
}
