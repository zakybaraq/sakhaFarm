# Setup Guide

## Prerequisites

- Bun 1.0+
- Docker + Docker Compose
- MySQL 8.0 (via Docker)
- Redis 7+ (via Docker)

## Environment Variables

Create `server/.env`:

```bash
# Required
DATABASE_URL=mysql://root:password@localhost:3306/sakhafarm_latest
JWT_SECRET=minimum-32-characters-secret-key-here
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173

# Optional
PORT=3000
NODE_ENV=development
TRUST_PROXY=false

# Rate Limiting
RATE_LIMIT_LOGIN=5
RATE_LIMIT_API=100
RATE_LIMIT_HEAVY=10
```

## Installation

1. **Start database services:**
```bash
docker-compose up -d
```

2. **Install server dependencies:**
```bash
bun install
```

3. **Install client dependencies:**
```bash
cd client && bun install && cd ..
```

## Running Development

1. **Run server:**
```bash
bun run dev
```

2. **Run client:**
```bash
cd client && bun run dev
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Building

**Server:**
```bash
bun run build
```

**Client:**
```bash
cd client && bun run build
```

## Testing

```bash
# Server tests
bun run test

# Client tests
cd client && bun run test

# Coverage
bun run test --coverage
```

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@sakhafarm.local | changeme123 | Super Admin |

## Troubleshooting

### Port already in use
```bash
lsof -i :3000  # server
lsof -i :5173  # client
```

### Database connection error
Verify Docker MySQL is running:
```bash
docker ps | grep mysql
```