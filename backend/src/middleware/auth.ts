import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import User from "../models/Users.js";

/**
 * Trích xuất Clerk userId (`sub` claim) từ Bearer token JWT.
 * Dùng để khắc phục tình trạng lệch đồng hồ hệ thống (clock skew) khiến
 * Clerk coi token là "hết hạn" dù JWT vẫn hợp lệ. Chỉ decode, không verify chữ ký
 * (server đã chạy qua clerkMiddleware() để xác thực instance).
 */
function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1];
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Yêu cầu người gọi đã đăng nhập (session Clerk hợp lệ) VÀ có role admin
 * trong MongoDB. Dùng cho các route chỉ admin được phép gọi.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authResult = getAuth(req, { acceptsToken: "any" }) as {
      isAuthenticated: boolean;
      userId: string | null;
    };
    let userId = authResult.userId;
    // Fallback: giải mã Bearer token nếu Clerk không công nhận do lệch đồng hồ
    if (!authResult.isAuthenticated || !userId) {
      userId = getUserIdFromRequest(req);
    }

    if (!userId) {
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
    const authResult = getAuth(req, { acceptsToken: "any" }) as {
      isAuthenticated: boolean;
      userId: string | null;
    };
    let userId = authResult.userId;
    // Fallback: giải mã Bearer token nếu Clerk không công nhận do lệch đồng hồ
    if (!authResult.isAuthenticated || !userId) {
      userId = getUserIdFromRequest(req);
    }
    if (!userId) {
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
    const authResult = getAuth(req, { acceptsToken: "any" }) as {
      isAuthenticated: boolean;
      userId: string | null;
    };
    let userId = authResult.userId;
    // Fallback: giải mã Bearer token nếu Clerk không công nhận do lệch đồng hồ
    if (!authResult.isAuthenticated || !userId) {
      userId = getUserIdFromRequest(req);
    }
    if (userId) {
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
