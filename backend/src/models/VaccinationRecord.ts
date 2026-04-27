import mongoose, { Schema, Document } from 'mongoose';

export interface IVaccinationRecord extends Document {
  earTagId: string;
  
  vaccineName: string;
  vaccineBatch: string;
  manufacturer?: string;
  
  vaccinationDate: Date;
  plannedDate: Date;
  nextBoosterDate?: Date;
  
  dosage: number;
  administrationRoute: string;
  
  operatorId: string;
  notes?: string;
  
  isMandatory: boolean;
  complianceStatus: 'compliant' | 'non_compliant' | 'exempt';
  
  createdAt: Date;
  updatedAt: Date;
}

const vaccinationRecordSchema: Schema = new Schema({
  earTagId: {
    type: String,
    required: true,
    index: true
  },
  vaccineName: {
    type: String,
    required: true
  },
  vaccineBatch: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String
  },
  vaccinationDate: {
    type: Date,
    required: true
  },
  plannedDate: {
    type: Date,
    required: true
  },
  nextBoosterDate: {
    type: Date
  },
  dosage: {
    type: Number,
    required: true,
    min: 0
  },
  administrationRoute: {
    type: String,
    required: true
  },
  operatorId: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  isMandatory: {
    type: Boolean,
    default: false
  },
  complianceStatus: {
    type: String,
    enum: ['compliant', 'non_compliant', 'exempt'],
    default: 'compliant'
  }
}, {
  timestamps: true,
  collection: 'vaccination_records'
});

vaccinationRecordSchema.index({ earTagId: 1, vaccinationDate: -1 });
vaccinationRecordSchema.index({ vaccinationDate: -1 });
vaccinationRecordSchema.index({ vaccineName: 1 });
vaccinationRecordSchema.index({ complianceStatus: 1 });

export default mongoose.model<IVaccinationRecord>('VaccinationRecord', vaccinationRecordSchema);
