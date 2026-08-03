import ActivityLog from "../models/ActivityLog.js";

/**
 * Ghi một sự kiện vào Activity Log (fire-and-forget, không chặn request).
 */
export async function logActivity(
  data: {
    user?: any;
    username?: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    await ActivityLog.create({
      user: data.user?._id || null,
      username: data.username || data.user?.username || "",
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || "",
      entityName: data.entityName || "",
      metadata: data.metadata || {},
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
