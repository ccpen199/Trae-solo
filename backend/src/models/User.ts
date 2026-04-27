import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  
  role: UserRole;
  permissions: string[];
  
  isActive: boolean;
  lastLogin?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true,
    sparse: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    default: UserRole.FEEDER,
    index: true
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model<IUser>('User', userSchema);
