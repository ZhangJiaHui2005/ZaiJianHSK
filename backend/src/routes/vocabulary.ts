import { Router, Request, Response } from "express";
import User from "../models/Users.js";
import Vocabulary from "../models/Vocabulary.js";
import PendingVocabulary from "../models/PendingVocabulary.js";

const router = Router();

// Middleware: check if user is admin
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const clerkId = req.headers["x-clerk-user-id"] as string;
    if (!clerkId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Attach user to request for downstream use
    (req as any).currentUser = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware: attach current user from header
const attachUser = async (req: Request, res: Response, next: Function) => {
  try {
    const clerkId = req.headers["x-clerk-user-id"] as string;
    if (clerkId) {
      const user = await User.findOne({ clerkId });
      if (user) {
        (req as any).currentUser = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// ==================== ADMIN ROUTES ====================

// GET /api/vocabulary/pending - Admin lấy danh sách từ đang chờ duyệt
router.get("/pending", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filter: any = {};
    if (
      status &&
      ["pending", "approved", "rejected"].includes(status as string)
    ) {
      filter.status = status;
    } else {
      filter.status = "pending"; // default: only pending
    }

    const total = await PendingVocabulary.countDocuments(filter);
    const submissions = await PendingVocabulary.find(filter)
      .populate("userId", "username email")
      .populate("adminId", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      submissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/vocabulary/pending/:id/approve - Admin duyệt từ
router.patch(
  "/pending/:id/approve",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const admin = (req as any).currentUser;

      const pending = await PendingVocabulary.findById(id);
      if (!pending) {
        return res.status(404).json({ error: "Pending vocabulary not found" });
      }

      if (pending.status !== "pending") {
        return res
          .status(400)
          .json({
            error: `This submission has already been ${pending.status}`,
          });
      }

      // Clone into Vocabulary collection
      const newVocab = await Vocabulary.create({
        simplified: pending.simplified,
        traditional: pending.traditional || "",
        radical: pending.radical || "",
        pinyin: pending.pinyin,
        numeric: pending.numeric || "",
        meanings: pending.meanings,
        level: pending.level,
        frequency: pending.frequency,
        pos: pending.pos,
        classifiers: pending.classifiers,
      });

      // Update pending status
      pending.status = "approved";
      pending.adminId = admin._id;
      pending.reviewedAt = new Date();
      await pending.save();

      console.log(
        `✅ Vocabulary approved: ${pending.simplified} (by ${admin.username})`,
      );

      return res.status(200).json({
        message: "Vocabulary approved and added to main collection",
        vocabulary: newVocab,
        pending,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /api/vocabulary/pending/:id/reject - Admin từ chối từ
router.patch(
  "/pending/:id/reject",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const admin = (req as any).currentUser;

      const pending = await PendingVocabulary.findById(id);
      if (!pending) {
        return res.status(404).json({ error: "Pending vocabulary not found" });
      }

      if (pending.status !== "pending") {
        return res
          .status(400)
          .json({
            error: `This submission has already been ${pending.status}`,
          });
      }

      pending.status = "rejected";
      pending.adminId = admin._id;
      pending.reviewedAt = new Date();
      pending.notes = notes || "";
      await pending.save();

      console.log(
        `❌ Vocabulary rejected: ${pending.simplified} (by ${admin.username})`,
      );

      return res.status(200).json({
        message: "Vocabulary submission rejected",
        pending,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ==================== USER ROUTES ====================

// POST /api/vocabulary/pending - User gửi từ mới
router.post("/pending", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res
        .status(401)
        .json({ error: "User not authenticated. Please sign in." });
    }

    const {
      simplified,
      traditional,
      radical,
      pinyin,
      numeric,
      meanings,
      level,
      pos,
      classifiers,
    } = req.body;

    // Validate required fields
    if (!simplified || !pinyin) {
      return res
        .status(400)
        .json({ error: "Simplified Chinese and Pinyin are required" });
    }

    // Check for duplicate pending submission
    const existingPending = await PendingVocabulary.findOne({
      simplified,
      userId: currentUser._id,
      status: "pending",
    });
    if (existingPending) {
      return res.status(400).json({
        error: "You already have a pending submission for this word",
        existing: existingPending,
      });
    }

    // Check if word already exists in main collection
    const existingApproved = await Vocabulary.findOne({ simplified });
    if (existingApproved) {
      return res.status(400).json({
        error: "This word already exists in the vocabulary",
      });
    }

    const pending = await PendingVocabulary.create({
      simplified,
      traditional: traditional || "",
      radical: radical || "",
      pinyin,
      numeric: numeric || "",
      meanings: meanings || [],
      level: level || [],
      frequency: 999999,
      pos: pos || [],
      classifiers: classifiers || [],
      userId: currentUser._id,
    });

    console.log(
      `📝 New vocabulary submitted: ${simplified} (by ${currentUser.username})`,
    );

    return res.status(201).json({
      message: "Vocabulary submitted for review",
      pending,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vocabulary/pending/my - User xem từ đã gửi
router.get("/pending/my", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filter = { userId: currentUser._id };
    const total = await PendingVocabulary.countDocuments(filter);
    const submissions = await PendingVocabulary.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      submissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
