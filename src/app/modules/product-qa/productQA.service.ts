// src/app/modules/product-qa/productQA.service.ts
import { prisma } from '../../../lib/prisma';
import { createNotification } from '../notification/notification.service';
import { sendEmail } from '../../../utils/sendEmail';
import ApiError from '../../../utils/apiErrors';

// CUSTOMER — ask question
export const askQuestion = async (customerId: string, productId: string, question: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: { include: { owner: true } } },
  });
  if (!product) throw new ApiError(404, 'Product not found');

  const qa = await prisma.productQuestion.create({
    data: { customerId, productId, question },
    include: { customer: { select: { id: true, name: true } } },
  });

  // notify vendor
  await createNotification({
    userId: product.store.ownerId,
    title: 'New Product Question',
    message: `Someone asked a question about "${product.name}"`,
    type: 'PRODUCT_QUESTION',
  });

  await sendEmail({
    to: product.store.owner.email,
    subject: '❓ New Question on Your Product — ElectroMart',
    html: `
      <p>Hi ${product.store.owner.name},</p>
      <p>A customer asked a question about <strong>${product.name}</strong>:</p>
      <blockquote>${question}</blockquote>
      <p>Log in to answer it.</p>
    `,
  });

  return qa;
};

// PUBLIC — get all APPROVED Q&A for a product
export const getProductQA = async (productId: string) => {
  return prisma.productQuestion.findMany({
    where: { productId, status: 'APPROVED' },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// VENDOR — answer question
export const answerQuestion = async (questionId: string, vendorId: string, answer: string) => {
  const qa = await prisma.productQuestion.findUnique({
    where: { id: questionId },
    include: {
      product: { include: { store: true } },
      customer: true,
    },
  });

  if (!qa) throw new ApiError(404, 'Question not found');
  if (qa.product.store.ownerId !== vendorId) {
    throw new ApiError(403, 'You can only answer questions for your products');
  }
  if (qa.status !== 'APPROVED') throw new ApiError(400, 'You can only answer approved questions');
  if (qa.answer) throw new ApiError(400, 'Already answered');

  const updated = await prisma.productQuestion.update({
    where: { id: questionId },
    data: { answer, answeredAt: new Date(), answeredBy: vendorId },
  });

  // notify customer their question was answered
  await createNotification({
    userId: qa.customerId,
    title: 'Your Question Was Answered',
    message: `A vendor answered your question about "${qa.product.name}"`,
    type: 'QUESTION_ANSWERED',
  });

  await sendEmail({
    to: qa.customer.email,
    subject: '✅ Your Question Has Been Answered — ElectroMart',
    html: `
      <p>Hi ${qa.customer.name},</p>
      <p>Your question about <strong>${qa.product.name}</strong>:</p>
      <blockquote>${qa.question}</blockquote>
      <p><strong>Answer:</strong> ${answer}</p>
    `,
  });

  return updated;
};

// VENDOR — get questions for their products (all statuses)
export const getVendorQuestions = async (vendorId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId: vendorId } });
  if (!store) throw new ApiError(404, 'Store not found');

  return prisma.productQuestion.findMany({
    where: { product: { storeId: store.id } },
    include: {
      customer: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ADMIN — get all questions across all products
export const getAdminQuestions = async () => {
  return prisma.productQuestion.findMany({
    include: {
      customer: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, slug: true, store: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// VENDOR/ADMIN — moderate a question (approve/reject)
export const moderateQuestion = async (questionId: string, moderatorId: string, status: 'APPROVED' | 'REJECTED', isAdmin: boolean = false) => {
  const qa = await prisma.productQuestion.findUnique({
    where: { id: questionId },
    include: { product: { include: { store: true } }, customer: true },
  });
  if (!qa) throw new ApiError(404, 'Question not found');

  // Vendors can only moderate their own products' questions; admins can moderate any
  if (!isAdmin && qa.product.store.ownerId !== moderatorId) {
    throw new ApiError(403, 'You can only moderate questions for your own products');
  }

  if (qa.status !== 'PENDING') {
    throw new ApiError(400, 'This question has already been moderated');
  }

  const updated = await prisma.productQuestion.update({
    where: { id: questionId },
    data: { status, moderatedAt: new Date(), moderatedBy: moderatorId },
  });

  // notify customer
  await createNotification({
    userId: qa.customerId,
    title: `Question ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    message: `Your question about "${qa.product.name}" was ${status.toLowerCase()}.`,
    type: 'QUESTION_MODERATED',
  });

  return updated;
};

// CUSTOMER/ADMIN — delete question
export const deleteQuestion = async (questionId: string, requesterId: string, isAdmin: boolean) => {
  const qa = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!qa) throw new ApiError(404, 'Question not found');
  if (!isAdmin && qa.customerId !== requesterId) {
    throw new ApiError(403, 'Access denied');
  }
  await prisma.productQuestion.delete({ where: { id: questionId } });
  return { message: 'Question deleted' };
};
