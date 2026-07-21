import { Router, Request, Response } from "express";
import User from "../models/Users.js";
import Vocabulary from "../models/Vocabulary.js";
import PendingVocabulary from "../models/PendingVocabulary.js";

const router = Router();

<<<<<<< Updated upstream
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
=======
/**
 * Returns level values for MongoDB $elemMatch $in query
 * Supports both 'new-*' and 'newest-*' formats
 */
function getLevelValues(lvl: string): string[] {
  const n = lvl.trim().toLowerCase().replace('hsk', '').replace('newest-', '').replace('new-', '');
  switch (n) {
    case '1': return ['new-1', 'newest-1'];
    case '2': return ['new-2', 'newest-2'];
    case '3': return ['new-3', 'newest-3'];
    case '4': return ['new-4', 'newest-4'];
    case '5': return ['new-5', 'newest-5'];
    case '6': return ['new-6', 'newest-6'];
    case '7': case '8': case '9': case '7-9': case '7_9':
      return ['new-7', 'newest-7'];
    default: return [];
  }
}

/**
 * Build a level query that works with array field `level: ["new-7"]` or `level: ["newest-3", "new-4"]`
 */
function buildLevelQuery(levelValues: string[]): Record<string, any> {
  if (levelValues.length === 0) return {};
  return { level: { $elemMatch: { $in: levelValues } } };
}

// GET /api/vocabulary/stats - Thống kê số lượng từ vựng theo từng cấp độ HSK 3.0
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const pairs = [
      { key: 'hsk1', levels: ['new-1', 'newest-1'] },
      { key: 'hsk2', levels: ['new-2', 'newest-2'] },
      { key: 'hsk3', levels: ['new-3', 'newest-3'] },
      { key: 'hsk4', levels: ['new-4', 'newest-4'] },
      { key: 'hsk5', levels: ['new-5', 'newest-5'] },
      { key: 'hsk6', levels: ['new-6', 'newest-6'] },
      { key: 'hsk7_9', levels: ['new-7', 'newest-7'] },
    ];

    const stats: Record<string, number> = {};

    await Promise.all(
      pairs.map(async ({ key, levels }) => {
        const query = buildLevelQuery(levels);
        const count = await Vocabulary.countDocuments(query);
        stats[key] = count;
      })
    );
>>>>>>> Stashed changes

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
        return res.status(400).json({
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
        return res.status(400).json({
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
      const key = item._id.toLowerCase().replace(/\s+/g, "");
      if (key in hskStats) {
        hskStats[key] = item.count;
      }
    }

    return res.status(200).json({
      success: true,
<<<<<<< Updated upstream
      hsk3Stats: hskStats,
=======
      hsk3Stats: stats,
>>>>>>> Stashed changes
      totalWords,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

<<<<<<< Updated upstream
// GET /api/vocabulary/decks - Lấy danh sách bộ bài học theo HSK level & search
router.get("/decks", async (req: Request, res: Response) => {
=======
// GET /api/vocabulary/decks - Lấy danh sách bộ bài học (decks) tự động từ vocabularies
router.get('/decks', async (req: Request, res: Response) => {
>>>>>>> Stashed changes
  try {
    const { level = "all", search = "" } = req.query;

<<<<<<< Updated upstream
    // Build query filter
    const filter: any = {};
    if (level && level !== "all" && level !== "7") {
      filter.level = { $regex: level as string, $options: "i" };
    } else if (level === "7") {
      filter.level = { $regex: "hsk[789]", $options: "i" };
    }
    if (search) {
      filter.$or = [
        { simplified: { $regex: search as string, $options: "i" } },
        { pinyin: { $regex: search as string, $options: "i" } },
        { meanings: { $regex: search as string, $options: "i" } },
      ];
    }

    // Get all matching words to build decks
    const words = await Vocabulary.find(filter)
      .select("simplified traditional pinyin meanings level")
      .sort({ level: 1, simplified: 1 })
      .limit(2000);
=======
    const levelPairs = level === 'all'
      ? [
          { levels: ['new-1', 'newest-1'], num: '1' },
          { levels: ['new-2', 'newest-2'], num: '2' },
          { levels: ['new-3', 'newest-3'], num: '3' },
          { levels: ['new-4', 'newest-4'], num: '4' },
          { levels: ['new-5', 'newest-5'], num: '5' },
          { levels: ['new-6', 'newest-6'], num: '6' },
          { levels: ['new-7', 'newest-7'], num: '7' },
        ]
      : (() => {
          const vals = getLevelValues(level as string);
          if (vals.length === 0) return [];
          return [{ levels: vals, num: vals[0].replace('new-', '').replace('newest-', '') }];
        })();

    const WORDS_PER_DECK = 250;
    const allDecks: any[] = [];

    for (const { levels, num } of levelPairs) {
      const hskTitle = num === '7' ? 'HSK 7-9' : `HSK ${num}`;

      const levelQuery = buildLevelQuery(levels);
      const query: Record<string, any> = { ...levelQuery };

      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { simplified: searchRegex },
          { pinyin: searchRegex },
          { meanings: searchRegex },
          { traditional: searchRegex },
        ];
      }

      const totalWords = await Vocabulary.countDocuments(query);
      const totalDecksCount = Math.ceil(totalWords / WORDS_PER_DECK);

      for (let i = 0; i < totalDecksCount; i++) {
        const deckIndex = i + 1;
        const startNum = i * WORDS_PER_DECK + 1;
        const endNum = Math.min((i + 1) * WORDS_PER_DECK, totalWords);
        const count = endNum - startNum + 1;
        const levelKey = `newest-${num}`;

        allDecks.push({
          id: `${levelKey}-deck-${deckIndex}`,
          hskLevel: hskTitle,
          title: `${hskTitle} - Bộ Bài Học ${deckIndex} (${startNum} - ${endNum})`,
          totalWords: count,
          newWordsCount: count,
          reviewWordsCount: 0,
          subtitle: `Danh sách ${count} từ vựng HSK 3.0`,
          category: `hsk${num}`,
          levelKey,
          page: deckIndex,
          limit: WORDS_PER_DECK,
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalDecks: allDecks.length,
      decks: allDecks,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vocabulary/deck-words - Lấy từ vựng chi tiết của 1 deck
router.get('/deck-words', async (req: Request, res: Response) => {
  try {
    const { levelKey, page = '1', limit = '250', search } = req.query;

    const query: Record<string, any> = {};

    if (levelKey && typeof levelKey === 'string') {
      const levelValues = getLevelValues(levelKey.replace('newest-', ''));
      if (levelValues.length > 0) {
        Object.assign(query, buildLevelQuery(levelValues));
      } else {
        query.level = { $elemMatch: { $eq: levelKey } };
      }
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { simplified: searchRegex },
        { pinyin: searchRegex },
        { meanings: searchRegex },
        { traditional: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(250, Math.max(1, parseInt(limit as string, 10) || 250));
    const skip = (pageNum - 1) * limitNum;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
// GET /api/vocabulary - Lấy danh sách từ vựng (phân trang, lọc level, tìm kiếm)
router.get("/", async (req: Request, res: Response) => {
=======
// GET /api/vocabulary - Danh sách từ vựng (phân trang, lọc level, tìm kiếm)
router.get('/', async (req: Request, res: Response) => {
>>>>>>> Stashed changes
  try {
    const { level = "all", search = "", page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

<<<<<<< Updated upstream
    const filter: any = {};
    if (level && level !== "all") {
      filter.level = { $regex: level as string, $options: "i" };
=======
    const query: Record<string, any> = {};

    if (level && typeof level === 'string' && level !== 'all') {
      const levelValues = getLevelValues(level);
      if (levelValues.length > 0) {
        Object.assign(query, buildLevelQuery(levelValues));
      }
>>>>>>> Stashed changes
    }
    if (search) {
      filter.$or = [
        { simplified: { $regex: search as string, $options: "i" } },
        { pinyin: { $regex: search as string, $options: "i" } },
        { meanings: { $regex: search as string, $options: "i" } },
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

<<<<<<< Updated upstream
// ==================== USER ROUTES ====================
=======
// GET /api/vocabulary/:id - Chi tiết từ vựng theo ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const word = await Vocabulary.findById(id).lean();
>>>>>>> Stashed changes

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
