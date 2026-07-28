import { Router, Request, Response } from "express";
import User from "../models/Users.js";
import Vocabulary from "../models/Vocabulary.js";
import CommunityDeck from "../models/CommunityDeck.js";
import PendingVocabulary from "../models/PendingVocabulary.js";
import DeckReport from "../models/DeckReport.js";
import { attachUser } from "../middleware/auth.js";

const router = Router();

// Middleware kiểm tra admin/moderator
async function requireAdmin(req: Request, res: Response, next: Function) {
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
    return res.status(500).json({ error: "Internal server error" });
  }
}

// GET /api/admin/stats - Lấy thống kê tổng quan cho Admin Dashboard
router.get("/", attachUser, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalVocabulary,
      totalCommunityDecks,
      pendingVocabulary,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments({}),
      Vocabulary.countDocuments({}),
      CommunityDeck.countDocuments({}),
      PendingVocabulary.countDocuments({ status: "pending" }),
      DeckReport.countDocuments({ status: "pending" }),
    ]);

    return res.status(200).json({
      success: true,
      totalUsers,
      totalVocabulary,
      totalCommunityDecks,
      pendingVocabulary,
      pendingReports,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;

