import { Router, Request, Response } from 'express';
import User from '../models/Users.js';

const router = Router();

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

    console.log(`✅ User created: ${newUser.username} (${newUser.email})`);
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

// GET /api/users/:clerkId - Lấy thông tin user theo clerkId
router.get('/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;

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

export default router;

