import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import User from "../models/Users.js";

/**
 * Yêu cầu người gọi đã đăng nhập (session Clerk hợp lệ) VÀ có role admin
 * trong MongoDB. Dùng cho các route chỉ admin được phép gọi.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    (req as any).currentUser = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Cho phép chính chủ tài khoản (clerkId trong session trùng với :clerkId
 * trên URL) HOẶC admin. Dùng cho các route dạng "xem/sửa thông tin của
 * chính mình, hoặc admin xem/sửa thay".
 */
export async function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (!isAuthenticated || !userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (userId === req.params.clerkId) {
      return next();
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    (req as any).currentUser = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Không bắt buộc đăng nhập — nếu có session Clerk hợp lệ thì gắn
 * currentUser vào req, không có thì bỏ qua và next() bình thường.
 * Dùng cho route như "user gửi từ mới" (ai đăng nhập cũng gửi được,
 * nhưng route tự biết là ai để gắn userId).
 */
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { isAuthenticated, userId } = getAuth(req);
    if (isAuthenticated && userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        (req as any).currentUser = user;
      }
    }
    next();
  } catch {
    next();
  }
}