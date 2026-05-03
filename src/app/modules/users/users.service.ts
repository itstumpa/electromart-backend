// src/app/modules/users/user.service.ts
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';

// CREATE
export const createUser = async (data: { name: string; email: string; password: string; role?: 'CUSTOMER' | 'VENDOR' }) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  // never return password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ADMIN — get all users
export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ADMIN/USER — get single user
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      store: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

// USER — update own profile only
export const updateUser = async (
  targetId: string,
  requesterId: string,
  requesterRole: Role,
  data: { name?: string; email?: string }
) => {
  // only the user themselves can update (admin cannot update others profile)
  if (targetId !== requesterId) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw new ApiError(404, 'User not found');

  return prisma.user.update({
    where: { id: targetId },
    data,
    select: { id: true, name: true, email: true, role: true },
  });
};

// ADMIN — delete any user
export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');

  await prisma.user.delete({ where: { id } });
  return { message: 'User deleted successfully' };
};

// ADMIN — change user role
export const changeUserRole = async (id: string, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');

  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
};
