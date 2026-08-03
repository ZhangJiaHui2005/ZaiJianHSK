import { Router, Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import User from '../models/Users';
import { requireAdmin, requireSelfOrAdmin } from '../middleware/auth';
import { logActivity } from '../lib/activityLogger';

const router = Router();

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || '',
});

// POST /api/users - Tạo user mới (gọi từ frontend sau khi Clerk login)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clerkId, username, email } = req.body;

    // Validate
    if (!clerkId || !email) {
      return res.status(400).json({ error: 'clerkId and email are required' });
    }

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ clerkId }, { email }],
    });

    if (existingUser) {
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser,
      });
    }

    // Tạo user mới
    const newUser = await User.create({
      clerkId,
      username: username || `user_${clerkId.slice(-8)}`,
      email,
    });

    await logActivity({
      user: newUser,
      action: "user.register",
      entityType: "user",
      entityId: String(newUser._id),
      entityName: newUser.username,
      metadata: { email: newUser.email },
    });

    console.log(`✅ User created: ${newUser.username} (${newUser.email}) role: ${newUser.role}`);
    return res.status(201).json({
      message: 'User created successfully',
      user: newUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating user:', error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users - Lấy danh sách tất cả users (admin)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:clerkId - Lấy thông tin user theo clerkId
router.get('/:clerkId', requireSelfOrAdmin, async (req: Request, res: Response) => {
  try {
    const clerkId = String(req.params.clerkId);

    const user = await User.findOne({ clerkId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:clerkId/role - Cập nhật role user (admin)
router.patch('/:clerkId/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const clerkId = String(req.params.clerkId);
    const { role } = req.body;

    const validRoles = ['admin', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Role updated: ${user.username} -> ${role}`);
    return res.status(200).json({
      message: 'Role updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:clerkId/status - Cập nhật trạng thái user (active / banned) (admin)
router.patch('/:clerkId/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const clerkId = String(req.params.clerkId);
    const { status } = req.body;

    const validStatuses = ['active', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ Status updated: ${user.username} -> ${status}`);
    return res.status(200).json({
      message: 'Status updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/delete/:clerkId - Xoá user khỏi Clerk và MongoDB (admin)
router.delete('/delete/:clerkId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const clerkId = String(req.params.clerkId);

    // Xoá user trên Clerk dashboard trước
    try {
      await clerkClient.users.deleteUser(clerkId);
      console.log(`✅ Clerk user deleted: ${clerkId}`);
    } catch (clerkError: any) {
      // Nếu Clerk trả về lỗi "not found" thì vẫn tiếp tục xoá MongoDB
      if (clerkError?.status === 404) {
        console.warn(`⚠️ Clerk user not found (${clerkId}), proceeding with MongoDB delete`);
      } else {
        throw clerkError;
      }
    }

    // Xoá user trong MongoDB
    const user = await User.findOneAndDelete({ clerkId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ User deleted from both Clerk and MongoDB: ${user.username} (${user.email})`);
    return res.status(200).json({
      message: 'User deleted successfully from Clerk and database',
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting user:', error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
