# Fix Admin Access Bug - TODO ✅

## Problem
`getUserByClerkId()` requires 2 params: `(clerkId, token)` but was being called with only 1 param in multiple files, causing admin access checks to fail.

## Steps

- [x] 1. Analyze code and identify all files with the bug
- [x] 2. Confirm plan with user
- [x] 3. Fix `frontend/src/layouts/AdminLayout.tsx` - Add `useAuth()`, get token, pass to `getUserByClerkId`
- [x] 4. Fix `frontend/src/pages/admin/PendingVocabulary.tsx` - Add `useAuth()`, get token, pass to all API calls
- [x] 5. Fix `frontend/src/pages/admin/Users.tsx` - Remove duplicate `useAuth()` call inside function body, add missing auth headers to API calls
- [x] 6. **All fixes applied successfully**

