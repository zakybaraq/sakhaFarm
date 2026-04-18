# Sakha Farm Management System

Web-based poultry plasma farm management system with Indonesian poultry farming domain.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Elysia.js + Drizzle ORM |
| Frontend | React 18 + Vite + MUI |
| Database | MySQL |
| Session/Cache | Redis |
| Testing | Vitest |

## Quick Start

```bash
# Install dependencies
bun install
cd client && bun install && cd ..

# Start services
docker-compose up -d

# Run development servers
bun run dev           # server :3000
cd client && bun run dev  # client :5173
```

## Features

- Multi-tenancy management (Unit → Plasma → Cycle → Recording)
- Feed inventory management (Surat Jalan, stock tracking)
- Daily recording with FCR/IP calculation
- RBAC with dynamic permissions
- Security: rate limiting, security headers, tenant isolation

## Project Structure

```
sakhaFarm/
├── server/           # Elysia.js backend
│   └── src/
│       ├── config/
│       ├── modules/ (auth, rbac, users, unit, plasma, cycle, feed, recording)
│       ├── plugins/ (auth, session, rate-limit, security-headers, tenant)
│       └── db/schema/
├── client/          # React frontend
│   └── src/
│       ├── api/
│       ├── components/
│       └── pages/
└── tests/           # Server unit tests
```

## Documentation

- [API.md](API.md) - Endpoint reference
- [SETUP.md](SETUP.md) - Installation guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Developer guide

## License

Proprietary