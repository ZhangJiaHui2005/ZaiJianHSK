import mongoose, { Schema, Document } from 'mongoose';

export interface IVocabulary extends Document {
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
}

const VocabularySchema: Schema = new Schema(
  {
    simplified: {
      type: String,
      required: [true, 'Simplified Chinese is required'],
    },
    traditional: {
      type: String,
      default: '',
    },
    radical: {
      type: String,
      default: '',
    },
    pinyin: {
      type: String,
      required: [true, 'Pinyin is required'],
    },
    numeric: {
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

VocabularySchema.index({ simplified: 1 });
VocabularySchema.index({ pinyin: 1 });
VocabularySchema.index({ frequency: 1 });

const Vocabulary = mongoose.model<IVocabulary>('Vocabulary', VocabularySchema);

export default Vocabulary;
