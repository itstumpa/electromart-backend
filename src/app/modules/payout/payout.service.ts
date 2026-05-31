
import { prisma } from "../../../lib/prisma";

export const getMyPayouts = async (vendorId: string) => {
  const store = await prisma.store.findUniqueOrThrow({ where: { ownerId: vendorId } });

  return prisma.payout.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const getMyTransactions = async (vendorId: string) => {
  const store = await prisma.store.findUniqueOrThrow({ where: { ownerId: vendorId } });

  return prisma.orderItem.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      order: { select: { id: true, createdAt: true } },
      product: { select: { name: true } },
    },
  });
};

export const requestPayout = async (vendorId: string, amount: number) => {
  const store = await prisma.store.findUniqueOrThrow({ where: { ownerId: vendorId } });

  return prisma.payout.create({
    data: {
      storeId: store.id,
      amount,
      status: 'PENDING',
    },
  });
};