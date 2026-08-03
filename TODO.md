# Giai đoạn 2 (Trải nghiệm & Analytics) - Implementation Todo

## Backend
- [x] 1. Create `backend/src/models/ActivityLog.ts` (Activity Log model)
- [x] 2. Create `backend/src/routes/activity.ts` (activity stream + analytics endpoints)
- [x] 3. Mount activity route in `backend/src/index.ts`
- [x] 4. Add admin CRUD routes to `backend/src/routes/vocabulary.ts` (create/update/delete)
- [x] 5. Add activity logging to key events:
  - [x] `users.ts` (user registration)
  - [x] `vocabulary.ts` (submission / approve / reject / CRUD)
  - [x] `communityDecks.ts` (deck create / publish / fork)
- [x] 6. Extend `backend/src/routes/adminStats.ts` with analytics (user growth + daily activity)

## Frontend
- [x] 7. Install `recharts` in frontend
- [x] 8. Add types + API functions in `frontend/src/lib/api.ts` (analytics, activity logs, vocabulary CRUD)
- [x] 9. Integrate Recharts into `frontend/src/pages/admin/Dashboard.tsx` (User Growth LineChart + Daily Study Activity BarChart)
- [x] 10. Create `frontend/src/pages/admin/ActivityLogs.tsx` (Activity Log Stream)
- [x] 11. Create `frontend/src/pages/admin/VocabularyManagement.tsx` (CRUD Từ vựng HSK chuẩn)
- [x] 12. Update `frontend/src/layouts/AdminLayout.tsx` (nav items: Activity Logs, Vocabulary)
- [x] 13. Update `frontend/src/router.tsx` (register `/admin/activity` and `/admin/vocabulary`)

## Verification
- [x] 14. Typecheck backend (`npm run build` in backend) - PASSED
- [x] 15. Typecheck frontend (`npm run typecheck` in frontend) - PASSED
