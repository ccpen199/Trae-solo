export class CreateOrderDto {
  demandId: string;
  machineryId: string;
  operatorId: string;
  estimatedPrice?: number;
  notes?: string;
}

export class TrackPointDto {
  lng: number;
  lat: number;
  speed?: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
}
