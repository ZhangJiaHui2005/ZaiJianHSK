import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISavedDeck extends Document {
  userId: Types.ObjectId;
  deckId: Types.ObjectId;
  deckType: "hsk" | "community";
  createdAt: Date;
  updatedAt: Date;
}

const SavedDeckSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    deckId: {
      type: Schema.Types.ObjectId,
      required: [true, "Deck ID is required"],
      index: true,
    },
    deckType: {
      type: String,
      enum: ["hsk", "community"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

SavedDeckSchema.index({ userId: 1, deckId: 1, deckType: 1 }, { unique: true });

const SavedDeck = mongoose.model<ISavedDeck>("SavedDeck", SavedDeckSchema);

export default SavedDeck;
