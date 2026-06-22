import mongoose, { Document, Schema } from 'mongoose';

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'rejected';
export type ReportType = 'spam' | 'inappropriate' | 'fraud' | 'copyright' | 'other';
export type ModActionType = 'warning' | 'content_removed' | 'user_suspended' | 'user_banned' | 'no_action';

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetType: 'diary' | 'comment' | 'user' | 'designer_portfolio' | 'transaction';
  targetId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  reportType: ReportType;
  description: string;
  evidenceImages: string[];
  status: ReportStatus;
  assignedTo?: mongoose.Types.ObjectId;
  investigationNotes?: string;
  actionTaken?: ModActionType;
  actionDescription?: string;
  resolvedAt?: Date;
  relatedReports?: mongoose.Types.ObjectId[];
  contentSnapshot?: {
    title?: string;
    content?: string;
    images?: string[];
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFilterLog extends Document {
  userId: mongoose.Types.ObjectId;
  contentType: 'diary' | 'comment' | 'message' | 'portfolio';
  contentId?: mongoose.Types.ObjectId;
  originalContent: string;
  filteredContent: string;
  matchedWords: string[];
  action: 'blocked' | 'censored' | 'flagged';
  createdAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['diary', 'comment', 'user', 'designer_portfolio', 'transaction'],
      required: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reportType: {
      type: String,
      enum: ['spam', 'inappropriate', 'fraud', 'copyright', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [2000, '描述最多2000字符']
    },
    evidenceImages: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'rejected'],
      default: 'pending',
      index: true
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    investigationNotes: { type: String },
    actionTaken: {
      type: String,
      enum: ['warning', 'content_removed', 'user_suspended', 'user_banned', 'no_action']
    },
    actionDescription: { type: String },
    resolvedAt: { type: Date },
    relatedReports: [{ type: Schema.Types.ObjectId, ref: 'Report' }],
    contentSnapshot: {
      title: { type: String },
      content: { type: String },
      images: [{ type: String }],
      timestamp: { type: Date, required: true }
    }
  },
  {
    timestamps: true
  }
);

ReportSchema.index({ reporterId: 1, targetId: 1 }, { unique: false });
ReportSchema.index({ status: 1, createdAt: -1 });

const FilterLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['diary', 'comment', 'message', 'portfolio'],
      required: true
    },
    contentId: { type: Schema.Types.ObjectId },
    originalContent: { type: String, required: true },
    filteredContent: { type: String },
    matchedWords: [{ type: String, required: true }],
    action: {
      type: String,
      enum: ['blocked', 'censored', 'flagged'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

FilterLogSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
export const FilterLog = mongoose.model<IFilterLog>('FilterLog', FilterLogSchema);
