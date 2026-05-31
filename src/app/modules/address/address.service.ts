// src/app/modules/address/address.service.ts
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';

export const createAddress = async (
  userId: string,
  data: {
    label: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    isDefault?: boolean;
  }
) => {
  // if new address is default, unset all others first
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  // if this is first address, make it default automatically
  const count = await prisma.address.count({ where: { userId } });
  const isDefault = count === 0 ? true : (data.isDefault ?? false);

  return prisma.address.create({
    data: { ...data, isDefault, userId },
  });
};

export const getMyAddresses = async (userId: string) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

export const getAddressById = async (id: string, userId: string) => {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.userId !== userId) throw new ApiError(403, 'Access denied');
  return address;
};

export const updateAddress = async (
  id: string,
  userId: string,
  data: Partial<{
    label: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }>
) => {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.userId !== userId) throw new ApiError(403, 'Access denied');

  // if setting as default, unset others
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, NOT: { id } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({ where: { id }, data });
};

export const deleteAddress = async (id: string, userId: string) => {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.userId !== userId) throw new ApiError(403, 'Access denied');

  await prisma.address.delete({ where: { id } });

  // if deleted was default, make the most recent one default
  if (address.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  return { message: 'Address deleted' };
};

export const setDefaultAddress = async (id: string, userId: string) => {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new ApiError(404, 'Address not found');
  if (address.userId !== userId) throw new ApiError(403, 'Access denied');

  await prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });
};
