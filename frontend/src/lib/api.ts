const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CreateUserParams {
  clerkId: string;
  username: string | null;
  email: string;
}

interface UserResponse {
  message: string;
  user: {
    _id: string;
    clerkId: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Tạo / đồng bộ user lên MongoDB sau khi Clerk login
export async function syncUserToDB({ clerkId, username, email }: CreateUserParams): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clerkId,
      username: username || `user_${clerkId.slice(-8)}`,
      email,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to sync user');
  }

  return res.json();
}

// Lấy thông tin user từ MongoDB theo clerkId
export async function getUserByClerkId(clerkId: string): Promise<UserResponse['user'] | null> {
  const res = await fetch(`${API_BASE_URL}/api/users/${clerkId}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }

  const data = await res.json();
  return data.user;
}

// Xoá user theo clerkId (admin)
export async function deleteUser(clerkId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/delete/${clerkId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to delete user');
  }
}

