import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import CommunityDeck from "../models/CommunityDeck.js";
import CommunityDeckComment from "../models/CommunityDeckComment.js";
import SavedDeck from "../models/SavedDeck.js";
import Vocabulary from "../models/Vocabulary.js";
import { attachUser } from "../middleware/auth.js";

const router = Router();

function normalizeStringList(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function canViewDeck(deck: any, currentUser: any): boolean {
  if (deck.status === "hidden") return false;
  if (deck.visibility === "public" || deck.visibility === "unlisted") return true;
  return Boolean(currentUser && String(deck.ownerId?._id || deck.ownerId) === String(currentUser._id));
}

function canEditDeck(deck: any, currentUser: any): boolean {
  return Boolean(currentUser && String(deck.ownerId) === String(currentUser._id));
}

function canManageComment(comment: any, deck: any, currentUser: any): boolean {
  if (!currentUser) return false;
  return (
    String(comment.authorId?._id || comment.authorId) === String(currentUser._id) ||
    canEditDeck(deck, currentUser) ||
    currentUser.role === "admin" ||
    currentUser.role === "moderator"
  );
}

async function decorateSavedState(decks: any[], currentUser: any) {
  if (!currentUser || decks.length === 0) {
    return decks.map((deck) => ({ ...deck, isSaved: false }));
  }

  const saved = await SavedDeck.find({
    userId: currentUser._id,
    deckType: "community",
    deckId: { $in: decks.map((deck) => deck._id) },
  })
    .select("deckId")
    .lean();
  const savedIds = new Set(saved.map((item) => String(item.deckId)));

  return decks.map((deck) => ({
    ...deck,
    isSaved: savedIds.has(String(deck._id)),
  }));
}

// GET /api/community-decks - Public community feed
router.get("/", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const { search = "", tag = "", page = "1", limit = "20", sort = "popular" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const filter: Record<string, any> = {
      visibility: "public",
      status: "published",
    };

    if (typeof search === "string" && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    if (typeof tag === "string" && tag.trim()) {
      filter.tags = tag.trim();
    }

    // Sort by popularity (saveCount) or recent (updatedAt)
    const sortOption: Record<string, 1 | -1> =
      sort === "recent" ? { updatedAt: -1 } : { saveCount: -1, updatedAt: -1 };

    const total = await CommunityDeck.countDocuments(filter);
    const decks = await CommunityDeck.find(filter)
      .populate("ownerId", "username email")
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
      decks: await decorateSavedState(decks, currentUser),
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/community-decks/my - Current user's decks
router.get("/my", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const decks = await CommunityDeck.find({ ownerId: currentUser._id })
      .populate("ownerId", "username email")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      decks: await decorateSavedState(decks, currentUser),
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/community-decks/:id - Deck detail
router.get("/:id", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id)
      .populate("ownerId", "username email")
      .populate("wordIds")
      .lean();

    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }

    if (!canViewDeck(deck, currentUser)) {
      return res.status(403).json({ error: "You cannot view this deck" });
    }

    const [decoratedDeck] = await decorateSavedState([deck], currentUser);
    return res.status(200).json({ success: true, deck: decoratedDeck });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/community-decks/:id/comments - Visible discussion for a deck
router.get("/:id/comments", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id).select("ownerId visibility status").lean();
    if (!deck) return res.status(404).json({ error: "Community deck not found" });
    if (!canViewDeck(deck, currentUser)) return res.status(403).json({ error: "You cannot view this deck" });

    const comments = await CommunityDeckComment.find({ deckId: id, status: "visible" })
      .populate("authorId", "username")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      comments: comments.map((comment) => ({ ...comment, canManage: canManageComment(comment, deck, currentUser) })),
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks/:id/comments - Add a discussion comment
router.post("/:id/comments", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) return res.status(401).json({ error: "User not authenticated" });

    const id = String(req.params.id);
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content) return res.status(400).json({ error: "Comment cannot be empty" });
    if (content.length > 1000) return res.status(400).json({ error: "Comment must be at most 1000 characters" });

    const deck = await CommunityDeck.findById(id);
    if (!deck) return res.status(404).json({ error: "Community deck not found" });
    if (!canViewDeck(deck, currentUser)) return res.status(403).json({ error: "You cannot comment on this deck" });

    const comment = await CommunityDeckComment.create({ deckId: deck._id, authorId: currentUser._id, content });
    deck.commentCount += 1;
    await deck.save();
    await comment.populate("authorId", "username");

    return res.status(201).json({
      success: true,
      comment: { ...comment.toObject(), canManage: true },
      commentCount: deck.commentCount,
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// DELETE /api/community-decks/:id/comments/:commentId - Remove own comment or moderate deck discussion
router.delete("/:id/comments/:commentId", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) return res.status(401).json({ error: "User not authenticated" });

    const id = String(req.params.id);
    const commentId = String(req.params.commentId);
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: "Invalid comment or deck ID" });
    }

    const [deck, comment] = await Promise.all([
      CommunityDeck.findById(id),
      CommunityDeckComment.findOne({ _id: commentId, deckId: id }),
    ]);
    if (!deck) return res.status(404).json({ error: "Community deck not found" });
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!canManageComment(comment, deck, currentUser)) {
      return res.status(403).json({ error: "You cannot remove this comment" });
    }

    await comment.deleteOne();
    deck.commentCount = Math.max(0, deck.commentCount - 1);
    await deck.save();
    return res.status(200).json({ success: true, commentCount: deck.commentCount });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks - Create deck
router.post("/", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { title, description = "", wordIds = [], visibility = "private", tags, hskLevels } = req.body;
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Deck title must be at least 3 characters" });
    }

    const uniqueWordIds = normalizeStringList(wordIds, 500).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const validWordCount = await Vocabulary.countDocuments({ _id: { $in: uniqueWordIds } });
    if (validWordCount !== uniqueWordIds.length) {
      return res.status(400).json({ error: "One or more word IDs are invalid" });
    }

    const deck = await CommunityDeck.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      ownerId: currentUser._id,
      wordIds: [...new Set(uniqueWordIds)],
      visibility: ["private", "public", "unlisted"].includes(visibility) ? visibility : "private",
      status: visibility === "public" ? "published" : "draft",
      tags: normalizeStringList(tags),
      hskLevels: normalizeStringList(hskLevels, 7),
    });

    const populated = await deck.populate("ownerId", "username email");
    return res.status(201).json({ success: true, deck: { ...populated.toObject(), isSaved: false } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// PATCH /api/community-decks/:id - Update deck
router.patch("/:id", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const { id } = req.params;
    const deck = await CommunityDeck.findById(id);

    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }
    if (!canEditDeck(deck, currentUser)) {
      return res.status(403).json({ error: "Only the owner can edit this deck" });
    }

    const { title, description, wordIds, visibility, tags, hskLevels } = req.body;
    if (typeof title === "string") deck.title = title.trim();
    if (typeof description === "string") deck.description = description.trim();
    if (["private", "public", "unlisted"].includes(visibility)) deck.visibility = visibility;
    if (Array.isArray(tags)) deck.tags = normalizeStringList(tags);
    if (Array.isArray(hskLevels)) deck.hskLevels = normalizeStringList(hskLevels, 7);
    if (Array.isArray(wordIds)) {
      const uniqueWordIds = [...new Set(normalizeStringList(wordIds, 500))].filter((wordId) =>
        mongoose.Types.ObjectId.isValid(wordId),
      );
      const validWordCount = await Vocabulary.countDocuments({ _id: { $in: uniqueWordIds } });
      if (validWordCount !== uniqueWordIds.length) {
        return res.status(400).json({ error: "One or more word IDs are invalid" });
      }
      deck.wordIds = uniqueWordIds.map((wordId) => new mongoose.Types.ObjectId(wordId));
    }

    await deck.save();
    const populated = await deck.populate("ownerId", "username email");
    return res.status(200).json({ success: true, deck: { ...populated.toObject(), isSaved: false } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks/:id/publish - Publish deck
router.post("/:id/publish", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const deck = await CommunityDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }
    if (!canEditDeck(deck, currentUser)) {
      return res.status(403).json({ error: "Only the owner can publish this deck" });
    }

    deck.status = "published";
    deck.visibility = "public";
    await deck.save();

    const populated = await deck.populate("ownerId", "username email");
    return res.status(200).json({ success: true, deck: { ...populated.toObject(), isSaved: false } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks/:id/save - Toggle save
router.post("/:id/save", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const deck = await CommunityDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: "Community deck not found" });
    }
    if (!canViewDeck(deck, currentUser)) {
      return res.status(403).json({ error: "You cannot save this deck" });
    }

    const existing = await SavedDeck.findOne({
      userId: currentUser._id,
      deckId: deck._id,
      deckType: "community",
    });

    const shouldSave = typeof req.body?.saved === "boolean" ? req.body.saved : !existing;
    if (shouldSave && !existing) {
      await SavedDeck.create({ userId: currentUser._id, deckId: deck._id, deckType: "community" });
      deck.saveCount += 1;
      await deck.save();
    }
    if (!shouldSave && existing) {
      await existing.deleteOne();
      deck.saveCount = Math.max(0, deck.saveCount - 1);
      await deck.save();
    }

    return res.status(200).json({ success: true, isSaved: shouldSave, saveCount: deck.saveCount });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks/:id/fork - Copy a public deck into my decks
router.post("/:id/fork", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const source = await CommunityDeck.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: "Community deck not found" });
    }
    if (!canViewDeck(source, currentUser)) {
      return res.status(403).json({ error: "You cannot fork this deck" });
    }

    const forked = await CommunityDeck.create({
      title: `${source.title} (bản sao)`,
      description: source.description,
      ownerId: currentUser._id,
      wordIds: source.wordIds,
      visibility: "private",
      status: "draft",
      tags: source.tags,
      hskLevels: source.hskLevels,
      sourceDeckId: source._id,
    });

    source.forkCount += 1;
    await source.save();

    const populated = await forked.populate("ownerId", "username email");
    return res.status(201).json({ success: true, deck: { ...populated.toObject(), isSaved: false } });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/community-decks/:id/forks - List all public forks of a deck
router.get("/:id/forks", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id).select("_id visibility status").lean();
    if (!deck) return res.status(404).json({ error: "Community deck not found" });
    if (!canViewDeck(deck, currentUser)) return res.status(403).json({ error: "You cannot view this deck" });

    const forks = await CommunityDeck.find({ sourceDeckId: id, visibility: "public", status: "published" })
      .populate("ownerId", "username")
      .sort({ saveCount: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      forks: await decorateSavedState(forks, currentUser),
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// GET /api/community-decks/:id/ancestors - Lineage chain (source → source → root)
router.get("/:id/ancestors", attachUser, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    let current = await CommunityDeck.findById(id)
      .populate("ownerId", "username")
      .select("title sourceDeckId ownerId")
      .lean();

    if (!current) return res.status(404).json({ error: "Community deck not found" });

    const lineage: Array<{ _id: string; title: string; username: string }> = [
      { _id: String(current._id), title: current.title, username: (current.ownerId as any)?.username || "unknown" },
    ];

    while (current?.sourceDeckId) {
      current = await CommunityDeck.findById(current.sourceDeckId)
        .populate("ownerId", "username")
        .select("title sourceDeckId ownerId")
        .lean();

      if (current) {
        lineage.unshift({
          _id: String(current._id),
          title: current.title,
          username: (current.ownerId as any)?.username || "unknown",
        });
      } else {
        break;
      }
    }

    return res.status(200).json({ success: true, lineage });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// POST /api/community-decks/:id/report - Report a deck
router.post("/:id/report", attachUser, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid deck ID" });
    }

    const deck = await CommunityDeck.findById(id).select("_id visibility status").lean();
    if (!deck) return res.status(404).json({ error: "Community deck not found" });
    if (!canViewDeck(deck, currentUser)) return res.status(403).json({ error: "You cannot view this deck" });

    const { default: DeckReport } = await import("../models/DeckReport.js");
    const existingReport = await DeckReport.findOne({
      deckId: id,
      reporterId: currentUser._id,
      status: "pending",
    });

    if (existingReport) {
      return res.status(409).json({ error: "You already reported this deck" });
    }

    const { reason = "other", description = "" } = req.body;
    const validReasons = ["spam", "inappropriate", "wrong_topic", "duplicate", "other"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: `Invalid reason. Must be one of: ${validReasons.join(", ")}` });
    }

    const report = await DeckReport.create({
      deckId: id,
      reporterId: currentUser._id,
      reason,
      description: typeof description === "string" ? description.trim().slice(0, 500) : "",
    });

    return res.status(201).json({
      success: true,
      report: {
        _id: report._id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) return res.status(500).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

export default router;
