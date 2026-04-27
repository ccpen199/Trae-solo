export type TrackPoint = {
  lng: number;
  lat: number;
  timestamp: Date;
  speed?: number;
  altitude?: number;
  accuracy?: number;
};

export type VerifyRequest = {
  orderId: string;
  tracks: TrackPoint[];
  expectedArea: number;
  location: {
    lng: number;
    lat: number;
  };
};

export type VerifyResult = {
  valid: boolean;
  confidence: number;
  actualArea: number;
  actualDuration: number;
  issues: VerifyIssue[];
  details: VerifyDetails;
};

export type VerifyIssue = {
  type: 'area_mismatch' | 'location_mismatch' | 'speed_anomaly' | 'gap_detected';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: Record<string, unknown>;
};

export type VerifyDetails = {
  areaRatio: number;
  locationCoverage: number;
  speedAverage: number;
  trackCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
};
