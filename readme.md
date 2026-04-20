```
https://electromart-backend-three.vercel.app

```

```
npx prisma migrate dev --name init

```

```
npm install -D ts-node
npx tsx prisma/admin-seed.ts

```

```
### docker:

docker-compose up --build
docker-compose up -d
npx prisma migrate dev --name init

then start again command:
docker-compose up -d

to stop everything:
docker-compose down

to check any error:
docker logs electromart_app

to check actually running:
docker ps


docker exec -it electromart_app sh
npx prisma migrate dev --name init


## 🧒 Daily Routine From Now On
```
```
1. Open Docker Desktop → leave it running
2. Open VS Code terminal
3. Type → docker-compose up
4. Code normally, changes reflect live with hot reload!
5. When done → Ctrl+C to stop logs, then docker-compose down


Run Prisma Studio:
npx prisma studio --port 5555 --browser none


### to kill/delete running port:
netstat -ano | findstr :5000
taskkill /PID 12345 /F

docker-compose down


# for send notification target type
{
  "targetType": "ROLE",
  "role": "VENDOR",
  "title": "Vendor Policy Updated",
  "message": "Please review the new rules"
}

{
  "targetType": "ALL_USERS",
  "title": "Big Sale Tomorrow",
  "message": "50% off starts tomorrow"
}

{
  "targetType": "USER",
  "userId": "abc123",
  "title": "Account Approved",
  "message": "Your account has been approved"
}

{
  "targetType": "USERS",
  "userIds": ["id1", "id2", "id3"],
  "title": "Important Update",
  "message": "Please check your dashboard"
}

```
