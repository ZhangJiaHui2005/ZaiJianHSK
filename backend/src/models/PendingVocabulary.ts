import mongoose, { Schema, Document } from "mongoose";

export interface IPendingVocabulary extends Document {
  simplified: string;
  traditional?: string;
  radical?: string;
  pinyin: string;
  numeric?: string;
  meanings: string[];
  level: string[];
  frequency: number;
  pos: string[];
  classifiers: string[];
  userId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  adminId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PendingVocabularySchema: Schema = new Schema(
  {
    simplified: {
      type: String,
      required: [true, "Simplified Chinese is required"],
      trim: true,
    },
    traditional: {
      type: String,
      default: "",
    },
    radical: {
      type: String,
      default: "",
    },
    pinyin: {
      type: String,
      required: [true, "Pinyin is required"],
      trim: true,
    },
    numeric: {
      type: String,
      default: "",
    },
    meanings: {
      type: [String],
      default: [],
    },
    level: {
      type: [String],
      default: [],
    },
    frequency: {
      type: Number,
      default: 999999,
    },
    pos: {
      type: [String],
      default: [],
    },
    classifiers: {
      type: [String],
      default: [],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

PendingVocabularySchema.index({ status: 1 });
PendingVocabularySchema.index({ userId: 1, status: 1 });
PendingVocabularySchema.index({ createdAt: -1 });

const PendingVocabulary = mongoose.model<IPendingVocabulary>(
  "PendingVocabulary",
  PendingVocabularySchema,
);

export default PendingVocabulary;
