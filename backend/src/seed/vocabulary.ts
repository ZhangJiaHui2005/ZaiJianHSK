import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Vocabulary from '../models/Vocabulary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_SIZE = 500;

interface RawForm {
  traditional: string;
  transcriptions: {
    pinyin: string;
    numeric: string;
    wadegiles?: string;
    bopomofo?: string;
    romatzyh?: string;
  };
  meanings: string[];
  classifiers: string[];
}

interface RawEntry {
  simplified: string;
  radical: string;
  level: string[];
  frequency: number;
  pos: string[];
  forms: RawForm[];
}

function findCompleteJson(): string {
  const paths = [
    path.resolve(process.cwd(), 'complete.json'),
    path.resolve(__dirname, '../../../complete.json'),
    path.resolve(__dirname, '../../complete.json'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return paths[0];
}

async function seedVocabulary() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const filePath = findCompleteJson();
    if (!fs.existsSync(filePath)) {
      console.error('complete.json not found. Please place it in the project root (d:/ZaiJianHSK/complete.json)');
      process.exit(1);
    }

    console.log('Reading ' + filePath + '...');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const entries: RawEntry[] = JSON.parse(rawData);

    console.log('Total entries in JSON: ' + entries.length);

    const count = await Vocabulary.countDocuments();
    if (count > 0) {
      console.log('Vocabulary collection already has ' + count + ' documents.');
      console.log('Skipping seed. To re-seed, drop the collection first: db.vocabularies.drop()');
      await mongoose.disconnect();
      return;
    }

    let inserted = 0;
    let skipped = 0;
    let batch: any[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (!entry.forms || entry.forms.length === 0) {
        skipped++;
        continue;
      }

      const form = entry.forms[0];

      const doc = {
        simplified: entry.simplified,
        traditional: form.traditional || entry.simplified,
        radical: entry.radical || '',
        pinyin: form.transcriptions?.pinyin || '',
        numeric: form.transcriptions?.numeric || '',
        meanings: form.meanings || [],
        level: Array.isArray(entry.level) ? entry.level : [],
        frequency: entry.frequency || 999999,
        pos: Array.isArray(entry.pos) ? entry.pos : [],
        classifiers: form.classifiers || [],
      };

      batch.push(doc);

      if (batch.length >= BATCH_SIZE) {
        try {
          await Vocabulary.insertMany(batch, { ordered: false });
          inserted += batch.length;
          process.stdout.write('\rInserted ' + inserted + '/' + entries.length + ' (skipped ' + skipped + ')');
        } catch (err: any) {
          inserted += batch.length;
          process.stdout.write('\rInserted ' + inserted + '/' + entries.length + ' (some duplicates skipped)');
        }
        batch = [];
      }

      if ((i + 1) % 10000 === 0) {
        console.log('\nProgress: ' + (i + 1) + '/' + entries.length);
      }
    }

    if (batch.length > 0) {
      try {
        await Vocabulary.insertMany(batch, { ordered: false });
        inserted += batch.length;
      } catch (err: any) {
        inserted += batch.length;
      }
    }

    const total = await Vocabulary.countDocuments();
    console.log('\n');
    console.log('Seed completed!');
    console.log('   Total entries in JSON: ' + entries.length);
    console.log('   Total inserted: ' + inserted);
    console.log('   Total skipped (no forms): ' + skipped);
    console.log('   Total in MongoDB collection: ' + total);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedVocabulary();
