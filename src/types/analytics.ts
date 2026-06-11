export interface AnalyticsData {
  qualityTrend: {
    date: string;
    avgEdits: number;
    atsPassRate: number;
  }[];
  templateHeatmap: {
    templateId: string;
    templateName: string;
    industry: string;
    usageCount: number;
  }[];
  userActivity: {
    date: string;
    dau: number;
    mau: number;
    retention: number;
  }[];
}
