import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user?: mongoose.Types.ObjectId;
  username?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
      trim: true,
    },
    entityId: {
      type: String,
      default: "",
    },
    entityName: {
      type: String,
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
);

export default ActivityLog;

