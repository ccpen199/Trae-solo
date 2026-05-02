export class CreateRepairOrderDto {
  machineryId: string;
  faultType: string;
  faultDescription: string;
  locationLng: number;
  locationLat: number;
  locationAddress?: string;
  contactPhone: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class AssignRepairOrderDto {
  assigneeId: string;
  estimatedTime?: string;
  notes?: string;
}
