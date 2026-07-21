import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'user'],
      default: 'user',
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', UserSchema);

export default User;

