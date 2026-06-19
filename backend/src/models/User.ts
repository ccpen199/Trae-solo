import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'student' | 'operator' | 'investor' | 'admin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  phone: string;
  password?: string;
  realName?: string;
  avatar?: string;
  role: UserRole;
  balance: number;
  frozenBalance: number;
  balanceWarningThreshold: number;
  studentInfo?: {
    studentId?: string;
    schoolId?: string;
    campus?: string;
    dormitory?: string;
  };
  operatorInfo?: {
    employeeId?: string;
    department?: string;
    permissions: string[];
  };
  investorInfo?: {
    companyName?: string;
    projectIds: Types.ObjectId[];
    investorLevel: 'normal' | 'premium' | 'vip';
  };
  isActive: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^1[3-9]\d{9}$/,
    },
    password: {
      type: String,
      select: false,
      trim: true,
    },
    realName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'operator', 'investor', 'admin'],
      required: true,
      default: 'student',
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    frozenBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceWarningThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    studentInfo: {
      studentId: String,
      schoolId: String,
      campus: String,
      dormitory: String,
    },
    operatorInfo: {
      employeeId: String,
      department: String,
      permissions: {
        type: [String],
        default: [],
      },
    },
    investorInfo: {
      companyName: String,
      projectIds: {
        type: [Schema.Types.ObjectId],
        ref: 'Project',
        default: [],
      },
      investorLevel: {
        type: String,
        enum: ['normal', 'premium', 'vip'],
        default: 'normal',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
    lastLoginIp: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual('availableBalance').get(function (this: IUser) {
  return this.balance - this.frozenBalance;
});

export const User = model<IUser>('User', userSchema);
