import { Router, Request, Response } from 'express';
import Vocabulary from '../models/Vocabulary.js';

const router = Router();

/**
 * HSK 3.0 Level Mapping Helper
 * Converts input level (e.g. '1', 'hsk1', 'new-1') into MongoDB level query array/regex
 */
function getHsk3LevelTag(lvl: string): string | null {
  const normalized = lvl.trim().toLowerCase().replace('hsk', '').replace('new-', '');
  switch (normalized) {
    case '1':
      return 'new-1';
    case '2':
      return 'new-2';
    case '3':
      return 'new-3';
    case '4':
      return 'new-4';
    case '5':
      return 'new-5';
    case '6':
      return 'new-6';
    case '7':
    case '8':
    case '9':
    case '7-9':
    case '7_9':
      return 'new-7';
    default:
      return null;
  }
}

// GET /api/vocabulary/stats - Lấy thống kê số lượng từ HSK 3.0 từng cấp độ
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats: Record<string, number> = {};

    const levels = ['new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7'];

    await Promise.all(
      levels.map(async (lvl) => {
        const count = await Vocabulary.countDocuments({ level: lvl });
        stats[lvl] = count;
      })
    );

    const totalWords = await Vocabulary.countDocuments();

    return res.status(200).json({
      success: true,
      hsk3Stats: {
        hsk1: stats['new-1'] || 0,
        hsk2: stats['new-2'] || 0,
        hsk3: stats['new-3'] || 0,
        hsk4: stats['new-4'] || 0,
        hsk5: stats['new-5'] || 0,
        hsk6: stats['new-6'] || 0,
        hsk7_9: stats['new-7'] || 0,
      },
      totalWords,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vocabulary/decks - Lấy danh sách các BỘ BÀI HỌC (Decks) được gom nhóm theo HSK 3.0
router.get('/decks', async (req: Request, res: Response) => {
  try {
    const { level = 'all', search } = req.query;

    const levelsToProcess = level === 'all'
      ? ['new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7']
      : [getHsk3LevelTag(level as string)].filter(Boolean) as string[];

    const WORDS_PER_DECK = 50;
    const allDecks: any[] = [];

    for (const lvlTag of levelsToProcess) {
      const levelNum = lvlTag.replace('new-', '');
      const hskTitle = levelNum === '7' ? 'HSK 7-9' : `HSK ${levelNum}`;

      const query: Record<string, any> = { level: lvlTag };
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

        allDecks.push({
          id: `${lvlTag}-deck-${deckIndex}`,
          hskLevel: hskTitle,
          title: `${hskTitle} - BộBài Học ${deckIndex} (${startNum} - ${endNum})`,
          totalWords: count,
          newWordsCount: count,
          reviewWordsCount: 0,
          subtitle: `Danh sách ${count} từ vựng HSK 3.0`,
          category: `hsk${levelNum}`,
          levelKey: lvlTag,
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

// GET /api/vocabulary/deck-words - Lấy danh sách từ vựng chi tiết của 1 Bộ bài học
router.get('/deck-words', async (req: Request, res: Response) => {
  try {
    const { levelKey, page = '1', limit = '50', search } = req.query;

    const query: Record<string, any> = {};

    if (levelKey && typeof levelKey === 'string') {
      query.level = levelKey;
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [words, total] = await Promise.all([
      Vocabulary.find(query)
        .sort({ frequency: 1, _id: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vocabulary.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      words,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vocabulary - Lấy danh sách từ vựng HSK 3.0 (phân trang, lọc level, tìm kiếm)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { level, search, page = '1', limit = '20' } = req.query;

    const query: Record<string, any> = {};

    if (level && typeof level === 'string' && level !== 'all') {
      const hsk3Tag = getHsk3LevelTag(level);
      if (hsk3Tag) {
        query.level = hsk3Tag;
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [words, total] = await Promise.all([
      Vocabulary.find(query)
        .sort({ frequency: 1, _id: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vocabulary.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      words,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/vocabulary/:id - Lấy thông tin chi tiết từ vựng theo ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const word = await Vocabulary.findById(id).lean();

    if (!word) {
      return res.status(404).json({ success: false, error: 'Vocabulary word not found' });
    }

    return res.status(200).json({
      success: true,
      word,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
