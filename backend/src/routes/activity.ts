import { Router, Request, Response } from "express";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/Users.js";
import Vocabulary from "../models/Vocabulary.js";
import CommunityDeck from "../models/CommunityDeck.js";
import { requireAdmin, attachUser } from "../middleware/auth.js";

const router = Router();

/**
 * Hỗ trợ cả admin/moderator (requireAdmin hoặc role check).
 */
async function requireAdminOrModerator(req: Request, res: Response, next: Function) {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
      return res.status(403).json({ error: "Admin or moderator role required" });
    }
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/admin/activity - Activity Log Stream (paginated, filterable)
router.get("/", attachUser, requireAdminOrModerator, async (req: Request, res: Response) => {
  try {
    const {
      action = "",
      entityType = "",
      search = "",
      page = "1",
      limit = "30",
      days = "30",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));

    const filter: Record<string, any> = {};

    // Optional time window (last N days)
    const daysNum = parseInt(days as string, 10);
    if (!isNaN(daysNum) && daysNum > 0) {
      const since = new Date();
      since.setDate(since.getDate() - daysNum);
      filter.createdAt = { $gte: since };
    }

    if (typeof action === "string" && action.trim()) {
      filter.action = action.trim();
    }

    if (typeof entityType === "string" && entityType.trim()) {
      filter.entityType = entityType.trim();
    }

    // Search by username or entity name
    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { username: searchRegex },
        { entityName: searchRegex },
        { action: searchRegex },
      ];
    }

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/admin/activity/analytics - User Growth + Daily Study Activity
router.get("/analytics", attachUser, requireAdminOrModerator, async (_req: Request, res: Response) => {
  try {
    // --- User Growth: users created per day over last 30 days (cumulative) ---
    const days = 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const allTimeCount = await User.countDocuments({ createdAt: { $lt: since } });
    const userAgg = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const userMap = new Map<string, number>();
    for (const item of userAgg) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
      userMap.set(key, item.count);
    }

    const userGrowth: Array<{ date: string; label: string; newUsers: number; totalUsers: number }> = [];
    let runningTotal = allTimeCount;
    for (let i = days; i >= 0; i--) {
      const d = new Date(since);
      d.setDate(since.getDate() + (days - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const newUsers = userMap.get(key) || 0;
      runningTotal += newUsers;
      userGrowth.push({
        date: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        newUsers,
        totalUsers: runningTotal,
      });
    }

    // --- Daily Study Activity: activity logs per day over last 30 days ---
    const activityAgg = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const activityMap = new Map<string, number>();
    for (const item of activityAgg) {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`;
      activityMap.set(key, item.count);
    }

    const dailyActivity: Array<{ date: string; label: string; actions: number }> = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(since);
      d.setDate(since.getDate() + (days - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dailyActivity.push({
        date: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        actions: activityMap.get(key) || 0,
      });
    }

    // --- Action breakdown (for potential extra chart) ---
    const actionBreakdown = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);

    return res.status(200).json({
      success: true,
      userGrowth,
      dailyActivity,
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item._id,
        count: item.count,
      })),
      totals: {
        totalUsers: await User.countDocuments({}),
        totalVocabulary: await Vocabulary.countDocuments({}),
        totalCommunityDecks: await CommunityDeck.countDocuments({}),
        totalActions: await ActivityLog.countDocuments({ createdAt: { $gte: since } }),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/admin/activity/actions - Distinct action types (for filter UI)
router.get("/actions", attachUser, requireAdminOrModerator, async (_req: Request, res: Response) => {
  try {
    const actions = await ActivityLog.distinct("action");
    return res.status(200).json({ success: true, actions });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;

