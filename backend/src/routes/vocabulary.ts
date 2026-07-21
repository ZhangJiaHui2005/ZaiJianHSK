import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/Users.js";
import Vocabulary from "../models/Vocabulary.js";
import PendingVocabulary from "../models/PendingVocabulary.js";
import Deck from "../models/Deck.js";

const router = Router();

// Helper: map level display name to level value filter regex
function buildLevelFilter(levelParam: string): Record<string, any> | null {
  if (!levelParam || levelParam === "all") return null;

  // Mapping from frontend category key to backend level regex
  const levelMap: Record<string, string> = {
    hsk1: "(^|[^0-9])1$", // newest-1, new-1, old-1
    hsk2: "(^|[^0-9])2$",
    hsk3: "(^|[^0-9])3$",
    hsk4: "(^|[^0-9])4$",
    hsk5: "(^|[^0-9])5$",
    hsk6: "(^|[^0-9])6$",
    "7": "(^|[^0-9])[789]$", // hsk7_9 => newest-7, newest-8, newest-9
  };

  const regex = levelMap[levelParam];
  if (regex) {
    return { level: { $regex: regex, $options: "i" } };
  }

  // Fallback: use as direct regex
  return { level: { $regex: levelParam, $options: "i" } };
}

// Helper: map a level value (e.g. "newest-1") to hsk key (e.g. "hsk1")
function levelValueToHskKey(levelValue: string): string | null {
  const match = levelValue.match(/(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num >= 1 && num <= 6) return `hsk${num}`;
  if (num >= 7) return "hsk7_9";
  return null;
}

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
// Body: { level: string[], assignedDeckIds: string[] }
// - level: HSK levels to assign (e.g. ["newest-1", "newest-2"])
// - assignedDeckIds: deck IDs to assign this word to (optional)
router.patch(
  "/pending/:id/approve",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { level, assignedDeckIds } = req.body;
      const admin = (req as any).currentUser;

      const pending = await PendingVocabulary.findById(id);
      if (!pending) {
        return res.status(404).json({ error: "Pending vocabulary not found" });
      }

      if (pending.status !== "pending") {
        return res.status(400).json({
          error: `This submission has already been ${pending.status}`,
        });
      }

      // Use admin-provided levels, or fall back to the levels user submitted, or default to empty
      const assignedLevels: string[] =
        Array.isArray(level) && level.length > 0
          ? level
          : pending.level.length > 0
            ? pending.level
            : [];

      // Clone into Vocabulary collection with the determined levels
      const newVocab = await Vocabulary.create({
        simplified: pending.simplified,
        traditional: pending.traditional || "",
        radical: pending.radical || "",
        pinyin: pending.pinyin,
        numeric: pending.numeric || "",
        meanings: pending.meanings,
        level: assignedLevels,
        frequency: pending.frequency,
        pos: pending.pos,
        classifiers: pending.classifiers,
      });

      // Assign word to decks if deck IDs are provided
      const assignedDecks: { deckId: string; deckName: string }[] = [];
      if (Array.isArray(assignedDeckIds) && assignedDeckIds.length > 0) {
        for (const deckId of assignedDeckIds) {
          try {
            const deck = await Deck.findById(deckId);
            if (deck) {
              // Avoid duplicate wordIds
              if (!deck.wordIds.includes(newVocab._id)) {
                deck.wordIds.push(newVocab._id);
                deck.totalWords = deck.wordIds.length;
                await deck.save();
              }
              assignedDecks.push({
                deckId: deck._id.toString(),
                deckName: deck.name,
              });
            }
          } catch (deckErr) {
            console.warn(`Could not assign to deck ${deckId}:`, deckErr);
          }
        }
      }

      // Update pending status
      pending.status = "approved";
      pending.adminId = admin._id;
      pending.reviewedAt = new Date();
      // Save assigned deck info for display in admin table
      if (assignedDecks.length > 0) {
        pending.assignedDeckIds = assignedDecks.map(
          (d) => new mongoose.Types.ObjectId(d.deckId),
        );
        pending.assignedDeckNames = assignedDecks.map((d) => d.deckName);
      }
      await pending.save();

      console.log(
        `✅ Vocabulary approved: ${pending.simplified} (level: ${assignedLevels.join(", ")}) (by ${admin.username})`,
      );

      return res.status(200).json({
        message: "Vocabulary approved and added to main collection",
        vocabulary: newVocab,
        pending,
        assignedLevels,
        assignedDecks: assignedDecks.length > 0 ? assignedDecks : undefined,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// DELETE /api/vocabulary/pending/:id/permanent - Xóa vĩnh viễn khỏi PendingVocabulary (chỉ cho rejected items)
router.delete(
  "/pending/:id/permanent",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const pending = await PendingVocabulary.findById(id);
      if (!pending) {
        return res.status(404).json({ error: "Pending vocabulary not found" });
      }

      if (pending.status !== "rejected") {
        return res.status(400).json({
          error: "Only rejected submissions can be permanently deleted",
        });
      }

      await PendingVocabulary.findByIdAndDelete(id);

      console.log(
        `🔥 Pending vocabulary permanently deleted: ${pending.simplified} (ID: ${id})`,
      );

      return res.status(200).json({
        message: "Pending vocabulary permanently deleted",
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// PATCH /api/vocabulary/pending/:id/reject - Admin từ chối từ (từ pending hoặc từ chối/ xóa từ đã approved)
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

      if (pending.status === "pending") {
        // Normal reject for pending items
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
      } else if (pending.status === "approved") {
        // Reject approved word = remove from Vocabulary collection + mark as rejected
        const vocab = await Vocabulary.findOneAndDelete({
          simplified: pending.simplified,
        });

        if (!vocab) {
          console.warn(
            `⚠️ Vocabulary ${pending.simplified} not found in main collection during reject`,
          );
        }

        pending.status = "rejected";
        pending.adminId = admin._id;
        pending.reviewedAt = new Date();
        pending.notes = notes
          ? `${notes} | Removed from vocabulary collection on ${new Date().toISOString()}`
          : `Removed from vocabulary collection on ${new Date().toISOString()}`;
        await pending.save();

        console.log(
          `🗑️ Vocabulary rejected & removed from collection: ${pending.simplified} (by ${admin.username})`,
        );

        return res.status(200).json({
          message: "Vocabulary rejected and removed from main collection",
          pending,
          removedFromVocabulary: !!vocab,
        });
      } else {
        return res.status(400).json({
          error: `Cannot reject a submission with status "${pending.status}"`,
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

// ==================== PUBLIC ROUTES ====================

// GET /api/vocabulary/stats - Lấy thống kê số từ vựng theo cấp độ HSK
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const totalWords = await Vocabulary.countDocuments();

    const hskStats: Record<string, number> = {
      hsk1: 0,
      hsk2: 0,
      hsk3: 0,
      hsk4: 0,
      hsk5: 0,
      hsk6: 0,
      hsk7_9: 0,
    };

    // Count words per HSK level
    const pipeline = [
      { $unwind: "$level" },
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ];
    const levelCounts = await Vocabulary.aggregate(pipeline);

    for (const item of levelCounts) {
      const hskKey = levelValueToHskKey(item._id);
      if (hskKey && hskKey in hskStats) {
        hskStats[hskKey] += item.count;
      }
    }

    return res.status(200).json({
      success: true,
      hsk3Stats: hskStats,
      totalWords,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vocabulary/decks - Lấy danh sách bộ bài học theo HSK level & search
router.get("/decks", async (req: Request, res: Response) => {
  try {
    const { level = "all", search = "" } = req.query;

    // Build query filter using helper
    const levelFilter = buildLevelFilter(level as string);
    const filter: any = levelFilter || {};
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { simplified: searchRegex },
        { pinyin: searchRegex },
        { meanings: searchRegex },
        { traditional: searchRegex },
      ];
    }

    // Get all matching words to build decks
    const words = await Vocabulary.find(filter)
      .select("simplified traditional pinyin meanings level")
      .sort({ level: 1, simplified: 1 })
      .limit(2000);

    // Group into decks by level
    const deckMap = new Map<
      string,
      { title: string; hskLevel: string; levelKey: string; words: any[] }
    >();

    for (const w of words) {
      for (const lvl of w.level) {
        const lvlLower = lvl.toLowerCase();
        const levelKey = lvlLower.replace(/\s+/g, "");
        if (!deckMap.has(levelKey)) {
          const hskDisplay = lvl.toUpperCase().replace("HSK", "HSK ");
          deckMap.set(levelKey, {
            title: `${hskDisplay} - Từ Vựng Chi Tiết`,
            hskLevel: hskDisplay.trim(),
            levelKey,
            words: [],
          });
        }
        deckMap.get(levelKey)!.words.push(w);
      }
    }

    // Convert to array of HskDeck
    const decks = Array.from(deckMap.entries()).map(([levelKey, data]) => ({
      id: `deck-${levelKey}`,
      hskLevel: data.hskLevel,
      title: data.title,
      totalWords: data.words.length,
      newWordsCount: Math.min(data.words.length, 50),
      reviewWordsCount: 0,
      subtitle: `Danh sách ${data.words.length} từ`,
      category: levelKey as any,
      levelKey,
      page: 1,
      limit: 50,
      isBookmarked: false,
    }));

    return res.status(200).json({
      success: true,
      totalDecks: decks.length,
      decks,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vocabulary/deck-words - Lấy danh sách từ vựng trong 1 bộ bài học
router.get("/deck-words", async (req: Request, res: Response) => {
  try {
    const { levelKey, page = "1", limit = "50", search = "" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filter: any = {
      level: { $regex: levelKey as string, $options: "i" },
    };
    if (search) {
      filter.$or = [
        { simplified: { $regex: search as string, $options: "i" } },
        { pinyin: { $regex: search as string, $options: "i" } },
        { meanings: { $regex: search as string, $options: "i" } },
      ];
    }

    const total = await Vocabulary.countDocuments(filter);
    const words = await Vocabulary.find(filter)
      .sort({ frequency: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      words,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vocabulary - Lấy danh sách từ vựng (phân trang, lọc level, tìm kiếm)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { level = "all", search = "", page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const levelFilter = buildLevelFilter(level as string);
    const filter: any = levelFilter || {};
    if (search && typeof search === "string" && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { simplified: searchRegex },
        { pinyin: searchRegex },
        { meanings: searchRegex },
        { traditional: searchRegex },
      ];
    }

    const total = await Vocabulary.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    const words = await Vocabulary.find(filter)
      .sort({ frequency: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      words,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/vocabulary/:id - Chi tiết từ vựng theo ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const word = await Vocabulary.findById(id).lean();

    if (!word) {
      return res
        .status(404)
        .json({ success: false, error: "Vocabulary not found" });
    }

    return res.status(200).json({ success: true, word });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
