
```
npx prisma migrate dev --name init

```

```
npm install -D ts-node
npx ts-node prisma/seedStoreAndCategory.ts
npx ts-node prisma/seedProducts.ts
npx ts-node prisma/analytics-seed.ts
npx tsx prisma/admin-seed.ts

```