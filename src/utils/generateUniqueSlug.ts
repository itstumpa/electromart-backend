import { customAlphabet } from "nanoid";

// nanoId based slug 
const nano = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 5);

type SlugModel = {
  findUnique: (args: {
    where: { slug: string };
    select: { slug: true };
  }) => Promise<{ slug: string } | null>;
};

export const generateUniqueSlug = async (
  text: string,
  model: SlugModel
): Promise<string> => {
  const baseSlug = text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

  const exists = await model.findUnique({
    where: { slug: baseSlug },
    select: { slug: true },
  });

  if (!exists) return baseSlug;

  return `${baseSlug}-${nano()}`;
};