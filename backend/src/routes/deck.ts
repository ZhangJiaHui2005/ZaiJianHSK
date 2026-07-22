import { Router, Request, Response } from "express";
import Deck from "../models/Deck.js";

const router = Router();

// GET /api/decks - Lấy danh sách tất cả decks, phân theo level
router.get("/", async (req: Request, res: Response) => {
  try {
    const { level } = req.query;

    const query: Record<string, any> = {};
    if (level && level !== "all") {
      query.hskLevel = level;
    }

    const decks = await Deck.find(query)
      .sort({ hskLevel: 1, order: 1 })
      .select("-wordIds")
      .lean();

    return res.status(200).json({
      success: true,
      totalDecks: decks.length,
      decks,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// GET /api/decks/stats - Thống kê số lượng decks và words theo level
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await Deck.aggregate([
      {
        $group: {
          _id: "$hskLevel",
          totalDecks: { $sum: 1 },
          totalWords: { $sum: "$totalWords" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalDecks = await Deck.countDocuments();
    const totalWords = await Deck.aggregate([
      { $group: { _id: null, total: { $sum: "$totalWords" } } },
    ]);

    return res.status(200).json({
      success: true,
      stats,
      totalDecks,
      totalWords: totalWords[0]?.total || 0,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// GET /api/decks/by-levels - Lấy danh sách decks theo các HSK level (dùng cho approve dialog)
router.get("/by-levels", async (req: Request, res: Response) => {
  try {
    const { levels } = req.query;

    if (!levels || typeof levels !== "string") {
      return res.status(200).json({
        success: true,
        decks: [],
      });
    }

    const levelArray = levels
      .split(",")
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (levelArray.length === 0) {
      return res.status(200).json({
        success: true,
        decks: [],
      });
    }

    const decks = await Deck.find({ hskLevel: { $in: levelArray } })
      .sort({ hskLevel: 1, order: 1 })
      .select("_id name hskLevel order totalWords")
      .lean();

    return res.status(200).json({
      success: true,
      decks,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// GET /api/decks/:id - Lấy deck chi tiết kèm danh sách từ vựng
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deck = await Deck.findById(id).populate("wordIds").lean();

    if (!deck) {
      return res.status(404).json({ success: false, error: "Deck not found" });
    }

    return res.status(200).json({
      success: true,
      deck,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

export default router;
