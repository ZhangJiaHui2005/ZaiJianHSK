export type HskLevelKey = 'all' | 'hsk1' | 'hsk2' | 'hsk3' | 'hsk4' | 'hsk5' | 'hsk6' | 'topics' | 'community';

export interface HskCategoryFilter {
  id: HskLevelKey;
  label: string;
  count?: number;
  badge?: string;
}

export interface VocabFolderItem {
  id: string;
  type: 'folder';
  title: string;
  hskLevel: string; // 'HSK 1' | 'HSK 2' ...
  subTags: string[]; // e.g. ['Phần 1', 'Phần 2']
  extraCountText?: string; // e.g. '+7 mục khác'
  category: HskLevelKey;
}

export interface VocabSetItem {
  id: string;
  type: 'deck';
  title: string;
  hskLevel: string;
  totalWords: number;
  newWordsCount: number;
  reviewWordsCount: number;
  isBookmarked?: boolean;
  category: HskLevelKey;
  subtitle?: string; // e.g. 'Danh sách'
}

export type VocabItem = VocabFolderItem | VocabSetItem;

export const HSK_CATEGORIES: HskCategoryFilter[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'hsk1', label: 'HSK 1', count: 150, badge: 'Sơ cấp 1' },
  { id: 'hsk2', label: 'HSK 2', count: 150, badge: 'Sơ cấp 2' },
  { id: 'hsk3', label: 'HSK 3', count: 300, badge: 'Trung cấp 1' },
  { id: 'hsk4', label: 'HSK 4', count: 600, badge: 'Trung cấp 2' },
  { id: 'hsk5', label: 'HSK 5', count: 1300, badge: 'Cao cấp 1' },
  { id: 'hsk6', label: 'HSK 6', count: 2500, badge: 'Cao cấp 2' },
  { id: 'topics', label: 'Chủ đề', count: 12 },
  { id: 'community', label: 'Kho cộng đồng', count: 8 },
];

export const MOCK_VOCAB_ITEMS: VocabItem[] = [
  // --- FOLDERS (Bộ tổng hợp) ---
  {
    id: 'folder-hsk1-essential',
    type: 'folder',
    title: 'HSK 1 - 150 Từ Vựng Căn Bản (Chuẩn Hanban)',
    hskLevel: 'HSK 1',
    subTags: ['Phần 1 (1-50)', 'Phần 2 (51-100)', 'Phần 3 (101-150)'],
    category: 'hsk1',
  },
  {
    id: 'folder-hsk2-listening',
    type: 'folder',
    title: 'HSK 2 - Bộ Từ Vựng Kèm Audio Nghe Chuẩn',
    hskLevel: 'HSK 2',
    subTags: ['Bài 1 - 5', 'Bài 6 - 10', 'Bài 11 - 15'],
    extraCountText: '+5 mục khác',
    category: 'hsk2',
  },
  {
    id: 'folder-hsk3-grammar',
    type: 'folder',
    title: 'HSK 3 - Cụm Từ & Ngữ Pháp Trọng Tâm',
    hskLevel: 'HSK 3',
    subTags: ['Động từ thường gặp', 'Phó từ chỉ tần suất', 'Lượng từ HSK 3'],
    extraCountText: '+4 mục khác',
    category: 'hsk3',
  },

  // --- DECKS / SETS (Bộ học chi tiết) ---
  {
    id: 'deck-hsk4-reading',
    type: 'deck',
    title: 'Reading HSK 4 - Từ Vựng Bài Đọc Hiểu 2026',
    hskLevel: 'HSK 4',
    totalWords: 82,
    newWordsCount: 82,
    reviewWordsCount: 0,
    isBookmarked: true,
    category: 'hsk4',
    subtitle: 'Danh sách từ bám sát đề thi',
  },
  {
    id: 'deck-hsk4-listening',
    type: 'deck',
    title: 'Listening HSK 4 - Từ Vựng Hội Thoại Đề Thi',
    hskLevel: 'HSK 4',
    totalWords: 120,
    newWordsCount: 45,
    reviewWordsCount: 12,
    isBookmarked: false,
    category: 'hsk4',
    subtitle: 'Danh sách phát âm chuẩn Bắc Kinh',
  },
  {
    id: 'deck-hsk5-chengyu',
    type: 'deck',
    title: 'HSK 5 - 100 Thành Ngữ 4 Chữ (成语) Thường Gặp',
    hskLevel: 'HSK 5',
    totalWords: 100,
    newWordsCount: 100,
    reviewWordsCount: 0,
    isBookmarked: true,
    category: 'hsk5',
    subtitle: 'Kèm ví dụ & phiên âm Pinyin',
  },
  {
    id: 'deck-hsk1-daily',
    type: 'deck',
    title: 'HSK 1 - Từ Vựng Giao Tiếp Chào Hỏi & Con Số',
    hskLevel: 'HSK 1',
    totalWords: 50,
    newWordsCount: 20,
    reviewWordsCount: 5,
    isBookmarked: false,
    category: 'hsk1',
    subtitle: 'Dành cho người mới bắt đầu',
  },
  {
    id: 'deck-hsk6-advanced',
    type: 'deck',
    title: 'HSK 6 - Từ Vựng Chuyên Ngành Kinh Tế & Xã Hội',
    hskLevel: 'HSK 6',
    totalWords: 250,
    newWordsCount: 250,
    reviewWordsCount: 0,
    isBookmarked: false,
    category: 'hsk6',
    subtitle: 'Trình độ Cao cấp HSK 6',
  },
  {
    id: 'deck-topic-business',
    type: 'deck',
    title: 'Chủ Đề - Tiếng Trung Thương Mại & Phỏng Vấn',
    hskLevel: 'Chủ đề',
    totalWords: 180,
    newWordsCount: 120,
    reviewWordsCount: 30,
    isBookmarked: true,
    category: 'topics',
    subtitle: 'Ứng dụng thực tế công sở',
  },
  {
    id: 'deck-topic-travel',
    type: 'deck',
    title: 'Chủ Đề - Tiếng Trung Du Lịch & Gọi Món Ăn',
    hskLevel: 'Chủ đề',
    totalWords: 95,
    newWordsCount: 95,
    reviewWordsCount: 0,
    isBookmarked: false,
    category: 'topics',
    subtitle: 'Khám phá văn hóa & du lịch Trung Quốc',
  },
  {
    id: 'deck-hsk3-hanzi',
    type: 'deck',
    title: 'HSK 3 - 300 Hán Tự Có Bộ Thủ Cùng Loại',
    hskLevel: 'HSK 3',
    totalWords: 300,
    newWordsCount: 150,
    reviewWordsCount: 40,
    isBookmarked: false,
    category: 'hsk3',
    subtitle: 'Nắm vững quy tắc viết & bộ thủ',
  },
  {
    id: 'deck-community-slang',
    type: 'deck',
    title: 'Bộ Cộng Đồng - Từ Lóng Mạng Tiếng Trung (网络流行语)',
    hskLevel: 'Cộng đồng',
    totalWords: 60,
    newWordsCount: 60,
    reviewWordsCount: 0,
    isBookmarked: false,
    category: 'community',
    subtitle: 'Chia sẻ bởi thành viên ZaiJianHSK',
  },
];
