export class CreateDemandDto {
  cropType: string;
  area: number;
  locationLng: number;
  locationLat: number;
  address: string;
  startTime: string;
  endTime: string;
  requirements?: string;
  expectedPrice?: number;
  machineryType: string;
  billingMode?: string;
  pricePerUnit?: number;
  totalPrice?: number;
}

export class UpdateDemandDto {
  cropType?: string;
  area?: number;
  locationLng?: number;
  locationLat?: number;
  address?: string;
  startTime?: string;
  endTime?: string;
  requirements?: string;
  expectedPrice?: number;
  machineryType?: string;
  billingMode?: string;
  pricePerUnit?: number;
  totalPrice?: number;
}
