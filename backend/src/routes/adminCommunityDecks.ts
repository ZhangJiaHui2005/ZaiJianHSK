import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import CommunityDeck from "../models/CommunityDeck.js";
import CommunityDeckComment from "../models/CommunityDeckComment.js";
import SavedDeck from "../models/SavedDeck.js";
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

// GET /api/admin/community-decks - List all community decks with filters
router.get("/", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      search = "",
      visibility = "",
      status = "",
      page = "1",
      limit = "20",
      sort = "updatedAt",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

    const filter: Record<string, any> = {};

    // Filter by visibility
    if (typeof visibility === "string" && ["public", "private", "unlisted"].includes(visibility)) {
      filter.visibility = visibility;
    }

    // Filter by status
    if (typeof status === "string" && ["published", "draft", "hidden"].includes(status)) {
      filter.status = status;
    }

    // Search by title or owner
    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      // We'll first find matching users, then search by title
      const { default: User } = await import("../models/Users.js");
      const matchingUsers = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex },
        ],
      }).select("_id").lean();

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { title: searchRegex },
        { ownerId: { $in: userIds } },
      ];
    }

    // Sort options
    const sortOption: Record<string, 1 | -1> = {};
    if (sort === "title") {
      sortOption.title = 1;
    } else if (sort === "saveCount") {
      sortOption.saveCount = -1;
    } else if (sort === "createdAt") {
      sortOption.createdAt = -1;
    } else {
      sortOption.updatedAt = -1;
    }

    const total = await CommunityDeck.countDocuments(filter);
    const decks = await CommunityDeck.find(filter)
      .populate("ownerId", "username email")
      .populate("wordIds", "simplified pinyin")
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      decks,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// DELETE /api/admin/community-decks/:id - Admin delete a deck permanently
router.delete("/:id", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }

    // Clean up related data
    await Promise.all([
      SavedDeck.deleteMany({ deckId: id, deckType: "community" }),
      CommunityDeckComment.deleteMany({ deckId: id }),
      DeckReport.deleteMany({ deckId: id }),
    ]);

    // Delete the deck
    const deletedDeck = await CommunityDeck.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Deck "${deletedDeck?.title || id}" has been permanently deleted`,
      deck: {
        _id: deletedDeck?._id,
        title: deletedDeck?.title,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/admin/community-decks/:id/hide - Admin hide a deck
router.patch("/:id/hide", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }

    deck.status = "hidden";
    await deck.save();

    return res.status(200).json({
      success: true,
      message: `Deck "${deck.title}" has been hidden`,
      deck: {
        _id: deck._id,
        title: deck.title,
        status: deck.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/admin/community-decks/:id/unhide - Admin unhide a deck
router.patch("/:id/unhide", attachUser, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }

    // Restore to published if hidden, otherwise keep current status
    if (deck.status === "hidden") {
      deck.status = "published";
      await deck.save();
    }

    return res.status(200).json({
      success: true,
      message: `Deck "${deck.title}" has been unhidden`,
      deck: {
        _id: deck._id,
        title: deck.title,
        status: deck.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;

