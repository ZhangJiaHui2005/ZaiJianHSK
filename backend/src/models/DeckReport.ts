import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDeckReport extends Document {
  deckId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reason: "spam" | "inappropriate" | "wrong_topic" | "duplicate" | "other";
  description: string;
  status: "pending" | "resolved" | "dismissed";
  adminId?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeckReportSchema: Schema = new Schema(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityDeck",
      required: [true, "Deck ID is required"],
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter ID is required"],
    },
    reason: {
      type: String,
      enum: ["spam", "inappropriate", "wrong_topic", "duplicate", "other"],
      required: [true, "Reason is required"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

DeckReportSchema.index({ status: 1, createdAt: -1 });
DeckReportSchema.index({ deckId: 1, status: 1 });

const DeckReport = mongoose.model<IDeckReport>("DeckReport", DeckReportSchema);

export default DeckReport;

