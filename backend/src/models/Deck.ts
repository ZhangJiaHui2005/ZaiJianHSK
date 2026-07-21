import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDeck extends Document {
  name: string;
  hskLevel: string;
  wordIds: Types.ObjectId[];
  totalWords: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeckSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Deck name is required'],
      trim: true,
    },
    hskLevel: {
      type: String,
      required: [true, 'HSK level is required'],
      enum: ['newest-1', 'newest-2', 'newest-3', 'newest-4', 'newest-5', 'newest-6', 'newest-7'],
    },
    wordIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Vocabulary',
      },
    ],
    totalWords: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

DeckSchema.index({ hskLevel: 1, order: 1 });

const Deck = mongoose.model<IDeck>('Deck', DeckSchema);

export default Deck;
