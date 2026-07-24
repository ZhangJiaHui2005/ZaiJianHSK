import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import DeckReport from "../models/DeckReport.js";
import CommunityDeck from "../models/CommunityDeck.js";
import { attachUser } from "../middleware/auth.js";

const router = Router();

// Middleware kiểm tra admin
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

// GET /api/admin/reports - Lấy danh sách báo cáo
router.get("/", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status = "pending", page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const filter: Record<string, any> = {};
    if (typeof status === "string" && ["pending", "resolved", "dismissed"].includes(status)) {
      filter.status = status;
    }

    const total = await DeckReport.countDocuments(filter);
    const reports = await DeckReport.find(filter)
      .populate("reporterId", "username email")
      .populate("adminId", "username email")
      .populate({
        path: "deckId",
        select: "title ownerId visibility status saveCount",
        populate: { path: "ownerId", select: "username email" },
      })
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
      reports,
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/admin/reports/:id/resolve - Resolve a report
router.patch("/:id/resolve", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await DeckReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "pending") {
      return res.status(400).json({ error: `Report already ${report.status}` });
    }

    report.status = "resolved";
    report.adminId = currentUser._id;
    report.resolvedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report resolved successfully",
      report: {
        _id: report._id,
        status: report.status,
        adminId: report.adminId,
        resolvedAt: report.resolvedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/admin/reports/:id/dismiss - Dismiss a report
router.patch("/:id/dismiss", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await DeckReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.status !== "pending") {
      return res.status(400).json({ error: `Report already ${report.status}` });
    }

    report.status = "dismissed";
    report.adminId = currentUser._id;
    report.resolvedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report dismissed successfully",
      report: {
        _id: report._id,
        status: report.status,
        adminId: report.adminId,
        resolvedAt: report.resolvedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/admin/reports/:id/hide-deck - Hide the reported deck
router.patch("/:id/hide-deck", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await DeckReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const deck = await CommunityDeck.findById(report.deckId);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }

    deck.status = "hidden";
    await deck.save();

    report.status = "resolved";
    report.adminId = currentUser._id;
    report.resolvedAt = new Date();
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Deck hidden and report resolved",
      report: {
        _id: report._id,
        status: report.status,
      },
      deck: {
        _id: deck._id,
        title: deck.title,
        status: deck.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
