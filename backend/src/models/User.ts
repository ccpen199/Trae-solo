import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'homeowner' | 'designer' | 'admin';
export type DesignerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IUser extends Document {
  username: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;
  role: UserRole;
  nickname?: string;
  bio?: string;
  designerStatus?: DesignerStatus;
  serviceAreas?: string[];
  qualifications?: {
    licenseNumber?: string;
    certificationImages?: string[];
    verifiedAt?: Date;
  };
  portfolio?: Array<{
    title: string;
    description: string;
    images: string[];
    style?: string;
    budgetRange?: { min: number; max: number };
  }>;
  statistics?: {
    completedProjects: number;
    rating: number;
    reviewCount: number;
  };
  preferences?: {
    styleTags: string[];
    budgetRange?: { min: number; max: number };
    materials: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, '请输入用户名'],
      unique: true,
      trim: true,
      minlength: [3, '用户名至少3个字符'],
      maxlength: [20, '用户名最多20个字符']
    },
    email: {
      type: String,
      required: [true, '请输入邮箱'],
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
    },
    phone: {
      type: String,
      required: [true, '请输入手机号'],
      match: [/^1[3-9]\d{9}$/, '请输入有效的手机号']
    },
    password: {
      type: String,
      required: [true, '请输入密码'],
      minlength: [6, '密码至少6个字符'],
      select: false
    },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['homeowner', 'designer', 'admin'],
      default: 'homeowner',
      required: true
    },
    nickname: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    designerStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: undefined
    },
    serviceAreas: [{ type: String }],
    qualifications: {
      licenseNumber: { type: String },
      certificationImages: [{ type: String }],
      verifiedAt: { type: Date }
    },
    portfolio: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        images: [{ type: String, required: true }],
        style: { type: String },
        budgetRange: {
          min: { type: Number },
          max: { type: Number }
        }
      }
    ],
    statistics: {
      completedProjects: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 }
    },
    preferences: {
      styleTags: [{ type: String }],
      budgetRange: {
        min: { type: Number },
        max: { type: Number }
      },
      materials: [{ type: String }]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.virtual('isActiveDesigner').get(function (this: IUser) {
  return this.role === 'designer' && this.designerStatus === 'approved';
});

export default mongoose.model<IUser>('User', UserSchema);
