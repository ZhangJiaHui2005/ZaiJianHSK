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

export interface CommunityDeckOwner {
  _id: string
  username: string
  email?: string
}

export interface CommunityDeck {
  _id: string
  title: string
  description: string
  ownerId: CommunityDeckOwner | string
  wordIds: VocabularyWord[] | string[]
  visibility: "private" | "public" | "unlisted"
  status: "draft" | "published" | "hidden"
  tags: string[]
  hskLevels: string[]
  sourceDeckId?: string | null
  saveCount: number
  forkCount: number
  commentCount: number
  isSaved: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityDeckListResponse {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  decks: CommunityDeck[]
}

export interface CommunityDeckComment {
  _id: string
  deckId: string
  authorId: { _id: string; username: string } | string
  content: string
  status: "visible" | "hidden"
  createdAt: string
  updatedAt: string
  canManage: boolean
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
// Cần token vì backend dùng requireSelfOrAdmin: chỉ chính chủ hoặc admin mới xem được
export async function getUserByClerkId(
  clerkId: string,
  token: string
): Promise<UserResponse["user"] | null> {
  const res = await fetch(`${API_BASE_URL}/api/users/${clerkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

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
export async function deleteUser(clerkId: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/delete/${clerkId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
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
  token: string,
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
        Authorization: `Bearer ${token}`,
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
  token: string,
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
        Authorization: `Bearer ${token}`,
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
  token: string,
  pendingId: string,
  notes: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending/${pendingId}/reject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
  token: string,
  pendingId: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE_URL}/api/vocabulary/pending/${pendingId}/permanent`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
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

// ==================== VOCABULARY BY LEVEL ====================

export interface VocabWordSimple {
  _id: string
  simplified: string
  traditional?: string
  pinyin: string
  meanings: string[]
  level: string[]
  frequency: number
}

export interface VocabLevelGroup {
  levelKey: string
  levelLabel: string
  count: number
  words: VocabWordSimple[]
}

export interface VocabByLevelResponse {
  success: boolean
  totalWords: number
  levels: VocabLevelGroup[]
}

export async function fetchVocabularyByLevel(): Promise<VocabByLevelResponse> {
  const res = await fetch(`${API_BASE_URL}/api/vocabulary/by-level`)

  if (!res.ok) {
    throw new Error("Failed to fetch vocabulary by level")
  }

  return res.json()
}

// ==================== COMMUNITY DECKS ====================

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchCommunityDecks({
  search = "",
  page = 1,
  limit = 20,
  sort = "popular",
  token,
}: {
  search?: string
  page?: number
  limit?: number
  sort?: "popular" | "recent"
  token?: string | null
}): Promise<CommunityDeckListResponse> {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("page", String(page))
  params.append("limit", String(limit))
  params.append("sort", sort)

  const res = await fetch(`${API_BASE_URL}/api/community-decks?${params.toString()}`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    throw new Error("Failed to fetch community decks")
  }

  return res.json()
}

export async function fetchMyCommunityDecks(token: string): Promise<{ success: boolean; decks: CommunityDeck[] }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/my`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch my community decks")
  }

  return res.json()
}

export async function fetchCommunityDeck(
  deckId: string,
  token?: string | null
): Promise<{ success: boolean; deck: CommunityDeck }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}`, {
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch community deck")
  }

  return res.json()
}

export async function createCommunityDeck(
  token: string,
  payload: {
    title: string
    description?: string
    wordIds?: string[]
    visibility?: "private" | "public" | "unlisted"
    tags?: string[]
    hskLevels?: string[]
  }
): Promise<{ success: boolean; deck: CommunityDeck }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to create community deck")
  }

  return res.json()
}

export async function saveCommunityDeck(
  token: string,
  deckId: string,
  saved: boolean
): Promise<{ success: boolean; isSaved: boolean; saveCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ saved }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to save community deck")
  }

  return res.json()
}

export async function fetchDeckForks(
  deckId: string,
  token?: string | null
): Promise<{ success: boolean; forks: CommunityDeck[] }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/forks`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch forks")
  }
  return res.json()
}

export async function fetchDeckAncestors(
  deckId: string,
  token?: string | null
): Promise<{ success: boolean; lineage: Array<{ _id: string; title: string; username: string }> }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/ancestors`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch ancestors")
  }
  return res.json()
}

export async function forkCommunityDeck(
  token: string,
  deckId: string
): Promise<{ success: boolean; deck: CommunityDeck }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/fork`, {
    method: "POST",
    headers: authHeaders(token),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fork community deck")
  }

  return res.json()
}

export async function fetchCommunityDeckComments(
  deckId: string,
  token?: string | null
): Promise<{ success: boolean; comments: CommunityDeckComment[] }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/comments`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch comments")
  }
  return res.json()
}

export async function createCommunityDeckComment(
  token: string,
  deckId: string,
  content: string
): Promise<{ success: boolean; comment: CommunityDeckComment; commentCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to create comment")
  }
  return res.json()
}

export async function deleteCommunityDeckComment(
  token: string,
  deckId: string,
  commentId: string
): Promise<{ success: boolean; commentCount: number }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to delete comment")
  }
  return res.json()
}

// ==================== ADMIN STATS ====================

export interface AdminStats {
  success: boolean
  totalUsers: number
  totalVocabulary: number
  totalCommunityDecks: number
  pendingVocabulary: number
  pendingReports: number
}

// Admin lấy thống kê tổng quan dashboard
export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch admin stats")
  }

  return res.json()
}

// ==================== ADMIN COMMUNITY DECKS ====================

export interface AdminCommunityDeck {
  _id: string
  title: string
  description: string
  ownerId: {
    _id: string
    username: string
    email?: string
  }
  wordIds: Array<{ _id: string; simplified: string; pinyin: string }>
  visibility: "private" | "public" | "unlisted"
  status: "draft" | "published" | "hidden"
  tags: string[]
  hskLevels: string[]
  saveCount: number
  forkCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCommunityDecksResponse {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  decks: AdminCommunityDeck[]
}

// Admin lấy danh sách tất cả community decks
export async function fetchAdminCommunityDecks(
  token: string,
  params: {
    search?: string
    visibility?: string
    status?: string
    page?: number
    limit?: number
    sort?: string
  }
): Promise<AdminCommunityDecksResponse> {
  const searchParams = new URLSearchParams()
  if (params.search) searchParams.append("search", params.search)
  if (params.visibility) searchParams.append("visibility", params.visibility)
  if (params.status) searchParams.append("status", params.status)
  if (params.page) searchParams.append("page", String(params.page))
  if (params.limit) searchParams.append("limit", String(params.limit))
  if (params.sort) searchParams.append("sort", params.sort)

  const res = await fetch(
    `${API_BASE_URL}/api/admin/community-decks?${searchParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch community decks")
  }

  return res.json()
}

// Admin xoá vĩnh viễn community deck
export async function adminDeleteCommunityDeck(
  token: string,
  deckId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/community-decks/${deckId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to delete community deck")
  }

  return res.json()
}

// Admin ẩn community deck
export async function adminHideCommunityDeck(
  token: string,
  deckId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/community-decks/${deckId}/hide`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to hide community deck")
  }

  return res.json()
}

// Admin bỏ ẩn community deck
export async function adminUnhideCommunityDeck(
  token: string,
  deckId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/community-decks/${deckId}/unhide`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to unhide community deck")
  }

  return res.json()
}

// ==================== REPORT SYSTEM ====================

export interface DeckReport {
  _id: string
  deckId: {
    _id: string
    title: string
    ownerId: { _id: string; username: string; email?: string }
    visibility: string
    status: string
    saveCount: number
  } | string
  reporterId: { _id: string; username: string; email?: string } | string
  reason: "spam" | "inappropriate" | "wrong_topic" | "duplicate" | "other"
  description: string
  status: "pending" | "resolved" | "dismissed"
  adminId?: { _id: string; username: string; email?: string } | string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface DeckReportListResponse {
  success: boolean
  total: number
  page: number
  limit: number
  totalPages: number
  reports: DeckReport[]
}

// User report a community deck
export async function reportCommunityDeck(
  token: string,
  deckId: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; report: { _id: string; reason: string; status: string; createdAt: string } }> {
  const res = await fetch(`${API_BASE_URL}/api/community-decks/${deckId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ reason, description }),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to report deck")
  }
  return res.json()
}

// Admin fetch reports
export async function fetchDeckReports(
  token: string,
  params: { status?: string; page?: number; limit?: number }
): Promise<DeckReportListResponse> {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.append("status", params.status)
  if (params.page) searchParams.append("page", String(params.page))
  if (params.limit) searchParams.append("limit", String(params.limit))

  const res = await fetch(`${API_BASE_URL}/api/admin/reports?${searchParams.toString()}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to fetch reports")
  }
  return res.json()
}

// Admin resolve report
export async function resolveReport(
  token: string,
  reportId: string
): Promise<{ success: boolean; message: string; report: { _id: string; status: string } }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/resolve`, {
    method: "PATCH",
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to resolve report")
  }
  return res.json()
}

// Admin dismiss report
export async function dismissReport(
  token: string,
  reportId: string
): Promise<{ success: boolean; message: string; report: { _id: string; status: string } }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/dismiss`, {
    method: "PATCH",
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to dismiss report")
  }
  return res.json()
}

// Admin hide deck and resolve report
export async function hideDeckAndResolveReport(
  token: string,
  reportId: string
): Promise<{ success: boolean; message: string; report: { _id: string; status: string }; deck: { _id: string; title: string; status: string } }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/hide-deck`, {
    method: "PATCH",
    headers: authHeaders(token),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(errorData.error || "Failed to hide deck")
  }
  return res.json()
}
