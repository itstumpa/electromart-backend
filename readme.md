
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


### to kill/delete running port:
netstat -ano | findstr :5000
taskkill /PID 12345 /F
docker-compose down

then again command:
docker-compose up -d

to stop everything:
docker-compose down

to check ant error:
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


Run Prisma Studio
npx prisma studio --port 5555 --browser none
```