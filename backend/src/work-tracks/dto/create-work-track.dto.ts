export class CreateWorkTrackDto {
  orderId: string;
  startTime: string;
  endTime?: string;
  points?: TrackPointDto[];
}

export class TrackPointDto {
  lng: number;
  lat: number;
  speed?: number;
  timestamp: string;
}
