import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICommunityDeck extends Document {
  title: string;
  description: string;
  ownerId: Types.ObjectId;
  wordIds: Types.ObjectId[];
  visibility: "private" | "public" | "unlisted";
  status: "draft" | "published" | "hidden";
  tags: string[];
  hskLevels: string[];
  sourceDeckId?: Types.ObjectId | null;
  saveCount: number;
  forkCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityDeckSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Deck title is required"],
      trim: true,
      minlength: [3, "Deck title must be at least 3 characters"],
      maxlength: [120, "Deck title must be at most 120 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    wordIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Vocabulary",
      },
    ],
    visibility: {
      type: String,
      enum: ["private", "public", "unlisted"],
      default: "private",
    },
    status: {
      type: String,
      enum: ["draft", "published", "hidden"],
      default: "draft",
    },
    tags: {
      type: [String],
      default: [],
    },
    hskLevels: {
      type: [String],
      default: [],
    },
    sourceDeckId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityDeck",
      default: null,
    },
    saveCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    forkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

CommunityDeckSchema.index({ visibility: 1, status: 1, updatedAt: -1 });
CommunityDeckSchema.index({ ownerId: 1, updatedAt: -1 });
CommunityDeckSchema.index({ title: "text", description: "text", tags: "text" });

const CommunityDeck = mongoose.model<ICommunityDeck>(
  "CommunityDeck",
  CommunityDeckSchema,
);

export default CommunityDeck;
