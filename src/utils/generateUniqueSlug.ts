export const slugGenerator = async <T extends { slug: string }>(
  text: string,
  model: {
    findMany: (args: any) => Promise<T[]>;
  }
): Promise<string> => {
  const baseSlug = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  // 🔥 single DB call
  const existing = await model.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
    select: {
      slug: true,
    },
  });

  if (existing.length === 0) return baseSlug;

  // extract suffix numbers
  const suffixes = existing
    .map((p) => p.slug.replace(baseSlug, ''))
    .map((s) => s.replace('-', ''))
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !isNaN(n));

  const next = suffixes.length ? Math.max(...suffixes) + 1 : 1;

  return `${baseSlug}-${next}`;
};