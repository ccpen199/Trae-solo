import mongoose, { Document, Schema } from 'mongoose';

export type ConstructionStage = 'planning' | 'demolition' | 'plumbing_electrical' | 'masonry_carpentry' | 'painting' | 'installation' | 'acceptance';
export type HouseType = 'apartment' | 'villa' | 'duplex' | 'loft' | 'townhouse';

export interface IBudgetItem {
  category: string;
  subCategory?: string;
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  date?: Date;
  invoiceImage?: string;
}

export interface IAIAnalysis {
  style?: {
    primary: string;
    confidence: number;
    secondary?: string[];
  };
  materials?: Array<{
    name: string;
    category: string;
    location?: string;
    confidence: number;
  }>;
  brands?: Array<{
    name: string;
    product?: string;
    location?: string;
    confidence: number;
  }>;
  colors?: string[];
  spatialTags?: string[];
  analyzedAt: Date;
}

export interface IComment {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  likes: number;
}

export interface IDiary extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  floorPlan: {
    image?: string;
    sketchupFile?: string;
    metadata?: {
      area?: number;
      rooms?: number;
      bathrooms?: number;
      floors?: number;
    }
  };
  houseType: HouseType;
  houseArea: number;
  address?: {
    city: string;
    district?: string;
    detail?: string;
  };
  constructionStage: ConstructionStage;
  stageHistory: Array<{
    stage: ConstructionStage;
    startedAt: Date;
    completedAt?: Date;
    description?: string;
  }>;
  budget: {
    totalEstimated: number;
    totalActual?: number;
    items: IBudgetItem[];
  };
  aiAnalysis?: IAIAnalysis;
  styleTags: string[];
  materialTags: string[];
  likes: mongoose.Types.ObjectId[];
  commentCount: number;
  comments: IComment[];
  views: number;
  shares: number;
  isPublished: boolean;
  isVerified?: boolean;
  matchedDesigners?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DiarySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, '请输入日记标题'],
      maxlength: [100, '标题最多100个字符']
    },
    description: {
      type: String,
      required: [true, '请输入日记描述'],
      maxlength: [5000, '描述最多5000个字符']
    },
    coverImage: {
      type: String,
      required: true
    },
    images: [{ type: String, required: true }],
    floorPlan: {
      image: { type: String },
      sketchupFile: { type: String },
      metadata: {
        area: { type: Number },
        rooms: { type: Number },
        bathrooms: { type: Number },
        floors: { type: Number }
      }
    },
    houseType: {
      type: String,
      enum: ['apartment', 'villa', 'duplex', 'loft', 'townhouse'],
      required: true
    },
    houseArea: {
      type: Number,
      required: [true, '请输入房屋面积'],
      min: [1, '面积必须大于0']
    },
    address: {
      city: { type: String },
      district: { type: String },
      detail: { type: String }
    },
    constructionStage: {
      type: String,
      enum: ['planning', 'demolition', 'plumbing_electrical', 'masonry_carpentry', 'painting', 'installation', 'acceptance'],
      required: true,
      index: true
    },
    stageHistory: [
      {
        stage: { type: String, required: true },
        startedAt: { type: Date, required: true, default: Date.now },
        completedAt: { type: Date },
        description: { type: String }
      }
    ],
    budget: {
      totalEstimated: { type: Number, required: true, min: 0 },
      totalActual: { type: Number, min: 0 },
      items: [
        {
          category: { type: String, required: true },
          subCategory: { type: String },
          description: { type: String, required: true },
          estimatedAmount: { type: Number, required: true, min: 0 },
          actualAmount: { type: Number, min: 0 },
          date: { type: Date },
          invoiceImage: { type: String }
        }
      ]
    },
    aiAnalysis: {
      style: {
        primary: { type: String },
        confidence: { type: Number },
        secondary: [{ type: String }]
      },
      materials: [
        {
          name: { type: String, required: true },
          category: { type: String },
          location: { type: String },
          confidence: { type: Number, required: true }
        }
      ],
      brands: [
        {
          name: { type: String, required: true },
          product: { type: String },
          location: { type: String },
          confidence: { type: Number, required: true }
        }
      ],
      colors: [{ type: String }],
      spatialTags: [{ type: String }],
      analyzedAt: { type: Date }
    },
    styleTags: [{ type: String, index: true }],
    materialTags: [{ type: String, index: true }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        likes: { type: Number, default: 0 }
      }
    ],
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    matchedDesigners: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

DiarySchema.index({ createdAt: -1 });
DiarySchema.index({ styleTags: 1, materialTags: 1 });
DiarySchema.index({ 'address.city': 1, constructionStage: 1 });

DiarySchema.virtual('budgetProgress').get(function (this: IDiary) {
  if (!this.budget.totalActual || this.budget.totalEstimated === 0) return 0;
  return Math.round((this.budget.totalActual / this.budget.totalEstimated) * 100);
});

export default mongoose.model<IDiary>('Diary', DiarySchema);
