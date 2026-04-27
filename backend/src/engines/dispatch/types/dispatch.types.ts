export type Location = {
  lng: number;
  lat: number;
};

export type MachineryCandidate = {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  operatorId: string;
  operatorName: string;
  creditScore: number;
  location: Location;
  distance: number;
  score: number;
};

export type DispatchRequest = {
  demandId: string;
  cropType: string;
  area: number;
  location: Location;
  startTime?: Date;
  endTime?: Date;
  requirements?: string;
};

export type DispatchResult = {
  demandId: string;
  candidates: MachineryCandidate[];
  recommended: MachineryCandidate;
};

export type DistanceMatrixResult = {
  origins: Location[];
  destinations: Location[];
  distances: number[][];
  durations: number[][];
};
