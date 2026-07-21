const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export interface CreateUserParams {
  clerkId: string
  username: string | null
  email: string
}

export interface UserResponse {
  message: string
  user: {
    _id: string
    clerkId: string
    username: string
    email: string
    createdAt: string
    updatedAt: string
  }
}

export interface VocabularyWord {
  _id: string
  simplified: string
  traditional?: string
  radical?: string
  pinyin: string
  numeric?: string
  meanings: string[]
  level: string[]
  frequency: number
  pos: string[]
  classifiers: string[]
}

export interface Hsk3StatsResponse {
  success: boolean
  hsk3Stats: {
    hsk1: number
    hsk2: number
    hsk3: number
    hsk4: number
    hsk5: number
    hsk6: number
    hsk7_9: number
  }
  totalWords: number
}

export interface HskDeck {
  id: string
  hskLevel: string
  title: string
  totalWords: number
  newWordsCount: number
  reviewWordsCount: number
  subtitle: string
  category: string
  levelKey: string
  page: number
  limit: number
  isBookmarked?: boolean
}

export interface HskDecksResponse {
  success: boolean
  totalDecks: number
  decks: HskDeck[]
}

export interface DeckWordsResponse {
  success: boolean
  total: number
  page: number
  limit: number
  words: VocabularyWord[]
}

export interface VocabularyListResponse {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  words: VocabularyWord[]
}

// Tạo / đồng bộ user lên MongoDB sau khi Clerk login
export async function syncUserToDB({
  clerkId,
  username,
  email,
}: CreateUserParams): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clerkId,
      username: username || `user_${clerkId.slice(-8)}`,
      email,
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to sync user")
  }

  return res.json()
}

// Lấy thông tin user từ MongoDB theo clerkId
export async function getUserByClerkId(
  clerkId: string
): Promise<UserResponse["user"] | null> {
  const res = await fetch(`${API_BASE_URL}/api/users/${clerkId}`)

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    throw new Error("Failed to fetch user")
  }

  const data = await res.json()
  return data.user
}

// Xoá user theo clerkId (admin)
export async function deleteUser(clerkId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/delete/${clerkId}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to delete user")
  }
}

// Lấy thống kê số từ vựng HSK 3.0 từng cấp độ từ MongoDB
export async function fetchVocabularyStats(): Promise<Hsk3StatsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/vocabulary/stats`)

  if (!res.ok) {
    throw new Error("Failed to fetch vocabulary stats")
  }

  return res.json()
}

// Lấy danh sách các BỘ BÀI HỌC (Decks) theo HSK 3.0
export async function fetchHskDecks({
  level = "all",
  search = "",
}: {
  level?: string
  search?: string
}): Promise<HskDecksResponse> {
  const params = new URLSearchParams()
  if (level && level !== "all") params.append("level", level)
  if (search) params.append("search", search)

  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/decks?${params.toString()}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch HSK decks")
  }

  return res.json()
}

// Lấy danh sách từ vựng chi tiết trong 1 Bộ bài học
export async function fetchDeckWords({
  levelKey,
  page = 1,
  limit = 50,
  search = "",
}: {
  levelKey: string
  page?: number
  limit?: number
  search?: string
}): Promise<DeckWordsResponse> {
  const params = new URLSearchParams()
  params.append("levelKey", levelKey)
  params.append("page", String(page))
  params.append("limit", String(limit))
  if (search) params.append("search", search)

  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/deck-words?${params.toString()}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch deck words")
  }

  return res.json()
}

// ==================== PENDING VOCABULARY (ADMIN) ====================

export interface PendingVocab {
  _id: string
  simplified: string
  traditional?: string
  radical?: string
  pinyin: string
  numeric?: string
  meanings: string[]
  level: string[]
  frequency: number
  pos: string[]
  classifiers: string[]
  userId: { _id: string; username: string; email: string } | string
  status: "pending" | "approved" | "rejected"
  adminId?: { _id: string; username: string; email: string } | string
  reviewedAt?: string
  notes?: string
  assignedDeckIds?: string[]
  assignedDeckNames?: string[]
  createdAt: string
  updatedAt: string
}

export interface DeckInfo {
  _id: string
  name: string
  hskLevel: string
  order: number
  totalWords: number
}

export interface PendingVocabResponse {
  submissions: PendingVocab[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Admin lấy danh sách từ đang chờ duyệt
export async function getPendingVocabulary(
  clerkId: string,
  params: { status?: string; page?: number; limit?: number }
): Promise<PendingVocabResponse> {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.append("status", params.status)
  if (params.page) searchParams.append("page", String(params.page))
  if (params.limit) searchParams.append("limit", String(params.limit))

  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending?${searchParams.toString()}`,
    {
      headers: {
        "x-clerk-user-id": clerkId,
      },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch pending vocabulary")
  }

  return res.json()
}

// Admin duyệt từ (có thể gửi kèm level để phân loại vào thư viện HSK)
export async function approvePendingVocabulary(
  clerkId: string,
  pendingId: string,
  level?: string[],
  assignedDeckIds?: string[]
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending/${pendingId}/approve`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-clerk-user-id": clerkId,
      },
      body: JSON.stringify({ level, assignedDeckIds }),
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to approve vocabulary")
  }

  return res.json()
}

// Admin từ chối từ
export async function rejectPendingVocabulary(
  clerkId: string,
  pendingId: string,
  notes: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending/${pendingId}/reject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-clerk-user-id": clerkId,
      },
      body: JSON.stringify({ notes }),
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to reject vocabulary")
  }

  return res.json()
}

// Admin xóa vĩnh viễn khỏi PendingVocabulary (chỉ dành cho rejected items)
export async function permanentDeletePendingVocabulary(
  clerkId: string,
  pendingId: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending/${pendingId}/permanent`,
    {
      method: "DELETE",
      headers: {
        "x-clerk-user-id": clerkId,
      },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to permanently delete")
  }

  return res.json()
}

// Lấy danh sách decks theo các HSK level (dùng cho approve dialog)
export async function fetchDecksByLevels(
  levels: string[]
): Promise<{ success: boolean; decks: DeckInfo[] }> {
  const params = new URLSearchParams()
  if (levels.length > 0) params.append("levels", levels.join(","))

  const res = await fetch(
    `${API_BASE_URL}/api/decks/by-levels?${params.toString()}`
  )

  if (!res.ok) {
    throw new Error("Failed to fetch decks by levels")
  }

  return res.json()
}

// Lấy danh sách từ vựng HSK 3.0 (phân trang, lọc level, tìm kiếm)
export async function fetchVocabularyList({
  level = "all",
  search = "",
  page = 1,
  limit = 20,
}: {
  level?: string
  search?: string
  page?: number
  limit?: number
}): Promise<VocabularyListResponse> {
  const params = new URLSearchParams()
  if (level && level !== "all") params.append("level", level)
  if (search) params.append("search", search)
  params.append("page", String(page))
  params.append("limit", String(limit))

  const res = await fetch(`${API_BASE_URL}/api/vocabulary?${params.toString()}`)

  if (!res.ok) {
    throw new Error("Failed to fetch vocabulary list")
  }

  return res.json()
}
