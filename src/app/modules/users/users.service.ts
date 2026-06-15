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
    throw new ApiError(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role ?? Role.CUSTOMER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

// ADMIN — get all users
export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      isEmailVerified: true,
      isBanned: true,
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
  data: { name?: string; email?: string, phone?: string; avatar?: string; website?: string; location?: string }
) => {
  const isAdmin = requesterRole === Role.ADMIN;
  const isSelf = targetId === requesterId;

  if (!isAdmin && !isSelf) {
    throw new ApiError(403, "Not allowed to update this user");
  }

  const user = await prisma.user.findUnique({ where: { id: targetId } });
  if (!user) throw new ApiError(404, "User not found");

  // Field allowlisting — prevent privilege escalation via stray fields
  const sanitizedData: Record<string, any> = {};
  if (data.name !== undefined) sanitizedData.name = data.name;
  if (data.email !== undefined) sanitizedData.email = data.email;
  if (data.phone !== undefined) sanitizedData.phone = data.phone;
  if (data.avatar !== undefined) sanitizedData.avatar = data.avatar;
  if (data.website !== undefined) sanitizedData.website = data.website;
  if (data.location !== undefined) sanitizedData.location = data.location;

  return prisma.user.update({
    where: { id: targetId },
    data: sanitizedData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      website: true,
      location: true,
    },
  });
};

// ADMIN — delete any user
export const deleteUser = async (id: string, requesterRole: Role, requesterId: string) => {
  const isAdmin = requesterRole === Role.ADMIN;
  const isSelf  = requesterId === id;

  if (!isAdmin && !isSelf) {
    throw new ApiError(403, 'You can only delete your own account');
  }

  const deleted = await prisma.user.deleteMany({ where: { id } });

  if (deleted.count === 0) {
    throw new ApiError(404, 'User not found');
  }

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


export const getNotificationPrefs = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifOrderUpdates: true,
      notifPromotions: true,
      notifWishlistSale: true,
      notifReviewReminder: true,
      notifDeliveryAlerts: true,
      notifWeeklyDigest: true,
    },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateNotificationPrefs = async (
  userId: string,
  data: {
    notifOrderUpdates?: boolean;
    notifPromotions?: boolean;
    notifWishlistSale?: boolean;
    notifReviewReminder?: boolean;
    notifDeliveryAlerts?: boolean;
    notifWeeklyDigest?: boolean;
  }
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      notifOrderUpdates: true,
      notifPromotions: true,
      notifWishlistSale: true,
      notifReviewReminder: true,
      notifDeliveryAlerts: true,
      notifWeeklyDigest: true,
    },
  });
};

// ADMIN — ban or unban a user
export const banUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, 'User not found');

  return prisma.user.update({
    where: { id },
    data: { isBanned: !user.isBanned },
    select: { id: true, name: true, email: true, role: true, isBanned: true },
  });
};