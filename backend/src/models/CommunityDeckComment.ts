import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICommunityDeckComment extends Document {
  deckId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const CommunityDeckCommentSchema: Schema = new Schema(
  {
    deckId: {
      type: Schema.Types.ObjectId,
      ref: "CommunityDeck",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment must be at most 1000 characters"],
    },
    status: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
    },
  },
  { timestamps: true },
);

CommunityDeckCommentSchema.index({ deckId: 1, status: 1, createdAt: -1 });

const CommunityDeckComment = mongoose.model<ICommunityDeckComment>(
  "CommunityDeckComment",
  CommunityDeckCommentSchema,
);

export default CommunityDeckComment;
