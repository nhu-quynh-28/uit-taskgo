# TaskGo

Monorepo layout for the TaskGo project.

## Structure

| Folder | Description |
|--------|-------------|
| [`frontend/`](./frontend/) | Expo / React Native mobile app |
| [`backend/`](./backend/) | API server (not implemented yet) |

## Frontend

```bash
cd frontend
npm install
npm start
```

Other scripts: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`.

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: `http://localhost:4000/api` — see [`backend/README.md`](./backend/README.md) for endpoints, Socket.IO, and seed users.
