export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: 'free' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  token: string;
  expiresAt: string;
}
