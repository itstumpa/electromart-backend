

import { prisma } from '../src/lib/prisma'


async function main() {
  await prisma.banner.deleteMany();

  await prisma.banner.createMany({
    data: [
      // ─── HOME_HERO_MAIN (1 big hero cell) ───
      {
        type: 'HOME_HERO_MAIN',
        order: 0,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1400&q=95',
        heroTitle: 'Premium Electronics,\nAll in One Place',
        heroLabel: 'Featured Drop',
        heroHref: '/products',
        heroCtaText: 'Shop Now',
        heroGradientFrom: 'from-purple-950/85',
        heroGradientVia: 'via-purple-900/40',
        heroAccentColor: 'text-purple-300',
        heroCtaBg: 'bg-white hover:bg-purple-50 text-purple-900',
      },

      // ─── HOME_GRID_CELL (6 small vendor cells) ───
      {
        type: 'HOME_GRID_CELL',
        order: 0,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=800&q=90',
        gridLabel: 'TechStore Pro',
        gridTitle: 'Smartphones',
        gridHref: '/products?vendor=techstore-pro',
        gridOffer: 'Flash Sale',
        gridOfferIcon: 'Zap',
        gridGradientFrom: 'from-rose-950/90',
        gridGradientVia: 'via-rose-800/30',
        gridBadgeBg: 'bg-rose-500',
      },
      {
        type: 'HOME_GRID_CELL',
        order: 1,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=90',
        gridLabel: 'GadgetZone',
        gridTitle: 'Audio & Wearables',
        gridHref: '/products?vendor=gadgetzone',
        gridOffer: '40% OFF',
        gridOfferIcon: 'Tag',
        gridGradientFrom: 'from-yellow-950/90',
        gridGradientVia: 'via-yellow-800/20',
        gridBadgeBg: 'bg-yellow-500',
      },
      {
        type: 'HOME_GRID_CELL',
        order: 2,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&q=80',
        gridLabel: 'NovaTech',
        gridTitle: 'Gaming Gear',
        gridHref: '/products?vendor=novatech',
        gridOffer: 'Buy 1 Get 1',
        gridOfferIcon: 'Gift',
        gridGradientFrom: 'from-cyan-950/90',
        gridGradientVia: 'via-cyan-800/20',
        gridBadgeBg: 'bg-cyan-500',
      },
      {
        type: 'HOME_GRID_CELL',
        order: 3,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
        gridLabel: 'PixelHub',
        gridTitle: 'Cameras & Drones',
        gridHref: '/products?vendor=pixelhub',
        gridOffer: 'Free Delivery',
        gridOfferIcon: 'Truck',
        gridGradientFrom: 'from-blue-950/90',
        gridGradientVia: 'via-blue-800/20',
        gridBadgeBg: 'bg-blue-500',
      },
      {
        type: 'HOME_GRID_CELL',
        order: 4,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
        gridLabel: 'PixelHub',
        gridTitle: 'Headphones & Speakers',
        gridHref: '/products?vendor=pixelhub',
        gridOffer: 'Free Delivery',
        gridOfferIcon: 'Truck',
        gridGradientFrom: 'from-rose-950/90',
        gridGradientVia: 'via-rose-800/30',
        gridBadgeBg: 'bg-blue-500',
      },
      {
        type: 'HOME_GRID_CELL',
        order: 5,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=90',
        gridLabel: 'PixelHub',
        gridTitle: 'Cameras & Drones',
        gridHref: '/products?vendor=pixelhub',
        gridOffer: 'Free Delivery',
        gridOfferIcon: 'Truck',
        gridGradientFrom: 'from-blue-950/90',
        gridGradientVia: 'via-blue-800/20',
        gridBadgeBg: 'bg-blue-500',
      },

      // ─── HOME_PILL (6 offer pills) ───
      {
        type: 'HOME_PILL',
        order: 0,
        isActive: true,
        pillLabel: 'Free Delivery',
        pillSub: 'On orders $99+',
        pillIcon: 'Truck',
        pillBg: 'bg-emerald-500',
        pillShadow: 'shadow-emerald-200',
      },
      {
        type: 'HOME_PILL',
        order: 1,
        isActive: true,
        pillLabel: 'Flash Sale',
        pillSub: 'Up to 40% OFF',
        pillIcon: 'Zap',
        pillBg: 'bg-rose-500',
        pillShadow: 'shadow-rose-200',
      },
      {
        type: 'HOME_PILL',
        order: 2,
        isActive: true,
        pillLabel: 'Buy 1 Get 1',
        pillSub: 'Selected items',
        pillIcon: 'Gift',
        pillBg: 'bg-violet-600',
        pillShadow: 'shadow-violet-200',
      },
      {
        type: 'HOME_PILL',
        order: 3,
        isActive: true,
        pillLabel: 'Code ELECTRO20',
        pillSub: '20% off sitewide',
        pillIcon: 'Tag',
        pillBg: 'bg-amber-600',
        pillShadow: 'shadow-amber-200',
      },
      {
        type: 'HOME_PILL',
        order: 4,
        isActive: true,
        pillLabel: 'Free Returns',
        pillSub: '30 day guarantee',
        pillIcon: 'RotateCcw',
        pillBg: 'bg-blue-600',
        pillShadow: 'shadow-blue-200',
      },
      {
        type: 'HOME_PILL',
        order: 5,
        isActive: true,
        pillLabel: '4.8★ Rated',
        pillSub: '50k+ reviews',
        pillIcon: 'Star',
        pillBg: 'bg-orange-500',
        pillShadow: 'shadow-orange-200',
      },

      // ─── PRODUCT_HERO_SLIDE (3 carousel slides) ───
      {
        type: 'PRODUCT_HERO_SLIDE',
        order: 0,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
        slideBadge: 'NEW RELEASE',
        slideTitle: 'iPhone 15 Pro',
        slideHighlight: 'Titanium',
        slideSubtitle:
          'Forged in titanium. Powered by A17 Pro chip. With a groundbreaking camera system. Best products in the country, grab now.',
        slidePrice: '৳159,999',
        slideOriginalPrice: '৳179,999',
        slideDiscount: '11% OFF',
        slideBgGradient: 'from-amber-50 via-orange-50/50 to-yellow-50/30',
      },
      {
        type: 'PRODUCT_HERO_SLIDE',
        order: 1,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        slideBadge: 'BEST SELLER',
        slideTitle: 'MacBook Pro',
        slideHighlight: 'M3 Max',
        slideSubtitle:
          'The most advanced Mac ever. Supercharged by M3 Max for unprecedented performance. Best products in the country, grab now.',
        slidePrice: '৳299,999',
        slideOriginalPrice: '৳349,999',
        slideDiscount: '14% OFF',
        slideBgGradient: 'from-slate-50 via-amber-50/30 to-orange-50/20',
      },
      {
        type: 'PRODUCT_HERO_SLIDE',
        order: 2,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
        slideBadge: 'TRENDING',
        slideTitle: 'Sony WH',
        slideHighlight: '1000XM5',
        slideSubtitle:
          'Industry-leading noise canceling. Crystal clear sound. 30-hour battery life. Best products in the country, grab now.',
        slidePrice: '৳34,999',
        slideOriginalPrice: '৳42,999',
        slideDiscount: '19% OFF',
        slideBgGradient: 'from-orange-50/60 via-amber-50 to-yellow-50/40',
      },

      // ─── PRODUCT_FLOATING (2 floating product cards) ───
      {
        type: 'PRODUCT_FLOATING',
        order: 0,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=120&q=80',
        floatingName: 'AirPods Pro',
        floatingPrice: '৳29,999',
        floatingRating: 4.8,
        floatingReviews: 2340,
      },
      {
        type: 'PRODUCT_FLOATING',
        order: 1,
        isActive: true,
        imageUrl: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=120&q=80',
        floatingName: 'Galaxy Watch 6',
        floatingPrice: '৳42,999',
        floatingRating: 4.7,
        floatingReviews: 1205,
      },
    ],
  });

  console.log('✅ Banner seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });