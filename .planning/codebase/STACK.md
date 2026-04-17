# Technology Stack

**Analysis Date:** 2026-04-17

## Languages

**Primary:**
- TypeScript 5.8.0 - Used in both server and client

**Secondary:**
- None detected

## Runtime

**Environment:**
- Bun 1.x - Primary runtime for both server and client
- Node.js compatible (via bun-types)

**Package Manager:**
- Bun (built-in)
- Lockfile: Present (bun.lockb)

## Frameworks

**Server:**
- Elysia 1.4.0 - Web framework for REST API
- Drizzle ORM 0.44.0 - Database ORM

**Client:**
- React 19.1.0 - UI framework
- React Router DOM 7.6.0 - Client-side routing

**Testing:**
- Vitest 3.1.0 - Test runner for both server and client

**Build:**
- Vite 6.3.0 - Client bundler
- Drizzle Kit 0.31.0 - Database migrations
- TypeScript 5.8.0 - Type checking and compilation

## Key Dependencies

**Server Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| elysia | 1.4.0 | Web framework |
| lucia | 3.2.2 | Authentication |
| drizzle-orm | 0.44.0 | Database ORM |
| mysql2 | 3.14.0 | MySQL driver |
| ioredis | 5.6.0 | Redis client |
| zod | 3.24.0 | Input validation |
| pino | 9.7.0 | Logging |
| @elysiajs/cors | 1.4.0 | CORS handling |
| @elysiajs/jwt | 1.4.0 | JWT support |
| @lucia-auth/adapter-mysql | 3.0.2 | Auth adapter |
| @node-rs/argon2 | 2.0.2 | Password hashing |
| oslo | 1.2.1 | Crypto utilities |

**Client Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.0 | UI library |
| react-dom | 19.1.0 | React DOM |
| react-router-dom | 7.6.0 | Routing |
| @tanstack/react-query | 5.76.0 | Data fetching |
| @mui/material | 7.1.0 | UI components |
| @mui/icons-material | 7.1.0 | Material icons |
| @mui/x-charts | 8.5.0 | Charts |
| @mui/x-data-grid | 8.5.0 | Data tables |
| @emotion/react | 11.14.0 | CSS-in-JS |
| @emotion/styled | 11.14.0 | Styled components |

**Dev Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.8.0 | Type checking |
| vitest | 3.1.0 | Testing |
| drizzle-kit | 0.31.0 | DB migrations |
| vite | 6.3.0 | Build tool |
| bun-types | 1.2.0 | Bun types |

## Configuration Files

**Server:**
- `server/tsconfig.json` - TypeScript config for server
- `server/drizzle.config.ts` - Drizzle migration config
- `server/vitest.config.ts` - Test configuration

**Client:**
- `client/tsconfig.json` - TypeScript config for client
- `client/vite.config.ts` - Vite bundler config
- `client/vitest.config.ts` - Test configuration

**Root:**
- `package.json` - Workspace scripts for running both apps

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - MySQL connection string
- `REDIS_URL` - Redis connection string
- `CORS_ORIGIN` - Allowed origins for CORS
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Platform Requirements

**Development:**
- Bun runtime installed
- MySQL server running
- Redis server running

**Production:**
- Bun runtime
- MySQL database
- Redis for session caching

---

*Stack analysis: 2026-04-17*