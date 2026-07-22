import mongoose from 'mongoose';
import '../config/loadEnv.js';
import Vocabulary from '../models/Vocabulary.js';
import Deck from '../models/Deck.js';

const MAX_WORDS_PER_DECK = 250;

const HSK_LEVELS = [
  { tag: 'newest-1', label: 'HSK 1' },
  { tag: 'newest-2', label: 'HSK 2' },
  { tag: 'newest-3', label: 'HSK 3' },
  { tag: 'newest-4', label: 'HSK 4' },
  { tag: 'newest-5', label: 'HSK 5' },
  { tag: 'newest-6', label: 'HSK 6' },
  { tag: 'newest-7', label: 'HSK 7-9' },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function seedDecks() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Check if decks already exist
    const existingDecks = await Deck.countDocuments();
    if (existingDecks > 0) {
      console.log(`Decks collection already has ${existingDecks} decks.`);
      console.log('Dropping existing decks to re-seed...');
      await Deck.deleteMany({});
      console.log('Existing decks dropped.');
    }

    let totalDecksCreated = 0;

    for (const level of HSK_LEVELS) {
      console.log(`\nProcessing ${level.label} (${level.tag})...`);

      // Get all vocabulary IDs for this level
      const words = await Vocabulary.find({ level: level.tag })
        .select('_id simplified')
        .lean();

      if (words.length === 0) {
        console.log(`  No words found for ${level.label}, skipping.`);
        continue;
      }

      console.log(`  Found ${words.length} words.`);

      // Random shuffle the words
      const shuffledWordIds = shuffleArray(words.map(w => w._id));

      // Split into decks (max 250 words each)
      const totalDecks = Math.ceil(shuffledWordIds.length / MAX_WORDS_PER_DECK);

      const decksToInsert = [];

      for (let i = 0; i < totalDecks; i++) {
        const start = i * MAX_WORDS_PER_DECK;
        const end = Math.min((i + 1) * MAX_WORDS_PER_DECK, shuffledWordIds.length);
        const deckWordIds = shuffledWordIds.slice(start, end);
        const deckNumber = i + 1;

        decksToInsert.push({
          name: `${level.label} - Bộ ${deckNumber}`,
          hskLevel: level.tag,
          wordIds: deckWordIds,
          totalWords: deckWordIds.length,
          order: deckNumber,
        });
      }

      await Deck.insertMany(decksToInsert);
      totalDecksCreated += decksToInsert.length;

      console.log(`  Created ${decksToInsert.length} decks (${decksToInsert.map(d => d.totalWords).join(', ')} words each)`);
    }

    const totalDecks = await Deck.countDocuments();
    console.log(`\n✅ Seed completed!`);
    console.log(`   Total decks created: ${totalDecks}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDecks();
